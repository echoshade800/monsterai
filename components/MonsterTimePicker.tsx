import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';

interface MonsterTimePickerProps {
  initialHour: number;      // 1-12
  initialMinute: number;    // 0-59
  initialPeriod: 'AM' | 'PM';
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  onPeriodChange: (period: 'AM' | 'PM') => void;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export function MonsterTimePicker({
  initialHour,
  initialMinute,
  initialPeriod,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
}: MonsterTimePickerProps) {
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const periodScrollRef = useRef<ScrollView>(null);

  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);

  // Generate data arrays
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods: ('AM' | 'PM')[] = ['AM', 'PM'];

  // Scroll to initial position on mount
  useEffect(() => {
    setTimeout(() => {
      const hourIndex = hours.indexOf(initialHour);
      const minuteIndex = minutes.indexOf(initialMinute);
      const periodIndex = periods.indexOf(initialPeriod);

      if (hourScrollRef.current && hourIndex >= 0) {
        hourScrollRef.current.scrollTo({ y: hourIndex * ITEM_HEIGHT, animated: false });
      }
      if (minuteScrollRef.current && minuteIndex >= 0) {
        minuteScrollRef.current.scrollTo({ y: minuteIndex * ITEM_HEIGHT, animated: false });
      }
      if (periodScrollRef.current && periodIndex >= 0) {
        periodScrollRef.current.scrollTo({ y: periodIndex * ITEM_HEIGHT, animated: false });
      }
    }, 100);
  }, []);

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    data: number[],
    setter: (value: any) => void,
    callback: (value: any) => void
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    const value = data[clampedIndex];
    
    setter(value);
    callback(value);
  };

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    scrollRef: React.RefObject<ScrollView>,
    data: number[] | ('AM' | 'PM')[]
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    
    scrollRef.current?.scrollTo({ y: clampedIndex * ITEM_HEIGHT, animated: true });
  };

  const renderColumn = (
    data: (number | 'AM' | 'PM')[],
    selectedValue: number | 'AM' | 'PM',
    scrollRef: React.RefObject<ScrollView>,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    formatValue?: (value: number | string) => string
  ) => {
    return (
      <ScrollView
        ref={scrollRef}
        style={styles.column}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScroll={onScroll}
        onMomentumScrollEnd={onScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top padding */}
        <View style={{ height: ITEM_HEIGHT * 2 }} />
        
        {data.map((value, index) => {
          const isSelected = value === selectedValue;
          const displayValue = formatValue ? formatValue(value) : String(value);
          
          return (
            <View key={index} style={styles.item}>
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                {displayValue}
              </Text>
            </View>
          );
        })}
        
        {/* Bottom padding */}
        <View style={{ height: ITEM_HEIGHT * 2 }} />
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Selection indicator */}
      <View style={styles.selectionIndicator} />
      
      <View style={styles.columnsContainer}>
        {/* Hour column */}
        {renderColumn(
          hours,
          selectedHour,
          hourScrollRef,
          (e) => handleScroll(e, hours, setSelectedHour, onHourChange),
          (e) => handleScrollEnd(e, hourScrollRef, hours)
        )}

        {/* Separator */}
        <Text style={styles.separator}>:</Text>

        {/* Minute column */}
        {renderColumn(
          minutes,
          selectedMinute,
          minuteScrollRef,
          (e) => handleScroll(e, minutes, setSelectedMinute, onMinuteChange),
          (e) => handleScrollEnd(e, minuteScrollRef, minutes),
          (value) => String(value).padStart(2, '0')
        )}

        {/* Period column */}
        {renderColumn(
          periods,
          selectedPeriod,
          periodScrollRef,
          (e) => handleScroll(e, periods as any, setSelectedPeriod, onPeriodChange),
          (e) => handleScrollEnd(e, periodScrollRef, periods)
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicator: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  columnsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: CONTAINER_HEIGHT,
  },
  column: {
    width: 70,
    height: CONTAINER_HEIGHT,
  },
  scrollContent: {
    paddingVertical: 0,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 18,
    color: '#CCCCCC',
    fontWeight: '400',
    fontFamily: 'Nunito',
  },
  itemTextSelected: {
    fontSize: 20,
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'Nunito',
  },
  separator: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '600',
    marginHorizontal: 8,
    fontFamily: 'Nunito',
  },
});

