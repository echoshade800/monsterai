import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LiquidGlassCard } from './LiquidGlassCard';

interface CameraPermissionModalProps {
  visible: boolean;
  onAllow: () => void;
  onCancel: () => void;
}

export function CameraPermissionModal({ visible, onAllow, onCancel }: CameraPermissionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />

        <View style={styles.modalContainer}>
          <LiquidGlassCard style={styles.card}>
            <View style={styles.content}>
              <Text style={styles.title}>Camera Access Needed</Text>
              <Text style={styles.message}>
                Monster AI needs camera access to record your moment.
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.allowButton} onPress={onAllow}>
                  <Text style={styles.allowButtonText}>Allow</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LiquidGlassCard>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  card: {
    padding: 0,
  },
  content: {
    padding: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  allowButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 22,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  allowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
