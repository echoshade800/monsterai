import { Alert } from 'react-native';
import { ApiError } from '../services/api-clients/client.js';
import Logger from './logger.js';

// 获取错误消息
export const getErrorMessage = (error) => {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.code] || error.message || '操作失败';
  }
  return error.message || '操作失败';
};

// 显示错误提示
export const showError = (error, title = '错误') => {
  const message = getErrorMessage(error);
  Alert.alert(title, message);
};

// 显示成功提示
export const showSuccess = (message, title = '成功') => {
  Alert.alert(title, message);
};

// 显示确认对话框
export const showConfirm = (message, title = '确认', onConfirm, onCancel) => {
  Alert.alert(
    title,
    message,
    [
      { text: '取消', style: 'cancel', onPress: onCancel },
      { text: '确定', onPress: onConfirm },
    ]
  );
};

// 处理API错误
export const handleApiError = (error, showAlert = true) => {
  Logger.error(`API错误: ${error.message || error}`);
  
  if (showAlert) {
    showError(error);
  }
  
  return {
    success: false,
    error,
    message: getErrorMessage(error),
  };
};

// 处理API响应
export const handleApiResponse = (result, showAlert = true) => {
  if (result.success) {
    return result;
  } else {
    if (showAlert) {
      showError(result.error || new Error(result.message));
    }
    return result;
  }
};
