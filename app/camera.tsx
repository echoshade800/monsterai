import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Image, ScrollView } from 'react-native';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { useState, useRef } from 'react';
import { ChevronLeft, Image as ImageIcon, Flashlight, SwitchCamera, Check } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';

const AGENTS = [
  {
    id: 'energy',
    name: 'Energy',
    frontImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/energy.png',
    backImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/back%20energy.png',
    prompt: "Capture your energy levels—let's see how ready you are to conquer the day!",
  },
  {
    id: 'face',
    name: 'Face',
    frontImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/face.png',
    backImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/back%20face.png',
    prompt: "Snap a selfie and check your skin's health—let's analyze your glow!",
  },
  {
    id: 'posture',
    name: 'Posture',
    frontImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/posture.png',
    backImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/back%20posture.png',
    prompt: "Time to check your posture! Snap a pic and see if you're standing tall.",
  },
  {
    id: 'sleep',
    name: 'Sleep',
    frontImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/sleep.png',
    backImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/back%20sleep.png',
    prompt: "Capture your sleeping environment or your pre-sleep mood—let's get you rested.",
  },
  {
    id: 'stress',
    name: 'Stress',
    frontImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/stress.png',
    backImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/back%20stress.png',
    prompt: "Feeling the pressure? Let's check in on your stress—take a photo to measure it.",
  },
  {
    id: 'feces',
    name: 'Feces',
    frontImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/feces.png',
    backImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/back%20feces.png',
    prompt: "Let's see your health from another angle—snap a pic and track your gut health.",
  },
  {
    id: 'steward',
    name: 'Steward',
    frontImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/steward.png',
    backImage: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/back%20steward.png',
    prompt: 'Take any pictures you want',
  },
];

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'photo' | 'photo-text'>('photo');
  const [selectedAgent, setSelectedAgent] = useState<string>('steward');
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

  async function takePicture() {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });

      if (mode === 'photo-text') {
        router.push({
          pathname: '/photo-text',
          params: { photoUri: photo?.uri, agentId: selectedAgent }
        });
      } else {
        console.log('Photo taken:', photo);
        router.back();
      }
    }
  }

  async function openGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (mode === 'photo-text') {
        router.push({
          pathname: '/photo-text',
          params: { photoUri: result.assets[0].uri, agentId: selectedAgent }
        });
      } else {
        console.log('Image selected:', result.assets[0]);
        router.back();
      }
    }
  }

  function toggleFlash() {
    setTorchEnabled(current => !current);
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const selectedAgentData = AGENTS.find(a => a.id === selectedAgent) || AGENTS[6];

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

            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <Image
                source={{ uri: selectedAgentData.backImage }}
                style={styles.captureImage}
              />
              <View style={styles.captureOverlay}>
                <View style={styles.cameraIconContainer}>
                  <View style={styles.cameraIconOuter}>
                    <View style={styles.cameraIconInner} />
                  </View>
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
              {AGENTS.map((agent) => (
                <TouchableOpacity
                  key={agent.id}
                  style={styles.agentButton}
                  onPress={() => setSelectedAgent(agent.id)}
                >
                  <Image
                    source={{ uri: selectedAgent === agent.id ? agent.backImage : agent.frontImage }}
                    style={styles.agentImage}
                  />
                  {selectedAgent === agent.id && (
                    <View style={styles.checkmarkContainer}>
                      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
                      <Check size={20} color="#000" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
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
    backdropFilter: 'blur(20px)',
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
    marginTop: 140,
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
    gap: -90,
  },
  agentButton: {
    width: 140,
    height: 140,
    position: 'relative',
  },
  agentImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
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
    top: 10,
    right: 10,
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
    bottom: Platform.OS === 'ios' ? 160 : 150,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
