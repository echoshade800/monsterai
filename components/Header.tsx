import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Check, User } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Image, ImageBackground, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { api } from '../src/services/api-clients/client';
import { API_ENDPOINTS, getHeadersWithPassId } from '../src/services/api/api';
import { CameraBox } from './CameraBox';

interface HeaderProps {
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const EXPANDED_HEIGHT = 600;
const COLLAPSED_HEIGHT = 332;
const COLLAPSE_THRESHOLD = 100;

// Default fallback entries
const DEFAULT_LOG_ENTRIES = [
  { time: '07:42', message: "User's facial energy dropped 12% vs baseline." },
  { time: '07:45', message: 'Tag: Low energy morning, possible poor sleep.' },
  { time: '08:02', message: 'Suggest: Protein breakfast + 5-min stretch.' },
  { time: '08:15', message: 'Mood signal improving by 6%.' },
  { time: '08:40', message: 'Saved to Life Log → Breakfast check-in.' },
];

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

export function Header({ isCollapsed = false, onCollapse }: HeaderProps) {
  const [isDone, setIsDone] = useState(false);
  const [logEntries, setLogEntries] = useState<LogEntry[]>(DEFAULT_LOG_ENTRIES);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const animatedCollapse = useSharedValue(isCollapsed ? 1 : 0);
  const scrollY = useSharedValue(0);
  const router = useRouter();

  const handleThinkingPress = () => {
    router.push('/(tabs)/home');
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };

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
        }
      }
    } catch (error) {
      console.error('Failed to fetch agent logs:', error);
      // Keep default entries on error
    } finally {
      setIsLoadingLogs(false);
    }
  }, []);

  // Fetch logs on mount
  useEffect(() => {
    fetchAgentLogs();
  }, [fetchAgentLogs]);

  // Update scroll animation when log entries change
  useEffect(() => {
    const lineHeight = 23;
    const totalHeight = logEntries.length * lineHeight;

    if (totalHeight > 0) {
      scrollY.value = withRepeat(
        withTiming(totalHeight, {
          duration: 15000,
        }),
        -1,
        false
      );
    }
  }, [logEntries]);

  useEffect(() => {
    animatedCollapse.value = withTiming(isCollapsed ? 1 : 0, {
      duration: 400,
    });
  }, [isCollapsed]);

  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      'worklet';
      if (event.velocityY < -500 || event.translationY < -50) {
        if (onCollapse) {
          runOnJS(onCollapse)(true);
        }
      } else if (event.velocityY > 500 || event.translationY > 50) {
        if (onCollapse) {
          runOnJS(onCollapse)(false);
        }
      }
    });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      animatedCollapse.value,
      [0, 1],
      [EXPANDED_HEIGHT, COLLAPSED_HEIGHT],
      Extrapolate.CLAMP
    );

    return {
      height,
    };
  });

  const backgroundContainerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedCollapse.value,
      [0, 0.5, 1],
      [1, 0.3, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      pointerEvents: animatedCollapse.value > 0.8 ? 'none' : 'auto',
    };
  });

  const collapsedHeaderStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedCollapse.value,
      [0, 0.5, 1],
      [0, 0.5, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      pointerEvents: animatedCollapse.value > 0.5 ? 'auto' : 'none',
    };
  });

  const monsterImageStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedCollapse.value,
      [0, 0.4, 1],
      [1, 0, 0],
      Extrapolate.CLAMP
    );

    const height = interpolate(
      animatedCollapse.value,
      [0, 1],
      [180, 0],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      animatedCollapse.value,
      [0, 1],
      [0, -50],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      height,
      transform: [{ translateY }],
      marginBottom: interpolate(animatedCollapse.value, [0, 1], [12, 0], Extrapolate.CLAMP),
    };
  });

  const breakfastBannerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animatedCollapse.value,
      [0, 0.4, 1],
      [1, 0, 0],
      Extrapolate.CLAMP
    );

    const height = interpolate(
      animatedCollapse.value,
      [0, 1],
      [80, 0],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      height,
      marginBottom: interpolate(animatedCollapse.value, [0, 1], [12, 0], Extrapolate.CLAMP),
    };
  });

  const zappedBannerStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animatedCollapse.value,
      [0, 1],
      [1, 0.95],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  const sharedCameraStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      right: 42,
      bottom: 18,
      width: 120,
      height: 94,
      zIndex: 1000,
    };
  });

  const sharedProfileStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      right: 20,
      top: Platform.OS === 'ios' ? 126 : (StatusBar.currentHeight || 0) + 76,
      zIndex: 1001,
    };
  });

  const sharedTitleStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      left: 20,
      top: Platform.OS === 'ios' ? 126 : (StatusBar.currentHeight || 0) + 76,
      zIndex: 1001,
    };
  });

  const logScrollStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -scrollY.value }],
    };
  });

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
        {/* Shared Camera Box - Always mounted */}
        <Animated.View style={sharedCameraStyle}>
          <CameraBox />
        </Animated.View>

        {/* Shared Title - Always mounted */}
        <Animated.View style={sharedTitleStyle}>
          <Text style={styles.titleText}>MonsterAI</Text>
        </Animated.View>

        {/* Shared Profile Button - Always mounted */}
        <Animated.View style={sharedProfileStyle}>
          <TouchableOpacity style={styles.iconButton} onPress={handleProfilePress}>
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
            <User size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>

        {/* Expanded State - Full background with cards */}
        <Animated.View style={[styles.expandedContainer, backgroundContainerStyle]}>
          <View style={styles.topExtension} />
          <ImageBackground
            source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/chatbackground.png' }}
            style={styles.backgroundImage}
            resizeMode="cover"
            imageStyle={{ resizeMode: 'cover', position: 'absolute', bottom: 0, top: 'auto' }}
          >
            <View style={styles.statusBar}>
              <View />
              <View style={styles.profilePlaceholder} />
            </View>

            <View style={styles.bannersContainer}>
              <Animated.View style={[styles.monsterImageContainer, monsterImageStyle]}>
                <Image
                  source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/chatteam.png' }}
                  style={styles.monsterImage}
                  resizeMode="cover"
                />
              </Animated.View>

              <Animated.View style={[styles.breakfastBanner, breakfastBannerStyle]}>
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.breakfastContent}>
                  <View style={styles.breakfastLeft}>
                    <Image
                      source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/chatposture.png' }}
                      style={styles.avatarImage}
                    />
                    <View style={styles.breakfastTextContainer}>
                      <Text style={styles.timeRange}>7:00-8:00</Text>
                      <Text style={styles.taskTitle}>Eat breakfast!</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.doneButton, isDone && styles.doneButtonChecked]}
                    onPress={() => setIsDone(!isDone)}
                  >
                    {isDone ? (
                      <Check size={18} color="#FFFFFF" strokeWidth={3} />
                    ) : (
                      <Text style={styles.doneButtonText}>Done</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>

              <Animated.View style={[styles.thinkingBanner, zappedBannerStyle]}>
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.thinkingContent}>
                  <TouchableOpacity style={styles.thinkingLeft} onPress={handleThinkingPress} activeOpacity={0.8}>
                    <View style={styles.thinkingHeader}>
                      <Text style={styles.brainEmoji}>🧠</Text>
                      <Text style={styles.thinkingTitle}>In My Mind</Text>
                    </View>
                    <View style={styles.thinkingLogContainer}>
                      <Animated.View style={logScrollStyle}>
                        {[...logEntries, ...logEntries].map((entry, index) => (
                          <Text key={index} style={styles.logLine}>
                            <Text style={styles.logTime}>[{entry.time}]</Text>
                            <Text style={styles.logText}> {entry.message}</Text>
                          </Text>
                        ))}
                      </Animated.View>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.cameraPlaceholder} />
                </View>
              </Animated.View>
            </View>
          </ImageBackground>
        </Animated.View>

        {/* Collapsed State - Simple header with zapped banner only */}
        <Animated.View style={[styles.collapsedContainer, collapsedHeaderStyle]}>
          <View style={styles.collapsedTopExtension} />
          <ImageBackground
            source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/chatbackground.png' }}
            style={styles.collapsedBackground}
            resizeMode="cover"
            imageStyle={{ resizeMode: 'cover', position: 'absolute', bottom: 0, top: 'auto' }}
          >
            <View style={styles.collapsedHeader}>
              <View />
              <View style={styles.profilePlaceholder} />
            </View>

            <View style={styles.collapsedBannerContainer}>
              <View style={styles.collapsedThinkingBanner}>
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.thinkingContent}>
                  <TouchableOpacity style={styles.thinkingLeft} onPress={handleThinkingPress} activeOpacity={0.8}>
                    <View style={styles.thinkingHeader}>
                      <Text style={styles.brainEmoji}>🧠</Text>
                      <Text style={styles.thinkingTitle}>In My Mind</Text>
                    </View>
                    <View style={styles.thinkingLogContainer}>
                      <Animated.View style={logScrollStyle}>
                        {[...logEntries, ...logEntries].map((entry, index) => (
                          <Text key={index} style={styles.logLine}>
                            <Text style={styles.logTime}>[{entry.time}]</Text>
                            <Text style={styles.logText}> {entry.message}</Text>
                          </Text>
                        ))}
                      </Animated.View>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.cameraPlaceholder} />
                </View>
              </View>
            </View>
          </ImageBackground>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: 'relative',
    overflow: 'visible',
    marginTop: Platform.OS === 'ios' ? -60 : -(StatusBar.currentHeight || 0) - 10,
    zIndex: 1000,
  },

  // Expanded state styles
  expandedContainer: {
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
    backgroundColor: '#F5F7F9',
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
    paddingHorizontal: 20,
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bannersContainer: {
    paddingHorizontal: 15,
    paddingBottom: 12,
    marginTop: -20,
  },
  monsterImageContainer: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 24,
  },
  monsterImage: {
    width: '100%',
    height: '100%',
  },
  breakfastBanner: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  breakfastContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  breakfastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarImage: {
    width: 50,
    height: 50,
    marginRight: 14,
  },
  breakfastTextContainer: {
    flex: 1,
  },
  timeRange: {
    fontSize: 14,
    fontFamily: 'Nunito_500Medium',
    color: '#666666',
    marginBottom: 2,
  },
  taskTitle: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
  },
  doneButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  doneButtonChecked: {
    backgroundColor: '#4CAF50',
  },
  doneButtonText: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    color: '#000000',
  },
  thinkingBanner: {
    height: 130,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },

  // Collapsed state styles
  collapsedContainer: {
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
  collapsedTopExtension: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 10,
    backgroundColor: '#F5F7F9',
    zIndex: -1,
  },
  collapsedBackground: {
    width: '100%',
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 10,
    justifyContent: 'flex-end',
  },
  collapsedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 10,
    paddingBottom: 15,
  },
  collapsedBannerContainer: {
    paddingHorizontal: 15,
    marginTop: -38,
    marginBottom: 12,
  },
  collapsedThinkingBanner: {
    height: 130,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },

  // Thinking banner content styles
  thinkingContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 18,
    alignItems: 'center',
  },
  thinkingLeft: {
    flex: 1,
    paddingRight: 12,
  },
  thinkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  brainEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  thinkingTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
  },
  thinkingLogContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  logLine: {
    marginBottom: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  logTime: {
    fontFamily: 'Courier New',
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '600',
  },
  logText: {
    fontFamily: 'Courier New',
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    flex: 1,
  },
  cameraPlaceholder: {
    width: 140,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
  },
  profilePlaceholder: {
    width: 44,
    height: 44,
  },
  titleText: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
  },
});
