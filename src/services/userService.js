import api, { UserData, ApiError } from './api-clients/client';
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
}

// 创建单例实例
const userService = new UserService();

export default userService;
