/**
 * 手机数据管理器
 * 负责收集手机中的健康数据、日历事件、传感器数据等，并上传到服务器
 */

import api from '../services/api-clients/client';
import { API_ENDPOINTS } from '../services/api/api';
import calendarManager from './calendar-manager';
import deviceInfoManager, { SensorType } from './device-info-manager';
import healthDataManager, { TimePeriod } from './health-data-manager';
import storageManager from './storage';

class MobileDataManager {
  constructor() {
    this.isCollecting = false;
  }

  /**
   * 收集所有手机数据
   * @param {Object} options - 配置选项
   * @param {string|Object} options.period - 时间周期，默认为今天
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async collectAllData(options = {}) {
    if (this.isCollecting) {
      console.log('[MobileDataManager] ⚠️ 数据收集中，请稍候...');
      return {
        success: false,
        error: '数据收集中，请稍候',
      };
    }

    this.isCollecting = true;
    console.log('[MobileDataManager] 📱 开始收集手机数据...');

    try {
      const period = options.period || TimePeriod.TODAY;
      const { startDate, endDate } = healthDataManager.getDateRange(period);

      // 获取用户ID
      const userData = await storageManager.getUserData();
      const uid = userData?.uid || null;

      if (!uid) {
        console.log('[MobileDataManager] ⚠️ 未找到用户ID，无法上传数据');
        this.isCollecting = false;
        return {
          success: false,
          error: '未找到用户ID',
        };
      }

      // 并行收集所有数据
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
        this._getCalendarEvents(startDate, endDate),
        this._getGyroscopeData(),
      ]);

      // 格式化数据为所需结构
      const formattedData = this._formatData({
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
        calendarEvents: calendarResult.data || [],
        gyroscope: gyroscopeResult.data || null,
      });

      const result = {
        uid,
        data: formattedData,
      };

      console.log('[MobileDataManager] ✅ 数据收集完成，共', formattedData.length, '条记录');
      this.isCollecting = false;

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error('[MobileDataManager] ❌ 数据收集失败:', error);
      this.isCollecting = false;
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
    console.log('[MobileDataManager] 📤 开始上传手机数据...');

    try {
      // 收集数据
      const collectResult = await this.collectAllData(options);
      
      if (!collectResult.success) {
        return collectResult;
      }

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
   * 格式化数据为所需结构
   * @private
   */
  _formatData(rawData) {
    const { startDate, endDate } = rawData;
    const formatted = [];

    // 按小时分组数据
    const hourlyData = this._groupDataByHour(rawData);

    // 计算时间范围（小时）
    const hoursDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
    // 限制最多7天的数据（168小时），避免创建过多条目
    const maxHours = Math.min(hoursDiff, 168);

    // 为每个小时创建一条记录
    let hourCount = 0;
    for (let date = new Date(startDate); date <= endDate && hourCount < maxHours; date.setHours(date.getHours() + 1)) {
      hourCount++;
      const hourKey = this._getHourKey(date);
      const hourData = hourlyData[hourKey] || {};

      // 设置小时边界
      const hourStart = new Date(date);
      hourStart.setMinutes(0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourEnd.getHours() + 1);

      const timestamp = Date.now().toString();
      const startDateStr = hourStart.getTime().toString();
      const endDateStr = hourEnd.getTime().toString();

      // 计算步数
      const stepCount = this._sumValues(this._ensureArray(hourData.stepCount));

      // 计算能量
      const activeEnergyBurned = this._sumValues(this._ensureArray(hourData.activeEnergy));
      const basalEnergyBurned = this._sumValues(this._ensureArray(hourData.basalEnergy));

      // 计算楼层
      const flightsClimbed = this._sumValues(this._ensureArray(hourData.flightsClimbed));

      // 计算距离
      const distanceWalkingRunning = this._sumValues(this._ensureArray(hourData.distance));

      // 心率相关（取平均值或最新值）
      const heartRate = this._getAverageValue(this._ensureArray(hourData.heartRate));
      const restingHeartRate = this._getAverageValue(this._ensureArray(hourData.restingHeartRate));
      const heartRateVariability = this._getAverageValue(this._ensureArray(hourData.heartRateVariability));
      const walkingHeartRateAverage = this._getAverageValue(this._ensureArray(hourData.walkingHeartRate));

      // 营养数据
      const energyConsumed = this._sumValues(this._ensureArray(hourData.energyConsumed));
      const protein = this._sumValues(this._ensureArray(hourData.protein));
      const carbohydrates = this._sumValues(this._ensureArray(hourData.carbohydrates));
      const sugar = this._sumValues(this._ensureArray(hourData.sugar));
      const water = this._sumValues(this._ensureArray(hourData.water));

      // 活动摘要
      const activitySummary = this._ensureArray(hourData.activitySummary);

      // 睡眠分析
      const sleepAnalysis = this._filterByHour(this._ensureArray(hourData.sleep), date);

      // 正念会话
      const mindfulSession = this._filterByHour(this._ensureArray(hourData.mindfulSession), date);

      // 日历事件
      const calendarEvents = this._filterByHour(this._ensureArray(hourData.calendarEvents), date);

      // 陀螺仪数据（取平均值或最新值）
      const gyroscope = hourData.gyroscope || rawData.gyroscope || 0;
      const gyroscopeValue = typeof gyroscope === 'object' && gyroscope !== null
        ? Math.sqrt((gyroscope.x || 0) ** 2 + (gyroscope.y || 0) ** 2 + (gyroscope.z || 0) ** 2)
        : (typeof gyroscope === 'number' ? gyroscope : 0);

      formatted.push({
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
          exerciseTime: item.exerciseTime || 0,
          exerciseTimeGoal: item.exerciseTimeGoal || 0,
          standHours: item.standHours || 0,
          standHoursGoal: item.standHoursGoal || 0,
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
        calendar_events: calendarEvents.map(item => ({
          id: item.id,
          title: item.title,
          startDate: item.startDate,
          endDate: item.endDate,
          allDay: item.allDay || false,
          location: item.location || '',
          notes: item.notes || '',
        })),
        gyroscope: Math.round(gyroscopeValue * 100) / 100, // 保留2位小数
      });
    }

    return formatted;
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

    // 分组睡眠
    this._ensureArray(rawData.sleep).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].sleep) grouped[hourKey].sleep = [];
      grouped[hourKey].sleep.push(item);
    });

    // 分组正念会话
    this._ensureArray(rawData.mindfulSession).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].mindfulSession) grouped[hourKey].mindfulSession = [];
      grouped[hourKey].mindfulSession.push(item);
    });

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

    // 分组日历事件
    this._ensureArray(rawData.calendarEvents).forEach(item => {
      const hourKey = this._getHourKey(new Date(item.startDate || item.date));
      if (!grouped[hourKey]) grouped[hourKey] = {};
      if (!grouped[hourKey].calendarEvents) grouped[hourKey].calendarEvents = [];
      grouped[hourKey].calendarEvents.push(item);
    });

    // 陀螺仪数据（全局）
    if (rawData.gyroscope) {
      const now = new Date();
      const hourKey = this._getHourKey(now);
      if (!grouped[hourKey]) grouped[hourKey] = {};
      grouped[hourKey].gyroscope = rawData.gyroscope;
    }

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

  // 私有方法：获取各种健康数据
  async _getStepCount(startDate, endDate) {
    try {
      const result = await healthDataManager.getStepCount({ startDate, endDate });
      // 如果权限被拒绝，返回空数据而不是错误
      if (!result.success && result.denied) {
        console.log('[MobileDataManager] ℹ️ 步数权限被拒绝，返回空数据');
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取步数失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getHeartRate(startDate, endDate) {
    try {
      const result = await healthDataManager.getHeartRate({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取心率失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getRestingHeartRate(startDate, endDate) {
    try {
      const result = await healthDataManager.getRestingHeartRate({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取静息心率失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getHeartRateVariability(startDate, endDate) {
    try {
      const result = await healthDataManager.getHeartRateVariability({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取心率变异性失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getWalkingHeartRate(startDate, endDate) {
    try {
      const result = await healthDataManager.getWalkingHeartRateAverage({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取步行心率失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getActiveEnergy(startDate, endDate) {
    try {
      const result = await healthDataManager.getActiveEnergyBurned({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取活动能量失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getBasalEnergy(startDate, endDate) {
    try {
      const result = await healthDataManager.getBasalEnergyBurned({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取基础能量失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getActivitySummary(startDate, endDate) {
    try {
      const result = await healthDataManager.getActivitySummary({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取活动摘要失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getFlightsClimbed(startDate, endDate) {
    try {
      const result = await healthDataManager.getFlightsClimbed({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取楼层失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getDistance(startDate, endDate) {
    try {
      const result = await healthDataManager.getDistanceWalkingRunning({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取距离失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getSleepAnalysis(startDate, endDate) {
    try {
      const result = await healthDataManager.getSleepAnalysis({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取睡眠分析失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getMindfulSession(startDate, endDate) {
    try {
      const result = await healthDataManager.getMindfulSession({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取正念会话失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getEnergyConsumed(startDate, endDate) {
    try {
      const result = await healthDataManager.getEnergyConsumed({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取能量消耗失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getProtein(startDate, endDate) {
    try {
      const result = await healthDataManager.getProtein({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取蛋白质失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getCarbohydrates(startDate, endDate) {
    try {
      const result = await healthDataManager.getCarbohydrates({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取碳水化合物失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getSugar(startDate, endDate) {
    try {
      const result = await healthDataManager.getSugar({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取糖分失败:', error);
      return { success: true, data: [] };
    }
  }

  async _getWater(startDate, endDate) {
    try {
      const result = await healthDataManager.getWater({ startDate, endDate });
      if (!result.success && result.denied) {
        return { success: true, data: [] };
      }
      return result;
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取水分失败:', error);
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

      // 获取最后一次陀螺仪数据
      const gyroscopeData = deviceInfoManager.getLastData(SensorType.GYROSCOPE);

      return {
        success: true,
        data: gyroscopeData,
      };
    } catch (error) {
      console.warn('[MobileDataManager] ⚠️ 获取陀螺仪数据失败:', error);
      return { success: false, data: null };
    }
  }
}

// 导出单例实例
const mobileDataManager = new MobileDataManager();
export default mobileDataManager;

