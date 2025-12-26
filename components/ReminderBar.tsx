import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { 
  FadeInUp, 
  FadeOutRight, 
  Layout, 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming 
} from 'react-native-reanimated';

export interface ReminderItem {
  id: string;
  agent: 'nutrition' | 'coach' | 'somno' | 'default';
  timeWindow: string;
  title: string;
  status: 'active' | 'done' | 'expired';
  priority: number;
}

interface ReminderBarProps {
  reminder: ReminderItem | null;
  onDone: (id: string) => void;
  onPress?: (id: string) => void;
}

const AGENT_ICONS: Record<string, string> = {
  nutrition: 'https://vsa-bucket-public-new.s3.amazonaws.com/monster/avatar_v1/probutler.png',
  coach: 'https://vsa-bucket-public-new.s3.amazonaws.com/monster/avatar_v1/probutler.png',
  somno: 'https://vsa-bucket-public-new.s3.amazonaws.com/monster/avatar_v1/probutler.png',
  default: 'https://vsa-bucket-public-new.s3.amazonaws.com/monster/avatar_v1/probutler.png',
};

export function ReminderBar({ reminder, onDone, onPress }: ReminderBarProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (reminder) {
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [reminder]);

  if (!reminder) return null;

  const handleDone = () => {
    onDone(reminder.id);
  };

  return (
    <Animated.View 
      entering={FadeInUp.duration(400)}
      exiting={FadeOutRight.duration(300)}
      layout={Layout.springify()}
      style={styles.container}
    >
      <TouchableOpacity 
        style={styles.barWrapper} 
        activeOpacity={0.9} 
        onPress={() => onPress?.(reminder.id)}
      >
        <BlurView intensity={20} tint="light" style={styles.blurBackground} />
        
        <View style={styles.content}>
          {/* Left: Icon */}
          <View style={styles.iconContainer}>
            <Image 
              source={{ uri: AGENT_ICONS[reminder.agent] || AGENT_ICONS.default }} 
              style={styles.agentIcon} 
            />
          </View>

          {/* Center: Time + Title */}
          <View style={styles.textContainer}>
            <Text style={styles.timeText}>{reminder.timeWindow}</Text>
            <Text style={styles.titleText} numberOfLines={1}>
              {reminder.title}
            </Text>
          </View>

          {/* Right: Done Button */}
          <TouchableOpacity 
            style={styles.doneButton} 
            onPress={handleDone}
            activeOpacity={0.7}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
    zIndex: 10,
  },
  barWrapper: {
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#8E8E93',
    marginBottom: 1,
  },
  titleText: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#1C1C1E',
  },
  doneButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  doneButtonText: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
  },
});

