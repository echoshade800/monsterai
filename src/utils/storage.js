import AsyncStorage from '@react-native-async-storage/async-storage';

// 存储键名常量
export const STORAGE_KEYS = {
  USER_DATA: 'userData',
  ACCESS_TOKEN: 'accessToken',
  // 可以添加更多存储键
  SETTINGS: 'settings',
  CACHE: 'cache',
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
      console.log('用户数据存储成功');
      return true;
    } catch (error) {
      console.error('存储用户数据失败:', error);
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
      console.error('获取用户数据失败:', error);
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
      console.error('存储MiniApp数据失败:', error);
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
      console.log('访问令牌存储成功');
      return true;
    } catch (error) {
      console.error('存储访问令牌失败:', error);
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
      console.error('获取访问令牌失败:', error);
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
      console.error('检查访问令牌失败:', error);
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
      console.log('用户数据清除成功');
      return true;
    } catch (error) {
      console.error('清除用户数据失败:', error);
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
      console.log('访问令牌清除成功');
      return true;
    } catch (error) {
      console.error('清除访问令牌失败:', error);
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
      console.log('认证数据清除成功');
      return true;
    } catch (error) {
      console.error('清除认证数据失败:', error);
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
      console.error('获取所有键失败:', error);
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
      console.error('获取存储信息失败:', error);
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
      console.log('批量存储成功');
      return true;
    } catch (error) {
      console.error('批量存储失败:', error);
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
      console.error('批量获取失败:', error);
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
      console.log('所有数据清除成功');
      return true;
    } catch (error) {
      console.error('清除所有数据失败:', error);
      return false;
    }
  }
}

// 创建单例实例
const storageManager = new StorageManager();

// 导出单例实例和类
export default storageManager;
export { StorageManager };
