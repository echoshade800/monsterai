/**
 * 健康数据管理器
 * 统一管理所有健康相关的数据授权和信息获取
 */

import { NativeModules, Platform } from 'react-native';
import BrokenHealthKit from 'react-native-health';

const AppleHealthKit = NativeModules.AppleHealthKit;

// 只在AppleHealthKit可用时设置Constants
if (AppleHealthKit && BrokenHealthKit.Constants) {
  AppleHealthKit.Constants = BrokenHealthKit.Constants;
}

/**
 * 健康数据类型常量
 */
export const HealthDataType = {
  STEP_COUNT: 'StepCount',
  HEART_RATE: 'HeartRate',
  RESTING_HEART_RATE: 'RestingHeartRate',
  HEART_RATE_VARIABILITY: 'HeartRateVariability',
  WALKING_HEART_RATE_AVERAGE: 'WalkingHeartRateAverage',
  SLEEP_ANALYSIS: 'SleepAnalysis',
  ACTIVE_ENERGY: 'ActiveEnergyBurned',
  BASAL_ENERGY: 'BasalEnergyBurned',
  ACTIVITY_SUMMARY: 'ActivitySummary',
  APPLE_STAND_TIME: 'AppleStandTime',
  MINDFUL_SESSION: 'MindfulSession',
  
  HEIGHT: 'Height',
  WEIGHT: 'BodyMass',

  BLOOD_PRESSURE_SYSTOLIC: 'BloodPressureSystolic',
  BLOOD_PRESSURE_DIASTOLIC: 'BloodPressureDiastolic',
  BLOOD_GLUCOSE: 'BloodGlucose',
  BODY_TEMPERATURE: 'BodyTemperature',
  RESPIRATORY_RATE: 'RespiratoryRate',
  OXYGEN_SATURATION: 'OxygenSaturation',
  
  // 营养数据
  ENERGY_CONSUMED: 'EnergyConsumed',
  PROTEIN: 'Protein',
  CARBOHYDRATES: 'Carbohydrates',
  SUGAR: 'Sugar',
  WATER: 'Water',
  CAFFEINE: 'Caffeine',
  
  // 运动数据
  FLIGHTS_CLIMBED: 'FlightsClimbed',
  DISTANCE_WALKING_RUNNING: 'DistanceWalkingRunning',
  WORKOUT: 'Workout',
};

/**
 * 时间周期常量
 */
export const TimePeriod = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
};

/**
 * 时间间隔单位枚举
 */
export const TimeInterval = {
  MINUTE: 'minute',
  HOUR: 'hour',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
};

class HealthDataManager {
  constructor() {
    this.isInitialized = false;
    this.authorizedPermissions = new Set();
  }

  /**
   * 检查 HealthKit 是否可用
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    console.log('[HealthDataManager] 🔍 开始检查 HealthKit 可用性...');
    
    try {
      if (Platform.OS !== 'ios') {
        console.log('[HealthDataManager] ⚠️ 平台检查失败: 当前平台为', Platform.OS, '，HealthKit 仅在 iOS 设备上可用');
        return false;
      }

      if (!AppleHealthKit) {
        console.log('[HealthDataManager] ❌ AppleHealthKit 模块未加载');
        return false;
      }

      return new Promise((resolve) => {
        try {
          AppleHealthKit.isAvailable((err, available) => {
            if (err) {
              console.log('[HealthDataManager] ❌ HealthKit isAvailable 错误:', err);
              resolve(false);
              return;
            }
            const isAvailable = available === true;
            console.log('[HealthDataManager] ✅ HealthKit 可用性检查完成:', isAvailable);
            resolve(isAvailable);
          });
        } catch (e) {
          console.log('[HealthDataManager] ❌ HealthKit isAvailable 异常:', e);
          resolve(false);
        }
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 检查 HealthKit 可用性失败:', error);
      return false;
    }
  }

  /**
   * 初始化 HealthKit 并申请权限
   * @param {Array<string>} readPermissions - 需要读取权限的数据类型数组
   * @param {Array<string>} writePermissions - 需要写入权限的数据类型数组
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async initHealthKit(readPermissions = [], writePermissions = []) {
    console.log('[HealthDataManager] 🔐 开始初始化 HealthKit...');
    console.log('[HealthDataManager] 📋 读取权限:', readPermissions);
    console.log('[HealthDataManager] 📝 写入权限:', writePermissions);
    
    try {
      // 检查平台
      if (Platform.OS !== 'ios') {
        console.log('[HealthDataManager] ⚠️ 平台检查失败: 非 iOS 平台');
        return {
          success: false,
          error: 'HealthKit 仅在 iOS 设备上可用',
        };
      }

      // 检查可用性
      const available = await this.isAvailable();
      if (!available) {
        console.log('[HealthDataManager] ❌ HealthKit 不可用');
        return {
          success: false,
          error: 'HealthKit 不可用（模拟器或模块未链接）',
        };
      }

      // 构建权限配置
      const permissions = {
        permissions: {
          read: readPermissions.length > 0 ? readPermissions : [],
          write: writePermissions.length > 0 ? writePermissions : [],
        },
      };

      console.log('[HealthDataManager] 📤 请求权限中...');
      
      // 请求权限
      return new Promise((resolve) => {
        try {
          AppleHealthKit.initHealthKit(permissions, (err) => {
            if (err) {
              // HealthKit Code=5 表示权限被拒绝，这是正常的用户行为，使用警告而不是错误
              const isPermissionDenied = err.code === 5 || 
                                        (err.message && err.message.includes('Code=5')) ||
                                        (err.message && err.message.includes('authorization'));
              
              if (isPermissionDenied) {
                console.warn('[HealthDataManager] ⚠️ HealthKit 权限被拒绝（用户可能拒绝了权限请求）');
                console.warn('[HealthDataManager] 💡 提示：用户可以在"设置 > 健康 > 数据访问权限与设备"中重新授权');
              } else {
                console.error('[HealthDataManager] ❌ initHealthKit 错误:', err);
              }
              
              resolve({
                success: false,
                error: err.message || '权限申请失败',
                denied: isPermissionDenied, // 标记是否为权限被拒绝
              });
              return;
            }

            // 记录已授权的权限
            readPermissions.forEach(perm => this.authorizedPermissions.add(perm));
            writePermissions.forEach(perm => this.authorizedPermissions.add(perm));
            
            this.isInitialized = true;
            console.log('[HealthDataManager] ✅ 权限申请成功');
            console.log('[HealthDataManager] 📊 当前已授权权限:', Array.from(this.authorizedPermissions));
            resolve({ success: true });
          });
        } catch (e) {
          console.error('[HealthDataManager] ❌ initHealthKit 异常:', e);
          resolve({
            success: false,
            error: e.message || '权限申请异常',
          });
        }
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 初始化 HealthKit 失败:', error);
      return {
        success: false,
        error: error.message || '初始化失败',
      };
    }
  }

  /**
   * 快速申请所有常用健康数据权限
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async requestAllCommonPermissions() {
    const commonReadPermissions = [
      HealthDataType.STEP_COUNT,
      HealthDataType.HEART_RATE,
      HealthDataType.SLEEP_ANALYSIS,
      HealthDataType.ACTIVE_ENERGY,
      HealthDataType.HEIGHT,
      HealthDataType.WEIGHT,
      HealthDataType.BLOOD_PRESSURE_SYSTOLIC,
      HealthDataType.BLOOD_PRESSURE_DIASTOLIC,
    ];

    return await this.initHealthKit(commonReadPermissions, []);
  }

  /**
   * 申请单个数据类型的权限
   * @param {string} dataType - 数据类型
   * @param {boolean} needWrite - 是否需要写入权限
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async requestPermission(dataType, needWrite = false) {
    const readPermissions = [dataType];
    const writePermissions = needWrite ? [dataType] : [];
    return await this.initHealthKit(readPermissions, writePermissions);
  }

  /**
   * 计算日期范围
   * @param {string|Object} periodOrOptions - 时间周期字符串或包含具体日期的对象
   *   - 字符串: 使用预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {{startDate: Date, endDate: Date}}
   */
  getDateRange(periodOrOptions) {
    console.log('[HealthDataManager] 📅 计算日期范围, 参数:', periodOrOptions);
    
    const now = new Date();
    let startDate, endDate;

    // 如果是对象，表示自定义日期范围
    if (typeof periodOrOptions === 'object' && periodOrOptions !== null) {
      console.log('[HealthDataManager] 🔧 使用自定义日期范围');
      
      if (periodOrOptions.startDate) {
        startDate = typeof periodOrOptions.startDate === 'string' 
          ? new Date(periodOrOptions.startDate) 
          : periodOrOptions.startDate;
        console.log('[HealthDataManager] 📍 起始日期:', startDate);
      }
      if (periodOrOptions.endDate) {
        endDate = typeof periodOrOptions.endDate === 'string' 
          ? new Date(periodOrOptions.endDate) 
          : periodOrOptions.endDate;
        console.log('[HealthDataManager] 📍 结束日期:', endDate);
      }
      
      // 验证日期有效性
      if (!startDate || isNaN(startDate.getTime())) {
        console.log('[HealthDataManager] ⚠️ 起始日期无效，使用默认值（今天0点）');
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
      if (!endDate || isNaN(endDate.getTime())) {
        console.log('[HealthDataManager] ⚠️ 结束日期无效，使用默认值（当前时间）');
        endDate = now;
      }
      
      // 确保结束日期不早于开始日期
      if (endDate < startDate) {
        console.log('[HealthDataManager] 🔄 检测到日期顺序错误，自动交换');
        [startDate, endDate] = [endDate, startDate];
      }
      
      console.log('[HealthDataManager] ✅ 自定义日期范围:', startDate.toLocaleDateString(), '-', endDate.toLocaleDateString());
      return { startDate, endDate };
    }

    // 否则使用预设周期
    const period = periodOrOptions || TimePeriod.TODAY;
    console.log('[HealthDataManager] 📆 使用预设周期:', period);
    
    switch (period) {
      case TimePeriod.TODAY:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = now;
        break;

      case TimePeriod.YESTERDAY:
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
        endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
        break;

      case TimePeriod.LAST_7_DAYS:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;

      case TimePeriod.LAST_30_DAYS:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;

      case TimePeriod.THIS_WEEK:
        const dayOfWeek = now.getDay();
        const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate = new Date(now.getFullYear(), now.getMonth(), diff);
        endDate = now;
        break;

      case TimePeriod.THIS_MONTH:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        break;

      default:
        console.log('[HealthDataManager] ⚠️ 未知周期，使用默认值（今天）');
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = now;
    }

    console.log('[HealthDataManager] ✅ 预设周期日期范围:', startDate.toLocaleDateString(), '-', endDate.toLocaleDateString());
    return { startDate, endDate };
  }

  /**
   * 获取步数数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @param {string} interval - 时间间隔单位 (minute, hour, day, week, month)
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getStepCount(periodOrOptions = TimePeriod.TODAY, interval = null) {
    console.log('[HealthDataManager] 🚶 开始获取步数数据...');
    console.log('[HealthDataManager] 📅 时间间隔:', interval || '默认');
    
    try {
      // 确保权限已授予
      if (!this.authorizedPermissions.has(HealthDataType.STEP_COUNT)) {
        console.log('[HealthDataManager] 🔐 步数权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.STEP_COUNT);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 步数权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 步数权限申请成功');
      } else {
        console.log('[HealthDataManager] ✅ 步数权限已授权');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      // 如果指定了时间间隔，添加到选项中
      if (interval) {
        options.interval = interval;
      }

      console.log('[HealthDataManager] 📊 查询参数:', options);

      return new Promise((resolve) => {
        // 如果是自定义日期范围，使用 getDailyStepCountSamples
        const isCustomRange = typeof periodOrOptions === 'object' && periodOrOptions !== null;
        const methodName = (periodOrOptions === TimePeriod.TODAY && !isCustomRange) 
          ? 'getStepCount' 
          : 'getDailyStepCountSamples';
        
        console.log('[HealthDataManager] 🔧 使用方法:', methodName);
        
        if (!AppleHealthKit[methodName]) {
          console.log('[HealthDataManager] ❌ 方法不可用:', methodName);
          resolve({
            success: false,
            error: `方法 ${methodName} 不可用`,
          });
          return;
        }

        AppleHealthKit[methodName](options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取步数数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取步数数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : (results ? 1 : 0);
          console.log('[HealthDataManager] ✅ 步数数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取步数数据异常:', error);
      return {
        success: false,
        error: error.message || '获取步数数据异常',
      };
    }
  }

  /**
   * 获取心率数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getHeartRate(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] ❤️ 开始获取心率数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.HEART_RATE)) {
        console.log('[HealthDataManager] 🔐 心率权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.HEART_RATE);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 心率权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 心率权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      return new Promise((resolve) => {
        if (!AppleHealthKit.getHeartRateSamples) {
          console.log('[HealthDataManager] ❌ 心率数据方法不可用');
          resolve({
            success: false,
            error: '心率数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getHeartRateSamples(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取心率数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取心率数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : 0;
          console.log('[HealthDataManager] ✅ 心率数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取心率数据异常:', error);
      return {
        success: false,
        error: error.message || '获取心率数据异常',
      };
    }
  }

  /**
   * 获取静息心率数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getRestingHeartRate(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 💤 开始获取静息心率数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.RESTING_HEART_RATE)) {
        console.log('[HealthDataManager] 🔐 静息心率权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.RESTING_HEART_RATE);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 静息心率权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 静息心率权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      return new Promise((resolve) => {
        // 尝试不同的方法名称以提高兼容性
        const methodName = AppleHealthKit.getRestingHeartRate ? 'getRestingHeartRate' : 'getRestingHeartRateSamples';
        
        if (!AppleHealthKit[methodName]) {
          console.log('[HealthDataManager] ❌ 静息心率数据方法不可用');
          resolve({
            success: false,
            error: '静息心率数据方法不可用',
          });
          return;
        }

        console.log('[HealthDataManager] 🔧 使用方法:', methodName);

        AppleHealthKit[methodName](options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取静息心率数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取静息心率数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : 0;
          console.log('[HealthDataManager] ✅ 静息心率数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取静息心率数据异常:', error);
      return {
        success: false,
        error: error.message || '获取静息心率数据异常',
      };
    }
  }

  /**
   * 获取心率变异性数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getHeartRateVariability(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 📊 开始获取心率变异性数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.HEART_RATE_VARIABILITY)) {
        console.log('[HealthDataManager] 🔐 心率变异性权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.HEART_RATE_VARIABILITY);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 心率变异性权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 心率变异性权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      return new Promise((resolve) => {
        // 尝试使用 getHeartRateVariability 方法
        const methodName = AppleHealthKit.getHeartRateVariability ? 'getHeartRateVariability' : 'getHeartRateVariabilitySamples';
        
        if (!AppleHealthKit[methodName]) {
          console.log('[HealthDataManager] ❌ 心率变异性数据方法不可用');
          resolve({
            success: false,
            error: '心率变异性数据方法不可用',
          });
          return;
        }

        console.log('[HealthDataManager] 🔧 使用方法:', methodName);

        AppleHealthKit[methodName](options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取心率变异性数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取心率变异性数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : 0;
          console.log('[HealthDataManager] ✅ 心率变异性数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取心率变异性数据异常:', error);
      return {
        success: false,
        error: error.message || '获取心率变异性数据异常',
      };
    }
  }

  /**
   * 获取步行平均心率数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getWalkingHeartRateAverage(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 🚶 开始获取步行平均心率数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.WALKING_HEART_RATE_AVERAGE)) {
        console.log('[HealthDataManager] 🔐 步行平均心率权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.WALKING_HEART_RATE_AVERAGE);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 步行平均心率权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 步行平均心率权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      return new Promise((resolve) => {
        if (!AppleHealthKit.getWalkingHeartRateAverage) {
          console.log('[HealthDataManager] ❌ 步行平均心率数据方法不可用');
          resolve({
            success: false,
            error: '步行平均心率数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getWalkingHeartRateAverage(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取步行平均心率数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取步行平均心率数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : 0;
          console.log('[HealthDataManager] ✅ 步行平均心率数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取步行平均心率数据异常:', error);
      return {
        success: false,
        error: error.message || '获取步行平均心率数据异常',
      };
    }
  }

  /**
   * 获取睡眠数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getSleepAnalysis(periodOrOptions = TimePeriod.YESTERDAY) {
    console.log('[HealthDataManager] 😴 开始获取睡眠数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.SLEEP_ANALYSIS)) {
        console.log('[HealthDataManager] 🔐 睡眠权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.SLEEP_ANALYSIS);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 睡眠权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 睡眠权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      return new Promise((resolve) => {
        if (!AppleHealthKit.getSleepSamples) {
          console.log('[HealthDataManager] ❌ 睡眠数据方法不可用');
          resolve({
            success: false,
            error: '睡眠数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getSleepSamples(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取睡眠数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取睡眠数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : 0;
          console.log('[HealthDataManager] ✅ 睡眠数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取睡眠数据异常:', error);
      return {
        success: false,
        error: error.message || '获取睡眠数据异常',
      };
    }
  }

  /**
   * 获取活动能量消耗
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getActiveEnergy(periodOrOptions = TimePeriod.TODAY) {
    try {
      if (!this.authorizedPermissions.has(HealthDataType.ACTIVE_ENERGY)) {
        const result = await this.requestPermission(HealthDataType.ACTIVE_ENERGY);
        if (!result.success) {
          return result;
        }
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      return new Promise((resolve) => {
        if (!AppleHealthKit.getActiveEnergyBurned) {
          resolve({
            success: false,
            error: '活动能量数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getActiveEnergyBurned(options, (err, results) => {
          if (err) {
            resolve({
              success: false,
              error: err.message || '获取活动能量数据失败',
            });
            return;
          }

          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error.message || '获取活动能量数据异常',
      };
    }
  }

  /**
   * 获取基础代谢能量数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getBasalEnergy(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 🔥 开始获取基础代谢能量数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.BASAL_ENERGY)) {
        console.log('[HealthDataManager] 🔐 基础代谢能量权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.BASAL_ENERGY);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 基础代谢能量权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 基础代谢能量权限申请成功');
      } else {
        console.log('[HealthDataManager] ✅ 基础代谢能量权限已授权');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      console.log('[HealthDataManager] 📊 查询参数:', options);

      return new Promise((resolve) => {
        if (!AppleHealthKit.getBasalEnergyBurned) {
          console.log('[HealthDataManager] ❌ 基础代谢能量数据方法不可用');
          resolve({
            success: false,
            error: '基础代谢能量数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getBasalEnergyBurned(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取基础代谢能量数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取基础代谢能量数据失败',
            });
            return;
          }
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取基础代谢能量数据异常:', error);
      return {
        success: false,
        error: error.message || '获取基础代谢能量数据异常',
      };
    }
  }

  /**
   * 获取活动摘要数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {Promise<{success: boolean, data?: Array<{
   *   activeEnergyBurned: number,
   *   activeEnergyBurnedGoal: number,
   *   appleExerciseTime: number,
   *   appleExerciseTimeGoal: number,
   *   appleStandHours: number,
   *   appleStandHoursGoal: number
   * }>, error?: string}>}
   */
  async getActivitySummary(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 📊 开始获取活动摘要数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.ACTIVITY_SUMMARY)) {
        console.log('[HealthDataManager] 🔐 活动摘要权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.ACTIVITY_SUMMARY);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 活动摘要权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 活动摘要权限申请成功');
      } else {
        console.log('[HealthDataManager] ✅ 活动摘要权限已授权');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };

      console.log('[HealthDataManager] 📊 查询参数:', options);

      return new Promise((resolve) => {
        if (!AppleHealthKit.getActivitySummary) {
          console.log('[HealthDataManager] ❌ 活动摘要数据方法不可用');
          resolve({
            success: false,
            error: '活动摘要数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getActivitySummary(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取活动摘要数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取活动摘要数据失败',
            });
            return;
          }

          console.log('[HealthDataManager] ✅ 活动摘要数据获取成功, 记录数:', results?.length || 0);
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取活动摘要数据异常:', error);
      return {
        success: false,
        error: error.message || '获取活动摘要数据异常',
      };
    }
  }

  /**
   * 获取最新身高数据
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getLatestHeight() {
    try {
      if (!this.authorizedPermissions.has(HealthDataType.HEIGHT)) {
        const result = await this.requestPermission(HealthDataType.HEIGHT);
        if (!result.success) {
          return result;
        }
      }

      return new Promise((resolve) => {
        if (!AppleHealthKit.getLatestHeight) {
          resolve({
            success: false,
            error: '身高数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getLatestHeight(null, (err, results) => {
          if (err) {
            resolve({
              success: false,
              error: err.message || '获取身高数据失败',
            });
            return;
          }

          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error.message || '获取身高数据异常',
      };
    }
  }

  /**
   * 获取最新体重数据
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getLatestWeight() {
    try {
      if (!this.authorizedPermissions.has(HealthDataType.WEIGHT)) {
        const result = await this.requestPermission(HealthDataType.WEIGHT);
        if (!result.success) {
          return result;
        }
      }

      return new Promise((resolve) => {
        if (!AppleHealthKit.getLatestWeight) {
          resolve({
            success: false,
            error: '体重数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getLatestWeight(null, (err, results) => {
          if (err) {
            resolve({
              success: false,
              error: err.message || '获取体重数据失败',
            });
            return;
          }

          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error.message || '获取体重数据异常',
      };
    }
  }

  /**
   * 获取血压数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getBloodPressure(periodOrOptions = TimePeriod.TODAY) {
    try {
      // 血压需要同时请求收缩压和舒张压的权限
      const permissions = [
        HealthDataType.BLOOD_PRESSURE_SYSTOLIC,
        HealthDataType.BLOOD_PRESSURE_DIASTOLIC,
      ];

      for (const perm of permissions) {
        if (!this.authorizedPermissions.has(perm)) {
          const result = await this.requestPermission(perm);
          if (!result.success) {
            return result;
          }
        }
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      return new Promise((resolve) => {
        if (!AppleHealthKit.getBloodPressureSamples) {
          resolve({
            success: false,
            error: '血压数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getBloodPressureSamples(options, (err, results) => {
          if (err) {
            resolve({
              success: false,
              error: err.message || '获取血压数据失败',
            });
            return;
          }

          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      return {
        success: false,
        error: error.message || '获取血压数据异常',
      };
    }
  }

  /**
   * 格式化步数数据为可读格式
   * @param {any} rawData - 原始步数数据
   * @param {string} period - 时间周期
   * @returns {Object} 格式化后的数据
   */
  formatStepCountData(rawData, period) {
    console.log('[HealthDataManager] 🔄 开始格式化步数数据...');
    
    try {
      let data = [];
      if (Array.isArray(rawData)) {
        data = rawData;
        console.log('[HealthDataManager] 📊 原始数据为数组, 长度:', rawData.length);
      } else if (rawData && typeof rawData === 'object') {
        data = [rawData];
        console.log('[HealthDataManager] 📊 原始数据为对象, 转换为数组');
      } else {
        console.log('[HealthDataManager] ⚠️ 原始数据为空或格式不正确');
      }

      const totalSteps = data.reduce((sum, item) => sum + (item.value || 0), 0);
      const averageSteps = data.length > 0 ? Math.round(totalSteps / data.length) : 0;

      console.log('[HealthDataManager] ✅ 格式化完成 - 总步数:', totalSteps, ', 平均:', averageSteps, ', 天数:', data.length);

      return {
        total: totalSteps,
        average: averageSteps,
        days: data.length,
        records: data.map(item => ({
          date: new Date(item.startDate),
          steps: item.value || 0,
          dateString: new Date(item.startDate).toLocaleDateString(),
        })),
        period,
      };
    } catch (error) {
      console.error('[HealthDataManager] ❌ 格式化步数数据失败:', error);
      return {
        total: 0,
        average: 0,
        days: 0,
        records: [],
        period,
      };
    }
  }

  /**
   * 格式化心率数据为可读格式
   * @param {any} rawData - 原始心率数据
   * @returns {Object} 格式化后的数据
   */
  formatHeartRateData(rawData) {
    try {
      const data = Array.isArray(rawData) ? rawData : [];
      
      if (data.length === 0) {
        return {
          count: 0,
          average: 0,
          min: 0,
          max: 0,
          records: [],
        };
      }

      const heartRates = data.map(item => item.value);
      const average = Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length);
      const min = Math.min(...heartRates);
      const max = Math.max(...heartRates);

      return {
        count: data.length,
        average,
        min,
        max,
        records: data.map(item => ({
          date: new Date(item.startDate),
          value: item.value,
          dateString: new Date(item.startDate).toLocaleString(),
        })),
      };
    } catch (error) {
      console.error('格式化心率数据失败:', error);
      return {
        count: 0,
        average: 0,
        min: 0,
        max: 0,
        records: [],
      };
    }
  }

  /**
   * 格式化睡眠数据为可读格式
   * @param {any} rawData - 原始睡眠数据
   * @returns {Object} 格式化后的数据
   */
  formatSleepData(rawData) {
    try {
      const data = Array.isArray(rawData) ? rawData : [];
      
      if (data.length === 0) {
        return {
          totalMinutes: 0,
          totalHours: 0,
          segments: 0,
          records: [],
        };
      }

      const totalMinutes = data.reduce((total, item) => {
        const startTime = new Date(item.startDate);
        const endTime = new Date(item.endDate);
        return total + (endTime - startTime) / (1000 * 60);
      }, 0);

      const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

      return {
        totalMinutes,
        totalHours,
        segments: data.length,
        records: data.map(item => ({
          startDate: new Date(item.startDate),
          endDate: new Date(item.endDate),
          duration: Math.round((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60)),
          value: item.value,
        })),
      };
    } catch (error) {
      console.error('格式化睡眠数据失败:', error);
      return {
        totalMinutes: 0,
        totalHours: 0,
        segments: 0,
        records: [],
      };
    }
  }

  /**
   * 获取所有已授权的权限列表
   * @returns {Array<string>}
   */
  getAuthorizedPermissions() {
    return Array.from(this.authorizedPermissions);
  }

  /**
   * 检查特定权限是否已授权
   * @param {string} dataType - 数据类型
   * @returns {boolean}
   */
  isPermissionAuthorized(dataType) {
    return this.authorizedPermissions.has(dataType);
  }

  /**
   * 清除所有已授权权限的记录
   */
  clearAuthorizedPermissions() {
    this.authorizedPermissions.clear();
    this.isInitialized = false;
  }

  /**
   * 获取摄入能量数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getEnergyConsumed(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 🍽️ 开始获取摄入能量数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.ENERGY_CONSUMED)) {
        console.log('[HealthDataManager] 🔐 摄入能量权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.ENERGY_CONSUMED);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 摄入能量权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 摄入能量权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      console.log('[HealthDataManager] 📊 查询参数:', options);

      return new Promise((resolve) => {
        if (!AppleHealthKit.getEnergyConsumedSamples) {
          console.log('[HealthDataManager] ❌ 摄入能量数据方法不可用');
          resolve({
            success: false,
            error: '摄入能量数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getEnergyConsumedSamples(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取摄入能量数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取摄入能量数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : 0;
          console.log('[HealthDataManager] ✅ 摄入能量数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取摄入能量数据异常:', error);
      return {
        success: false,
        error: error.message || '获取摄入能量数据异常',
      };
    }
  }

  /**
   * 获取蛋白质摄入数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getProtein(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 🥩 开始获取蛋白质数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.PROTEIN)) {
        console.log('[HealthDataManager] 🔐 蛋白质权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.PROTEIN);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 蛋白质权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 蛋白质权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      console.log('[HealthDataManager] 📊 查询参数:', options);

      return new Promise((resolve) => {
        if (!AppleHealthKit.getProteinSamples) {
          console.log('[HealthDataManager] ❌ 蛋白质数据方法不可用');
          resolve({
            success: false,
            error: '蛋白质数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getProteinSamples(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取蛋白质数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取蛋白质数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : 0;
          console.log('[HealthDataManager] ✅ 蛋白质数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取蛋白质数据异常:', error);
      return {
        success: false,
        error: error.message || '获取蛋白质数据异常',
      };
    }
  }

  /**
   * 获取碳水化合物摄入数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getCarbohydrates(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 🍞 开始获取碳水化合物数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.CARBOHYDRATES)) {
        console.log('[HealthDataManager] 🔐 碳水化合物权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.CARBOHYDRATES);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 碳水化合物权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 碳水化合物权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      console.log('[HealthDataManager] 📊 查询参数:', options);

      return new Promise((resolve) => {
        if (!AppleHealthKit.getCarbohydratesSamples) {
          console.log('[HealthDataManager] ❌ 碳水化合物数据方法不可用');
          resolve({
            success: false,
            error: '碳水化合物数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getCarbohydratesSamples(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取碳水化合物数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取碳水化合物数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : 0;
          console.log('[HealthDataManager] ✅ 碳水化合物数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取碳水化合物数据异常:', error);
      return {
        success: false,
        error: error.message || '获取碳水化合物数据异常',
      };
    }
  }

  /**
   * 获取糖分摄入数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getSugar(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 🍬 开始获取糖分摄入数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.SUGAR)) {
        console.log('[HealthDataManager] 🔐 糖分权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.SUGAR);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 糖分权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 糖分权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      console.log('[HealthDataManager] 📊 查询参数:', options);

      return new Promise((resolve) => {
        if (!AppleHealthKit.getSugarSamples) {
          console.log('[HealthDataManager] ❌ 糖分数据方法不可用');
          resolve({
            success: false,
            error: '糖分数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getSugarSamples(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取糖分数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取糖分数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : 0;
          console.log('[HealthDataManager] ✅ 糖分数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取糖分数据异常:', error);
      return {
        success: false,
        error: error.message || '获取糖分数据异常',
      };
    }
  }

  /**
   * 获取水分摄入数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getWater(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 💧 开始获取水分摄入数据...');
    console.log('[HealthDataManager] 📊 查询参数:', periodOrOptions);
    try {
      if (!this.authorizedPermissions.has(HealthDataType.WATER)) {
        console.log('[HealthDataManager] 🔐 水分摄入权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.WATER);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 水分摄入权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 水分摄入权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      console.log('[HealthDataManager] 📊 查询参数:', options);

      return new Promise((resolve) => {
        if (!AppleHealthKit.getWaterSamples) {
          console.log('[HealthDataManager] ❌ 水分摄入数据方法不可用');
          resolve({
            success: false,
            error: '水分摄入数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getWaterSamples(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取水分摄入数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取水分摄入数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : 0;
          console.log('[HealthDataManager] ✅ 水分摄入数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取水分摄入数据异常:', error);
      return {
        success: false,
        error: error.message || '获取水分摄入数据异常',
      };
    }
  }

  /**
   * 获取爬楼层数数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getFlightsClimbed(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 🏃 开始获取爬楼层数数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.FLIGHTS_CLIMBED)) {
        console.log('[HealthDataManager] 🔐 爬楼层数权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.FLIGHTS_CLIMBED);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 爬楼层数权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 爬楼层数权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      console.log('[HealthDataManager] 📊 查询参数:', options);

      return new Promise((resolve) => {
        if (!AppleHealthKit.getFlightsClimbed) {
          console.log('[HealthDataManager] ❌ 爬楼层数数据方法不可用');
          resolve({
            success: false,
            error: '爬楼层数数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getFlightsClimbed(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取爬楼层数数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取爬楼层数数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : (results ? 1 : 0);
          console.log('[HealthDataManager] ✅ 爬楼层数数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取爬楼层数数据异常:', error);
      return {
        success: false,
        error: error.message || '获取爬楼层数数据异常',
      };
    }
  }

  /**
   * 获取步行跑步距离数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getDistanceWalkingRunning(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 🏃 开始获取步行跑步距离数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.DISTANCE_WALKING_RUNNING)) {
        console.log('[HealthDataManager] 🔐 步行跑步距离权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.DISTANCE_WALKING_RUNNING);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 步行跑步距离权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 步行跑步距离权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      console.log('[HealthDataManager] 📊 查询参数:', options);

      return new Promise((resolve) => {
        if (!AppleHealthKit.getDistanceWalkingRunning) {
          console.log('[HealthDataManager] ❌ 步行跑步距离数据方法不可用');
          resolve({
            success: false,
            error: '步行跑步距离数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getDistanceWalkingRunning(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取步行跑步距离数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取步行跑步距离数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : (results ? 1 : 0);
          console.log('[HealthDataManager] ✅ 步行跑步距离数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取步行跑步距离数据异常:', error);
      return {
        success: false,
        error: error.message || '获取步行跑步距离数据异常',
      };
    }
  }

  /**
   * 获取锻炼记录数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getWorkout(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 💪 开始获取锻炼记录数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.WORKOUT)) {
        console.log('[HealthDataManager] 🔐 锻炼记录权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.WORKOUT);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 锻炼记录权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 锻炼记录权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      console.log('[HealthDataManager] 📊 查询参数:', options);

      return new Promise((resolve) => {
        if (!AppleHealthKit.getSamples) {
          console.log('[HealthDataManager] ❌ 锻炼记录数据方法不可用');
          resolve({
            success: false,
            error: '锻炼记录数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getSamples(options, (err, results) => {
          console.log('[TEST] 📊 获取锻炼记录数据结果:', results);
          if (err) {
            console.error('[HealthDataManager] ❌ 获取锻炼记录数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取锻炼记录数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : 0;
          console.log('[HealthDataManager] ✅ 锻炼记录数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取锻炼记录数据异常:', error);
      return {
        success: false,
        error: error.message || '获取锻炼记录数据异常',
      };
    }
  }

  /**
   * 获取锻炼路线数据
   * @param {string} workoutId - 锻炼记录ID
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getWorkoutRoute(workoutId) {
    console.log('[HealthDataManager] 🗺️ 开始获取锻炼路线数据...');
    console.log('[HealthDataManager] 📍 锻炼ID:', workoutId);
    
    try {
      if (!workoutId) {
        console.log('[HealthDataManager] ❌ 锻炼ID不能为空');
        return {
          success: false,
          error: '锻炼ID不能为空',
        };
      }

      if (!this.authorizedPermissions.has(HealthDataType.WORKOUT)) {
        console.log('[HealthDataManager] 🔐 锻炼权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.WORKOUT);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 锻炼权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 锻炼权限申请成功');
      }

      const options = {
        id: workoutId,
      };

      console.log('[HealthDataManager] 📊 查询参数:', options);

      return new Promise((resolve) => {
        if (!AppleHealthKit.getWorkoutRoutes) {
          console.log('[HealthDataManager] ❌ 锻炼路线数据方法不可用');
          resolve({
            success: false,
            error: '锻炼路线数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getWorkoutRoutes(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取锻炼路线数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取锻炼路线数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : 0;
          console.log('[HealthDataManager] ✅ 锻炼路线数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取锻炼路线数据异常:', error);
      return {
        success: false,
        error: error.message || '获取锻炼路线数据异常',
      };
    }
  }

  /**
   * 获取正念冥想数据
   * @param {string|Object} periodOrOptions - 时间周期或日期范围对象
   *   - 字符串: 预设周期（'today', 'yesterday', 'last_7_days'等）
   *   - 对象: { startDate: string|Date, endDate: string|Date } 自定义日期范围
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async getMindfulSession(periodOrOptions = TimePeriod.TODAY) {
    console.log('[HealthDataManager] 🧘 开始获取正念冥想数据...');
    
    try {
      if (!this.authorizedPermissions.has(HealthDataType.MINDFUL_SESSION)) {
        console.log('[HealthDataManager] 🔐 正念冥想权限未授权，尝试申请...');
        const result = await this.requestPermission(HealthDataType.MINDFUL_SESSION);
        if (!result.success) {
          console.log('[HealthDataManager] ❌ 正念冥想权限申请失败');
          return result;
        }
        console.log('[HealthDataManager] ✅ 正念冥想权限申请成功');
      }

      const { startDate, endDate } = this.getDateRange(periodOrOptions);
      const options = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 100,
        ascending: false,
      };

      console.log('[HealthDataManager] 📊 查询参数:', options);

      return new Promise((resolve) => {
        if (!AppleHealthKit.getMindfulSession) {
          console.log('[HealthDataManager] ❌ 正念冥想数据方法不可用');
          resolve({
            success: false,
            error: '正念冥想数据方法不可用',
          });
          return;
        }

        AppleHealthKit.getMindfulSession(options, (err, results) => {
          if (err) {
            console.error('[HealthDataManager] ❌ 获取正念冥想数据失败:', err);
            resolve({
              success: false,
              error: err.message || '获取正念冥想数据失败',
            });
            return;
          }

          const dataCount = Array.isArray(results) ? results.length : 0;
          console.log('[HealthDataManager] ✅ 正念冥想数据获取成功, 记录数:', dataCount);
          
          resolve({
            success: true,
            data: results,
          });
        });
      });
    } catch (error) {
      console.error('[HealthDataManager] ❌ 获取正念冥想数据异常:', error);
      return {
        success: false,
        error: error.message || '获取正念冥想数据异常',
      };
    }
  }
}

// 导出单例实例
const healthDataManager = new HealthDataManager();
export default healthDataManager;

