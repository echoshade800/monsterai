import { Check, X } from 'lucide-react-native';
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

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = 400;

type Gender = 'Male' | 'Female' | 'Non-binary';

interface GenderPickerModalProps {
  visible: boolean;
  initialGender: Gender;
  onClose: () => void;
  onSave: (gender: Gender) => void;
}

const GENDERS: Gender[] = ['Male', 'Female', 'Non-binary'];

export function GenderPickerModal({ visible, initialGender, onClose, onSave }: GenderPickerModalProps) {
  const [selectedGender, setSelectedGender] = useState<Gender>(initialGender);

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Reset gender when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedGender(initialGender);
    }
  }, [initialGender, visible]);

  // Animation effect
  useEffect(() => {
    if (visible) {
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
    onSave(selectedGender);
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
            <Text style={styles.title}>Edit gender</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666666" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Current Gender Display */}
          <Text style={styles.currentGender}>
            Current: {selectedGender}
          </Text>

          {/* Gender Options */}
          <View style={styles.optionsContainer}>
            {GENDERS.map((gender) => {
              const isSelected = gender === selectedGender;
              
              return (
                <TouchableOpacity
                  key={gender}
                  style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                  onPress={() => setSelectedGender(gender)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {gender}
                  </Text>
                  {isSelected && (
                    <Check size={20} color="#4CCB5E" strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

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
  currentGender: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Nunito',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionItemSelected: {
    backgroundColor: '#F0FFF4',
    borderColor: '#4CCB5E',
  },
  optionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  optionTextSelected: {
    color: '#000000',
  },
  saveButton: {
    backgroundColor: '#000000',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
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

