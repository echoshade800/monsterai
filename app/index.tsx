import { Redirect } from 'expo-router';

export default function Index() {
  // 应用启动时重定向到邀请码页面
  return <Redirect href="/invite-code" />;
}

