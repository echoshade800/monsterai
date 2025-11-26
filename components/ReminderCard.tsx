import { BlurView } from 'expo-blur';
import { Edit2 } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TimePickerModal } from './TimePickerModal';

interface ReminderItem {
  time: string;
  title: string;
}

interface ReminderCardProps {
  title: string;
  monster: string;
  reminders: ReminderItem[];
}

interface ReminderItemRowProps {
  time: string;
  title: string;
  onTimeChange: (newTime: string) => void;
}

function ReminderItemRow({ time, title, onTimeChange }: ReminderItemRowProps) {
  const [selected, setSelected] = useState<'yes' | 'no' | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentTime, setCurrentTime] = useState(time);
  const scaleAnimYes = useRef(new Animated.Value(1)).current;
  const scaleAnimNo = useRef(new Animated.Value(1)).current;

  const handleYesPress = () => {
    setSelected('yes');
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
  };

  const handleNoPress = () => {
    setSelected('no');
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
  };

  const handleEditPress = () => {
    setShowTimePicker(true);
  };

  const handleTimeSave = (newTime: string) => {
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
                activeOpacity={0.7}
              >
                <Edit2 size={14} color="#999999" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Text style={styles.reminderTitle}>{title}</Text>
          </View>
        </View>
        <View style={styles.buttonGroup}>
        <TouchableOpacity
          onPress={handleNoPress}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.button,
              selected === 'no' && styles.buttonNo,
              { transform: [{ scale: scaleAnimNo }] }
            ]}
          >
            <Text style={[
              styles.buttonText,
              selected === 'no' && styles.buttonTextActive,
            ]}>
              No
            </Text>
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleYesPress}
          activeOpacity={1}
        >
          <Animated.View
            style={[
              styles.button,
              selected === 'yes' && styles.buttonYes,
              { transform: [{ scale: scaleAnimYes }] }
            ]}
          >
            <Text style={[
              styles.buttonText,
              selected === 'yes' && styles.buttonTextActive,
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

export function ReminderCard({ title, monster, reminders }: ReminderCardProps) {
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
    <View style={styles.containerWrapper}>
      {/* Liquid Glass Background */}
      <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
      
      {/* Border overlay */}
      <View style={styles.borderOverlay} />
      
      {/* Content */}
      <View style={styles.contentContainer}>
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
            {reminders.map((reminder, index) => (
              <ReminderItemRow
                key={index}
                time={reminderTimes[index]}
                title={reminder.title}
                onTimeChange={(newTime) => handleTimeChange(index, newTime)}
              />
            ))}
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
});
