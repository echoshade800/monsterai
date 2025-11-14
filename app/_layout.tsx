import { FiraCode_400Regular, FiraCode_600SemiBold, useFonts } from '@expo-google-fonts/fira-code';
import { Stack } from 'expo-router/stack';
<<<<<<< HEAD
import { GestureHandlerRootView } from 'react-native-gesture-handler';
=======
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync();
>>>>>>> 6c5ea98 (add image_detection_type)

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
