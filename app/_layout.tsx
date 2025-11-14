import { Stack } from 'expo-router/stack';
<<<<<<< HEAD
import { GestureHandlerRootView } from 'react-native-gesture-handler';

=======
// @ts-ignore - expo-splash-screen types are included in the package
import { GestureHandlerRootView } from 'react-native-gesture-handler';
>>>>>>> 63ebd74 (增加启动闪屏)

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ headerShown: false }} />
        <Stack.Screen name="photo-text" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
