import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { useState } from 'react';

interface InviteCodeModalProps {
  visible: boolean;
  onValidCode: () => void;
  onNotYet: () => void;
}

export function InviteCodeModal({ visible, onValidCode, onNotYet }: InviteCodeModalProps) {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (code.trim().toLowerCase() === 'monsterai') {
      onValidCode();
    } else {
      alert('Invalid invite code. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Image
          source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/linker/dim.png' }}
          style={styles.backgroundImage}
          blurRadius={0}
        />

        <View style={styles.logoContainer}>
          <Image
            source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/icon.png' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.logoTitle}>MonsterLinker AI</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.title}>Enter Your Invite Code</Text>

            <TextInput
              style={styles.input}
              placeholder=""
              placeholderTextColor="#B0B0B0"
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.notYetButton]}
                onPress={onNotYet}
              >
                <Text style={styles.notYetButtonText}>Not yet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.helperText}>
              Please enter the invitation code{'\n'}to unlock access.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    position: 'absolute',
    top: 200,
    alignItems: 'center',
  },
  logoImage: {
    width: 140,
    height: 140,
    marginBottom: 16,
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 28,
    backgroundColor: 'rgba(235, 235, 235, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  cardContent: {
    padding: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    width: '100%',
    height: 58,
    backgroundColor: '#F5F5F5',
    borderRadius: 29,
    paddingHorizontal: 24,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 20,
    borderWidth: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notYetButton: {
    backgroundColor: '#C8C8C8',
  },
  notYetButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#5A5A5A',
  },
  submitButton: {
    backgroundColor: '#000000',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helperText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
