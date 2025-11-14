import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { InviteCodeModal } from '../components/InviteCodeModal';

export default function LoginScreen() {
  const router = useRouter();
  const [showInviteModal, setShowInviteModal] = useState(true);
  const [hasValidCode, setHasValidCode] = useState(false);

  const handleValidCode = () => {
    setShowInviteModal(false);
    setHasValidCode(true);
  };

  const handleNotYet = () => {
    setShowInviteModal(false);
    router.push('/under-construction');
  };

  const handleAppleLogin = () => {
    console.log('Apple login pressed');
  };

  const handleGoogleLogin = () => {
    console.log('Google login pressed');
  };

  const handleTermsPress = () => {
    Linking.openURL('https://example.com/terms');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://example.com/privacy');
  };

  const handleSkip = () => {
    router.push('/(tabs)');
  };

  return (
    <>
      <InviteCodeModal
        visible={showInviteModal}
        onValidCode={handleValidCode}
        onNotYet={handleNotYet}
      />
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>
      <Image
        source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/linker/dim.png' }}
        style={styles.background}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/icon.png' }}
            style={styles.appIcon}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Monster AI</Text>
          <Text style={styles.tagline}>Your personal agent store</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.loginButton} onPress={handleAppleLogin}>
            <View style={styles.buttonContent}>
              <Text style={styles.iconText}></Text>
              <Text style={styles.buttonText}>Continue with Apple</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleGoogleLogin}>
            <View style={styles.buttonContent}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.buttonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.legalContainer}>
          <Text style={styles.legalText}>
            By signing up,you agree to our{'\n'}
            <Text style={styles.link} onPress={handleTermsPress}>
              Terms of service
            </Text>
            {' '}and{' '}
            <Text style={styles.link} onPress={handlePrivacyPress}>
              Privacy policy
            </Text>
          </Text>
        </View>
      </View>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B8A892',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 160,
    paddingBottom: 80,
    paddingHorizontal: 32,
  },
  header: {
    alignItems: 'center',
  },
  appIcon: {
    width: 160,
    height: 160,
    marginBottom: 28,
  },
  appName: {
    fontSize: 38,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  buttonContainer: {
    gap: 18,
    paddingHorizontal: 8,
  },
  loginButton: {
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  iconText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  googleIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4285F4',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  legalContainer: {
    paddingHorizontal: 16,
  },
  legalText: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  link: {
    textDecorationLine: 'underline',
    color: '#1A1A1A',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
