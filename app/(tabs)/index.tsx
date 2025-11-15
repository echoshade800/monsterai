
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import EventSource from 'react-native-sse';
import { ConversationSection } from '../../components/ConversationSection';
import { Header } from '../../components/Header';
import { InputField } from '../../components/InputField';
import { getAppVersion, getDeviceId, getTimezone } from '../../src/services/api-clients/client';
import { API_ENDPOINTS, getApiConfig, getHeadersWithPassId } from '../../src/services/api/api';
import conversationService from '../../src/services/conversationService';
import { executeToolFunction } from '../../src/utils/function-tools';
import storageManager from '../../src/utils/storage';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'timestamp';
  content: string;
  avatar?: string;
  photoUri?: string;
}

export default function EchoTab() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const processedPhotoRef = useRef<string | null>(null);
  const historyInitializedRef = useRef<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const apiConfig = getApiConfig();

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
      
      // 提取图片URL（支持多个字段，包括 photoUri_preview）
      const photoUri = item.image || item.imageUrl || item.image_url || item.photoUri || item.photoUri_preview || undefined;
      
      // 如果消息包含图片，记录日志
      if (photoUri) {
        console.log('转换图片消息:', {
          msg_type: item.msg_type,
          has_image: !!photoUri,
          content: getMessageContent(item),
          photoUri_preview: photoUri.length > 80 ? photoUri.substring(0, 80) + '...' : photoUri
        });
      }
      
      return {
        id: messageId,
        type,
        content: getMessageContent(item),
        avatar: type === 'assistant' ? '🦑' : undefined,
        photoUri,
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
        const historyMessages = convertedMessages.reverse();
        
        // 合并历史消息和当前消息，确保新消息在最后
        setMessages(prev => {
          // 如果已经有消息，合并而不是替换
          if (prev.length > 0) {
            // 创建一个消息ID集合，用于去重
            const existingIds = new Set(prev.map(msg => msg.id));
            // 只添加不存在的历史消息
            const newHistoryMessages = historyMessages.filter(msg => !existingIds.has(msg.id));
            // 历史消息在前（最旧在前，最新在后），新消息在后（确保最新消息在最后）
            const merged = [...newHistoryMessages, ...prev];
            console.log('合并消息:', { 
              prevCount: prev.length, 
              historyCount: historyMessages.length, 
              newCount: newHistoryMessages.length,
              mergedCount: merged.length,
              note: '历史消息在前，新消息在后，确保最新消息在最后'
            });
            return merged;
          }
          // 如果没有现有消息，直接使用历史消息
          return historyMessages;
        });
      } else {
        console.error('获取对话历史失败:', result.message);
        // 只有在没有现有消息时才清空
        setMessages(prev => prev.length > 0 ? prev : []);
      }
    } catch (error) {
      console.error('获取对话历史异常:', error);
      // 只有在没有现有消息时才清空
      setMessages(prev => prev.length > 0 ? prev : []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化用户数据（从本地存储获取真实数据）
  useEffect(() => {
    const initUserData = async () => {
      try {
        // 从本地存储获取用户数据
        const data = await storageManager.getUserData();
        
        if (data) {
          console.log('从本地存储加载用户数据:', data);
          setUserData(data);
        } else {
          console.warn('本地存储中没有用户数据，用户可能未登录');
          // 如果没有用户数据，可以跳转到登录页面
          // router.replace('/login');
        }
      } catch (error) {
        console.error('获取用户数据失败:', error);
      }
    };
    initUserData();
  }, []);

  // 组件挂载时获取对话历史（只在首次挂载且没有照片参数时获取）
  useEffect(() => {
    // 如果有照片参数，说明是拍照返回，不需要重新获取历史消息
    if (params.photoUri) {
      console.log('检测到照片参数，跳过获取历史消息，直接处理照片');
      setIsLoading(false);
      return;
    }
    
    // 如果已经初始化过，不再重复获取
    if (historyInitializedRef.current) {
      console.log('历史消息已初始化，跳过重复获取');
      setIsLoading(false);
      return;
    }
    
    // 首次挂载且没有照片参数时，获取历史消息
    historyInitializedRef.current = true;
    fetchConversationHistory();
  }, [fetchConversationHistory, params.photoUri]);

  // 生成唯一ID
  const generateTraceId = () => {
    return Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString();
  };

  // 生成消息ID
  const generateMsgId = () => {
    return Date.now().toString();
  };

  // 通用的流式响应处理函数
  const handleStreamRequest = useCallback(async (config: {
    requestBody: any;
    tempMessageId: string;
    logPrefix: string;
    onComplete?: (responseData: any, eventSource?: any) => boolean | void;
    errorMessage: string;
    silent?: boolean;
    extraHeaders?: Record<string, string>;
  }) => {
    const { requestBody, tempMessageId, logPrefix, onComplete, errorMessage, silent = false, extraHeaders = {} } = config;
    let eventSource: any = null;
    let accumulatedText = '';

    try {
      console.log(`${logPrefix}请求体:`, requestBody);

      // 合并 headers
      const baseHeaders = await getHeadersWithPassId();
      const deviceId = await getDeviceId();
      const version = getAppVersion();
      const timezone = getTimezone();

      const headers = {
        ...baseHeaders,
        'device': deviceId,
        'timezone': timezone,
        'version': version,
        ...extraHeaders,
      };

      // 创建 EventSource 实例
      eventSource = new EventSource(
        `${apiConfig.BASE_URL}${API_ENDPOINTS.CONVERSATION.STREAM}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          pollingInterval: 0,
        }
      );

      // 监听消息事件
      eventSource.addEventListener('message', (event: any) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'text_chunk') {
            accumulatedText += data.word;
            setCurrentResponse(accumulatedText);

            // 更新临时消息
            setMessages(prev => {
              const filtered = prev.filter(msg => msg.id !== tempMessageId);
              return [...filtered, {
                id: tempMessageId,
                type: 'assistant' as const,
                content: accumulatedText,
              }];
            });
          } else if (data.type === 'complete') {
            console.log(`${logPrefix}完成:`, JSON.stringify(data, null, 2));

            if (data.data?.code === 0 && data.data?.data?.[0]) {
              const responseData = data.data.data[0];

              // 调用回调处理 complete 事件
              if (onComplete) {
                const shouldContinue = onComplete(responseData, eventSource);
                if (shouldContinue === false) {
                  accumulatedText = '';
                  setCurrentResponse('');
                  setIsSending(false);
                  return;
                }
              }

              // 默认文本消息处理
              if (responseData.msg_type === 'text') {
                setMessages(prev => {
                  const filtered = prev.filter(msg => msg.id !== tempMessageId);
                  return [...filtered, {
                    id: responseData._id || Date.now().toString(),
                    type: 'assistant' as const,
                    content: responseData.text || accumulatedText,
                  }];
                });
              }
            }

            // 清理
            accumulatedText = '';
            setCurrentResponse('');
            setIsSending(false);

            if (eventSource) {
              eventSource.close();
              eventSource = null;
            }
          }
        } catch (parseError) {
          console.error(`${logPrefix}解析错误:`, parseError, '原始数据:', event.data);
        }
      });

      // 错误事件
      eventSource.addEventListener('error', (event: any) => {
        console.error(`${logPrefix}SSE 错误:`, event);

        if (event.type === 'error') {
          if (accumulatedText) {
            setMessages(prev => {
              const filtered = prev.filter(msg => msg.id !== tempMessageId);
              return [...filtered, {
                id: Date.now().toString(),
                type: 'assistant' as const,
                content: accumulatedText,
              }];
            });
          }

          if (!silent) {
            Alert.alert('错误', errorMessage);
          }

          accumulatedText = '';
          setCurrentResponse('');
          setIsSending(false);

          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
        }
      });

      // 连接打开
      eventSource.addEventListener('open', () => {
        console.log(`${logPrefix}SSE 连接已建立`);
      });

    } catch (error) {
      console.error(`${logPrefix}失败:`, error);
      if (!silent) {
        Alert.alert('错误', errorMessage);
      }

      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    }
  }, [apiConfig]);


  
  // 处理流式响应
  const handleStreamResponse = useCallback(async (userMessage: string, photoUri?: string, imageDetectionType?: string) => {
    try {
      if (!userData) {
        Alert.alert('错误', '用户信息未加载，请重试');
        return;
      }

      setIsSending(true);
      setCurrentResponse('');

      const messageTimestamp = Date.now().toString();

      // 添加用户消息（如果还没有添加的话，比如照片消息已经在useEffect中添加了）
      if (!photoUri) {
        const userMsg: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: userMessage,
        };
        setMessages(prev => [...prev, userMsg]);
      }

      // 构建请求体
      const requestBody: any = {
        uid: String(userData.uid || userData.id),
        msg_id: generateMsgId(),
        trace_id: generateTraceId(),
        timestamp: messageTimestamp,
        text: userMessage,
        system_prompt: ["you are a helpful AI assistant"],
        msg_type: photoUri ? "image" : "text",
      };
      // 如果有图片URL，添加到请求体中
      if (photoUri) {
        requestBody.image = photoUri;
        requestBody.image_detection_type = imageDetectionType || "full";
      }
      console.log('requestBody', requestBody);
      
      // 调用通用处理函数
      await handleStreamRequest({
        requestBody,
        tempMessageId: 'temp_ai_response',
        logPrefix: '普通消息',
        onComplete: (responseData, eventSource) => {
          // 检查 Function Call
          if (responseData.msg_type === 'fun_call' && responseData.call_res) {
            console.log('检测到 Function Call:', responseData.call_res);

            setMessages(prev => {
              const filtered = prev.filter(msg => msg.id !== 'temp_ai_response');
              return [...filtered, {
                id: Date.now().toString(),
                type: 'assistant' as const,
                content: `正在执行功能: ${responseData.call_res.name}...`,
              }];
            });

            if (eventSource) {
              eventSource.close();
            }

            setIsSending(false);

            handleFunctionCall(responseData.call_res).catch(error => {
              console.error('Function call 执行失败:', error);
              Alert.alert('错误', '执行功能调用时发生错误');
            });

            return false; // 停止默认处理
          }
          return true; // 继续默认处理
        },
        errorMessage: '连接中断，请重试'
      });
      
      // 注意：setIsSending(false) 现在在 handleStreamRequest 的 complete 或 error 事件中处理

    } catch (error) {
      console.error('发送消息错误:', error);
      Alert.alert('错误', '发送消息失败，请重试');
      setIsSending(false);
    }
  }, [userData, handleStreamRequest]);

  // 处理来自相机的照片
  useEffect(() => {
    if (params.photoUri && params.mode && userData) {
      const photoUri = params.photoUri as string;
      const mode = params.mode as string;
      const description = params.description as string;
      const imageDetectionType = (params.imageDetectionType as string) || 'full';
      const agentId = params.agentId as string;

      // 避免重复处理同一张照片
      if (processedPhotoRef.current === photoUri) {
        console.log('照片已处理过，跳过:', photoUri);
        return;
      }
      processedPhotoRef.current = photoUri;
      
      // 确保 isLoading 为 false，因为不重新获取历史消息
      setIsLoading(false);

      const messageId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const userMsg: Message = {
        id: messageId,
        type: 'user', 
        content: mode === 'photo-text' ? (description || '') : 'Please analyze this photo',
        photoUri: photoUri,
      };

      console.log('准备添加用户图片消息到界面:', {
        id: userMsg.id,
        type: userMsg.type,
        hasPhotoUri: !!userMsg.photoUri,
        photoUriPreview: userMsg.photoUri?.substring(0, 80),
        content: userMsg.content
      });
      
      // 使用函数式更新确保消息被正确添加
      setMessages(prev => {
        console.log('当前消息列表长度:', prev.length);
        // 检查是否已经存在相同的消息（避免重复）
        const exists = prev.some(msg => msg.id === messageId || (msg.photoUri === photoUri && msg.type === 'user'));
        if (exists) {
          console.log('消息已存在，跳过添加');
          return prev;
        }
        const newMessages = [...prev, userMsg];
        console.log('✅ 成功添加消息，更新后的消息列表长度:', newMessages.length);
        console.log('最新消息:', newMessages[newMessages.length - 1]);
        return newMessages;
      });
      
      // 根据模式设置消息文本
      const messageText = mode === 'photo-text' && description 
        ? description 
        : 'Please analyze this photo';
      
      console.log('发送图片消息:', { 
        mode, 
        description, 
        messageText, 
        photoUri, 
        imageDetectionType,
        agentId 
      });
      
      // 延迟清除 params，确保消息已经添加到状态中
      setTimeout(() => {
        // 传递图片URL和imageDetectionType给 handleStreamResponse
        handleStreamResponse(messageText, photoUri, imageDetectionType);
        
        // 处理完成后，清除 params 避免重复处理
        // 使用 router.replace 清除参数，但延迟执行确保状态已更新
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      }, 50);
    }
  }, [params.photoUri, params.mode, params.description, params.imageDetectionType, params.agentId, userData, handleStreamResponse, router]);

  // 将 function call 结果发送回服务器
  const sendFunctionCallResult = useCallback(async (callId: string, functionName: string, result: any) => {
    try {
      if (!userData) {
        Alert.alert('错误', '用户信息未加载，请重试');
        return;
      }

      console.log('发送 Function Call 结果给服务器:', { callId, functionName, result });
      const messageText = typeof result === 'string' ? result : JSON.stringify(result);

      const messageTimestamp = Date.now().toString();

      // 添加执行结果消息
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant' as const,
        content: messageText,
      }]);

      // 构建请求体
      const requestBody = {
        uid: String(userData.uid || userData.id),
        msg_id: generateMsgId(),
        trace_id: generateTraceId(),
        timestamp: messageTimestamp,
        text: messageText,
        system_prompt: ["you are a helpful AI assistant"],
        msg_type: "function_call_output",
        fun_res: {
          call_id: callId,
          name: functionName,
          output: messageText
        }
      };

      // 调用通用处理函数
      await handleStreamRequest({
        requestBody,
        tempMessageId: 'temp_function_ai_response',
        logPrefix: 'Function Call 响应',
        onComplete: () => {
          console.log('Function Call 后的 AI 回复已显示');
          return true;
        },
        errorMessage: 'Function Call 响应连接中断'
      });

    } catch (error) {
      console.error('发送 Function Call 结果失败:', error);
      Alert.alert('错误', '发送功能调用结果失败，请重试');
    }
  }, [userData, handleStreamRequest]);

  // 处理 function call
  const handleFunctionCall = useCallback(async (functionCallData: any) => {
    console.log('处理 function call:', functionCallData);

    const { name, arguments: argsString, call_id } = functionCallData;
    let args;

    // 解析参数
    try {
      args = JSON.parse(argsString);
    } catch (parseError) {
      console.error('解析参数失败:', parseError);
      const errorMessage = `参数格式错误: ${(parseError as Error).message}`;
      await sendFunctionCallResult(call_id, name, errorMessage);
      return;
    }

    console.log(`执行函数: ${name}, 参数:`, args);

    // 使用统一的工具执行器
    const executionResult = await executeToolFunction(name, args);

    console.log(`函数执行结果:`, executionResult);

    // 检查执行结果
    if (executionResult.success) {
      await sendFunctionCallResult(call_id, name, executionResult.result);
    } else {
      const errorMessage = executionResult.error || `执行函数 ${name} 时发生未知错误`;
      await sendFunctionCallResult(call_id, name, errorMessage);
    }
  }, [sendFunctionCallResult]);

  // 发送消息
  const sendMessage = useCallback((message: string) => {
    if (!message.trim() || isSending || !userData) return;
    handleStreamResponse(message.trim());
  }, [isSending, userData, handleStreamResponse]);

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

      <ConversationSection 
        messages={messages} 
        isLoading={isLoading}
        isSending={isSending}
        currentResponse={currentResponse}
      />


      <InputField
        onFocus={handleInputFocus}
        onSend={sendMessage}
        isSending={isSending}
        disabled={!userData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F9',
  },
  testButton: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  testButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
