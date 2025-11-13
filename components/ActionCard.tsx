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
    marginTop: 20,
  },
  card: {
    height: 80,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  textContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 2,
  },
  taskText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonChecked: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
