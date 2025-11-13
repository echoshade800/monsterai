import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Camera } from 'lucide-react-native';
import { useState } from 'react';

interface InputFieldProps {
  onFocus?: () => void;
}

export function InputField({ onFocus }: InputFieldProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
      <View style={styles.inputContainer}>
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
        <TouchableOpacity style={styles.cameraButton}>
          <Camera size={22} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    maxHeight: 100,
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
});
