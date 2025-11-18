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
  console.log('=== uploadImageToS3 started ===');
  console.log('Parameters:', { uid, uri, filename, mimeType });
  
  // 图片压缩配置
  const MAX_WIDTH = 600; // 最大宽度（保持宽高比）
  const COMPRESS_QUALITY = 0.6; // 压缩质量（0-1，0.8 表示 80% 质量）
  
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
  
  console.log('FormData created');
  
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
    
    console.log('=== uploadImageToS3 succeeded ===');
    return json.data;
  } catch (error) {
    console.error('=== uploadImageToS3 failed ===');
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
      return '❌ Media library permission denied, cannot access gallery';
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
      periodDescription = `Custom date range: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
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
    let report = `🚶 Step Count Data Analysis Report\n`;
    report += `📅 Query Period: ${periodDescription}\n`;
    report += `📆 Date Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}\n\n`;

    if (formatted.total > 0) {
      report += `📊 Step Count Statistics:\n`;
      report += `  • Total Steps: ${formatted.total.toLocaleString()} steps\n`;
      report += `  • Daily Average: ${formatted.average.toLocaleString()} steps\n`;
      report += `  • Recorded Days: ${formatted.days} days\n\n`;

      // 显示每日步数详情（最多显示最近7天）
      const recentRecords = formatted.records.slice(-7);
      if (recentRecords.length > 0) {
        report += `📈 Recent Step Records:\n`;
        recentRecords.forEach(record => {
          const status = record.steps >= 10000 ? '✅' : record.steps >= 5000 ? '⚠️' : '❌';
          report += `  • ${record.dateString}: ${record.steps.toLocaleString()} steps ${status}\n`;
        });
      }

      // 健康建议
      report += `\n💡 Health Recommendations:\n`;
      if (formatted.average >= 10000) {
        report += `• Congratulations! Your activity level is excellent 🎉\n`;
      } else if (formatted.average >= 5000) {
        report += `• Moderate activity level, consider increasing walking activities\n`;
      } else {
        report += `• Recommend increasing daily walking, target 10000 steps per day\n`;
      }
      report += `• WHO recommends adults engage in at least 150 minutes of moderate-intensity exercise daily\n`;
      report += `• Walking is the simplest and most effective form of aerobic exercise\n`;
    } else {
      report += `📊 Step Count Statistics:\n`;
      report += `  No step records available\n\n`;
      report += `💡 Tips:\n`;
      report += `• Please ensure iPhone has recorded step data\n`;
      report += `• Check step permission settings in Health app\n`;
      report += `• Recommend walking 10000 steps daily to maintain health\n`;
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
      return '❌ Event title cannot be empty';
    }
    
    if (!startDate) {
      return '❌ Start date cannot be empty';
    }
    
    // 解析日期
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 60 * 60 * 1000); // 默认1小时
    
    // 验证日期有效性
    if (isNaN(start.getTime())) {
      return '❌ Invalid start date format, please use ISO format (e.g., 2024-01-01T10:00:00)';
    }
    
    if (isNaN(end.getTime())) {
      return '❌ Invalid end date format, please use ISO format (e.g., 2024-01-01T11:00:00)';
    }
    
    if (end <= start) {
      return '❌ End time must be later than start time';
    }
    
    // 请求日历权限
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      return '❌ Calendar permission denied, cannot create event. Please allow calendar access in settings.';
    }
    
    // 获取可写的日历
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    
    // 优先选择可写的主要日历，然后选择任何可写的日历
    const writableCalendars = calendars.filter(cal => cal.allowsModifications);
    const defaultCalendar = writableCalendars.find(cal => cal.isPrimary) || writableCalendars[0];
    
    if (!defaultCalendar) {
      return '❌ No writable calendar found. Please ensure:\n1. Device has writable calendars\n2. Calendar app is properly configured\n3. Try manually creating an event in the calendar app to test';
    }
    
    console.log('Selected calendar:', { 
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
    
    console.log('Calendar event created successfully, ID:', eventId);
    
    // 生成成功报告
    let report = `📅 Calendar Event Created Successfully\n\n`;
    report += `📝 Event Title: ${title}\n`;
    report += `📅 Start Time: ${start.toLocaleString()}\n`;
    report += `📅 End Time: ${end.toLocaleString()}\n`;
    report += `⏰ All-Day Event: ${allDay ? 'Yes' : 'No'}\n`;
    report += `📋 Calendar: ${defaultCalendar.title}\n`;
    
    if (location) {
      report += `📍 Location: ${location}\n`;
    }
    
    if (notes) {
      report += `📄 Notes: ${notes}\n`;
    }
    
    report += `\n✅ Event has been successfully added to your calendar!`;
    
    return report;
    
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    
    let errorMessage = '❌ Failed to create calendar event: ' + error.message;
    
    // 根据具体错误类型提供更详细的解决建议
    if (error.message.includes('read only')) {
      errorMessage += '\n\n📋 Read-only Calendar Error Solutions:\n';
      errorMessage += '• Check if the correct calendar account is selected\n';
      errorMessage += '• Ensure the calendar account supports write operations\n';
      errorMessage += '• Try manually creating an event in the calendar app\n';
      errorMessage += '• Check calendar sync settings';
    } else if (error.message.includes('permission')) {
      errorMessage += '\n\n🔐 Permission Issue Solutions:\n';
      errorMessage += '• Allow app access in Settings > Privacy & Security > Calendar\n';
      errorMessage += '• Ensure "Full Access" permission is selected\n';
      errorMessage += '• Restart the app and try again';
    } else {
      errorMessage += '\n\n💡 General Solutions:\n';
      errorMessage += '• Check if event information format is correct\n';
      errorMessage += '• Ensure start time is not earlier than current time\n';
      errorMessage += '• Try manually creating an event in the calendar app\n';
      errorMessage += '• Restart the app and try again';
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
          description: "Latitude of the location"
        },
        longitude: {
          type: "number",
          description: "Longitude of the location"
        },
        city: {
          type: "string",
          description: "City name (optional)"
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
      error: `Tool function not found: ${toolName}`
    };
  }
  
  try {
    const result = await handler(args);
    return {
      success: true,
      result: result
    };
  } catch (error) {
    console.error(`Failed to execute tool function ${toolName}:`, error);
    return {
      success: false,
      error: error.message || `Error occurred while executing tool function ${toolName}`
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
