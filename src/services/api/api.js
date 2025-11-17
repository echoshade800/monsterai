  
// API配置文件
const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging',
};
import storageManager from '../../utils/storage';

// 当前环境 - 通过 __DEV__ 变量判断
const CURRENT_ENV = __DEV__ ? ENV.DEVELOPMENT : ENV.PRODUCTION;

// API配置
const API_CONFIGS = {
  [ENV.DEVELOPMENT]: {
    BASE_URL: 'http://23.20.151.253:8997',
    AUTH_BASE_URL: 'http://54.80.146.38:8999',
    TIMEOUT: 10000,
    HEADERS: {
      'Content-Type': 'application/json',
    },
  },
  [ENV.STAGING]: {
    BASE_URL: 'http://23.20.151.253:8998',
    AUTH_BASE_URL: 'http://54.80.146.38:8999',
    TIMEOUT: 10000,
    HEADERS: {
      'Content-Type': 'application/json',
    },
  },
  [ENV.PRODUCTION]: {
    BASE_URL: 'http://23.20.151.253:8998',
    AUTH_BASE_URL: 'http://54.80.146.38:8999',
    TIMEOUT: 10000,
    HEADERS: {
      'Content-Type': 'application/json',
    },
  },
};

// 获取当前环境的配置
export const getApiConfig = () => {
  const config = API_CONFIGS[CURRENT_ENV];
  
  // 返回配置对象，HEADERS 包含基础 headers
  // 注意：passId 需要通过 getHeadersWithPassId 异步获取
  return {
    ...config,
    HEADERS: {
      ...config.HEADERS,
    },
  };
};

// 异步获取包含 passId 的 headers
export const getHeadersWithPassId = async () => {
  const config = getApiConfig();
  const headers = { ...config.HEADERS };
  
  try {
    // 动态导入 storageManager 避免循环依赖
    const userData = await storageManager.getUserData();
    if (userData && userData.passId) {
      headers.passId = userData.passId;
    }
  } catch (error) {
    console.warn('获取 passId 失败:', error);
  }
  
  return headers;
};

// 根据API类型获取正确的base URL
export const getBaseUrl = (apiType = 'default') => {
  const config = API_CONFIGS[CURRENT_ENV];
  
  switch (apiType) {
    case 'auth':
      return config.AUTH_BASE_URL;
    case 'default':
    default:
      return config.BASE_URL;
  }
};

// API端点
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN_BY_EMAIL: '/login/by/email',
    LOGIN_BY_THIRD: '/login/by/third',
    REGISTER_BY_EMAIL: '/register/by/email',
    LOGOUT: '/logout',
    FORGOT_PASSWORD: '/forgot/password',
    RESET_PASSWORD: '/reset/password',
  },

  // MiniApp 
  MINI_APP: {
    GET_DATA: '/mini/app/get/data',
    UPDATE_DATA: '/mini/app/update/data',
    GET_DATA_ALL: '/mini/app/get/data/all',
  },
  
  // 用户相关
  USER: {
    INFO: '/user/get/user/info',
    UPDATE_INFO: '/user/info',
    CHANGE_PASSWORD: '/user/password',
    DELETE_ACCOUNT: '/user-info/account',
  },
  
  LIFE_HISTORY: {
    SAVE: '/health-data/save',
  },

  CONVERSATION: {
    STREAM: '/conversation/stream',
    HISTORY: '/conversation/history',
    HISTORY_INFO: '/conversation/history/info',
  },

  AGENT_LOG: {
    INFO: '/data-agent/agent-log/info',
  },
};

// 导出环境常量
export { CURRENT_ENV, ENV };
