import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import storageManager from '../src/utils/storage';

export default function Index() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // 检查用户是否已登录
        const userData = await storageManager.getUserData();
        const hasPassId = userData && userData.passId;
        
        if (hasPassId) {
          // 已登录，跳转到 home 页面
          console.log('User is logged in, redirecting to home');
          router.replace('/(tabs)/home');
        } else {
          // 未登录，跳转到登录页面
          console.log('User not logged in, redirecting to login');
          router.replace('/login');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        // 出错时默认跳转到登录页面
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkLoginStatus();
  }, [router]);

  // 在检查登录状态时显示加载指示器
  if (isChecking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F1EF',
  },
});
