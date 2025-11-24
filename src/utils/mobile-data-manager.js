/**
 * 手机数据管理器
 * 负责收集手机中的健康数据、日历事件、传感器数据等，并上传到服务器
 */

import api from '../services/api-clients/client';
import { API_ENDPOINTS } from '../services/api/api';
import calendarManager from './calendar-manager';
import deviceInfoManager from './device-info-manager';
import healthDataManager, { TimePeriod } from './health-data-manager';
import locationManager from './location-manager';
import storageManager from './storage';

class MobileDataManager {
  constructor() {
    this.isCollecting = false;
    this.collectStartTime = null;
    this.COLLECT_TIMEOUT = 5 * 60 * 1000; // 5分钟超时
  }

  /**
   * 收集所有手机数据
   * @param {Object} options - 配置选项
   * @param {string|Object} options.period - 时间周期，默认为今天
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async collectAllData(options = {}) {
    // 检查是否正在收集
    if (this.isCollecting) {
      // 如果收集时间超过超时时间，强制重置（可能是之前的收集卡住了）
      if (this.collectStartTime && Date.now() - this.collectStartTime > this.COLLECT_TIMEOUT) {
        console.warn('[MobileDataManager] ⚠️ 数据收集超时，强制重置状态');
        this.isCollecting = false;
        this.collectStartTime = null;
      } else {
        const elapsed = this.collectStartTime ? Math.round((Date.now() - this.collectStartTime) / 1000) : 0;
        console.log(`[MobileDataManager] ⚠️ 数据收集中，请稍候... (已用时: ${elapsed}秒)`);
        return {
          success: false,
          error: '数据收集中，请稍候',
        };
      }
    }

    this.isCollecting = true;
    this.collectStartTime = Date.now();
    console.log('[MobileDataManager] 📱 开始收集手机数据...');

    try {
      const period = options.period || TimePeriod.TODAY;
      const { startDate, endDate } = healthDataManager.getDateRange(period);

      // 先确保 HealthKit 已初始化
      console.log('[MobileDataManager] 🔐 检查 HealthKit 初始化状态...');
      const isHealthKitAvailable = await Promise.race([
        healthDataManager.isAvailable(),
        new Promise((resolve) => {
          setTimeout(() => {
            console.warn('[MobileDataManager] ⚠️ HealthKit 可用性检查超时（5秒）');
            resolve(false);
          }, 5000);
        }),
      ]);

      if (!isHealthKitAvailable) {
        console.warn('[MobileDataManager] ⚠️ HealthKit 不可用，所有健康数据将返回空数组');
        // 如果 HealthKit 不可用，直接返回空数据，不等待超时
        const userData = await storageManager.getUserData();
        const uid = userData?.uid || null;
        if (!uid) {
          this.isCollecting = false;
          this.collectStartTime = null;
          return {
            success: false,
            error: '未找到用户ID',
          };
        }
        
        // 返回空数据，但包含非健康数据（日历、陀螺仪、位置）
        const dayStart = new Date(startDate);
        dayStart.setHours(0, 0, 0, 0);
        const now = new Date(endDate);
        
        const emptyHealthData = {
          timestamp: Date.now().toString(),
          startDate: dayStart.getTime().toString(),
          endDate: now.getTime().toString(),
          step_count: 0,
          basal_energy_burned: 0,
          active_energy_burned: 0,
          activity_summary: [],
          flights_climbed: 0,
          distance_walking_running: 0,
          heart_rate: 0,
          resting_heart_rate: 0,
          heart_rate_variability: 0,
          walking_heart_rate_average: 0,
          energy_consumed: 0,
          protein: 0,
          carbohydrates: 0,
          sugar: 0,
          water: 0,
          sleep_analysis: [],
          mindful_session: [],
        };

        // 仍然尝试获取非健康数据
        const [calendarResult, gyroscopeResult, locationResult] = await Promise.allSettled([
          withTimeout(this._getCalendarEvents(startDate, endDate), 30000, '日历'),
          withTimeout(this._getGyroscopeData(), 10000, '陀螺仪'),
          withTimeout(this._getLocationData(), 20000, '位置'),
        ]);

        const nonAggregatedData = this._extractNonAggregatedData({
          calendarEvents: calendarResult.status === 'fulfilled' ? (calendarResult.value?.data || []) : [],
          gyroscope: gyroscopeResult.status === 'fulfilled' ? (gyroscopeResult.value?.data || null) : null,
          location: locationResult.status === 'fulfilled' ? (locationResult.value?.data || null) : null,
        });

        const record = { ...emptyHealthData };
        if (nonAggregatedData.calendar_events?.length > 0) {
          record.calendar_events = nonAggregatedData.calendar_events;
        }
        if (nonAggregatedData.gyroscope) {
          record.gyroscope = nonAggregatedData.gyroscope;
        }
        if (nonAggregatedData.location) {
          record.location = nonAggregatedData.location;
        }

        this.isCollecting = false;
        this.collectStartTime = null;
        return {
          success: true,
          data: {
            uid,
            data: [record],
          },
        };
      } else {
        console.log('[MobileDataManager] ✅ HealthKit 可用');
      }

      // 获取用户ID
      const userData = await storageManager.getUserData();
      const uid = userData?.uid || null;

      if (!uid) {
        console.log('[MobileDataManager] ⚠️ 未找到用户ID，无法上传数据');
        this.isCollecting = false;
        this.collectStartTime = null;
        return {
          success: false,
          error: '未找到用户ID',
        };
      }

      // 为每个数据收集方法添加超时保护（30秒）
      const withTimeout = (promise, timeoutMs = 30 * 1000, methodName = 'unknown') => {
        return Promise.race([
          promise,
          new Promise((_, reject) => {
            setTimeout(() => {
              console.warn(`[MobileDataManager] ⚠️ ${methodName} 超时（${timeoutMs / 1000}秒）`);
              reject(new Error(`${methodName} 超时`));
            }, timeoutMs);
          }),
        ]).catch(error => {
          // 超时或错误时返回空数据，不阻塞其他数据收集
          console.warn(`[MobileDataManager] ⚠️ ${methodName} 失败:`, error.message);
          return { success: true, data: [] };
        });
      };

      // 并行收集所有数据，使用 Promise.allSettled 确保单个失败不阻塞整体
      // 每个方法都有独立的超时保护
      const [
        stepCountResult,
        heartRateResult,
        restingHeartRateResult,
        heartRateVariabilityResult,
        walkingHeartRateResult,
        activeEnergyResult,
        basalEnergyResult,
        activitySummaryResult,
        flightsClimbedResult,
        distanceResult,
        sleepResult,
        mindfulSessionResult,
        energyConsumedResult,
        proteinResult,
        carbohydratesResult,
        sugarResult,
        waterResult,
        calendarResult,
        gyroscopeResult,
        locationResult,
      ] = await Promise.all([
        this._getStepCount(startDate, endDate),
        this._getHeartRate(startDate, endDate),
        this._getRestingHeartRate(startDate, endDate),
        this._getHeartRateVariability(startDate, endDate),
        this._getWalkingHeartRate(startDate, endDate),
        this._getActiveEnergy(startDate, endDate),
        this._getBasalEnergy(startDate, endDate),
        this._getActivitySummary(startDate, endDate),
        this._getFlightsClimbed(startDate, endDate),
        this._getDistance(startDate, endDate),
        this._getSleepAnalysis(startDate, endDate),
        this._getMindfulSession(startDate, endDate),
        this._getEnergyConsumed(startDate, endDate),
        this._getProtein(startDate, endDate),
        this._getCarbohydrates(startDate, endDate),
        this._getSugar(startDate, endDate),
        this._getWater(startDate, endDate),
        withTimeout(this._getCalendarEvents(startDate, endDate), 30000, '日历'),
        withTimeout(this._getGyroscopeData(), 10000, '陀螺仪'), // 陀螺仪数据较快，10秒超时
        withTimeout(this._getLocationData(), 20000, '位置'), // 位置数据，20秒超时
      ]);

      // 汇总健康数据获取情况
      console.group('[MobileDataManager] 📊 健康数据获取汇总');
      console.log('步数:', stepCountResult.success ? `✅ ${Array.isArray(stepCountResult.data) ? stepCountResult.data.length : 0} 条` : `❌ ${stepCountResult.error || '失败'}`);
      console.log('心率:', heartRateResult.success ? `✅ ${Array.isArray(heartRateResult.data) ? heartRateResult.data.length : 0} 条` : `❌ ${heartRateResult.error || '失败'}`);
      console.log('静息心率:', restingHeartRateResult.success ? `✅ ${Array.isArray(restingHeartRateResult.data) ? restingHeartRateResult.data.length : 0} 条` : `❌ ${restingHeartRateResult.error || '失败'}`);
      console.log('心率变异性:', heartRateVariabilityResult.success ? `✅ ${Array.isArray(heartRateVariabilityResult.data) ? heartRateVariabilityResult.data.length : 0} 条` : `❌ ${heartRateVariabilityResult.error || '失败'}`);
      console.log('步行心率:', walkingHeartRateResult.success ? `✅ ${Array.isArray(walkingHeartRateResult.data) ? walkingHeartRateResult.data.length : 0} 条` : `❌ ${walkingHeartRateResult.error || '失败'}`);
      console.log('活动能量:', activeEnergyResult.success ? `✅ ${Array.isArray(activeEnergyResult.data) ? activeEnergyResult.data.length : 0} 条` : `❌ ${activeEnergyResult.error || '失败'}`);
      console.log('基础能量:', basalEnergyResult.success ? `✅ ${Array.isArray(basalEnergyResult.data) ? basalEnergyResult.data.length : 0} 条` : `❌ ${basalEnergyResult.error || '失败'}`);
      console.log('活动摘要:', activitySummaryResult.success ? `✅ ${Array.isArray(activitySummaryResult.data) ? activitySummaryResult.data.length : 0} 条` : `❌ ${activitySummaryResult.error || '失败'}`);
      console.log('楼层:', flightsClimbedResult.success ? `✅ ${Array.isArray(flightsClimbedResult.data) ? flightsClimbedResult.data.length : 0} 条` : `❌ ${flightsClimbedResult.error || '失败'}`);
      console.log('距离:', distanceResult.success ? `✅ ${Array.isArray(distanceResult.data) ? distanceResult.data.length : 0} 条` : `❌ ${distanceResult.error || '失败'}`);
      console.log('睡眠:', sleepResult.success ? `✅ ${Array.isArray(sleepResult.data) ? sleepResult.data.length : 0} 条` : `❌ ${sleepResult.error || '失败'}`);
      console.log('正念:', mindfulSessionResult.success ? `✅ ${Array.isArray(mindfulSessionResult.data) ? mindfulSessionResult.data.length : 0} 条` : `❌ ${mindfulSessionResult.error || '失败'}`);
      console.log('能量消耗:', energyConsumedResult.success ? `✅ ${Array.isArray(energyConsumedResult.data) ? energyConsumedResult.data.length : 0} 条` : `❌ ${energyConsumedResult.error || '失败'}`);
      console.log('蛋白质:', proteinResult.success ? `✅ ${Array.isArray(proteinResult.data) ? proteinResult.data.length : 0} 条` : `❌ ${proteinResult.error || '失败'}`);
      console.log('碳水化合物:', carbohydratesResult.success ? `✅ ${Array.isArray(carbohydratesResult.data) ? carbohydratesResult.data.length : 0} 条` : `❌ ${carbohydratesResult.error || '失败'}`);
      console.log('糖分:', sugarResult.success ? `✅ ${Array.isArray(sugarResult.data) ? sugarResult.data.length : 0} 条` : `❌ ${sugarResult.error || '失败'}`);
      console.log('水分:', waterResult.success ? `✅ ${Array.isArray(waterResult.data) ? waterResult.data.length : 0} 条` : `❌ ${waterResult.error || '失败'}`);
      console.log('日历:', calendarResult.success ? `✅ ${Array.isArray(calendarResult.data) ? calendarResult.data.length : 0} 条` : `❌ ${calendarResult.error || '失败'}`);
      console.log('陀螺仪:', gyroscopeResult.success ? (gyroscopeResult.data ? '✅ 有数据' : 'ℹ️ 无数据') : `❌ ${gyroscopeResult.error || '失败'}`);
      console.log('位置:', locationResult.success ? (locationResult.data ? '✅ 有数据' : 'ℹ️ 无数据') : `❌ ${locationResult.error || '失败'}`);
      console.groupEnd();

      // 提取不需要聚合的数据（在格式化之前处理）
      const nonAggregatedData = this._extractNonAggregatedData({
        calendarEvents: calendarResult.data || [],
        gyroscope: gyroscopeResult.data || null,
        location: locationResult.data || null,
      });
      let timestamp = Date.now().toString();

      // 格式化需要聚合的健康数据，并传入已处理的非聚合数据
      const formattedData = this._formatData({
        timestamp,
        startDate,
        endDate,
        stepCount: stepCountResult.data || [],
        heartRate: heartRateResult.data || [],
        restingHeartRate: restingHeartRateResult.data || [],
        heartRateVariability: heartRateVariabilityResult.data || [],
        walkingHeartRate: walkingHeartRateResult.data || [],
        activeEnergy: activeEnergyResult.data || [],
        basalEnergy: basalEnergyResult.data || [],
        activitySummary: activitySummaryResult.data || [],
        flightsClimbed: flightsClimbedResult.data || [],
        distance: distanceResult.data || [],
        sleep: sleepResult.data || [],
        mindfulSession: mindfulSessionResult.data || [],
        energyConsumed: energyConsumedResult.data || [],
        protein: proteinResult.data || [],
        carbohydrates: carbohydratesResult.data || [],
        sugar: sugarResult.data || [],
        water: waterResult.data || [],
        // 使用已处理的非聚合数据
        calendar_events: nonAggregatedData.calendar_events || [],
        gyroscope: nonAggregatedData.gyroscope || null,
        location: nonAggregatedData.location || null,
      });
      console.log('[MobileDataManager] 📱 收集手机数据完成，内容是', JSON.stringify(formattedData));
      
      // 在外部构建最终数据结构：将聚合的健康数据和非聚合的数据组合
      const result = {
        uid,
        data: formattedData
      };

      const elapsed = Math.round((Date.now() - this.collectStartTime) / 1000);
      console.log(`[MobileDataManager] ✅ 数据收集完成，结果是`, result, `(用时: ${elapsed}秒)`);
      this.isCollecting = false;
      this.collectStartTime = null;

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const elapsed = this.collectStartTime ? Math.round((Date.now() - this.collectStartTime) / 1000) : 0;
      console.error(`[MobileDataManager] ❌ 数据收集失败 (用时: ${elapsed}秒):`, error);
      this.isCollecting = false;
      this.collectStartTime = null;
      return {
        success: false,
        error: error.message || '数据收集失败',
      };
    }
  }

  /**
   * 上传手机数据到服务器
   * @param {Object} options - 配置选项
   * @param {string|Object} options.period - 时间周期，默认为今天
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async uploadData(options = {}) {
    // 如果正在收集数据，跳过本次上传
    if (this.isCollecting) {
      const elapsed = this.collectStartTime ? Math.round((Date.now() - this.collectStartTime) / 1000) : 0;
      console.log(`[MobileDataManager] ⏭️ 跳过上传，数据收集中... (已用时: ${elapsed}秒)`);
      return {
        success: false,
        error: '数据收集中，跳过本次上传',
      };
    }

    console.log('[MobileDataManager] 📤 开始上传手机数据...');

    try {
      // 收集数据
      const collectResult = await this.collectAllData(options);
      
      if (!collectResult.success) {
        console.log('[MobileDataManager] ❌ 数据收集失败，结果是', collectResult);
        return collectResult;
      }

      console.log('[MobileDataManager] 📱 数据收集成功，结果是', collectResult);

      const dataToUpload = collectResult.data;

      // 上传到服务器
      const response = await api.post(
        API_ENDPOINTS.LIFE_HISTORY.SAVE,
        dataToUpload,
        {
          requireAuth: true,
        }
      );

      console.log('[MobileDataManager] ✅ 数据上传成功');
      return {
        success: true,
      };
    } catch (error) {
      console.error('[MobileDataManager] ❌ 数据上传失败:', error);
      return {
        success: false,
        error: error.message || '数据上传失败',
      };
    }
  }

  /**
   * 格式化数据为所需结构（聚合为今天累计到当前时间的最终数据）
   * @private
   */
  _formatData(rawData) {
    const { startDate, endDate } = rawData;

    // 设置时间边界（今天开始到当前时间）
    const dayStart = new Date(startDate);
    dayStart.setHours(0, 0, 0, 0);
    const now = new Date(endDate);

    const timestamp = Date.now().toString();
    const startDateStr = dayStart.getTime().toString();
    const endDateStr = now.getTime().toString();
    console.log('原始数据 rawData', rawData);
    // 聚合所有健康数据（累计值）
    const stepCount = this._sumStepCount(this._ensureArray(rawData.stepCount));
    console.log('fetched stepCount', stepCount);
    const activeEnergyBurned = this._sumValues(this._ensureArray(rawData.activeEnergy));
    console.log('fetched activeEnergyBurned', activeEnergyBurned);
    const basalEnergyBurned = this._sumValues(this._ensureArray(rawData.basalEnergy));
    console.log('fetched basalEnergyBurned', basalEnergyBurned);
    const flightsClimbed = this._sumValues(this._ensureArray(rawData.flightsClimbed));
    const distanceWalkingRunning = this._sumValues(this._ensureArray(rawData.distance));

    // 心率相关（取平均值）
    const heartRate = this._getAverageValue(this._ensureArray(rawData.heartRate));
    const restingHeartRate = this._getAverageValue(this._ensureArray(rawData.restingHeartRate));
    const heartRateVariability = this._getAverageValue(this._ensureArray(rawData.heartRateVariability));
    const walkingHeartRateAverage = this._getAverageValue(this._ensureArray(rawData.walkingHeartRate));

    // 营养数据（累计值）
    const energyConsumed = this._sumValues(this._ensureArray(rawData.energyConsumed));
    const protein = this._sumValues(this._ensureArray(rawData.protein));
    const carbohydrates = this._sumValues(this._ensureArray(rawData.carbohydrates));
    const sugar = this._sumValues(this._ensureArray(rawData.sugar));
    const water = this._sumValues(this._ensureArray(rawData.water));

    // 活动摘要（保留所有记录）
    const activitySummary = this._ensureArray(rawData.activitySummary);

    // 睡眠分析（保留所有记录）
    const sleepAnalysis = this._ensureArray(rawData.sleep);

    // 正念会话（保留所有记录）
    const mindfulSession = this._ensureArray(rawData.mindfulSession);

    // 从 nonAggregatedData 中获取已处理的日历、陀螺仪和位置数据
    const calendar_events = rawData.calendar_events || [];
    const gyroscope = rawData.gyroscope || null;
    const location = rawData.location || null;

    // 构建单条累计数据记录
    const record = {
      timestamp,
      step_count: Math.round(stepCount),
      startDate: startDateStr,
      endDate: endDateStr,
      basal_energy_burned: Math.round(basalEnergyBurned),
      active_energy_burned: Math.round(activeEnergyBurned),
      activity_summary: activitySummary.map(item => ({
        date: item.startDate || item.date,
        activeEnergyBurned: item.activeEnergyBurned || item.activeEnergy || 0,
        activeEnergyBurnedGoal: item.activeEnergyBurnedGoal || 0,
        appleExerciseTime: item.exerciseTime || 0,
        appleExerciseTimeGoal: item.exerciseTimeGoal || 0,
        appleStandHours: item.standHours || 0,
        appleStandHoursGoal: item.standHoursGoal || 0,
      })),
      flights_climbed: Math.round(flightsClimbed),
      distance_walking_running: Math.round(distanceWalkingRunning),
      heart_rate: Math.round(heartRate),
      resting_heart_rate: Math.round(restingHeartRate),
      heart_rate_variability: Math.round(heartRateVariability),
      walking_heart_rate_average: Math.round(walkingHeartRateAverage),
      energy_consumed: Math.round(energyConsumed),
      protein: Math.round(protein),
      carbohydrates: Math.round(carbohydrates),
      sugar: Math.round(sugar),
      water: Math.round(water),
      sleep_analysis: sleepAnalysis.map(item => ({
        startDate: item.startDate,
        endDate: item.endDate,
        value: item.value || item.categoryValue || 0,
        category: item.category || item.categoryValue,
      })),
      mindful_session: mindfulSession.map(item => ({
        startDate: item.startDate,
        endDate: item.endDate,
        value: item.value || 0,
      })),
    };

    // 添加非聚合数据（如果存在）
    if (calendar_events.length > 0) {
      record.calendar_events = calendar_events;
    }
    if (gyroscope) {
      record.gyroscope = gyroscope;
    }
    if (location) {
      record.location = location;
    }

    return [record];
  }

  /**
   * 提取不需要聚合的数据
   * @private
   */
  _extractNonAggregatedData(rawData) {
    const result = {};

    // 位置数据
    if (rawData.location) {
      result.location = rawData.location;
    }

    // 陀螺仪数据
    if (rawData.gyroscope) {
      const gyroscope = rawData.gyroscope;
      if (typeof gyroscope === 'object' && gyroscope !== null) {
        // 如果数据已经包含 rotation_rate_degrees，直接使用
        if (gyroscope.rotation_rate_degrees) {
          result.gyroscope = {
            x: gyroscope.x || 0,
            y: gyroscope.y || 0,
            z: gyroscope.z || 0,
            rotation_rate_degrees: {
              x: gyroscope.rotation_rate_degrees.x || 0,
              y: gyroscope.rotation_rate_degrees.y || 0,
              z: gyroscope.rotation_rate_degrees.z || 0,
            },
            is_rotating: gyroscope.is_rotating !== undefined ? gyroscope.is_rotating : false,
            timestamp: String(gyroscope.timestamp || Date.now()),
          };
        } else {
          // 如果没有 rotation_rate_degrees，从原始 xyz 计算
          const rotationRate = deviceInfoManager.getRotationRate(gyroscope);
          const isRotating = deviceInfoManager.isDeviceRotating(gyroscope, 0.1);
          
          result.gyroscope = {
            x: gyroscope.x || 0,
            y: gyroscope.y || 0,
            z: gyroscope.z || 0,
            rotation_rate_degrees: rotationRate ? {
              x: rotationRate.x || 0,
              y: rotationRate.y || 0,
              z: rotationRate.z || 0,
              timestamp: rotationRate.timestamp || gyroscope.timestamp || null,
            } : null,
            is_rotating: isRotating,
            timestamp: String(gyroscope.timestamp || Date.now()),
          };
        }
      }
    }

    // 日历事件
    const calendarEvents = this._ensureArray(rawData.calendarEvents);
    if (calendarEvents.length > 0) {
      result.calendar_events = calendarEvents.map(item => ({
        id: item.id,
        title: item.title,
        startDate: item.startDate,
        endDate: item.endDate,
        allDay: item.allDay || false,
        location: item.location || '',
        notes: item.notes || '',
      }));
    }

    // 睡眠分析和正念会话已移到健康数据中，不再作为非聚合数据

    return result;
  }

  /**
   * 确保值为数组
   * @private
   */
  _ensureArray(value) {
    if (Array.isArray(value)) {
      return value;
    }
    if (value === null || value === undefined) {
      return [];
    }
    // 如果是对象，尝试转换为数组
    if (typeof value === 'object') {
      return [value];
    }
    return [];
  }

  /**
   * 按小时分组数据
   * @private
   */
  _groupDataByHour(rawData) {
    const grouped = {};

    // 分组步数
    this._ensureArray(rawData.stepCount).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].stepCount) grouped[hourKey].stepCount = [];
      grouped[hourKey].stepCount.push(item.value || 0);
    });

    // 分组心率
    this._ensureArray(rawData.heartRate).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].heartRate) grouped[hourKey].heartRate = [];
      grouped[hourKey].heartRate.push(item.value || 0);
    });

    // 分组静息心率
    this._ensureArray(rawData.restingHeartRate).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].restingHeartRate) grouped[hourKey].restingHeartRate = [];
      grouped[hourKey].restingHeartRate.push(item.value || 0);
    });

    // 分组心率变异性
    this._ensureArray(rawData.heartRateVariability).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].heartRateVariability) grouped[hourKey].heartRateVariability = [];
      grouped[hourKey].heartRateVariability.push(item.value || 0);
    });

    // 分组步行心率
    this._ensureArray(rawData.walkingHeartRate).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].walkingHeartRate) grouped[hourKey].walkingHeartRate = [];
      grouped[hourKey].walkingHeartRate.push(item.value || 0);
    });

    // 分组活动能量
    this._ensureArray(rawData.activeEnergy).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].activeEnergy) grouped[hourKey].activeEnergy = [];
      grouped[hourKey].activeEnergy.push(item.value || item.kilocalories || 0);
    });

    // 分组基础能量
    this._ensureArray(rawData.basalEnergy).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].basalEnergy) grouped[hourKey].basalEnergy = [];
      grouped[hourKey].basalEnergy.push(item.value || item.kilocalories || 0);
    });

    // 分组活动摘要
    this._ensureArray(rawData.activitySummary).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.dateComponents || item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].activitySummary) grouped[hourKey].activitySummary = [];
      grouped[hourKey].activitySummary.push(item);
    });

    // 分组楼层
    this._ensureArray(rawData.flightsClimbed).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].flightsClimbed) grouped[hourKey].flightsClimbed = [];
      grouped[hourKey].flightsClimbed.push(item.value || 0);
    });

    // 分组距离
    this._ensureArray(rawData.distance).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].distance) grouped[hourKey].distance = [];
      grouped[hourKey].distance.push(item.value || 0);
    });

    // 睡眠数据不需要按小时分组，保留原始数据
    // 正念会话不需要按小时分组，保留原始数据

    // 分组营养数据
    this._ensureArray(rawData.energyConsumed).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].energyConsumed) grouped[hourKey].energyConsumed = [];
      grouped[hourKey].energyConsumed.push(item.value || 0);
    });

    this._ensureArray(rawData.protein).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].protein) grouped[hourKey].protein = [];
      grouped[hourKey].protein.push(item.value || 0);
    });

    this._ensureArray(rawData.carbohydrates).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].carbohydrates) grouped[hourKey].carbohydrates = [];
      grouped[hourKey].carbohydrates.push(item.value || 0);
    });

    this._ensureArray(rawData.sugar).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].sugar) grouped[hourKey].sugar = [];
      grouped[hourKey].sugar.push(item.value || 0);
    });

    this._ensureArray(rawData.water).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].water) grouped[hourKey].water = [];
      grouped[hourKey].water.push(item.value || 0);
    });

    // 日历事件不需要按小时分组，保留原始数据
    // 陀螺仪数据不需要按小时分组，保留原始数据
    // 位置数据不需要按小时分组，保留原始数据

    return grouped;
  }

  /**
   * 获取小时键
   * @private
   */
  _getHourKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
  }

  /**
   * 过滤指定小时的数据
   * @private
   */
  _filterByHour(items, date) {
    const hourStart = new Date(date);
    hourStart.setMinutes(0, 0, 0);
    const hourEnd = new Date(hourStart);
    hourEnd.setHours(hourEnd.getHours() + 1);

    return items.filter(item => {
      const itemDate = new Date(item.startDate || item.date);
      return itemDate >= hourStart && itemDate < hourEnd;
    });
  }

  /**
   * 步数求和
   * @private
   */
  _sumStepCount(stepCount) {
    return stepCount.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  } 
  /**
   * 求和
   * @private
   */
  _sumValues(values) {
    if (!Array.isArray(values)) return 0;
    return values.reduce((sum, val) => sum + (Number(val) || 0), 0);
  }

  /**
   * 求平均值
   * @private
   */
  _getAverageValue(values) {
    if (!Array.isArray(values) || values.length === 0) return 0;
    const sum = this._sumValues(values);
    return sum / values.length;
  }

  /**
   * 为健康数据获取方法添加超时保护的辅助函数
   * @private
   */
  _withHealthKitTimeout(promise, methodName, timeoutMs = 25000) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${methodName} 超时：AppleHealthKit 回调未触发`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).catch(error => {
      console.warn(`[MobileDataManager] ⚠️ ${methodName} 超时或失败:`, error.message || error);
      return { success: true, data: [] };
    });
  }

  // 私有方法：获取各种健康数据
  async _getStepCount(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getStepCount({ startDate, endDate }),
        '获取步数'
      );
      
      // 如果权限被拒绝，返回空数据而不是错误
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 步数权限被拒绝，返回空数据');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取步数失败:', result.error || '未知错误', result);
        }
        return { success: true, data: [] };
      }
      console.log('[MobileDataManager] ✅ 获取步数成功，数据量:', Array.isArray(result.data) ? result.data.length : 0);
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取步数异常:', error.message || error);
      return { success: true, data: [] };
    }
  }

  async _getHeartRate(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getHeartRate({ startDate, endDate }),
        '获取心率'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 心率权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取心率失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取心率异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getRestingHeartRate(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getRestingHeartRate({ startDate, endDate }),
        '获取静息心率'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 静息心率权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取静息心率失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取静息心率异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getHeartRateVariability(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getHeartRateVariability({ startDate, endDate }),
        '获取心率变异性'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 心率变异性权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取心率变异性失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取心率变异性异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getWalkingHeartRate(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getWalkingHeartRateAverage({ startDate, endDate }),
        '获取步行心率'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 步行心率权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取步行心率失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取步行心率异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getActiveEnergy(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getActiveEnergyBurned({ startDate, endDate }),
        '获取活动能量'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 活动能量权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取活动能量失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取活动能量异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getBasalEnergy(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getBasalEnergyBurned({ startDate, endDate }),
        '获取基础能量'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 基础能量权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取基础能量失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取基础能量异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getActivitySummary(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getActivitySummary({ startDate, endDate }),
        '获取活动摘要'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 活动摘要权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取活动摘要失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取活动摘要异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getFlightsClimbed(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getFlightsClimbed({ startDate, endDate }),
        '获取楼层'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 楼层权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取楼层失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取楼层异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getDistance(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getDistanceWalkingRunning({ startDate, endDate }),
        '获取距离'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 距离权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取距离失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取距离异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getSleepAnalysis(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getSleepAnalysis({ startDate, endDate }),
        '获取睡眠分析'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 睡眠分析权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取睡眠分析失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取睡眠分析异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getMindfulSession(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getMindfulSession({ startDate, endDate }),
        '获取正念会话'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 正念会话权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取正念会话失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取正念会话异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getEnergyConsumed(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getEnergyConsumed({ startDate, endDate }),
        '获取能量消耗'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 能量消耗权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取能量消耗失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取能量消耗异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getProtein(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getProtein({ startDate, endDate }),
        '获取蛋白质'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 蛋白质权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取蛋白质失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取蛋白质异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getCarbohydrates(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getCarbohydrates({ startDate, endDate }),
        '获取碳水化合物'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 碳水化合物权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取碳水化合物失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取碳水化合物异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getSugar(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getSugar({ startDate, endDate }),
        '获取糖分'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 糖分权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取糖分失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取糖分异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getWater(startDate, endDate) {
    try {
      const result = await this._withHealthKitTimeout(
        healthDataManager.getWater({ startDate, endDate }),
        '获取水分'
      );
      if (!result.success) {
        if (result.denied) {
          console.log('[MobileDataManager] ℹ️ 水分权限被拒绝');
        } else {
          console.warn('[MobileDataManager] ⚠️ 获取水分失败:', result.error || '未知错误');
        }
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取水分异常:', error);
      return { success: true, data: [] };
    }
  }

  async _getCalendarEvents(startDate, endDate) {
    try {
      // 检查日历权限
      const permissionResult = await calendarManager.checkPermission();
      if (!permissionResult.granted) {
        await calendarManager.requestPermission();
      }

      const result = await calendarManager.getEventsInRange({
        startDate,
        endDate,
      });
      console.log('[MobileDataManager] 📱 获取日历事件成功，结果是', result);

      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取日历事件失败:', error);
      return { success: false, data: [] };
    }
  }

  async _getGyroscopeData() {
    try {
      // 初始化设备信息管理器
      await deviceInfoManager.initialize();

      // 检查陀螺仪是否可用
      const availability = deviceInfoManager.getSensorAvailability();
      if (!availability.gyroscope) {
        console.log('[MobileDataManager] ℹ️ 陀螺仪不可用');
        return { success: true, data: null };
      }

      // 订阅陀螺仪数据并等待数据更新
      return new Promise((resolve) => {
        let dataReceived = false;
        let timeoutId = null;

        // 设置超时（2秒）
        timeoutId = setTimeout(() => {
          if (!dataReceived) {
            console.warn('[MobileDataManager] ⚠️ 陀螺仪数据获取超时');
            deviceInfoManager.unsubscribeFromGyroscope();
            resolve({ success: true, data: null });
          }
        }, 2000);

        // 订阅陀螺仪，等待第一个数据点
        const subscribeResult = deviceInfoManager.subscribeToGyroscope((data) => {
          if (!dataReceived) {
            dataReceived = true;
            clearTimeout(timeoutId);
            
            // 获取数据后立即取消订阅
            setTimeout(() => {
              deviceInfoManager.unsubscribeFromGyroscope();
            }, 100);

            // 计算 rotation_rate_degrees（弧度转度）
            const rotationRate = deviceInfoManager.getRotationRate(data);
            // 检测是否在旋转
            const isRotating = deviceInfoManager.isDeviceRotating(data, 0.1);

            // 构建完整的陀螺仪数据对象
            const gyroscopeData = {
              x: data.x || 0,
              y: data.y || 0,
              z: data.z || 0,
              rotation_rate_degrees: rotationRate ? {
                x: rotationRate.x || 0,
                y: rotationRate.y || 0,
                z: rotationRate.z || 0,
                timestamp: rotationRate.timestamp || data.timestamp || null,
              } : null,
              is_rotating: isRotating,
              timestamp: String(data.timestamp || Date.now()),
            };

            console.log('[MobileDataManager] 📱 获取陀螺仪数据成功，结果是', gyroscopeData);
            resolve({
              success: true,
              data: gyroscopeData,
            });
          }
        }, 100); // 100ms 更新间隔

        // 如果订阅失败
        if (!subscribeResult.success) {
          clearTimeout(timeoutId);
          console.warn('[MobileDataManager] ⚠️ 陀螺仪订阅失败:', subscribeResult.error);
          resolve({ success: true, data: null });
        }
      });
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取陀螺仪数据失败:', error);
      // 确保取消订阅
      try {
        deviceInfoManager.unsubscribeFromGyroscope();
      } catch (e) {
        // 忽略取消订阅的错误
      }
      return { success: true, data: null };
    }
  }

  async _getLocationData() {
    try {
      // 获取当前位置（包含地址信息）
      const locationResult = await locationManager.getCurrentLocation({
        includeAddress: true,
        timeout: 15000, // 15秒超时
        maximumAge: 60000, // 允许使用1分钟内的缓存位置
      });

      if (locationResult.success && locationResult.data) {
        // 格式化位置数据
        const locationData = {
          latitude: locationResult.data.latitude,
          longitude: locationResult.data.longitude,
          accuracy: locationResult.data.accuracy,
          altitude: locationResult.data.altitude || null,
          altitudeAccuracy: locationResult.data.altitudeAccuracy || null,
          speed: locationResult.data.speed || null,
          heading: locationResult.data.heading || null,
          timestamp: String(locationResult.data.rawTimestamp || Date.now()),
          address: locationResult.data.address || null,
        };

        return {
          success: true,
          data: locationData,
        };
      } else {
        console.log('[MobileDataManager] ℹ️ 位置数据获取失败或权限被拒绝');
        return { success: true, data: null };
      }
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取位置数据失败:', error);
      return { success: true, data: null };
    }
  }
}

// 导出单例实例
const mobileDataManager = new MobileDataManager();
export default mobileDataManager;

