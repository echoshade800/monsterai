import { BlurView } from 'expo-blur';
import { Edit2 } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../src/services/api-clients/client';
import { API_ENDPOINTS, getHeadersWithPassId } from '../src/services/api/api';
import storageManager from '../src/utils/storage';
import { TimePickerModal } from './TimePickerModal';

interface ReminderItem {
  time: string;
  title: string;
  task_type?: string;
}

interface ReminderCardProps {
  title: string;
  monster: string;
  reminders: ReminderItem[];
  disabled?: boolean;
  messageId?: string; // 消息 ID，用于唯一标识 ReminderCard
}

interface ReminderItemRowProps {
  time: string;
  title: string;
  task_type: string;
  onTimeChange: (newTime: string) => void;
  disabled?: boolean;
  reminderId: string; // Reminder 唯一标识 (messageId + index)
}

function ReminderItemRow({ time, title, task_type, onTimeChange, disabled = false, reminderId }: ReminderItemRowProps) {
  const [selected, setSelected] = useState<'yes' | 'no' | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTime, setCurrentTime] = useState(time);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const scaleAnimYes = useRef(new Animated.Value(1)).current;
  const scaleAnimNo = useRef(new Animated.Value(1)).current;

  // 从本地存储加载选择结果
  useEffect(() => {
    const loadSelection = async () => {
      try {
        const savedSelection = await storageManager.getReminderSelection(reminderId);
        if (savedSelection === 'yes' || savedSelection === 'no') {
          setSelected(savedSelection);
          setIsSubmitted(true);
          console.log('Loaded reminder selection from storage:', reminderId, savedSelection);
        }
      } catch (error) {
        console.error('Failed to load reminder selection:', error);
      }
    };
    loadSelection();
  }, [reminderId]);

  const handleYesPress = async () => {
    // 如果被禁用，直接返回
    if (disabled) {
      return;
    }
    // 如果已经提交，显示提示并返回
    if (isSubmitted) {
      Alert.alert('Notice', 'You have already submitted your selection and cannot modify it again.');
      return;
    }

    setSelected('yes');
    setIsSubmitted(true);
    
    // 保存选择结果到本地存储
    await storageManager.setReminderSelection(reminderId, 'yes');
    
    // Trigger scale animation
    Animated.sequence([
      Animated.timing(scaleAnimYes, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimYes, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      // 获取 headers
      const headers = await getHeadersWithPassId();
      console.log('task_type', task_type, 'title', title, 'time', time);

      // 发送 POST 请求
      const response = await api.post(API_ENDPOINTS.DATA_AGENT.USER_TIME_SCHEDULE_SMART_UPDATE, {
        task_type: task_type,
        title: title,
        time: time,
      }, {
        headers: {
          'accept': 'application/json',
          'passid': (headers as any).passid || (headers as any).passId,
          'Content-Type': 'application/json',
        },
      });

      console.log('Smart update response:', response);

      if (response.isSuccess()) {
        console.log('Successfully updated user time schedule');
        Alert.alert('Success', 'Your selection has been successfully saved.');
      } else {
        console.error('Failed to update user time schedule:', response);
        Alert.alert('Error', 'Failed to save your selection, please try again later.');
        // 如果失败，允许重新提交
        setIsSubmitted(false);
        setSelected(null);
        // 清除本地存储的选择结果
        await storageManager.clearReminderSelection(reminderId);
      }
    } catch (error) {
      console.error('Error updating user time schedule:', error);
      Alert.alert('Error', 'Network error, please try again later.');
      // 如果出错，允许重新提交
      setIsSubmitted(false);
      setSelected(null);
      // 清除本地存储的选择结果
      await storageManager.clearReminderSelection(reminderId);
    }
  };

  const handleNoPress = async () => {
    // 如果被禁用，直接返回
    if (disabled) {
      return;
    }
    // 如果已经提交，显示提示并返回
    if (isSubmitted) {
      Alert.alert('Notice', 'You have already submitted your selection and cannot modify it again.');
      return;
    }

    setSelected('no');
    setIsSubmitted(true);
    
    // 保存选择结果到本地存储
    await storageManager.setReminderSelection(reminderId, 'no');
    
    // Trigger scale animation
    Animated.sequence([
      Animated.timing(scaleAnimNo, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimNo, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Alert.alert('Recorded', 'Your selection has been recorded.');
  };

  const handleEditPress = () => {
    // 如果被禁用，直接返回
    if (disabled) {
      return;
    }
    // 如果已经提交，显示提示并返回
    if (isSubmitted) {
      Alert.alert('Notice', 'You have already submitted your selection and cannot modify the time again.');
      return;
    }
    setShowTimePicker(true);
  };

  const handleTimeSave = (newTime: string, enabled: boolean) => {
    // For ReminderCard, we don't use the enabled param (no toggle shown)
    setCurrentTime(newTime);
    onTimeChange(newTime);
    setShowTimePicker(false);
  };

  const handleTimePickerClose = () => {
    setShowTimePicker(false);
  };

  return (
    <>
      <View style={styles.reminderItem}>
        <View style={styles.reminderInfo}>
          <View style={styles.reminderTextContent}>
            <View style={styles.timeRow}>
              <Text style={styles.clockIcon}>⏰</Text>
              <Text style={styles.timeText}>{currentTime}</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={handleEditPress}
                activeOpacity={(disabled || isSubmitted) ? 0.3 : 0.7}
                disabled={disabled || isSubmitted}
              >
                <Edit2 
                  size={14} 
                  color={(disabled || isSubmitted) ? "#CCCCCC" : "#999999"} 
                  strokeWidth={2} 
                />
              </TouchableOpacity>
            </View>
            <Text style={styles.reminderTitle}>{title}</Text>
          </View>
        </View>
        <View style={styles.buttonGroup}>
        <TouchableOpacity
          onPress={handleNoPress}
          activeOpacity={(disabled || isSubmitted) ? 0.3 : 1}
          disabled={disabled || isSubmitted}
        >
          <Animated.View
            style={[
              styles.button,
              selected === 'no' && styles.buttonNo,
              (disabled || (isSubmitted && selected !== 'no')) && styles.buttonDisabled,
              { transform: [{ scale: scaleAnimNo }] }
            ]}
          >
            <Text style={[
              styles.buttonText,
              selected === 'no' && styles.buttonTextActive,
              (disabled || (isSubmitted && selected !== 'no')) && styles.buttonTextDisabled,
            ]}>
              No
            </Text>
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleYesPress}
          activeOpacity={(disabled || isSubmitted) ? 0.3 : 1}
          disabled={disabled || isSubmitted}
        >
          <Animated.View
            style={[
              styles.button,
              selected === 'yes' && styles.buttonYes,
              (disabled || (isSubmitted && selected !== 'yes')) && styles.buttonDisabled,
              { transform: [{ scale: scaleAnimYes }] }
            ]}
          >
            <Text style={[
              styles.buttonText,
              selected === 'yes' && styles.buttonTextActive,
              (disabled || (isSubmitted && selected !== 'yes')) && styles.buttonTextDisabled,
            ]}>
              Yes
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>

      <TimePickerModal
        visible={showTimePicker}
        initialTime={currentTime}
        onClose={handleTimePickerClose}
        onSave={handleTimeSave}
      />
    </>
  );
}

export function ReminderCard({ title, monster, reminders, disabled = false, messageId }: ReminderCardProps) {
  const [reminderTimes, setReminderTimes] = useState<string[]>(
    reminders.map(r => r.time)
  );

  const handleTimeChange = (index: number, newTime: string) => {
    setReminderTimes(prev => {
      const updated = [...prev];
      updated[index] = newTime;
      return updated;
    });
  };

  return (
    <View style={styles.containerWrapper} collapsable={false}>
      {/* Liquid Glass Background */}
      <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
      
      {/* Border overlay */}
      <View style={styles.borderOverlay} />
      
      {/* Content */}
      <View style={styles.contentContainer} collapsable={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Image
            source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/poopcard/poopcard.png' }}
            style={styles.monsterAvatar}
            resizeMode="cover"
          />
        </View>

        {/* White Content Area */}
        <View style={styles.whiteContentArea}>
          <View style={styles.remindersList}>
            {reminders.map((reminder, index) => {
              // 生成唯一标识符：messageId + index
              const reminderId = messageId ? `${messageId}_${index}` : `reminder_${Date.now()}_${index}`;
              return (
                <ReminderItemRow
                  key={`${reminder.time}-${reminder.title}-${index}`}
                  time={reminderTimes[index]}
                  title={reminder.title}
                  task_type={reminder.task_type || 'meal'}
                  onTimeChange={(newTime) => handleTimeChange(index, newTime)}
                  disabled={disabled}
                  reminderId={reminderId}
                />
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'relative',
    borderRadius: 20,
    marginVertical: 8,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'ios' 
      ? 'rgba(233, 237, 240, 0.75)' 
      : 'rgba(233, 237, 240, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 16,
  },
  borderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#FFFFFF',
    pointerEvents: 'none',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 22,
    marginRight: 12,
    fontFamily: 'Nunito',
  },
  monsterAvatar: {
    width: 80,
    height: 80,
    marginTop: -16,
  },
  whiteContentArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: -40,
  },
  remindersList: {
    gap: 4,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  reminderInfo: {
    flex: 1,
    marginRight: 12,
  },
  reminderTextContent: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  editButton: {
    marginLeft: 6,
    padding: 2,
  },
  clockIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  reminderTitle: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    fontFamily: 'Nunito',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#E9EDF0',
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonYes: {
    backgroundColor: '#4CCB5E',
  },
  buttonNo: {
    backgroundColor: '#E55A5A',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    fontFamily: 'Nunito',
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
  buttonDisabled: {
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  buttonTextDisabled: {
    color: '#CCCCCC',
  },
});
