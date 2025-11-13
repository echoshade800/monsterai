import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, ImageBackground, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { User, Check, Camera } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useState, useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface HeaderProps {
  scrollY?: Animated.SharedValue<number>;
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

const EXPANDED_HEIGHT = 600;
const COLLAPSED_HEIGHT = 320;
const COLLAPSE_THRESHOLD = 100;

export function Header({ scrollY, isCollapsed = false, onCollapse }: HeaderProps) {
  const [isDone, setIsDone] = useState(false);
  const animatedCollapse = useSharedValue(isCollapsed ? 1 : 0);

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

  const stressGraphPath = "M 0 25 Q 15 15, 30 18 T 60 23 T 90 18 T 120 25 T 150 20 T 180 28 T 210 23 T 240 25";

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        {/* Expanded State - Full background with cards */}
        <Animated.View style={[styles.expandedContainer, backgroundContainerStyle]}>
          <View style={styles.topExtension} />
          <ImageBackground
            source={{ uri: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/image%20-%202025-11-13T155705.084%20(1).png' }}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <View style={styles.statusBar}>
              <View />
              <TouchableOpacity style={styles.iconButton}>
                <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
                <User size={20} color="#000000" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.brandContainer}>
              <View style={styles.logoContainer}>
                <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                <Text style={styles.logoText}>MONSTER AI</Text>
              </View>
            </View>

            <View style={styles.bannersContainer}>
              <Animated.View style={[styles.breakfastBanner, breakfastBannerStyle]}>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.breakfastContent}>
                  <View style={styles.breakfastLeft}>
                    <Image
                      source={{ uri: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/Group%2092.png' }}
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

              <Animated.View style={[styles.zappedBanner, zappedBannerStyle]}>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.zappedContent}>
                  <View style={styles.zappedLeft}>
                    <View style={styles.zappedTitleRow}>
                      <Text style={styles.zappedTitle}>Zapped</Text>
                      <View style={styles.stressRow}>
                        <Text style={styles.stressLabel}>Stress</Text>
                        <Text style={styles.stressValue}>86</Text>
                      </View>
                    </View>
                    <View style={styles.graphContainer}>
                      <Svg width="100%" height="40" viewBox="0 0 240 40">
                        <Defs>
                          <SvgLinearGradient id="stressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0%" stopColor="#4ADE80" stopOpacity="1" />
                            <Stop offset="30%" stopColor="#FCD34D" stopOpacity="1" />
                            <Stop offset="60%" stopColor="#F472B6" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#A78BFA" stopOpacity="1" />
                          </SvgLinearGradient>
                        </Defs>
                        <Path
                          d={stressGraphPath}
                          fill="none"
                          stroke="url(#stressGrad)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </Svg>
                    </View>
                  </View>
                  <View style={styles.cameraBox}>
                    <View style={styles.cameraPlaceholder}>
                      <Text style={styles.cameraEmoji}>📸💥</Text>
                    </View>
                    <TouchableOpacity style={styles.cameraIconButton}>
                      <View style={styles.cameraIconInner}>
                        <Camera size={14} color="#FFFFFF" strokeWidth={2} />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </View>
          </ImageBackground>
        </Animated.View>

        {/* Collapsed State - Simple header with zapped banner only */}
        <Animated.View style={[styles.collapsedContainer, collapsedHeaderStyle]}>
          <View style={styles.collapsedTopExtension} />
          <ImageBackground
            source={{ uri: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/image%20-%202025-11-13T155705.084%20(1).png' }}
            style={styles.collapsedBackground}
            resizeMode="cover"
          >
            <View style={styles.collapsedHeader}>
              <View style={styles.collapsedTitleContainer}>
                <Text style={styles.collapsedTitle}>Monster AI</Text>
              </View>
              <TouchableOpacity style={styles.collapsedIconButton}>
                <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
                <User size={20} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.collapsedBannerContainer}>
              <View style={styles.collapsedZappedBanner}>
                <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                <View style={styles.zappedContent}>
                  <View style={styles.zappedLeft}>
                    <View style={styles.zappedTitleRow}>
                      <Text style={styles.zappedTitle}>Zapped</Text>
                      <View style={styles.stressRow}>
                        <Text style={styles.stressLabel}>Stress</Text>
                        <Text style={styles.stressValue}>86</Text>
                      </View>
                    </View>
                    <View style={styles.graphContainer}>
                      <Svg width="100%" height="40" viewBox="0 0 240 40">
                        <Defs>
                          <SvgLinearGradient id="stressGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0%" stopColor="#4ADE80" stopOpacity="1" />
                            <Stop offset="30%" stopColor="#FCD34D" stopOpacity="1" />
                            <Stop offset="60%" stopColor="#F472B6" stopOpacity="1" />
                            <Stop offset="100%" stopColor="#A78BFA" stopOpacity="1" />
                          </SvgLinearGradient>
                        </Defs>
                        <Path
                          d={stressGraphPath}
                          fill="none"
                          stroke="url(#stressGrad2)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </Svg>
                    </View>
                  </View>
                  <View style={styles.cameraBox}>
                    <View style={styles.cameraPlaceholder}>
                      <Text style={styles.cameraEmoji}>📸💥</Text>
                    </View>
                    <TouchableOpacity style={styles.cameraIconButton}>
                      <View style={styles.cameraIconInner}>
                        <Camera size={14} color="#FFFFFF" strokeWidth={2} />
                      </View>
                    </TouchableOpacity>
                  </View>
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
  header: {
    overflow: 'visible',
    marginTop: Platform.OS === 'ios' ? -60 : -(StatusBar.currentHeight || 0) - 10,
    width: '100%',
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
    backgroundColor: '#E8D4B8',
    zIndex: -1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 10,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
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
  brandContainer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 25,
  },
  logoContainer: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(160, 120, 80, 0.5)',
    overflow: 'hidden',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#8B6914',
    letterSpacing: 2,
  },
  bannersContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  breakfastBanner: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    fontWeight: '500',
    color: '#666666',
    marginBottom: 2,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '700',
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
    fontWeight: '600',
    color: '#000000',
  },
  zappedBanner: {
    height: 130,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    backgroundColor: '#8B7355',
    zIndex: -1,
  },
  collapsedBackground: {
    width: '100%',
    height: '100%',
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 10,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  collapsedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 20) + 10,
    paddingBottom: 15,
  },
  collapsedTitleContainer: {
    flex: 1,
  },
  collapsedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  collapsedIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  collapsedBannerContainer: {
    paddingHorizontal: 15,
    marginTop: -18,
  },
  collapsedZappedBanner: {
    height: 130,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  // Shared zapped banner content styles
  zappedContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 18,
  },
  zappedLeft: {
    flex: 1,
    paddingRight: 12,
  },
  zappedTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  zappedTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000000',
  },
  stressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stressLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 6,
  },
  stressValue: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000000',
  },
  graphContainer: {
    height: 40,
    marginTop: 2,
  },
  cameraBox: {
    width: 120,
    position: 'relative',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#8B7355',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraEmoji: {
    fontSize: 32,
  },
  cameraIconButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cameraIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
