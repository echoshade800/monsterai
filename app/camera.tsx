import { BlurView } from 'expo-blur';
import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft, Flashlight, Image as ImageIcon, SwitchCamera } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { uploadImageToS3 } from '../src/utils/function-tools';
import storageManager from '../src/utils/storage';

// Image mapping for require() - React Native requires static paths
const IMAGE_MAP: { [key: string]: any } = {
  'frontsteward.png': require('../assets/images/frontsteward.png'),
  'backsteward.png': require('../assets/images/backsteward.png'),
  'frontenergy.png': require('../assets/images/frontenergy.png'),
  'backenergy.png': require('../assets/images/backenergy.png'),
  'frontface.png': require('../assets/images/frontface.png'),
  'backface.png': require('../assets/images/backface.png'),
  'frontposture.png': require('../assets/images/frontposture.png'),
  'backposture.png': require('../assets/images/backposture.png'),
  'frontsleep.png': require('../assets/images/frontsleep.png'),
  'backsleep.png': require('../assets/images/backsleep.png'),
  'frontstress.png': require('../assets/images/frontstress.png'),
  'backstress.png': require('../assets/images/backstress.png'),
  'frontfeces.png': require('../assets/images/frontfeces.png'),
  'backfeces.png': require('../assets/images/backfeces.png'),
};

const AGENTS = [
  {
    id: 'butler',
    name: 'Butler',
    frontImage: 'frontsteward.png',
    backImage: 'backsteward.png',
    prompt: 'Take any picture you want!',
    image_detection_type: 'full',
  },
  {
    id: 'foodie',
    name: 'Foodie',
    frontImage: 'frontenergy.png',
    backImage: 'backenergy.png',
    prompt: 'Show me your food!',
    image_detection_type: 'food_calorie',
  },
  {
    id: 'facey',
    name: 'Facey',
    frontImage: 'frontface.png',
    backImage: 'backface.png',
    prompt: 'Show me your face!',
    image_detection_type: 'face',
  },
  {
    id: 'posture',
    name: 'Posture',
    frontImage: 'frontposture.png',
    backImage: 'backposture.png',
    prompt: 'Check your posture!',
    image_detection_type: 'posture',
  },
  {
    id: 'sleeper',
    name: 'Sleeper',
    frontImage: 'frontsleep.png',
    backImage: 'backsleep.png',
    prompt: 'How did you sleep? Show me!',
    image_detection_type: 'sleep',
  },
  {
    id: 'moodie',
    name: 'Moodie',
    frontImage: 'frontstress.png',
    backImage: 'backstress.png',
    prompt: 'How stressed are you? Show me!',
    image_detection_type: 'stress',
  },
  {
    id: 'poopy',
    name: 'Poopy',
    frontImage: 'frontfeces.png',
    backImage: 'backfeces.png',
    prompt: 'Did you poop today?',
    image_detection_type: 'feces',
  },
];

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'photo' | 'photo-text'>('photo');
  const [selectedAgent, setSelectedAgent] = useState<string>('steward');
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionMessage}>
            Monster AI needs camera access to capture your moment.
          </Text>
          <TouchableOpacity style={styles.allowButton} onPress={requestPermission}>
            <Text style={styles.allowButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 处理图片上传后的导航逻辑
  async function navigateWithImage(
    uploadResult: any,
    localUri: string,
    selectedAgent: string,
    mode: 'photo' | 'photo-text',
    router: any,
    logPrefix: string = 'Navigation params'
  ) {
    // 检查是否有有效的上传结果
    const hasValidUploadUrl = uploadResult && (uploadResult.url || uploadResult.presigned_url || uploadResult.s3_uri);
    
    // 如果只有本地URI（上传失败或没有有效的上传结果），则直接返回，不继续执行后续逻辑
    if (!hasValidUploadUrl) {
      console.log('Only local URI available, upload failed or no valid upload result, stopping subsequent processing');
      return;
    }

    // 获取图片URI（优先使用S3响应中的url字段（CloudFront CDN URL），失败则使用本地URI）
    const imageUri = uploadResult?.url || uploadResult?.presigned_url || uploadResult?.s3_uri || localUri;

    // 获取选中 agent 的 image_detection_type
    const selectedAgentData = AGENTS.find(a => a.id === selectedAgent);
    const imageDetectionType = selectedAgentData?.image_detection_type || 'full';
    
    console.log(`${logPrefix}:`, {
      photoUri: imageUri,
      agentId: selectedAgent,
      imageDetectionType,
      mode
    });

    // 根据模式处理导航
    if (mode === 'photo-text') {
      // photo-text 模式：导航到照片文字页面
      router.replace({
        pathname: '/photo-text',
        params: { 
          photoUri: imageUri, 
          agentId: selectedAgent,
          imageDetectionType
        }
      });
    } else {
      // photo 模式：存储图片信息到 AsyncStorage，然后返回聊天页面
      const photoData = {
        photoUri: imageUri,
        agentId: selectedAgent,
        imageDetectionType,
        mode: 'photo'
      };
      
      // 存储待处理的图片信息
      await storageManager.setPendingPhoto(photoData);
      console.log('Photo data stored, navigating back to chat page');
      
      // 使用 router.back() 返回到聊天页面
      router.back();
    }
  }

  async function takePicture() {
    if (!cameraRef.current || isUploading) {
      return;
    }

    try {
      setIsUploading(true);
      
      // 拍照
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (!photo?.uri) {
        Alert.alert('Error', 'Failed to take picture, please try again');
        setIsUploading(false);
        return;
      }

      // 获取用户ID
      let uid = 'anonymous';
      try {
        const userData = await storageManager.getUserData();
        if (userData) {
          const info = userData.toJSON ? userData.toJSON() : userData;
          if (info && (info.uid || info.id)) {
            uid = String(info.uid || info.id);
          }
        }
      } catch (e) {
        console.warn('Failed to get user ID, using anonymous:', e);
      }

      // 准备上传参数
      const filename = `photo_${Date.now()}.jpg`;
      const mimeType = 'image/jpeg';

      console.log('Starting to upload photo to S3:', { uid, filename, mimeType, photoUri: photo.uri });

      // 上传到S3
      let uploadResult;
      try {
        uploadResult = await uploadImageToS3({
          uid,
          uri: photo.uri,
          filename,
          mimeType,
        });
        console.log('Photo uploaded successfully:', uploadResult);
      } catch (uploadError) {
        console.error('Failed to upload photo to S3:', uploadError);
        // 上传失败时，仍然使用本地URI
        Alert.alert('Upload Failed', 'Image upload failed, will use local image. Error: ' + (uploadError as Error).message);
      }

      // 处理图片上传后的导航逻辑
      await navigateWithImage(uploadResult, photo.uri, selectedAgent, mode, router, 'Navigation params');
    } catch (error) {
      console.error('Failed to take picture:', error);
      Alert.alert('Error', 'Failed to take picture: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  }

  async function openGallery() {
    if (isUploading) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);

        const selectedImage = result.assets[0];

        if (!selectedImage?.uri) {
          Alert.alert('Error', 'Failed to select image, please try again');
          setIsUploading(false);
          return;
        }

        // 获取用户ID
        let uid = 'anonymous';
        try {
          const userData = await storageManager.getUserData();
          if (userData) {
            const info = userData.toJSON ? userData.toJSON() : userData;
            if (info && (info.uid || info.id)) {
              uid = String(info.uid || info.id);
            }
          }
        } catch (e) {
          console.warn('Failed to get user ID, using anonymous:', e);
        }

        // 准备上传参数
        const filename = `photo_${Date.now()}.jpg`;
        const mimeType = 'image/jpeg';

        console.log('Starting to upload album image to S3:', { uid, filename, mimeType, photoUri: selectedImage.uri });

        // 上传到S3
        let uploadResult;
        try {
          uploadResult = await uploadImageToS3({
            uid,
            uri: selectedImage.uri,
            filename,
            mimeType,
          });
          console.log('Album image uploaded successfully:', uploadResult);
        } catch (uploadError) {
          console.error('Failed to upload album image to S3:', uploadError);
          // 上传失败时，仍然使用本地URI
          Alert.alert('Upload Failed', 'Image upload failed, will use local image. Error: ' + (uploadError as Error).message);
        }

        // 处理图片上传后的导航逻辑
        await navigateWithImage(uploadResult, selectedImage.uri, selectedAgent, mode, router, 'Album selection navigation params');
      }
    } catch (error) {
      console.error('Failed to select image:', error);
      Alert.alert('Error', 'Failed to select image: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
    }
  }

  function toggleFlash() {
    setTorchEnabled(current => !current);
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const selectedAgentData = AGENTS.find(a => a.id === selectedAgent) || AGENTS[0];

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={cameraRef}
        flash={flash}
        enableTorch={torchEnabled}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <ChevronLeft size={28} color="#000" strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.spacer} />

            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'photo' && styles.modeButtonActive]}
                onPress={() => setMode('photo')}
              >
                <Text style={[styles.modeText, mode === 'photo' && styles.modeTextActive]}>
                  photo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'photo-text' && styles.modeButtonActive]}
                onPress={() => setMode('photo-text')}
              >
                <Text style={[styles.modeText, mode === 'photo-text' && styles.modeTextActive]}>
                  photo+text
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.secondRow}>
            <View style={styles.rightButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={openGallery}>
                <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
                <ImageIcon size={24} color="#FFF" strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, torchEnabled && styles.iconButtonActive]}
                onPress={toggleFlash}
              >
                <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
                <Flashlight size={24} color="#FFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.centerContainer}>
            <View style={styles.promptContainer}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={styles.promptText}>{selectedAgentData.prompt}</Text>
            </View>

            <TouchableOpacity 
              style={styles.captureButton} 
              onPress={takePicture}
              disabled={isUploading}
            >
              <Image
                source={IMAGE_MAP[selectedAgentData.backImage]}
                style={styles.captureImage}
              />
              <View style={styles.captureOverlay}>
                <View style={styles.cameraIconContainer}>
                  {isUploading ? (
                    <ActivityIndicator size="large" color="#FFFFFF" />
                  ) : (
                    <View style={styles.cameraIconOuter}>
                      <View style={styles.cameraIconInner} />
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.agentList}
            >
              {AGENTS.map((agent, index) => {
                const imageStyle = [styles.agentImage];
                if (agent.id === 'sleeper' || agent.id === 'poopy') {
                  imageStyle.push(styles.agentImageSmall);
                } else if (agent.id === 'moodie') {
                  imageStyle.push(styles.agentImageUp);
                } else if (agent.id === 'posture') {
                  imageStyle.push(styles.agentImageDown);
                }

                return (
                  <TouchableOpacity
                    key={agent.id}
                    style={[styles.agentButton, index > 0 && styles.agentButtonSpacing]}
                    onPress={() => setSelectedAgent(agent.id)}
                  >
                    <Image
                      source={IMAGE_MAP[selectedAgent === agent.id ? agent.backImage : agent.frontImage]}
                      style={imageStyle}
                    />
                    {selectedAgent === agent.id && (
                      <View style={styles.checkmarkContainer}>
                        <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                        <Check size={20} color="#000" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
              <SwitchCamera size={28} color="#FFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  secondRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 25,
    padding: 4,
  },
  modeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  modeTextActive: {
    color: '#000',
  },
  rightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(255, 200, 0, 0.5)',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: 200,
  },
  promptContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 20,
    marginBottom: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  promptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
    lineHeight: 22,
  },
  captureButton: {
    width: 140,
    height: 140,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureImage: {
    width: 320,
    height: 320,
    resizeMode: 'contain',
  },
  captureOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  cameraIconInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  bottomBar: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 20,
    position: 'relative',
  },
  agentList: {
    paddingHorizontal: 20,
  },
  agentButton: {
    width: 140,
    height: 140,
    position: 'relative',
  },
  agentButtonSpacing: {
    marginLeft: -40,
  },
  agentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  agentImageSmall: {
    width: '85%',
    height: '85%',
    alignSelf: 'center',
    marginTop: 10,
  },
  agentImageUp: {
    marginTop: -15,
  },
  agentImageDown: {
    marginTop: 15,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  allowButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
  },
  allowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 28,
    right: 28,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: '#000',
  },
  flipButton: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 200 : 190,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
