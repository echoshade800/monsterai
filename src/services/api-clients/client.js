import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import packageJson from '../../../package.json';
import Logger from '../../utils/logger';
import { getApiConfig, getBaseUrl, getHeadersWithPassId } from '../api/api';
import { authApi } from './auth';

// API基础配置
const API_CONFIG = getApiConfig();

// 请求状态码
export const API_STATUS = {
  SUCCESS: 'A0000',
  ERROR: 'A0001',
  UNAUTHORIZED: 'A0002',
  FORBIDDEN: 'A0003',
  NOT_FOUND: 'A0004',
  SERVER_ERROR: 'A0005',
};

// 响应数据结构
export class ApiResponse {
  constructor(code, msg, data) {
    this.code = code;
    this.msg = msg;
    this.data = data;
  }

  isSuccess() {
    return this.code === API_STATUS.SUCCESS;
  }

  getMessage() {
    return this.msg || 'Request failed';
  }
}

// 用户数据结构
export class UserData {
  constructor(data) {
    this.id = data.id;
    this.uid = data.uid;
    this.userName = data.userName;
    this.email = data.email;
    this.avatar = data.avatar;
    this.vipLevel = data.vipLevel;
    this.passId = data.passId;
    this.availableAmount = data.availableAmount;
    this.country = data.country;
    this.city = data.city;
    this.createTime = data.createTime;
    this.canSetPassword = data.canSetPassword;
    // Profile fields
    this.gender = data.gender;
    this.height = data.height;
    this.weight = data.weight;
    this.age = data.age;
    this.activityLevel = data.activityLevel;
    this.dietPreference = data.dietPreference;
    this.goalWeight = data.goalWeight;
  }
}

// 自定义错误类
export class ApiError extends Error {
  constructor(code, message, data = null, url = null, method = null, status = null) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = 'ApiError';
    this.url = url;
    this.method = method;
    this.status = status;
    this.timestamp = new Date().toISOString();
    
    // 创建更详细的错误消息
    let detailedMessage = `[${code}] ${message}`;
    if (url) {
      detailedMessage += `\nURL: ${method || 'GET'} ${url}`;
    }
    if (status) {
      detailedMessage += `\nHTTP Status: ${status}`;
    }
    if (data) {
      try {
        detailedMessage += `\nResponse Data: ${JSON.stringify(data, null, 2)}`;
      } catch (e) {
        detailedMessage += `\nResponse Data: ${String(data)}`;
      }
    }
    this.detailedMessage = detailedMessage;
  }
  
  // 获取详细的错误信息
  getDetailedMessage() {
    return this.detailedMessage;
  }
  
  // 获取错误摘要（用于日志）
  getSummary() {
    // 安全地序列化 data，避免循环引用或不可序列化的对象
    let safeData = null;
    if (this.data !== null && this.data !== undefined) {
      try {
        // 尝试序列化，如果失败则使用字符串表示
        JSON.stringify(this.data);
        safeData = this.data;
      } catch (e) {
        // 如果序列化失败，尝试提取基本信息
        try {
          if (typeof this.data === 'object') {
            safeData = {
              _error: 'Data cannot be serialized',
              _type: typeof this.data,
              _constructor: this.data.constructor?.name || 'Unknown',
              _keys: Object.keys(this.data).slice(0, 10), // 只取前10个键
            };
          } else {
            safeData = String(this.data);
          }
        } catch (e2) {
          safeData = '[Unable to serialize error data]';
        }
      }
    }
    
    return {
      code: this.code,
      message: this.message,
      url: this.url,
      method: this.method,
      status: this.status,
      timestamp: this.timestamp,
      data: safeData,
    };
  }
}

// 获取认证token（从auth模块导入）
const getAuthToken = authApi.getToken;

// 获取设备ID（UUID）
const getDeviceId = async () => {
  try {
    let deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = uuid.v4();
      await AsyncStorage.setItem('deviceId', deviceId);
      console.log('Generated new device ID:', deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Failed to get device ID:', error);
    return uuid.v4(); // 如果获取失败，返回临时UUID
  }
};

// 获取系统时区
const getTimezone = () => {
  try {
    const timezoneOffset = new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(timezoneOffset) / 60);
    const sign = timezoneOffset <= 0 ? '+' : '-';
    return `${sign}${hours}`;
  } catch (error) {
    console.error('Failed to get timezone:', error);
    return '+8'; // 默认返回 +8
  }
};

// 获取应用版本
const getAppVersion = () => {
  return packageJson.version || '1.0.0';
};

// 隐藏敏感信息的 header 值
const shouldHideHeaderValue = (key) => {
  const sensitiveKeys = ['authorization', 'cookie', 'x-api-key', 'x-auth-token', 'token', 'password', 'secret'];
  return sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey));
};

// 格式化 headers 为字符串
const formatHeaders = (headers) => {
  if (!headers || Object.keys(headers).length === 0) {
    return '';
  }
  const headerLines = Object.keys(headers)
    .sort()
    .map(key => {
      const value = shouldHideHeaderValue(key) ? '***' : headers[key];
      return `   ${key}: ${value}`;
    });
  return headerLines.join('\n');
};

// 格式化响应头为字符串
const formatResponseHeaders = (headers) => {
  if (!headers) {
    return '';
  }
  // Headers 可能是 Headers 对象或普通对象
  const headerObj = {};
  if (headers.forEach) {
    // Headers 对象
    headers.forEach((value, key) => {
      headerObj[key] = value;
    });
  } else {
    // 普通对象
    Object.assign(headerObj, headers);
  }
  
  if (Object.keys(headerObj).length === 0) {
    return '';
  }
  
  const headerLines = Object.keys(headerObj)
    .sort()
    .map(key => `   ${key}: ${headerObj[key]}`);
  return headerLines.join('\n');
};

// 格式化 body 为字符串（原样输出，不截断）
const formatBody = (body) => {
  if (!body) {
    return '';
  }
  
  let bodyStr = '';
  try {
    if (typeof body === 'string') {
      // 尝试解析为 JSON
      try {
        const parsed = JSON.parse(body);
        bodyStr = JSON.stringify(parsed, null, 2);
      } catch (e) {
        bodyStr = body;
      }
    } else {
      bodyStr = JSON.stringify(body, null, 2);
    }
  } catch (e) {
    bodyStr = String(body);
  }
  
  return bodyStr;
};

// 格式化响应数据为字符串（原样输出，不截断）
const formatResponseData = (data) => {
  if (!data) {
    return '[空]';
  }
  
  let dataStr = '';
  try {
    dataStr = JSON.stringify(data, null, 2);
  } catch (e) {
    dataStr = String(data);
  }
  
  return dataStr;
};

// 记录网络请求日志
const logNetworkRequest = (url, method, headers, body) => {
  try {
    const timestamp = new Date().toISOString();
    let logMessage = '\n';
    logMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    logMessage += `📤 [网络请求 - RN] ${timestamp}\n`;
    logMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    logMessage += `📍 URL: ${url}\n`;
    logMessage += `🔧 Method: ${method}\n`;
    
    const headersStr = formatHeaders(headers);
    if (headersStr) {
      logMessage += `📋 Headers:\n${headersStr}\n`;
    }
    
    const bodyStr = formatBody(body);
    if (bodyStr) {
      logMessage += `📦 Body (JSON):\n${bodyStr}\n`;
    }
    
    logMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    
    Logger.info(logMessage);
  } catch (e) {
    // 如果日志记录失败，不影响请求
    console.error('Failed to log network request:', e);
  }
};

// 记录网络响应日志
const logNetworkResponse = (url, method, statusCode, headers, data) => {
  try {
    const timestamp = new Date().toISOString();
    let logMessage = '\n';
    logMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    logMessage += `📥 [网络响应 - RN] ${timestamp}\n`;
    logMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    logMessage += `📍 URL: ${url}\n`;
    logMessage += `🔧 Method: ${method}\n`;
    logMessage += `📊 Status Code: ${statusCode}\n`;
    
    const headersStr = formatResponseHeaders(headers);
    if (headersStr) {
      logMessage += `📋 Response Headers:\n${headersStr}\n`;
    }
    
    const dataStr = formatResponseData(data);
    logMessage += `📦 Response Body (JSON):\n${dataStr}\n`;
    
    logMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    
    Logger.info(logMessage);
  } catch (e) {
    // 如果日志记录失败，不影响响应处理
    console.error('Failed to log network response:', e);
  }
};

// 记录网络错误日志
const logNetworkError = (url, method, statusCode, headers, errorData, errorMessage) => {
  try {
    const timestamp = new Date().toISOString();
    let logMessage = '\n';
    logMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    logMessage += `❌ [网络错误 - RN] ${timestamp}\n`;
    logMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    logMessage += `📍 URL: ${url}\n`;
    logMessage += `🔧 Method: ${method}\n`;
    
    if (statusCode) {
      logMessage += `📊 Status Code: ${statusCode}\n`;
    }
    
    if (headers) {
      const headersStr = formatResponseHeaders(headers);
      if (headersStr) {
        logMessage += `📋 Response Headers:\n${headersStr}\n`;
      }
    }
    
    logMessage += `⚠️ Error: ${errorMessage}\n`;
    
    if (errorData) {
      const errorDataStr = formatResponseData(errorData);
      logMessage += `📦 Error Data:\n${errorDataStr}\n`;
    }
    
    logMessage += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    
    Logger.error(logMessage);
  } catch (e) {
    // 如果日志记录失败，不影响错误处理
    console.error('Failed to log network error:', e);
  }
};

// 基础请求方法
const request = async (url, options = {}) => {
  const {
    method = 'GET',
    body,
    headers = {},
    timeout = API_CONFIG.TIMEOUT,
    requireAuth = false,
    apiType = 'default', // 新增：API类型，默认为'default'
  } = options;
  
  // 根据API类型获取正确的base URL
  const baseUrl = getBaseUrl(apiType);
  const fullUrl = `${baseUrl}${url}`;
  if (__DEV__) {
    console.log('request url', fullUrl);
  }

  // 获取通用请求头所需的数据
  const deviceId = await getDeviceId();
  const timezone = getTimezone();
  const version = getAppVersion();
  
  // 获取包含 passId 的基础 headers
  const baseHeaders = await getHeadersWithPassId();

  // 构建通用请求头
  const commonHeaders = {
    'device': deviceId,
    'timezone': timezone,
    'version': version,
  };

  // 构建请求配置
  const requestConfig = {
    method,
    headers: {
      ...baseHeaders,
      ...commonHeaders,
      ...headers, // 用户自定义的头部优先级最高
    },
  };

  // 添加请求体
  // 注意：虽然 GET 请求通常不应该有 body，但某些 API 可能需要
  if (body) {
    if (method === 'GET') {
      // 对于 GET 请求，将 body 作为查询参数或特殊处理
      // 这里我们仍然尝试添加 body（某些服务器可能支持）
      requestConfig.body = JSON.stringify(body);
    } else {
      requestConfig.body = JSON.stringify(body);
    }
  }

  // 添加认证头
  if (requireAuth) {
    const token = await getAuthToken();
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    // 创建超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new ApiError('TIMEOUT', 'Request timeout')), timeout);
    });

    // 记录网络请求日志到文件
    logNetworkRequest(fullUrl, method, requestConfig.headers, requestConfig.body);

    // 美化日志输出（仅在开发环境）
    if (__DEV__) {
      console.group(`📤 API Request [${method}]`);
      console.log('URL:', fullUrl);
      if (requestConfig.headers && Object.keys(requestConfig.headers).length > 0) {
        console.log('Headers:', JSON.stringify(requestConfig.headers, null, 2));
      }
      if (requestConfig.body) {
        try {
          const bodyObj = typeof requestConfig.body === 'string'
            ? JSON.parse(requestConfig.body)
            : requestConfig.body;
          console.log('Body:', JSON.stringify(bodyObj, null, 2));
        } catch (e) {
          console.log('Body:', requestConfig.body);
        }
      }
      console.groupEnd();
    }

    // 发起请求
    const responsePromise = fetch(fullUrl, requestConfig);
    
    const response = await Promise.race([responsePromise, timeoutPromise]);

    // 检查HTTP状态码
    if (!response.ok) {
      // 尝试读取响应体以获取更详细的错误信息
      let errorData = null;
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
          errorMessage = errorData.msg || errorData.message || errorMessage;
          if (__DEV__) {
            console.error('HTTP Error Response:', {
              status: response.status,
              statusText: response.statusText,
              url: `${baseUrl}${url}`,
              responseData: errorData,
            });
          }
        } else {
          const textData = await response.text();
          if (__DEV__) {
            console.error('HTTP Error Response (text):', {
              status: response.status,
              statusText: response.statusText,
              url: `${baseUrl}${url}`,
              responseText: textData,
            });
          }
          errorData = { raw: textData };
        }
      } catch (parseError) {
        if (__DEV__) {
          console.error('Failed to parse error response:', parseError);
        }
      }
      
      const apiError = new ApiError(
        response.status.toString(),
        errorMessage,
        errorData,
        fullUrl,
        method,
        response.status
      );
      
      // 记录错误响应日志到文件
      logNetworkError(fullUrl, method, response.status, response.headers, errorData, errorMessage);
      
      throw apiError;
    }

    // 解析响应数据
    const responseData = await response.json();
    
    // 记录网络响应日志到文件
    logNetworkResponse(fullUrl, method, response.status, response.headers, responseData);
    
    if (__DEV__) {
      console.log('responseData', responseData);
    }
    
    // 检查业务状态码
    // 支持多种格式：
    // 1. {code: "A0000", msg: "...", data: ...}
    // 2. {code: 0, msg: "...", data: ...} - code 为 0 也表示成功
    // 3. {msg: "succ", data: ...} - 如果 msg 是 "succ" 也认为是成功
    // 4. {msg: "success", data: ...} - 如果 msg 是 "success" 也认为是成功
    const isSuccess = responseData.code === API_STATUS.SUCCESS || 
                      responseData.code === 0 ||
                      responseData.msg === 'succ' || 
                      responseData.msg === 'success';
    
    if (!isSuccess) {
      if (__DEV__) {
        console.error('Business Error Response:', {
          url: `${baseUrl}${url}`,
          code: responseData.code,
          msg: responseData.msg,
          data: responseData.data,
          fullResponse: responseData,
        });
      }
      const apiError = new ApiError(
        responseData.code || 'UNKNOWN',
        responseData.msg || 'Request failed',
        responseData.data,
        fullUrl,
        method,
        null
      );
      
      // 记录业务错误日志到文件
      logNetworkError(fullUrl, method, null, null, responseData, responseData.msg || 'Request failed');
      
      throw apiError;
    }

    // 如果没有 code 字段，使用默认的成功码
    const code = responseData.code || API_STATUS.SUCCESS;
    return new ApiResponse(code, responseData.msg, responseData.data);
  } catch (error) {
    if (error instanceof ApiError) {
      // 如果是 ApiError，确保包含 URL 和 method 信息（如果还没有）
      if (!error.url) {
        error.url = fullUrl;
      }
      if (!error.method) {
        error.method = method;
      }
      throw error;
    }
    
    // 网络错误或其他错误 - 添加更详细的错误信息
    const errorMessage = error.message || 'Network request failed';
    const errorStack = error.stack || '';
    const errorName = error.name || 'UnknownError';
    
    // 构建详细的错误数据
    const errorData = {
      originalError: {
        name: errorName,
        message: errorMessage,
        stack: errorStack,
      },
      requestInfo: {
        url: fullUrl,
        method: method,
        headers: requestConfig.headers,
        body: requestConfig.body,
      },
    };
    
    // 记录网络错误日志到文件
    logNetworkError(fullUrl, method, null, null, errorData, `${errorName}: ${errorMessage}`);
    
    if (__DEV__) {
      console.error('Network/Request Error Details:', {
        errorName,
        errorMessage,
        url: fullUrl,
        method: method,
        errorStack: errorStack.split('\n').slice(0, 5).join('\n'), // 只显示前5行堆栈
      });
    }
    
    throw new ApiError(
      'NETWORK_ERROR',
      `${errorName}: ${errorMessage}`,
      errorData,
      fullUrl,
      method,
      null
    );
  }
};

// API方法封装
export const api = {
  // GET请求
  get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
  
  // POST请求
  post: (url, data, options = {}) => request(url, { ...options, method: 'POST', body: data }),
  
  // PUT请求
  put: (url, data, options = {}) => request(url, { ...options, method: 'PUT', body: data }),
  
  // DELETE请求
  delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),
  
  // 认证相关API方法
  auth: {
    // GET请求
    get: (url, options = {}) => request(url, { ...options, method: 'GET', apiType: 'auth' }),
    
    // POST请求
    post: (url, data, options = {}) => request(url, { ...options, method: 'POST', body: data, apiType: 'auth' }),
    
    // PUT请求
    put: (url, data, options = {}) => request(url, { ...options, method: 'PUT', body: data, apiType: 'auth' }),
    
    // DELETE请求
    delete: (url, options = {}) => request(url, { ...options, method: 'DELETE', apiType: 'auth' }),
  }
};

// 导出认证API（从auth模块导入）
export { authApi };

export default api;
export { getAppVersion, getDeviceId, getTimezone };
