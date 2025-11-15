import appleAuth from '@invertase/react-native-apple-authentication';

/**
 * 使用 Apple 登录，获取 thirdId (Apple 唯一 ID)
 * @returns {Promise<Object|null>} 用户信息对象，包含 thirdId, email, name 等，失败返回 null
 */
export async function appleLogin() {
  try {
    // 检查 Apple 登录是否可用（仅 iOS 13+ 支持）
    // isSupported 是一个同步属性，不是函数
    const isAvailable = appleAuth.isSupported;
    
    if (!isAvailable) {
      throw new Error('Apple Sign In is not available on this device');
    }

    console.log('Starting Apple Sign-In...');
    
    // 执行 Apple 登录请求
    // 使用数字常量：LOGIN = 0, FULL_NAME = 0, EMAIL = 1
    // 如果 appleAuth.Operation 不存在，直接使用数字值
    const Operation = appleAuth.Operation || { LOGIN: 0 };
    const Scope = appleAuth.Scope || { FULL_NAME: 0, EMAIL: 1 };
    
    const response = await appleAuth.performRequest({
      requestedOperation: Operation.LOGIN,
      requestedScopes: [
        Scope.FULL_NAME,
        Scope.EMAIL,
      ],
    });

    console.log('Apple Sign-In response:', response);

    const {
      user,                // Apple 的 UID（thirdId）
      email,               // 仅首次登录会返回
      fullName,
      identityToken,       // JWT，可送回服务器做验证
      authorizationCode,   // 带给你服务器换取 token
    } = response;

    // 格式化用户信息
    const userInfo = {
      thirdId: user, // Apple 唯一 ID (thirdId)
      email: email || null,
      name: fullName 
        ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() 
        : null,
      givenName: fullName?.givenName || null,
      familyName: fullName?.familyName || null,
      identityToken: identityToken || null,
      authorizationCode: authorizationCode || null,
      accessToken: identityToken || '', // 使用 identityToken 作为 accessToken
    };

    console.log('Apple login successful:', userInfo);
    return userInfo;
  } catch (error) {
    console.error('Apple Sign-In error:', error);

    // 用户取消登录
    // 错误码 1001 表示用户取消
    const Error = appleAuth.Error || { CANCELED: 1001 };
    if (error.code === Error.CANCELED || error.code === 1001) {
      console.log('User cancelled Apple login');
      return null;
    }

    // 其他错误
    throw new Error(error.message || 'Apple Sign-In failed');
  }
}

/**
 * 获取当前已登录的 Apple 用户信息
 * @returns {Promise<Object|null>} 用户信息对象，未登录返回 null
 */
export async function getCurrentAppleUser() {
  try {
    // isSupported 是一个同步属性，不是函数
    const isAvailable = appleAuth.isSupported;
    
    if (!isAvailable) {
      return null;
    }

    // 注意：getCredentialStateForUser 需要传入 user ID
    // 如果没有保存的 user ID，无法检查状态
    // 这里暂时返回 null，实际使用时需要保存 user ID
    
    return null;
  } catch (error) {
    console.error('Get current Apple user error:', error);
    return null;
  }
}

/**
 * 完整的 Apple 登录流程，返回用户信息（包含 thirdId）
 * @returns {Promise<Object|null>} 用户信息对象，失败返回 null
 */
export async function appleLoginWithUserInfo() {
  try {
    const userInfo = await appleLogin();
    return userInfo;
  } catch (error) {
    console.error('Apple login with user info error:', error);
    throw error;
  }
}

