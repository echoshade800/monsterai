import { View, TextInput, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { Camera } from 'lucide-react-native';
import { useState, useRef, useEffect } from 'react';

export function InputField() {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const widthAnim = useRef(new Animated.Value(200)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: isFocused ? 0 : 200,
      useNativeDriver: false,
      tension: 40,
      friction: 8,
    }).start();
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.inputContainer, {
        marginLeft: widthAnim,
        marginRight: widthAnim,
      }]}>
        <TextInput
          style={styles.input}
          placeholder="Typing…"
          placeholderTextColor="#999999"
          value={text}
          onChangeText={setText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline
        />
        <TouchableOpacity style={styles.cameraButton}>
          <Camera size={22} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 110,
    left: 20,
    right: 20,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    maxHeight: 100,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
});
