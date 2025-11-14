import { Stack } from 'expo-router/stack';
<<<<<<< HEAD
import { GestureHandlerRootView } from 'react-native-gesture-handler';

=======
// @ts-ignore - expo-splash-screen types are included in the package
import { GestureHandlerRootView } from 'react-native-gesture-handler';
<<<<<<< HEAD
>>>>>>> 63ebd74 (增加启动闪屏)
=======
import { SafeAreaProvider } from 'react-native-safe-area-context';
>>>>>>> 5bb3131 (tmp)

export default function Layout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="camera" options={{ headerShown: false }} />
          <Stack.Screen name="photo-text" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
