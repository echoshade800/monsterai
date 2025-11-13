/**
 * 设备信息管理器
 * 统一管理设备传感器数据，包括陀螺仪、加速度计、磁力计等
 */

import { Platform } from 'react-native';
import {
  Gyroscope,
  Accelerometer,
  Magnetometer,
  Barometer,
  DeviceMotion,
} from 'expo-sensors';

/**
 * 传感器类型常量
 */
export const SensorType = {
  GYROSCOPE: 'Gyroscope',           // 陀螺仪
  ACCELEROMETER: 'Accelerometer',   // 加速度计
  MAGNETOMETER: 'Magnetometer',     // 磁力计
  BAROMETER: 'Barometer',           // 气压计
  DEVICE_MOTION: 'DeviceMotion',    // 设备运动（综合传感器）
};

/**
 * 更新间隔预设（毫秒）
 */
export const UpdateInterval = {
  GAME: 16,        // 游戏级别 (~60fps)
  UI: 32,          // UI 更新级别 (~30fps)
  NORMAL: 100,     // 正常级别 (~10fps)
  SLOW: 1000,      // 慢速级别 (1fps)
};

class DeviceInfoManager {
  constructor() {
    this.subscriptions = new Map();
    this.isAvailable = {
      gyroscope: false,
      accelerometer: false,
      magnetometer: false,
      barometer: false,
      deviceMotion: false,
    };
    this.lastData = {
      gyroscope: null,
      accelerometer: null,
      magnetometer: null,
      barometer: null,
      deviceMotion: null,
    };
  }

  /**
   * 初始化传感器，检查可用性
   * @returns {Promise<Object>} 返回各传感器的可用性状态
   */
  async initialize() {
    console.log('[DeviceInfoManager] 🔍 开始检查传感器可用性...');

    try {
      // 检查陀螺仪
      try {
        const gyroAvailable = await Gyroscope.isAvailableAsync();
        this.isAvailable.gyroscope = gyroAvailable;
        console.log('[DeviceInfoManager] 陀螺仪可用性:', gyroAvailable);
      } catch (error) {
        console.log('[DeviceInfoManager] ⚠️ 陀螺仪检查失败:', error.message);
        this.isAvailable.gyroscope = false;
      }

      // 检查加速度计
      try {
        const accelAvailable = await Accelerometer.isAvailableAsync();
        this.isAvailable.accelerometer = accelAvailable;
        console.log('[DeviceInfoManager] 加速度计可用性:', accelAvailable);
      } catch (error) {
        console.log('[DeviceInfoManager] ⚠️ 加速度计检查失败:', error.message);
        this.isAvailable.accelerometer = false;
      }

      // 检查磁力计
      try {
        const magAvailable = await Magnetometer.isAvailableAsync();
        this.isAvailable.magnetometer = magAvailable;
        console.log('[DeviceInfoManager] 磁力计可用性:', magAvailable);
      } catch (error) {
        console.log('[DeviceInfoManager] ⚠️ 磁力计检查失败:', error.message);
        this.isAvailable.magnetometer = false;
      }

      // 检查气压计
      try {
        const baroAvailable = await Barometer.isAvailableAsync();
        this.isAvailable.barometer = baroAvailable;
        console.log('[DeviceInfoManager] 气压计可用性:', baroAvailable);
      } catch (error) {
        console.log('[DeviceInfoManager] ⚠️ 气压计检查失败:', error.message);
        this.isAvailable.barometer = false;
      }

      // 检查设备运动传感器
      try {
        const motionAvailable = await DeviceMotion.isAvailableAsync();
        this.isAvailable.deviceMotion = motionAvailable;
        console.log('[DeviceInfoManager] 设备运动传感器可用性:', motionAvailable);
      } catch (error) {
        console.log('[DeviceInfoManager] ⚠️ 设备运动传感器检查失败:', error.message);
        this.isAvailable.deviceMotion = false;
      }

      console.log('[DeviceInfoManager] ✅ 传感器初始化完成');
      return { success: true, availability: this.isAvailable };
    } catch (error) {
      console.error('[DeviceInfoManager] ❌ 初始化失败:', error);
      return {
        success: false,
        error: error.message,
        availability: this.isAvailable,
      };
    }
  }

  /**
   * 设置传感器更新间隔
   * @param {string} sensorType - 传感器类型
   * @param {number} intervalMs - 更新间隔（毫秒）
   */
  setUpdateInterval(sensorType, intervalMs) {
    try {
      switch (sensorType) {
        case SensorType.GYROSCOPE:
          Gyroscope.setUpdateInterval(intervalMs);
          break;
        case SensorType.ACCELEROMETER:
          Accelerometer.setUpdateInterval(intervalMs);
          break;
        case SensorType.MAGNETOMETER:
          Magnetometer.setUpdateInterval(intervalMs);
          break;
        case SensorType.BAROMETER:
          Barometer.setUpdateInterval(intervalMs);
          break;
        case SensorType.DEVICE_MOTION:
          DeviceMotion.setUpdateInterval(intervalMs);
          break;
        default:
          console.warn('[DeviceInfoManager] ⚠️ 未知的传感器类型:', sensorType);
      }
      console.log(`[DeviceInfoManager] 已设置${sensorType}更新间隔为 ${intervalMs}ms`);
    } catch (error) {
      console.error(`[DeviceInfoManager] ❌ 设置${sensorType}更新间隔失败:`, error);
    }
  }

  /**
   * 订阅陀螺仪数据
   * @param {Function} callback - 回调函数，接收陀螺仪数据 {x, y, z}
   * @param {number} updateInterval - 更新间隔（毫秒），默认100ms
   * @returns {Object} 包含 success 和 subscription 的对象
   */
  subscribeToGyroscope(callback, updateInterval = UpdateInterval.NORMAL) {
    console.log('[DeviceInfoManager] 📡 开始订阅陀螺仪数据...');

    try {
      if (!this.isAvailable.gyroscope) {
        console.warn('[DeviceInfoManager] ⚠️ 陀螺仪不可用');
        return { success: false, error: '陀螺仪不可用' };
      }

      // 如果已存在订阅，先取消
      if (this.subscriptions.has('gyroscope')) {
        this.unsubscribeFromGyroscope();
      }

      // 设置更新间隔
      Gyroscope.setUpdateInterval(updateInterval);

      // 订阅数据
      const subscription = Gyroscope.addListener((data) => {
        this.lastData.gyroscope = {
          x: data.x,
          y: data.y,
          z: data.z,
          timestamp: Date.now(),
        };
        callback(this.lastData.gyroscope);
      });

      this.subscriptions.set('gyroscope', subscription);
      console.log('[DeviceInfoManager] ✅ 陀螺仪订阅成功');

      return { success: true, subscription };
    } catch (error) {
      console.error('[DeviceInfoManager] ❌ 陀螺仪订阅失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 取消陀螺仪订阅
   */
  unsubscribeFromGyroscope() {
    try {
      const subscription = this.subscriptions.get('gyroscope');
      if (subscription) {
        subscription.remove();
        this.subscriptions.delete('gyroscope');
        console.log('[DeviceInfoManager] ✅ 陀螺仪订阅已取消');
      }
    } catch (error) {
      console.error('[DeviceInfoManager] ❌ 取消陀螺仪订阅失败:', error);
    }
  }

  /**
   * 订阅加速度计数据
   * @param {Function} callback - 回调函数，接收加速度数据 {x, y, z}
   * @param {number} updateInterval - 更新间隔（毫秒）
   * @returns {Object} 包含 success 和 subscription 的对象
   */
  subscribeToAccelerometer(callback, updateInterval = UpdateInterval.NORMAL) {
    console.log('[DeviceInfoManager] 📡 开始订阅加速度计数据...');

    try {
      if (!this.isAvailable.accelerometer) {
        console.warn('[DeviceInfoManager] ⚠️ 加速度计不可用');
        return { success: false, error: '加速度计不可用' };
      }

      if (this.subscriptions.has('accelerometer')) {
        this.unsubscribeFromAccelerometer();
      }

      Accelerometer.setUpdateInterval(updateInterval);

      const subscription = Accelerometer.addListener((data) => {
        this.lastData.accelerometer = {
          x: data.x,
          y: data.y,
          z: data.z,
          timestamp: Date.now(),
        };
        callback(this.lastData.accelerometer);
      });

      this.subscriptions.set('accelerometer', subscription);
      console.log('[DeviceInfoManager] ✅ 加速度计订阅成功');

      return { success: true, subscription };
    } catch (error) {
      console.error('[DeviceInfoManager] ❌ 加速度计订阅失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 取消加速度计订阅
   */
  unsubscribeFromAccelerometer() {
    try {
      const subscription = this.subscriptions.get('accelerometer');
      if (subscription) {
        subscription.remove();
        this.subscriptions.delete('accelerometer');
        console.log('[DeviceInfoManager] ✅ 加速度计订阅已取消');
      }
    } catch (error) {
      console.error('[DeviceInfoManager] ❌ 取消加速度计订阅失败:', error);
    }
  }

  /**
   * 订阅磁力计数据
   * @param {Function} callback - 回调函数，接收磁力计数据 {x, y, z}
   * @param {number} updateInterval - 更新间隔（毫秒）
   * @returns {Object} 包含 success 和 subscription 的对象
   */
  subscribeToMagnetometer(callback, updateInterval = UpdateInterval.NORMAL) {
    console.log('[DeviceInfoManager] 📡 开始订阅磁力计数据...');

    try {
      if (!this.isAvailable.magnetometer) {
        console.warn('[DeviceInfoManager] ⚠️ 磁力计不可用');
        return { success: false, error: '磁力计不可用' };
      }

      if (this.subscriptions.has('magnetometer')) {
        this.unsubscribeFromMagnetometer();
      }

      Magnetometer.setUpdateInterval(updateInterval);

      const subscription = Magnetometer.addListener((data) => {
        this.lastData.magnetometer = {
          x: data.x,
          y: data.y,
          z: data.z,
          timestamp: Date.now(),
        };
        callback(this.lastData.magnetometer);
      });

      this.subscriptions.set('magnetometer', subscription);
      console.log('[DeviceInfoManager] ✅ 磁力计订阅成功');

      return { success: true, subscription };
    } catch (error) {
      console.error('[DeviceInfoManager] ❌ 磁力计订阅失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 取消磁力计订阅
   */
  unsubscribeFromMagnetometer() {
    try {
      const subscription = this.subscriptions.get('magnetometer');
      if (subscription) {
        subscription.remove();
        this.subscriptions.delete('magnetometer');
        console.log('[DeviceInfoManager] ✅ 磁力计订阅已取消');
      }
    } catch (error) {
      console.error('[DeviceInfoManager] ❌ 取消磁力计订阅失败:', error);
    }
  }

  /**
   * 订阅气压计数据
   * @param {Function} callback - 回调函数，接收气压数据 {pressure, relativeAltitude}
   * @param {number} updateInterval - 更新间隔（毫秒）
   * @returns {Object} 包含 success 和 subscription 的对象
   */
  subscribeToBarometer(callback, updateInterval = UpdateInterval.NORMAL) {
    console.log('[DeviceInfoManager] 📡 开始订阅气压计数据...');

    try {
      if (!this.isAvailable.barometer) {
        console.warn('[DeviceInfoManager] ⚠️ 气压计不可用');
        return { success: false, error: '气压计不可用' };
      }

      if (this.subscriptions.has('barometer')) {
        this.unsubscribeFromBarometer();
      }

      Barometer.setUpdateInterval(updateInterval);

      const subscription = Barometer.addListener((data) => {
        this.lastData.barometer = {
          pressure: data.pressure,
          relativeAltitude: data.relativeAltitude,
          timestamp: Date.now(),
        };
        callback(this.lastData.barometer);
      });

      this.subscriptions.set('barometer', subscription);
      console.log('[DeviceInfoManager] ✅ 气压计订阅成功');

      return { success: true, subscription };
    } catch (error) {
      console.error('[DeviceInfoManager] ❌ 气压计订阅失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 取消气压计订阅
   */
  unsubscribeFromBarometer() {
    try {
      const subscription = this.subscriptions.get('barometer');
      if (subscription) {
        subscription.remove();
        this.subscriptions.delete('barometer');
        console.log('[DeviceInfoManager] ✅ 气压计订阅已取消');
      }
    } catch (error) {
      console.error('[DeviceInfoManager] ❌ 取消气压计订阅失败:', error);
    }
  }

  /**
   * 订阅设备运动数据（综合传感器数据）
   * @param {Function} callback - 回调函数，接收设备运动数据
   * @param {number} updateInterval - 更新间隔（毫秒）
   * @returns {Object} 包含 success 和 subscription 的对象
   */
  subscribeToDeviceMotion(callback, updateInterval = UpdateInterval.NORMAL) {
    console.log('[DeviceInfoManager] 📡 开始订阅设备运动数据...');

    try {
      if (!this.isAvailable.deviceMotion) {
        console.warn('[DeviceInfoManager] ⚠️ 设备运动传感器不可用');
        return { success: false, error: '设备运动传感器不可用' };
      }

      if (this.subscriptions.has('deviceMotion')) {
        this.unsubscribeFromDeviceMotion();
      }

      DeviceMotion.setUpdateInterval(updateInterval);

      const subscription = DeviceMotion.addListener((data) => {
        this.lastData.deviceMotion = {
          acceleration: data.acceleration,
          accelerationIncludingGravity: data.accelerationIncludingGravity,
          rotation: data.rotation,
          rotationRate: data.rotationRate,
          orientation: data.orientation,
          timestamp: Date.now(),
        };
        callback(this.lastData.deviceMotion);
      });

      this.subscriptions.set('deviceMotion', subscription);
      console.log('[DeviceInfoManager] ✅ 设备运动传感器订阅成功');

      return { success: true, subscription };
    } catch (error) {
      console.error('[DeviceInfoManager] ❌ 设备运动传感器订阅失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 取消设备运动传感器订阅
   */
  unsubscribeFromDeviceMotion() {
    try {
      const subscription = this.subscriptions.get('deviceMotion');
      if (subscription) {
        subscription.remove();
        this.subscriptions.delete('deviceMotion');
        console.log('[DeviceInfoManager] ✅ 设备运动传感器订阅已取消');
      }
    } catch (error) {
      console.error('[DeviceInfoManager] ❌ 取消设备运动传感器订阅失败:', error);
    }
  }

  /**
   * 获取最后一次读取的传感器数据
   * @param {string} sensorType - 传感器类型
   * @returns {Object|null} 最后一次读取的数据
   */
  getLastData(sensorType) {
    switch (sensorType) {
      case SensorType.GYROSCOPE:
        return this.lastData.gyroscope;
      case SensorType.ACCELEROMETER:
        return this.lastData.accelerometer;
      case SensorType.MAGNETOMETER:
        return this.lastData.magnetometer;
      case SensorType.BAROMETER:
        return this.lastData.barometer;
      case SensorType.DEVICE_MOTION:
        return this.lastData.deviceMotion;
      default:
        return null;
    }
  }

  /**
   * 获取陀螺仪旋转速度（度/秒）
   * @param {Object} gyroData - 陀螺仪原始数据 {x, y, z}
   * @returns {Object} 转换为度/秒的数据
   */
  getRotationRate(gyroData) {
    if (!gyroData) return null;

    // 陀螺仪数据单位是弧度/秒，转换为度/秒
    const radiansToDegrees = 180 / Math.PI;

    return {
      x: gyroData.x * radiansToDegrees,
      y: gyroData.y * radiansToDegrees,
      z: gyroData.z * radiansToDegrees,
      timestamp: gyroData.timestamp,
    };
  }

  /**
   * 计算设备倾斜角度
   * @param {Object} accelData - 加速度计数据 {x, y, z}
   * @returns {Object} 倾斜角度（度）
   */
  getTiltAngles(accelData) {
    if (!accelData) return null;

    const { x, y, z } = accelData;

    // 计算倾斜角度
    const pitch = Math.atan2(y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
    const roll = Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);

    return {
      pitch,  // 前后倾斜
      roll,   // 左右倾斜
      timestamp: accelData.timestamp,
    };
  }

  /**
   * 计算设备朝向（方位角）
   * @param {Object} magnetometerData - 磁力计数据 {x, y, z}
   * @returns {number} 方位角（度，0-360）
   */
  getHeading(magnetometerData) {
    if (!magnetometerData) return null;

    const { x, y } = magnetometerData;
    let heading = Math.atan2(y, x) * (180 / Math.PI);

    // 转换为 0-360 度范围
    if (heading < 0) {
      heading += 360;
    }

    return heading;
  }

  /**
   * 取消所有传感器订阅
   */
  unsubscribeAll() {
    console.log('[DeviceInfoManager] 🛑 取消所有传感器订阅...');

    this.unsubscribeFromGyroscope();
    this.unsubscribeFromAccelerometer();
    this.unsubscribeFromMagnetometer();
    this.unsubscribeFromBarometer();
    this.unsubscribeFromDeviceMotion();

    console.log('[DeviceInfoManager] ✅ 所有订阅已取消');
  }

  /**
   * 获取传感器可用性状态
   * @returns {Object} 各传感器的可用性状态
   */
  getSensorAvailability() {
    return { ...this.isAvailable };
  }

  /**
   * 检测设备是否在移动
   * @param {Object} accelData - 加速度计数据
   * @param {number} threshold - 运动阈值，默认 0.1
   * @returns {boolean} 是否在移动
   */
  isDeviceMoving(accelData, threshold = 0.1) {
    if (!accelData) return false;

    const { x, y, z } = accelData;
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    // 地球重力加速度约为 9.81 m/s²
    const gravity = 9.81;

    return Math.abs(magnitude - gravity) > threshold;
  }

  /**
   * 检测设备是否在旋转
   * @param {Object} gyroData - 陀螺仪数据
   * @param {number} threshold - 旋转阈值（弧度/秒），默认 0.1
   * @returns {boolean} 是否在旋转
   */
  isDeviceRotating(gyroData, threshold = 0.1) {
    if (!gyroData) return false;

    const { x, y, z } = gyroData;
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    return magnitude > threshold;
  }
}

// 导出单例实例
const deviceInfoManager = new DeviceInfoManager();
export default deviceInfoManager;

