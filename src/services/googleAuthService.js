import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

// iOS Client ID (从 GoogleService-Info.plist 获取)
// Android 需要配置 google-services.json 文件
const IOS_CLIENT_ID = '44453409571-np85lcdtm45e57ulbqo1tg49pmbak699.apps.googleusercontent.com';

// 初始化 Google Sign-In 配置
let isConfigured = false;

/**
 * 配置 Google Sign-In
 */
function configureGoogleSignIn() {
  if (isConfigured) {
    return;
  }

  GoogleSignin.configure({
    iosClientId: IOS_CLIENT_ID,
    // Android 会自动从 google-services.json 读取配置
    webClientId: '44453409571-plsn7n3kdmlgkbi97h6hs4cf6gno3btd.apps.googleusercontent.com',
    scopes: ['email', 'profile'], // 请求的权限范围
    offlineAccess: false, // 是否请求离线访问令牌
  });

  isConfigured = true;
  console.log('Google Sign-In configured');
}

/**
 * 使用 Google Sign-In 登录，获取 thirdId (Google 唯一 ID)
 * @returns {Promise<Object|null>} 用户信息对象，包含 thirdId, email, name 等，失败返回 null
 */
export async function googleLogin() {
  try {
    // 确保已配置
    configureGoogleSignIn();

    // 尝试静默登录（如果用户之前已经登录过）
    try {
      await GoogleSignin.signInSilently();
      const userInfo = await GoogleSignin.getCurrentUser();
      
      if (userInfo) {
        console.log('User already signed in:', userInfo.user.id);
        return formatUserInfo(userInfo);
      }
    } catch (silentError) {
      // 静默登录失败是正常的，说明用户需要重新登录
      console.log('Silent sign-in failed, proceeding with normal sign-in');
    }

    // 执行登录流程
    console.log('Starting Google Sign-In...');
    const signInResult = await GoogleSignin.signIn();

    if (signInResult) {
      console.log('Google Sign-In successful signInResult', signInResult);
      return formatUserInfo(signInResult);
    }
    return null;
  } catch (error) {
    console.error('Google Sign-In error:', error);

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      console.log('User cancelled the login flow');
      return null;
    } else if (error.code === statusCodes.IN_PROGRESS) {
      console.log('Sign in is in progress already');
      throw new Error('Sign in is already in progress');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      console.log('Play services not available or outdated');
      throw new Error('Google Play Services not available. Please update Google Play Services.');
    } else {
      throw new Error(error.message || 'Google Sign-In failed');
    }
  }
}

/**
 * 格式化用户信息
 * @param {Object} signInResult - Google Sign-In 返回的结果
 * @returns {Object} 格式化后的用户信息
 */
function formatUserInfo(signInResult) {
  const user = signInResult.user;
  
  return {
    thirdId: user.id, // Google 唯一 ID (thirdId)
    googleId: user.id, // 兼容旧字段名
    email: user.email,
    name: user.name,
    givenName: user.givenName,
    familyName: user.familyName,
    photo: user.photo,
    idToken: signInResult.idToken, // ID Token（如果需要发送到后端验证）
    accessToken: signInResult.idToken || signInResult.accessToken || '', // 访问令牌（使用 idToken 作为 accessToken）
    serverAuthCode: signInResult.serverAuthCode, // 服务器授权码（如果启用了 offlineAccess）
  };
}

/**
 * 获取当前已登录的用户信息
 * @returns {Promise<Object|null>} 用户信息对象，未登录返回 null
 */
export async function getCurrentUser() {
  try {
    configureGoogleSignIn();
    
    const userInfo = await GoogleSignin.getCurrentUser();
    
    if (userInfo) {
      return formatUserInfo(userInfo);
    }
    
    return null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * 登出
 * @returns {Promise<void>}
 */
export async function googleLogout() {
  try {
    configureGoogleSignIn();
    await GoogleSignin.signOut();
    console.log('Google Sign-Out successful');
  } catch (error) {
    console.error('Google Sign-Out error:', error);
    throw error;
  }
}

/**
 * 检查是否已登录
 * @returns {Promise<boolean>}
 */
export async function isSignedIn() {
  try {
    configureGoogleSignIn();
    const isSignedIn = await GoogleSignin.isSignedIn();
    return isSignedIn;
  } catch (error) {
    console.error('Check sign in status error:', error);
    return false;
  }
}

/**
 * 完整的 Google 登录流程，返回用户信息（包含 thirdId）
 * @returns {Promise<Object|null>} 用户信息对象，失败返回 null
 */
export async function googleLoginWithUserInfo() {
  try {
    const userInfo = await googleLogin();
    return userInfo;
  } catch (error) {
    console.error('Google login with user info error:', error);
    throw error;
  }
}
