import { X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WeightPicker } from './WeightPicker';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = 500;

type WeightUnit = 'kg' | 'lbs';

interface WeightPickerModalProps {
  visible: boolean;
  initialWeight: number | null; // Weight in kg, null if empty
  initialUnit?: 'kg' | 'lbs'; // Initial unit preference
  onClose: () => void;
  onSave: (weight: number, unit: 'kg' | 'lbs') => void;
}

// Conversion functions
const kgToLbs = (kg: number) => kg * 2.20462;
const lbsToKg = (lbs: number) => lbs / 2.20462;

// Helper function to get valid weight
const getValidWeight = (weight: number | null): number => {
  if (weight === null || isNaN(weight) || weight <= 0) {
    return 60; // Default weight
  }
  return weight;
};

export function WeightPickerModal({ visible, initialWeight, initialUnit, onClose, onSave }: WeightPickerModalProps) {
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [weightInKg, setWeightInKg] = useState(getValidWeight(initialWeight));

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Reset weight when modal opens
  useEffect(() => {
    if (visible) {
      const weight = getValidWeight(initialWeight);
      setWeightInKg(weight);
      // Use initialUnit if provided, otherwise default based on weight
      if (initialUnit) {
        setUnit(initialUnit);
      } else if (initialWeight === null || isNaN(initialWeight as number)) {
        setUnit('lbs');
      } else {
        setUnit('kg');
      }
    }
  }, [initialWeight, initialUnit, visible]);

  // Safety check: ensure weightInKg is always valid
  useEffect(() => {
    if (isNaN(weightInKg) || weightInKg <= 0) {
      console.warn('weightInKg became invalid, resetting to default:', weightInKg);
      setWeightInKg(60); // Reset to default
    }
  }, [weightInKg]);

  // Animation effect
  useEffect(() => {
    if (visible) {
      // Opening animation
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Closing animation
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: SHEET_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleSave = () => {
    // Get current weightInKg value (may have changed)
    const currentWeightInKg = weightInKg;
    
    // Validate weightInKg before saving
    if (isNaN(currentWeightInKg) || currentWeightInKg <= 0 || !isFinite(currentWeightInKg)) {
      console.error('Invalid weightInKg:', currentWeightInKg);
      // Try to get a valid weight from getCurrentWeight
      const currentWeight = getCurrentWeight();
      if (!isNaN(currentWeight) && currentWeight > 0 && isFinite(currentWeight)) {
        // If currentWeight is valid, use it to recalculate weightInKg
        const recalculatedWeightInKg = unit === 'kg' ? currentWeight : lbsToKg(currentWeight);
        if (!isNaN(recalculatedWeightInKg) && recalculatedWeightInKg > 0 && isFinite(recalculatedWeightInKg)) {
          const weightToSave = unit === 'kg' ? recalculatedWeightInKg : kgToLbs(recalculatedWeightInKg);
          if (!isNaN(weightToSave) && weightToSave > 0 && isFinite(weightToSave)) {
            onSave(weightToSave, unit);
            return;
          }
        }
      }
      console.error('Cannot save: weightInKg is invalid and cannot be recovered');
      return;
    }

    // If user selected lbs, convert from kg to lbs for storage
    // If user selected kg, use kg value directly
    const weightToSave = unit === 'kg' ? currentWeightInKg : kgToLbs(currentWeightInKg);
    
    // Validate converted value
    if (isNaN(weightToSave) || weightToSave <= 0 || !isFinite(weightToSave)) {
      console.error('Invalid weightToSave:', weightToSave, 'unit:', unit, 'weightInKg:', currentWeightInKg);
      return;
    }
    
    onSave(weightToSave, unit);
  };

  const handleWeightChange = (weight: number) => {
    // Validate weight before processing
    if (isNaN(weight) || weight <= 0 || !isFinite(weight)) {
      console.error('Invalid weight in handleWeightChange:', weight);
      return;
    }

    if (unit === 'kg') {
      // Ensure the weight is within reasonable bounds
      if (weight >= 30 && weight <= 200) {
        setWeightInKg(weight);
      }
    } else {
      // Convert lbs to kg
      const weightInKgValue = lbsToKg(weight);
      if (isNaN(weightInKgValue) || weightInKgValue <= 0 || !isFinite(weightInKgValue)) {
        console.error('Invalid weightInKgValue after conversion:', weightInKgValue, 'from weight:', weight);
        return;
      }
      // Ensure the converted weight is within reasonable bounds
      if (weightInKgValue >= 30 && weightInKgValue <= 200) {
        setWeightInKg(weightInKgValue);
      }
    }
  };

  const handleUnitToggle = (newUnit: WeightUnit) => {
    setUnit(newUnit);
  };

  const getCurrentWeight = () => {
    // Ensure weightInKg is valid
    const validWeightInKg = isNaN(weightInKg) || weightInKg <= 0 || !isFinite(weightInKg) ? 60 : weightInKg;
    const weight = unit === 'kg' ? validWeightInKg : kgToLbs(validWeightInKg);
    // Ensure the converted weight is also valid
    if (isNaN(weight) || weight <= 0 || !isFinite(weight)) {
      return unit === 'kg' ? 60 : 132; // Default fallback
    }
    return weight;
  };

  const getCurrentWeightDisplay = () => {
    const weight = getCurrentWeight();
    return `${weight.toFixed(1)} ${unit}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Background overlay - fade in/out */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropOpacity,
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
          />
        </Animated.View>

        {/* Bottom sheet - slide up/down */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: sheetTranslateY }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Edit weight</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666666" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Unit Toggle (lbs / kg) */}
          <View style={styles.unitToggleContainer}>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'lbs' && styles.unitButtonActive]}
              onPress={() => handleUnitToggle('lbs')}
              activeOpacity={0.7}
            >
              <Text style={[styles.unitButtonText, unit === 'lbs' && styles.unitButtonTextActive]}>
                lbs
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'kg' && styles.unitButtonActive]}
              onPress={() => handleUnitToggle('kg')}
              activeOpacity={0.7}
            >
              <Text style={[styles.unitButtonText, unit === 'kg' && styles.unitButtonTextActive]}>
                kg
              </Text>
            </TouchableOpacity>
          </View>

          {/* Current Weight Display */}
          <Text style={styles.currentWeight}>
            Current weight: {getCurrentWeightDisplay()}
          </Text>

          {/* Weight Picker */}
          <WeightPicker
            initialWeight={getCurrentWeight()}
            unit={unit}
            onWeightChange={handleWeightChange}
          />

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Nunito',
  },
  closeButton: {
    padding: 4,
    position: 'absolute',
    right: 0,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999999',
    fontFamily: 'Nunito',
  },
  unitButtonTextActive: {
    color: '#000000',
  },
  currentWeight: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Nunito',
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Nunito',
  },
});

