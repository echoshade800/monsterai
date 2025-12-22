import { NativeModules, Platform } from 'react-native';

const { RNLogger } = NativeModules;

const isIOS = Platform.OS === 'ios';

const Logger = {
  verbose: (message) => {
    if (__DEV__) {
      console.log('[VERBOSE]', message);
    }
    if (isIOS && RNLogger) {
      RNLogger.verbose(message);
    }
  },
  debug: (message) => {
    if (__DEV__) {
      console.log('[DEBUG]', message);
    }
    if (isIOS && RNLogger) {
      RNLogger.debug(message);
    }
  },
  info: (message) => {
    if (__DEV__) {
      console.info('[INFO]', message);
    }
    if (isIOS && RNLogger) {
      RNLogger.info(message);
    }
  },
  warn: (message) => {
    if (__DEV__) {
      console.warn('[WARN]', message);
    }
    if (isIOS && RNLogger) {
      RNLogger.warn(message);
    }
  },
  error: (message) => {
    if (__DEV__) {
      console.error('[ERROR]', message);
    }
    if (isIOS && RNLogger) {
      RNLogger.error(message);
    }
  },
};

export default Logger;


