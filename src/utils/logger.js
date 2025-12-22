import { NativeModules, Platform } from 'react-native';

const { RNLogger } = NativeModules;

const isIOS = Platform.OS === 'ios';

// 检查 RNLogger 是否可用
if (isIOS) {
  if (RNLogger) {
    console.log('[Logger] RNLogger module is available');
  } else {
    console.warn('[Logger] RNLogger module is NOT available');
  }
}

// 确保消息是字符串格式
const ensureString = (message) => {
  if (typeof message === 'string') {
    return message;
  }
  try {
    return JSON.stringify(message);
  } catch (e) {
    return String(message);
  }
};

const Logger = {
  verbose: (message) => {
    const msg = ensureString(message);
    if (__DEV__) {
      console.log('[VERBOSE]', msg);
    }
    if (isIOS && RNLogger) {
      try {
        RNLogger.verbose(msg);
      } catch (e) {
        console.error('RNLogger.verbose failed:', e);
      }
    }
  },
  debug: (message) => {
    const msg = ensureString(message);
    if (__DEV__) {
      console.log('[DEBUG]', msg);
    }
    if (isIOS && RNLogger) {
      try {
        RNLogger.debug(msg);
      } catch (e) {
        console.error('RNLogger.debug failed:', e);
      }
    }
  },
  info: (message) => {
    const msg = ensureString(message);
    if (__DEV__) {
      console.info('[INFO]', msg);
    }
    if (isIOS && RNLogger) {
      try {
        RNLogger.info(msg);
      } catch (e) {
        console.error('RNLogger.info failed:', e);
      }
    }
  },
  warn: (message) => {
    const msg = ensureString(message);
    if (__DEV__) {
      console.warn('[WARN]', msg);
    }
    if (isIOS && RNLogger) {
      try {
        RNLogger.warn(msg);
      } catch (e) {
        console.error('RNLogger.warn failed:', e);
      }
    }
  },
  error: (message) => {
    const msg = ensureString(message);
    if (__DEV__) {
      console.error('[ERROR]', msg);
    }
    if (isIOS && RNLogger) {
      try {
        RNLogger.error(msg);
      } catch (e) {
        console.error('RNLogger.error failed:', e);
      }
    }
  },
};

export default Logger;


