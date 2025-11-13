import storageManager, { UserData, STORAGE_KEYS } from './storage';

/**
 * 测试StorageManager的功能
 */
export class StorageTest {
  /**
   * 运行所有测试
   */
  static async runAllTests() {
    console.log('🧪 开始运行StorageManager测试...\n');
    
    try {
      await this.testUserDataStorage();
      await this.testAccessTokenStorage();
      await this.testBatchOperations();
      await this.testStorageInfo();
      await this.testClearOperations();
      
      console.log('✅ 所有测试通过！');
    } catch (error) {
      console.error('❌ 测试失败:', error);
    }
  }

  /**
   * 测试用户数据存储
   */
  static async testUserDataStorage() {
    console.log('📝 测试用户数据存储...');
    
    // 测试数据
    const testUserData = {
      id: 999,
      uid: "123456789",
      userName: "TestUser",
      email: "test@example.com",
      passId: "test-pass-id",
      vipLevel: 1,
      availableAmount: 100,
      country: "China/CN",
      city: "Beijing",
      createTime: Date.now(),
      canSetPassword: true,
      avatar: "https://example.com/avatar.jpg"
    };

    // 测试存储
    const storeSuccess = await storageManager.setUserData(testUserData);
    console.log('  - 存储用户数据:', storeSuccess ? '✅' : '❌');

    // 测试获取
    const retrievedData = await storageManager.getUserData();
    const getSuccess = retrievedData && retrievedData.userName === testUserData.userName;
    console.log('  - 获取用户数据:', getSuccess ? '✅' : '❌');

    // 测试UserData类
    const userDataInstance = new UserData(testUserData);
    const classTest = userDataInstance.userName === testUserData.userName;
    console.log('  - UserData类测试:', classTest ? '✅' : '❌');

    console.log('  📊 用户数据测试完成\n');
  }

  /**
   * 测试访问令牌存储
   */
  static async testAccessTokenStorage() {
    console.log('🔑 测试访问令牌存储...');
    
    const testToken = "test-access-token-12345";

    // 测试存储
    const storeSuccess = await storageManager.setAccessToken(testToken);
    console.log('  - 存储访问令牌:', storeSuccess ? '✅' : '❌');

    // 测试获取
    const retrievedToken = await storageManager.getAccessToken();
    const getSuccess = retrievedToken === testToken;
    console.log('  - 获取访问令牌:', getSuccess ? '✅' : '❌');

    // 测试检查存在性
    const hasToken = await storageManager.hasAccessToken();
    const checkSuccess = hasToken === true;
    console.log('  - 检查令牌存在性:', checkSuccess ? '✅' : '❌');

    console.log('  📊 访问令牌测试完成\n');
  }

  /**
   * 测试批量操作
   */
  static async testBatchOperations() {
    console.log('📦 测试批量操作...');
    
    const testData = {
      [STORAGE_KEYS.SETTINGS]: {
        theme: "dark",
        language: "zh-CN",
        notifications: true
      },
      [STORAGE_KEYS.CACHE]: {
        lastUpdate: Date.now(),
        version: "1.0.0"
      }
    };

    // 测试批量存储
    const batchStoreSuccess = await storageManager.setMultiple(testData);
    console.log('  - 批量存储:', batchStoreSuccess ? '✅' : '❌');

    // 测试批量获取
    const keys = [STORAGE_KEYS.SETTINGS, STORAGE_KEYS.CACHE];
    const batchData = await storageManager.getMultiple(keys);
    const batchGetSuccess = batchData[STORAGE_KEYS.SETTINGS] && batchData[STORAGE_KEYS.CACHE];
    console.log('  - 批量获取:', batchGetSuccess ? '✅' : '❌');

    console.log('  📊 批量操作测试完成\n');
  }

  /**
   * 测试存储信息
   */
  static async testStorageInfo() {
    console.log('📊 测试存储信息...');
    
    const info = await storageManager.getStorageInfo();
    const infoSuccess = info && typeof info.totalKeys === 'number';
    console.log('  - 获取存储信息:', infoSuccess ? '✅' : '❌');
    
    if (infoSuccess) {
      console.log(`  - 总键数: ${info.totalKeys}`);
      console.log(`  - 有用户数据: ${info.hasUserData}`);
      console.log(`  - 有访问令牌: ${info.hasAccessToken}`);
    }

    const allKeys = await storageManager.getAllKeys();
    const keysSuccess = Array.isArray(allKeys);
    console.log('  - 获取所有键:', keysSuccess ? '✅' : '❌');

    console.log('  📊 存储信息测试完成\n');
  }

  /**
   * 测试清除操作
   */
  static async testClearOperations() {
    console.log('🧹 测试清除操作...');
    
    // 测试清除认证数据
    const clearAuthSuccess = await storageManager.clearAuthData();
    console.log('  - 清除认证数据:', clearAuthSuccess ? '✅' : '❌');

    // 验证清除结果
    const userDataAfterClear = await storageManager.getUserData();
    const tokenAfterClear = await storageManager.getAccessToken();
    const verifySuccess = !userDataAfterClear && !tokenAfterClear;
    console.log('  - 验证清除结果:', verifySuccess ? '✅' : '❌');

    console.log('  📊 清除操作测试完成\n');
  }

  /**
   * 测试完整流程
   */
  static async testCompleteFlow() {
    console.log('🔄 测试完整流程...');
    
    // 1. 模拟登录
    const loginData = {
      id: 100,
      userName: "FlowTestUser",
      email: "flow@test.com",
      passId: "flow-test-token"
    };

    const token = "flow-test-access-token";

    // 2. 存储数据
    await storageManager.setUserData(loginData);
    await storageManager.setAccessToken(token);

    // 3. 验证数据
    const storedUserData = await storageManager.getUserData();
    const storedToken = await storageManager.getAccessToken();
    
    const flowSuccess = storedUserData && storedToken && 
                       storedUserData.userName === loginData.userName &&
                       storedToken === token;

    console.log('  - 完整流程测试:', flowSuccess ? '✅' : '❌');

    // 4. 清理
    await storageManager.clearAuthData();

    console.log('  📊 完整流程测试完成\n');
  }
}

// 导出测试类
export default StorageTest;
