import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { LiquidGlassCard } from './LiquidGlassCard';
import { Camera } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { CameraPermissionModal } from './CameraPermissionModal';
import { useRouter } from 'expo-router';

interface LogEntry {
  time: string;
  message: string;
}

const DEFAULT_LOG_ENTRIES: LogEntry[] = [
  { time: '07:42', message: "User's facial energy dropped 12% vs baseline." },
  { time: '07:45', message: 'Tag: Low energy morning, possible poor sleep.' },
  { time: '08:02', message: 'Suggest: Protein breakfast + 5-min stretch.' },
  { time: '08:15', message: 'Mood signal improving by 6%.' },
  { time: '08:40', message: 'Saved to Life Log → Breakfast check-in.' },
];

export function ThinkingBanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [completedEntries, setCompletedEntries] = useState<LogEntry[]>([]);
  const [contentHeight, setContentHeight] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 打字机效果
  useEffect(() => {
    if (isPaused) {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      return;
    }

    const allEntries = [...DEFAULT_LOG_ENTRIES, ...DEFAULT_LOG_ENTRIES];
    const currentEntry = allEntries[currentEntryIndex % allEntries.length];
    const fullText = `[${currentEntry.time}] ${currentEntry.message}`;
    let charIndex = 0;

    typingIntervalRef.current = setInterval(() => {
      if (charIndex < fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        charIndex++;
      } else {
        // 当前条目打完，添加到已完成列表
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }

        setCompletedEntries(prev => [...prev, currentEntry]);
        setDisplayedText('');

        // 延迟后开始下一条
        setTimeout(() => {
          setCurrentEntryIndex(prev => prev + 1);
        }, 300);
      }
    }, 50);

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [currentEntryIndex, isPaused]);

  // 滚动效果：当内容高度超过容器高度时，向上滚动
  useEffect(() => {
    const containerHeight = 72;
    if (contentHeight > containerHeight) {
      const scrollAmount = contentHeight - containerHeight;
      Animated.timing(scrollY, {
        toValue: scrollAmount,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [contentHeight]);

  const handleCameraPress = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      setShowPermissionModal(true);
    } else {
      setShowCamera(true);
    }
  };

  const handleAllowPermission = async () => {
    const result = await requestPermission();
    setShowPermissionModal(false);
    if (result.granted) {
      setShowCamera(true);
    }
  };

  const handleLogPress = () => {
    router.push('/(tabs)/home');
  };

  const handleTouchStart = () => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
  };

  const handleTouchEnd = () => {
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 2000);
  };

  return (
    <>
      <LiquidGlassCard style={styles.card}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.leftColumn}
            onPress={handleLogPress}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            activeOpacity={0.8}
          >
            <View style={styles.header}>
              <Text style={styles.brainEmoji}>🧠</Text>
              <Text style={styles.title}>In My Head</Text>
            </View>

            <View style={styles.logContainer}>
              <Animated.View
                style={[
                  styles.logScroll,
                  {
                    transform: [{ translateY: Animated.multiply(scrollY, -1) }],
                  },
                ]}
                onLayout={(event) => {
                  const { height } = event.nativeEvent.layout;
                  setContentHeight(height);
                }}
              >
                {completedEntries.map((entry, index) => (
                  <View key={index} style={styles.logEntry}>
                    <Text style={styles.logTime}>[{entry.time}]</Text>
                    <Text style={styles.logMessage}>{entry.message}</Text>
                  </View>
                ))}
                {displayedText && (
                  <View style={styles.logEntry}>
                    <Text style={[styles.logTime, styles.logMessage]}>{displayedText}</Text>
                  </View>
                )}
              </Animated.View>
            </View>
          </TouchableOpacity>

          <View style={styles.rightColumn}>
            <View style={styles.cameraContainer}>
              {permission?.granted && !showCamera ? (
                <CameraView style={styles.camera} facing="back">
                  <TouchableOpacity style={styles.cameraButton} onPress={handleCameraPress}>
                    <View style={styles.cameraButtonInner}>
                      <Camera size={18} color="#FFFFFF" strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                </CameraView>
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <TouchableOpacity style={styles.cameraButton} onPress={handleCameraPress}>
                    <View style={styles.cameraButtonInner}>
                      <Camera size={18} color="#FFFFFF" strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.cameraPlaceholderText}>📸</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </LiquidGlassCard>

      <CameraPermissionModal
        visible={showPermissionModal}
        onAllow={handleAllowPermission}
        onCancel={() => setShowPermissionModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 15,
    height: 160,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  brainEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
  },
  logContainer: {
    height: 72,
    position: 'relative',
    overflow: 'hidden',
  },
  logScroll: {
    position: 'absolute',
    width: '100%',
  },
  logEntry: {
    flexDirection: 'row',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  logTime: {
    fontFamily: 'Courier New',
    fontSize: 11,
    color: '#E91E63',
    marginRight: 4,
    fontWeight: '600',
    flexShrink: 0,
  },
  logMessage: {
    fontFamily: 'Courier New',
    fontSize: 11,
    color: '#333333',
    lineHeight: 16,
    flex: 1,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'transparent',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  rightColumn: {
    width: 140,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#8B7355',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    fontSize: 40,
    fontFamily: 'SF Compact Rounded',
    marginTop: -30,
  },
  cameraButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  cameraButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
});
