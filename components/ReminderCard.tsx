import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

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
}

function ReminderItemRow({ time, title }: ReminderItemRowProps) {
  const [selected, setSelected] = useState<'yes' | 'no' | null>(null);

  const handleYesPress = () => {
    setSelected(selected === 'yes' ? null : 'yes');
  };

  const handleNoPress = () => {
    setSelected(selected === 'no' ? null : 'no');
  };

  return (
    <View style={styles.reminderItem}>
      <View style={styles.reminderInfo}>
        <Text style={styles.clockIcon}>⏰</Text>
        <Text style={styles.timeText}>{time}</Text>
        <Text style={styles.reminderTitle}>{title}</Text>
      </View>
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={[
            styles.button,
            selected === 'no' && styles.buttonNo,
          ]}
          onPress={handleNoPress}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.buttonText,
            selected === 'no' && styles.buttonTextActive,
          ]}>
            No
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            selected === 'yes' && styles.buttonYes,
          ]}
          onPress={handleYesPress}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.buttonText,
            selected === 'yes' && styles.buttonTextActive,
          ]}>
            Yes
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ReminderCard({ title, monster, reminders }: ReminderCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.monsterIcon}>
          <Text style={styles.monsterEmoji}>💩</Text>
        </View>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <View style={styles.remindersList}>
        {reminders.map((reminder, index) => (
          <ReminderItemRow
            key={index}
            time={reminder.time}
            title={reminder.title}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  monsterIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  monsterEmoji: {
    fontSize: 24,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 22,
  },
  remindersList: {
    gap: 12,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  clockIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginRight: 8,
  },
  reminderTitle: {
    fontSize: 15,
    color: '#666666',
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 50,
    alignItems: 'center',
  },
  buttonYes: {
    backgroundColor: '#4CCB5E',
    borderColor: '#4CCB5E',
  },
  buttonNo: {
    backgroundColor: '#E55A5A',
    borderColor: '#E55A5A',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
});
