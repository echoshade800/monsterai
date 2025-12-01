import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { AtSign, Camera, PenLine, Send } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  initialText?: string;
  autoFocus?: boolean;
}

export function InputField({ onFocus, onSend, isSending = false, disabled = false, initialText = '', autoFocus = false }: InputFieldProps) {
  const [text, setText] = useState(''); // 始终保存实际输入值，不删除
  const [isFocused, setIsFocused] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false); // 跟踪键盘是否可见
  const [showMentionSelector, setShowMentionSelector] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const lastInitialTextRef = useRef<string>('');
  const textRef = useRef<string>(''); // 用于在键盘事件中获取最新的 text 值
  const keyboardHeight = useSharedValue(0);
  const router = useRouter();
  const textInputRef = useRef<TextInput>(null);

  // 封装 setText，同时更新 textRef
  const updateText = (newText: string) => {
    textRef.current = newText;
    setText(newText);
  };

  const handleSend = () => {
    // 使用实际的 text 值
    const messageToSend = text.trim();
    if (messageToSend && onSend && !isSending && !disabled) {
      onSend(messageToSend);
      updateText(''); // 发送后清空实际值
      // 发送后，标记当前的 initialText 已被使用
      lastInitialTextRef.current = initialText;
    }
  };

  useEffect(() => {
    // iOS 使用 keyboardWillShow/keyboardWillHide，Android 使用 keyboardDidShow/keyboardDidHide
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShow = Keyboard.addListener(showEvent, (e) => {
      keyboardHeight.value = withTiming(e.endCoordinates.height, { duration: 250 });
      setIsKeyboardVisible(true);
      // 键盘展开时，text 值保持不变（实际值不删除）
      // displayedValue 会自动更新为 text，因为 isKeyboardVisible 变为 true
    });

    const keyboardHide = Keyboard.addListener(hideEvent, () => {
      keyboardHeight.value = withTiming(0, { duration: 250 });
      setIsKeyboardVisible(false);
      setShowMentionSelector(false);
      // 键盘收起时，不清空 text（实际值保留）
      // displayedValue 会自动更新为空字符串，因为 isKeyboardVisible 变为 false
    });

    return () => {
      keyboardShow.remove();
      keyboardHide.remove();
    };
  }, []); // 不需要依赖，因为 text 值不会被键盘事件修改

  // Handle initial text and auto focus
  useEffect(() => {
    // 只有当 initialText 变化了（且不为空），且不是已经使用过的值时，才设置
    if (initialText && initialText !== lastInitialTextRef.current) {
      updateText(initialText);
      lastInitialTextRef.current = initialText;
      if (autoFocus) {
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 300);
      }
    }
    // 如果 initialText 变为空字符串，重置引用，允许下次使用新的 initialText
    if (!initialText) {
      lastInitialTextRef.current = '';
    }
  }, [initialText, autoFocus]);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const expanded = keyboardHeight.value > 0 ? 1 : 0;

    return {
      bottom: interpolate(
        expanded,
        [0, 1],
        [114, keyboardHeight.value + 10]
      ),
      left: interpolate(expanded, [0, 1], [180, 20]),
      right: interpolate(expanded, [0, 1], [80, 20]),
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
      paddingLeft: interpolate(expanded, [0, 1], [12, 12]),
    };
  });

  // 计算显示的文本值：缩小状态时隐藏用户文字，展开状态时显示实际文字
  const displayedValue = isKeyboardVisible ? text : '';
  
  // Placeholder 显示逻辑：
  // - 缩小状态时：始终显示 "Typing..."
  // - 展开状态时：不显示 placeholder（即使没有文字）
  const shouldShowPlaceholder = !isKeyboardVisible;

  const handleFocus = () => {
    setIsFocused(true);
    // text 始终保存实际值，不需要恢复
    // 键盘展开时，displayedValue 会自动显示 text
    onFocus?.();
  };

  const handleMentionSelect = (agentName: string) => {
    const mentionText = `@${agentName} `;
    const before = textRef.current.substring(0, cursorPosition);
    const after = textRef.current.substring(cursorPosition);
    const newText = before + mentionText + after;
    const newCursorPosition = cursorPosition + mentionText.length;

    updateText(newText);
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

          {shouldShowPlaceholder && (
            <Animated.View style={[styles.placeholderWrapper]} pointerEvents="none">
              <PenLine size={18} color="#999999" strokeWidth={2} />
              <Text style={styles.placeholderText}>Typing...</Text>
            </Animated.View>
          )}

          <AnimatedTextInput
            ref={textInputRef}
            style={[styles.input, inputAnimatedStyle]}
            placeholder=""
            placeholderTextColor="#999999"
            value={displayedValue} // 缩小状态时显示空字符串，展开状态时显示实际文字
            onChangeText={updateText} // 始终更新实际的 text 值
            onFocus={handleFocus}
            onBlur={() => setIsFocused(false)}
            onSelectionChange={handleSelectionChange}
            multiline={false} // 始终单行，不换行
            editable={!disabled && !isSending}
            onSubmitEditing={handleSend}
            returnKeyType="send"
            scrollEnabled={isKeyboardVisible} // 只在键盘展开时允许横向滚动
          />

          {isKeyboardVisible && text.trim() && (
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
  placeholderWrapper: {
    position: 'absolute',
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  placeholderText: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: '#999999',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: '#000000',
    height: 50, // 固定高度，单行显示
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
