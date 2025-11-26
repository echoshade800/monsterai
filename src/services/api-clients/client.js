import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import packageJson from '../../../package.json';
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
  }
}

// 自定义错误类
export class ApiError extends Error {
  constructor(code, message, data = null) {
    super(message);
    this.code = code;
    this.data = data;
    this.name = 'ApiError';
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
  console.log('request url', `${baseUrl}${url}`);

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

    // 美化日志输出
    console.group(`📤 API Request [${method}]`);
    console.log('URL:', `${baseUrl}${url}`);
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

    // 发起请求
    const responsePromise = fetch(`${baseUrl}${url}`, requestConfig);
    
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
          console.error('HTTP Error Response:', {
            status: response.status,
            statusText: response.statusText,
            url: `${baseUrl}${url}`,
            responseData: errorData,
          });
        } else {
          const textData = await response.text();
          console.error('HTTP Error Response (text):', {
            status: response.status,
            statusText: response.statusText,
            url: `${baseUrl}${url}`,
            responseText: textData,
          });
          errorData = { raw: textData };
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
      }
      
      throw new ApiError(
        response.status.toString(),
        errorMessage,
        errorData
      );
    }

    // 解析响应数据
    const responseData = await response.json();
    console.log('responseData', responseData);
    
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
      console.error('Business Error Response:', {
        url: `${baseUrl}${url}`,
        code: responseData.code,
        msg: responseData.msg,
        data: responseData.data,
        fullResponse: responseData,
      });
      throw new ApiError(
        responseData.code || 'UNKNOWN',
        responseData.msg || 'Request failed',
        responseData.data
      );
    }

    // 如果没有 code 字段，使用默认的成功码
    const code = responseData.code || API_STATUS.SUCCESS;
    return new ApiResponse(code, responseData.msg, responseData.data);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // 网络错误或其他错误
    throw new ApiError('NETWORK_ERROR', error.message || 'Network request failed');
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
