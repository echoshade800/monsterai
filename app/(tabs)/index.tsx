
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, View } from 'react-native';
import EventSource from 'react-native-sse';
import { ConversationSection } from '../../components/ConversationSection';
import { Header } from '../../components/Header';
import { InputField } from '../../components/InputField';
import { AGENTS } from '../../components/MentionSelector';
import api, { getAppVersion, getDeviceId, getTimezone } from '../../src/services/api-clients/client';
import { API_ENDPOINTS, CURRENT_ENV, ENV, getApiConfig, getHeadersWithPassId } from '../../src/services/api/api';
import conversationService from '../../src/services/conversationService';
import calendarManager from '../../src/utils/calendar-manager';
import { executeToolFunction } from '../../src/utils/function-tools';
import healthDataManager from '../../src/utils/health-data-manager';
import locationManager from '../../src/utils/location-manager';
import mobileDataManager from '../../src/utils/mobile-data-manager';
import storageManager from '../../src/utils/storage';
// 一次性提醒的时间信息
interface OneTimePattern {
  scheduled_time: string;
}

// 重复规则的配置
interface RepeatRulePattern {
  type: string; // 例如: "daily", "weekly" 等
}

// ReminderItem 基础字段
interface ReminderItemBase {
  time: string;
  title: string;
  task_type: string;
  original_text?: string;
}

// 一次性提醒类型
interface ReminderItemOneTime extends ReminderItemBase {
  pattern_type: "one_time";
  one_time: OneTimePattern;
}

// 重复提醒类型
interface ReminderItemRepeatRule extends ReminderItemBase {
  pattern_type: "repeat_rule";
  repeat_rule: RepeatRulePattern;
}

// ReminderItem 联合类型，确保 one_time 和 repeat_rule 互斥
type ReminderItem = ReminderItemOneTime | ReminderItemRepeatRule;

interface ReminderCardData {
  title: string;
  monster: string;
  reminders: ReminderItem[];
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'timestamp' | 'reminderCard';
  content: string;
  avatar?: string;
  photoUri?: string;
  reminderCardData?: ReminderCardData;
  operation?: string; // 服务端下发的 operation 字段
}

export default function EchoTab() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const processedPhotoRef = useRef<string | null>(null);
  const historyInitializedRef = useRef<boolean>(false);
  const permissionsRequestedRef = useRef<boolean>(false);
  const uploadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const launchApiCalledRef = useRef<boolean>(false);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [initialInputText, setInitialInputText] = useState('');
  const [shouldAutoFocus, setShouldAutoFocus] = useState(false);
  const apiConfig = getApiConfig();

  // Handle mentionAgent parameter from navigation
  useEffect(() => {
    if (params.mentionAgent) {
      const agentName = params.mentionAgent as string;
      setInitialInputText(`@${agentName} `);
      setShouldAutoFocus(true);
      
      // Clear the param after processing to avoid re-triggering
      router.setParams({ mentionAgent: undefined });
    }
  }, [params.mentionAgent]);

  // 将 extract_user_task 的 tasks 数据转换为 ReminderCard Message
  const createReminderCardFromTasks = (tasks: any[], messageId?: string): Message | null => {
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return null;
    }

    // 转换任务数据为 ReminderCard 格式
    const reminders: ReminderItem[] = tasks.map((task: any) => {
      const baseItem: ReminderItemBase = {
        time: task.time || '12:00',
        title: task.title || 'Task',
        task_type: task.task_type || 'meal',
        original_text: task.original_text
      };

      // 根据 pattern_type 创建对应的 ReminderItem
      const patternType = task.pattern_type || 'repeat_rule';
      
      if (patternType === 'one_time') {
        // 一次性提醒
        return {
          ...baseItem,
          pattern_type: 'one_time' as const,
          one_time: task.one_time || { scheduled_time: '' }
        } as ReminderItemOneTime;
      } else {
        // 重复提醒（默认）
        return {
          ...baseItem,
          pattern_type: 'repeat_rule' as const,
          repeat_rule: task.repeat_rule || { type: 'daily' }
        } as ReminderItemRepeatRule;
      }
    });

    // 创建 ReminderCard 消息
    const id = messageId || `reminder_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      id,
      type: 'reminderCard' as const,
      content: '',
      reminderCardData: {
        title: '📋 Reminder',
        monster: 'default',
        reminders: reminders
      }
    };
  };

  // 将 API 返回的数据转换为 Message 格式
  const convertToMessages = (data: any): Message[] => {
    if (!data) return [];

    console.log('[convertToMessages] Raw server response data:', {
      dataType: Array.isArray(data) ? 'array' : typeof data,
      dataLength: Array.isArray(data) ? data.length : 'N/A',
      firstItem: Array.isArray(data) && data.length > 0 ? data[0] : data,
      sampleItemKeys: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : Object.keys(data || {})
    });

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
    const convertItem = (item: any, index: number): Message | null => {
      // 过滤掉 function_call_output 和 fun_call 类型的消息
      if (item.msg_type === 'function_call_output' || item.msg_type === 'fun_call') {
        return null;
      }
      
      // 处理 function_call 类型的消息，特别是 extract_user_task
      if (item.msg_type === 'function_call' && item.call_res) {
        const callRes = item.call_res;
        // 如果是 extract_user_task，转换为 ReminderCard 消息
        if (callRes.name === 'extract_user_task' && callRes.arguments) {
          try {
            // 解析 arguments JSON 字符串
            const args = JSON.parse(callRes.arguments);
            
            // 使用公共函数创建 ReminderCard 消息
            const messageId = item._id || item.id || item.trace_id || `reminder_${index}_${Date.now()}`;
            const reminderCard = createReminderCardFromTasks(args.tasks, messageId);
            if (reminderCard) {
              return reminderCard;
            }
          } catch (parseError) {
            console.error('Failed to parse extract_user_task arguments:', parseError);
            // 解析失败时，返回 null 过滤掉这条消息
            return null;
          }
        }
        // 其他 function_call 类型的消息，暂时过滤掉
        return null;
      }
      
      const type = getMessageType(item);
      // 优先使用 _id 字段作为唯一标识
      const messageId = item._id || item.id || item.trace_id || `msg-${index}-${Date.now()}`;
      
      // 提取图片URL（支持多个字段，包括 photoUri_preview）
      const photoUri = item.image || item.imageUrl || item.image_url || item.photoUri || item.photoUri_preview || undefined;
      
      // 提取 operation 字段（支持多种可能的字段名）
      const operation = item.operation || item.operation_type || item.op || undefined;
      
      // 调试日志：检查 operation 字段
      if (type === 'user' && (item.operation !== undefined || item.operation_type !== undefined || item.op !== undefined)) {
        console.log('Converting message with operation field:', {
          messageId,
          type,
          content: getMessageContent(item),
          operation: item.operation,
          operation_type: item.operation_type,
          op: item.op,
          extracted_operation: operation,
          allFields: Object.keys(item)
        });
      }
      
      // 调试日志：检查看起来像 operation 消息但 operation 字段为 undefined 的情况
      if (type === 'user') {
        const content = getMessageContent(item);
        // 如果内容看起来像 operation 消息（包含"已经设置"或"取消提醒"），但 operation 字段为 undefined
        if ((content.includes('已经设置') || content.includes('取消提醒')) && !operation) {
          console.log('[convertItem] User message with operation-like content but no operation field:', {
            messageId,
            content,
            itemKeys: Object.keys(item),
            itemOperation: item.operation,
            itemOperationType: item.operation_type,
            itemOp: item.op,
            fullItem: JSON.stringify(item, null, 2)
          });
        }
      }
      
      // 如果消息包含图片，记录日志
      if (photoUri) {
        console.log('Converting image message:', {
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
        operation,
      };
    };
    
    // 如果返回的是消息数组
    if (Array.isArray(data)) {
      return data.map(convertItem).filter((msg: Message | null): msg is Message => msg !== null);
    }

    // 如果返回的是包含 messages 字段的对象
    if (data.messages && Array.isArray(data.messages)) {
      return data.messages.map(convertItem).filter((msg: Message | null): msg is Message => msg !== null);
    }

    // 如果返回的是包含 history 字段的对象
    if (data.history && Array.isArray(data.history)) {
      return data.history.map(convertItem).filter((msg: Message | null): msg is Message => msg !== null);
    }
    
    // 如果返回的是包含 data 字段的数组
    if (data.data && Array.isArray(data.data)) {
      return data.data.map(convertItem).filter((msg: Message | null): msg is Message => msg !== null);
    }

    // 如果返回的是单个消息对象
    if (data.content || data.text || data.message || data.msg) {
      const converted = convertItem(data, 0);
      return converted ? [converted] : [];
    }

    return [];
  };

  // 调用 data-agent/launch 接口（首次进入时，fire-and-forget）
  const callLaunchApi = useCallback(async () => {
    // 如果已经调用过，跳过
    if (launchApiCalledRef.current) {
      console.log('[EchoTab] Launch API already called, skipping...');
      return;
    }

    launchApiCalledRef.current = true;
    console.log('[EchoTab] 🚀 Calling data-agent/launch API...');

    try {
      // 发起 POST 请求（fire-and-forget，不等待响应）
      api.post(API_ENDPOINTS.DATA_AGENT.LAUNCH, {}, {
        requireAuth: false,
      }).catch((error) => {
        //
      });
      console.log('[EchoTab] ✅ Launch API called (fire-and-forget)');
    } catch (error) {
      console.error('[EchoTab] ❌ Error getting passId for launch API:', error);
    }
  }, []);

  // 心跳请求（每10秒发送一次）
  const sendHeartbeat = useCallback(async () => {
    try {
      const deviceId = await getDeviceId();
      const timestamp = Date.now().toString();
      console.log('[EchoTab] 🔄 Sending heartbeat...');
      api.post(API_ENDPOINTS.HEALTH_DATA.HEARTBEAT, {
        device_id: deviceId,
        timestamp: timestamp,
      }, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      console.log('[EchoTab] ✅ Heartbeat sent successfully');
    } catch (error) {
      console.error('[EchoTab] ❌ Failed to send heartbeat:', error);
      // 静默处理错误，不阻塞其他功能
    }
  }, []);

  // 启动上传定时器（独立函数，确保定时器总是被创建）
  const startUploadTimer = useCallback(() => {
    // 如果定时器已存在，先清理
    if (uploadTimerRef.current) {
      console.log('[EchoTab] 🔄 Clearing existing upload timer before starting new one');
      clearInterval(uploadTimerRef.current);
      uploadTimerRef.current = null;
    }

    console.log('[EchoTab] ⏰ Starting upload timer (every 5 minutes)');
    
    // 立即执行一次上传
    mobileDataManager.uploadData({ period: 'today' }).catch((error) => {
      console.error('[EchoTab] ❌ Initial upload failed:', error);
    });

    // 启动定时器，每5分钟执行一次上传
    uploadTimerRef.current = setInterval(async () => {
      try {
        console.log('[EchoTab] ⏰ Scheduled upload: uploading data...');
        await mobileDataManager.uploadData({ period: 'today' });
        console.log('[EchoTab] ✅ Scheduled upload completed');
      } catch (error) {
        console.error('[EchoTab] ❌ Scheduled upload failed:', error);
      }
    }, 5 * 60 * 1000); // 5分钟 = 5 * 60 * 1000 毫秒
    
    console.log('[EchoTab] ✅ Upload timer started successfully, timer ID:', uploadTimerRef.current);
  }, []);

  // 请求所有数据权限（首次进入时）
  const requestAllPermissions = useCallback(async () => {
    // 如果已经请求过权限，跳过
    if (permissionsRequestedRef.current) {
      console.log('[EchoTab] Permissions already requested, skipping...');
      // 即使权限已请求过，也要确保定时器在运行
      if (!uploadTimerRef.current) {
        console.log('[EchoTab] ⚠️ Upload timer not running, starting it now...');
        startUploadTimer();
      }
      return;
    }

    console.log('[EchoTab] 🔐 Requesting all data permissions on first entry...');
    permissionsRequestedRef.current = true;

    try {
      // 1. 请求日历权限
      console.log('[EchoTab] 📅 Requesting calendar permission...');
      try {
        await calendarManager.requestPermission();
        console.log('[EchoTab] ✅ Calendar permission requested');
      } catch (error) {
        console.error('[EchoTab] ❌ Failed to request calendar permission:', error);
      }

      // 2. 请求地理位置权限
      console.log('[EchoTab] 📍 Requesting location permission...');
      try {
        await locationManager.requestLocationPermission('foreground');
        console.log('[EchoTab] ✅ Location permission requested');
      } catch (error) {
        console.error('[EchoTab] ❌ Failed to request location permission:', error);
      }

      // 3. 请求健康数据权限
      console.log('[EchoTab] ❤️ Requesting health data permissions...');
      let healthPermissionGranted = false;
      try {
        await healthDataManager.requestAllCommonPermissions();
        console.log('[EchoTab] ✅ Health data permissions requested');
        healthPermissionGranted = true;
      } catch (error) {
        console.error('[EchoTab] ❌ Failed to request health data permissions:', error);
      }

      // 无论健康权限是否成功，都启动上传定时器
      // 因为即使权限失败，定时器也应该运行（可能会上传部分数据）
      startUploadTimer();

      // 4. 请求相册权限
      console.log('[EchoTab] 📷 Requesting photo library permission...');
      try {
        const photoPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (photoPermission.granted) {
          console.log('[EchoTab] ✅ Photo library permission granted');
        } else {
          console.log('[EchoTab] ⚠️ Photo library permission denied');
        }
      } catch (error) {
        console.error('[EchoTab] ❌ Failed to request photo library permission:', error);
      }

      console.log('[EchoTab] ✅ All permissions requested');
    } catch (error) {
      console.error('[EchoTab] ❌ Error requesting permissions:', error);
      // 即使权限请求出错，也尝试启动定时器
      if (!uploadTimerRef.current) {
        console.log('[EchoTab] ⚠️ Starting upload timer despite permission errors...');
        startUploadTimer();
      }
    }
  }, [startUploadTimer]);

  // 初始化用户数据（从本地存储获取真实数据）
  useEffect(() => {
    const initUserData = async () => {
      try {
        // 从本地存储获取用户数据
        const data = await storageManager.getUserData();
        
        if (data) {
          console.log('Loading user data from local storage:', data);
          setUserData(data);
        } else {
          console.warn('No user data in local storage, user may not be logged in');
          // 如果没有用户数据，可以跳转到登录页面
          // router.replace('/login');
        }
      } catch (error) {
        console.error('Failed to get user data:', error);
      }
    };
    initUserData();
  }, []);

  // 首次进入时请求所有权限和调用 launch API
  useEffect(() => {
    // 延迟一点时间，确保用户数据已加载
    const timer = setTimeout(() => {
      requestAllPermissions();
      // 调用 launch API（fire-and-forget）
      callLaunchApi();
    }, 500);

    return () => {
      clearTimeout(timer);
      // 清理上传定时器
      if (uploadTimerRef.current) {
        clearInterval(uploadTimerRef.current);
        uploadTimerRef.current = null;
        console.log('[EchoTab] 🛑 Stopped scheduled upload timer');
      }
    };
  }, [requestAllPermissions, callLaunchApi]);

  // 启动心跳定时器（每10秒发送一次心跳）
  useEffect(() => {
    console.log('[EchoTab] 🚀 Starting heartbeat timer (every 10 seconds)');

    // 立即发送第一次心跳
    sendHeartbeat();
    let interval = 10 * 1000; // 10秒 = 10 * 1000 毫秒
    if (CURRENT_ENV === ENV.DEVELOPMENT) {
      interval = 100 * 1000;
    }

    // 设置定时器，每10秒发送一次心跳
    heartbeatTimerRef.current = setInterval(async () => {
      try {
        console.log('[EchoTab] ⏰ Scheduled heartbeat: sending heartbeat...');
        await sendHeartbeat();
        console.log('[EchoTab] ✅ Scheduled heartbeat completed');
      } catch (error) {
        console.error('[EchoTab] ❌ Scheduled heartbeat failed:', error);
      }
    }, interval); 

    return () => {
      // 清理心跳定时器
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
        console.log('[EchoTab] 🛑 Stopped heartbeat timer');
      }
    };
  }, [sendHeartbeat]);

  // 生成唯一ID
  const generateTraceId = () => {
    return Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString();
  };

  // 生成消息ID
  const generateMsgId = () => {
    return Date.now().toString();
  };

  // 通用的流式响应处理函数（带重试机制）
  const handleStreamRequest = useCallback(async (config: {
    requestBody: any;
    tempMessageId: string;
    logPrefix: string;
    onComplete?: (responseData: any, eventSource?: any) => boolean | void;
    errorMessage: string;
    silent?: boolean;
    extraHeaders?: Record<string, string>;
    maxRetries?: number;
  }) => {
    const { 
      requestBody, 
      tempMessageId, 
      logPrefix, 
      onComplete, 
      errorMessage, 
      silent = false, 
      extraHeaders = {},
      maxRetries = 3
    } = config;
    
    let eventSource: any = null;
    let accumulatedText = '';
    let retryCount = 0;
    let isCompleted = false;
    let connectionOpened = false;
    let retryTimeoutId: NodeJS.Timeout | null = null;
    let connectionTimeoutId: NodeJS.Timeout | null = null;
    let responseTimeoutId: NodeJS.Timeout | null = null;

    // 判断是否为网络连接错误
    const isNetworkError = (event: any): boolean => {
      const errorMessage = event.message || '';
      const xhrStatus = event.xhrStatus;
      const xhrState = event.xhrState;
      
      // 网络连接丢失的错误特征
      return (
        errorMessage.includes('network connection was lost') ||
        errorMessage.includes('Network request failed') ||
        errorMessage.includes('connection') ||
        (xhrStatus === 0 && xhrState === 4) || // 连接中断
        errorMessage.includes('timeout') ||
        errorMessage.includes('TIMEOUT')
      );
    };

    // 创建 SSE 连接的函数
    const createConnection = async (): Promise<void> => {
      return new Promise((resolve, reject) => {
        try {
          console.log(`${logPrefix}Creating SSE connection (attempt ${retryCount + 1}/${maxRetries + 1})...`);

          // 合并 headers
          getHeadersWithPassId().then(async (baseHeaders) => {
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
            const url = `${apiConfig.BASE_URL}${API_ENDPOINTS.CONVERSATION.STREAM}`;
            console.log('url', url);
            // 创建 EventSource 实例
            eventSource = new EventSource(
              url,
              {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
                pollingInterval: 0,
              }
            );

            // 连接打开事件
            eventSource.addEventListener('open', () => {
              connectionOpened = true;
              // 清除连接超时定时器
              if (connectionTimeoutId) {
                clearTimeout(connectionTimeoutId);
                connectionTimeoutId = null;
              }
              console.log(`${logPrefix}SSE connection established`);
              
              // 设置响应超时定时器（60秒），如果在这个时间内没有收到 complete 事件，重置 isSending
              responseTimeoutId = setTimeout(() => {
                if (!isCompleted) {
                  console.warn(`${logPrefix}Response timeout: No complete event received within 60 seconds, resetting isSending`);
                  // 如果有已累积的文本，保存它
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
                  // 清理状态
                  accumulatedText = '';
                  setCurrentResponse('');
                  setIsSending(false);
                  // 关闭连接
                  if (eventSource) {
                    try {
                      eventSource.close();
                    } catch (e) {
                      console.warn(`${logPrefix}Error closing eventSource on response timeout:`, e);
                    }
                    eventSource = null;
                  }
                }
              }, 60000) as any;
              
              resolve();
            });

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
                  console.log(`${logPrefix}Complete:`, JSON.stringify(data, null, 2));
                  isCompleted = true;

                  // 清除响应超时定时器
                  if (responseTimeoutId) {
                    clearTimeout(responseTimeoutId);
                    responseTimeoutId = null;
                  }

                  if (data.data?.code === 0 && data.data?.data?.[0]) {
                    const responseData = data.data.data[0];

                    // 调用回调处理 complete 事件
                    if (onComplete) {
                      const shouldContinue = onComplete(responseData, eventSource);
                      if (shouldContinue === false) {
                        accumulatedText = '';
                        setCurrentResponse('');
                        setIsSending(false);
                        if (eventSource) {
                          eventSource.close();
                          eventSource = null;
                        }
                        return;
                      }
                    }

                    // 默认文本消息处理（过滤掉 function_call_output 类型的消息）
                    if (responseData.msg_type === 'text') {
                      setMessages(prev => {
                        const filtered = prev.filter(msg => msg.id !== tempMessageId);
                        return [...filtered, {
                          id: responseData._id || Date.now().toString(),
                          type: 'assistant' as const,
                          content: responseData.text || accumulatedText,
                          operation: responseData.operation || undefined,
                        }];
                      });
                    }
                  } else {
                    // 即使没有回复内容，也要记录日志
                    console.warn(`${logPrefix}Complete event received but no valid response data:`, data);
                  }

                  // 清理（无论是否有回复内容，都要执行清理）
                  accumulatedText = '';
                  setCurrentResponse('');
                  setIsSending(false);

                  if (eventSource) {
                    eventSource.close();
                    eventSource = null;
                  }
                }
              } catch (parseError) {
                console.error(`${logPrefix}Parse error:`, parseError, 'Raw data:', event.data);
              }
            });

            // 错误事件
            eventSource.addEventListener('error', (event: any) => {
              console.error(`${logPrefix}SSE error:`, event);

              // 如果已经完成，忽略后续错误
              if (isCompleted) {
                return;
              }

              // 检查是否为网络错误
              const isNetworkErr = isNetworkError(event);

              // 如果是网络错误且未达到最大重试次数，尝试重试
              if (isNetworkErr && retryCount < maxRetries && !isCompleted) {
                retryCount++;
                const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000); // 指数退避，最大5秒
                
                console.log(`${logPrefix}Network error detected, retrying in ${delay}ms (${retryCount}/${maxRetries})...`);

                // 关闭当前连接
                if (eventSource) {
                  try {
                    eventSource.close();
                  } catch (e) {
                    console.warn(`${logPrefix}Error closing eventSource:`, e);
                  }
                  eventSource = null;
                }

                connectionOpened = false;

                // 延迟重试
                retryTimeoutId = setTimeout(async () => {
                  try {
                    await createConnection();
                  } catch (retryError) {
                    console.error(`${logPrefix}Retry failed:`, retryError);
                    handleFinalError();
                  }
                }, delay);

                return;
              }

              // 非网络错误或达到最大重试次数，处理最终错误
              handleFinalError();
            });

            // 设置连接超时（10秒）
            connectionTimeoutId = setTimeout(() => {
              if (!connectionOpened && !isCompleted) {
                console.warn(`${logPrefix}Connection timeout`);
                if (eventSource) {
                  try {
                    eventSource.close();
                  } catch (e) {
                    console.warn(`${logPrefix}Error closing eventSource on timeout:`, e);
                  }
                  eventSource = null;
                }
                
                // 如果是网络错误且未达到最大重试次数，尝试重试
                if (retryCount < maxRetries) {
                  retryCount++;
                  const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
                  console.log(`${logPrefix}Connection timeout, retrying in ${delay}ms (${retryCount}/${maxRetries})...`);
                  
                  retryTimeoutId = setTimeout(async () => {
                    try {
                      await createConnection();
                    } catch (retryError) {
                      console.error(`${logPrefix}Retry after timeout failed:`, retryError);
                      handleFinalError();
                    }
                  }, delay);
                } else {
                  handleFinalError();
                }
              }
            }, 300000) as any;

          }).catch((error) => {
            console.error(`${logPrefix}Failed to get headers:`, error);
            reject(error);
          });

        } catch (error) {
          console.error(`${logPrefix}Failed to create connection:`, error);
          reject(error);
        }
      });
    };

    // 处理最终错误
    const handleFinalError = () => {
      // 清除所有定时器
      if (retryTimeoutId) {
        clearTimeout(retryTimeoutId);
        retryTimeoutId = null;
      }
      if (connectionTimeoutId) {
        clearTimeout(connectionTimeoutId);
        connectionTimeoutId = null;
      }
      if (responseTimeoutId) {
        clearTimeout(responseTimeoutId);
        responseTimeoutId = null;
      }

      // 如果有已累积的文本，保存它
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

      // 显示错误提示（只在非静默模式下）
      if (!silent) {
        const finalErrorMessage = retryCount >= maxRetries 
          ? `${errorMessage}\n\nRetried ${maxRetries} times. Please check your network connection and try again.`
          : errorMessage;
        Alert.alert('Connection Error', finalErrorMessage);
      }

      // 清理状态
      accumulatedText = '';
      setCurrentResponse('');
      setIsSending(false);

      if (eventSource) {
        try {
          eventSource.close();
        } catch (e) {
          console.warn(`${logPrefix}Error closing eventSource in handleFinalError:`, e);
        }
        eventSource = null;
      }
    };

    try {
      console.log(`${logPrefix}Request body:`, requestBody);
      await createConnection();
    } catch (error) {
      console.error(`${logPrefix}Failed:`, error);
      handleFinalError();
    }
  }, [apiConfig]);

  // 发送新用户欢迎语消息
  const sendNewUserMessage = useCallback(async (userDataParam = null) => {
    try {
      console.log('sendNewUserMessage ing');
      
      // 优先使用传入的参数，如果没有则使用状态中的 userData
      const currentUserData = userDataParam || userData;
      
      if (!currentUserData) {
        console.log('sendNewUserMessage end with no userData');
        return;
      }
      
      // 获取设备信息
      const deviceId = await getDeviceId();
      const version = getAppVersion();
      const timezone = getTimezone();
      
      // 构建请求体
      const requestBody = {
        uid: String(currentUserData.uid || currentUserData.id),
        msg_id: generateMsgId(),
        trace_id: generateTraceId(),
        timestamp: Date.now().toString(),
        text: '',
        system_prompt: ["you are a helpful AI assistant"],
        msg_type: "new_user"
      };
      
      console.log('Sending new_user message:', requestBody);
      
      // 调用通用处理函数，静默处理，不显示响应和错误
      await handleStreamRequest({
        requestBody,
        tempMessageId: 'temp_new_user',
        logPrefix: 'New User message',
        onComplete: () => {
          // new_user 消息不需要显示响应，直接返回 false 停止默认处理
          console.log('New User message sent');
          return false;
        },
        errorMessage: 'Failed to send New User message',
        silent: true, // 静默模式，不显示错误提示
        extraHeaders: {
          'device': deviceId,
          'timezone': timezone,
          'version': version,
          'passId': currentUserData.passId || '',
        }
      });
      
      console.log('sendNewUserMessage end');
    } catch (error) {
      console.error('Failed to send new_user message:', error);
      // 静默失败，不显示错误提示
    }
  }, [userData, handleStreamRequest]);

  // 发送 enter_user 消息
  const sendEnterUserMessage = useCallback(async (userDataParam = null) => {
    try {
      console.log('sendEnterUserMessage ing');
      
      // 优先使用传入的参数，如果没有则使用状态中的 userData
      const currentUserData = userDataParam || userData;
      
      if (!currentUserData) {
        console.log('sendEnterUserMessage end with no userData');
        return;
      }
      
      // 获取设备信息
      const deviceId = await getDeviceId();
      const version = getAppVersion();
      const timezone = getTimezone();
      
      // 构建请求体
      const requestBody = {
        uid: String(currentUserData.uid || currentUserData.id),
        msg_id: generateMsgId(),
        trace_id: generateTraceId(),
        timestamp: Date.now().toString(),
        text: '',
        system_prompt: ["you are a helpful AI assistant"],
        msg_type: "enter"
      };
      
      console.log('Sending enter message:', requestBody);
      
      // 调用通用处理函数，静默处理，不显示响应和错误
      await handleStreamRequest({
        requestBody,
        tempMessageId: 'temp_enter_user',
        logPrefix: 'Enter User message',
        onComplete: () => {
          // enter 消息不需要显示响应，直接返回 false 停止默认处理
          console.log('Enter User message sent');
          return false;
        },
        errorMessage: 'Failed to send Enter User message',
        silent: true, // 静默模式，不显示错误提示
        extraHeaders: {
          'device': deviceId,
          'timezone': timezone,
          'version': version,
          'passId': currentUserData.passId || '',
        }
      });
      
      console.log('sendEnterUserMessage end');
    } catch (error) {
      console.error('Failed to send enter message:', error);
      // 静默失败，不显示错误提示
    }
  }, [userData, handleStreamRequest]);

  // 获取对话历史
  const fetchConversationHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const result: any = await conversationService.getConversationHistory();

      let historyMessages: Message[] = [];

      if (result.success && result.data) {
        // 调试日志：查看服务端返回的原始数据结构
        console.log('[fetchConversationHistory] Raw server response data:', {
          dataType: Array.isArray(result.data) ? 'array' : typeof result.data,
          dataLength: Array.isArray(result.data) ? result.data.length : 'N/A',
          firstItem: Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : result.data,
          sampleItemKeys: Array.isArray(result.data) && result.data.length > 0 ? Object.keys(result.data[0]) : Object.keys(result.data || {})
        });
        
        const convertedMessages = convertToMessages(result.data);
        // 反转消息数组，使最旧的消息在前，最新的在后
        historyMessages = convertedMessages.reverse();
        
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
            console.log('Merging messages:', { 
              prevCount: prev.length, 
              historyCount: historyMessages.length, 
              newCount: newHistoryMessages.length,
              mergedCount: merged.length,
              note: 'History messages first, new messages last, ensuring latest message is at the end'
            });
            return merged;
          }
          // 如果没有现有消息，直接使用历史消息
          return historyMessages;
        });
      } else {
        console.error('Failed to get conversation history:', result.message);
        // 只有在没有现有消息时才清空
        setMessages(prev => prev.length > 0 ? prev : []);
      }
      
      // 根据历史消息是否为空，调用相应的函数
      // 如果 userData 未加载，尝试从 storageManager 获取
      let currentUserData = userData;
      if (!currentUserData) {
        try {
          currentUserData = await storageManager.getUserData();
          if (currentUserData) {
            console.log('Getting user data from storageManager:', currentUserData);
            setUserData(currentUserData);
          }
        } catch (error) {
          console.error('Failed to get user data from storageManager:', error);
        }
      }

      if (historyMessages.length === 0) {
        // 历史消息为空，发送新用户欢迎语消息
        console.log('History messages empty, sending new user welcome message');
        if (currentUserData) {
          await sendNewUserMessage(currentUserData);
        } else {
          console.warn('User data not loaded, cannot send new user message');
        }
      } else {
        // 历史消息有值，发送 enter 消息
        console.log('History messages exist, sending enter message');
        if (currentUserData) {
          await sendEnterUserMessage(currentUserData);
        } else {
          console.warn('User data not loaded, cannot send enter message');
        }
      }
    } catch (error) {
      console.error('Error getting conversation history:', error);
      // 只有在没有现有消息时才清空
      setMessages(prev => prev.length > 0 ? prev : []);
    } finally {
      setIsLoading(false);
    }
  }, [userData, sendNewUserMessage, sendEnterUserMessage]);

  // 组件挂载时获取对话历史（只在首次挂载且没有照片参数时获取）
  useEffect(() => {
    // 如果有照片参数，说明是拍照返回，不需要重新获取历史消息
    if (params.photoUri) {
      console.log('Photo parameter detected, skipping history fetch, processing photo directly');
      setIsLoading(false);
      return;
    }
    
    // 如果已经初始化过，不再重复获取
    if (historyInitializedRef.current) {
      console.log('History messages already initialized, skipping duplicate fetch');
      setIsLoading(false);
      return;
    }
    
    // 首次挂载且没有照片参数时，获取历史消息
    historyInitializedRef.current = true;
    fetchConversationHistory();
  }, [fetchConversationHistory, params.photoUri]);

  // 每次页面聚焦时，触发刷新 AgentLogs 并检查上传定时器
  useFocusEffect(
    useCallback(() => {
      console.log('Page focused, triggering AgentLogs refresh');
      setRefreshTrigger(prev => prev + 1);
      
      // 检查上传定时器是否在运行，如果没有则重新启动
      if (!uploadTimerRef.current) {
        console.log('[EchoTab] ⚠️ Upload timer not running on focus, restarting...');
        startUploadTimer();
      } else {
        console.log('[EchoTab] ✅ Upload timer is running (ID:', uploadTimerRef.current, ')');
      }
    }, [startUploadTimer])
  );
  
  // 检测消息中的 @mention 并返回对应的 param_name
  const detectMention = (message: string): string | null => {
    // 遍历所有 agents，检查消息中是否包含 @AgentName
    for (const agent of AGENTS) {
      // 使用正则表达式匹配 @AgentName（不区分大小写，但保持大小写敏感以匹配完整单词）
      const mentionPattern = new RegExp(`@${agent.name}\\b`, 'i');
      if (mentionPattern.test(message)) {
        return agent.param_name;
      }
    }
    return null;
  };

  // 处理流式响应
  const handleStreamResponse = useCallback(async (userMessage: string, photoUri?: string, imageDetectionType?: string) => {
    try {
      if (!userData) {
        Alert.alert('Error', 'User info not loaded, please try again');
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

      // 检测消息中的 @mention
      const mentionedAgent = detectMention(userMessage);

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
      // 如果消息中包含 @mention，添加 at 字段
      if (mentionedAgent) {
        requestBody.at = mentionedAgent;
      }
      console.log('requestBody', requestBody);
      
      // 调用通用处理函数
      await handleStreamRequest({
        requestBody,
        tempMessageId: 'temp_ai_response',
        logPrefix: 'Regular message',
        onComplete: (responseData, eventSource) => {
          // 检查 Function Call
          if ((responseData.msg_type === 'function_call_output' || responseData.msg_type === 'fun_call') && responseData.call_res) {
            console.log('Function Call detected:', responseData.call_res);

            // setMessages(prev => {
            //   const filtered = prev.filter(msg => msg.id !== 'temp_ai_response');
            //   return [...filtered, {
            //     id: Date.now().toString(),
            //     type: 'assistant' as const,
            //     content: `Executing function: ${responseData.call_res.name}...`,
            //   }];
            // });

            if (eventSource) {
              eventSource.close();
            }

            setIsSending(false);

            handleFunctionCall(responseData.call_res).catch(error => {
              console.error('Function call execution failed:', error);
              Alert.alert('Error', 'Error executing function call');
            });

            return false; // 停止默认处理
          }
          return true; // 继续默认处理
        },
        errorMessage: 'Connection interrupted, please try again'
      });
      
      // 注意：setIsSending(false) 现在在 handleStreamRequest 的 complete 或 error 事件中处理

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message, please try again');
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
        console.log('Photo already processed, skipping:', photoUri);
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

      console.log('Preparing to add user image message to interface:', {
        id: userMsg.id,
        type: userMsg.type,
        hasPhotoUri: !!userMsg.photoUri,
        photoUriPreview: userMsg.photoUri?.substring(0, 80),
        content: userMsg.content
      });
      
      // 使用函数式更新确保消息被正确添加
      setMessages(prev => {
        console.log('Current message list length:', prev.length);
        // 检查是否已经存在相同的消息（避免重复）
        const exists = prev.some(msg => msg.id === messageId || (msg.photoUri === photoUri && msg.type === 'user'));
        if (exists) {
          console.log('Message already exists, skipping add');
          return prev;
        }
        const newMessages = [...prev, userMsg];
        console.log('✅ Successfully added message, updated message list length:', newMessages.length);
        console.log('Latest message:', newMessages[newMessages.length - 1]);
        return newMessages;
      });
      
      // 根据模式设置消息文本
      const messageText = mode === 'photo-text' && description 
        ? description 
        : 'Please analyze this photo';
      
      console.log('Sending image message:', { 
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
        Alert.alert('Error', 'User info not loaded, please try again');
        return;
      }

      console.log('Sending Function Call result to server:', { callId, functionName, result });
      const messageText = typeof result === 'string' ? result : JSON.stringify(result);

      const messageTimestamp = Date.now().toString();

      // 不添加执行结果消息到界面（function_call_output 类型的消息不显示）

      // 检测消息中的 @mention（虽然 function call 结果通常不会有，但为了完整性也检测）
      const mentionedAgent = detectMention(messageText);

      // 构建请求体
      const requestBody: any = {
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
      // 如果消息中包含 @mention，添加 at 字段
      if (mentionedAgent) {
        requestBody.at = mentionedAgent;
      }

      // 调用通用处理函数
      await handleStreamRequest({
        requestBody,
        tempMessageId: 'temp_function_ai_response',
        logPrefix: 'Function Call response',
        onComplete: () => {
          console.log('AI response after Function Call has been displayed');
          return true;
        },
        errorMessage: 'Function Call response connection interrupted'
      });

    } catch (error) {
      console.error('Failed to send Function Call result:', error);
      Alert.alert('Error', 'Failed to send function call result, please try again');
    }
  }, [userData, handleStreamRequest]);

  // 处理 function call
  const handleFunctionCall = useCallback(async (functionCallData: any) => {
    console.log('Processing function call:', functionCallData);
    const { name, arguments: argsString, call_id } = functionCallData;
    console.log('raw function call data:', functionCallData);
    let args;

    // 解析参数
    try {
      args = JSON.parse(argsString);
    } catch (parseError) {
      console.error('Failed to parse parameters:', parseError);
      const errorMessage = `Parameter format error: ${(parseError as Error).message}`;
      await sendFunctionCallResult(call_id, name, errorMessage);
      return;
    }

    console.log(`extract tool function: ${name}, parameters:`, args);
    console.log('Parameters for extract_user_task:', JSON.stringify(args, null, 2));

    // 使用统一的工具执行器
    const executionResult = await executeToolFunction(name, args);

    console.log(`tool function execution result:`, executionResult);

    // 特殊处理 extract_user_task 函数 - 从执行结果中提取 tasks
    if (name === 'extract_user_task' && executionResult.success) {
      try {
        console.log('extract_user_task execution result:', executionResult);
        console.log('Raw result string:', executionResult.result);
        const resultData = JSON.parse(executionResult.result);
        console.log('Parsed extract_user_task result:', resultData);
        
        // 使用公共函数创建 ReminderCard 消息
        if (resultData.tasks && Array.isArray(resultData.tasks)) {
          const reminderCardMessage = createReminderCardFromTasks(resultData.tasks);
          if (reminderCardMessage) {
            setMessages(prev => [...prev, reminderCardMessage]);
            console.log('Added ReminderCard message for extracted tasks from execution result');
          }
        }
      } catch (parseError) {
        console.error('Failed to parse extract_user_task result:', parseError);
      }
    }
    // 20251126 目前不需要回传function call 结果
    // // 检查执行结果
    // if (executionResult.success) {
    //   await sendFunctionCallResult(call_id, name, executionResult.result);
    // } else {
    //   const errorMessage = executionResult.error || `Unknown error occurred while executing function ${name}`;
    //   await sendFunctionCallResult(call_id, name, errorMessage);
    // }
  }, [sendFunctionCallResult]);

  // 处理 ReminderCard 发送的消息（包含 operation 和 text 字段）
  const handleReminderMessage = useCallback(async (operation: string, text: string) => {
    try {
      if (!userData) {
        Alert.alert('Error', 'User info not loaded, please try again');
        return;
      }

      setIsSending(true);
      setCurrentResponse('');

      const messageTimestamp = Date.now().toString();

      // 添加用户消息，使用 text 作为显示内容
      // 注意：这个消息会被 ConversationSection 过滤掉（因为 isOperation: true）
      const userMsg: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: text,
        operation: operation, // 标记为 operation 消息，用于在界面中过滤显示
      };
      setMessages(prev => [...prev, userMsg]);

      // 检测消息中的 @mention（使用 text 进行检测）
      const mentionedAgent = detectMention(text);

      // 构建请求体，包含 operation 和 text 字段
      const requestBody: any = {
        uid: String(userData.uid || userData.id),
        msg_id: generateMsgId(),
        trace_id: generateTraceId(),
        timestamp: messageTimestamp,
        text: text, // text 字段用于显示和检测 mention
        operation: operation, // operation 字段用于标识操作类型
        system_prompt: ["you are a helpful AI assistant"],
        msg_type: "text",
      };
      // 如果消息中包含 @mention，添加 at 字段
      if (mentionedAgent) {
        requestBody.at = mentionedAgent;
      }
      console.log('ReminderCard requestBody', requestBody);
      
      // 调用通用处理函数
      await handleStreamRequest({
        requestBody,
        tempMessageId: 'temp_ai_response',
        logPrefix: 'ReminderCard message',
        onComplete: (responseData, eventSource) => {
          // 检查 Function Call
          if ((responseData.msg_type === 'function_call_output' || responseData.msg_type === 'fun_call') && responseData.call_res) {
            console.log('Function Call detected:', responseData.call_res);

            if (eventSource) {
              eventSource.close();
            }

            setIsSending(false);

            handleFunctionCall(responseData.call_res).catch(error => {
              console.error('Function call execution failed:', error);
              Alert.alert('Error', 'Error executing function call');
            });

            return false; // 停止默认处理
          }
          return true; // 继续默认处理
        },
        errorMessage: 'Connection interrupted, please try again'
      });
      
    } catch (error) {
      console.error('Error sending reminder message:', error);
      Alert.alert('Error', 'Failed to send message, please try again');
      setIsSending(false);
    }
  }, [userData, handleStreamRequest, detectMention, handleFunctionCall]);

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

  // Listen for keyboard events
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  // Test reminder function - inserts a reminder card into the chat
  const handleTestReminder = useCallback(async () => {
    console.log('handleTestReminder - 开始获取今日步数');
    
    try {
      // 检查 HealthKit 是否可用
      const isAvailable = await healthDataManager.isAvailable();
      if (!isAvailable) {
        Alert.alert('提示', 'HealthKit 不可用，请确保在 iOS 设备上运行');
        return;
      }

      // 获取今日步数
      const result = await healthDataManager.getStepCount('today');
      
      if (!result.success) {
        Alert.alert('获取失败', result.error || '无法获取步数数据');
        return;
      }

      // 格式化步数数据
      const formatted = healthDataManager.formatStepCountData(result.data, 'today') as { total?: number; average?: number; days?: number; records?: any[]; period?: string };
      const totalSteps = formatted?.total || 0;

      // 显示结果
      Alert.alert('今日步数', `您今天的步数是：${totalSteps.toLocaleString()} 步`);
      console.log('今日步数获取成功:', totalSteps);
    } catch (error) {
      console.error('获取今日步数失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      Alert.alert('错误', `获取步数时发生错误：${errorMessage}`);
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <Header
          isCollapsed={isCollapsed}
          onCollapse={handleCollapse}
          refreshTrigger={refreshTrigger}
          onTestReminder={CURRENT_ENV === ENV.DEVELOPMENT ? handleTestReminder : undefined}
        />
        <ConversationSection
          messages={messages}
          isLoading={isLoading}
          isSending={isSending}
          currentResponse={currentResponse}
          keyboardHeight={keyboardHeight}
          onSendMessage={handleReminderMessage}
        />
      </View>

      <InputField
        onFocus={handleInputFocus}
        onSend={sendMessage}
        isSending={isSending}
        disabled={!userData}
        initialText={initialInputText}
        autoFocus={shouldAutoFocus}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F9',
  },
  contentWrapper: {
    flex: 1,
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
