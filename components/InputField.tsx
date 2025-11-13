import { View, TextInput, StyleSheet, TouchableOpacity, Keyboard, Modal, Text, FlatList } from 'react-native';
import { BlurView } from 'expo-blur';
import { Camera, AtSign, Mic } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface InputFieldProps {
  onFocus?: () => void;
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

export function InputField({ onFocus }: InputFieldProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showMonsterPicker, setShowMonsterPicker] = useState(false);
  const keyboardHeight = useSharedValue(0);

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
      left: interpolate(expanded, [0, 1], [60, 20]),
      right: interpolate(expanded, [0, 1], [60, 20]),
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
          />

          <Animated.View style={[styles.voiceButtonWrapper, voiceButtonAnimatedStyle]}>
            <TouchableOpacity style={styles.voiceButton}>
              <Mic size={20} color="#666666" strokeWidth={2} />
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity style={styles.cameraButton}>
            <Camera size={22} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
        </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
  },
  atButtonWrapper: {
    marginRight: 8,
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
    fontSize: 16,
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    maxHeight: 100,
    paddingHorizontal: 8,
  },
  voiceButtonWrapper: {
    marginLeft: 8,
  },
  voiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
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
