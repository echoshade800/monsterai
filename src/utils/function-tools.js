/**
 * AI Function Tools 定义和实现
 * 用于AI对话中的函数调用功能
 */
import * as Calendar from 'expo-calendar';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {
  NativeModules,
} from 'react-native';
import BrokenHealthKit from "react-native-health";
import { getBaseUrl, getHeadersWithPassId } from '../services/api/api.js';
import healthDataManager, { TimePeriod } from './health-data-manager.js';
import storageManager from './storage.js';
const AppleHealthKit = NativeModules.AppleHealthKit;

// Only set Constants if AppleHealthKit is available
if (AppleHealthKit && BrokenHealthKit.Constants) {
  AppleHealthKit.Constants = BrokenHealthKit.Constants;
}


// ==================== 工具函数实现 ====================

/**
 * 上传图片到 S3
 * @param {Object} params - 参数对象
 * @param {string} params.uid - 用户ID
 * @param {string} params.uri - 图片URI
 * @param {string} params.filename - 文件名
 * @param {string} params.mimeType - MIME类型
 * @returns {Promise<Object>} 上传结果，包含 bucket, key, presigned_url, s3_uri
 */
export const uploadImageToS3 = async ({ uid, uri, filename, mimeType }) => {
  console.log('=== uploadImageToS3 开始 ===');
  console.log('Parameters:', { uid, uri, filename, mimeType });
  
  // 图片压缩配置
  const MAX_WIDTH = 1000; // 最大宽度（保持宽高比）
  const COMPRESS_QUALITY = 0.7; // 压缩质量（0-1，0.8 表示 80% 质量）
  
  let processedUri = uri;
  let processedMimeType = mimeType || 'image/jpeg';
  let processedFilename = filename || 'upload.jpg';
  
  try {
    console.log('Starting to compress image...');
    // 压缩图片
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [
        // 调整大小：如果宽度超过 MAX_WIDTH，则按比例缩小
        { resize: { width: MAX_WIDTH } },
      ],
      {
        compress: COMPRESS_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG, // 统一转换为 JPEG 格式以减小文件大小
      }
    );
    console.log('Image compression result:', manipResult);
    processedUri = manipResult.uri;
    processedMimeType = 'image/jpeg';
    // 如果原文件名不是 .jpg 或 .jpeg，则更新扩展名
    if (processedFilename && !processedFilename.match(/\.(jpg|jpeg)$/i)) {
      processedFilename = processedFilename.replace(/\.[^.]+$/, '.jpg');
    }
    
    console.log('Image compression completed:', {
      originalURI: uri,
      compressedURI: processedUri,
      originalSize: 'Unknown',
      compressedSize: manipResult.width + 'x' + manipResult.height,
    });
  } catch (error) {
    console.warn('Image compression failed, using original image:', error);
    // 如果压缩失败，继续使用原始图片
  }
  
  const form = new FormData();
  form.append('uid', uid);
  form.append('file', { 
    uri: processedUri, 
    name: processedFilename, 
    type: processedMimeType
  });
  
  console.log('FormData 已创建');
  
  // 获取包含 passId 的 headers
  const headersWithPassId = await getHeadersWithPassId();
  console.log('Headers obtained:', headersWithPassId);
  
  // 使用 API 配置中的 BASE_URL
  const baseUrl = getBaseUrl('default');
  const uploadUrl = `${baseUrl}/upload/image`;
  console.log('Upload URL:', uploadUrl);
  
  try {
    console.log('Starting to send request...');
    const resp = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        passId: headersWithPassId.passId,
        // 不要手动设置 Content-Type，交给 fetch 处理 multipart 边界
      },
      body: form,
    });

    console.log('Response status:', resp.status, resp.statusText);
    console.log('Response headers:', resp.headers);

    const json = await resp.json();
    console.log('upload image to s3 response:', JSON.stringify(json, null, 2));
    
    if (!resp.ok) {
      console.error('Upload failed, response content:', json);
      throw new Error(json?.detail || json?.message || 'Upload failed');
    }
    
    console.log('=== uploadImageToS3 成功 ===');
    return json.data;
  } catch (error) {
    console.error('=== uploadImageToS3 失败 ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

/**
 * 拍照功能
 * @param {Object} args - 参数对象
 * @param {string} args.purpose - 拍照目的（可选）
 * @returns {Promise<string>} 拍照结果信息
 */
export const takePhoto = async (args) => {
  console.log('Starting photo capture function:', args);
  
  try {
    // 请求相机权限
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    
    if (cameraPermission.status !== 'granted') {
      return '❌ Camera permission denied, cannot take photo';
    }
    
    // 启动相机拍照
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
    });
    
    if (result.canceled) {
      return '📷 User cancelled photo capture';
    }
    
    if (result.assets && result.assets.length > 0) {
      const photo = result.assets[0];
      const purpose = args.purpose || 'Record';
      
      try {
        // 获取用户ID
        let uid = 'anonymous';
        try {
          const userData = await storageManager.getUserData();
          if (userData) {
            const info = userData.toJSON ? userData.toJSON() : userData;
            if (info && (info.uid || info.id)) {
              uid = String(info.uid || info.id);
            }
          }
        } catch (e) {
          console.warn('Failed to get user ID, using anonymous:', e);
        }
        
        // 准备上传参数
        const filename = photo.fileName || `photo_${Date.now()}.jpg`;
        const mimeType = photo.mimeType || 'image/jpeg';
        
        console.log('Starting to upload photo to S3:', { uid, filename, mimeType });
        
        // 上传到S3
        const uploadResult = await uploadImageToS3({
          uid,
          uri: photo.uri,
          filename,
          mimeType,
        });
        
        console.log('Photo uploaded successfully:', uploadResult);
        
        // 返回包含S3 URL的结果
        const imageUrl = uploadResult.presigned_url || uploadResult.s3_uri || '';
        
        return JSON.stringify({
          success: true,
          purpose: purpose,
          fileSize: Math.round(photo.fileSize / 1024),
          width: photo.width,
          height: photo.height,
          timestamp: new Date().toLocaleString(),
          imageUrl: imageUrl,
          bucket: uploadResult.bucket,
          key: uploadResult.key,
          message: `📷 Photo captured successfully\nPurpose: ${purpose}\nFile size: ${Math.round(photo.fileSize / 1024)}KB\nDimensions: ${photo.width} x ${photo.height}\nCapture time: ${new Date().toLocaleString()}\nImage URL: ${imageUrl}`
        });
      } catch (uploadError) {
        console.error('Failed to upload photo to S3:', uploadError);
        return '❌ Failed to upload photo: ' + uploadError.message;
      }
             
    } else {
      return '❌ Photo capture failed, no photo obtained';
    }
    
  } catch (error) {
    console.error('Photo capture failed:', error);
    return '❌ Photo capture failed: ' + error.message;
  }
};

/**
 * 从图库选择图片功能
 * @param {Object} args - 参数对象
 * @param {string} args.purpose - 选择图片的目的（可选）
 * @returns {Promise<string>} 选择图片结果信息
 */
export const selectFromGallery = async (args) => {
  console.log('Starting to select image from gallery:', args);
  
  try {
    // 请求媒体库权限
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (mediaLibraryPermission.status !== 'granted') {
      return '❌ 媒体库权限被拒绝，无法访问图库';
    }
    
    // 启动图库选择器
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (result.canceled) {
      return '🖼️ User cancelled image selection';
    }
    
    if (result.assets && result.assets.length > 0) {
      const image = result.assets[0];
      const purpose = args.purpose || 'Select';
      
      try {
        // 获取用户ID
        let uid = 'anonymous';
        try {
          const userData = await storageManager.getUserData();
          if (userData) {
            const info = userData.toJSON ? userData.toJSON() : userData;
            if (info && (info.uid || info.id)) {
              uid = String(info.uid || info.id);
            }
          }
        } catch (e) {
          console.warn('Failed to get user ID, using anonymous:', e);
        }
        
        // 准备上传参数
        const filename = image.fileName || `image_${Date.now()}.jpg`;
        const mimeType = image.mimeType || 'image/jpeg';
        
        console.log('Starting to upload image to S3:', { uid, filename, mimeType });
        
        // 上传到S3
        const uploadResult = await uploadImageToS3({
          uid,
          uri: image.uri,
          filename,
          mimeType,
        });
        
        console.log('Image uploaded successfully:', uploadResult);
        
        // 返回包含S3 URL的结果
        const imageUrl = uploadResult.presigned_url || uploadResult.s3_uri || '';
        
        return JSON.stringify({
          success: true,
          purpose: purpose,
          fileSize: Math.round(image.fileSize / 1024),
          width: image.width,
          height: image.height,
          timestamp: new Date().toLocaleString(),
          imageUrl: imageUrl,
          bucket: uploadResult.bucket,
          key: uploadResult.key,
          message: `🖼️ Image selected successfully\nPurpose: ${purpose}\nFile size: ${Math.round(image.fileSize / 1024)}KB\nDimensions: ${image.width} x ${image.height}\nSelection time: ${new Date().toLocaleString()}\nImage URL: ${imageUrl}`
        });
      } catch (uploadError) {
        console.error('Failed to upload image to S3:', uploadError);
        return '❌ Failed to upload image: ' + uploadError.message;
      }
             
    } else {
      return '❌ Image selection failed, no image obtained';
    }
    
  } catch (error) {
    console.error('Image selection failed:', error);
    return '❌ Image selection failed: ' + error.message;
  }
};

/**
 * 获取步数数据功能
 * @param {Object} args - 参数对象
 * @param {string} args.period - 查询周期（可选，如 'today', 'last_7_days', 'last_30_days'）
 * @param {string} args.startDate - 自定义起始日期（可选，ISO格式如 '2024-01-01'）
 * @param {string} args.endDate - 自定义结束日期（可选，ISO格式如 '2024-01-31'）
 * @returns {Promise<string>} 步数数据信息
 */
export const getStepCount = async (args) => {
  console.log('Starting to get step count data:', args);
  
  try {
    // 检查 HealthKit 是否可用
    const available = await healthDataManager.isAvailable();
    if (!available) {
      return '❌ Health data function unavailable, please ensure running on iOS device';
    }

    let queryOptions;
    let periodDescription = '';

    // 优先使用自定义日期范围
    if (args.startDate || args.endDate) {
      queryOptions = {
        startDate: args.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: args.endDate || new Date().toISOString(),
      };
      const start = new Date(queryOptions.startDate);
      const end = new Date(queryOptions.endDate);
      periodDescription = `自定义日期范围: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    } else {
      // 使用预设周期
      const period = args.period || 'today';
      let timePeriod;
      switch (period) {
        case 'today':
          timePeriod = TimePeriod.TODAY;
          periodDescription = 'Today';
          break;
        case 'yesterday':
          timePeriod = TimePeriod.YESTERDAY;
          periodDescription = 'Yesterday';
          break;
        case 'last_7_days':
          timePeriod = TimePeriod.LAST_7_DAYS;
          periodDescription = 'Last 7 days';
          break;
        case 'last_30_days':
          timePeriod = TimePeriod.LAST_30_DAYS;
          periodDescription = 'Last 30 days';
          break;
        case 'this_week':
          timePeriod = TimePeriod.THIS_WEEK;
          periodDescription = 'This week';
          break;
        case 'this_month':
          timePeriod = TimePeriod.THIS_MONTH;
          periodDescription = 'This month';
          break;
        default:
          timePeriod = TimePeriod.TODAY;
          periodDescription = 'Today';
      }
      queryOptions = timePeriod;
    }

    // 使用 HealthDataManager 获取步数数据
    const result = await healthDataManager.getStepCount(queryOptions);
    
    if (!result.success) {
      return `❌ Failed to get step count data: ${result.error}\n\nPlease ensure:\n1. Health app access permission is granted\n2. Device supports health data function\n3. Step count data exists in health app`;
    }

    // 格式化数据
    const formatted = healthDataManager.formatStepCountData(result.data, queryOptions);
    const { startDate, endDate } = healthDataManager.getDateRange(queryOptions);

    // 生成报告
    let report = `🚶 步数数据分析报告\n`;
    report += `📅 查询周期: ${periodDescription}\n`;
    report += `📆 日期范围: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\n\n`;

    if (formatted.total > 0) {
      report += `📊 步数统计:\n`;
      report += `  • 总步数: ${formatted.total.toLocaleString()} 步\n`;
      report += `  • 平均每日: ${formatted.average.toLocaleString()} 步\n`;
      report += `  • 记录天数: ${formatted.days} 天\n\n`;

      // 显示每日步数详情（最多显示最近7天）
      const recentRecords = formatted.records.slice(-7);
      if (recentRecords.length > 0) {
        report += `📈 最近步数记录:\n`;
        recentRecords.forEach(record => {
          const status = record.steps >= 10000 ? '✅' : record.steps >= 5000 ? '⚠️' : '❌';
          report += `  • ${record.dateString}: ${record.steps.toLocaleString()} 步 ${status}\n`;
        });
      }

      // 健康建议
      report += `\n💡 健康建议:\n`;
      if (formatted.average >= 10000) {
        report += `• 恭喜！您的运动量很充足 🎉\n`;
      } else if (formatted.average >= 5000) {
        report += `• 运动量适中，建议增加一些步行活动\n`;
      } else {
        report += `• 建议增加日常步行，目标是每天10000步\n`;
      }
      report += `• 世界卫生组织建议成年人每天至少进行150分钟中等强度运动\n`;
      report += `• 步行是最简单有效的有氧运动方式\n`;
    } else {
      report += `📊 步数统计:\n`;
      report += `  暂无步数记录\n\n`;
      report += `💡 提示：\n`;
      report += `• 请确保iPhone已记录步数数据\n`;
      report += `• 检查健康应用中的步数权限设置\n`;
      report += `• 建议每天步行10000步以保持健康\n`;
    }

    console.log('Step count data retrieved successfully');
    return report;

  } catch (error) {
    console.error('Failed to get step count data:', error);
    return '❌ Failed to get step count data: ' + error.message + '\n\nPlease ensure:\n1. Health app access permission is granted\n2. Device supports health data function\n3. Step count data exists in health app';
  }
};

/**
 * 创建日历事件功能
 * @param {Object} args - 参数对象
 * @param {string} args.title - 事件标题
 * @param {string} args.startDate - 开始时间 (ISO字符串格式)
 * @param {string} args.endDate - 结束时间 (ISO字符串格式，可选)
 * @param {string} args.notes - 事件备注 (可选)
 * @param {string} args.location - 事件地点 (可选)
 * @param {boolean} args.allDay - 是否全天事件 (可选，默认false)
 * @returns {Promise<string>} 创建结果信息
 */
export const createCalendarEvent = async (args) => {
  console.log('Starting to create calendar event:', args);
  
  try {
    const { title, startDate, endDate, notes, location, allDay = false } = args;
    
    // 验证必需参数
    if (!title) {
      return '❌ 事件标题不能为空';
    }
    
    if (!startDate) {
      return '❌ 开始时间不能为空';
    }
    
    // 解析日期
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000); // 默认1小时
    
    // 验证日期有效性
    if (isNaN(start.getTime())) {
      return '❌ 开始时间格式无效，请使用ISO格式 (如: 2024-01-01T10:00:00)';
    }
    
    if (isNaN(end.getTime())) {
      return '❌ 结束时间格式无效，请使用ISO格式 (如: 2024-01-01T11:00:00)';
    }
    
    if (end <= start) {
      return '❌ 结束时间必须晚于开始时间';
    }
    
    // 请求日历权限
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      return '❌ 日历权限被拒绝，无法创建事件。请在设置中允许访问日历。';
    }
    
    // 获取可写的日历
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    // 优先选择可写的主要日历，然后选择任何可写的日历
    const writableCalendars = calendars.filter(cal => cal.allowsModifications);
    const defaultCalendar = writableCalendars.find(cal => cal.isPrimary) || writableCalendars[0];
    
    if (!defaultCalendar) {
      return '❌ 未找到可写的日历。请确保：\n1. 设备上有可写的日历\n2. 日历应用已正确配置\n3. 尝试在日历应用中手动创建一个事件来测试';
    }
    
    console.log('选择的日历:', { 
      id: defaultCalendar.id, 
      title: defaultCalendar.title, 
      allowsModifications: defaultCalendar.allowsModifications 
    });
    
    // 创建事件
    const eventDetails = {
      title: title,
      startDate: start,
      endDate: end,
      allDay: allDay,
      calendarId: defaultCalendar.id,
    };
    
    // 添加可选字段
    if (notes) {
      eventDetails.notes = notes;
    }
    
    if (location) {
      eventDetails.location = location;
    }
    
    const eventId = await Calendar.createEventAsync(defaultCalendar.id, eventDetails);
    
    console.log('日历事件创建成功，ID:', eventId);
    
    // 生成成功报告
    let report = `📅 日历事件创建成功\n\n`;
    report += `📝 事件标题: ${title}\n`;
    report += `📅 开始时间: ${start.toLocaleString()}\n`;
    report += `📅 结束时间: ${end.toLocaleString()}\n`;
    report += `⏰ 全天事件: ${allDay ? '是' : '否'}\n`;
    report += `📋 日历: ${defaultCalendar.title}\n`;
    
    if (location) {
      report += `📍 地点: ${location}\n`;
    }
    
    if (notes) {
      report += `📄 备注: ${notes}\n`;
    }
    
    report += `\n✅ 事件已成功添加到您的日历中！`;
    
    return report;
    
  } catch (error) {
    console.error('创建日历事件失败:', error);
    
    let errorMessage = '❌ 创建日历事件失败: ' + error.message;
    
    // 根据具体错误类型提供更详细的解决建议
    if (error.message.includes('read only')) {
      errorMessage += '\n\n📋 日历只读错误解决方案：\n';
      errorMessage += '• 检查是否选择了正确的日历账户\n';
      errorMessage += '• 确保日历账户支持写入操作\n';
      errorMessage += '• 尝试在日历应用中手动创建事件\n';
      errorMessage += '• 检查日历同步设置';
    } else if (error.message.includes('permission')) {
      errorMessage += '\n\n🔐 权限问题解决方案：\n';
      errorMessage += '• 在设置 > 隐私与安全 > 日历中允许应用访问\n';
      errorMessage += '• 确保选择了"完全访问"权限\n';
      errorMessage += '• 重启应用后重试';
    } else {
      errorMessage += '\n\n💡 通用解决方案：\n';
      errorMessage += '• 检查事件信息格式是否正确\n';
      errorMessage += '• 确保开始时间不早于当前时间\n';
      errorMessage += '• 尝试在日历应用中手动创建事件\n';
      errorMessage += '• 重启应用后重试';
    }
    
    return errorMessage;
  }
};

// ==================== 工具定义 ====================

/**
 * Function Tools 定义数组
 * 每个工具包含 type, name, description 和 parameters
 */
export const FUNCTION_TOOLS = [
  {
    type: "function",
    name: "get_weather_info",
    description: "Choose when the user provides or asks for weather information (temperature, weather conditions, humidity, etc.) or requests to supplement/complete profile.",
    parameters: {
      type: "object",
      properties: {
        latitude: {
          type: "number",
          description: "位置的纬度"
        },
        longitude: {
          type: "number",
          description: "位置的经度"
        },
        city: {
          type: "string",
          description: "城市名称（可选）"
        }
      },
      required: ["latitude", "longitude"]
    }
  },
  {
    type: "function",
    name: "get_user_info",
    description: "Choose when the user provides or asks for personal profile/health/location info (age, gender, weight, height, goals, diet habits, exercise habits) or requests to supplement/complete profile.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    type: "function",
    name: "take_photo",
    description: "Choose when the user wants to capture images, record moments, document something, take pictures for food diary, exercise progress, health tracking, or any visual documentation purpose.",
    parameters: {
      type: "object",
      properties: {
        purpose: {
          type: "string",
          description: "The purpose or reason for taking the photo (e.g., 'food diary', 'exercise progress', 'document', 'memory')"
        }
      },
      required: []
    }
  },
  {
    type: "function",
    name: "select_from_gallery",
    description: "Choose when the user wants to select images from their photo gallery, choose existing photos for food diary, exercise progress, health tracking, or any visual documentation purpose.",
    parameters: {
      type: "object",
      properties: {
        purpose: {
          type: "string",
          description: "The purpose or reason for selecting the image (e.g., 'food diary', 'exercise progress', 'document', 'memory', 'profile picture')"
        }
      },
      required: []
    }
  },
  {
    type: "function",
    name: "get_step_count",
    description: "Choose when the user asks about step count, daily steps, walking activity, exercise tracking, fitness goals, or any physical activity related information. Supports both predefined periods and custom date ranges.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "The predefined time period to query step count data. Use this for common periods like 'today' or 'last week'. Ignored if startDate/endDate are provided.",
          enum: ["today", "yesterday", "last_7_days", "last_30_days", "this_week", "this_month"]
        },
        startDate: {
          type: "string",
          description: "Custom start date for the query in ISO format (e.g., '2024-01-01' or '2024-01-01T00:00:00'). Use this for specific date ranges. If provided, overrides the 'period' parameter."
        },
        endDate: {
          type: "string",
          description: "Custom end date for the query in ISO format (e.g., '2024-01-31' or '2024-01-31T23:59:59'). Use this for specific date ranges. If not provided with startDate, defaults to current time."
        }
      },
      required: []
    }
  },
  {
    type: "function",
    name: "create_calendar_event",
    description: "Choose when the user wants to create, schedule, or record an event, appointment, meeting, reminder, or any calendar-related activity. This includes scheduling meetings, setting reminders, creating appointments, or organizing events.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The title or name of the calendar event"
        },
        startDate: {
          type: "string",
          description: "The start date and time of the event in ISO format (e.g., '2024-01-01T10:00:00')"
        },
        endDate: {
          type: "string",
          description: "The end date and time of the event in ISO format (e.g., '2024-01-01T11:00:00'). If not provided, defaults to 1 hour after start time."
        },
        notes: {
          type: "string",
          description: "Additional notes or description for the event (optional)"
        },
        location: {
          type: "string",
          description: "The location or venue for the event (optional)"
        },
        allDay: {
          type: "boolean",
          description: "Whether this is an all-day event (optional, defaults to false)"
        }
      },
      required: ["title", "startDate"]
    }
  },
  
];

// ==================== 工具路由 ====================

/**
 * 工具函数路由映射
 * 将工具名称映射到具体的实现函数
 */
export const TOOL_HANDLERS = {
  'select_from_gallery': selectFromGallery,
  'get_step_count': getStepCount,
  'create_calendar_event': createCalendarEvent,
  // 后续添加更多工具的映射
  // 'take_photo': takePhoto,
  // 'get_location_info': getLocationInfo,
};

/**
 * 执行工具函数
 * @param {string} toolName - 工具名称
 * @param {Object} args - 工具参数
 * @returns {Promise<{success: boolean, result?: any, error?: string}>} 工具执行结果
 */
export const executeToolFunction = async (toolName, args) => {
  const handler = TOOL_HANDLERS[toolName];
  
  if (!handler) {
    return {
      success: false,
      error: `未找到工具函数: ${toolName}`
    };
  }
  
  try {
    const result = await handler(args);
    return {
      success: true,
      result: result
    };
  } catch (error) {
    console.error(`执行工具函数 ${toolName} 失败:`, error);
    return {
      success: false,
      error: error.message || `执行工具函数 ${toolName} 时发生错误`
    };
  }
};

/**
 * 获取所有可用的工具定义
 * @returns {Array} 工具定义数组
 */
export const getAvailableTools = () => {
  return FUNCTION_TOOLS;
};
