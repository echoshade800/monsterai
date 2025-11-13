import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { LiquidGlassCard } from './LiquidGlassCard';
import { Camera } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { CameraPermissionModal } from './CameraPermissionModal';

export function StatusCard() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [isTypingExpanded, setIsTypingExpanded] = useState(false);

  const handleCameraPress = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      setShowPermissionModal(true);
    } else {
      setShowCamera(true);
    }
  };

  const handleAllowPermission = async () => {
    const result = await requestPermission();
    setShowPermissionModal(false);
    if (result.granted) {
      setShowCamera(true);
    }
  };

  return (
    <>
      <LiquidGlassCard style={styles.card}>
        <View style={styles.content}>
          <View style={styles.topRow}>
            <Text style={styles.statusLabel}>Zapped</Text>
            <View style={styles.cameraContainer}>
              {permission?.granted && !showCamera ? (
                <CameraView style={styles.camera} facing="back">
                  <TouchableOpacity style={styles.floatingCameraButton} onPress={handleCameraPress}>
                    <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                    <Camera size={20} color="#000000" strokeWidth={2} />
                  </TouchableOpacity>
                </CameraView>
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <TouchableOpacity style={styles.floatingCameraButton} onPress={handleCameraPress}>
                    <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
                    <Camera size={20} color="#000000" strokeWidth={2} />
                  </TouchableOpacity>
                  <Text style={styles.cameraPlaceholderText}>📸</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.typingRow}>
            <TextInput
              style={styles.typingInput}
              placeholder="Typing…"
              placeholderTextColor="#999999"
              value={typingText}
              onChangeText={setTypingText}
              onFocus={() => setIsTypingExpanded(true)}
              onBlur={() => setIsTypingExpanded(false)}
            />
            <TouchableOpacity style={styles.externalCameraButton} onPress={handleCameraPress}>
              <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
              <Camera size={22} color="#000000" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </LiquidGlassCard>

      <CameraPermissionModal
        visible={showPermissionModal}
        onAllow={handleAllowPermission}
        onCancel={() => setShowPermissionModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: -40,
    minHeight: 140,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  statusLabel: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
  },
  cameraContainer: {
    width: 220,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(139, 115, 85, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#8B7355',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPlaceholderText: {
    fontSize: 32,
  },
  floatingCameraButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typingInput: {
    flex: 1,
    fontSize: 16,
    color: '#999999',
    paddingVertical: 8,
  },
  externalCameraButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});
