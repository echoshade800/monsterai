import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, BackHandler, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import api from '../src/services/api-clients/client';
import { API_ENDPOINTS } from '../src/services/api/api';
import { appleLoginWithUserInfo } from '../src/services/appleAuthService';
import { googleLoginWithUserInfo } from '../src/services/googleAuthService';
import userService from '../src/services/userService';
import storageManager from '../src/utils/storage';

// SVG content for icons
const AppleIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" id="Apple--Streamline-Font-Awesome" height="16" width="16">
  <desc>
    Apple Streamline Icon: https://streamlinehq.com
  </desc>
  <path d="M12.428304166666665 8.446008333333332c-0.007 -1.2847333333333333 0.5741041666666666 -2.2544125 1.7503208333333333 -2.968541666666667 -0.6581208333333333 -0.9416708333333333 -1.6522999999999999 -1.4597666666666664 -2.9650416666666666 -1.5612833333333331 -1.2427249999999999 -0.09801666666666665 -2.6009708333333332 0.7246333333333334 -3.0980624999999997 0.7246333333333334 -0.5250958333333333 0 -1.7293125 -0.6896249999999999 -2.6744875 -0.6896249999999999 -1.9533541666666665 0.031504166666666666 -4.029233333333333 1.5577833333333333 -4.029233333333333 4.662845833333333q0 1.37575 0.5040916666666666 2.8425166666666666c0.4480833333333333 1.2847333333333333 2.0653791666666663 4.435308333333333 3.7526833333333336 4.382795833333333 0.8821625 -0.020999999999999998 1.5052750000000001 -0.6266125 2.653483333333333 -0.6266125 1.1132041666666666 0 1.6908083333333332 0.6266125 2.6744875 0.6266125 1.7013083333333334 -0.024504166666666664 3.1645749999999997 -2.888025 3.591654166666667 -4.176258333333333 -2.2824166666666663 -1.0746958333333332 -2.159895833333333 -3.150570833333333 -2.159895833333333 -3.217083333333333ZM10.446945833333332 2.6979624999999996c0.9556749999999999 -1.1342083333333333 0.8681583333333333 -2.1668958333333332 0.8401541666666665 -2.5379625 -0.8436541666666666 0.04900833333333333 -1.8203333333333334 0.5741041666666666 -2.376933333333333 1.2217208333333334 -0.6126125 0.6931291666666667 -0.9731791666666667 1.5507833333333334 -0.8961625 2.516958333333333 0.9136666666666666 0.07001249999999999 1.7468166666666667 -0.3990708333333333 2.4329416666666663 -1.2007166666666667Z" fill="#000000" stroke-width="0.0417"></path>
</svg>`;

const GoogleIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" id="Google-Icon--Streamline-Svg-Logos" height="24" width="24">
  <desc>
    Google Icon Streamline Icon: https://streamlinehq.com
  </desc>
  <path fill="#4285f4" d="M23.5151 12.2611c0 -0.9661 -0.0784 -1.6711 -0.24805 -2.4022H12.2351v4.3605h6.4755c-0.1305 1.08365 -0.8355 2.7156 -2.4022 3.8122l-0.02195 0.146 3.4881 2.702175 0.24165 0.024125c2.2194 -2.04975 3.4989 -5.0656 3.4989 -8.6428Z" stroke-width="0.25"></path>
  <path fill="#34a853" d="M12.234975 23.75c3.17245 0 5.83575 -1.0445 7.7811 -2.8461L16.308275 18.031625c-0.9922 0.69195 -2.3239 1.175 -4.0733 1.175 -3.1072 0 -5.7444 -2.049675 -6.6845 -4.882725l-0.137775 0.0117L1.7857125 17.14255l-0.0474325 0.13185C3.670475 21.112725 7.639375 23.75 12.234975 23.75Z" stroke-width="0.25"></path>
  <path fill="#fbbc05" d="M5.550625 14.3239c-0.248075 -0.7311 -0.391625 -1.5145 -0.391625 -2.3239 0 -0.8095 0.143575 -1.5928 0.378575 -2.3239l-0.006575 -0.1557L1.858565 6.66835l-0.120155 0.05715C0.9420575 8.3183 0.4851075 10.10695 0.4851075 12c0 1.89305 0.45695 3.6816 1.2533025 5.2744l3.812215 -2.9505Z" stroke-width="0.25"></path>
  <path fill="#eb4335" d="M12.234975 4.7933c2.20635 0 3.69465 0.95305 4.5433 1.7495L20.094375 3.305C18.057775 1.41195 15.407425 0.25 12.234975 0.25 7.639375 0.25 3.670475 2.8872 1.73828 6.7255L5.537425 9.6761c0.95315 -2.83305 3.59035 -4.8828 6.69755 -4.8828Z" stroke-width="0.25"></path>
</svg>`;

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
      
      // 登录成功后，更新用户信息
      try {
        const updateResult = await userService.updateUserInfoAfterLogin(dataToStore);
        console.log('User info update result:', updateResult);
        if (updateResult.success) {
          console.log('User info updated successfully:', updateResult.data);
        } else {
          console.warn('Failed to update user info:', updateResult.message);
          // 更新失败不影响后续流程，继续执行
        }
      } catch (error) {
        console.error('Error updating user info:', error);
        // 更新失败不影响后续流程，继续执行
      }
      
      // 登录成功后，上传本地保存的 device-token（如果有）
      try {
        const localDeviceToken = await storageManager.getDeviceToken();
        if (localDeviceToken) {
          console.log('Detected locally saved device-token, starting upload');
          try {
            const response = await api.post(
              API_ENDPOINTS.DEVICE_TOKEN.SET,
              {
                device_token: localDeviceToken,
              },
              {
                requireAuth: false,
                headers: {
                  'accept': 'application/json',
                  // passId 会通过 getHeadersWithPassId() 自动添加
                },
              }
            );
            console.log('Local device-token uploaded successfully:', response);
            // 上传成功后，清除本地保存的 token
            await storageManager.clearDeviceToken();
          } catch (error) {
            console.error('Failed to upload local device-token:', error);
            // 上传失败不影响后续流程，继续执行
          }
        } else {
          console.log('No locally saved device-token');
        }
      } catch (error) {
        console.error('Error getting local device-token:', error);
        // 获取失败不影响后续流程，继续执行
      }
      
      // 登录成功后，获取用户状态信息，检查是否有邀请码
      try {
        const statusResult = await userService.getUserStatusInfo();
        
        if (statusResult.success && statusResult.data) {
          // 检查响应中是否有 invite_code 字段
          // invite_code 是一个对象 {code: "...", ctime: "..."}
          const inviteCode = statusResult.data.invite_code;
          const hasInviteCode = inviteCode && 
                                typeof inviteCode === 'object' && 
                                inviteCode.code;
          
          if (hasInviteCode) {
            // 如果有邀请码，直接进入 home 页面
            console.log('Invite code detected, entering home page directly:', inviteCode);
            router.replace('/(tabs)/home');
          } else {
            // 如果没有邀请码，进入邀请码页面
            console.log('No invite code detected, entering invite code page');
            router.replace('/invite-code');
          }
        } else {
          // 如果获取状态信息失败，默认进入邀请码页面
          console.warn('Failed to get user status info, entering invite code page:', statusResult.message);
          router.replace('/invite-code');
        }
      } catch (error) {
        // 如果调用状态API出错，默认进入邀请码页面
        console.error('Error getting user status info:', error);
        router.replace('/invite-code');
      }
    } else {
      console.error('Backend login failed:', loginResult.message);
      Alert.alert('Login Failed', loginResult.message || 'Backend login failed, please try again');
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
      Alert.alert('Login Failed', error.message || 'Apple login failed, please try again');
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
      Alert.alert('Login Failed', error.message || 'Google login failed, please try again');
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
        source={require('../assets/images/dim.png')}
        style={styles.background}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require('../assets/images/icon.png')}
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
              <SvgXml
                xml={AppleIconSvg}
                width={24}
                height={24}
              />
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
              <SvgXml
                xml={GoogleIconSvg}
                width={24}
                height={24}
              />
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
  },
  appName: {
    fontSize: 38,
    color: '#FFFFFF',
    marginBottom: 8,
    fontFamily: 'Nunito_800ExtraBold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'Nunito_500Medium',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
  icon: {
    width: 24,
    height: 24,
  },
});
