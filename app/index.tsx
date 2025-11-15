import { Redirect } from 'expo-router';

export default function Index() {
  // 应用启动时重定向到登录页面
  return <Redirect href="/login" />;
}

