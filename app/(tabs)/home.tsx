import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Bell,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Image as ImageIcon,
  MapPin,
  X
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../../src/services/api-clients/client';
import { API_ENDPOINTS, getHeadersWithPassId } from '../../src/services/api/api';
import calendarManager from '../../src/utils/calendar-manager';
import healthDataManager, { HealthDataType } from '../../src/utils/health-data-manager';
import locationManager from '../../src/utils/location-manager';

const DEFAULT_MESSAGE = "I'll start giving insights once we talk a bit more.";

interface LogEntry {
  time: string;
  message: string;
}

// Helper function to format time from various formats to HH:mm
const formatTime = (timeInput: any): string => {
  if (!timeInput) return '';
  
  // If it's already in HH:mm format, return as is
  if (typeof timeInput === 'string' && /^\d{2}:\d{2}$/.test(timeInput)) {
    return timeInput;
  }
  
  // If it's a timestamp (number or ISO string), convert to HH:mm
  try {
    let date: Date;
    
    // Handle numeric string timestamps (e.g., "151351233523")
    if (typeof timeInput === 'string' && /^\d+$/.test(timeInput)) {
      const timestamp = parseInt(timeInput, 10);
      // If it's a 13-digit timestamp (milliseconds), use as is
      // If it's a 10-digit timestamp (seconds), convert to milliseconds
      date = new Date(timeInput.length === 13 ? timestamp : timestamp * 1000);
    } else {
      date = new Date(timeInput);
    }
    
    if (!isNaN(date.getTime())) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  } catch (error) {
    // If parsing fails, return the original value as string
  }
  
  return String(timeInput);
};

export default function HomeTab() {
  const router = useRouter();
  const [permissions, setPermissions] = useState({
    location: true,
    healthkit: false,
    calendar: true,
    photos: true,
    camera: false,
    // microphone: true,
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [allTimelineData, setAllTimelineData] = useState<Record<string, Array<{ time: string; category: string; description: string }>>>({});

  // Timeline item types
  type TimelineItem = {
    id?: string;
    time: string;
    type: 'reminder' | 'prediction' | 'action' | 'unknown';
    title?: string;
    subtitle?: string;
    agentTag?: string;
    description?: string;
    toggleEnabled?: boolean;
  };

  // Timeline data from API
  const [timelineData, setTimelineData] = useState<TimelineItem[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const fetchingDatesRef = useRef<Set<string>>(new Set());
  const timelineDataCacheRef = useRef<Record<string, Array<{ time: string; category: string; description: string }>>>({});
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // 检查所有健康子项权限状态
  const checkAllHealthPermissions = async (silent = false): Promise<boolean> => {
    try {
      const isAvailable = await healthDataManager.isAvailable();
      if (!isAvailable) {
        console.log('[HomeTab] HealthKit not available');
        return false;
      }

      // 定义需要检查的所有健康子项权限
      const requiredPermissions = [
        HealthDataType.STEP_COUNT,
        HealthDataType.HEART_RATE,
        HealthDataType.SLEEP_ANALYSIS,
        HealthDataType.ACTIVE_ENERGY,
        HealthDataType.HEIGHT,
        HealthDataType.WEIGHT,
        HealthDataType.BLOOD_PRESSURE_SYSTOLIC,
        HealthDataType.BLOOD_PRESSURE_DIASTOLIC,
      ];

      // 检查每个权限是否已授权
      // 如果 silent 为 false，先尝试初始化权限以获取系统真实状态
      // 如果权限已授权，initHealthKit 不会弹出对话框
      // 如果权限未授权，initHealthKit 会弹出对话框
      if (!silent) {
        const initResult = await healthDataManager.initHealthKit(requiredPermissions, []);
        if (!initResult.success) {
          console.log('[HomeTab] HealthKit initialization failed:', initResult.error);
          // 初始化失败不一定意味着权限被拒绝，可能是其他原因
          // 继续检查已授权的权限列表
        }
      }

      // 检查已授权的权限列表
      const authorizedPermissions = healthDataManager.getAuthorizedPermissions();
      
      // 检查所有必需权限是否都在已授权列表中
      const allAuthorized = requiredPermissions.every(perm => 
        authorizedPermissions.includes(perm)
      );

      console.log('[HomeTab] HealthKit permission check:', {
        required: requiredPermissions.length,
        authorized: authorizedPermissions.length,
        allAuthorized,
        authorizedList: authorizedPermissions,
      });

      return allAuthorized;
    } catch (error) {
      console.error('[HomeTab] Failed to check HealthKit permission:', error);
      return false;
    }
  };

  // 同步所有权限状态的函数
  const syncAllPermissions = async () => {
    const syncLocationPermission = async () => {
      try {
        const result = await locationManager.checkLocationPermission('foreground');
        setPermissions((prev) => ({
          ...prev,
          location: result.success,
        }));
      } catch (error) {
        console.error('[HomeTab] Failed to check location permission:', error);
      }
    };

    const syncCalendarPermission = async () => {
      try {
        const result = await calendarManager.checkPermission();
        setPermissions((prev) => ({
          ...prev,
          calendar: result.granted,
        }));
      } catch (error) {
        console.error('[HomeTab] Failed to check calendar permission:', error);
      }
    };

    const syncHealthKitPermission = async () => {
      try {
        // 静默检查权限状态（不弹出权限请求对话框）
        const allAuthorized = await checkAllHealthPermissions(true);
        setPermissions((prev) => ({
          ...prev,
          healthkit: allAuthorized,
        }));
      } catch (error) {
        console.error('[HomeTab] Failed to check HealthKit permission:', error);
      }
    };

    const syncPhotosPermission = async () => {
      try {
        const permissionResult = await ImagePicker.getMediaLibraryPermissionsAsync();
        setPermissions((prev) => ({
          ...prev,
          photos: permissionResult.granted,
        }));
      } catch (error) {
        console.error('[HomeTab] Failed to check photos permission:', error);
      }
    };

    const syncCameraPermission = async () => {
      try {
        const permissionResult = await ImagePicker.getCameraPermissionsAsync();
        setPermissions((prev) => ({
          ...prev,
          camera: permissionResult.granted,
        }));
      } catch (error) {
        console.error('[HomeTab] Failed to check camera permission:', error);
      }
    };

    // const syncMicrophonePermission = async () => {
    //   try {
    //     const permissionResult = await Audio.getPermissionsAsync();
    //     setPermissions((prev) => ({
    //       ...prev,
    //       microphone: permissionResult.granted,
    //     }));
    //   } catch (error) {
    //     console.error('[HomeTab] Failed to check microphone permission:', error);
    //   }
    // };

    syncLocationPermission();
    syncCalendarPermission();
    syncHealthKitPermission();
    syncPhotosPermission();
    syncCameraPermission();
    // syncMicrophonePermission();
  };

  useEffect(() => {
    // 初始同步权限状态
    syncAllPermissions();

    // 监听应用状态变化，当应用从后台返回前台时同步权限状态
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // 应用重新获得焦点时同步权限状态
        syncAllPermissions();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // Fetch agent log data from API
  const fetchAgentLogs = useCallback(async () => {
    try {
      setIsLoadingLogs(true);
      const baseHeaders = await getHeadersWithPassId();
      const passIdValue = (baseHeaders as any).passId || (baseHeaders as any).passid;
      
      const response = await api.get(
        API_ENDPOINTS.AGENT_LOG.INFO,
        {
          headers: {
            'passid': passIdValue,
          },
        }
      );
      console.log('fetchAgentLogs response', response);

      if (response.isSuccess() && response.data) {
        // Transform API response to log entries format
        // API returns: { code: 0, msg: "success", data: { records: [...], ... } }
        let entries: LogEntry[] = [];
        
        if (response.data.records && Array.isArray(response.data.records)) {
          entries = response.data.records.map((item: any) => {
            // Use created_at (ISO string) or timestamp for time formatting
            const timeSource = item.created_at || item.timestamp;
            const time = formatTime(timeSource);
            // Use reasoning as the message content
            const message = item.reasoning || '';
            
            return {
              time,
              message,
            };
          }).filter((entry: LogEntry) => entry.time && entry.message);
        }

        if (entries.length > 0) {
          setLogEntries(entries);
        } else {
          // 如果没有获取到数据，显示默认文案
          setLogEntries([{ time: '', message: DEFAULT_MESSAGE }]);
        }
      } else {
        // 如果响应不成功，显示默认文案
        setLogEntries([{ time: '', message: DEFAULT_MESSAGE }]);
      }
    } catch (error) {
      console.error('Failed to fetch agent logs:', error);
      // 获取失败时，显示默认文案
      setLogEntries([{ time: '', message: DEFAULT_MESSAGE }]);
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  // 将 API 响应映射到 TimelineItem
  const mapApiRecordToTimelineItem = (record: any): TimelineItem | null => {
    const { time, type } = record;
    
    if (!time || !type) {
      return null;
    }

    // 获取 id，支持 id 和 _id 两种格式
    const recordId = record.id || record._id;

    // 处理 reminder 类型
    if (type.endsWith('_reminder')) {
      const reminderType = type.replace('_reminder', '');
      const titleMap: Record<string, string> = {
        sleep: 'Sleep Reminder',
        getup: 'Wake-up Reminder',
        breakfast: 'Breakfast Reminder',
        lunch: 'Lunch Reminder',
        dinner: 'Dinner Reminder',
      };
      return {
        id: recordId,
        time,
        type: 'reminder',
        title: titleMap[reminderType] || `${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} Reminder`,
        toggleEnabled: !record.cancel, // cancel: false 表示启用
      };
    } else if (['sleep', 'getup', 'breakfast', 'lunch', 'dinner'].includes(type)) {
      // 处理 prediction 类型
      const titleMap: Record<string, { title: string; subtitle: string }> = {
        sleep: { title: 'Sleep', subtitle: 'You sleep around this time.' },
        getup: { title: 'Wake-up', subtitle: 'You usually wake around this time. Ready to rise?' },
        breakfast: { title: 'Breakfast', subtitle: 'You tend to have breakfast around this time.' },
        lunch: { title: 'Lunch', subtitle: 'You tend to eat around this time.' },
        dinner: { title: 'Dinner', subtitle: 'You tend to have dinner around this time.' },
      };
      const mapped = titleMap[type] || { title: type.charAt(0).toUpperCase() + type.slice(1), subtitle: '' };
      return {
        time,
        type: 'prediction',
        title: mapped.title,
        subtitle: mapped.subtitle,
      };
    } else if (type.endsWith('_done')) {
      // 处理 action 类型（*_done）
      const actionType = type.replace('_done', '');
      const agentTagMap: Record<string, string> = {
        breakfast: 'Food',
        lunch: 'Food',
        dinner: 'Food',
        getup: 'Energy',
        sleep: 'Sleep',
      };
      const descriptionMap: Record<string, string> = {
        breakfast: 'You had breakfast. Good start! 🥞',
        lunch: 'You ate! Stable energy level detected.',
        dinner: 'You had dinner. Evening meal completed.',
        getup: 'You got out of bed! Morning boost started.',
        sleep: 'You fell asleep. Sweet dreams! 🌙',
      };
      return {
        time,
        type: 'action',
        agentTag: agentTagMap[actionType] || 'Activity',
        description: descriptionMap[actionType] || `You completed ${actionType}.`,
      };
    } else {
      return {
        time,
        type: 'unknown',
        title: type,
        subtitle: `${type}.`,
      };
    }
  };

  // 从 API 获取 timeline 数据
  const fetchTimelineInfo = useCallback(async (date?: Date) => {
    try {
      setLoadingTimeline(true);
      const baseHeaders = await getHeadersWithPassId();
      const passIdValue = (baseHeaders as any).passId || (baseHeaders as any).passid;
      
      // 计算 day 参数（如果提供了日期则使用该日期，否则使用当前选中的日期）
      const targetDate = date || selectedDate;
      const day = calculateDayOffset(targetDate);
      
      const reminderEndpoint = API_ENDPOINTS.TIMELINE.REMINDER;
      const url = `${reminderEndpoint}?day=${day}`;
      console.log('fetchTimelineInfo url', url);
      const response = await api.get(url, {
        headers: {
          'accept': 'application/json',
          'passid': passIdValue,
        },
      });

      console.log('fetchTimelineInfo response', response, "response data", JSON.stringify(response.data, null, 2));

      if (response.isSuccess() && response.data) {
        // API 返回格式: { code: 0, msg: "success", data: { records: [...], ... } }
        let items: TimelineItem[] = [];
        
        if (response.data.records && Array.isArray(response.data.records)) {
          // 按时间排序
          const sortedRecords = [...response.data.records].sort((a, b) => {
            const timeA = a.time || '';
            const timeB = b.time || '';
            return timeA.localeCompare(timeB);
          });

          // 映射每个记录
          items = sortedRecords
            .map((record) => {
              const item = mapApiRecordToTimelineItem(record);
              // 调试：如果 reminder 类型但没有 id，记录日志
              if (item && item.type === 'reminder' && !item.id) {
                console.warn('Reminder item missing id:', record);
              }
              return item;
            })
            .filter((item): item is TimelineItem => item !== null);
        }

        setTimelineData(items);
      } else {
        setTimelineData([]);
      }
    } catch (error) {
      console.error('Failed to fetch timeline info:', error);
      setTimelineData([]);
    } finally {
      setLoadingTimeline(false);
    }
  }, [selectedDate]);

  // 处理提醒开关切换
  const handleToggleReminder = async (item: TimelineItem, newValue: boolean) => {
    if (!item.id) {
      console.error('Timeline item missing id:', item);
      Alert.alert('Error', 'Cannot update reminder status: missing ID');
      return;
    }

    try {
      // 打开开关，cancel 为 false；关闭开关，cancel 为 true
      const cancel = !newValue;
      
      // 调用 API 更新状态
      const response = await api.post(
        API_ENDPOINTS.TIMELINE.SAVE,
        {
          id: item.id,
          cancel: cancel,
        },
        { requireAuth: true }
      );

      // 更新本地状态
      setTimelineData((prevData) =>
        prevData.map((dataItem) =>
          dataItem.id === item.id
            ? { ...dataItem, toggleEnabled: newValue }
            : dataItem
        )
      );
    } catch (error) {
      console.error('Failed to update reminder status:', error);
      Alert.alert('Error', 'Failed to update reminder status, please try again later');
    }
  };

  // Fetch logs on mount
  useEffect(() => {
    fetchAgentLogs();
    fetchTimelineInfo();
  }, [fetchAgentLogs, fetchTimelineInfo]);

  // 每次页面聚焦时，触发刷新 AgentLogs 和 Timeline
  useFocusEffect(
    useCallback(() => {
      console.log('Home page focused, triggering refresh of AgentLogs and Timeline');
      fetchAgentLogs();
      fetchTimelineInfo(selectedDate);
    }, [fetchAgentLogs, fetchTimelineInfo, selectedDate])
  );

  // Update scroll animation when log entries change
  useEffect(() => {
    const lineHeight = 23;
    const totalHeight = logEntries.length * lineHeight;
    
    // 如果只有一条消息且没有时间（默认消息），不进行滚动
    const isDefaultMessage = logEntries.length === 1 && !logEntries[0]?.time;

    
  }, [logEntries]);

  const formatLogText = (entry: LogEntry) => {
    const parts: Array<{ text: string; color: string }> = [];
    
    // 如果有时间，添加时间部分
    if (entry.time) {
      parts.push({ text: `[${entry.time}]`, color: '#E91E63' });
      parts.push({ text: ' ', color: '#E8E8E8' });
    }
    
    // 处理消息内容
    const words = entry.message.split(' ');
    words.forEach((word, index) => {
      let color = '#000000';

      if (word.match(/\d+%/)) {
        color = '#FF6B6B';
      } else if (
        ['User', 'Suggest', 'Smile', 'Eye', 'Posture', 'Micro-expression'].some(
          (keyword) => word.includes(keyword)
        )
      ) {
        color = '#87CEEB';
      }

      parts.push({ text: word, color });
      if (index < words.length - 1) {
        parts.push({ text: ' ', color: '#000000' });
      }
    });

    return parts;
  };

  const permissionsList = [
    {
      id: 'location',
      icon: <MapPin size={24} color="#666" />,
      title: 'Location Services',
      enabled: permissions.location,
    },
    {
      id: 'healthkit',
      icon: <Heart size={24} color="#666" />,
      title: 'HealthKit',
      enabled: permissions.healthkit,
    },
    {
      id: 'calendar',
      icon: <Calendar size={24} color="#666" />,
      title: 'Calendar',
      enabled: permissions.calendar,
    },
    {
      id: 'photos',
      icon: <ImageIcon size={24} color="#666" />,
      title: 'Photos',
      enabled: permissions.photos,
    },
    {
      id: 'camera',
      icon: <Camera size={24} color="#666" />,
      title: 'Camera',
      enabled: permissions.camera,
    },
    // {
    //   id: 'microphone',
    //   icon: <Mic size={24} color="#666" />,
    //   title: 'Microphone',
    //   enabled: permissions.microphone,
    // },
  ];

  // 计算日期相对于今天的天数差（day 参数）
  // 0 = 今天，-1 = 昨天，-2 = 前天，以此类推
  const calculateDayOffset = (date: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // 计算目标日期减去今天的天数差
    // 如果目标日期是今天，结果为 0
    // 如果目标日期是昨天，结果为 -1
    // 如果目标日期是前天，结果为 -2
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 从 API 获取 timeline 数据
  const fetchTimelineData = useCallback(async (date: Date) => {
    const dateKey = date.toDateString();
    
    // 检查是否正在请求该日期
    if (fetchingDatesRef.current.has(dateKey)) {
      return;
    }

    // 检查是否已经缓存了该日期的数据（使用 ref 同步检查）
    if (timelineDataCacheRef.current[dateKey]) {
      return;
    }

    // 标记该日期正在请求中
    fetchingDatesRef.current.add(dateKey);

    try {
      setLoadingTimeline(true);
      const day = calculateDayOffset(date);
      
      console.log('[HomeTab] Fetching timeline data:', { date: dateKey, day });
      
      // 获取 passId 并确保使用小写的 passid header（API 要求）
      const baseHeaders = await getHeadersWithPassId();
      const passIdValue = (baseHeaders as any).passId || (baseHeaders as any).passid;
      const response = await api.get(`/image-detection/list?day=${day}`, {
        headers: {
          'accept': 'application/json',
          // 确保使用小写的 passid（API 要求）
          'passid': passIdValue,
        },
      });

      if (response.isSuccess() && response.data) {
        // 将 API 返回的数据转换为 timeline 格式
        // 假设 API 返回的数据格式为数组，每个元素包含 time, category, description
        const timelineEntries = Array.isArray(response.data) 
          ? response.data.map((item: any) => ({
              time: item.time || item.timestamp || '',
              category: item.category || item.type || 'Unknown',
              description: item.description || item.content || item.detail || '',
            }))
          : [];

        // 更新对应日期的数据
        setAllTimelineData((prev) => {
          // 再次检查是否已缓存（防止重复设置）
          if (prev[dateKey]) {
            return prev;
          }
          const newData = {
            ...prev,
            [dateKey]: timelineEntries,
          };
          // 同步更新 ref 缓存
          timelineDataCacheRef.current = newData;
          return newData;
        });

        console.log('[HomeTab] Timeline data fetched successfully:', { date: dateKey, count: timelineEntries.length });
      } else {
        console.warn('[HomeTab] Timeline data is empty or format incorrect:', response);
        // 如果数据为空，设置为空数组
        setAllTimelineData((prev) => {
          const newData = {
            ...prev,
            [dateKey]: [],
          };
          // 同步更新 ref 缓存
          timelineDataCacheRef.current = newData;
          return newData;
        });
      }
    } catch (error) {
      console.error('[HomeTab] Failed to fetch timeline data:', error);
      // 出错时设置为空数组
      setAllTimelineData((prev) => {
        const newData = {
          ...prev,
          [dateKey]: [],
        };
        // 同步更新 ref 缓存
        timelineDataCacheRef.current = newData;
        return newData;
      });
    } finally {
      setLoadingTimeline(false);
      // 移除请求标记
      fetchingDatesRef.current.delete(dateKey);
    }
  }, []);

  // 当 selectedDate 变化时，获取对应日期的 timeline 数据
  useEffect(() => {
    fetchTimelineData(selectedDate);
    fetchTimelineInfo(selectedDate);
  }, [selectedDate, fetchTimelineData, fetchTimelineInfo]);

  const timelineEntries = allTimelineData[selectedDate.toDateString()] || [];

  const getPermissionName = (id: string) => {
    const permissionMap: Record<string, string> = {
      location: 'Location',
      healthkit: 'HealthKit',
      calendar: 'Calendar',
      photos: 'Photos',
      camera: 'Camera',
      // microphone: 'Microphone',
    };
    return permissionMap[id] || id;
  };

  const togglePermission = async (id: string) => {

    const currentValue = permissions[id as keyof typeof permissions];
    const permissionName = getPermissionName(id);

    // 如果尝试关闭权限，跳转到相应的设置页面
    if (currentValue) {
      // 健康权限跳转到健康应用，其他权限跳转到系统设置
      const isHealthKit = id === 'healthkit';
      const settingsText = isHealthKit ? 'Open Health App' : 'Go to Settings';
      const settingsMessage = isHealthKit 
        ? `Please disable ${permissionName} permission in Health app.`
        : `Please disable ${permissionName} permission in system settings.`;
      
      Alert.alert(
        `Disable ${permissionName} permission`,
        settingsMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: settingsText,
            onPress: async () => {
              try {
                if (isHealthKit) {
                  // Open Health app on iOS
                  const healthAppUrl = 'x-apple-health://';
                  const canOpen = await Linking.canOpenURL(healthAppUrl);
                  if (canOpen) {
                    await Linking.openURL(healthAppUrl);
                  } else {
                    // Fallback to system settings if Health app is not available
                    await Linking.openSettings();
                  }
                } else {
                  await Linking.openSettings();
                }
              } catch (error) {
                console.error('Failed to open settings:', error);
                // Fallback to system settings if Health app fails
                if (isHealthKit) {
                  try {
                    await Linking.openSettings();
                  } catch (settingsError) {
                    console.error('Failed to open settings:', settingsError);
                  }
                }
              }
            },
          },
        ],
      );
      return;
    }

    // 开启权限的逻辑
    if (id === 'location') {
      try {
        const isServiceAvailable = await locationManager.isLocationServiceAvailable();
        if (!isServiceAvailable) {
          Alert.alert(
            'Location service unavailable',
            'Please enable location service in device settings',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Go to Settings',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('Failed to open settings:', error);
                  }
                },
              },
            ],
          );
          return;
        }

        const permissionResult = await locationManager.requestLocationPermission('foreground');
        console.log('[HomeTab] Location permission request result:', permissionResult);
        if (permissionResult.success) {
          setPermissions((prev) => ({
            ...prev,
            location: true,
          }));
        } else {
          Alert.alert(
            'Location permission denied',
            permissionResult.error || 'Location permission is required to use location service. Please enable location permission in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Go to Settings',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('Failed to open settings:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('[HomeTab] Failed to request location permission:', error);
        Alert.alert(
          'Failed to request permission',
          'Unable to request location permission, please try again later. You can also manually enable location permission in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error('Failed to open settings:', error);
                }
              },
            },
          ],
        );
      }

      return;
    }

    if (id === 'calendar') {
      try {
        const permissionResult = await calendarManager.requestPermission();
        console.log('[HomeTab] Calendar permission request result:', permissionResult);
        if (permissionResult.success) {
          setPermissions((prev) => ({
            ...prev,
            calendar: true,
          }));
        } else {
          Alert.alert(
            'Calendar permission denied',
            permissionResult.error || 'Calendar permission is required to access calendar events. Please enable calendar permission in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Go to Settings',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('Failed to open settings:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('[HomeTab] Failed to request calendar permission:', error);
        Alert.alert(
          'Failed to request permission',
          'Unable to request calendar permission, please try again later. You can also manually enable calendar permission in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error('Failed to open settings:', error);
                }
              },
            },
          ],
        );
      }

      return;
    }

    if (id === 'healthkit') {
      try {
        // 检查 HealthKit 是否可用
        const isAvailable = await healthDataManager.isAvailable();
        if (!isAvailable) {
          Alert.alert(
            'HealthKit unavailable',
            'HealthKit is only available on iOS devices and requires device support.',
            [{ text: 'OK', style: 'default' }],
          );
          return;
        }

        // 请求所有常用健康数据权限
        console.log('[HomeTab] Starting to request all HealthKit permissions...');
        const permissionResult = await healthDataManager.requestAllCommonPermissions();
        console.log('[HomeTab] HealthKit permission request result:', permissionResult);

        if (permissionResult.success) {
          // 检查所有权限是否都已授权
          const allAuthorized = await checkAllHealthPermissions();
          setPermissions((prev) => ({
            ...prev,
            healthkit: allAuthorized,
          }));

          if (!allAuthorized) {
            Alert.alert(
              'Some permissions not authorized',
              'Some health data permissions are not authorized. Please enable all HealthKit permissions in Health app.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Open Health App',
                  onPress: async () => {
                    try {
                      // Open Health app on iOS
                      const healthAppUrl = 'x-apple-health://';
                      const canOpen = await Linking.canOpenURL(healthAppUrl);
                      if (canOpen) {
                        await Linking.openURL(healthAppUrl);
                      } else {
                        // Fallback to system settings if Health app is not available
                        await Linking.openSettings();
                      }
                    } catch (error) {
                      console.error('Failed to open Health app:', error);
                      // Fallback to system settings
                      try {
                        await Linking.openSettings();
                      } catch (settingsError) {
                        console.error('Failed to open settings:', settingsError);
                      }
                    }
                  },
                },
              ],
            );
          }
        } else {
          Alert.alert(
            'HealthKit permission denied',
            permissionResult.error || 'HealthKit permission is required to access health data. Please enable HealthKit permission in Health app.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Open Health App',
                onPress: async () => {
                  try {
                    // Open Health app on iOS
                    const healthAppUrl = 'x-apple-health://';
                    const canOpen = await Linking.canOpenURL(healthAppUrl);
                    if (canOpen) {
                      await Linking.openURL(healthAppUrl);
                    } else {
                      // Fallback to system settings if Health app is not available
                      await Linking.openSettings();
                    }
                  } catch (error) {
                    console.error('Failed to open Health app:', error);
                    // Fallback to system settings
                    try {
                      await Linking.openSettings();
                    } catch (settingsError) {
                      console.error('Failed to open settings:', settingsError);
                    }
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('[HomeTab] Failed to request HealthKit permission:', error);
        Alert.alert(
          'Failed to request permission',
          'Unable to request HealthKit permission, please try again later. You can also manually enable HealthKit permission in Health app.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Health App',
              onPress: async () => {
                try {
                  // Open Health app on iOS
                  const healthAppUrl = 'x-apple-health://';
                  const canOpen = await Linking.canOpenURL(healthAppUrl);
                  if (canOpen) {
                    await Linking.openURL(healthAppUrl);
                  } else {
                    // Fallback to system settings if Health app is not available
                    await Linking.openSettings();
                  }
                } catch (error) {
                  console.error('Failed to open Health app:', error);
                  // Fallback to system settings
                  try {
                    await Linking.openSettings();
                  } catch (settingsError) {
                    console.error('Failed to open settings:', settingsError);
                  }
                }
              },
            },
          ],
        );
      }

      return;
    }

    if (id === 'photos') {
      try {
        // 请求相册权限
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('[HomeTab] Photos permission request result:', permissionResult);
        
        if (permissionResult.granted) {
          setPermissions((prev) => ({
            ...prev,
            photos: true,
          }));
        } else {
          setPermissions((prev) => ({
            ...prev,
            photos: false,
          }));
          Alert.alert(
            'Photo library permission denied',
            'Photo library permission is required to access photos. Please enable photo library permission in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Go to Settings',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('Failed to open settings:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('[HomeTab] Failed to request photo library permission:', error);
        Alert.alert(
          'Failed to request permission',
          'Unable to request photo library permission, please try again later. You can also manually enable photo library permission in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error('Failed to open settings:', error);
                }
              },
            },
          ],
        );
      }
      return;
    }

    if (id === 'camera') {
      try {
        // 请求相机权限
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        console.log('[HomeTab] Camera permission request result:', permissionResult);
        
        if (permissionResult.granted) {
          setPermissions((prev) => ({
            ...prev,
            camera: true,
          }));
        } else {
          setPermissions((prev) => ({
            ...prev,
            camera: false,
          }));
          Alert.alert(
            'Camera permission denied',
            'Camera permission is required to use camera function. Please enable camera permission in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Go to Settings',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('Failed to open settings:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('[HomeTab] Failed to request camera permission:', error);
        Alert.alert(
          'Failed to request permission',
          'Unable to request camera permission, please try again later. You can also manually enable camera permission in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error('Failed to open settings:', error);
                }
              },
            },
          ],
        );
      }
      return;
    }

    // if (id === 'microphone') {
    //   try {
    //     // 请求麦克风权限
    //     const permissionResult = await Audio.requestPermissionsAsync();
    //     console.log('[HomeTab] Microphone permission request result:', permissionResult);
        
    //     if (permissionResult.granted) {
    //       setPermissions((prev) => ({
    //         ...prev,
    //         microphone: true,
    //       }));
    //     } else {
    //       setPermissions((prev) => ({
    //         ...prev,
    //         microphone: false,
    //       }));
    //       Alert.alert(
    //         'Microphone permission denied',
    //         'Microphone permission is required to use recording function. Please enable microphone permission in settings.',
    //         [
    //           { text: 'Cancel', style: 'cancel' },
    //           {
    //             text: 'Go to Settings',
    //             onPress: async () => {
    //               try {
    //                 await Linking.openSettings();
    //               } catch (error) {
    //                 console.error('Failed to open settings:', error);
    //               }
    //             },
    //           },
    //         ],
    //       );
    //     }
    //   } catch (error) {
    //     console.error('[HomeTab] Failed to request microphone permission:', error);
    //     Alert.alert(
    //       'Failed to request permission',
    //       'Unable to request microphone permission, please try again later. You can also manually enable microphone permission in settings.',
    //       [
    //         { text: 'Cancel', style: 'cancel' },
    //         {
    //           text: 'Go to Settings',
    //           onPress: async () => {
    //             try {
    //               await Linking.openSettings();
    //             } catch (error) {
    //               console.error('Failed to open settings:', error);
    //             }
    //           },
    //         },
    //       ],
    //     );
    //   }
    //   return;
    // }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const generateCalendarDays = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const selectCalendarDate = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const changeCalendarMonth = (months: number) => {
    const newDate = new Date(calendarViewDate);
    newDate.setMonth(newDate.getMonth() + months);
    setCalendarViewDate(newDate);
  };

  const openCalendar = () => {
    setCalendarViewDate(selectedDate);
    setShowCalendar(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Building</Text>
          <Text style={styles.headerTitle}>Your Life Model</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How I Think</Text>
          <View style={styles.thinkingBanner}>
            
              {/* {thinkingLogs.map((log, index) => (
                <View key={index} style={styles.thinkingLogLine}>
                  {formatLogText(log).map((part, partIndex) => (
                    <Text
                      key={partIndex}
                      style={[styles.thinkingLogText, { color: part.color }]}
                    >
                      {part.text}
                    </Text>
                  ))}
                </View>
              ))} */}
            
            <ScrollView
              style={styles.thinkingScrollContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              <View style={styles.thinkingScrollContainer}>
              
                {(() => {
                  // 如果只有默认消息，不重复显示
                  const isDefaultMessage = logEntries.length === 1 && !logEntries[0]?.time;
                  const entriesToRender = isDefaultMessage ? logEntries : [...logEntries, ...logEntries];
                  return entriesToRender.map((entry, index) => (
                    <View key={index} style={styles.thinkingLogLine}>
                      {formatLogText(entry).map((part, partIndex) => (
                        <Text
                          key={partIndex}
                          style={[styles.thinkingLogText, { color: '#FFFFFF' }]}
                        >
                          {part.text}
                        </Text>
                      ))}
                    </View>
                  ));
                })()}
            </View>
            </ScrollView>
            
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.permissionsHeader}>
            <Text style={styles.permissionsHeaderTitle}>Get the Full Experience</Text>
            <Text style={styles.permissionsHeaderSubtitle}>Let the Monster team collect your data automatically. Everything stays private and secure.</Text>
          </View>
          <View style={styles.permissionsCard}>
            {permissionsList.map((permission, index) => (
              <View
                key={permission.id}
                style={[
                  styles.permissionRow,
                  index < permissionsList.length - 1 && styles.permissionRowBorder,
                ]}
              >
                <View style={styles.permissionIcon}>{permission.icon}</View>
                <View style={styles.permissionText}>
                  <Text style={styles.permissionTitle}>{permission.title}</Text>
                  <Text style={styles.permissionSubtitle}>
                    {permission.enabled ? 'Enabled' : 'Not Enabled'}
                  </Text>
                </View>
                <Switch
                  value={permission.enabled}
                  onValueChange={() => togglePermission(permission.id)}
                  trackColor={{ false: '#E0E0E0', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <Text style={styles.timelineSubtitle}>From your phone, we track daily patterns to understand your health — all data stays private.</Text>

          <View style={styles.dateControl}>
            <TouchableOpacity onPress={openCalendar}>
              <Calendar size={24} color="#666" />
            </TouchableOpacity>
            <View style={styles.dateControlCenter}>
              <TouchableOpacity style={styles.dateArrow} onPress={() => changeDate(-1)}>
                <ChevronLeft size={20} color="#666" />
              </TouchableOpacity>
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              <TouchableOpacity style={styles.dateArrow} onPress={() => changeDate(1)}>
                <ChevronRight size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timelineContainer}>
            {loadingTimeline ? (
              <Text style={styles.timelineLoadingText}>Loading timeline...</Text>
            ) : timelineData.length === 0 ? (
              <Text style={styles.timelineEmptyText}>No timeline data available</Text>
            ) : (
              timelineData.map((item, index) => (
                <View key={index} style={styles.timelineEntry}>
                  <View style={styles.timelineDivider}>
                    <View style={styles.timelineDot}>
                      <Clock size={14} color="#666" />
                    </View>
                    {index < timelineData.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>
                <View style={styles.timelineContent}>
                  {item.type === 'reminder' && (
                    <>
                      <View style={styles.timelineReminderHeader}>
                        <Text style={styles.timelineTime}>{item.time}</Text>
                        <View style={styles.timelineReminderLeft}>
                          <Bell size={16} color="#666" style={styles.timelineReminderIcon} />
                          <Text style={styles.timelineReminderTitle}>{item.title}</Text>
                        </View>
                      </View>
                      <View style={styles.timelineReminderToggle}>
                        <Switch
                          value={item.toggleEnabled}
                          onValueChange={(newValue) => handleToggleReminder(item, newValue)}
                          trackColor={{ false: '#E0E0E0', true: '#34C759' }}
                          thumbColor="#FFFFFF"
                        />
                      </View>
                    </>
                  )}
                  {item.type === 'prediction' && (
                    <>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineTime}>{item.time}</Text>
                        <Text style={styles.timelinePredictionTitle}>{item.title}</Text>
                      </View>
                      <Text style={styles.timelinePredictionSubtitle}>{item.subtitle}</Text>
                    </>
                  )}
                  {item.type === 'action' && (
                    <View style={styles.timelineActionContent}>
                      <View style={styles.timelineHeader}>
                        <Text style={styles.timelineTime}>{item.time}</Text>
                        <View style={styles.timelineActionTag}>
                          <Text style={styles.timelineActionTagText}>{item.agentTag}</Text>
                        </View>
                      </View>
                      <Text style={styles.timelineActionDescription}>{item.description}</Text>
                    </View>
                  )}
                </View>
              </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeCalendarMonth(-1)}>
                <ChevronLeft size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.calendarHeaderText}>
                {calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => changeCalendarMonth(1)}>
                <ChevronRight size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCalendar(false)} style={styles.calendarCloseButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekdays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.calendarWeekdayText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarDays}>
              {generateCalendarDays().map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    !day && styles.calendarDayEmpty,
                    day &&
                      day.toDateString() === selectedDate.toDateString() &&
                      styles.calendarDaySelected,
                  ]}
                  onPress={() => day && selectCalendarDate(day)}
                  disabled={!day}
                >
                  {day && (
                    <Text
                      style={[
                        styles.calendarDayText,
                        day.toDateString() === selectedDate.toDateString() &&
                          styles.calendarDayTextSelected,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 66 : (StatusBar.currentHeight || 0) + 16,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    lineHeight: 34,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    marginBottom: 12,
    marginTop: -2,
  },
  timelineSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  thinkingBanner: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    paddingRight: 36,
    height: 200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  thinkingScrollContainer: {
    flex: 1,
  },
  thinkingLogLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  thinkingLogText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    lineHeight: 20,
  },
  permissionsHeader: {
    marginBottom: 16,
  },
  permissionsHeaderTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    marginBottom: 4,
    lineHeight: 22,
  },
  permissionsHeaderSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#666666',
    lineHeight: 20,
  },
  permissionsCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  permissionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  permissionIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    flex: 1,
    marginLeft: 8,
  },
  permissionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#000',
    marginBottom: 2,
  },
  permissionSubtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#999',
  },
  dateControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  dateControlCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  dateArrow: {
    padding: 8,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    color: '#000',
    marginHorizontal: 16,
  },
  timelineContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  timelineEntry: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineDivider: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
    minHeight: 40,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  timelineReminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    gap: 12,
  },
  timelineTime: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
  },
  timelineCategory: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: '#000',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#666',
    lineHeight: 20,
  },
  // Reminder styles
  timelineReminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  timelineReminderIcon: {
    marginRight: 8,
  },
  timelineReminderTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: '#000',
  },
  timelineReminderToggle: {
    alignSelf: 'flex-start',
  },
  // Prediction styles
  timelinePredictionTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
  },
  timelinePredictionSubtitle: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#999',
    lineHeight: 20,
  },
  // Action styles
  timelineActionContent: {
    backgroundColor: '#F5F7F9',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineActionTag: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  timelineActionTagText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#666',
  },
  timelineActionDescription: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#333',
    lineHeight: 20,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    paddingHorizontal: 40,
  },
  calendarHeaderText: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  calendarCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  calendarWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  calendarWeekdayText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#999',
    width: 40,
    textAlign: 'center',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  calendarDayEmpty: {
    backgroundColor: 'transparent',
  },
  calendarDaySelected: {
    backgroundColor: '#000',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#000',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontFamily: 'Nunito_700Bold',
  },
  noLogsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noLogsText: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#999',
    fontStyle: 'italic',
  },
  timelineLoadingText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  timelineEmptyText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
