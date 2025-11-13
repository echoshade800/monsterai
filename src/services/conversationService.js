import api from './api-clients/client';
import { API_ENDPOINTS } from './api/api';

// 对话服务类
class ConversationService {
  /**
   * 获取对话历史信息
   * @returns {Promise<Object>} 对话历史数据
   */
  async getConversationHistory() {
    try {
      console.log('[ConversationService][getConversationHistory] 开始获取对话历史');

      // 使用 GET 请求，不需要 body
      // Headers 会自动通过 api.get 方法添加（device, timezone, version, passId）
      const response = await api.get(API_ENDPOINTS.CONVERSATION.HISTORY_INFO);
      
      console.log('[ConversationService][getConversationHistory] response', response);

      return {
        success: true,
        data: response.data,
        message: response.getMessage(),
      };
    } catch (error) {
      console.error('[ConversationService][getConversationHistory] error', error);
      return {
        success: false,
        error: error,
        message: error.message || '获取对话历史失败',
      };
    }
  }
}

// 创建单例实例
const conversationService = new ConversationService();

export default conversationService;

