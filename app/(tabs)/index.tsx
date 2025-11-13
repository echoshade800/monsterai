import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ConversationSection } from '../../components/ConversationSection';
import { Header } from '../../components/Header';
import { InputField } from '../../components/InputField';
import conversationService from '../../src/services/conversationService';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'timestamp';
  content: string;
  avatar?: string;
}

export default function EchoTab() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 将 API 返回的数据转换为 Message 格式
  const convertToMessages = (data: any): Message[] => {
    if (!data) return [];

    // 辅助函数：根据 is_user 字段确定消息类型
    const getMessageType = (item: any): 'user' | 'assistant' => {
      // 优先使用 is_user 字段
      if (item.is_user !== undefined) {
        return item.is_user ? 'user' : 'assistant';
      }
      // 兼容其他字段
      if (item.type === 'user' || item.type === 'assistant') {
        return item.type;
      }
      if (item.role === 'user') {
        return 'user';
      }
      // 默认为 assistant
      return 'assistant';
    };

    // 辅助函数：提取消息内容
    const getMessageContent = (item: any): string => {
      return item.content || item.text || item.message || item.msg || '';
    };

    // 辅助函数：转换单个消息项
    const convertItem = (item: any, index: number): Message => {
      const type = getMessageType(item);
      // 优先使用 _id 字段作为唯一标识
      const messageId = item._id || item.id || item.trace_id || `msg-${index}-${Date.now()}`;
      return {
        id: messageId,
        type,
        content: getMessageContent(item),
        avatar: type === 'assistant' ? '🦑' : undefined,
      };
    };
    
    // 如果返回的是消息数组
    if (Array.isArray(data)) {
      return data.map(convertItem);
    }

    // 如果返回的是包含 messages 字段的对象
    if (data.messages && Array.isArray(data.messages)) {
      return data.messages.map(convertItem);
    }

    // 如果返回的是包含 history 字段的对象
    if (data.history && Array.isArray(data.history)) {
      return data.history.map(convertItem);
    }

    // 如果返回的是包含 data 字段的数组
    if (data.data && Array.isArray(data.data)) {
      return data.data.map(convertItem);
    }

    // 如果返回的是单个消息对象
    if (data.content || data.text || data.message || data.msg) {
      return [convertItem(data, 0)];
    }

    return [];
  };

  // 获取对话历史
  const fetchConversationHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await conversationService.getConversationHistory();
      
      if (result.success && result.data) {
        const convertedMessages = convertToMessages(result.data);
        // 反转消息数组，使最旧的消息在前，最新的在后
        setMessages(convertedMessages.reverse());
      } else {
        console.error('获取对话历史失败:', result.message);
        setMessages([]);
      }
    } catch (error) {
      console.error('获取对话历史异常:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 组件挂载时获取对话历史
  useEffect(() => {
    fetchConversationHistory();
  }, [fetchConversationHistory]);

  const handleInputFocus = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const handleCollapse = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  return (
    <View style={styles.container}>
      <Header
        isCollapsed={isCollapsed}
        onCollapse={handleCollapse}
      />

      <ConversationSection messages={messages} isLoading={isLoading} />

      <InputField onFocus={handleInputFocus} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D4B8',
  },
});
