
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus, Keyboard, StyleSheet, View } from 'react-native';
import EventSource from 'react-native-sse';
import { ConversationSection } from '../../components/ConversationSection';
import { Header } from '../../components/Header';
import { InputField } from '../../components/InputField';
import { AGENTS } from '../../components/MentionSelector';
import { ReminderBar, ReminderItem as ReminderItemType } from '../../components/ReminderBar';
import type {
  Message,
  ReminderItem,
  ReminderItemBase,
  ReminderItemOneTime,
  ReminderItemRepeatRule
} from '../../constants/types';
import api, { getAppVersion, getDeviceId, getTimezone } from '../../src/services/api-clients/client';
import { API_ENDPOINTS, CURRENT_ENV, ENV, getApiConfig, getHeadersWithPassId } from '../../src/services/api/api';
import conversationService from '../../src/services/conversationService';
import calendarManager from '../../src/utils/calendar-manager';
import { executeToolFunction } from '../../src/utils/function-tools';
import healthDataManager from '../../src/utils/health-data-manager';
import locationManager from '../../src/utils/location-manager';
import mobileDataManager from '../../src/utils/mobile-data-manager';
import storageManager from '../../src/utils/storage';

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const processedPhotoRef = useRef<string | null>(null);
  const historyInitializedRef = useRef<boolean>(false);
  const permissionsRequestedRef = useRef<boolean>(false);
  const uploadTimerRef = useRef<NodeJS.Timeout | null>(null);
  const launchApiCalledRef = useRef<boolean>(false);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const memoryPollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestMemoryIdRef = useRef<string | null>(null);
  const lastRefreshTimeRef = useRef<number>(0);
  const refreshDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isPageFocusedRef = useRef<boolean>(false); // 跟踪页面是否处于聚焦状态
  const newUserMessageSentRef = useRef<boolean>(false); // 跟踪是否已发送新用户消息
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
  const [activeReminders, setActiveReminders] = useState<ReminderItemType[]>([]);
  const apiConfig = getApiConfig();

  // Get the highest priority active reminder
  const currentReminder = activeReminders
    .filter(r => r.status === 'active')
    .sort((a, b) => b.priority - a.priority)[0] || null;

  // 获取当前活跃的提醒规则
  const fetchActiveReminders = useCallback(async () => {
    try {
      console.log('[fetchActiveReminders] Fetching active reminders...');
      const response = await api.get(API_ENDPOINTS.TIMELINE.REMINDER_CURRENT);
      
      if (response && response.data) {
        const reminderData = response.data;
        
        // 将 API 响应转换为 ReminderItem 格式
        const reminder: ReminderItemType = {
          id: reminderData.rule_id || reminderData.uid || `reminder_${Date.now()}`,
          agent: reminderData.type === 'reminder' ? 'default' : 'default', // 根据实际业务逻辑调整
          timeWindow: reminderData.time || '00:00',
          title: reminderData.title || 'Reminder',
          status: reminderData.done ? 'done' : (reminderData.switch ? 'active' : 'expired'),
          priority: 10, // 默认优先级，可以根据业务需求调整
        };
        
        // 如果 switch 为 true 且 done 为 false，则设置为 active
        if (reminderData.switch && !reminderData.done) {
          setActiveReminders([reminder]);
        } else {
          // 如果没有活跃的提醒，设置为空数组
          setActiveReminders([]);
        }
        
        console.log('[fetchActiveReminders] Active reminders updated:', reminder);
      } else {
        console.log('[fetchActiveReminders] No active reminder data');
        setActiveReminders([]);
      }
    } catch (error) {
      console.error('[fetchActiveReminders] Failed to fetch active reminders:', error);
      // 失败时保持空数组，不显示错误提示（静默处理）
      setActiveReminders([]);
    }
  }, []);


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

  // Handle mentionAgent from AsyncStorage (when using router.back())
  useFocusEffect(
    useCallback(() => {
      const checkPendingMentionAgent = async () => {
        try {
          const pendingMentionAgent = await storageManager.getItem('pendingMentionAgent');
          if (pendingMentionAgent) {
            const agentName = pendingMentionAgent as string;
            setInitialInputText(`@${agentName} `);
            setShouldAutoFocus(true);
            
            // Clear the stored value after processing
            await storageManager.removeItem('pendingMentionAgent');
          }
        } catch (error) {
          console.error('Failed to check pending mentionAgent:', error);
        }
      };
      
      checkPendingMentionAgent();
    }, [])
  );

  // 将 extract_user_task 的 tasks 数据转换为 ReminderCard Message
  const createReminderCardFromTasks = (tasks: any[], messageId?: string, timestamp?: number): Message | null => {
    if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
      return null;
    }
    console.log('createReminderCardFromTasks tasks', tasks);
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
    // 使用传入的时间戳，如果没有则使用当前时间
    const messageTimestamp = timestamp || Date.now();
    return {
      id,
      type: 'reminderCard' as const,
      content: '',
      timestamp: messageTimestamp, // 设置时间戳
      reminderCardData: {
        title: '📋 Reminder',
        monster: 'default',
        reminders: reminders
      }
    };
  };

  // 处理 function_call 类型的消息，特别是 extract_user_task
  const processFunctionCallMessage = useCallback((item: any, parseTimestampFn?: (timestamp: any, messageId: string) => number, index?: number): Message | null => {
    // 过滤掉 function_call_output 和 fun_call 类型的消息
    if (item.msg_type === 'function_call_output' || item.msg_type === 'fun_call') {
      return null;
    }
    
    // 处理 function_call 类型的消息
    if (item.msg_type === 'function_call' && item.call_res) {
      const callRes = item.call_res;
      // 如果是 extract_user_task，转换为 ReminderCard 消息
      if (callRes.name === 'extract_user_task' && callRes.arguments) {
        try {
          // 解析 arguments JSON 字符串
          const args = JSON.parse(callRes.arguments);
          
          // 提取并解析时间戳
          const timestamp = item.created_at || item.timestamp || item.createdAt || undefined;
          const messageId = item.msg_id || item._id || item.id || item.trace_id || `reminder_${index !== undefined ? index : Date.now()}_${Date.now()}`;
          let messageTimestamp: number | undefined = undefined;
          
          if (timestamp !== undefined && timestamp !== null) {
            try {
              // 如果提供了 parseTimestamp 函数，使用它（在 convertToMessages 中使用）
              if (parseTimestampFn) {
                messageTimestamp = parseTimestampFn(timestamp, messageId);
              } else {
                // 否则使用简化版本（在 complete 事件处理中使用）
                if (typeof timestamp === 'number') {
                  messageTimestamp = timestamp;
                } else {
                  const timestampStr = String(timestamp);
                  const directParse = parseInt(timestampStr, 10);
                  if (!isNaN(directParse) && directParse > 1000000000000) {
                    messageTimestamp = directParse;
                  } else {
                    const dateParse = Date.parse(timestampStr);
                    if (!isNaN(dateParse) && dateParse > 0) {
                      messageTimestamp = dateParse;
                    }
                  }
                }
              }
            } catch (error) {
              // 如果解析失败，使用 undefined（不抛出异常，允许继续处理）
              console.warn('[processFunctionCallMessage] Failed to parse timestamp for function_call message:', error);
              messageTimestamp = undefined;
            }
          }
          
          // 使用公共函数创建 ReminderCard 消息，传递原始时间戳
          const reminderCard = createReminderCardFromTasks(args.tasks, messageId, messageTimestamp);
          if (reminderCard) {
            return reminderCard;
          }
        } catch (parseError) {
          console.error('[processFunctionCallMessage] Failed to parse extract_user_task arguments:', parseError);
          // 解析失败时，返回 null 过滤掉这条消息
          return null;
        }
      }
      // 其他 function_call 类型的消息，暂时过滤掉
      return null;
    }
    
    // 不是 function_call 类型，返回 null
    return null;
  }, []);

  // 将 API 返回的数据转换为 Message 格式
  const convertToMessages = (data: any): Message[] => {
    if (!data) return [];

    console.log('[convertToMessages] Raw server response data:', {
      dataType: Array.isArray(data) ? 'array' : typeof data,
      dataLength: Array.isArray(data) ? data.length : 'N/A',
      firstItem: Array.isArray(data) && data.length > 0 ? data[0] : data,
      sampleItemKeys: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : Object.keys(data || {})
    });

    // 辅助函数：解析和验证时间戳
    const parseTimestamp = (timestamp: any, messageId: string): number => {
      if (timestamp === undefined || timestamp === null) {
        throw new Error(`[parseTimestamp] Timestamp is undefined or null. Message ID: ${messageId}`);
      }

      let parsedTimestamp: number;

      if (typeof timestamp === 'number') {
        // 已经是数字，直接使用
        parsedTimestamp = timestamp;
    } else {
        const timestampStr = String(timestamp);

        // 检查是否是时间格式字符串（如 "10:30"），如果是则抛出异常
        const timePattern = /^\d{1,2}:\d{2}(:\d{2})?$/;
        if (timePattern.test(timestampStr.trim())) {
          throw new Error(`[parseTimestamp] Invalid timestamp format: expected timestamp (number), but got time string "${timestampStr}". Message ID: ${messageId}`);
        }

        // 先尝试直接解析为数字（如果是纯数字字符串）
        const directParse = parseInt(timestampStr, 10);

        // 如果是有效的数字时间戳（大于 1000000000000），直接使用
        if (!isNaN(directParse) && directParse > 1000000000000) {
          parsedTimestamp = directParse;
        } else {
          // 尝试解析 ISO 日期字符串（如 "2025-12-24T06:36:49.239000"）
          const dateParse = Date.parse(timestampStr);
          if (!isNaN(dateParse) && dateParse > 0) {
            parsedTimestamp = dateParse;
          } else {
            // 如果无法解析为时间戳，抛出异常
            throw new Error(`[parseTimestamp] Invalid timestamp format: cannot parse "${timestampStr}" as timestamp. Expected number or ISO date string. Message ID: ${messageId}`);
          }
        }
      }

      // 验证时间戳是否合理（应该是13位数字，大于 1000000000000，即 2001-09-09）
      // 如果不是有效的时间戳，抛出异常
      if (isNaN(parsedTimestamp) || parsedTimestamp <= 1000000000000) {
        throw new Error(`[parseTimestamp] Invalid timestamp value: ${parsedTimestamp}. Expected timestamp > 1000000000000 (2001-09-09). Message ID: ${messageId}, Original value: ${timestamp}`);
      }

      return parsedTimestamp;
    };

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
      // 处理 function_call 类型的消息（使用公共函数）
      const functionCallMessage = processFunctionCallMessage(item, parseTimestamp, index);
      if (functionCallMessage !== null) {
        return functionCallMessage;
      }
      
      // 过滤掉 function_call_output 和 fun_call 类型的消息
      if (item.msg_type === 'function_call_output' || item.msg_type === 'fun_call') {
        return null;
      }
      
      const type = getMessageType(item);
      // 优先使用 msg_id 字段作为唯一标识
      const messageId = item.msg_id || Date.now().toString();
      
      // 提取图片URL（支持多个字段，包括 photoUri_preview）
      const photoUri = item.image || item.imageUrl || item.image_url || item.photoUri || item.photoUri_preview || undefined;
      
      // 提取 operation 字段（支持多种可能的字段名）
      const operation = item.operation || item.operation_type || item.op || undefined;
      
      // 提取时间戳（支持多种可能的字段名）
      // 注意：不包含 item.time，因为 time 字段可能是时间字符串（如 "10:30"）而不是时间戳
      const timestamp = item.created_at || item.timestamp || item.createdAt || undefined;
      
      // 验证并转换时间戳
      let messageTimestamp = Date.now(); // 默认使用当前时间
      if (timestamp !== undefined && timestamp !== null) {
        try {
          messageTimestamp = parseTimestamp(timestamp, messageId);
        } catch (error) {
          // 如果解析失败，使用默认的当前时间（保持原有行为）
          console.warn('[convertItem] Failed to parse timestamp, using current time:', error);
          messageTimestamp = Date.now();
        }
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
        timestamp: messageTimestamp,
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

  // 20251229-移除启动 lauch 接口，模型调用出来的结果会追加进入消息历史
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
    }, 500);

    return () => {
      clearTimeout(timer);
      // 清理上传定时器
      if (uploadTimerRef.current) {
        clearInterval(uploadTimerRef.current);
        uploadTimerRef.current = null;
        console.log('[EchoTab] 🛑 Stopped scheduled upload timer');
      }
      // 清理 memory 轮询定时器
      if (memoryPollingTimerRef.current) {
        clearInterval(memoryPollingTimerRef.current);
        memoryPollingTimerRef.current = null;
        console.log('[EchoTab] 🛑 Stopped memory polling timer');
      }
    };
  }, [requestAllPermissions]);

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

  // 按时间戳排序消息（最旧的在前，最新的在后）
  const sortMessagesByTimestamp = useCallback((messages: Message[]): Message[] => {
    return [...messages].sort((a, b) => {
      const timestampA = a.timestamp || 0;
      const timestampB = b.timestamp || 0;
      // 按时间戳从小到大排序（最旧的在前，最新的在后）
      return timestampA - timestampB;
    });
  }, []);

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
    
    // 清理 requestBody：如果 operation 字段为空或未定义，则删除该字段
    const cleanedRequestBody = { ...requestBody };
    console.log(`${logPrefix}cleanedRequestBody`, JSON.stringify(cleanedRequestBody, null, 2));
    let eventSource: any = null;
    let accumulatedText = '';
    let retryCount = 0;
    let isCompleted = false;
    let connectionOpened = false;
    let retryTimeoutId: NodeJS.Timeout | null = null;
    let connectionTimeoutId: NodeJS.Timeout | null = null;
    let responseTimeoutId: NodeJS.Timeout | null = null;
    // 保存请求时间戳，用于临时消息（使用清理后的 requestBody）
    const requestTimestamp = cleanedRequestBody.timestamp 
      ? (typeof cleanedRequestBody.timestamp === 'string' ? parseInt(cleanedRequestBody.timestamp, 10) : cleanedRequestBody.timestamp)
      : Date.now();

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
            // 创建 EventSource 实例（使用清理后的 requestBody）
            const bodyToSend = JSON.stringify(cleanedRequestBody);
            console.log(`${logPrefix}Request body to send:`, bodyToSend);
            eventSource = new EventSource(
              url,
              {
                method: 'POST',
                headers,
                body: bodyToSend,
                pollingInterval: 0,
                debug: true
              }
            );

            // 连接打开事件
            eventSource.addEventListener('open', (event: any) => {
              connectionOpened = true;
              // 清除连接超时定时器
              if (connectionTimeoutId) {
                clearTimeout(connectionTimeoutId);
                connectionTimeoutId = null;
              }
              console.log(`${logPrefix}SSE connection established`, 'event:', JSON.stringify(event, null, 2));
              
              // 添加一个定时检查，每5秒记录一次连接状态
              const statusCheckInterval = setInterval(() => {
                if (eventSource && !isCompleted) {
                  console.log(`${logPrefix}Connection status check - isCompleted: ${isCompleted}, accumulatedText length: ${accumulatedText.length}`);
                } else {
                  clearInterval(statusCheckInterval);
                }
              }, 5000);
              
              // 在连接关闭时清除状态检查
              eventSource.addEventListener('close', () => {
                clearInterval(statusCheckInterval);
                console.log(`${logPrefix}SSE connection closed`);
              });
              
              // 设置响应超时定时器（60秒），如果在这个时间内没有收到 complete 事件，重置 isSending
              responseTimeoutId = setTimeout(() => {
                if (!isCompleted) {
                  console.warn(`${logPrefix}Response timeout: No complete event received within 60 seconds, resetting isSending`);
                  // 如果有已累积的文本，保存它
                  if (accumulatedText) {
                    setMessages(prev => {
                      // 保留所有 reminderCard 类型的消息
                      const reminderCardMessages = prev.filter(msg => msg.type === 'reminderCard');
                      // 过滤掉临时消息，但保留 reminderCard 消息
                      const filtered = prev.filter(msg => msg.id !== tempMessageId && msg.type !== 'reminderCard');
                      const newMessage: Message = {
                        id: Date.now().toString(),
                        type: 'assistant' as const,
                        content: accumulatedText,
                        timestamp: Date.now(),
                      };
                      // 合并消息：先添加新消息和其他消息，然后添加 reminderCard 消息
                      const updated = [...filtered, newMessage, ...reminderCardMessages];
                      return sortMessagesByTimestamp(updated);
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
              // console.log(`${logPrefix}Message event received, raw data:`, event.data, 'event type:', event.type, 'lastEventId:', event.lastEventId);
              try {
                if (!event.data) {
                  console.warn(`${logPrefix}Message event has no data`);
                  return;
                }
                
                // 尝试解析数据
                let data;
                try {
                  data = JSON.parse(event.data);
                } catch (parseErr) {
                  console.error(`${logPrefix}Failed to parse event.data as JSON:`, parseErr, 'raw data:', event.data);
                  // 如果不是JSON，可能是纯文本，直接处理
                  if (typeof event.data === 'string' && event.data.trim()) {
                    console.log(`${logPrefix}Received non-JSON text data:`, event.data);
                    // 尝试将其作为文本块处理
                    accumulatedText += event.data;
                    setCurrentResponse(accumulatedText);
                    return;
                  }
                  return;
                }
                
                // console.log(`${logPrefix} Parsed message data:`, JSON.stringify(data, null, 2));
                
                // 处理错误消息（特别是500错误）
                if (data.type === 'error') {
                  const errorCode = data.data?.code;
                  const errorMsg = data.data?.msg || 'Unknown error';
                  console.error(`${logPrefix}Error message received:`, errorCode, errorMsg);
                  
                  // 如果是500错误，抛出异常
                  if (errorCode === 500) {
                    isCompleted = true;
                    
                    // 清除所有定时器
                    if (responseTimeoutId) {
                      clearTimeout(responseTimeoutId);
                      responseTimeoutId = null;
                    }
                    if (connectionTimeoutId) {
                      clearTimeout(connectionTimeoutId);
                      connectionTimeoutId = null;
                    }
                    if (retryTimeoutId) {
                      clearTimeout(retryTimeoutId);
                      retryTimeoutId = null;
                    }
                    
                    // 关闭连接
                    if (eventSource) {
                      try {
                        eventSource.close();
                      } catch (e) {
                        console.warn(`${logPrefix}Error closing eventSource on 500 error:`, e);
                      }
                      eventSource = null;
                    }
                    
                    // 清理状态
                    accumulatedText = '';
                    setCurrentResponse('');
                    setIsSending(false);
                    
                    // 抛出异常
                    const error = new Error(`Server error (${errorCode}): ${errorMsg}`);
                    (error as any).code = errorCode;
                    (error as any).data = data.data;
                    throw error;
                  } else {
                    // 其他错误代码，记录警告但不抛出异常
                    console.warn(`${logPrefix}Non-500 error received:`, errorCode, errorMsg);
                  }
                  return;
                } else if  (data.type === 'text_chunk') {
                  accumulatedText += data.word;
                  setCurrentResponse(accumulatedText);

                  // 更新临时消息
                  setMessages(prev => {
                    // 保留所有 reminderCard 类型的消息
                    const reminderCardMessages = prev.filter(msg => msg.type === 'reminderCard');
                    // 过滤掉临时消息，但保留 reminderCard 消息
                    const filtered = prev.filter(msg => msg.id !== tempMessageId && msg.type !== 'reminderCard');
                    // 合并消息：先添加临时消息和其他消息，然后添加 reminderCard 消息
                    const updated = [...filtered, {
                      id: tempMessageId,
                      type: 'assistant' as const,
                      content: accumulatedText,
                      timestamp: requestTimestamp, // 添加时间戳
                    }, ...reminderCardMessages];
                    // 按时间戳排序，确保最新消息在底部
                    return sortMessagesByTimestamp(updated);
                  });
                } else if (data.type === 'complete') {
                  console.log(`${logPrefix}Complete:`, JSON.stringify(data, null, 2));
                  isCompleted = true;

                  // 清除响应超时定时器
                  if (responseTimeoutId) {
                    clearTimeout(responseTimeoutId);
                    responseTimeoutId = null;
                  }

                  if (data.data?.code === 0 && data.data?.data && Array.isArray(data.data.data) && data.data.data.length > 0) {
                    const responseDataList = data.data.data;
                    const firstResponseData = responseDataList[0];

                    // 调用回调处理 complete 事件（只对第一条消息调用）
                    if (onComplete) {
                      const shouldContinue = onComplete(firstResponseData, eventSource);
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

                    // 处理所有消息（支持多条消息）
                    setMessages(prev => {
                      // 保留所有 reminderCard 类型的消息（这些消息不应该被删除）
                      const reminderCardMessages = prev.filter(msg => msg.type === 'reminderCard');
                      // 过滤掉临时消息，但保留 reminderCard 消息
                      const filtered = prev.filter(msg => msg.id !== tempMessageId && msg.type !== 'reminderCard');
                      
                      // 找出所有 text 和 function_call 类型的消息
                      const textMessages = responseDataList.filter((item: any) => item.msg_type === 'text');
                      const functionCallMessages = responseDataList.filter((item: any) => item.msg_type === 'function_call' && item.call_res);
                      
                      const newMessages: Message[] = [];
                      
                      // 处理 text 类型的消息
                      if (textMessages.length > 0) {
                        const textMsgs = textMessages.map((item: any) => {
                          const message: Message = {
                            id: item.msg_id || `${Date.now()}-${Math.random()}`,
                            type: 'assistant' as const,
                            content: item.text || '',
                            operation: item.operation || undefined,
                            timestamp: item.created_at || item.timestamp || Date.now(),
                          };
                          return message;
                        });
                        newMessages.push(...textMsgs);
                      }
                      
                      // 处理 function_call 类型的消息（使用公共函数）
                      if (functionCallMessages.length > 0) {
                        functionCallMessages.forEach((item: any) => {
                          // 使用公共函数处理 function_call 消息（不传入 parseTimestamp，使用简化版本）
                          const functionCallMessage = processFunctionCallMessage(item);
                          if (functionCallMessage !== null) {
                            newMessages.push(functionCallMessage);
                          }
                        });
                      }
                      
                      if (newMessages.length > 0) {
                        console.log('[newMessages] Created messages:', {
                          textCount: textMessages.length,
                          functionCallCount: functionCallMessages.length,
                          totalCount: newMessages.length,
                          messages: JSON.stringify(newMessages, null, 2)
                        });
                        // 添加所有新消息和其他消息，然后添加 reminderCard 消息（确保它们不会被删除）
                        const updated = [...filtered, ...newMessages, ...reminderCardMessages];
                        // 按时间戳排序，确保最新消息在底部
                        return sortMessagesByTimestamp(updated);
                      }
                      
                      // 如果没有新消息，返回原有消息列表
                      return prev;
                    });
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
                // console.error(`${logPrefix}Parse error:`, parseError, 'Raw data:', event.data);
                
                // 如果是500错误，显示错误消息并调用handleFinalError
                if ((parseError as any)?.code === 500) {
                  const errorMsg = (parseError as any)?.message || 'Server error (500)';
                  console.error(`${logPrefix}500 error caught:`, errorMsg);
                  
                  // 显示错误提示（只在非静默模式下）
                  if (!silent) {
                    Alert.alert('Server Error', errorMsg);
                  }
                  
                  // 调用handleFinalError进行清理
                  handleFinalError();
                }
              }
            });

            // 监听关闭事件
            eventSource.addEventListener('close', (event: any) => {
              console.log(`${logPrefix}SSE connection closed`, 'event:', JSON.stringify(event, null, 2));
            });

            // 错误事件
            eventSource.addEventListener('error', (event: any) => {
              console.error(`${logPrefix}SSE error:`, 'event type:', event.type, 'message:', event.message, 'xhrState:', event.xhrState, 'xhrStatus:', event.xhrStatus, 'full event:', JSON.stringify(event, null, 2));

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
          // 保留所有 reminderCard 类型的消息
          const reminderCardMessages = prev.filter(msg => msg.type === 'reminderCard');
          // 过滤掉临时消息，但保留 reminderCard 消息
          const filtered = prev.filter(msg => msg.id !== tempMessageId && msg.type !== 'reminderCard');
          const newMessage: Message = {
            id: Date.now().toString(),
            type: 'assistant' as const,
            content: accumulatedText,
            timestamp: Date.now(),
          };
          // 合并消息：先添加新消息和其他消息，然后添加 reminderCard 消息
          const updated = [...filtered, newMessage, ...reminderCardMessages];
          return sortMessagesByTimestamp(updated);
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
      console.log(`${logPrefix}Request body:`, JSON.stringify(cleanedRequestBody, null, 2));
      await createConnection();
    } catch (error) {
      console.error(`${logPrefix}Failed:`, error);
      handleFinalError();
    }
  }, [apiConfig, sortMessagesByTimestamp]);

  // 发送新用户欢迎语消息
  const sendNewUserMessage = useCallback(async (userDataParam = null) => {
    try {
      // 如果已经发送过新用户消息，直接返回，避免重复发送
      if (newUserMessageSentRef.current) {
        console.log('sendNewUserMessage already sent, skipping duplicate call');
        return;
      }
      
      console.log('sendNewUserMessage ing');
      
      // 优先使用传入的参数，如果没有则使用状态中的 userData
      const currentUserData = userDataParam || userData;
      
      if (!currentUserData) {
        console.log('sendNewUserMessage end with no userData');
        return;
      }
      
      // 标记为已发送，防止重复调用
      newUserMessageSentRef.current = true;
      
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
      
      // 调用通用处理函数，静默处理，不显示错误
      await handleStreamRequest({
        requestBody,
        tempMessageId: 'temp_new_user',
        logPrefix: 'New User message',
        onComplete: () => {
          // new_user 消息需要显示响应，返回 true 继续默认处理
          console.log('New User message sent');
          return true;
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
      
      // 设置发送状态，显示 Thinking... 指示器
      setIsSending(true);
      setCurrentResponse('');
      
      // 调用通用处理函数，静默处理，不显示错误
      await handleStreamRequest({
        requestBody,
        tempMessageId: 'temp_enter_user',
        logPrefix: 'Enter User message',
        onComplete: () => {
          // enter 消息需要显示响应，返回 true 继续默认处理
          console.log('Enter User message sent');
          return true;
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

  

  // 将 memory 数据转换为 Message 格式
  const convertMemoryToMessages = useCallback((memoryList: any[]): Message[] => {
    if (!memoryList || !Array.isArray(memoryList) || memoryList.length === 0) {
      return [];
    }

    return memoryList.map((memoryItem) => {
      // 构建展示内容：第一行为 memory_type，第二行为 [memory_tag]memory字段
      const memoryType = memoryItem.memory_type || '';
      const memoryTag = memoryItem.memory_tag || '';
      let memory = memoryItem.memory || memoryItem.raw_text || '';
      
      // 应用字符串替换规则
      if (memory) {
        // 替换 Person1 为 Boss
        memory = memory.replace(/Person1/g, 'Boss');
        
        // 根据 memoryTag 替换 person2
        let person2Replacement = 'monster'; // 默认值
        switch (memoryTag) {
          case 'general':
            person2Replacement = 'monster';
            break;
          case 'diet':
            person2Replacement = 'diet';
            break;
          case 'sleep_energy':
            person2Replacement = 'sleep';
            break;
          case 'activity':
            person2Replacement = 'monster';
            break;
          case 'emotion_stress':
            person2Replacement = 'emotion';
            break;
        }
        // 替换 person2（不区分大小写）
        memory = memory.replace(/Person2/gi, person2Replacement);
      }
      
      // 格式化内容：memory_type\n[memory_tag]memory
      let content = '';
      if (memoryType) {
        content = memoryType;
      }
      if (memoryTag && memory) {
        content += content ? `\n[${memoryTag}]${memory}` : `[${memoryTag}]${memory}`;
      } else if (memory) {
        content += content ? `\n${memory}` : memory;
      }
      // 提取时间戳（created_at 字段）
      const timestamp = memoryItem.created_at || Date.now();
      
      return {
        id: memoryItem.id || `memory_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'assistant' as const,
        content: content,
        avatar: '🦑',
        isMemory: true, // 标识为 memory 消息
        timestamp: typeof timestamp === 'number' ? timestamp : parseInt(timestamp, 10) || Date.now(),
      };
    });
  }, []);

  // 获取 memory 列表
  const fetchMemoryList = useCallback(async () => {
    try {
      console.log('[fetchMemoryList] Starting to fetch memory list');
      const result: any = await conversationService.getMemoryList({ limit: 20 } as any);

      if (result.success && result.data && Array.isArray(result.data)) {
        console.log('[fetchMemoryList] Memory list fetched:', {
          count: result.data.length,
          sampleItem: result.data[0]
        });

        // 将 memory 数据转换为 Message 格式
        const memoryMessages = convertMemoryToMessages(result.data);
        
        if (memoryMessages.length > 0) {
          // 更新最新的 memory id（取第一条，因为 API 返回的是按时间倒序的）
          const latestMemory = result.data[0];
          if (latestMemory && latestMemory.id) {
            latestMemoryIdRef.current = latestMemory.id;
            console.log('[fetchMemoryList] Updated latest memory id:', latestMemory.id);
          }
          
          // 将 memory 消息合并到消息列表中，并按时间戳排序
          setMessages(prev => {
            // 创建一个消息ID集合，用于去重
            const existingIds = new Set(prev.map(msg => msg.id));
            // 只添加不存在的 memory 消息
            const newMemoryMessages = memoryMessages.filter(msg => !existingIds.has(msg.id));
            
            if (newMemoryMessages.length > 0) {
              // 合并所有消息（包括新的 memory 消息和现有消息）
              const merged = [...prev, ...newMemoryMessages];
              // 按时间戳排序（最旧的在前，最新的在后）
              const sorted = sortMessagesByTimestamp(merged);
              console.log('[fetchMemoryList] Added and sorted memory messages:', {
                newCount: newMemoryMessages.length,
                totalCount: sorted.length,
                sortedByTimestamp: true
              });
              return sorted;
            }
            return prev;
          });
        }
      } else {
        console.warn('[fetchMemoryList] Failed to get memory list:', result.message);
      }
    } catch (error) {
      console.error('[fetchMemoryList] Error getting memory list:', error);
    }
  }, [convertMemoryToMessages, sortMessagesByTimestamp]);

  // 轮询最新的 memory 内容
  const pollLatestMemory = useCallback(async () => {
    try {
      const latestMemoryId = latestMemoryIdRef.current;
      
      // 构建请求参数：如果有 latestMemoryId 则使用它，否则不传 memory_id 以获取最新的 memory
      const requestParams: any = { limit: 20 };
      if (latestMemoryId) {
        requestParams.memory_id = latestMemoryId;
        console.log('[pollLatestMemory] Polling for new memory with memory_id:', latestMemoryId);
      } else {
        console.log('[pollLatestMemory] No latest memory id, fetching latest memory list');
      }

      const result: any = await conversationService.getMemoryList(requestParams);

      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        console.log('[pollLatestMemory] New memory found:', {
          count: result.data.length,
          sampleItem: result.data[0]
        });

        // 将 memory 数据转换为 Message 格式
        const memoryMessages = convertMemoryToMessages(result.data);
        
        if (memoryMessages.length > 0) {
          // 更新最新的 memory id（取第一条，因为 API 返回的是按时间倒序的）
          const latestMemory = result.data[0];
          if (latestMemory && latestMemory.id) {
            latestMemoryIdRef.current = latestMemory.id;
            console.log('[pollLatestMemory] Updated latest memory id:', latestMemory.id);
          }
          
          // 将新的 memory 消息合并到消息列表中，并按时间戳排序
          setMessages(prev => {
            // 创建一个消息ID集合，用于去重
            const existingIds = new Set(prev.map(msg => msg.id));
            // 只添加不存在的 memory 消息
            const newMemoryMessages = memoryMessages.filter(msg => !existingIds.has(msg.id));
            
            if (newMemoryMessages.length > 0) {
              // 合并所有消息（包括新的 memory 消息和现有消息）
              const merged = [...prev, ...newMemoryMessages];
              // 按时间戳排序（最旧的在前，最新的在后）
              const sorted = sortMessagesByTimestamp(merged);
              console.log('[pollLatestMemory] Added and sorted new memory messages:', {
                newCount: newMemoryMessages.length,
                totalCount: sorted.length,
                sortedByTimestamp: true
              });
              return sorted;
            }
            return prev;
          });
                  }
                } else {
        console.log('[pollLatestMemory] No new memory found');
                }
              } catch (error) {
      console.error('[pollLatestMemory] Error polling latest memory:', error);
      // 静默处理错误，不阻塞轮询
    }
  }, [convertMemoryToMessages, sortMessagesByTimestamp]);

  // 启动 memory 轮询定时器
  const startMemoryPolling = useCallback(() => {
    // 如果定时器已存在，先清理
    if (memoryPollingTimerRef.current) {
      console.log('[startMemoryPolling] Clearing existing polling timer');
      clearInterval(memoryPollingTimerRef.current);
      memoryPollingTimerRef.current = null;
    }

    console.log('[startMemoryPolling] Starting memory polling timer (every 5 seconds)');
    
    // 启动定时器，每5秒执行一次轮询
    memoryPollingTimerRef.current = setInterval(async () => {
      try {
        console.log('[startMemoryPolling] Scheduled memory poll: polling for new memory...');
        await pollLatestMemory();
        console.log('[startMemoryPolling] Scheduled memory poll completed');
      } catch (error) {
        console.error('[startMemoryPolling] Scheduled memory poll failed:', error);
      }
    }, 3 * 1000); // 3秒 = 3 * 1000 毫秒
    
    console.log('[startMemoryPolling] Memory polling timer started successfully, timer ID:', memoryPollingTimerRef.current);
  }, [pollLatestMemory]);

  // 获取对话历史
  const fetchConversationHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const result: any = await conversationService.getConversationHistory();
      console.log('[fetchConversationHistory] result', JSON.stringify(result, null, 2));
      let historyMessages: Message[] = [];

      if (result.success && result.data) {
        // 调试日志：查看服务端返回的原始数据结构
        const convertedMessages = convertToMessages(result.data);
        // 不反转，保持原始顺序，后续会按时间戳排序
        historyMessages = convertedMessages;
        
        // 合并历史消息和当前消息，按时间戳排序
        setMessages(prev => {
          // 如果已经有消息，合并而不是替换
          if (prev.length > 0) {
            // 保留所有 reminderCard 类型的消息（这些消息不应该被服务器返回的消息列表覆盖）
            const reminderCardMessages = prev.filter(msg => msg.type === 'reminderCard');
            // 创建一个消息ID集合，用于去重（包括 reminderCard 消息的 ID）
            const existingIds = new Set(prev.map(msg => msg.id));
            // 只添加不存在的历史消息
            const newHistoryMessages = historyMessages.filter(msg => !existingIds.has(msg.id));
            // 合并所有消息：先添加历史消息，然后添加 reminderCard 消息（确保它们不会被删除）
            const merged = [...prev.filter(msg => msg.type !== 'reminderCard'), ...newHistoryMessages, ...reminderCardMessages];
            // 按时间戳排序（最旧的在前，最新的在后）
            const sorted = sortMessagesByTimestamp(merged);
            return sorted;
          }
          // 如果没有现有消息，按时间戳排序后返回历史消息
          return sortMessagesByTimestamp(historyMessages);
        });
      } else {
        console.error('Failed to get conversation history:', result.message);
        // 只有在没有现有消息时才清空
        setMessages(prev => prev.length > 0 ? prev : []);
      }
      
      // 获取 memory 列表
      await fetchMemoryList();
      
      // 启动 memory 轮询（在获取初始 memory 列表后）
      startMemoryPolling();
      
      // 获取活跃的提醒规则
      await fetchActiveReminders();
      
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
        // 历史消息有值，重置新用户消息标记（允许在历史消息被清空后再次发送）
        newUserMessageSentRef.current = false;
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
  }, [userData, sendNewUserMessage, sendEnterUserMessage, fetchMemoryList, sortMessagesByTimestamp, startMemoryPolling, fetchActiveReminders]);

  // 组件挂载时获取对话历史（只在首次挂载时获取）
  useEffect(() => {
    // 如果已经初始化过，不再重复获取
    if (historyInitializedRef.current) {
      console.log('History messages already initialized, skipping duplicate fetch');
      // 如果有照片参数，不设置 isLoading，让照片处理逻辑自己处理
      if (!params.photoUri) {
        setIsLoading(false);
      }
      return;
    }
    
    // 如果有照片参数，不在这里获取历史消息，让照片处理逻辑来处理
    // 这样可以确保历史消息在添加图片消息之前已经加载
    if (params.photoUri) {
      console.log('Photo parameter detected, history will be loaded in photo processing logic');
      return;
    }

    // 首次挂载且没有照片参数时，获取历史消息
    historyInitializedRef.current = true;
    fetchConversationHistory();
  }, [fetchConversationHistory, params.photoUri]);

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
      const currentTimestamp = Date.now();

      // 添加用户消息（如果还没有添加的话，比如照片消息已经在useEffect中添加了）
      if (!photoUri) {
        const userMsg: Message = {
          id: Date.now().toString(),
          type: 'user',
          content: userMessage,
          timestamp: currentTimestamp,
        };
        setMessages(prev => {
          const updated = [...prev, userMsg];
          // 按时间戳排序，确保最新消息在底部
          return sortMessagesByTimestamp(updated);
        });
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
      console.log('send msg to server requestBody', requestBody);
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
  }, [userData, handleStreamRequest, sortMessagesByTimestamp]);

  // 处理从 AsyncStorage 获取的待处理图片信息
  const processPendingPhoto = useCallback(async (photoData: any) => {
    if (!photoData || !userData) {
      return;
    }

    const { photoUri, agentId, imageDetectionType, mode, description } = photoData;

    // 避免重复处理同一张照片
    if (processedPhotoRef.current === photoUri) {
      console.log('Photo already processed, skipping:', photoUri);
      // 清除待处理的图片信息
      await storageManager.clearPendingPhoto();
          return;
        }
    processedPhotoRef.current = photoUri;

    // 检查当前是否已有历史消息
    const hasHistoryMessages = messages.some(msg => msg.type === 'assistant' || msg.isMemory);

    // 如果历史消息还没有初始化，先加载历史消息
    if (!historyInitializedRef.current && !hasHistoryMessages) {
      console.log('History not initialized yet, loading history first before processing pending photo');
      setIsLoading(true);
      historyInitializedRef.current = true;
      try {
        await fetchConversationHistory();
      } catch (error) {
        console.error('Failed to load conversation history before processing pending photo:', error);
      } finally {
        setIsLoading(false);
      }
    }

    const messageId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const currentTimestamp = Date.now();
    // 根据模式设置消息内容
    const messageContent = mode === 'photo-text' && description 
      ? description 
      : '';
    
    const userMsg: Message = {
      id: messageId,
      type: 'user',
      content: messageContent,
      photoUri: photoUri,
      timestamp: currentTimestamp,
    };

    console.log('Preparing to add pending photo message to interface:', {
      id: userMsg.id,
      type: userMsg.type,
      hasPhotoUri: !!userMsg.photoUri,
      photoUriPreview: userMsg.photoUri?.substring(0, 80),
      content: userMsg.content,
      mode,
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
      // 按时间戳排序，确保最新消息在底部
      const sorted = sortMessagesByTimestamp(newMessages);
      console.log('✅ Successfully added pending photo message, updated message list length:', sorted.length);
      return sorted;
    });

    // 根据模式设置消息文本
    const messageText = mode === 'photo-text' && description 
      ? description 
      : '';

    console.log('Sending pending image message:', {
      mode,
      messageText,
      photoUri,
      imageDetectionType,
      agentId,
    });

    // 延迟发送消息，确保消息已经添加到状态中
    setTimeout(() => {
      // 传递图片URL和imageDetectionType给 handleStreamResponse
      handleStreamResponse(messageText, photoUri, imageDetectionType);

      // 清除待处理的图片信息
      storageManager.clearPendingPhoto();
    }, 50);
  }, [userData, messages, handleStreamResponse, sortMessagesByTimestamp, fetchConversationHistory]);

  // 每次页面聚焦时，触发刷新 AgentLogs 并检查上传定时器和 memory 轮询定时器
  // 使用 useRef 存储函数引用，避免依赖项变化导致 useFocusEffect 重新执行
  const startUploadTimerRef = useRef(startUploadTimer);
  const startMemoryPollingRef = useRef(startMemoryPolling);
  const processPendingPhotoRef = useRef(processPendingPhoto);
  const fetchConversationHistoryRef = useRef(fetchConversationHistory);
  const fetchActiveRemindersRef = useRef(fetchActiveReminders);
  const lastHistoryFetchTimeRef = useRef<number>(0);
  
  // 更新 ref 值，但不触发 useFocusEffect 重新执行
  useEffect(() => {
    startUploadTimerRef.current = startUploadTimer;
    startMemoryPollingRef.current = startMemoryPolling;
    processPendingPhotoRef.current = processPendingPhoto;
    fetchConversationHistoryRef.current = fetchConversationHistory;
    fetchActiveRemindersRef.current = fetchActiveReminders;
  }, [startUploadTimer, startMemoryPolling, processPendingPhoto, fetchConversationHistory, fetchActiveReminders]);

  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
      const MIN_REFRESH_INTERVAL = 5000; // 最小刷新间隔 5 秒（从2秒增加到5秒）
      const MIN_HISTORY_FETCH_INTERVAL = 2000; // 历史消息获取最小间隔 2 秒
      const wasPageFocused = isPageFocusedRef.current;
      
      // 标记页面为聚焦状态
      isPageFocusedRef.current = true;

      // 获取活跃的提醒规则（优先执行，确保总是会获取）
      console.log('[useFocusEffect] Fetching active reminders on tab focus');
      fetchActiveRemindersRef.current().catch((error) => {
        console.error('[useFocusEffect] Failed to fetch active reminders:', error);
      });

      // 如果历史消息已经初始化过，且距离上次获取时间超过最小间隔，则触发获取历史消息
      if (historyInitializedRef.current) {
        const timeSinceLastHistoryFetch = now - lastHistoryFetchTimeRef.current;
        if (timeSinceLastHistoryFetch >= MIN_HISTORY_FETCH_INTERVAL) {
          console.log('[useFocusEffect] Fetching conversation history on tab focus');
          lastHistoryFetchTimeRef.current = now;
          fetchConversationHistoryRef.current().catch((error) => {
            console.error('[useFocusEffect] Failed to fetch conversation history:', error);
          });
        } else {
          console.log(`[useFocusEffect] Skipping history fetch, too soon since last fetch (${timeSinceLastHistoryFetch}ms)`);
        }
      }

      // 如果页面之前就已经处于聚焦状态，且距离上次刷新时间太短，则跳过刷新
      // 这样可以避免在页面没有真正失去焦点时重复刷新
      // 注意：fetchActiveReminders 已经在上面执行了，所以即使这里 early return，提醒数据也会更新
      if (wasPageFocused && timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
        console.log(`Page already focused, skipping refresh (${timeSinceLastRefresh}ms since last refresh)`);
        
        // 检查上传定时器和 memory 轮询定时器，但不触发刷新
        if (!uploadTimerRef.current) {
          console.log('[EchoTab] ⚠️ Upload timer not running on focus, restarting...');
          startUploadTimerRef.current();
        }
        
        if (!memoryPollingTimerRef.current) {
          console.log('[EchoTab] ⚠️ Memory polling timer not running on focus, restarting...');
          startMemoryPollingRef.current();
        }
        
        // 清理函数：标记页面为失焦状态
        return () => {
          isPageFocusedRef.current = false;
          if (refreshDebounceTimerRef.current) {
            clearTimeout(refreshDebounceTimerRef.current);
            refreshDebounceTimerRef.current = null;
          }
        };
      }

      // 清除之前的防抖定时器
      if (refreshDebounceTimerRef.current) {
        clearTimeout(refreshDebounceTimerRef.current);
        refreshDebounceTimerRef.current = null;
      }

      // 如果距离上次刷新时间太短，使用防抖延迟刷新
      if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL) {
        console.log(`Page focused, but too soon since last refresh (${timeSinceLastRefresh}ms), debouncing...`);
        refreshDebounceTimerRef.current = setTimeout(() => {
          // 检查页面是否仍然处于聚焦状态
          if (isPageFocusedRef.current) {
            console.log('Page focused, triggering AgentLogs refresh (debounced)');
            lastRefreshTimeRef.current = Date.now();
            setRefreshTrigger(prev => prev + 1);
          }
          refreshDebounceTimerRef.current = null;
        }, MIN_REFRESH_INTERVAL - timeSinceLastRefresh);
                  } else {
        console.log('Page focused, triggering AgentLogs refresh');
        lastRefreshTimeRef.current = now;
        setRefreshTrigger(prev => prev + 1);
      }
      
      // 检查上传定时器是否在运行，如果没有则重新启动
      if (!uploadTimerRef.current) {
        console.log('[EchoTab] ⚠️ Upload timer not running on focus, restarting...');
        startUploadTimerRef.current();
      } else {
        console.log('[EchoTab] ✅ Upload timer is running (ID:', uploadTimerRef.current, ')');
      }
      
      // 检查 memory 轮询定时器是否在运行，如果没有则重新启动
      if (!memoryPollingTimerRef.current) {
        console.log('[EchoTab] ⚠️ Memory polling timer not running on focus, restarting...');
        startMemoryPollingRef.current();
      } else {
        console.log('[EchoTab] ✅ Memory polling timer is running (ID:', memoryPollingTimerRef.current, ')');
      }

      // 检查是否有待处理的图片信息（从相机页面返回时）
      const checkPendingPhoto = async () => {
        const pendingPhoto = await storageManager.getPendingPhoto();
        if (pendingPhoto) {
          console.log('Found pending photo, processing...', pendingPhoto);
          await processPendingPhotoRef.current(pendingPhoto);
        }
      };
      checkPendingPhoto();

      // 清理函数：标记页面为失焦状态，清除防抖定时器
      return () => {
        isPageFocusedRef.current = false;
        if (refreshDebounceTimerRef.current) {
          clearTimeout(refreshDebounceTimerRef.current);
          refreshDebounceTimerRef.current = null;
        }
      };
    }, []) // 移除所有依赖项，使用 ref 来访问最新的函数
  );

  // 监听应用从后台回到前台，触发获取历史消息
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // 当应用从后台（background/inactive）回到前台（active）时
      if (nextAppState === 'active') {
        // 检查历史消息是否已经初始化
        if (historyInitializedRef.current) {
          const now = Date.now();
          const MIN_HISTORY_FETCH_INTERVAL = 2000; // 历史消息获取最小间隔 2 秒
          const timeSinceLastHistoryFetch = now - lastHistoryFetchTimeRef.current;
          
          if (timeSinceLastHistoryFetch >= MIN_HISTORY_FETCH_INTERVAL) {
            console.log('[AppState] App came to foreground, fetching conversation history');
            lastHistoryFetchTimeRef.current = now;
            fetchConversationHistoryRef.current().catch((error) => {
              console.error('[AppState] Failed to fetch conversation history:', error);
            });
          } else {
            console.log(`[AppState] Skipping history fetch, too soon since last fetch (${timeSinceLastHistoryFetch}ms)`);
          }
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []); // 空依赖数组，只在组件挂载时设置监听器

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
      
      // 处理图片消息的逻辑
      const processPhotoMessage = async () => {
        // 检查当前是否已有历史消息（通过检查 messages 状态中是否有 assistant 类型的消息）
        const hasHistoryMessages = messages.some(msg => msg.type === 'assistant' || msg.isMemory);

        // 如果历史消息已经初始化或者已有历史消息，不再重新获取，直接处理图片消息
        // 这样可以避免不必要的网络请求和界面刷新
        if (historyInitializedRef.current || hasHistoryMessages) {
          console.log('History already initialized or exists, skipping history fetch, directly processing photo', {
            historyInitialized: historyInitializedRef.current,
            hasHistoryMessages,
            messagesCount: messages.length
          });
          setIsLoading(false);
        } else {
          // 如果历史消息还没有初始化，先加载历史消息，然后再处理图片
          // 这样可以确保历史消息不会丢失
          console.log('History not initialized yet, loading history first before processing photo');
          setIsLoading(true);
          historyInitializedRef.current = true; // 标记为已初始化，避免重复加载
          try {
            await fetchConversationHistory();
          } catch (error) {
            console.error('Failed to load conversation history before processing photo:', error);
          } finally {
            setIsLoading(false);
          }
        }

        const messageId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const currentTimestamp = Date.now();
        const userMsg: Message = {
          id: messageId,
          type: 'user', 
          content: mode === 'photo-text' ? (description || '') : '',
          photoUri: photoUri,
          timestamp: currentTimestamp,
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
          // 按时间戳排序，确保最新消息在底部
          const sorted = sortMessagesByTimestamp(newMessages);
          console.log('✅ Successfully added message, updated message list length:', sorted.length);
          console.log('Latest message:', sorted[sorted.length - 1]);
          return sorted;
        });
        
        // 根据模式设置消息文本
        const messageText = mode === 'photo-text' && description 
          ? description 
          : '';
        
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
          // 使用 setParams 清除参数，而不是 replace，这样可以保持在当前页面
          // 相机页面已经使用 replace 导航到这里，所以这里只需要清除参数即可
          setTimeout(() => {
            // 清除所有相关参数，避免重复处理
            router.setParams({
              photoUri: undefined,
              mode: undefined,
              description: undefined,
              imageDetectionType: undefined,
              agentId: undefined,
            });
          }, 100);
        }, 50);
      };

      // 执行处理逻辑
      processPhotoMessage();
    }
  }, [params.photoUri, params.mode, params.description, params.imageDetectionType, params.agentId, userData, handleStreamResponse, router, sortMessagesByTimestamp, fetchConversationHistory, messages]);

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
      const currentTimestamp = Date.now();

      // 添加用户消息，使用 text 作为显示内容
      // 注意：这个消息会被 ConversationSection 过滤掉（因为 isOperation: true）
      const userMsg: Message = {
        id: Date.now().toString(),
        type: 'user',
        content: text,
        operation: operation, // 标记为 operation 消息，用于在界面中过滤显示
        timestamp: currentTimestamp,
      };
      setMessages(prev => {
        const updated = [...prev, userMsg];
        // 按时间戳排序，确保最新消息在底部
        return sortMessagesByTimestamp(updated);
      });

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
      
      // 消息发送完成后，重新获取最新的提醒数据
      await fetchActiveReminders();
      
    } catch (error) {
      console.error('Error sending reminder message:', error);
      Alert.alert('Error', 'Failed to send message, please try again');
      setIsSending(false);
      // 即使失败，也尝试刷新提醒数据，确保 UI 状态正确
      try {
        await fetchActiveReminders();
      } catch (refreshError) {
        console.error('[handleReminderMessage] Failed to refresh reminders after error:', refreshError);
      }
    }
  }, [userData, handleStreamRequest, detectMention, handleFunctionCall, sortMessagesByTimestamp, fetchActiveReminders]);

  // 处理提醒完成事件
  const handleReminderDone = useCallback(async (id: string) => {
    try {
      console.log('[handleReminderDone] Marking reminder as done:', id);
      
      // 在发送请求之前，先获取当前提醒的信息（用于后续发送消息）
      const currentReminderInfo = activeReminders.find(r => r.id === id);
      const time = currentReminderInfo?.timeWindow || '';
      const title = currentReminderInfo?.title || '';
      
      // 调用 API 标记提醒为已完成
      // 注意：请求体是一个字符串（提醒 ID），Content-Type 是 application/json
      const response = await api.post(API_ENDPOINTS.TIMELINE.REMINDER_DONE, id, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('[handleReminderDone] Reminder marked as done successfully response:', response);
      
      // 请求成功后，发送消息（参考 ReminderCard.tsx 的实现）
      // 检查响应是否成功：支持 ApiResponse 实例的 isSuccess() 方法，也支持直接检查 code 字段
      const isSuccess = response && (
        (typeof response.isSuccess === 'function' && response.isSuccess()) ||
        response.code === 'A0000' ||
        response.code === 0 ||
        response.msg === 'success' ||
        response.msg === 'succ'
      );
      
      if (isSuccess && time && title) {
        const operationMessage = `reminder_done_${time}_${title}`;
        const textMessage = `已经完成 ${time} 的${title}提醒`;
        
        console.log('[handleReminderDone] Sending reminder done message:', { operationMessage, textMessage });
        
        // 调用 handleReminderMessage 发送消息
        await handleReminderMessage(operationMessage, textMessage);
      } else if (!time || !title) {
        console.warn('[handleReminderDone] Missing time or title, skipping message send:', { time, title });
      } else if (!isSuccess) {
        console.warn('[handleReminderDone] Request was not successful, skipping message send:', response);
      }
      
      // 请求成功后，重新获取最新的提醒数据
      await fetchActiveReminders();
    } catch (error) {
      console.error('[handleReminderDone] Failed to mark reminder as done:', error);
      // 即使失败，也尝试刷新提醒数据，确保 UI 状态正确
      try {
        await fetchActiveReminders();
      } catch (refreshError) {
        console.error('[handleReminderDone] Failed to refresh reminders after error:', refreshError);
      }
    }
  }, [fetchActiveReminders, activeReminders, handleReminderMessage]);

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
        <ReminderBar 
          reminder={currentReminder} 
          onDone={handleReminderDone} 
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
    backgroundColor: '#F6F1EF',
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
