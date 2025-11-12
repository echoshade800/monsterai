import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { analytics, auth } from './config/firebase';

// 配置通知处理程序
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // 初始化 Firebase Analytics
    initializeAnalytics();
    
    // 监听认证状态
    const unsubscribe = auth().onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        console.log('User logged in:', user.uid);
        analytics().setUserId(user.uid);
      }
    });
    
    // 注册推送通知
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        console.log('Expo Push Token:', token);
      }
    });

    return () => unsubscribe();
  }, []);

  // 初始化 Analytics
  const initializeAnalytics = async () => {
    try {
      await analytics().logEvent('app_open', {
        platform: Platform.OS,
      });
      console.log('Firebase Analytics initialized');
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  // 注册推送通知
  async function registerForPushNotificationsAsync() {
    let token;
    console.log('registerForPushNotificationsAsync');
    if (Platform.OS === 'android') {
      // Android 配置（暂时跳过）
      return null;
    }

    if (Device.isDevice) {
      console.log('Device.isDevice');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('getPermissionsAsync', existingStatus);
      let finalStatus = existingStatus;
      console.log('finalStatus', finalStatus);
      if (existingStatus !== 'granted') {
        console.log('requestPermissionsAsync');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token!');
        return null;
      }
      console.log('getDevicePushTokenAsync');
      try {
        token = await Notifications.getDevicePushTokenAsync();
        console.log('getDevicePushTokenAsync success:', token);
        console.log('Token data:', token.data);
        return token.data; // 返回 token 字符串
      } catch (error) {
        console.error('Error getting push token:', error);
        console.error('Error message:', error.message);
        return null;
      }
    } else {
      console.log('Must use physical device for Push Notifications');
      return null;
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔥 Firebase 已初始化</Text>
      
      <Text style={styles.subtitle}>Auth: {user ? `已登录 (${user.email || user.uid})` : '未登录'}</Text>
      <Text style={styles.subtitle}>Analytics: ✅ 已配置</Text>
      <Text style={styles.subtitle}>Push: {expoPushToken ? `✅ 已注册` : '⏳ 注册中...'}</Text>
      {expoPushToken ? (
        <Text style={styles.tokenText} numberOfLines={3} ellipsizeMode="middle">
          Token: {expoPushToken}
        </Text>
      ) : null}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  tokenText: {
    marginTop: 10,
    fontSize: 12,
    color: '#333',
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    maxWidth: '90%',
  },
});
