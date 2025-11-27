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
const SHEET_HEIGHT = 450;

type ActivityLevel = 'Not Very Active' | 'Lightly Active' | 'Active' | 'Very Active';

interface ActivityLevelPickerModalProps {
  visible: boolean;
  initialActivityLevel: ActivityLevel;
  onClose: () => void;
  onSave: (activityLevel: ActivityLevel) => void;
}

const ACTIVITY_LEVELS: ActivityLevel[] = [
  'Not Very Active',
  'Lightly Active',
  'Active',
  'Very Active',
];

export function ActivityLevelPickerModal({ 
  visible, 
  initialActivityLevel, 
  onClose, 
  onSave 
}: ActivityLevelPickerModalProps) {
  const [selectedActivityLevel, setSelectedActivityLevel] = useState<ActivityLevel>(initialActivityLevel);

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Reset activity level when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedActivityLevel(initialActivityLevel);
    }
  }, [initialActivityLevel, visible]);

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
    onSave(selectedActivityLevel);
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
            <Text style={styles.title}>Edit activity level</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666666" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Current Activity Level Display */}
          <Text style={styles.currentActivityLevel}>
            Current: {selectedActivityLevel}
          </Text>

          {/* Activity Level Options */}
          <View style={styles.optionsContainer}>
            {ACTIVITY_LEVELS.map((level) => {
              const isSelected = level === selectedActivityLevel;
              
              return (
                <TouchableOpacity
                  key={level}
                  style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                  onPress={() => setSelectedActivityLevel(level)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {level}
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
  currentActivityLevel: {
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

