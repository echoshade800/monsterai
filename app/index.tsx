import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import storageManager from '../src/utils/storage';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasUserData, setHasUserData] = useState(false);

  useEffect(() => {
    const checkUserData = async () => {
      try {
        // 检查本地是否有用户信息
        const userData = await storageManager.getUserData();
        
        if (userData) {
          console.log('检测到本地用户信息，直接进入主界面');
          setHasUserData(true);
          // 重定向到主界面
          router.replace('/(tabs)');
        } else {
          console.log('未检测到本地用户信息，跳转到登录页面');
          setHasUserData(false);
          // 重定向到登录页面
          router.replace('/login');
        }
      } catch (error) {
        console.error('检查用户信息失败:', error);
        // 出错时跳转到登录页面
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkUserData();
  }, [router]);

  // 在检查期间显示加载指示器
  if (isChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  // 根据检查结果重定向（作为后备方案）
  return <Redirect href={hasUserData ? '/(tabs)' : '/login'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8D4B8',
  },
});

