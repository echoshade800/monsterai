import {
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import * as Device from 'expo-device';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { analytics } from '../config/firebase';
import api from '../src/services/api-clients/client';
import { API_ENDPOINTS } from '../src/services/api/api';
import mobileDataManager from '../src/utils/mobile-data-manager';
import storageManager from '../src/utils/storage';

// 配置通知处理程序
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

SplashScreen.preventAutoHideAsync();

// 上传设备 Token 到服务器
async function uploadDeviceTokenToServer(deviceToken) {
  try {
    const response = await api.post(
      API_ENDPOINTS.DEVICE_TOKEN.SET,
      {
        device_token: deviceToken,
      },
      {
        requireAuth: false,
        headers: {
          'accept': 'application/json',
          // passId 会通过 getHeadersWithPassId() 自动添加
        },
      }
    );
    console.log('Device token uploaded successfully:', response);
    return true;
  } catch (error) {
    console.error('Failed to upload device token:', error);
    return false;
  }
}

// 注册推送通知
async function registerForPushNotificationsAsync() {
  let token;
  console.log('registerForPushNotificationsAsync starting execution');
  
  if (Platform.OS === 'android') {
    // Android 配置（暂时跳过）
    console.log('Android platform, skipping push notification registration');
    return null;
  }

  if (Device.isDevice) {
    console.log('Real device detected');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Current permission status:', existingStatus);
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('Requesting push notification permission');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('Permission request result:', status);
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }
    
    console.log('Getting device push token');
    try {
      token = await Notifications.getDevicePushTokenAsync();
      console.log('Push token obtained successfully:', token.data);
      return token.data; // 返回 token 字符串
    } catch (error: any) {
      console.error('Failed to get push token:', error);
      const errorMessage = error?.message || String(error);
      console.error('Error message:', errorMessage);
      
      // Check if error is related to aps-environment configuration
      if (errorMessage.includes('aps-environment') || errorMessage.includes('授权字符串')) {
        console.warn('Push notification configuration issue: aps-environment entitlement may be missing or incorrectly configured in MonsterAI.entitlements file.');
        console.warn('Please ensure the entitlements file includes: <key>aps-environment</key><string>development</string> (for dev) or <string>production</string> (for prod)');
      }
      
      return null;
    }
  } else {
    console.log('Must use a real device to register for push notifications');
    return null;
  }
}

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // 应用启动时初始化 Firebase 和注册推送通知
  useEffect(() => {
    console.log('Layout component mounted, starting initialization');
    
    // 初始化 Firebase Analytics
    const initializeAnalytics = async () => {
      try {
        await analytics().logEvent('app_open', {
          platform: Platform.OS,
        });
        console.log('Firebase Analytics initialized successfully');
      } catch (error) {
        console.error('Analytics initialization error:', error);
      }
    };
    
    initializeAnalytics();
    
    // 注册推送通知
    registerForPushNotificationsAsync().then(async token => {
      if (token) {
        console.log('Push notification registered successfully, Token:', token);
        
        // 检查用户是否已登录（是否有 passId）
        try {
          const userData = await storageManager.getUserData();
          const hasPassId = userData && userData.passId;
          
          if (hasPassId) {
            // 已登录：直接上传 device-token
            console.log('User is logged in, uploading device-token directly');
            await uploadDeviceTokenToServer(token);
            
            // 上传手机数据
            try {
              console.log('Starting mobile data upload...');
              await mobileDataManager.uploadData({ period: 'today' });
            } catch (error) {
              console.error('Failed to upload mobile data:', error);
              // 不阻塞应用启动，静默失败
            }
          } else {
            // 未登录：保存到本地
            console.log('User not logged in, saving device-token locally');
            await storageManager.setDeviceToken(token);
          }
        } catch (error) {
          console.error('Error handling device-token:', error);
          // 如果检查登录状态失败，默认保存到本地
          await storageManager.setDeviceToken(token);
        }
      } else {
        console.log('Push notification registration failed or no token obtained');
      }
    }).catch(error => {
      console.error('Error registering push notifications:', error);
    });
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="invite-code" options={{ headerShown: false }} />
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="camera" options={{ headerShown: false }} />
          <Stack.Screen name="photo-text" options={{ headerShown: false }} />
          <Stack.Screen name="under-construction" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="monster-detail" options={{ headerShown: false }} />
          <Stack.Screen name="agent-detail" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
