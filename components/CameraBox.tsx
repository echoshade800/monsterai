import { View, StyleSheet, TouchableOpacity, Image, Alert, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';

export function CameraBox() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log('[CameraBox] Permission changed:', permission);
    if (permission?.granted) {
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }
  }, [permission]);

  const handlePress = async () => {
    console.log('[CameraBox] handlePress - Permission status:', permission);

    if (!permission) {
      console.log('[CameraBox] Permission object not available yet');
      return;
    }

    if (!permission.granted) {
      console.log('[CameraBox] Requesting camera permission...');
      try {
        const result = await requestPermission();
        console.log('[CameraBox] Permission request result:', result);

        if (result.granted) {
          setShowPreview(true);
          setTimeout(() => {
            router.push('/camera');
          }, 300);
        } else {
          console.log('[CameraBox] Permission denied');
          Alert.alert(
            'Camera permission denied',
            'Camera permission is required to use camera function. Please enable camera permission in settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Go to Settings',
                onPress: async () => {
                  try {
                    await Linking.openSettings();
                  } catch (error) {
                    console.error('Failed to open settings:', error);
                  }
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('[CameraBox] Error requesting permission:', error);
        Alert.alert(
          'Failed to request permission',
          'Unable to request camera permission, please try again later. You can also manually enable camera permission in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.error('Failed to open settings:', error);
                }
              },
            },
          ],
        );
      }
    } else {
      console.log('[CameraBox] Permission already granted, navigating to camera');
      router.push('/camera');
    }
  };

  return (
    <TouchableOpacity
      style={styles.cameraBox}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={false}
    >
      {showPreview && permission?.granted ? (
        <View style={styles.previewContainer} pointerEvents="none">
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
        <View style={styles.placeholderContainer} pointerEvents="none">
          <Image
            source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/cameraneed.png' }}
            style={styles.cameraPlaceholder}
            resizeMode="cover"
          />
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
    width: 170,
    height: 102,
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
    width: '100%',
    height: '100%',
    borderRadius: 16,
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
