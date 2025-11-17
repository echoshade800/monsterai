import { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, Dimensions, Platform } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_SIZE = Math.min(SCREEN_WIDTH * 0.8, 300);

interface AvatarCropModalProps {
  visible: boolean;
  imageUri: string;
  onCancel: () => void;
  onConfirm: (croppedUri: string) => void;
}

export default function AvatarCropModal({ visible, imageUri, onCancel, onConfirm }: AvatarCropModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1);
      } else if (scale.value > 3) {
        scale.value = withSpring(3);
      }
      savedScale.value = scale.value;
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composed = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const handleConfirm = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      const cropX = Math.max(0, -translateX.value / scale.value + (SCREEN_WIDTH - CROP_SIZE) / 2 / scale.value);
      const cropY = Math.max(0, -translateY.value / scale.value + (SCREEN_HEIGHT - CROP_SIZE) / 2 / scale.value);

      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [
          {
            crop: {
              originX: cropX,
              originY: cropY,
              width: CROP_SIZE / scale.value,
              height: CROP_SIZE / scale.value,
            },
          },
          { resize: { width: 300, height: 300 } },
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      onConfirm(manipResult.uri);
    } catch (error) {
      console.error('Error cropping image:', error);
      onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.cropArea}>
          <GestureDetector gesture={composed}>
            <Animated.View style={[styles.imageContainer, animatedStyle]}>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
            </Animated.View>
          </GestureDetector>

          <View style={styles.overlay} pointerEvents="none">
            <View style={styles.overlayTop} />
            <View style={styles.overlayRow}>
              <View style={styles.overlaySide} />
              <View style={styles.cropFrame}>
                <View style={styles.cropBorder} />
              </View>
              <View style={styles.overlaySide} />
            </View>
            <View style={styles.overlayBottom} />
          </View>
        </View>

        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Move and Scale</Text>
          <TouchableOpacity
            onPress={handleConfirm}
            style={styles.headerButton}
            disabled={isProcessing}
          >
            <Text style={[styles.doneText, isProcessing && styles.disabledText]}>
              {isProcessing ? 'Processing...' : 'Choose'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>Pinch to zoom, drag to move</Text>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
  },
  headerButton: {
    minWidth: 80,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelText: {
    fontSize: 17,
    color: '#FFFFFF',
  },
  doneText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'right',
  },
  disabledText: {
    opacity: 0.5,
  },
  cropArea: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTop: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  overlayRow: {
    flexDirection: 'row',
    width: '100%',
  },
  overlaySide: {
    flex: 1,
    height: CROP_SIZE,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  cropFrame: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropBorder: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderRadius: CROP_SIZE / 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  overlayBottom: {
    flex: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  instructions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
  },
  instructionText: {
    fontSize: 14,
    color: '#AAAAAA',
  },
});
