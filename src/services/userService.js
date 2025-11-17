import api, { ApiError, UserData, getTimezone } from './api-clients/client';
import { API_ENDPOINTS } from './api/api';

// 用户服务类
class UserService {
  /**
   * 邮箱登录
   * @param {string} email - 邮箱地址
   * @param {string} password - 密码
   * @returns {Promise<UserData>} 用户数据
   */
  async loginByEmail(email, password) {
    try {
      console.log('[AuthAPI][loginByEmail] email', email, 'password', password, 'API_ENDPOINTS.AUTH.LOGIN_BY_EMAIL', API_ENDPOINTS.AUTH.LOGIN_BY_EMAIL);
      const response = await api.auth.post(API_ENDPOINTS.AUTH.LOGIN_BY_EMAIL, {
        email,
        password,
      });
      console.log('[AuthAPI][loginByEmail] response', response);
      // 将响应数据转换为UserData对象
      const userData = new UserData(response.data);
      
      return {
        success: true,
        data: userData,
        message: response.getMessage(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error : new ApiError('UNKNOWN', error.message),
        message: error instanceof ApiError ? error.message : '登录失败',
      };
    }
  }

  /**
   * 第三方登录（Google/Apple等）
   * @param {Object} thirdPartyInfo - 第三方登录信息
   * @param {string} thirdPartyInfo.thirdId - 第三方唯一ID
   * @param {string} thirdPartyInfo.email - 邮箱
   * @param {string} thirdPartyInfo.avatar - 头像URL
   * @param {string} thirdPartyInfo.source - 来源（google/apple等）
   * @param {string} thirdPartyInfo.accessToken - 访问令牌
   * @returns {Promise<UserData>} 用户数据
   */
  async loginByThird(thirdPartyInfo) {
    try {
      console.log('[AuthAPI][loginByThird] thirdPartyInfo', thirdPartyInfo);
      
      const response = await api.auth.post(API_ENDPOINTS.AUTH.LOGIN_BY_THIRD, {
        thirdId: thirdPartyInfo.thirdId,
        email: thirdPartyInfo.email,
        avatar: thirdPartyInfo.avatar,
        source: thirdPartyInfo.source,
        accessToken: thirdPartyInfo.accessToken,
        dateTime: thirdPartyInfo.dateTime,
      });
      
      console.log('[AuthAPI][loginByThird] response', response);
      
      // 将响应数据转换为UserData对象
      const userData = new UserData(response.data);
      
      return {
        success: true,
        data: userData,
        message: response.getMessage(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error : new ApiError('UNKNOWN', error.message),
        message: error instanceof ApiError ? error.message : '第三方登录失败',
      };
    }
  }

  /**
   * 邮箱注册
   * @param {string} email - 邮箱地址
   * @param {string} password - 密码
   * @param {string} username - 用户名
   * @returns {Promise<UserData>} 用户数据
   */
  async registerByEmail(email, password, username) {
    try {
      const response = await api.auth.post(API_ENDPOINTS.AUTH.REGISTER_BY_EMAIL, {
        email,
        password,
        username,
      });

      const userData = new UserData(response.data);
      
      return {
        success: true,
        data: userData,
        message: response.getMessage(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error : new ApiError('UNKNOWN', error.message),
        message: error instanceof ApiError ? error.message : '注册失败',
      };
    }
  }

  /**
   * 获取用户信息
   * @returns {Promise<UserData>} 用户数据
   */
  async getUserInfo() {
    try {
      const response = await api.post(API_ENDPOINTS.USER.INFO, { requireAuth: true });
      
      const userData = new UserData(response.data);
      
      return {
        success: true,
        data: userData,
        message: response.getMessage(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error : new ApiError('UNKNOWN', error.message),
        message: error instanceof ApiError ? error.message : '获取用户信息失败',
      };
    }
  }

  /**
   * 更新用户信息
   * @param {Object} userInfo - 用户信息
   * @returns {Promise<UserData>} 用户数据
   */
  async updateUserInfo(userInfo) {
    try {
      const response = await api.put(API_ENDPOINTS.USER.UPDATE_INFO, userInfo, { requireAuth: true });
      
      const userData = new UserData(response.data);
      
      return {
        success: true,
        data: userData,
        message: response.getMessage(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error : new ApiError('UNKNOWN', error.message),
        message: error instanceof ApiError ? error.message : '更新用户信息失败',
      };
    }
  }

  /**
   * 修改密码
   * @param {string} oldPassword - 旧密码
   * @param {string} newPassword - 新密码
   * @returns {Promise<Object>} 结果
   */
  async changePassword(oldPassword, newPassword) {
    try {
      const response = await api.put(API_ENDPOINTS.USER.CHANGE_PASSWORD, {
        oldPassword,
        newPassword,
      }, { requireAuth: true });

      return {
        success: true,
        message: response.getMessage(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error : new ApiError('UNKNOWN', error.message),
        message: error instanceof ApiError ? error.message : '修改密码失败',
      };
    }
  }

  /**
   * 退出登录
   * @returns {Promise<Object>} 结果
   */
  async logout() {
    try {
      const response = await api.auth.post(API_ENDPOINTS.AUTH.LOGOUT, {}, { requireAuth: true });
      return {
        success: true,
        message: response.getMessage(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error : new ApiError('UNKNOWN', error.message),
        message: error instanceof ApiError ? error.message : '退出登录失败',
      };
    }
  }

  /**
   * 忘记密码
   * @param {string} email - 邮箱地址
   * @returns {Promise<Object>} 结果
   */
  async forgotPassword(email) {
    try {
      const response = await api.auth.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        email,
      });

      return {
        success: true,
        message: response.getMessage(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error : new ApiError('UNKNOWN', error.message),
        message: error instanceof ApiError ? error.message : '发送重置密码邮件失败',
      };
    }
  }

  /**
   * 重置密码
   * @param {string} token - 重置token
   * @param {string} newPassword - 新密码
   * @returns {Promise<Object>} 结果
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await api.auth.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        newPassword,
      });

      return {
        success: true,
        message: response.getMessage(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error : new ApiError('UNKNOWN', error.message),
        message: error instanceof ApiError ? error.message : '重置密码失败',
      };
    }
  }

  /**
   * 获取用户状态信息（包括邀请码）
   * @returns {Promise<Object>} 状态信息，包含 invite_code 字段
   */
  async getUserStatusInfo() {
    try {
      // 获取时区，使用标准时区名称格式
      let timezone = 'string'; // 默认值
      try {
        // 尝试获取系统时区名称
        const timeZoneName = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timeZoneName) {
          timezone = timeZoneName;
        } else {
          // 如果获取不到，使用偏移量格式
          timezone = getTimezone();
        }
      } catch (error) {
        console.warn('获取时区失败，使用默认值:', error);
        timezone = getTimezone();
      }

      const response = await api.post(API_ENDPOINTS.STATUS.INFO, {
        timezone: timezone,
      }, { requireAuth: true });

      return {
        success: true,
        data: response.data,
        message: response.getMessage(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof ApiError ? error : new ApiError('UNKNOWN', error.message),
        message: error instanceof ApiError ? error.message : '获取用户状态信息失败',
      };
    }
  }
}

// 创建单例实例
const userService = new UserService();

export default userService;
