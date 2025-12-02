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
  const isScrollingRef = useRef(false);
  const isInitializingRef = useRef(false);
  const selectedFeetRef = useRef(0);
  const selectedInchesRef = useRef(0);
  const selectedCmRef = useRef(0);

  // Initialize based on unit
  const initialFeetInches = cmToFeet(initialHeight);
  
  const [selectedFeet, setSelectedFeet] = useState(initialFeetInches.feet);
  const [selectedInches, setSelectedInches] = useState(initialFeetInches.inches);
  const [selectedCm, setSelectedCm] = useState(initialHeight);
  
  // Initialize refs
  selectedFeetRef.current = initialFeetInches.feet;
  selectedInchesRef.current = initialFeetInches.inches;
  selectedCmRef.current = initialHeight;

  // Generate data arrays
  const feet = Array.from({ length: 5 }, (_, i) => i + 4); // 4-8 feet
  const inches = Array.from({ length: 12 }, (_, i) => i); // 0-11 inches
  const centimeters = Array.from({ length: 171 }, (_, i) => i + 100); // 100-270 cm

  // Update selected values when initialHeight or unit changes
  useEffect(() => {
    if (unit === 'ft') {
      // Convert cm to feet/inches
      const feetInches = cmToFeet(initialHeight);
      if (feetInches.feet !== selectedFeet || feetInches.inches !== selectedInches) {
        isInitializingRef.current = true;
        setSelectedFeet(feetInches.feet);
        setSelectedInches(feetInches.inches);
        selectedFeetRef.current = feetInches.feet;
        selectedInchesRef.current = feetInches.inches;
        
        // Scroll to new position after a short delay
        setTimeout(() => {
          const feetIndex = feet.indexOf(feetInches.feet);
          const inchesIndex = feetInches.inches;

          if (feetScrollRef.current && feetIndex >= 0) {
            feetScrollRef.current.scrollTo({ y: feetIndex * ITEM_HEIGHT, animated: false });
          }
          if (inchesScrollRef.current && inchesIndex >= 0) {
            inchesScrollRef.current.scrollTo({ y: inchesIndex * ITEM_HEIGHT, animated: false });
          }
          
          isInitializingRef.current = false;
        }, 50);
      }
    } else {
      // Use cm directly, round to nearest integer since centimeters array contains integers
      const roundedCm = Math.round(initialHeight);
      if (roundedCm !== selectedCm) {
        isInitializingRef.current = true;
        setSelectedCm(roundedCm);
        selectedCmRef.current = roundedCm;
        
        // Scroll to new position after a short delay
        setTimeout(() => {
          const cmIndex = centimeters.indexOf(roundedCm);
          if (cmScrollRef.current && cmIndex >= 0) {
            cmScrollRef.current.scrollTo({ y: cmIndex * ITEM_HEIGHT, animated: false });
          }
          
          isInitializingRef.current = false;
        }, 50);
      }
    }
  }, [initialHeight, unit]);

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
    onChange: (value: number) => void
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
    
    // Call onChange after a short delay to ensure state is updated
    setTimeout(() => {
      onChange(value);
    }, 50);
  };

  const handleFeetChange = (value: number) => {
    // Use ref value for inches to ensure we have the latest value
    const cm = feetToCm(value, selectedInchesRef.current);
    onHeightChange(cm);
  };

  const handleInchesChange = (value: number) => {
    // Use ref value for feet to ensure we have the latest value
    const cm = feetToCm(selectedFeetRef.current, value);
    onHeightChange(cm);
  };

  const handleCmChange = (value: number) => {
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
            (e) => handleScroll(e, centimeters, setSelectedCm, (v) => { selectedCmRef.current = v; }),
            (e) => {
              isScrollingRef.current = true;
              handleScrollEnd(e, cmScrollRef, centimeters, setSelectedCm, (v) => { selectedCmRef.current = v; }, handleCmChange);
            },
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
          (e) => handleScroll(e, feet, setSelectedFeet, (v) => { selectedFeetRef.current = v; }),
          (e) => {
            isScrollingRef.current = true;
            handleScrollEnd(e, feetScrollRef, feet, setSelectedFeet, (v) => { selectedFeetRef.current = v; }, handleFeetChange);
          },
          ' ft'
        )}

        {/* Inches column */}
        {renderColumn(
          inches,
          selectedInches,
          inchesScrollRef,
          (e) => handleScroll(e, inches, setSelectedInches, (v) => { selectedInchesRef.current = v; }),
          (e) => {
            isScrollingRef.current = true;
            handleScrollEnd(e, inchesScrollRef, inches, setSelectedInches, (v) => { selectedInchesRef.current = v; }, handleInchesChange);
          },
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


