import AsyncStorage from '@react-native-async-storage/async-storage';

// 存储键名常量
export const STORAGE_KEYS = {
  USER_DATA: 'userData',
  ACCESS_TOKEN: 'accessToken',
  DEVICE_TOKEN: 'deviceToken', // 推送通知设备 token
  // 可以添加更多存储键
  SETTINGS: 'settings',
  CACHE: 'cache',
  REMINDER_SELECTIONS: 'reminderSelections', // Reminder 选择结果
  MOBILE_DATA_UPLOAD_HISTORY: 'mobileDataUploadHistory', // 手机数据上传历史
  PENDING_PHOTO: 'pendingPhoto', // 待处理的图片信息（从相机页面返回时使用）
};

// 用户数据结构
export class UserData {
  constructor(data) {
    this.id = data.id;
    this.uid = data.uid;
    this.userName = data.userName;
    this.email = data.email;
    this.passId = data.passId;
    this.vipLevel = data.vipLevel;
    this.availableAmount = data.availableAmount;
    this.country = data.country;
    this.city = data.city;
    this.createTime = data.createTime;
    this.canSetPassword = data.canSetPassword;
    this.avatar = data.avatar;
    // 扩展字段：健康和个人信息
    this.age = data.age;
    this.gender = data.gender;
    this.height = data.height;
    this.weight = data.weight;
    this.goal = data.goal;
  }

  // 转换为普通对象
  toJSON() {
    return {
      id: this.id,
      uid: this.uid,
      userName: this.userName,
      email: this.email,
      passId: this.passId,
      vipLevel: this.vipLevel,
      availableAmount: this.availableAmount,
      country: this.country,
      city: this.city,
      createTime: this.createTime,
      canSetPassword: this.canSetPassword,
      avatar: this.avatar,
      age: this.age,
      gender: this.gender,
      height: this.height,
      weight: this.weight,
      goal: this.goal,
    };
  }

  // 从普通对象创建UserData实例
  static fromJSON(data) {
    return new UserData(data);
  }
}

// AsyncStorage 工具类
class StorageManager {
  /**
   * 存储用户数据
   * @param {UserData|Object} userData - 用户数据对象
   * @returns {Promise<boolean>} 存储是否成功
   */
  async setUserData(userData) {
    try {
      const dataToStore = userData instanceof UserData ? userData.toJSON() : userData;
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(dataToStore));
      console.log('User data stored successfully');
      return true;
    } catch (error) {
      console.error('Failed to store user data:', error);
      return false;
    }
  }

  /**
   * 获取用户数据
   * @returns {Promise<UserData|null>} 用户数据对象或null
   */
  async getUserData() {
    try {
      const userDataString = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        // 如果数据是普通对象，直接返回（保留所有字段）
        // 如果需要转换为 UserData 实例，可以使用 UserData.fromJSON(userData)
        return userData;
      }
      // 如果没有数据，返回 null
      return null;
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  }

  /**
   * 获取MiniApp数据
   * @param {string} miniAppName - MiniApp名称
   * @returns {Promise<Object|null>} MiniApp数据或null
   */
  async getMiniAppData(miniAppName) { 
    try {
      // await AsyncStorage.initializeManifestFromFile();
      console.log('getMiniAppData', miniAppName);
      const infoData = await AsyncStorage.getItem(`${miniAppName}info`);
      console.log('getMiniAppData' , `${miniAppName}info`, 'from local storage:', infoData);
      return infoData ? JSON.parse(infoData) : null;
    } catch (error) {
      console.error('Failed to get info data:', error);
      return null;
    }
  }

  /**
   * 存储MiniApp数据
   * @param {string} miniAppName - MiniApp名称
   * @param {Object} data - MiniApp数据
   * @returns {Promise<boolean>} 存储是否成功
   */
  async setMiniAppData(miniAppName, data) {
    try {
      // await AsyncStorage.initializeManifestFromFile();
      await AsyncStorage.setItem(`${miniAppName}info`, JSON.stringify(data));
      console.log('setMiniAppData' , `${miniAppName}info`, 'to local storage:', data);
      return true;
    } catch (error) {
      console.error('Failed to store MiniApp data:', error);
      return false;
    }
  }

  /**
   * 存储访问令牌
   * @param {string} token - 访问令牌
   * @returns {Promise<boolean>} 存储是否成功
   */
  async setAccessToken(token) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      console.log('Access token stored successfully');
      return true;
    } catch (error) {
      console.error('Failed to store access token:', error);
      return false;
    }
  }

  /**
   * 获取访问令牌
   * @returns {Promise<string|null>} 访问令牌或null
   */
  async getAccessToken() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      return token;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * 检查是否有访问令牌
   * @returns {Promise<boolean>} 是否有访问令牌
   */
  async hasAccessToken() {
    try {
      const token = await this.getAccessToken();
      return !!token;
    } catch (error) {
      console.error('Failed to check access token:', error);
      return false;
    }
  }

  /**
   * 清除用户数据
   * @returns {Promise<boolean>} 清除是否成功
   */
  async clearUserData() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      console.log('User data cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear user data:', error);
      return false;
    }
  }

  /**
   * 清除访问令牌
   * @returns {Promise<boolean>} 清除是否成功
   */
  async clearAccessToken() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      console.log('Access token cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear access token:', error);
      return false;
    }
  }

  /**
   * 清除所有认证相关数据
   * @returns {Promise<boolean>} 清除是否成功
   */
  async clearAuthData() {
    try {
      console.log('clearAuthData');
      await Promise.all([
        this.clearUserData(),
        this.clearAccessToken(),
      ]);
      console.log('Auth data cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear auth data:', error);
      return false;
    }
  }

  /**
   * 获取所有存储的键
   * @returns {Promise<string[]>} 所有存储的键
   */
  async getAllKeys() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys;
    } catch (error) {
      console.error('Failed to get all keys:', error);
      return [];
    }
  }

  /**
   * 获取存储信息
   * @returns {Promise<Object>} 存储信息
   */
  async getStorageInfo() {
    try {
      const keys = await this.getAllKeys();
      const userData = await this.getUserData();
      const hasToken = await this.hasAccessToken();

      return {
        totalKeys: keys.length,
        hasUserData: !!userData,
        hasAccessToken: hasToken,
        keys: keys,
      };
    } catch (error) {
      console.error('Failed to get storage info:', error);
      return {
        totalKeys: 0,
        hasUserData: false,
        hasAccessToken: false,
        keys: [],
      };
    }
  }

  /**
   * 批量存储数据
   * @param {Object} data - 要存储的数据对象
   * @returns {Promise<boolean>} 存储是否成功
   */
  async setMultiple(data) {
    try {
      const keyValuePairs = Object.entries(data).map(([key, value]) => [
        key,
        typeof value === 'object' ? JSON.stringify(value) : String(value),
      ]);
      
      await AsyncStorage.multiSet(keyValuePairs);
      console.log('Batch storage successful');
      return true;
    } catch (error) {
      console.error('Failed to batch store:', error);
      return false;
    }
  }

  /**
   * 批量获取数据
   * @param {string[]} keys - 要获取的键数组
   * @returns {Promise<Object>} 获取的数据对象
   */
  async getMultiple(keys) {
    try {
      const values = await AsyncStorage.multiGet(keys);
      const result = {};
      
      values.forEach(([key, value]) => {
        if (value !== null) {
          try {
            result[key] = JSON.parse(value);
          } catch {
            result[key] = value;
          }
        }
      });
      
      return result;
    } catch (error) {
      console.error('Failed to batch get:', error);
      return {};
    }
  }

  /**
   * 清除所有数据
   * @returns {Promise<boolean>} 清除是否成功
   */
  async clearAll() {
    try {
      await AsyncStorage.clear();
      console.log('All data cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear all data:', error);
      return false;
    }
  }

  /**
   * 通用存储方法
   * @param {string} key - 存储键
   * @param {string} value - 存储值
   * @returns {Promise<boolean>} 存储是否成功
   */
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Failed to store ${key}:`, error);
      return false;
    }
  }

  /**
   * 通用获取方法
   * @param {string} key - 存储键
   * @returns {Promise<string|null>} 存储值或null
   */
  async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error(`Failed to get ${key}:`, error);
      return null;
    }
  }

  /**
   * 通用删除方法
   * @param {string} key - 存储键
   * @returns {Promise<boolean>} 删除是否成功
   */
  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Failed to delete ${key}:`, error);
      return false;
    }
  }

  /**
   * 保存设备推送 Token
   * @param {string} deviceToken - 设备推送 Token
   * @returns {Promise<boolean>} 保存是否成功
   */
  async setDeviceToken(deviceToken) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_TOKEN, deviceToken);
      console.log('Device token saved to local storage successfully');
      return true;
    } catch (error) {
      console.error('Failed to save device token to local storage:', error);
      return false;
    }
  }

  /**
   * 获取设备推送 Token
   * @returns {Promise<string|null>} 设备推送 Token 或 null
   */
  async getDeviceToken() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_TOKEN);
      return token;
    } catch (error) {
      console.error('Failed to get device token:', error);
      return null;
    }
  }

  /**
   * 清除设备推送 Token
   * @returns {Promise<boolean>} 清除是否成功
   */
  async clearDeviceToken() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.DEVICE_TOKEN);
      console.log('Device token cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear device token:', error);
      return false;
    }
  }

  /**
   * 保存 Reminder 选择结果
   * @param {string} reminderId - Reminder 唯一标识 (messageId + index)
   * @param {string} selection - 选择结果 ('yes' | 'no')
   * @returns {Promise<boolean>} 保存是否成功
   */
  async setReminderSelection(reminderId, selection) {
    try {
      const selections = await this.getReminderSelections();
      selections[reminderId] = selection;
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDER_SELECTIONS, JSON.stringify(selections));
      console.log('Reminder selection saved:', reminderId, selection);
      return true;
    } catch (error) {
      console.error('Failed to save reminder selection:', error);
      return false;
    }
  }

  /**
   * 获取 Reminder 选择结果
   * @param {string} reminderId - Reminder 唯一标识 (messageId + index)
   * @returns {Promise<string|null>} 选择结果 ('yes' | 'no') 或 null
   */
  async getReminderSelection(reminderId) {
    try {
      const selections = await this.getReminderSelections();
      return selections[reminderId] || null;
    } catch (error) {
      console.error('Failed to get reminder selection:', error);
      return null;
    }
  }

  /**
   * 获取所有 Reminder 选择结果
   * @returns {Promise<Object>} 所有选择结果对象
   */
  async getReminderSelections() {
    try {
      const selectionsString = await AsyncStorage.getItem(STORAGE_KEYS.REMINDER_SELECTIONS);
      return selectionsString ? JSON.parse(selectionsString) : {};
    } catch (error) {
      console.error('Failed to get reminder selections:', error);
      return {};
    }
  }

  /**
   * 清除 Reminder 选择结果
   * @param {string} reminderId - Reminder 唯一标识 (可选，如果不提供则清除所有)
   * @returns {Promise<boolean>} 清除是否成功
   */
  async clearReminderSelection(reminderId) {
    try {
      if (reminderId) {
        const selections = await this.getReminderSelections();
        delete selections[reminderId];
        await AsyncStorage.setItem(STORAGE_KEYS.REMINDER_SELECTIONS, JSON.stringify(selections));
        console.log('Reminder selection cleared:', reminderId);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.REMINDER_SELECTIONS);
        console.log('All reminder selections cleared');
      }
      return true;
    } catch (error) {
      console.error('Failed to clear reminder selection:', error);
      return false;
    }
  }

  /**
   * 存储待处理的图片信息（从相机页面返回时使用）
   * @param {Object} photoData - 图片数据 { photoUri, agentId, imageDetectionType, mode, description? }
   * @returns {Promise<boolean>} 存储是否成功
   */
  async setPendingPhoto(photoData) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_PHOTO, JSON.stringify(photoData));
      console.log('Pending photo stored:', photoData);
      return true;
    } catch (error) {
      console.error('Failed to store pending photo:', error);
      return false;
    }
  }

  /**
   * 获取待处理的图片信息
   * @returns {Promise<Object|null>} 图片数据或 null
   */
  async getPendingPhoto() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_PHOTO);
      if (data) {
        const photoData = JSON.parse(data);
        console.log('Pending photo retrieved:', photoData);
        return photoData;
      }
      return null;
    } catch (error) {
      console.error('Failed to get pending photo:', error);
      return null;
    }
  }

  /**
   * 清除待处理的图片信息
   * @returns {Promise<boolean>} 清除是否成功
   */
  async clearPendingPhoto() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_PHOTO);
      console.log('Pending photo cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear pending photo:', error);
      return false;
    }
  }
}

// 创建单例实例
const storageManager = new StorageManager();

// 导出单例实例和类
export default storageManager;
export { StorageManager };
