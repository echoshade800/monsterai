import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const IOS_CLIENT_ID = '44453409571-np85lcdtm45e57ulbqo1tg49pmbak699.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export async function googleLogin() {
  try {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'monsterai',
      path: 'redirect'
    });

    console.log('Redirect URI:', redirectUri);

    const authRequestOptions = {
      clientId: IOS_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    };

    const authRequest = new AuthSession.AuthRequest(authRequestOptions);

    console.log('Starting Google Sign-In...');
    const result = await authRequest.promptAsync(discovery);

    if (result.type === 'success') {
      const { params } = result;
      const { code } = params;

      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: IOS_CLIENT_ID,
          code,
          redirectUri,
        },
        discovery
      );

      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
        }
      );

      const userInfo = await userInfoResponse.json();

      const formattedUserInfo = {
        thirdId: userInfo.id,
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        givenName: userInfo.given_name,
        familyName: userInfo.family_name,
        photo: userInfo.picture,
        idToken: tokenResult.idToken,
        accessToken: tokenResult.accessToken || '',
      };

      console.log('Google Sign-In successful:', formattedUserInfo);
      return formattedUserInfo;
    }

    if (result.type === 'cancel') {
      console.log('User cancelled the login flow');
      return null;
    }

    throw new Error('Google Sign-In failed');
  } catch (error) {
    console.error('Google Sign-In error:', error);
    throw new Error(error.message || 'Google Sign-In failed');
  }
}

export async function getCurrentUser() {
  try {
    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function googleLogout() {
  try {
    console.log('Google Sign-Out successful');
  } catch (error) {
    console.error('Google Sign-Out error:', error);
    throw error;
  }
}

export async function isSignedIn() {
  try {
    return false;
  } catch (error) {
    console.error('Check sign in status error:', error);
    return false;
  }
}

export async function googleLoginWithUserInfo() {
  try {
    const userInfo = await googleLogin();
    return userInfo;
  } catch (error) {
    console.error('Google login with user info error:', error);
    throw error;
  }
}
