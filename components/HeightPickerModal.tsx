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
import { HeightPicker } from './HeightPicker';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = 500;

type HeightUnit = 'cm' | 'ft';

interface HeightPickerModalProps {
  visible: boolean;
  initialHeight: number; // Height in cm
  onClose: () => void;
  onSave: (height: number) => void;
}

// Conversion functions
const cmToFeet = (cm: number) => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

export function HeightPickerModal({ visible, initialHeight, onClose, onSave }: HeightPickerModalProps) {
  const [unit, setUnit] = useState<HeightUnit>('cm');
  const [heightInCm, setHeightInCm] = useState(initialHeight);

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Reset height when modal opens
  useEffect(() => {
    if (visible) {
      setHeightInCm(initialHeight);
      setUnit('cm');
    }
  }, [initialHeight, visible]);

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
    onSave(heightInCm);
  };

  const handleHeightChange = (height: number) => {
    setHeightInCm(height);
  };

  const handleUnitToggle = (newUnit: HeightUnit) => {
    setUnit(newUnit);
  };

  const getCurrentHeight = () => {
    return heightInCm;
  };

  const getCurrentHeightDisplay = () => {
    if (unit === 'cm') {
      return `${heightInCm} cm`;
    } else {
      const { feet, inches } = cmToFeet(heightInCm);
      return `${feet}' ${inches}"`;
    }
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
            <Text style={styles.title}>Edit height</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666666" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Unit Toggle (cm / ft) */}
          <View style={styles.unitToggleContainer}>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'ft' && styles.unitButtonActive]}
              onPress={() => handleUnitToggle('ft')}
              activeOpacity={0.7}
            >
              <Text style={[styles.unitButtonText, unit === 'ft' && styles.unitButtonTextActive]}>
                feet / inches
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'cm' && styles.unitButtonActive]}
              onPress={() => handleUnitToggle('cm')}
              activeOpacity={0.7}
            >
              <Text style={[styles.unitButtonText, unit === 'cm' && styles.unitButtonTextActive]}>
                centimeters
              </Text>
            </TouchableOpacity>
          </View>

          {/* Current Height Display */}
          <Text style={styles.currentHeight}>
            Current height: {getCurrentHeightDisplay()}
          </Text>

          {/* Height Picker */}
          <HeightPicker
            initialHeight={getCurrentHeight()}
            unit={unit}
            onHeightChange={handleHeightChange}
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
    paddingHorizontal: 12,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#999999',
    fontFamily: 'Nunito',
  },
  unitButtonTextActive: {
    color: '#000000',
  },
  currentHeight: {
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

