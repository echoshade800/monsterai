import { BlurView } from 'expo-blur';
import { CameraType, CameraView, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Check, ChevronLeft, Flashlight, Image as ImageIcon, SwitchCamera } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { uploadImageToS3 } from '../src/utils/function-tools';
import storageManager from '../src/utils/storage';
const AGENTS = [
  {
    id: 'steward',
    name: 'Steward',
    frontImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/frontsteward.png',
    backImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/backsteward.png',
    prompt: 'Take any picture you want!',
    image_detection_type: 'full',
  },
  {
    id: 'energy',
    name: 'Energy',
    frontImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/frontenergy.png',
    backImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/backenergy.png',
    prompt: 'Show me your food!',
    image_detection_type: 'food_calorie',
  },
  {
    id: 'face',
    name: 'Face',
    frontImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/frontface.png',
    backImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/backface.png',
    prompt: 'Show me your face!',
    image_detection_type: 'face',
  },
  {
    id: 'posture',
    name: 'Posture',
    frontImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/frontposture.png',
    backImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/backposture.png',
    prompt: 'Check your posture!',
    image_detection_type: 'posture',
  },
  {
    id: 'sleep',
    name: 'Sleep',
    frontImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/frontsleep.png',
    backImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/backsleep.png',
    prompt: 'How did you sleep? Show me!',
    image_detection_type: 'sleep',
  },
  {
    id: 'stress',
    name: 'Stress',
    frontImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/frontstress.png',
    backImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/backstress.png',
    prompt: 'How stressed are you? Show me!',
    image_detection_type: 'stress',
  },
  {
    id: 'feces',
    name: 'Feces',
    frontImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/frontfeces.png',
    backImage: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/backfeces.png',
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
  function navigateWithImage(
    uploadResult: any,
    localUri: string,
    selectedAgent: string,
    mode: 'photo' | 'photo-text',
    router: any,
    logPrefix: string = '导航参数'
  ) {
    // 检查是否有有效的上传结果
    const hasValidUploadUrl = uploadResult && (uploadResult.url || uploadResult.presigned_url || uploadResult.s3_uri);
    
    // 如果只有本地URI（上传失败或没有有效的上传结果），则直接返回，不继续执行后续逻辑
    if (!hasValidUploadUrl) {
      console.log('只有本地URI，上传失败或没有有效的上传结果，停止后续处理');
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

    // 导航到相应页面（使用 replace 避免路由栈增长）
    if (mode === 'photo-text') {
      router.replace({
        pathname: '/photo-text',
        params: { 
          photoUri: imageUri, 
          agentId: selectedAgent,
          imageDetectionType
        }
      });
    } else {
      // 返回聊天页面，使用 replace 替换当前相机页面
      router.replace({
        pathname: '/(tabs)',
        params: { 
          photoUri: imageUri, 
          agentId: selectedAgent, 
          imageDetectionType,
          mode: 'photo' 
        }
      });
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
        Alert.alert('错误', '拍照失败，请重试');
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
        console.warn('获取用户ID失败，使用匿名:', e);
      }

      // 准备上传参数
      const filename = `photo_${Date.now()}.jpg`;
      const mimeType = 'image/jpeg';

      console.log('开始上传照片到S3:', { uid, filename, mimeType, photoUri: photo.uri });

      // 上传到S3
      let uploadResult;
      try {
        uploadResult = await uploadImageToS3({
          uid,
          uri: photo.uri,
          filename,
          mimeType,
        });
        console.log('照片上传成功:', uploadResult);
      } catch (uploadError) {
        console.error('上传照片到S3失败:', uploadError);
        // 上传失败时，仍然使用本地URI
        Alert.alert('上传失败', '图片上传失败，将使用本地图片。错误: ' + (uploadError as Error).message);
      }

      // 处理图片上传后的导航逻辑
      navigateWithImage(uploadResult, photo.uri, selectedAgent, mode, router, '导航参数');
    } catch (error) {
      console.error('拍照失败:', error);
      Alert.alert('错误', '拍照失败: ' + (error as Error).message);
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
          Alert.alert('错误', '选择图片失败，请重试');
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
          console.warn('获取用户ID失败，使用匿名:', e);
        }

        // 准备上传参数
        const filename = `photo_${Date.now()}.jpg`;
        const mimeType = 'image/jpeg';

        console.log('开始上传相册图片到S3:', { uid, filename, mimeType, photoUri: selectedImage.uri });

        // 上传到S3
        let uploadResult;
        try {
          uploadResult = await uploadImageToS3({
            uid,
            uri: selectedImage.uri,
            filename,
            mimeType,
          });
          console.log('相册图片上传成功:', uploadResult);
        } catch (uploadError) {
          console.error('上传相册图片到S3失败:', uploadError);
          // 上传失败时，仍然使用本地URI
          Alert.alert('上传失败', '图片上传失败，将使用本地图片。错误: ' + (uploadError as Error).message);
        }

        // 处理图片上传后的导航逻辑
        navigateWithImage(uploadResult, selectedImage.uri, selectedAgent, mode, router, '相册选择导航参数');
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      Alert.alert('错误', '选择图片失败: ' + (error as Error).message);
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
                source={{ uri: selectedAgentData.backImage }}
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
                if (agent.id === 'sleep' || agent.id === 'feces') {
                  imageStyle.push(styles.agentImageSmall);
                } else if (agent.id === 'stress') {
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
                      source={{ uri: selectedAgent === agent.id ? agent.backImage : agent.frontImage }}
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
