import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type EatingSlot = {
  start: Date;
  end: Date;
};

type ReminderItem = {
  id: string;
  name: string;
  time: string;
  enabled: boolean;
};

type EatingWindowTimelineProps = {
  eatingWindowStart: Date;
  eatingWindowEnd: Date;
  reminders: ReminderItem[];
  eatingSlots: EatingSlot[];
};

export function EatingWindowTimeline({
  eatingWindowStart,
  eatingWindowEnd,
  reminders,
  eatingSlots,
}: EatingWindowTimelineProps) {
  // Calculate total duration in milliseconds
  const totalDuration = eatingWindowEnd.getTime() - eatingWindowStart.getTime();

  // Helper function to calculate position ratio (0-1) for a given time
  const getPositionRatio = (time: Date): number => {
    const elapsed = time.getTime() - eatingWindowStart.getTime();
    return Math.max(0, Math.min(1, elapsed / totalDuration));
  };

  // Format time to HH:MM
  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  // Parse time string like "13:00" to Date
  const parseTimeString = (timeStr: string): Date => {
    const match = timeStr.match(/(\d+):(\d+)/);
    if (match) {
      const hour = parseInt(match[1], 10);
      const minute = parseInt(match[2], 10);
      const date = new Date();
      date.setHours(hour, minute, 0, 0);
      return date;
    }
    return new Date();
  };

  // Get current time and calculate its position on the timeline
  const getCurrentTimePosition = (): number | null => {
    const now = new Date();
    const nowTime = now.getTime();
    const windowStartTime = eatingWindowStart.getTime();
    const windowEndTime = eatingWindowEnd.getTime();

    // If current time is outside the eating window, clamp it
    if (nowTime < windowStartTime) {
      return 0; // Clamp to start
    }
    if (nowTime > windowEndTime) {
      return 1; // Clamp to end
    }

    // Calculate ratio within the window
    return getPositionRatio(now);
  };

  // Filter reminders to only show Breakfast, Lunch, Dinner (exclude Eating Window)
  const mealReminders = reminders.filter(
    r => r.name !== 'Eating Window' && r.enabled && r.time !== 'OFF'
  );

  // Calculate positions for reminder alarm icons
  const alarmPositions = mealReminders.map((reminder) => {
    const reminderTime = parseTimeString(reminder.time);
    const ratio = getPositionRatio(reminderTime);

    return {
      reminder,
      time: reminderTime,
      ratio,
      icon: '⏰', // All reminders use the same icon
    };
  });

  const currentTimeRatio = getCurrentTimePosition();

  return (
    <View style={styles.container}>
      {/* Alarm Icons Row - Only show reminders, not window boundaries */}
      {alarmPositions.length > 0 && (
        <View style={styles.alarmsContainer}>
          {alarmPositions.map((alarm, index) => (
            <View
              key={alarm.reminder.id}
              style={[
                styles.alarmIconWrapper,
                { left: `${alarm.ratio * 100}%` },
              ]}
            >
              <Text style={styles.alarmIcon}>{alarm.icon}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Timeline Track */}
      <View style={styles.timelineTrack}>
        {/* Base track (light gray) - represents full eating window */}
        <View style={styles.baseTrack} />

        {/* Orange eating slots - 2h after each meal reminder */}
        {eatingSlots.map((slot, index) => {
          const startRatio = getPositionRatio(slot.start);
          const endRatio = getPositionRatio(slot.end);
          const width = Math.max(0, (endRatio - startRatio) * 100);

          return (
            <View
              key={index}
              style={[
                styles.eatingSlot,
                {
                  left: `${startRatio * 100}%`,
                  width: `${width}%`,
                },
              ]}
            />
          );
        })}

        {/* Current time indicator - stickman image */}
        {currentTimeRatio !== null && (
          <Image
            source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/user/stickman.png' }}
            style={[
              styles.currentTimeIndicator,
              { left: `${currentTimeRatio * 100}%` },
            ]}
            resizeMode="contain"
          />
        )}
      </View>

      {/* Time Labels - Match Eating Window start/end */}
      <View style={styles.timeLabelsContainer}>
        <Text style={styles.timeLabel}>{formatTime(eatingWindowStart)}</Text>
        <Text style={styles.timeLabel}>{formatTime(eatingWindowEnd)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  alarmsContainer: {
    position: 'relative',
    height: 24,
    marginBottom: 2,
  },
  alarmIconWrapper: {
    position: 'absolute',
    top: 0,
    transform: [{ translateX: -7 }], // Center the icon (half of 14px)
    alignItems: 'center',
  },
  alarmIcon: {
    fontSize: 14,
  },
  timelineTrack: {
    position: 'relative',
    height: 10,
    marginBottom: 8,
  },
  baseTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#E9EDF0',
    borderRadius: 5,
  },
  eatingSlot: {
    position: 'absolute',
    height: 10,
    backgroundColor: '#FF9F66',
    borderRadius: 5,
  },
  currentTimeIndicator: {
    position: 'absolute',
    width: 36,
    height: 36,
    top: -13, // Position above the track to center it (track is 10px, so -13px centers 36px image)
    transform: [{ translateX: -18 }], // Center horizontally (half of 36px)
    zIndex: 10,
  },
  timeLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Nunito',
  },
});
