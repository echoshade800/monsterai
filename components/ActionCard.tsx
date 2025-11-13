import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LiquidGlassCard } from './LiquidGlassCard';
import { Check } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useState } from 'react';

interface ActionCardProps {
  onDismiss: () => void;
}

export function ActionCard({ onDismiss }: ActionCardProps) {
  const [isChecked, setIsChecked] = useState(false);
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const handlePress = () => {
    setIsChecked(true);

    buttonScale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );

    setTimeout(() => {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(20, { duration: 300 }, () => {
        runOnJS(onDismiss)();
      });
    }, 400);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LiquidGlassCard style={styles.card}>
        <View style={styles.content}>
          <View style={styles.leftSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>🦑</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.timeText}>7:00-8:00</Text>
              <Text style={styles.taskText}>Eat breakfast!</Text>
            </View>
          </View>

          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              style={[styles.button, isChecked && styles.buttonChecked]}
              onPress={handlePress}
              disabled={isChecked}
            >
              {isChecked ? (
                <Check size={20} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <Text style={styles.buttonText}>Done</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </LiquidGlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: -60,
  },
  card: {
    height: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 4,
  },
  taskText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonChecked: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
});
