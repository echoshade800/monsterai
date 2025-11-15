/**
 * 地理位置管理器
 * 统一管理所有地理位置相关的权限申请和信息获取
 */

import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * 位置精度常量
 */
export const LocationAccuracy = {
  LOWEST: Location.Accuracy.Lowest,
  LOW: Location.Accuracy.Low,
  BALANCED: Location.Accuracy.Balanced,
  HIGH: Location.Accuracy.High,
  HIGHEST: Location.Accuracy.Highest,
  BEST_FOR_NAVIGATION: Location.Accuracy.BestForNavigation,
};

/**
 * 位置权限状态常量
 */
export const LocationPermissionStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  RESTRICTED: 'restricted',
  UNDETERMINED: 'undetermined',
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

class LocationManager {
  constructor() {
    this.isInitialized = false;
    this.hasLocationPermission = false;
    this.currentLocation = null;
    this.locationHistory = [];
    this.isTracking = false;
    this.trackingInterval = null;
    this.trackingCallbacks = new Set();
  }

  /**
   * 检查位置服务是否可用
   * @returns {Promise<boolean>}
   */
  async isLocationServiceAvailable() {
    console.log('[LocationManager] 🔍 开始检查位置服务可用性...');
    
    try {
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        console.log('[LocationManager] ⚠️ 平台检查失败: 当前平台为', Platform.OS, '，位置服务仅在移动设备上可用');
        return false;
      }

      const isEnabled = await Location.hasServicesEnabledAsync();
      console.log('[LocationManager] ✅ 位置服务可用性检查完成:', isEnabled);
      return isEnabled;
    } catch (error) {
      console.error('[LocationManager] ❌ 检查位置服务可用性失败:', error);
      return false;
    }
  }

  /**
   * 请求位置权限
   * @param {string} permissionType - 权限类型 ('foreground' 或 'background')
   * @returns {Promise<{success: boolean, status?: string, error?: string}>}
   */
  async requestLocationPermission(permissionType = 'foreground') {
    console.log('[LocationManager] 🔐 开始请求位置权限...');
    console.log('[LocationManager] 📋 权限类型:', permissionType);
    
    try {
      // 检查位置服务是否可用
      const isServiceAvailable = await this.isLocationServiceAvailable();
      if (!isServiceAvailable) {
        console.log('[LocationManager] ❌ 位置服务不可用');
        return {
          success: false,
          error: '位置服务不可用，请在设备设置中启用位置服务',
        };
      }

      let permission;
      if (permissionType === 'background') {
        permission = await Location.requestBackgroundPermissionsAsync();
      } else {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      const isGranted = permission.status === LocationPermissionStatus.GRANTED;
      this.hasLocationPermission = isGranted;
      
      console.log('[LocationManager] 📊 权限状态:', permission.status);
      console.log('[LocationManager] ✅ 权限请求完成:', isGranted ? '已授权' : '被拒绝');
      
      return {
        success: isGranted,
        status: permission.status,
        error: isGranted ? null : '位置权限被拒绝',
      };
    } catch (error) {
      console.error('[LocationManager] ❌ 请求位置权限失败:', error);
      return {
        success: false,
        error: error.message || '请求位置权限失败',
      };
    }
  }

  /**
   * 检查位置权限状态
   * @param {string} permissionType - 权限类型 ('foreground' 或 'background')
   * @returns {Promise<{success: boolean, status?: string, error?: string}>}
   */
  async checkLocationPermission(permissionType = 'foreground') {
    console.log('[LocationManager] 🔍 检查位置权限状态...');
    
    try {
      let permission;
      if (permissionType === 'background') {
        permission = await Location.getBackgroundPermissionsAsync();
      } else {
        permission = await Location.getForegroundPermissionsAsync();
      }

      const isGranted = permission.status === LocationPermissionStatus.GRANTED;
      this.hasLocationPermission = isGranted;
      
      console.log('[LocationManager] 📊 当前权限状态:', permission.status);
      
      return {
        success: isGranted,
        status: permission.status,
        error: isGranted ? null : '位置权限未授权',
      };
    } catch (error) {
      console.error('[LocationManager] ❌ 检查位置权限失败:', error);
      return {
        success: false,
        error: error.message || '检查位置权限失败',
      };
    }
  }

  /**
   * 获取当前位置
   * @param {Object} options - 位置获取选项
   * @param {number} options.accuracy - 位置精度
   * @param {number} options.timeout - 超时时间（毫秒）
   * @param {number} options.maximumAge - 最大缓存时间（毫秒）
   * @param {boolean} options.includeAddress - 是否包含地址信息
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async getCurrentLocation(options = {}) {
    console.log('[LocationManager] 📍 开始获取当前位置...');
    
    try {
      // 检查权限
      if (!this.hasLocationPermission) {
        console.log('[LocationManager] 🔐 位置权限未授权，尝试申请...');
        const permissionResult = await this.requestLocationPermission();
        if (!permissionResult.success) {
          console.log('[LocationManager] ❌ 位置权限申请失败');
          return {
            success: false,
            error: permissionResult.error || '位置权限被拒绝',
          };
        }
        console.log('[LocationManager] ✅ 位置权限申请成功');
      }

      const locationOptions = {
        accuracy: options.accuracy || LocationAccuracy.HIGH,
        timeout: options.timeout || 15000,
        maximumAge: options.maximumAge || 10000,
      };

      console.log('[LocationManager] 📊 位置获取参数:', locationOptions);

      const location = await Location.getCurrentPositionAsync(locationOptions);

      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        altitudeAccuracy: location.coords.altitudeAccuracy,
        speed: location.coords.speed,
        heading: location.coords.heading,
        timestamp: new Date(location.timestamp).toLocaleString('zh-CN'),
        rawTimestamp: location.timestamp,
      };

      // 如果需要获取地址信息
      if (options.includeAddress !== false) {
        console.log('[LocationManager] 🏠 开始获取地址信息...');
        try {
          const addressData = await this.getAddressFromCoordinates(
            locationData.latitude, 
            locationData.longitude
          );
          if (addressData.success) {
            locationData.address = addressData.data;
            console.log('[LocationManager] ✅ 地址信息获取成功:', addressData.data);
          } else {
            console.log('[LocationManager] ⚠️ 地址信息获取失败:', addressData.error);
            locationData.address = null;
          }
        } catch (error) {
          console.error('[LocationManager] ❌ 获取地址信息异常:', error);
          locationData.address = null;
        }
      }

      this.currentLocation = locationData;
      console.log('[LocationManager] ✅ 当前位置获取成功:', locationData);
      
      return {
        success: true,
        data: locationData,
      };
    } catch (error) {
      console.error('[LocationManager] ❌ 获取当前位置失败:', error);
      return {
        success: false,
        error: error.message || '获取当前位置失败',
      };
    }
  }

  /**
   * 根据坐标获取地址信息
   * @param {number} latitude - 纬度
   * @param {number} longitude - 经度
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async getAddressFromCoordinates(latitude, longitude) {
    console.log('[LocationManager] 🏠 开始获取地址信息...');
    console.log('[LocationManager] 📍 坐标:', latitude, longitude);
    
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        const addressData = {
          country: address.country || '未知',
          region: address.region || '未知',
          city: address.city || address.subregion || '未知',
          district: address.district || address.subLocality || '未知',
          street: address.street || '未知',
          streetNumber: address.streetNumber || '',
          postalCode: address.postalCode || '',
          name: address.name || '',
          // 组合完整地址
          fullAddress: this.formatFullAddress(address),
          // 简化地址（省市区）
          simpleAddress: this.formatSimpleAddress(address),
        };

        console.log('[LocationManager] ✅ 地址信息获取成功:', addressData);
        return {
          success: true,
          data: addressData,
        };
      } else {
        console.log('[LocationManager] ⚠️ 未找到地址信息');
        return {
          success: false,
          error: '未找到地址信息',
        };
      }
    } catch (error) {
      console.error('[LocationManager] ❌ 获取地址信息失败:', error);
      return {
        success: false,
        error: error.message || '获取地址信息失败',
      };
    }
  }

  /**
   * 格式化完整地址
   * @param {Object} address - 地址对象
   * @returns {string}
   */
  formatFullAddress(address) {
    const parts = [];
    
    if (address.country) parts.push(address.country);
    if (address.region) parts.push(address.region);
    if (address.city || address.subregion) parts.push(address.city || address.subregion);
    if (address.district || address.subLocality) parts.push(address.district || address.subLocality);
    if (address.street) parts.push(address.street);
    if (address.streetNumber) parts.push(address.streetNumber);
    
    return parts.join('');
  }

  /**
   * 格式化简化地址（省市区）
   * @param {Object} address - 地址对象
   * @returns {string}
   */
  formatSimpleAddress(address) {
    const parts = [];
    
    if (address.region) parts.push(address.region);
    if (address.city || address.subregion) parts.push(address.city || address.subregion);
    if (address.district || address.subLocality) parts.push(address.district || address.subLocality);
    
    return parts.join('');
  }

  /**
   * 开始位置跟踪
   * @param {Object} options - 跟踪选项
   * @param {number} options.interval - 更新间隔（毫秒）
   * @param {number} options.accuracy - 位置精度
   * @param {Function} options.onLocationUpdate - 位置更新回调函数
   * @param {number} options.maxHistorySize - 最大历史记录数量
   * @param {boolean} options.includeAddress - 是否包含地址信息
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async startLocationTracking(options = {}) {
    console.log('[LocationManager] 🚀 开始位置跟踪...');
    
    try {
      if (this.isTracking) {
        console.log('[LocationManager] ⚠️ 位置跟踪已在运行中');
        return {
          success: false,
          error: '位置跟踪已在运行中',
        };
      }

      // 检查权限
      if (!this.hasLocationPermission) {
        console.log('[LocationManager] 🔐 位置权限未授权，尝试申请...');
        const permissionResult = await this.requestLocationPermission();
        if (!permissionResult.success) {
          console.log('[LocationManager] ❌ 位置权限申请失败');
          return {
            success: false,
            error: permissionResult.error || '位置权限被拒绝',
          };
        }
        console.log('[LocationManager] ✅ 位置权限申请成功');
      }

      const trackingOptions = {
        interval: options.interval || 5000,
        accuracy: options.accuracy || LocationAccuracy.HIGH,
        maxHistorySize: options.maxHistorySize || 20,
      };

      // 添加回调函数
      if (options.onLocationUpdate && typeof options.onLocationUpdate === 'function') {
        this.trackingCallbacks.add(options.onLocationUpdate);
      }

      this.isTracking = true;
      console.log('[LocationManager] 📊 跟踪参数:', trackingOptions);

      // 立即获取一次位置
      const initialLocation = await this.getCurrentLocation({ 
        accuracy: trackingOptions.accuracy,
        includeAddress: options.includeAddress !== false
      });
      if (initialLocation.success) {
        this.addToHistory(initialLocation.data, trackingOptions.maxHistorySize);
        this.notifyCallbacks(initialLocation.data);
      }

      // 设置定时器
      this.trackingInterval = setInterval(async () => {
        try {
          const location = await this.getCurrentLocation({ 
            accuracy: trackingOptions.accuracy,
            includeAddress: options.includeAddress !== false
          });
          if (location.success) {
            this.addToHistory(location.data, trackingOptions.maxHistorySize);
            this.notifyCallbacks(location.data);
          }
        } catch (error) {
          console.error('[LocationManager] ❌ 定时获取位置失败:', error);
        }
      }, trackingOptions.interval);

      console.log('[LocationManager] ✅ 位置跟踪已启动');
      return { success: true };
    } catch (error) {
      console.error('[LocationManager] ❌ 启动位置跟踪失败:', error);
      return {
        success: false,
        error: error.message || '启动位置跟踪失败',
      };
    }
  }

  /**
   * 停止位置跟踪
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async stopLocationTracking() {
    console.log('[LocationManager] 🛑 停止位置跟踪...');
    
    try {
      if (!this.isTracking) {
        console.log('[LocationManager] ⚠️ 位置跟踪未在运行');
        return {
          success: false,
          error: '位置跟踪未在运行',
        };
      }

      if (this.trackingInterval) {
        clearInterval(this.trackingInterval);
        this.trackingInterval = null;
      }

      this.isTracking = false;
      this.trackingCallbacks.clear();
      
      console.log('[LocationManager] ✅ 位置跟踪已停止');
      return { success: true };
    } catch (error) {
      console.error('[LocationManager] ❌ 停止位置跟踪失败:', error);
      return {
        success: false,
        error: error.message || '停止位置跟踪失败',
      };
    }
  }

  /**
   * 添加位置到历史记录
   * @param {Object} locationData - 位置数据
   * @param {number} maxSize - 最大历史记录数量
   */
  addToHistory(locationData, maxSize = 20) {
    if (!locationData) return;
    
    this.locationHistory.unshift(locationData);
    if (this.locationHistory.length > maxSize) {
      this.locationHistory = this.locationHistory.slice(0, maxSize);
    }
    
    console.log('[LocationManager] 📝 位置已添加到历史记录, 当前记录数:', this.locationHistory.length);
  }

  /**
   * 通知所有回调函数
   * @param {Object} locationData - 位置数据
   */
  notifyCallbacks(locationData) {
    this.trackingCallbacks.forEach(callback => {
      try {
        callback(locationData);
      } catch (error) {
        console.error('[LocationManager] ❌ 回调函数执行失败:', error);
      }
    });
  }

  /**
   * 获取位置历史记录
   * @param {number} limit - 限制返回的记录数量
   * @returns {Array<Object>}
   */
  getLocationHistory(limit = null) {
    if (limit && limit > 0) {
      return this.locationHistory.slice(0, limit);
    }
    return [...this.locationHistory];
  }

  /**
   * 清除位置历史记录
   * @returns {Promise<{success: boolean}>}
   */
  async clearLocationHistory() {
    console.log('[LocationManager] 🗑️ 清除位置历史记录...');
    
    try {
      this.locationHistory = [];
      this.currentLocation = null;
      
      console.log('[LocationManager] ✅ 位置历史记录已清除');
      return { success: true };
    } catch (error) {
      console.error('[LocationManager] ❌ 清除位置历史记录失败:', error);
      return {
        success: false,
        error: error.message || '清除位置历史记录失败',
      };
    }
  }

  /**
   * 获取当前位置（不更新内部状态）
   * @returns {Object|null}
   */
  getCurrentLocationData() {
    return this.currentLocation;
  }

  /**
   * 检查是否正在跟踪
   * @returns {boolean}
   */
  isLocationTracking() {
    return this.isTracking;
  }

  /**
   * 检查是否有位置权限
   * @returns {boolean}
   */
  hasLocationPermissionGranted() {
    return this.hasLocationPermission;
  }

  /**
   * 获取位置历史记录数量
   * @returns {number}
   */
  getLocationHistoryCount() {
    return this.locationHistory.length;
  }

  /**
   * 计算两个位置之间的距离（米）
   * @param {Object} location1 - 第一个位置 {latitude, longitude}
   * @param {Object} location2 - 第二个位置 {latitude, longitude}
   * @returns {number} 距离（米）
   */
  calculateDistance(location1, location2) {
    if (!location1 || !location2) return 0;
    
    const R = 6371e3; // 地球半径（米）
    const φ1 = location1.latitude * Math.PI / 180;
    const φ2 = location2.latitude * Math.PI / 180;
    const Δφ = (location2.latitude - location1.latitude) * Math.PI / 180;
    const Δλ = (location2.longitude - location1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // 距离（米）
  }

  /**
   * 格式化位置数据为可读格式
   * @param {Object} locationData - 位置数据
   * @returns {Object} 格式化后的数据
   */
  formatLocationData(locationData) {
    if (!locationData) {
      return {
        coordinates: '未知',
        accuracy: '未知',
        altitude: '未知',
        speed: '未知',
        timestamp: '未知',
      };
    }

    return {
      coordinates: `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
      accuracy: locationData.accuracy ? `${locationData.accuracy.toFixed(2)} 米` : '未知',
      altitude: locationData.altitude ? `${locationData.altitude.toFixed(2)} 米` : '未知',
      speed: locationData.speed ? `${(locationData.speed * 3.6).toFixed(2)} km/h` : '未知',
      timestamp: locationData.timestamp || '未知',
    };
  }

  /**
   * 销毁管理器，清理资源
   */
  destroy() {
    console.log('[LocationManager] 🗑️ 销毁位置管理器...');
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    
    this.isTracking = false;
    this.trackingCallbacks.clear();
    this.locationHistory = [];
    this.currentLocation = null;
    this.hasLocationPermission = false;
    this.isInitialized = false;
    
    console.log('[LocationManager] ✅ 位置管理器已销毁');
  }
}

// 导出单例实例
const locationManager = new LocationManager();
export default locationManager;
