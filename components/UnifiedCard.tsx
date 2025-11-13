import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { Check, Camera } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { CameraPermissionModal } from './CameraPermissionModal';

export function UnifiedCard() {
  const [isChecked, setIsChecked] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const buttonScale = useSharedValue(1);

  const handleTaskPress = () => {
    setIsChecked(true);
    buttonScale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
  };

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

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const stressGraphPath = "M 0 50 Q 20 30, 40 35 T 80 45 T 120 35 T 160 50 T 200 40 T 240 55 T 280 45 T 320 50";

  return (
    <>
      <View style={styles.container}>
        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

        <View style={styles.taskSection}>
          <View style={styles.leftSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>🦑</Text>
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.timeText}>7:00-8:00</Text>
              <Text style={styles.taskText}>Eat breakfast!</Text>
            </View>
          </View>

          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              style={[styles.button, isChecked && styles.buttonChecked]}
              onPress={handleTaskPress}
              disabled={isChecked}
            >
              {isChecked ? (
                <Check size={20} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <Text style={styles.buttonText}>Done</Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.divider} />

        <View style={styles.statusSection}>
          <View style={styles.leftColumn}>
            <Text style={styles.statusLabel}>Zapped</Text>
            <View style={styles.stressRow}>
              <Text style={styles.stressLabel}>Stress</Text>
              <Text style={styles.stressValue}>86</Text>
            </View>

            <View style={styles.graphContainer}>
              <Svg width="100%" height="60" viewBox="0 0 320 60">
                <Defs>
                  <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor="#4ADE80" stopOpacity="1" />
                    <Stop offset="30%" stopColor="#FCD34D" stopOpacity="1" />
                    <Stop offset="60%" stopColor="#F472B6" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#A78BFA" stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Path
                  d={stressGraphPath}
                  fill="none"
                  stroke="url(#grad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
          </View>

          <View style={styles.rightColumn}>
            <View style={styles.cameraContainer}>
              {permission?.granted && !showCamera ? (
                <CameraView style={styles.camera} facing="back" />
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <Text style={styles.cameraPlaceholderText}>📸</Text>
                </View>
              )}
              <TouchableOpacity style={styles.cameraButton} onPress={handleCameraPress}>
                <View style={styles.cameraButtonInner}>
                  <Camera size={18} color="#FFFFFF" strokeWidth={2} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <CameraPermissionModal
        visible={showPermissionModal}
        onAllow={handleAllowPermission}
        onCancel={() => setShowPermissionModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginTop: -60,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  taskSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarEmoji: {
    fontSize: 30,
  },
  textContainer: {
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 2,
  },
  taskText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonChecked: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    marginHorizontal: 20,
  },
  statusSection: {
    flexDirection: 'row',
    padding: 20,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 15,
  },
  statusLabel: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  stressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stressLabel: {
    fontSize: 16,
    color: '#666666',
    marginRight: 8,
  },
  stressValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  graphContainer: {
    height: 60,
    marginTop: 5,
  },
  rightColumn: {
    width: 160,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
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
    fontSize: 48,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 10,
  },
  cameraButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
