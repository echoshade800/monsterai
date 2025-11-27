import { X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Keyboard,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = 500;

interface DietPreferenceModalProps {
  visible: boolean;
  initialPreference: string;
  onClose: () => void;
  onSave: (preference: string) => void;
}

export function DietPreferenceModal({ 
  visible, 
  initialPreference, 
  onClose, 
  onSave 
}: DietPreferenceModalProps) {
  const [preference, setPreference] = useState(initialPreference);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const textInputRef = useRef<TextInput>(null);

  // Animation values
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Reset preference when modal opens
  useEffect(() => {
    if (visible) {
      setPreference(initialPreference);
      // Auto-focus the input after modal animation
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 400);
    } else {
      setKeyboardHeight(0);
    }
  }, [initialPreference, visible]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

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
    Keyboard.dismiss();
    onSave(preference.trim());
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
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
            onPress={handleCancel}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: sheetTranslateY }],
              bottom: keyboardHeight > 0 ? keyboardHeight - 20 : 0,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Edit diet preference</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <X size={24} color="#666666" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Tell us about your food preferences, allergies, or dietary restrictions.
          </Text>

          {/* Text Input */}
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            value={preference}
            onChangeText={setPreference}
            placeholder="e.g., No dairy, prefer low spice, allergic to shellfish..."
            placeholderTextColor="#999999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoCapitalize="sentences"
            autoCorrect={true}
            returnKeyType="default"
            blurOnSubmit={false}
          />

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={handleCancel} 
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave} 
              activeOpacity={0.8}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 12,
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
  description: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    fontFamily: 'Nunito',
  },
  textInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Nunito',
    minHeight: 160,
    maxHeight: 240,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  saveButton: {
    flex: 1,
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

