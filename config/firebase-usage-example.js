/**
 * React Native Firebase 使用示例
 * 
 * 本项目使用 @react-native-firebase 原生模块
 */

import analytics from '@react-native-firebase/analytics';
import * as Notifications from 'expo-notifications';

// ==================== Analytics 使用示例 ====================

/**
 * 记录自定义事件
 */
export async function logAnalyticsEvent(eventName, params = {}) {
  try {
    await analytics().logEvent(eventName, params);
    console.log('Analytics event logged:', eventName, params);
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

/**
 * 设置用户属性
 */
export async function setUserProperty(name, value) {
  try {
    await analytics().setUserProperty(name, value);
    console.log('User property set:', name, value);
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

/**
 * 设置用户 ID
 */
export async function setUserId(userId) {
  try {
    await analytics().setUserId(userId);
    console.log('User ID set:', userId);
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

/**
 * 记录屏幕浏览事件
 */
export async function logScreenView(screenName, screenClass) {
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass,
    });
    console.log('Screen view logged:', screenName);
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

// ==================== Push Notifications 使用示例 ====================

/**
 * 获取推送通知 token
 */
export async function getPushToken() {
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'monsterai-20727',
    });
    return token.data;
  } catch (error) {
    console.error('Get push token error:', error);
    throw error;
  }
}

/**
 * 发送本地通知
 */
export async function sendLocalNotification(title, body, data = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // 立即发送
    });
    
    // 记录 Analytics 事件
    await analytics().logEvent('notification_sent', {
      title,
    });
    
    console.log('Local notification sent:', title);
  } catch (error) {
    console.error('Send notification error:', error);
    throw error;
  }
}

/**
 * 取消所有通知
 */
export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
  } catch (error) {
    console.error('Cancel notifications error:', error);
  }
}

