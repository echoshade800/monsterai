import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';

interface MonsterTimePickerProps {
  initialHour: number;      // 0-23 (24-hour format)
  initialMinute: number;    // 0-59
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export function MonsterTimePicker({
  initialHour,
  initialMinute,
  onHourChange,
  onMinuteChange,
}: MonsterTimePickerProps) {
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);

  // Generate data arrays - 24 hour format
  const hours = Array.from({ length: 24 }, (_, i) => i); // 0-23
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // Update state when initialHour/initialMinute change (only if different)
  useEffect(() => {
    setSelectedHour((prev) => prev !== initialHour ? initialHour : prev);
    setSelectedMinute((prev) => prev !== initialMinute ? initialMinute : prev);
  }, [initialHour, initialMinute]);

  // Scroll to initial position on mount and when initialHour/initialMinute change
  useEffect(() => {
    setTimeout(() => {
      const hourIndex = initialHour; // 0-23, directly use as index
      const minuteIndex = initialMinute;

      if (hourScrollRef.current && hourIndex >= 0 && hourIndex < 24) {
        hourScrollRef.current.scrollTo({ y: hourIndex * ITEM_HEIGHT, animated: false });
      }
      if (minuteScrollRef.current && minuteIndex >= 0 && minuteIndex < 60) {
        minuteScrollRef.current.scrollTo({ y: minuteIndex * ITEM_HEIGHT, animated: false });
      }
    }, 100);
  }, [initialHour, initialMinute]);

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    data: number[],
    setter: (value: any) => void
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    const value = data[clampedIndex];
    
    // 只在值真正改变时才更新状态，避免频繁更新导致闪烁
    // 滚动过程中不调用回调，只在滚动结束时调用（在 handleScrollEnd 中）
    setter((prev: any) => {
      return prev !== value ? value : prev;
    });
  };

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    scrollRef: React.RefObject<ScrollView>,
    data: number[] | ('AM' | 'PM')[],
    callback: (value: any) => void
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    const value = data[clampedIndex];
    
    scrollRef.current?.scrollTo({ y: clampedIndex * ITEM_HEIGHT, animated: true });
    
    // 滚动结束时才调用回调，避免频繁更新
    callback(value);
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
        scrollEventThrottle={100}
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
          (e) => handleScroll(e, hours, setSelectedHour),
          (e) => handleScrollEnd(e, hourScrollRef, hours, onHourChange),
          (value) => String(value).padStart(2, '0')
        )}

        {/* Separator */}
        <Text style={styles.separator}>:</Text>

        {/* Minute column */}
        {renderColumn(
          minutes,
          selectedMinute,
          minuteScrollRef,
          (e) => handleScroll(e, minutes, setSelectedMinute),
          (e) => handleScrollEnd(e, minuteScrollRef, minutes, onMinuteChange),
          (value) => String(value).padStart(2, '0')
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

