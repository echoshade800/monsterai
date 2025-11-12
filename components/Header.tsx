import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { Share2, Settings } from 'lucide-react-native';
import Animated, { useAnimatedStyle, interpolate, Extrapolate } from 'react-native-reanimated';

interface HeaderProps {
  scrollY: Animated.SharedValue<number>;
  isCollapsed: boolean;
}

export function Header({ scrollY, isCollapsed }: HeaderProps) {
  const headerAnimatedStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 150],
      [420, 120],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      [0, 100, 150],
      [1, 0.5, 0],
      Extrapolate.CLAMP
    );

    return {
      height,
      opacity: scrollY.value > 150 ? 0 : 1,
    };
  });

  const charactersOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View style={[styles.header, headerAnimatedStyle]}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />

      <View style={styles.statusBar}>
        <Text style={styles.time}>{getCurrentTime()}</Text>
        <View style={styles.rightButtons}>
          <TouchableOpacity style={styles.iconButton}>
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
            <Share2 size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
            <Settings size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.View style={[styles.brandContainer, charactersOpacity]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>MONSTER AI</Text>
        </View>

        <View style={styles.charactersContainer}>
          <Text style={styles.characterEmoji}>👾</Text>
          <Text style={styles.characterEmoji}>☁️</Text>
          <Text style={styles.characterEmoji}>🦑</Text>
          <Text style={styles.characterEmoji}>🥒</Text>
          <Text style={styles.characterEmoji}>🔥</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20,
    paddingBottom: 15,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 12,
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
  },
  logoContainer: {
    backgroundColor: 'rgba(210, 180, 140, 0.4)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(160, 120, 80, 0.5)',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#8B6914',
    letterSpacing: 2,
  },
  charactersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 15,
    paddingHorizontal: 20,
  },
  characterEmoji: {
    fontSize: 60,
  },
});
