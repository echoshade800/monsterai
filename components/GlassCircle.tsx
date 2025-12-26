import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

interface GlassCircleProps {
  size?: number;
  intensity?: number;
  opacity?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export const GlassCircle: React.FC<GlassCircleProps> = ({
  size = 44,
  intensity = 50,
  opacity = 0.2,
  children,
  style,
}) => {
  const borderRadius = size / 2;

  return (
    <View style={[
      styles.container, 
      { width: size, height: size, borderRadius }, 
      style
    ]}>
      {/* Glow / Shadow effect */}
      <View style={[
        styles.glow, 
        { borderRadius, width: size, height: size }
      ]} />
      
      {/* Blur background */}
      <BlurView
        intensity={intensity}
        tint="light"
        style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }]}
      />

      {/* Main translucent surface */}
      <View style={[
        StyleSheet.absoluteFill, 
        { 
          backgroundColor: `rgba(255, 255, 255, ${opacity})`, 
          borderRadius,
        }
      ]} />

      {/* Internal highlight gradient */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.4)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />

      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ scale: 1.1 }],
    opacity: 0.5,
  },
  content: {
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

