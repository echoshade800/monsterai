import AsyncStorage from '@react-native-async-storage/async-storage';

// 获取认证token
const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('accessToken');
  } catch (error) {
    console.error('获取token失败:', error);
    return null;
  }
};

// 设置认证token
const setAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem('accessToken', token);
  } catch (error) {
    console.error('设置token失败:', error);
  }
};

// 清除认证token
const clearAuthToken = async () => {
  try {
    await AsyncStorage.removeItem('accessToken');
  } catch (error) {
    console.error('清除token失败:', error);
  }
};

// 认证相关方法
export const authApi = {
  // 获取token
  getToken: getAuthToken,
  
  // 设置token
  setToken: setAuthToken,
  
  // 清除token
  clearToken: clearAuthToken,
  
  // 检查是否有token
  hasToken: async () => {
    const token = await getAuthToken();
    return !!token;
  },
};

export default authApi;
