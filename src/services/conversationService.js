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
      console.log('[ConversationService][getConversationHistory] Starting to fetch conversation history');

      // 构建 URL，添加 limit=200 查询参数
      const url = `${API_ENDPOINTS.CONVERSATION.HISTORY_INFO}?limit=200`;
      
      // 使用 GET 请求，不需要 body
      // Headers 会自动通过 api.get 方法添加（device, timezone, version, passId）
      const response = await api.get(url);
      
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
        message: error.message || 'Failed to fetch conversation history',
      };
    }
  }

  /**
   * 获取 memory 列表
   * @param {Object} params - 查询参数
   * @param {number} params.limit - 返回数量限制，默认 20
   * @param {string} params.memory_id - 最新的 memory id，用于获取比该 id 更新的 memory
   * @returns {Promise<Object>} memory 列表数据
   */
  async getMemoryList(params = {}) {
    try {
      console.log('[ConversationService][getMemoryList] Starting to fetch memory list', params);

      const { limit = 20, memory_id } = params;
      let url = `${API_ENDPOINTS.CONVERSATION.MEMORY_NEWER}?limit=${limit}`;
      
      // 如果提供了 memory_id，添加到查询参数中
      if (memory_id) {
        url += `&memory_id=${encodeURIComponent(memory_id)}`;
      }

      // 使用 GET 请求
      // Headers 会自动通过 api.get 方法添加（device, timezone, version, passId）
      const response = await api.get(url);
      
      console.log('[ConversationService][getMemoryList] response', response);

      return {
        success: true,
        data: response.data,
        message: response.getMessage(),
      };
    } catch (error) {
      console.error('[ConversationService][getMemoryList] error', error);
      return {
        success: false,
        error: error,
        message: error.message || 'Failed to fetch memory list',
      };
    }
  }
}

// 创建单例实例
const conversationService = new ConversationService();

export default conversationService;

