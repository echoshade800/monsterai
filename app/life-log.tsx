import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  MapPin,
  Heart,
  Calendar,
  Image as ImageIcon,
  Camera,
  Mic,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react-native';

export default function LifeLogScreen() {
  const router = useRouter();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [permissions, setPermissions] = useState({
    location: true,
    healthkit: false,
    calendar: true,
    photos: true,
    camera: false,
    microphone: true,
  });

  useEffect(() => {
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -1000,
        duration: 20000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const thinkingLogs = [
    "[11:42am] User's facial energy dropped 12% compared to baseline.",
    '[11:44am] Suggest: Stretch & breathe.',
    '[10:04am] Smile activity dropped noticeably.',
    '[11:18am] Eye fatigue increased — may indicate stress.',
    '[12:22pm] Posture stability decreased during sitting.',
    '[12:40pm] Micro-expression tension rising.',
  ];

  const formatLogText = (text: string) => {
    const parts = [];
    const timeMatch = text.match(/\[(.*?)\]/);

    if (timeMatch) {
      parts.push({ text: `[${timeMatch[1]}]`, color: '#7FFF7F' });
      text = text.substring(timeMatch[0].length).trim();
    }

    const words = text.split(' ');
    words.forEach((word, index) => {
      let color = '#E8E8E8';

      if (word.match(/\d+%/)) {
        color = '#FF6B6B';
      } else if (
        ['User', 'Suggest', 'Smile', 'Eye', 'Posture', 'Micro-expression'].some(
          (keyword) => word.includes(keyword)
        )
      ) {
        color = '#87CEEB';
      }

      parts.push({ text: word, color });
      if (index < words.length - 1) {
        parts.push({ text: ' ', color: '#E8E8E8' });
      }
    });

    return parts;
  };

  const permissionsList = [
    {
      id: 'location',
      icon: <MapPin size={24} color="#666" />,
      title: 'Location Services',
      enabled: permissions.location,
    },
    {
      id: 'healthkit',
      icon: <Heart size={24} color="#666" />,
      title: 'HealthKit',
      enabled: permissions.healthkit,
    },
    {
      id: 'calendar',
      icon: <Calendar size={24} color="#666" />,
      title: 'Calendar',
      enabled: permissions.calendar,
    },
    {
      id: 'photos',
      icon: <ImageIcon size={24} color="#666" />,
      title: 'Photos',
      enabled: permissions.photos,
    },
    {
      id: 'camera',
      icon: <Camera size={24} color="#666" />,
      title: 'Camera',
      enabled: permissions.camera,
    },
    {
      id: 'microphone',
      icon: <Mic size={24} color="#666" />,
      title: 'Microphone',
      enabled: permissions.microphone,
    },
  ];

  const timelineEntries = [
    { time: '07:58 AM', category: 'Sleep', description: 'Sleep cycle: 7h 12m, Deep: 2h 08m' },
    { time: '09:14 AM', category: 'Energy', description: 'Breakfast logged: Yogurt + Berries' },
    { time: '12:18 PM', category: 'Energy', description: 'Lunch logged: Noodles + Vegetables' },
    { time: '14:25 PM', category: 'Posture', description: 'Forward head posture detected briefly' },
    { time: '15:07 PM', category: 'Face', description: 'Eye fatigue detected from photo' },
    { time: '16:10 PM', category: 'Energy', description: 'Snack logged: Protein bar' },
    { time: '17:33 PM', category: 'Feces', description: 'Digestive pattern consistent with baseline' },
    { time: '19:02 PM', category: 'Stress', description: 'Evening stress stabilized' },
    { time: '23:18 PM', category: 'Sleep', description: 'Wind-down pattern detected before sleep' },
  ];

  const togglePermission = (id: string) => {
    setPermissions((prev) => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Building</Text>
          <Text style={styles.headerTitle}>Your Life Model</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How I Think</Text>
          <View style={styles.thinkingBanner}>
            <View style={styles.thinkingScrollContainer}>
              <Animated.View
                style={[
                  styles.thinkingScrollContent,
                  { transform: [{ translateX: scrollX }] },
                ]}
              >
                {[...thinkingLogs, ...thinkingLogs].map((log, index) => (
                  <View key={index} style={styles.thinkingLogLine}>
                    {formatLogText(log).map((part, partIndex) => (
                      <Text
                        key={partIndex}
                        style={[styles.thinkingLogText, { color: part.color }]}
                      >
                        {part.text}
                      </Text>
                    ))}
                  </View>
                ))}
              </Animated.View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.permissionsCard}>
            {permissionsList.map((permission, index) => (
              <View
                key={permission.id}
                style={[
                  styles.permissionRow,
                  index < permissionsList.length - 1 && styles.permissionRowBorder,
                ]}
              >
                <View style={styles.permissionIcon}>{permission.icon}</View>
                <View style={styles.permissionText}>
                  <Text style={styles.permissionTitle}>{permission.title}</Text>
                  <Text style={styles.permissionSubtitle}>
                    {permission.enabled ? 'Enabled' : 'Not Enabled'}
                  </Text>
                </View>
                <Switch
                  value={permission.enabled}
                  onValueChange={() => togglePermission(permission.id)}
                  trackColor={{ false: '#E0E0E0', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>

          <View style={styles.dateControl}>
            <Calendar size={24} color="#666" />
            <View style={styles.dateControlCenter}>
              <TouchableOpacity style={styles.dateArrow}>
                <ChevronLeft size={20} color="#666" />
              </TouchableOpacity>
              <Text style={styles.dateText}>Today</Text>
              <TouchableOpacity style={styles.dateArrow}>
                <ChevronRight size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timelineContainer}>
            {timelineEntries.map((entry, index) => (
              <View key={index} style={styles.timelineEntry}>
                <View style={styles.timelineLeft}>
                  <Clock size={16} color="#666" />
                  <Text style={styles.timelineTime}>{entry.time}</Text>
                </View>
                <View style={styles.timelineDivider}>
                  <View style={styles.timelineDot} />
                  {index < timelineEntries.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                </View>
                <View style={styles.timelineRight}>
                  <Text style={styles.timelineCategory}>{entry.category}</Text>
                  <Text style={styles.timelineDescription}>{entry.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    lineHeight: 38,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  thinkingBanner: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    height: 200,
    overflow: 'hidden',
  },
  thinkingScrollContainer: {
    flex: 1,
  },
  thinkingScrollContent: {
    flexDirection: 'column',
  },
  thinkingLogLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  thinkingLogText: {
    fontSize: 14,
    fontFamily: 'Menlo',
    lineHeight: 20,
  },
  permissionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  permissionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  permissionIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    flex: 1,
    marginLeft: 8,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  permissionSubtitle: {
    fontSize: 13,
    color: '#999',
  },
  dateControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateControlCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateArrow: {
    padding: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginHorizontal: 16,
  },
  timelineContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  timelineEntry: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: 100,
    paddingTop: 2,
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginLeft: 6,
  },
  timelineDivider: {
    width: 20,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginTop: 6,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
    minHeight: 40,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineCategory: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
