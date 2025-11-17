import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { ReactNode } from 'react';

interface LiquidGlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function LiquidGlassCard({ children, style, intensity = 70 }: LiquidGlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    flex: 1,
  },
});
