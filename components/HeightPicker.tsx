import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, View } from 'react-native';

interface HeightPickerProps {
  initialHeight: number; // Height in cm
  unit: 'cm' | 'ft';
  onHeightChange: (height: number) => void; // Always returns cm
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// Conversion functions
const cmToFeet = (cm: number) => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

const feetToCm = (feet: number, inches: number) => {
  return Math.round((feet * 12 + inches) * 2.54);
};

export function HeightPicker({
  initialHeight,
  unit,
  onHeightChange,
}: HeightPickerProps) {
  const feetScrollRef = useRef<ScrollView>(null);
  const inchesScrollRef = useRef<ScrollView>(null);
  const cmScrollRef = useRef<ScrollView>(null);

  // Initialize based on unit
  const initialFeetInches = cmToFeet(initialHeight);
  
  const [selectedFeet, setSelectedFeet] = useState(initialFeetInches.feet);
  const [selectedInches, setSelectedInches] = useState(initialFeetInches.inches);
  const [selectedCm, setSelectedCm] = useState(initialHeight);

  // Generate data arrays
  const feet = Array.from({ length: 5 }, (_, i) => i + 4); // 4-8 feet
  const inches = Array.from({ length: 12 }, (_, i) => i); // 0-11 inches
  const centimeters = Array.from({ length: 171 }, (_, i) => i + 100); // 100-270 cm

  // Scroll to initial position when unit changes
  useEffect(() => {
    setTimeout(() => {
      if (unit === 'ft') {
        const feetIndex = feet.indexOf(selectedFeet);
        const inchesIndex = selectedInches;

        if (feetScrollRef.current && feetIndex >= 0) {
          feetScrollRef.current.scrollTo({ y: feetIndex * ITEM_HEIGHT, animated: false });
        }
        if (inchesScrollRef.current && inchesIndex >= 0) {
          inchesScrollRef.current.scrollTo({ y: inchesIndex * ITEM_HEIGHT, animated: false });
        }
      } else {
        const cmIndex = centimeters.indexOf(selectedCm);
        if (cmScrollRef.current && cmIndex >= 0) {
          cmScrollRef.current.scrollTo({ y: cmIndex * ITEM_HEIGHT, animated: false });
        }
      }
    }, 100);
  }, [unit]);

  const handleScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    data: number[],
    setter: (value: number) => void,
    onChange: (value: number) => void
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    const value = data[clampedIndex];
    setter(value);
    onChange(value);
  };

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
    scrollRef: React.RefObject<ScrollView>,
    data: number[]
  ) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
    
    scrollRef.current?.scrollTo({
      y: clampedIndex * ITEM_HEIGHT,
      animated: true,
    });
  };

  const handleFeetChange = (value: number) => {
    setSelectedFeet(value);
    const cm = feetToCm(value, selectedInches);
    onHeightChange(cm);
  };

  const handleInchesChange = (value: number) => {
    setSelectedInches(value);
    const cm = feetToCm(selectedFeet, value);
    onHeightChange(cm);
  };

  const handleCmChange = (value: number) => {
    setSelectedCm(value);
    onHeightChange(value);
  };

  const renderColumn = (
    data: number[],
    selectedValue: number,
    scrollRef: React.RefObject<ScrollView>,
    onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    onScrollEnd: (event: NativeSyntheticEvent<NativeScrollEvent>) => void,
    suffix?: string
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
          const displayValue = suffix ? `${value}${suffix}` : String(value);
          
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

  if (unit === 'cm') {
    return (
      <View style={styles.container}>
        {/* Selection indicator */}
        <View style={styles.selectionIndicator} />
        
        <View style={styles.columnsContainer}>
          {/* CM column */}
          {renderColumn(
            centimeters,
            selectedCm,
            cmScrollRef,
            (e) => handleScroll(e, centimeters, setSelectedCm, handleCmChange),
            (e) => handleScrollEnd(e, cmScrollRef, centimeters),
            ' cm'
          )}
        </View>
      </View>
    );
  }

  // Feet/Inches mode
  return (
    <View style={styles.container}>
      {/* Selection indicator */}
      <View style={styles.selectionIndicator} />
      
      <View style={styles.columnsContainer}>
        {/* Feet column */}
        {renderColumn(
          feet,
          selectedFeet,
          feetScrollRef,
          (e) => handleScroll(e, feet, setSelectedFeet, handleFeetChange),
          (e) => handleScrollEnd(e, feetScrollRef, feet),
          ' ft'
        )}

        {/* Inches column */}
        {renderColumn(
          inches,
          selectedInches,
          inchesScrollRef,
          (e) => handleScroll(e, inches, setSelectedInches, handleInchesChange),
          (e) => handleScrollEnd(e, inchesScrollRef, inches),
          ' in'
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
    gap: 20,
  },
  column: {
    width: 100,
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
});

