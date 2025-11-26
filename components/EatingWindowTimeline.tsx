import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type EatingSlot = {
  start: Date;
  end: Date;
};

type EatingWindowTimelineProps = {
  eatingWindowStart: Date;
  eatingWindowEnd: Date;
  lunchTime: Date;
  dinnerTime: Date;
  eatingSlots: EatingSlot[];
};

export function EatingWindowTimeline({
  eatingWindowStart,
  eatingWindowEnd,
  lunchTime,
  dinnerTime,
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

  // Calculate positions for alarm icons
  const alarmPositions = [
    { time: eatingWindowStart, label: 'Start', ratio: 0, icon: '🔔' },
    { time: lunchTime, label: 'Lunch', ratio: getPositionRatio(lunchTime), icon: '⏰' },
    { time: dinnerTime, label: 'Dinner', ratio: getPositionRatio(dinnerTime), icon: '⏰' },
    { time: eatingWindowEnd, label: 'End', ratio: 1, icon: '🔔' },
  ];

  console.log('Eating Window Timeline Data:', {
    windowStart: formatTime(eatingWindowStart),
    windowEnd: formatTime(eatingWindowEnd),
    lunchTime: formatTime(lunchTime),
    dinnerTime: formatTime(dinnerTime),
    alarmPositions: alarmPositions.map(a => ({
      label: a.label,
      time: formatTime(a.time),
      ratio: a.ratio,
    })),
  });

  return (
    <View style={styles.container}>
      {/* Alarm Icons Row */}
      <View style={styles.alarmsContainer}>
        {alarmPositions.map((alarm, index) => (
          <View
            key={index}
            style={[
              styles.alarmIconWrapper,
              { left: `${alarm.ratio * 100}%` },
            ]}
          >
            <Text style={styles.alarmIcon}>{alarm.icon}</Text>
          </View>
        ))}
      </View>

      {/* Timeline Track */}
      <View style={styles.timelineTrack}>
        {/* Base track (light gray) */}
        <View style={styles.baseTrack} />

        {/* Orange eating slots */}
        {eatingSlots.map((slot, index) => {
          const startRatio = getPositionRatio(slot.start);
          const endRatio = getPositionRatio(slot.end);
          const width = (endRatio - startRatio) * 100;

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
      </View>

      {/* Time Labels */}
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
    marginBottom: 8,
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

