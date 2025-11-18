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
    console.log('[LocationManager] 🔍 Starting to check location service availability...');
    
    try {
      if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
        console.log('[LocationManager] ⚠️ Platform check failed: current platform is', Platform.OS, ', location service is only available on mobile devices');
        return false;
      }

      const isEnabled = await Location.hasServicesEnabledAsync();
      console.log('[LocationManager] ✅ Location service availability check completed:', isEnabled);
      return isEnabled;
    } catch (error) {
      console.error('[LocationManager] ❌ Failed to check location service availability:', error);
      return false;
    }
  }

  /**
   * 请求位置权限
   * @param {string} permissionType - 权限类型 ('foreground' 或 'background')
   * @returns {Promise<{success: boolean, status?: string, error?: string}>}
   */
  async requestLocationPermission(permissionType = 'foreground') {
    console.log('[LocationManager] 🔐 Starting to request location permission...');
    console.log('[LocationManager] 📋 Permission type:', permissionType);
    
    try {
      // 检查位置服务是否可用
      const isServiceAvailable = await this.isLocationServiceAvailable();
      if (!isServiceAvailable) {
        console.log('[LocationManager] ❌ Location service not available');
        return {
          success: false,
          error: 'Location service is not available, please enable location service in device settings',
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
      
      console.log('[LocationManager] 📊 Permission status:', permission.status);
      console.log('[LocationManager] ✅ Permission request completed:', isGranted ? 'Granted' : 'Denied');
      
      return {
        success: isGranted,
        status: permission.status,
        error: isGranted ? null : 'Location permission denied',
      };
    } catch (error) {
      console.error('[LocationManager] ❌ Failed to request location permission:', error);
      return {
        success: false,
        error: error.message || 'Failed to request location permission',
      };
    }
  }

  /**
   * 检查位置权限状态
   * @param {string} permissionType - 权限类型 ('foreground' 或 'background')
   * @returns {Promise<{success: boolean, status?: string, error?: string}>}
   */
  async checkLocationPermission(permissionType = 'foreground') {
    console.log('[LocationManager] 🔍 Checking location permission status...');
    
    try {
      let permission;
      if (permissionType === 'background') {
        permission = await Location.getBackgroundPermissionsAsync();
      } else {
        permission = await Location.getForegroundPermissionsAsync();
      }

      const isGranted = permission.status === LocationPermissionStatus.GRANTED;
      this.hasLocationPermission = isGranted;
      
      console.log('[LocationManager] 📊 Current permission status:', permission.status);
      
      return {
        success: isGranted,
        status: permission.status,
        error: isGranted ? null : 'Location permission not granted',
      };
    } catch (error) {
      console.error('[LocationManager] ❌ Failed to check location permission:', error);
      return {
        success: false,
        error: error.message || 'Failed to check location permission',
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
    console.log('[LocationManager] 📍 Starting to get current location...');
    
    try {
      // 检查权限
      if (!this.hasLocationPermission) {
        console.log('[LocationManager] 🔐 Location permission not granted, attempting to request...');
        const permissionResult = await this.requestLocationPermission();
        if (!permissionResult.success) {
          console.log('[LocationManager] ❌ Location permission request failed');
          return {
            success: false,
            error: permissionResult.error || 'Location permission denied',
          };
        }
        console.log('[LocationManager] ✅ Location permission request successful');
      }

      const locationOptions = {
        accuracy: options.accuracy || LocationAccuracy.HIGH,
        timeout: options.timeout || 15000,
        maximumAge: options.maximumAge || 10000,
      };

      console.log('[LocationManager] 📊 Location fetch parameters:', locationOptions);

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
        console.log('[LocationManager] 🏠 Starting to get address information...');
        try {
          const addressData = await this.getAddressFromCoordinates(
            locationData.latitude, 
            locationData.longitude
          );
          if (addressData.success) {
            locationData.address = addressData.data;
            console.log('[LocationManager] ✅ Address information fetched successfully:', addressData.data);
          } else {
            console.log('[LocationManager] ⚠️ Failed to get address information:', addressData.error);
            locationData.address = null;
          }
        } catch (error) {
          console.error('[LocationManager] ❌ Error getting address information:', error);
          locationData.address = null;
        }
      }

      this.currentLocation = locationData;
      console.log('[LocationManager] ✅ Current location fetched successfully:', locationData);
      
      return {
        success: true,
        data: locationData,
      };
    } catch (error) {
      console.error('[LocationManager] ❌ Failed to get current location:', error);
      return {
        success: false,
        error: error.message || 'Failed to get current location',
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
    console.log('[LocationManager] 🏠 Starting to get address information...');
    console.log('[LocationManager] 📍 Coordinates:', latitude, longitude);
    
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        const addressData = {
          country: address.country || 'Unknown',
          region: address.region || 'Unknown',
          city: address.city || address.subregion || 'Unknown',
          district: address.district || address.subLocality || 'Unknown',
          street: address.street || 'Unknown',
          streetNumber: address.streetNumber || '',
          postalCode: address.postalCode || '',
          name: address.name || '',
          // 组合完整地址
          fullAddress: this.formatFullAddress(address),
          // 简化地址（省市区）
          simpleAddress: this.formatSimpleAddress(address),
        };

        console.log('[LocationManager] ✅ Address information fetched successfully:', addressData);
        return {
          success: true,
          data: addressData,
        };
      } else {
        console.log('[LocationManager] ⚠️ Address information not found');
        return {
          success: false,
          error: 'Address information not found',
        };
      }
    } catch (error) {
      console.error('[LocationManager] ❌ Failed to get address information:', error);
      return {
        success: false,
        error: error.message || 'Failed to get address information',
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
    console.log('[LocationManager] 🚀 Starting location tracking...');
    
    try {
      if (this.isTracking) {
        console.log('[LocationManager] ⚠️ Location tracking is already running');
        return {
          success: false,
          error: 'Location tracking is already running',
        };
      }

      // 检查权限
      if (!this.hasLocationPermission) {
        console.log('[LocationManager] 🔐 Location permission not granted, attempting to request...');
        const permissionResult = await this.requestLocationPermission();
        if (!permissionResult.success) {
          console.log('[LocationManager] ❌ Location permission request failed');
          return {
            success: false,
            error: permissionResult.error || 'Location permission denied',
          };
        }
        console.log('[LocationManager] ✅ Location permission request successful');
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
      console.log('[LocationManager] 📊 Tracking parameters:', trackingOptions);

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
          console.error('[LocationManager] ❌ Failed to get location periodically:', error);
        }
      }, trackingOptions.interval);

      console.log('[LocationManager] ✅ Location tracking started');
      return { success: true };
    } catch (error) {
      console.error('[LocationManager] ❌ Failed to start location tracking:', error);
      return {
        success: false,
        error: error.message || 'Failed to start location tracking',
      };
    }
  }

  /**
   * 停止位置跟踪
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async stopLocationTracking() {
    console.log('[LocationManager] 🛑 Stopping location tracking...');
    
    try {
      if (!this.isTracking) {
        console.log('[LocationManager] ⚠️ Location tracking is not running');
        return {
          success: false,
          error: 'Location tracking is not running',
        };
      }

      if (this.trackingInterval) {
        clearInterval(this.trackingInterval);
        this.trackingInterval = null;
      }

      this.isTracking = false;
      this.trackingCallbacks.clear();
      
      console.log('[LocationManager] ✅ Location tracking stopped');
      return { success: true };
    } catch (error) {
      console.error('[LocationManager] ❌ Failed to stop location tracking:', error);
      return {
        success: false,
        error: error.message || 'Failed to stop location tracking',
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
    
    console.log('[LocationManager] 📝 Location added to history, current record count:', this.locationHistory.length);
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
        console.error('[LocationManager] ❌ Callback execution failed:', error);
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
    console.log('[LocationManager] 🗑️ Clearing location history...');
    
    try {
      this.locationHistory = [];
      this.currentLocation = null;
      
      console.log('[LocationManager] ✅ Location history cleared');
      return { success: true };
    } catch (error) {
      console.error('[LocationManager] ❌ Failed to clear location history:', error);
      return {
        success: false,
        error: error.message || 'Failed to clear location history',
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
        coordinates: 'Unknown',
        accuracy: 'Unknown',
        altitude: 'Unknown',
        speed: 'Unknown',
        timestamp: 'Unknown',
      };
    }

    return {
      coordinates: `${locationData.latitude.toFixed(6)}, ${locationData.longitude.toFixed(6)}`,
      accuracy: locationData.accuracy ? `${locationData.accuracy.toFixed(2)} m` : 'Unknown',
      altitude: locationData.altitude ? `${locationData.altitude.toFixed(2)} m` : 'Unknown',
      speed: locationData.speed ? `${(locationData.speed * 3.6).toFixed(2)} km/h` : 'Unknown',
      timestamp: locationData.timestamp || 'Unknown',
    };
  }

  /**
   * 销毁管理器，清理资源
   */
  destroy() {
    console.log('[LocationManager] 🗑️ Destroying location manager...');
    
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
    
    console.log('[LocationManager] ✅ Location manager destroyed');
  }
}

// 导出单例实例
const locationManager = new LocationManager();
export default locationManager;
