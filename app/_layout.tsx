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

// 注册推送通知
async function registerForPushNotificationsAsync() {
  let token;
  console.log('registerForPushNotificationsAsync 开始执行');
  
  if (Platform.OS === 'android') {
    // Android 配置（暂时跳过）
    console.log('Android 平台，跳过推送通知注册');
    return null;
  }

  if (Device.isDevice) {
    console.log('检测到真实设备');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('当前权限状态:', existingStatus);
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('请求推送通知权限');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('权限请求结果:', status);
    }
    
    if (finalStatus !== 'granted') {
      console.log('推送通知权限未授予');
      return null;
    }
    
    console.log('获取设备推送 Token');
    try {
      token = await Notifications.getDevicePushTokenAsync();
      console.log('推送 Token 获取成功:', token.data);
      return token.data; // 返回 token 字符串
    } catch (error) {
      console.error('获取推送 Token 失败:', error);
      console.error('错误信息:', error.message);
      return null;
    }
  } else {
    console.log('必须使用真实设备才能注册推送通知');
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
    console.log('Layout 组件已挂载，开始初始化');
    
    // 初始化 Firebase Analytics
    const initializeAnalytics = async () => {
      try {
        await analytics().logEvent('app_open', {
          platform: Platform.OS,
        });
        console.log('Firebase Analytics 初始化成功');
      } catch (error) {
        console.error('Analytics 初始化错误:', error);
      }
    };
    
    initializeAnalytics();
    
    // 注册推送通知
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('推送通知注册成功，Token:', token);
        // 这里可以将 token 保存到服务器或本地存储
      } else {
        console.log('推送通知注册失败或未获取到 Token');
      }
    }).catch(error => {
      console.error('注册推送通知时发生错误:', error);
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
