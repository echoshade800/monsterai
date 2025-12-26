import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Candy, User } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageBackground, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
} from 'react-native-reanimated';
import { api } from '../src/services/api-clients/client';
import { API_ENDPOINTS, getHeadersWithPassId } from '../src/services/api/api';
import { ReviewCardData, ReviewCarousel } from './ReviewCarousel';

interface HeaderProps {
  refreshTrigger?: number; // 当这个值变化时，触发刷新 AgentLogs
}

const FIXED_HEIGHT = 286; // Adjusted height (reduced by 18px)

const MOCK_REVIEW_DATA: ReviewCardData[] = [
  {
    id: '1',
    title: 'Your Deep 2025 Review',
    subtitle: '✓ 7,788 boss unlocked',
    coverImage: require('../assets/images/chatteam.png'),
    ctaRoute: '/daily-brief',
    status: 'ready',
  },
  {
    id: '2',
    title: 'Weekly Energy Report',
    subtitle: 'Generating... 85%',
    coverImage: require('../assets/images/chatposture.png'),
    ctaRoute: '/energy-weekly-report',
    status: 'generating',
  },
];

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

export function Header({ refreshTrigger }: HeaderProps) {
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const router = useRouter();

  const handleProfilePress = () => {
    router.push('/profile');
  };

  // Fetch agent log data from API
  const fetchAgentLogs = useCallback(async () => {
    try {
      // 添加调用栈日志，帮助排查频繁调用的问题
      console.log('[Header][fetchAgentLogs] Called', new Error().stack?.split('\n').slice(1, 4).join('\n'));
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
      console.log('[Header][fetchAgentLogs] response', response);

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
            const message = item.summary_reasoning || '';
            
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

  // Fetch logs on mount (只在组件首次挂载时执行一次)
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      console.log('[Header] Component mounted, fetching initial data');
      fetchAgentLogs();
    }
  }, [fetchAgentLogs]);

  // 当 refreshTrigger 变化时，重新获取 AgentLogs
  // 使用 useRef 来跟踪上次的 refreshTrigger 值，避免重复请求
  const lastRefreshTriggerRef = useRef<number | undefined>(undefined);
  useEffect(() => {
    // 只有当 refreshTrigger 真正变化且不是初始值时才触发刷新
    if (refreshTrigger !== undefined && refreshTrigger !== lastRefreshTriggerRef.current) {
      lastRefreshTriggerRef.current = refreshTrigger;
      console.log('[Header] refreshTrigger changed, fetching AgentLogs', refreshTrigger);
      fetchAgentLogs();
    }
  }, [refreshTrigger, fetchAgentLogs]);

  const sharedProfileStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      right: 12,
      top: Platform.OS === 'ios' ? 116 : (StatusBar.currentHeight || 0) + 66,
      zIndex: 1001,
    };
  });

  const sharedCandyStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      right: 64,
      top: Platform.OS === 'ios' ? 116 : (StatusBar.currentHeight || 0) + 66,
      zIndex: 1001,
    };
  });

  const sharedTitleStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 12,
      top: Platform.OS === 'ios' ? 116 : (StatusBar.currentHeight || 0) + 66,
      zIndex: 1001,
    };
  });

  return (
    <View style={styles.headerContainer}>
      {/* Shared Title - Always mounted */}
      <Animated.View style={sharedTitleStyle}>
        <Text style={styles.hiBossText}>Hi Boss！</Text>
        <Text style={styles.trackLifeText}>Let's track life together!</Text>
      </Animated.View>

      {/* Shared Candy Button - Always mounted */}
      <Animated.View style={sharedCandyStyle}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/store')}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.iconButtonBorder} />
          <Candy size={20} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>

      {/* Shared Profile Button - Always mounted */}
      <Animated.View style={sharedProfileStyle}>
        <TouchableOpacity style={styles.iconButton} onPress={handleProfilePress}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.iconButtonBorder} />
          <User size={20} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>

      <View style={styles.bannerContainer}>
        <View style={styles.topExtension} />
        <ImageBackground
          source={require('../assets/images/chatbackground.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
          imageStyle={{ resizeMode: 'cover', position: 'absolute', bottom: 0, top: 'auto' }}
        >
          <View style={styles.statusBar}>
            <View />
            <View style={styles.profilePlaceholder} />
          </View>
          
          {/* Review Carousel */}
          <ReviewCarousel data={MOCK_REVIEW_DATA} />
        </ImageBackground>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
    overflow: 'visible',
    marginTop: Platform.OS === 'ios' ? -60 : -(StatusBar.currentHeight || 0) - 10,
    zIndex: 1000,
    height: FIXED_HEIGHT,
  },

  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  topExtension: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 10,
    backgroundColor: '#F6F1EF',
    zIndex: -1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 10,
    justifyContent: 'flex-end',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 10,
    paddingBottom: 15,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  iconButtonBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    pointerEvents: 'none',
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
  },
  hiBossText: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: '#FFFFFF',
  },
  trackLifeText: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#FFFFFF',
    marginTop: 2,
  },
});
