import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { AtSign, Camera, Mic, Send } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Keyboard, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface InputFieldProps {
  onFocus?: () => void;
  onSend?: (message: string) => void;
  isSending?: boolean;
  disabled?: boolean;
}

interface Monster {
  id: string;
  name: string;
  icon: string;
}

const MONSTERS: Monster[] = [
  { id: 'energy', name: 'Energy', icon: '⚡' },
  { id: 'face', name: 'Face', icon: '😊' },
  { id: 'posture', name: 'Posture', icon: '🧍' },
  { id: 'sleep', name: 'Sleep', icon: '😴' },
  { id: 'stress', name: 'Stress', icon: '😰' },
  { id: 'feces', name: 'Feces', icon: '💩' },
];

export function InputField({ onFocus, onSend, isSending = false, disabled = false }: InputFieldProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showMonsterPicker, setShowMonsterPicker] = useState(false);
  const keyboardHeight = useSharedValue(0);
  const router = useRouter();

  const handleSend = () => {
    if (text.trim() && onSend && !isSending && !disabled) {
      onSend(text);
      setText('');
    }
  };

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (e) => {
      keyboardHeight.value = withTiming(e.endCoordinates.height, { duration: 250 });
    });

    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', () => {
      keyboardHeight.value = withTiming(0, { duration: 250 });
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const expanded = keyboardHeight.value > 0 ? 1 : 0;

    return {
      bottom: interpolate(
        expanded,
        [0, 1],
        [110, keyboardHeight.value + 10]
      ),
      left: interpolate(expanded, [0, 1], [140, 20]),
      right: interpolate(expanded, [0, 1], [90, 20]),
    };
  });

  const cameraButtonAnimatedStyle = useAnimatedStyle(() => {
    const expanded = keyboardHeight.value > 0 ? 1 : 0;

    return {
      bottom: interpolate(
        expanded,
        [0, 1],
        [110, keyboardHeight.value + 10]
      ),
      opacity: interpolate(expanded, [0, 1], [1, 0]),
    };
  });

  const atButtonAnimatedStyle = useAnimatedStyle(() => {
    const expanded = keyboardHeight.value > 0 ? 1 : 0;

    return {
      opacity: expanded,
      transform: [
        { scale: interpolate(expanded, [0, 1], [0.5, 1]) }
      ],
    };
  });

  const voiceButtonAnimatedStyle = useAnimatedStyle(() => {
    const expanded = keyboardHeight.value > 0 ? 1 : 0;

    return {
      opacity: expanded,
      transform: [
        { scale: interpolate(expanded, [0, 1], [0.5, 1]) }
      ],
    };
  });

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleMonsterSelect = (monster: Monster) => {
    setText(text + `@${monster.name.toLowerCase()} `);
    setShowMonsterPicker(false);
  };

  const handleCameraPress = () => {
    router.push('/camera');
  };

  const renderMonsterItem = ({ item }: { item: Monster }) => (
    <TouchableOpacity
      style={styles.monsterItem}
      onPress={() => handleMonsterSelect(item)}
    >
      <Text style={styles.monsterIcon}>{item.icon}</Text>
      <Text style={styles.monsterName}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.inputContainer}>
          <Animated.View style={[styles.atButtonWrapper, atButtonAnimatedStyle]}>
            <TouchableOpacity
              style={styles.atButton}
              onPress={() => setShowMonsterPicker(true)}
            >
              <AtSign size={20} color="#666666" strokeWidth={2} />
            </TouchableOpacity>
          </Animated.View>

          <TextInput
            style={styles.input}
            placeholder="Typing…"
            placeholderTextColor="#999999"
            value={text}
            onChangeText={setText}
            onFocus={handleFocus}
            onBlur={() => setIsFocused(false)}
            multiline
            editable={!disabled && !isSending}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          {text.trim() ? (
            <TouchableOpacity
              style={[styles.sendButton, (isSending || disabled) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={isSending || disabled}
            >
              <Send size={20} color={(isSending || disabled) ? "#999999" : "#000000"} strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <Animated.View style={[styles.voiceButtonWrapper, voiceButtonAnimatedStyle]}>
              <TouchableOpacity style={styles.voiceButton} disabled={disabled}>
                <Mic size={20} color={disabled ? "#999999" : "#666666"} strokeWidth={2} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </Animated.View>

      <Animated.View style={[styles.floatingCameraButton, cameraButtonAnimatedStyle]}>
        <TouchableOpacity
          style={[styles.cameraButton, disabled && styles.cameraButtonDisabled]}
          onPress={handleCameraPress}
          disabled={disabled}
        >
          <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
          <Camera size={24} color={disabled ? "#999999" : "#000000"} strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showMonsterPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMonsterPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMonsterPicker(false)}
        >
          <View style={styles.monsterPickerContainer}>
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
            <FlatList
              data={MONSTERS}
              renderItem={renderMonsterItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.monsterList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 0,
    height: 50,
  },
  atButtonWrapper: {
    marginRight: 4,
  },
  atButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    maxHeight: 100,
    paddingHorizontal: 4,
    paddingVertical: 0,
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  voiceButtonWrapper: {
    marginLeft: 4,
  },
  voiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCameraButton: {
    position: 'absolute',
    right: 32,
  },
  cameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cameraButtonDisabled: {
    opacity: 0.4,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monsterPickerContainer: {
    width: '85%',
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  monsterList: {
    padding: 20,
  },
  monsterItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    margin: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  monsterIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  monsterName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
});
