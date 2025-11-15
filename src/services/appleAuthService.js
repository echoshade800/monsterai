import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export async function appleLogin() {
  try {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign In is only available on iOS');
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync();

    if (!isAvailable) {
      throw new Error('Apple Sign In is not available on this device');
    }

    console.log('Starting Apple Sign-In...');

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('Apple Sign-In response:', credential);

    const {
      user,
      email,
      fullName,
      identityToken,
      authorizationCode,
    } = credential;

    const userInfo = {
      thirdId: user,
      email: email || null,
      name: fullName
        ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim()
        : null,
      givenName: fullName?.givenName || null,
      familyName: fullName?.familyName || null,
      identityToken: identityToken || null,
      authorizationCode: authorizationCode || null,
      accessToken: identityToken || '',
    };

    console.log('Apple login successful:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('Apple Sign-In error:', error);

    if (error.code === 'ERR_CANCELED') {
      console.log('User cancelled Apple login');
      return null;
    }

    throw new Error(error.message || 'Apple Sign-In failed');
  }
}

export async function getCurrentAppleUser() {
  try {
    if (Platform.OS !== 'ios') {
      return null;
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync();

    if (!isAvailable) {
      return null;
    }

    return null;
  } catch (error) {
    console.error('Get current Apple user error:', error);
    return null;
  }
}

export async function appleLoginWithUserInfo() {
  try {
    const userInfo = await appleLogin();
    return userInfo;
  } catch (error) {
    console.error('Apple login with user info error:', error);
    throw error;
  }
}
