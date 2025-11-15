import { useRouter } from 'expo-router';
import {
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Image as ImageIcon,
  MapPin,
  Mic,
  X,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import locationManager from '../../src/utils/location-manager';

export default function HomeTab() {
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [permissions, setPermissions] = useState({
    location: true,
    healthkit: false,
    calendar: true,
    photos: true,
    camera: false,
    microphone: true,
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  useEffect(() => {
    Animated.loop(
      Animated.timing(scrollY, {
        toValue: -600,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  useEffect(() => {
    const syncLocationPermission = async () => {
      try {
        const result = await locationManager.checkLocationPermission('foreground');
        setPermissions((prev) => ({
          ...prev,
          location: result.success,
        }));
      } catch (error) {
        console.error('[HomeTab] 检查位置权限失败:', error);
      }
    };

    syncLocationPermission();
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

  const allTimelineData: Record<string, Array<{ time: string; category: string; description: string }>> = {
    [new Date().toDateString()]: [
      { time: '07:58 AM', category: 'Sleep', description: 'Sleep cycle: 7h 12m, Deep: 2h 08m' },
      { time: '09:14 AM', category: 'Energy', description: 'Breakfast logged: Yogurt + Berries' },
      { time: '12:18 PM', category: 'Energy', description: 'Lunch logged: Noodles + Vegetables' },
      { time: '14:25 PM', category: 'Posture', description: 'Forward head posture detected briefly' },
      { time: '15:07 PM', category: 'Face', description: 'Eye fatigue detected from photo' },
      { time: '16:10 PM', category: 'Energy', description: 'Snack logged: Protein bar' },
      { time: '17:33 PM', category: 'Feces', description: 'Digestive pattern consistent with baseline' },
      { time: '19:02 PM', category: 'Stress', description: 'Evening stress stabilized' },
      { time: '23:18 PM', category: 'Sleep', description: 'Wind-down pattern detected before sleep' },
    ],
    [(() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toDateString();
    })()]: [
      { time: '08:15 AM', category: 'Sleep', description: 'Sleep cycle: 6h 45m, Deep: 1h 52m' },
      { time: '09:30 AM', category: 'Energy', description: 'Breakfast logged: Oatmeal + Banana' },
      { time: '13:20 PM', category: 'Energy', description: 'Lunch logged: Salad + Chicken' },
      { time: '18:45 PM', category: 'Stress', description: 'Elevated stress levels detected' },
    ],
    [(() => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      return twoDaysAgo.toDateString();
    })()]: [
      { time: '07:30 AM', category: 'Sleep', description: 'Sleep cycle: 7h 30m, Deep: 2h 15m' },
      { time: '10:00 AM', category: 'Energy', description: 'Breakfast logged: Smoothie' },
      { time: '14:15 PM', category: 'Face', description: 'Good energy levels detected' },
    ],
  };

  const timelineEntries = allTimelineData[selectedDate.toDateString()] || [];

  const togglePermission = async (id: string) => {
    if (id === 'location') {
      const currentValue = permissions.location;

      if (currentValue) {
        setPermissions((prev) => ({
          ...prev,
          location: false,
        }));
        return;
      }

      try {
        const isServiceAvailable = await locationManager.isLocationServiceAvailable();
        if (!isServiceAvailable) {
          Alert.alert(
            '位置服务不可用',
            '请在设备设置中启用位置服务',
            [
              { text: '取消', style: 'cancel' },
              {
                text: '去设置',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('打开设置失败:', error);
                  }
                },
              },
            ],
          );
          return;
        }

        const permissionResult = await locationManager.requestLocationPermission('foreground');
        console.log('[HomeTab] 请求位置权限结果:', permissionResult);
        if (permissionResult.success) {
          setPermissions((prev) => ({
            ...prev,
            location: true,
          }));
        } else {
          Alert.alert(
            '位置权限被拒绝',
            permissionResult.error || '需要位置权限才能使用位置服务。请在设置中开启位置权限。',
            [
              { text: '取消', style: 'cancel' },
              {
                text: '去设置',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('打开设置失败:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('[HomeTab] 请求位置权限失败:', error);
        Alert.alert(
          '请求权限失败',
          '无法请求位置权限，请稍后重试。您也可以在设置中手动开启位置权限。',
          [
            { text: '取消', style: 'cancel' },
            {
              text: '去设置',
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error('打开设置失败:', error);
                }
              },
            },
          ],
        );
      }

      return;
    }

    setPermissions((prev) => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev],
    }));
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const generateCalendarDays = () => {
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const selectCalendarDate = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  const changeCalendarMonth = (months: number) => {
    const newDate = new Date(calendarViewDate);
    newDate.setMonth(newDate.getMonth() + months);
    setCalendarViewDate(newDate);
  };

  const openCalendar = () => {
    setCalendarViewDate(selectedDate);
    setShowCalendar(true);
  };

  return (
    <View style={styles.container}>
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
                  { transform: [{ translateY: scrollY }] },
                ]}
              >
                {[...thinkingLogs, ...thinkingLogs, ...thinkingLogs].map((log, index) => (
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
            <TouchableOpacity onPress={openCalendar}>
              <Calendar size={24} color="#666" />
            </TouchableOpacity>
            <View style={styles.dateControlCenter}>
              <TouchableOpacity style={styles.dateArrow} onPress={() => changeDate(-1)}>
                <ChevronLeft size={20} color="#666" />
              </TouchableOpacity>
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              <TouchableOpacity style={styles.dateArrow} onPress={() => changeDate(1)}>
                <ChevronRight size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.timelineContainer}>
            {timelineEntries.length > 0 ? (
              timelineEntries.map((entry, index) => (
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
              ))
            ) : (
              <View style={styles.noLogsContainer}>
                <Text style={styles.noLogsText}>No logs for today.</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>

      <Modal
        visible={showCalendar}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModal}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeCalendarMonth(-1)}>
                <ChevronLeft size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.calendarHeaderText}>
                {calendarViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => changeCalendarMonth(1)}>
                <ChevronRight size={24} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCalendar(false)} style={styles.calendarCloseButton}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.calendarWeekdays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={styles.calendarWeekdayText}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarDays}>
              {generateCalendarDays().map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDay,
                    !day && styles.calendarDayEmpty,
                    day &&
                      day.toDateString() === selectedDate.toDateString() &&
                      styles.calendarDaySelected,
                  ]}
                  onPress={() => day && selectCalendarDate(day)}
                  disabled={!day}
                >
                  {day && (
                    <Text
                      style={[
                        styles.calendarDayText,
                        day.toDateString() === selectedDate.toDateString() &&
                          styles.calendarDayTextSelected,
                      ]}
                    >
                      {day.getDate()}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
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
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    paddingHorizontal: 40,
  },
  calendarHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  calendarCloseButton: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  calendarWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  calendarWeekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    width: 40,
    textAlign: 'center',
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  calendarDayEmpty: {
    backgroundColor: 'transparent',
  },
  calendarDaySelected: {
    backgroundColor: '#000',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  noLogsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noLogsText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
});
