import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

export function CameraBox() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (permission?.granted) {
      setShowPreview(true);
    }
  }, [permission]);

  const handlePress = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (result.granted) {
        setShowPreview(true);
        setTimeout(() => {
          router.push('/camera');
        }, 300);
      }
    } else {
      router.push('/camera');
    }
  };

  return (
    <TouchableOpacity style={styles.cameraBox} onPress={handlePress} activeOpacity={0.8}>
      {showPreview && permission?.granted ? (
        <View style={styles.previewContainer}>
          <CameraView style={styles.cameraPreview} facing="back">
            <View style={styles.previewOverlay}>
              <View style={styles.cameraIconButton}>
                <View style={styles.cameraIconInner}>
                  <Camera size={14} color="#FFFFFF" strokeWidth={2} />
                </View>
              </View>
            </View>
          </CameraView>
        </View>
      ) : (
        <View style={styles.placeholderContainer}>
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraEmoji}>📸💥</Text>
          </View>
          <View style={styles.cameraIconButton}>
            <View style={styles.cameraIconInner}>
              <Camera size={14} color="#FFFFFF" strokeWidth={2} />
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cameraBox: {
    width: 120,
    height: '100%',
    position: 'relative',
  },
  previewContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#8B7355',
  },
  cameraPreview: {
    flex: 1,
  },
  previewOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 8,
  },
  placeholderContainer: {
    flex: 1,
    position: 'relative',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#8B7355',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraEmoji: {
    fontSize: 32,
  },
  cameraIconButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cameraIconInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
