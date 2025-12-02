import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';

interface WeightPickerProps {
  initialWeight: number; // Weight value (e.g., 58.4)
  unit: 'kg' | 'lbs';
  onWeightChange: (weight: number) => void;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export function WeightPicker({
  initialWeight,
  unit,
  onWeightChange,
}: WeightPickerProps) {
  const integerScrollRef = useRef<ScrollView>(null);
  const decimalScrollRef = useRef<ScrollView>(null);
  const isScrollingRef = useRef(false);
  const isInitializingRef = useRef(false);
  const selectedIntegerRef = useRef(initialInteger);
  const selectedDecimalRef = useRef(initialDecimal);

  // Generate data arrays based on unit
  const minWeight = unit === 'kg' ? 30 : 66; // 30kg or 66lbs
  const maxWeight = unit === 'kg' ? 200 : 440; // 200kg or 440lbs
  
  const integers = Array.from({ length: maxWeight - minWeight + 1 }, (_, i) => minWeight + i);
  const decimals = Array.from({ length: 10 }, (_, i) => i); // 0-9 for .0 to .9

  // Split weight into integer and decimal parts
  const initialInteger = Math.floor(initialWeight);
  const initialDecimal = Math.round((initialWeight - initialInteger) * 10);

  const [selectedInteger, setSelectedInteger] = useState(initialInteger);
  const [selectedDecimal, setSelectedDecimal] = useState(initialDecimal);

  // Update selected values and scroll when initialWeight or unit changes
  useEffect(() => {
    const newInteger = Math.floor(initialWeight);
    const newDecimal = Math.round((initialWeight - newInteger) * 10);
    
    // Only update if values actually changed
    if (newInteger !== selectedInteger || newDecimal !== selectedDecimal) {
      isInitializingRef.current = true;
      setSelectedInteger(newInteger);
      setSelectedDecimal(newDecimal);
      selectedIntegerRef.current = newInteger;
      selectedDecimalRef.current = newDecimal;
      
      // Scroll to new position after a short delay
      setTimeout(() => {
        const integerIndex = integers.indexOf(newInteger);
        const decimalIndex = newDecimal;

        if (integerScrollRef.current && integerIndex >= 0) {
          integerScrollRef.current.scrollTo({ y: integerIndex * ITEM_HEIGHT, animated: false });
        }
        if (decimalScrollRef.current && decimalIndex >= 0) {
          decimalScrollRef.current.scrollTo({ y: decimalIndex * ITEM_HEIGHT, animated: false });
        }
        
        isInitializingRef.current = false;
      }, 50);
    }
  }, [initialWeight, unit]);

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    data: number[],
    setter: (value: number) => void,
    updateRef: (value: number) => void
  ) => {
    // Don't update during initialization or if already scrolling
    if (isInitializingRef.current || isScrollingRef.current) {
      return;
    }
    
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    const value = data[clampedIndex];
    
    // Only update state and ref, don't call onChange during scroll
    setter(value);
    updateRef(value);
  };

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    scrollRef: React.RefObject<ScrollView>,
    data: number[],
    setter: (value: number) => void,
    updateRef: (value: number) => void,
    isInteger: boolean
  ) => {
    isScrollingRef.current = false;
    
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    const value = data[clampedIndex];
    
    setter(value);
    updateRef(value);
    
    scrollRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true,
    });
    
    // Calculate and notify weight change using ref values (always up-to-date)
    if (isInteger) {
      const weight = value + selectedDecimalRef.current / 10;
      onWeightChange(weight);
    } else {
      const weight = selectedIntegerRef.current + value / 10;
      onWeightChange(weight);
    }
  };

  const renderColumn = (
    data: number[],
    selectedValue: number,
    scrollRef: React.RefObject<ScrollView>,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    isInteger: boolean = true
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
          
          return (
            <View key={index} style={styles.item}>
              <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                {String(value)}
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
        {/* Integer column */}
        {renderColumn(
          integers,
          selectedInteger,
          integerScrollRef,
          (e) => handleScroll(e, integers, setSelectedInteger, (v) => { selectedIntegerRef.current = v; }),
          (e) => {
            isScrollingRef.current = true;
            handleScrollEnd(e, integerScrollRef, integers, setSelectedInteger, (v) => { selectedIntegerRef.current = v; }, true);
          },
          true
        )}

        {/* Decimal point */}
        <Text style={styles.separator}>.</Text>

        {/* Decimal column */}
        {renderColumn(
          decimals,
          selectedDecimal,
          decimalScrollRef,
          (e) => handleScroll(e, decimals, setSelectedDecimal, (v) => { selectedDecimalRef.current = v; }),
          (e) => {
            isScrollingRef.current = true;
            handleScrollEnd(e, decimalScrollRef, decimals, setSelectedDecimal, (v) => { selectedDecimalRef.current = v; }, false);
          },
          false
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
    width: 80,
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
    marginHorizontal: 4,
    fontFamily: 'Nunito',
  },
});

