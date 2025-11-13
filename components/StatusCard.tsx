import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { LiquidGlassCard } from './LiquidGlassCard';
import { Camera } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { CameraPermissionModal } from './CameraPermissionModal';

export function StatusCard() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

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

  const stressGraphPath = "M 0 50 Q 20 30, 40 35 T 80 45 T 120 35 T 160 50 T 200 40 T 240 55 T 280 45 T 320 50";

  return (
    <>
      <LiquidGlassCard style={styles.card}>
        <View style={styles.content}>
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
                <CameraView style={styles.camera} facing="back">
                  <TouchableOpacity style={styles.cameraButton} onPress={handleCameraPress}>
                    <View style={styles.cameraButtonInner}>
                      <Camera size={18} color="#FFFFFF" strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                </CameraView>
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <TouchableOpacity style={styles.cameraButton} onPress={handleCameraPress}>
                    <View style={styles.cameraButtonInner}>
                      <Camera size={18} color="#FFFFFF" strokeWidth={2} />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.cameraPlaceholderText}>📸</Text>
                </View>
              )}
            </View>
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
    marginTop: 15,
    height: 160,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
  },
  leftColumn: {
    flex: 1,
    paddingRight: 15,
  },
  statusLabel: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
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
    fontFamily: 'SF Compact Rounded',
    color: '#666666',
    marginRight: 8,
  },
  stressValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
  },
  graphContainer: {
    height: 60,
    marginTop: 5,
  },
  rightColumn: {
    width: 140,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: 16,
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
    fontSize: 40,
    fontFamily: 'SF Compact Rounded',
    marginTop: -30,
  },
  cameraButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
  },
  cameraButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
});
