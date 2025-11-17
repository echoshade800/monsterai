import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CURRENT_ENV, ENV, getBaseUrl, getHeadersWithPassId } from '../src/services/api/api';

export default function InviteCodeScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Please enter an invite code.');
      return;
    }

    const trimmedCode = code.trim();
    
    // 测试环境下，1111 为通用邀请码，方便快速登录
    if (CURRENT_ENV === ENV.DEVELOPMENT && trimmedCode === '1111') {
      console.log('测试环境：使用通用邀请码 1111，直接通过验证');
      router.replace('/(tabs)');
      return;
    }

    setLoading(true);
    try {
      // 获取包含 passId 的 headers
      const headersWithPassId = await getHeadersWithPassId();
      
      // 构建请求 URL
      const baseUrl = getBaseUrl('default');
      const inviteUrl = `${baseUrl}/invite-code/use?code=${encodeURIComponent(trimmedCode)}`;
      console.log('邀请码验证地址:', inviteUrl);
      
      const response = await fetch(inviteUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();
      console.log('邀请码验证响应:', data);
      // 当 code 为 0 时表示验证成功
      if (data.code === 0) {
        // 验证成功，直接进入聊天页面
        router.replace('/(tabs)');
      } else {
        alert(data.msg || 'Invalid invite code. Please try again.');
      }
    } catch (error) {
      console.error('Invite code request error:', error);
      alert('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNotYet = () => {
    router.push('/under-construction');
  };

  const handleSkip = () => {
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipButtonText}>Skip</Text>
      </TouchableOpacity>

      <Image
        source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/linker/dim.png' }}
        style={styles.background}
      />

      <View style={styles.content}>
        <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.title}>Enter Your Invite Code</Text>

          <TextInput
            style={styles.input}
            placeholder=""
            placeholderTextColor="#B0B0B0"
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.notYetButton]}
              onPress={handleNotYet}
            >
              <Text style={styles.notYetButtonText}>Not yet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.helperText}>
            Please enter the invitation code{'\n'}to unlock access.
          </Text>
        </View>
      </View>
      </View>
    </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  card: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 28,
    backgroundColor: 'rgba(235, 235, 235, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  cardContent: {
    padding: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 28,
  },
  input: {
    width: '100%',
    height: 58,
    backgroundColor: '#F5F5F5',
    borderRadius: 29,
    paddingHorizontal: 24,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 20,
    borderWidth: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notYetButton: {
    backgroundColor: '#C8C8C8',
  },
  notYetButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#5A5A5A',
  },
  submitButton: {
    backgroundColor: '#000000',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  helperText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
});

