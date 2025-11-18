import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { AtSign, Camera, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MentionSelector } from './MentionSelector';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface InputFieldProps {
  onFocus?: () => void;
  onSend?: (message: string) => void;
  isSending?: boolean;
  disabled?: boolean;
}

export function InputField({ onFocus, onSend, isSending = false, disabled = false }: InputFieldProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showMentionSelector, setShowMentionSelector] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const keyboardHeight = useSharedValue(0);
  const router = useRouter();
  const textInputRef = useRef<TextInput>(null);

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
      setShowMentionSelector(false);
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
        [114, keyboardHeight.value + 10]
      ),
      left: interpolate(expanded, [0, 1], [160, 20]),
      right: interpolate(expanded, [0, 1], [110, 20]),
    };
  });

  const cameraButtonAnimatedStyle = useAnimatedStyle(() => {
    const expanded = keyboardHeight.value > 0 ? 1 : 0;

    return {
      bottom: interpolate(
        expanded,
        [0, 1],
        [114, keyboardHeight.value + 10]
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

  const inputAnimatedStyle = useAnimatedStyle(() => {
    const expanded = keyboardHeight.value > 0 ? 1 : 0;

    return {
      paddingLeft: interpolate(expanded, [0, 1], [-8, 12]),
    };
  });

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleMentionSelect = (agentName: string) => {
    const mentionText = `@${agentName} `;
    const before = text.substring(0, cursorPosition);
    const after = text.substring(cursorPosition);
    const newText = before + mentionText + after;
    const newCursorPosition = cursorPosition + mentionText.length;

    setText(newText);
    setShowMentionSelector(false);

    setTimeout(() => {
      textInputRef.current?.focus();
      textInputRef.current?.setNativeProps({
        selection: { start: newCursorPosition, end: newCursorPosition },
      });
    }, 100);
  };

  const handleCameraPress = () => {
    router.push('/camera');
  };

  const handleSelectionChange = (event: any) => {
    setCursorPosition(event.nativeEvent.selection.start);
  };

  return (
    <>
      <MentionSelector
        visible={showMentionSelector}
        onSelect={handleMentionSelect}
        onDismiss={() => setShowMentionSelector(false)}
        inputBarBottom={keyboardHeight.value}
      />

      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.borderOverlay} />
        <View style={styles.inputContainer}>
          <Animated.View style={[styles.atButtonWrapper, atButtonAnimatedStyle]}>
            <TouchableOpacity
              style={styles.atButton}
              onPress={() => setShowMentionSelector(!showMentionSelector)}
            >
              <AtSign size={20} color="#666666" strokeWidth={2} />
            </TouchableOpacity>
          </Animated.View>

          <AnimatedTextInput
            ref={textInputRef}
            style={[styles.input, inputAnimatedStyle]}
            placeholder="Typing…"
            placeholderTextColor="#999999"
            value={text}
            onChangeText={setText}
            onFocus={handleFocus}
            onBlur={() => setIsFocused(false)}
            onSelectionChange={handleSelectionChange}
            multiline
            editable={!disabled && !isSending}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          {text.trim() && (
            <TouchableOpacity
              style={[styles.sendButton, (isSending || disabled) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={isSending || disabled}
            >
              <Send size={20} color={(isSending || disabled) ? "#999999" : "#000000"} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      <Animated.View style={[styles.floatingCameraButton, cameraButtonAnimatedStyle]}>
        <TouchableOpacity
          style={[styles.cameraButton, disabled && styles.cameraButtonDisabled]}
          onPress={handleCameraPress}
          disabled={disabled}
        >
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.cameraButtonBorder} />
          <Camera size={24} color={disabled ? "#999999" : "#000000"} strokeWidth={2.5} />
        </TouchableOpacity>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  borderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    pointerEvents: 'none',
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
    fontFamily: 'Nunito_400Regular',
    color: '#000000',
    maxHeight: 100,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 0,
    textAlign: 'left',
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  floatingCameraButton: {
    position: 'absolute',
    right: 20,
  },
  cameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  cameraButtonBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    pointerEvents: 'none',
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
});
