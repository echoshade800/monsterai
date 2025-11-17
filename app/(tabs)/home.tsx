import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
  Mic,
  X,
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
import { getHeadersWithPassId } from '../../src/services/api/api';
import calendarManager from '../../src/utils/calendar-manager';
import healthDataManager, { HealthDataType } from '../../src/utils/health-data-manager';
import locationManager from '../../src/utils/location-manager';

export default function HomeTab() {
  const router = useRouter();
  const [permissions, setPermissions] = useState({
    location: true,
    healthkit: false,
    calendar: true,
    photos: true,
    camera: false,
    microphone: true,
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [allTimelineData, setAllTimelineData] = useState<Record<string, Array<{ time: string; category: string; description: string }>>>({});

  // Timeline item types
  type TimelineItem = {
    time: string;
    type: 'reminder' | 'prediction' | 'action';
    title?: string;
    subtitle?: string;
    agentTag?: string;
    description?: string;
    toggleEnabled?: boolean;
  };

  // Sample timeline data
  const sampleTimelineData: TimelineItem[] = [
    { time: '8:00', type: 'prediction', title: 'Wake-up', subtitle: 'You usually wake around 8:00. Ready to rise?' },
    { time: '8:05', type: 'action', agentTag: 'Energy', description: 'You got out of bed! Morning boost started.' },
    { time: '9:00', type: 'reminder', title: 'Breakfast Reminder', toggleEnabled: true },
    { time: '9:20', type: 'action', agentTag: 'Food', description: 'You had breakfast. Good start! 🥞' },
    { time: '12:00', type: 'prediction', title: 'Lunch', subtitle: 'You tend to eat around noon.' },
    { time: '12:10', type: 'action', agentTag: 'Energy', description: 'You ate! Stable energy level detected.' },
    { time: '15:30', type: 'action', agentTag: 'Face', description: 'Eye fatigue noticed in your photo.' },
    { time: '21:30', type: 'reminder', title: 'Sleep Reminder', toggleEnabled: true },
    { time: '22:00', type: 'prediction', title: 'Sleep', subtitle: 'You sleep around 22:00–7:00.' },
    { time: '22:15', type: 'action', agentTag: 'Sleep', description: 'You fell asleep. Sweet dreams! 🌙' },
  ];
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const fetchingDatesRef = useRef<Set<string>>(new Set());
  const timelineDataCacheRef = useRef<Record<string, Array<{ time: string; category: string; description: string }>>>({});


  // 检查所有健康子项权限状态
  const checkAllHealthPermissions = async (silent = false): Promise<boolean> => {
    try {
      const isAvailable = await healthDataManager.isAvailable();
      if (!isAvailable) {
        console.log('[HomeTab] HealthKit 不可用');
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
          console.log('[HomeTab] HealthKit 初始化失败:', initResult.error);
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

      console.log('[HomeTab] HealthKit 权限检查:', {
        required: requiredPermissions.length,
        authorized: authorizedPermissions.length,
        allAuthorized,
        authorizedList: authorizedPermissions,
      });

      return allAuthorized;
    } catch (error) {
      console.error('[HomeTab] 检查 HealthKit 权限失败:', error);
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
        console.error('[HomeTab] 检查位置权限失败:', error);
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
        console.error('[HomeTab] 检查日历权限失败:', error);
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
        console.error('[HomeTab] 检查 HealthKit 权限失败:', error);
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
        console.error('[HomeTab] 检查相册权限失败:', error);
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
        console.error('[HomeTab] 检查相机权限失败:', error);
      }
    };

    const syncMicrophonePermission = async () => {
      try {
        const permissionResult = await Audio.getPermissionsAsync();
        setPermissions((prev) => ({
          ...prev,
          microphone: permissionResult.granted,
        }));
      } catch (error) {
        console.error('[HomeTab] 检查麦克风权限失败:', error);
      }
    };

    syncLocationPermission();
    syncCalendarPermission();
    syncHealthKitPermission();
    syncPhotosPermission();
    syncCameraPermission();
    syncMicrophonePermission();
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

  const thinkingLogs = [
    "[11:42am] User's facial energy dropped 12% compared to baseline.",
    '[11:44am] Suggest: Stretch & breathe.',
    '[10:04am] Smile activity dropped noticeably.',
    '[11:18am] Eye fatigue increased — may indicate stress.',
    '[12:22pm] Posture stability decreased during sitting.',
    '[12:40pm] Micro-expression tension rising.',
  ];

  const formatLogText = (text: string) => {
    const parts = [];
    const timeMatch = text.match(/\[(.*?)\]/);

    if (timeMatch) {
      parts.push({ text: `[${timeMatch[1]}]`, color: '#7FFF7F' });
      text = text.substring(timeMatch[0].length).trim();
    }

    const words = text.split(' ');
    words.forEach((word, index) => {
      let color = '#E8E8E8';

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
        parts.push({ text: ' ', color: '#E8E8E8' });
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
    {
      id: 'microphone',
      icon: <Mic size={24} color="#666" />,
      title: 'Microphone',
      enabled: permissions.microphone,
    },
  ];

  // 计算日期相对于今天的天数差（day 参数）
  // 0 = 今天，1 = 昨天，2 = 前天，以此类推
  const calculateDayOffset = (date: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    // 计算今天减去目标日期的天数差
    // 如果目标日期是今天，结果为 0
    // 如果目标日期是昨天，结果为 1
    // 如果目标日期是前天，结果为 2
    const diffTime = today.getTime() - targetDate.getTime();
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
      
      console.log('[HomeTab] 获取 timeline 数据:', { date: dateKey, day });
      
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

        console.log('[HomeTab] Timeline 数据获取成功:', { date: dateKey, count: timelineEntries.length });
      } else {
        console.warn('[HomeTab] Timeline 数据为空或格式不正确:', response);
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
      console.error('[HomeTab] 获取 timeline 数据失败:', error);
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
  }, [selectedDate, fetchTimelineData]);

  const timelineEntries = allTimelineData[selectedDate.toDateString()] || [];

  const getPermissionName = (id: string) => {
    const permissionMap: Record<string, string> = {
      location: '位置',
      healthkit: 'HealthKit',
      calendar: '日历',
      photos: '照片',
      camera: '相机',
      microphone: '麦克风',
    };
    return permissionMap[id] || id;
  };

  const togglePermission = async (id: string) => {
    const currentValue = permissions[id as keyof typeof permissions];
    const permissionName = getPermissionName(id);

    // 如果尝试关闭权限，跳转到系统设置
    if (currentValue) {
      Alert.alert(
        `关闭${permissionName}权限`,
        `请在系统设置中关闭${permissionName}权限。`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '去设置',
            onPress: async () => {
              try {
                await Linking.openSettings();
              } catch (error) {
                console.error('打开设置失败:', error);
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
            '位置服务不可用',
            '请在设备设置中启用位置服务',
            [
              { text: '取消', style: 'cancel' },
              {
                text: '去设置',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('打开设置失败:', error);
                  }
                },
              },
            ],
          );
          return;
        }

        const permissionResult = await locationManager.requestLocationPermission('foreground');
        console.log('[HomeTab] 请求位置权限结果:', permissionResult);
        if (permissionResult.success) {
          setPermissions((prev) => ({
            ...prev,
            location: true,
          }));
        } else {
          Alert.alert(
            '位置权限被拒绝',
            permissionResult.error || '需要位置权限才能使用位置服务。请在设置中开启位置权限。',
            [
              { text: '取消', style: 'cancel' },
              {
                text: '去设置',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('打开设置失败:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('[HomeTab] 请求位置权限失败:', error);
        Alert.alert(
          '请求权限失败',
          '无法请求位置权限，请稍后重试。您也可以在设置中手动开启位置权限。',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '去设置',
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error('打开设置失败:', error);
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
        console.log('[HomeTab] 请求日历权限结果:', permissionResult);
        if (permissionResult.success) {
          setPermissions((prev) => ({
            ...prev,
            calendar: true,
          }));
        } else {
          Alert.alert(
            '日历权限被拒绝',
            permissionResult.error || '需要日历权限才能访问日历事件。请在设置中开启日历权限。',
            [
              { text: '取消', style: 'cancel' },
              {
                text: '去设置',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('打开设置失败:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('[HomeTab] 请求日历权限失败:', error);
        Alert.alert(
          '请求权限失败',
          '无法请求日历权限，请稍后重试。您也可以在设置中手动开启日历权限。',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '去设置',
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error('打开设置失败:', error);
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
            'HealthKit 不可用',
            'HealthKit 仅在 iOS 设备上可用，且需要设备支持。',
            [{ text: '确定', style: 'default' }],
          );
          return;
        }

        // 请求所有常用健康数据权限
        console.log('[HomeTab] 开始请求所有 HealthKit 权限...');
        const permissionResult = await healthDataManager.requestAllCommonPermissions();
        console.log('[HomeTab] 请求 HealthKit 权限结果:', permissionResult);

        if (permissionResult.success) {
          // 检查所有权限是否都已授权
          const allAuthorized = await checkAllHealthPermissions();
          setPermissions((prev) => ({
            ...prev,
            healthkit: allAuthorized,
          }));

          if (!allAuthorized) {
            Alert.alert(
              '部分权限未授权',
              '部分健康数据权限未授权。请在系统设置中开启所有 HealthKit 权限。',
              [
                { text: '取消', style: 'cancel' },
                {
                  text: '去设置',
                  onPress: async () => {
                    try {
                      await Linking.openSettings();
                    } catch (error) {
                      console.error('打开设置失败:', error);
                    }
                  },
                },
              ],
            );
          }
        } else {
          Alert.alert(
            'HealthKit 权限被拒绝',
            permissionResult.error || '需要 HealthKit 权限才能访问健康数据。请在设置中开启 HealthKit 权限。',
            [
              { text: '取消', style: 'cancel' },
              {
                text: '去设置',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('打开设置失败:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('[HomeTab] 请求 HealthKit 权限失败:', error);
        Alert.alert(
          '请求权限失败',
          '无法请求 HealthKit 权限，请稍后重试。您也可以在设置中手动开启 HealthKit 权限。',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '去设置',
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error('打开设置失败:', error);
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
        console.log('[HomeTab] 请求相册权限结果:', permissionResult);
        
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
            '相册权限被拒绝',
            '需要相册权限才能访问照片。请在设置中开启相册权限。',
            [
              { text: '取消', style: 'cancel' },
              {
                text: '去设置',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('打开设置失败:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('[HomeTab] 请求相册权限失败:', error);
        Alert.alert(
          '请求权限失败',
          '无法请求相册权限，请稍后重试。您也可以在设置中手动开启相册权限。',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '去设置',
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error('打开设置失败:', error);
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
        console.log('[HomeTab] 请求相机权限结果:', permissionResult);
        
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
            '相机权限被拒绝',
            '需要相机权限才能使用相机功能。请在设置中开启相机权限。',
            [
              { text: '取消', style: 'cancel' },
              {
                text: '去设置',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('打开设置失败:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('[HomeTab] 请求相机权限失败:', error);
        Alert.alert(
          '请求权限失败',
          '无法请求相机权限，请稍后重试。您也可以在设置中手动开启相机权限。',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '去设置',
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error('打开设置失败:', error);
                }
              },
            },
          ],
        );
      }
      return;
    }

    if (id === 'microphone') {
      try {
        // 请求麦克风权限
        const permissionResult = await Audio.requestPermissionsAsync();
        console.log('[HomeTab] 请求麦克风权限结果:', permissionResult);
        
        if (permissionResult.granted) {
          setPermissions((prev) => ({
            ...prev,
            microphone: true,
          }));
        } else {
          setPermissions((prev) => ({
            ...prev,
            microphone: false,
          }));
          Alert.alert(
            '麦克风权限被拒绝',
            '需要麦克风权限才能使用录音功能。请在设置中开启麦克风权限。',
            [
              { text: '取消', style: 'cancel' },
              {
                text: '去设置',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('打开设置失败:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('[HomeTab] 请求麦克风权限失败:', error);
        Alert.alert(
          '请求权限失败',
          '无法请求麦克风权限，请稍后重试。您也可以在设置中手动开启麦克风权限。',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '去设置',
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error('打开设置失败:', error);
                }
              },
            },
          ],
        );
      }
      return;
    }
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
            <ScrollView
              style={styles.thinkingScrollContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              {thinkingLogs.map((log, index) => (
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
              ))}
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
            {sampleTimelineData.map((item, index) => (
              <View key={index} style={styles.timelineEntry}>
                <View style={styles.timelineLeft}>
                  <Clock size={16} color="#666" />
                  <Text style={styles.timelineTime}>{item.time}</Text>
                </View>
                <View style={styles.timelineDivider}>
                  <View style={styles.timelineDot} />
                  {index < sampleTimelineData.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                <View style={styles.timelineRight}>
                  {item.type === 'reminder' && (
                    <View style={styles.timelineReminderContent}>
                      <View style={styles.timelineReminderLeft}>
                        <Bell size={16} color="#666" style={styles.timelineReminderIcon} />
                        <Text style={styles.timelineReminderTitle}>{item.title}</Text>
                      </View>
                      <Switch
                        value={item.toggleEnabled}
                        trackColor={{ false: '#E0E0E0', true: '#34C759' }}
                        thumbColor="#FFFFFF"
                      />
                    </View>
                  )}
                  {item.type === 'prediction' && (
                    <View style={styles.timelinePredictionContent}>
                      <Text style={styles.timelinePredictionTitle}>{item.title}</Text>
                      <Text style={styles.timelinePredictionSubtitle}>{item.subtitle}</Text>
                    </View>
                  )}
                  {item.type === 'action' && (
                    <View style={styles.timelineActionContent}>
                      <View style={styles.timelineActionTag}>
                        <Text style={styles.timelineActionTagText}>{item.agentTag}</Text>
                      </View>
                      <Text style={styles.timelineActionDescription}>{item.description}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
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
    borderRadius: 10,
    padding: 20,
    height: 200,
    overflow: 'hidden',
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
    borderRadius: 16,
    padding: 4,
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateControlCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineEntry: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: 100,
    paddingTop: 2,
  },
  timelineTime: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#000',
    marginLeft: 6,
  },
  timelineDivider: {
    width: 20,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginTop: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
    minHeight: 40,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 16,
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
  timelineReminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  // Prediction styles
  timelinePredictionContent: {
    flexDirection: 'column',
  },
  timelinePredictionTitle: {
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    color: '#000',
    marginBottom: 4,
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
  },
  timelineActionTag: {
    backgroundColor: '#E8EBED',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
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
});
