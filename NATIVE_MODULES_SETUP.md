# Native Modules Setup Guide

## Current Issues

The errors you're seeing are related to native modules that require a development build:

1. `Cannot find native module 'ExponentAV'` - expo-av
2. `Cannot find native module 'ExpoImageManipulator'` - expo-image-manipulator
3. `RNGoogleSignin could not be found` - @react-native-google-signin/google-signin

## Why These Errors Occur

This project uses native modules that cannot run in Expo Go. You need to build and run a development client.

## Solution

### Option 1: Build Development Client Locally (Recommended)

If you have Xcode (iOS) or Android Studio (Android) installed:

```bash
# For iOS
npx expo run:ios

# For Android
npx expo run:android
```

This will build the native app with all required modules and run it on a simulator/device.

### Option 2: Build with EAS

```bash
# Install EAS CLI if you haven't
npm install -g eas-cli

# Login to Expo
eas login

# Build development client
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

### Option 3: Use Expo Development Client

```bash
# Install expo-dev-client
npx expo install expo-dev-client

# Build and run
npx expo run:ios
# or
npx expo run:android
```

## Package Versions Fixed

The following package versions have been updated to match Expo SDK 54:

- expo-router
- expo-splash-screen
- @react-native-async-storage/async-storage
- babel-preset-expo
- And other minor packages

## Next Steps

1. Choose one of the build options above
2. Wait for the build to complete
3. Run the app on your device/simulator
4. All native modules should now work correctly

## Note

The route warnings you saw are false positives - all route files have correct default exports. They will disappear once you run in a development build.
