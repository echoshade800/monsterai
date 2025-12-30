// API配置文件
import storageManager from '../../utils/storage';

const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  STAGING: 'staging',
};

// 当前环境 - 通过 __DEV__ 变量判断
const CURRENT_ENV = __DEV__ ? ENV.DEVELOPMENT : ENV.PRODUCTION;

// API配置
const API_CONFIGS = {
  [ENV.DEVELOPMENT]: {
    BASE_URL: 'http://23.20.151.253:8997',
    AUTH_BASE_URL: 'http://54.80.146.38:8999',
    CDN_BASE_URL: 'https://dzdbhsix5ppsc.cloudfront.net/monster',
    AGENT_CONFIG_FILE: 'agent_list_config_debug.json',
    MINIAPP_CONFIG_FILE: 'miniapp_list_config_debug.json',
    TIMEOUT: 60000,
    HEADERS: {
      'Content-Type': 'application/json',
    },
  },
  [ENV.STAGING]: {
    BASE_URL: 'http://23.20.151.253:8998',
    AUTH_BASE_URL: 'http://54.80.146.38:8999',
    CDN_BASE_URL: 'https://dzdbhsix5ppsc.cloudfront.net/monster',
    AGENT_CONFIG_FILE: 'agent_list_config_debug.json',
    MINIAPP_CONFIG_FILE: 'miniapp_list_config_debug.json',
    TIMEOUT: 60000,
    HEADERS: {
      'Content-Type': 'application/json',
    },
  },
  [ENV.PRODUCTION]: {
    BASE_URL: 'http://23.20.151.253:8998',
    AUTH_BASE_URL: 'http://54.80.146.38:8999',
    CDN_BASE_URL: 'https://dzdbhsix5ppsc.cloudfront.net/monster',
    AGENT_CONFIG_FILE: 'agent_list_config_debug.json',
    MINIAPP_CONFIG_FILE: 'miniapp_list_config_debug.json',
    TIMEOUT: 60000,
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
    console.warn('Failed to get passId:', error);
  }
  
  return headers;
};

// 根据API类型获取正确的base URL
export const getBaseUrl = (apiType = 'default') => {
  const config = API_CONFIGS[CURRENT_ENV];
  
  switch (apiType) {
    case 'auth':
      return config.AUTH_BASE_URL;
    case 'cdn':
      return config.CDN_BASE_URL;
    case 'default':
    default:
      return config.BASE_URL;
  }
};

// 获取配置文件名称
export const getConfigFileName = (configType) => {
  const config = API_CONFIGS[CURRENT_ENV];
  
  switch (configType) {
    case 'agent':
      return config.AGENT_CONFIG_FILE;
    case 'miniapp':
      return config.MINIAPP_CONFIG_FILE;
    default:
      throw new Error(`Unknown config type: ${configType}`);
  }
};

// API端点
export const API_ENDPOINTS = {
  DATA_AGENT: {
    LAUNCH: '/data-agent/launch',
    REASONING: '/data-agent/reasoning',
    TODAY_TIME_SCHEDULE: '/data-agent/today-time-schedule/by-date',
    TODAY_TIME_LIST_SCHEDULE: '/data-agent/today-time-list-schedule/by-date',
    USER_TIME_SCHEDULE_SMART_UPDATE: '/data-agent/user-time-schedule/smart-update',
  },
  HEALTH_DATA: {
    HEARTBEAT: '/health-data/heartbeat',
  },
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
    INFO: '/user-info/info',
    UPDATE_USER_INFO: '/user-info/info',
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
    MEMORY_NEWER: '/conversation/memory/newer',
  },

  AGENT_LOG: {
    INFO: '/data-agent/agent-log/info',
  },

  STATUS: {
    INFO: '/status/info',
  },

  TODO: {
    LIST: '/todo/list',
    DONE: '/todo/done',
  },

  TIMELINE: {
    INFO: '/timeline/info',
    SWITCH: '/timeline/reminder-rules/switch',
    REMINDER: '/timeline/reminder-rules',
    REMINDER_CURRENT: '/timeline/reminder-rules/current',
    REMINDER_DONE: '/timeline/reminder-rules/done',
  },

  DEVICE_TOKEN: {
    SET: '/device-token/set',
  },

  APP_CONFIG: {
    HOME_HEADER_IMAGE: '/app-config/home/header/image',
  },
};

// 导出环境常量
export { CURRENT_ENV, ENV };
