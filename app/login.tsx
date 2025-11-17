import { useFocusEffect, useRouter } from 'expo-router';
import { Apple } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, BackHandler, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { appleLoginWithUserInfo } from '../src/services/appleAuthService';
import { googleLoginWithUserInfo } from '../src/services/googleAuthService';
import userService from '../src/services/userService';
import storageManager from '../src/utils/storage';

export default function LoginScreen() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  // 阻止返回手势和硬件返回键
  // 登录页面不应该允许返回，必须通过登录才能进入应用
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // 阻止返回
        return true;
      };

      // 添加返回键监听（Android）
      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => backHandler.remove();
    }, [])
  );

  /**
   * 格式化当前时间
   * @returns {string} 格式化的时间字符串 "YYYY-MM-DD HH:mm:ss +0800"
   */
  const formatDateTime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} +0800`;
  };

  /**
   * 调用后端 API 进行第三方登录
   * @param {Object} userInfo - 第三方用户信息
   * @param {string} source - 来源（google/apple）
   */
  const handleThirdPartyLogin = async (userInfo: any, source: string) => {
    const dateTime = formatDateTime();
    
    // 构建第三方登录请求数据
    const thirdPartyInfo = {
      thirdId: userInfo.thirdId,
      email: userInfo.email || '',
      avatar: userInfo.photo || userInfo.avatar || '',
      source: source,
      accessToken: userInfo.accessToken || userInfo.identityToken || userInfo.idToken || '',
      dateTime: dateTime,
    };
    
    // 调用后端 API 进行业务登录
    const loginResult: any = await userService.loginByThird(thirdPartyInfo);
    
    if (loginResult.success) {
      console.log('Backend login successful:', loginResult.data);
      
      // 保存用户数据到本地存储
      // 将 UserData 对象转换为普通对象，确保所有字段都能保存
      const userDataToSave = loginResult.data;
      let dataToStore;
      
      if (userDataToSave && typeof userDataToSave === 'object') {
        // 如果有 toJSON 方法，使用它
        if (typeof userDataToSave.toJSON === 'function') {
          dataToStore = userDataToSave.toJSON();
        } else {
          // 否则直接转换为普通对象，保留所有字段
          dataToStore = { ...userDataToSave };
        }
      } else {
        dataToStore = userDataToSave;
      }
      
      const saveSuccess = await storageManager.setUserData(dataToStore);
      
      if (saveSuccess) {
        console.log('User data saved to local storage successfully:', dataToStore);
      } else {
        console.warn('Failed to save user data to local storage');
      }
      
      // 登录成功后跳转到主页面
      router.replace('/(tabs)');
    } else {
      console.error('Backend login failed:', loginResult.message);
      Alert.alert('登录失败', loginResult.message || '后端登录失败，请重试');
    }
  };

  const handleAppleLogin = async () => {
    try {
      setIsAppleLoading(true);
      console.log('Starting Apple login...');
      
      // 1. 获取 Apple 用户信息
      const userInfo = await appleLoginWithUserInfo();
      
      if (!userInfo) {
        console.log('Apple login cancelled or failed');
        return;
      }

      console.log('Apple login successful:', userInfo);
      console.log('Third ID (Apple ID):', userInfo.thirdId);
      console.log('Email:', userInfo.email);
      console.log('Name:', userInfo.name);
      console.log('Identity Token:', userInfo.identityToken);
      
      // 2. 调用后端 API 进行业务登录
      await handleThirdPartyLogin(userInfo, 'apple');
    } catch (error) {
      console.error('Apple login error:', error);
      Alert.alert('登录失败', error.message || 'Apple 登录失败，请重试');
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      console.log('Starting Google login...');
      
      // 1. 获取 Google 用户信息
      const userInfo = await googleLoginWithUserInfo();
      
      if (!userInfo) {
        console.log('Google login cancelled or failed');
        return;
      }

      console.log('Google login successful:', {
        ...userInfo,
        thirdId: `Google ID: ${userInfo.thirdId}`,
        idToken: `ID Token: ${userInfo.idToken}`
      });
      
      // 2. 调用后端 API 进行业务登录
      await handleThirdPartyLogin(userInfo, 'google');
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('登录失败', error.message || 'Google 登录失败，请重试');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleTermsPress = () => {
    Linking.openURL('https://www.mymonster.ai/#terms');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://www.mymonster.ai/#privacy');
  };

  return (
    <View style={styles.container}>
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
          <TouchableOpacity 
            style={[styles.loginButton, isAppleLoading && styles.loginButtonDisabled]} 
            onPress={handleAppleLogin}
            disabled={isAppleLoading}
          >
            <View style={styles.buttonContent}>
              <Apple size={24} color="#000000" fill="#000000" />
              <Text style={styles.buttonText}>
                {isAppleLoading ? 'Loading...' : 'Continue with Apple'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, isGoogleLoading && styles.loginButtonDisabled]} 
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.buttonText}>
                {isGoogleLoading ? 'Loading...' : 'Continue with Google'}
              </Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
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
  loginButtonDisabled: {
    opacity: 0.6,
  },
});
