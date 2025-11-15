import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';

/**
 * 日历数据管理器
 * 负责日历权限管理和事件数据获取
 */
class CalendarManager {
  constructor() {
    this.hasPermission = false;
    this.calendars = [];
  }

  /**
   * 请求日历权限
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async requestPermission() {
    try {
      console.log('[CalendarManager] 🔐 请求日历权限...');
      
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      
      if (status === 'granted') {
        this.hasPermission = true;
        console.log('[CalendarManager] ✅ 日历权限已授予');
        
        // 获取可用的日历列表
        await this.loadCalendars();
        
        return {
          success: true,
        };
      } else {
        this.hasPermission = false;
        console.log('[CalendarManager] ❌ 日历权限被拒绝');
        return {
          success: false,
          error: '日历权限被拒绝',
        };
      }
    } catch (error) {
      console.error('[CalendarManager] ❌ 请求日历权限失败:', error);
      return {
        success: false,
        error: error.message || '请求日历权限失败',
      };
    }
  }

  /**
   * 检查日历权限状态
   * @returns {Promise<{success: boolean, granted: boolean}>}
   */
  async checkPermission() {
    try {
      const { status } = await Calendar.getCalendarPermissionsAsync();
      this.hasPermission = status === 'granted';
      
      console.log('[CalendarManager] 📋 日历权限状态:', status);
      
      return {
        success: true,
        granted: this.hasPermission,
      };
    } catch (error) {
      console.error('[CalendarManager] ❌ 检查日历权限失败:', error);
      return {
        success: false,
        granted: false,
      };
    }
  }

  /**
   * 加载可用的日历列表
   * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
   */
  async loadCalendars() {
    try {
      if (!this.hasPermission) {
        console.log('[CalendarManager] ⚠️ 没有日历权限，无法加载日历列表');
        return {
          success: false,
          error: '没有日历权限',
        };
      }

      console.log('[CalendarManager] 📅 加载日历列表...');
      
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      this.calendars = calendars;
      console.log('[CalendarManager] ✅ 加载日历列表成功:', calendars.length, '个日历');
      
      return {
        success: true,
        data: calendars,
      };
    } catch (error) {
      console.error('[CalendarManager] ❌ 加载日历列表失败:', error);
      return {
        success: false,
        error: error.message || '加载日历列表失败',
      };
    }
  }

  /**
   * 获取指定日历的所有事件（给定时间范围）
   * @param {Object} options - 查询选项
   * @param {string[]} options.calendarIds - 日历ID数组，如果为空则查询所有日历
   * @param {Date} options.startDate - 开始日期
   * @param {Date} options.endDate - 结束日期
   * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
   */
  async getEventsInRange(options = {}) {
    try {
      if (!this.hasPermission) {
        console.log('[CalendarManager] ⚠️ 没有日历权限，无法获取事件');
        return {
          success: false,
          error: '没有日历权限',
        };
      }

      // 默认参数
      const {
        calendarIds = this.calendars.map(cal => cal.id),
        startDate = new Date(),
        endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 默认7天
      } = options;

      // 验证参数
      if (!calendarIds || calendarIds.length === 0) {
        console.log('[CalendarManager] ⚠️ 没有可用的日历');
        return {
          success: false,
          error: '没有可用的日历',
        };
      }

      if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
        console.log('[CalendarManager] ⚠️ 日期参数无效');
        return {
          success: false,
          error: '日期参数无效',
        };
      }

      if (startDate > endDate) {
        console.log('[CalendarManager] ⚠️ 开始日期不能晚于结束日期');
        return {
          success: false,
          error: '开始日期不能晚于结束日期',
        };
      }

      console.log('[CalendarManager] 📅 获取事件...');
      console.log('[CalendarManager] 📋 查询参数:', {
        calendarIds: calendarIds.length,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const events = await Calendar.getEventsAsync(
        calendarIds,
        startDate,
        endDate
      );

      console.log('[CalendarManager] ✅ 获取事件成功:', events.length, '个事件');
      
      // 处理事件数据，添加更多有用信息
      const processedEvents = events.map(event => ({
        id: event.id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        allDay: event.allDay,
        location: event.location,
        notes: event.notes,
        status: event.status,
        availability: event.availability,
        calendarId: event.calendarId,
        timeZone: event.timeZone,
        // 计算事件时长（分钟）
        duration: this.calculateEventDuration(event.startDate, event.endDate),
        // 格式化的时间显示
        formattedTime: this.formatEventTime(event.startDate, event.endDate, event.allDay),
      }));

      return {
        success: true,
        data: processedEvents,
      };
    } catch (error) {
      console.error('[CalendarManager] ❌ 获取事件失败:', error);
      return {
        success: false,
        error: error.message || '获取事件失败',
      };
    }
  }

  /**
   * 获取今天的所有事件
   * @param {string[]} calendarIds - 日历ID数组，如果为空则查询所有日历
   * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
   */
  async getTodayEvents(calendarIds = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getEventsInRange({
      calendarIds: calendarIds || this.calendars.map(cal => cal.id),
      startDate: today,
      endDate: tomorrow,
    });
  }

  /**
   * 获取本周的所有事件
   * @param {string[]} calendarIds - 日历ID数组，如果为空则查询所有日历
   * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
   */
  async getThisWeekEvents(calendarIds = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 获取本周的开始（周一）
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 如果是周日，往前推6天
    startOfWeek.setDate(today.getDate() + diff);
    
    // 获取本周的结束（周日）
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return this.getEventsInRange({
      calendarIds: calendarIds || this.calendars.map(cal => cal.id),
      startDate: startOfWeek,
      endDate: endOfWeek,
    });
  }

  /**
   * 获取本月的所有事件
   * @param {string[]} calendarIds - 日历ID数组，如果为空则查询所有日历
   * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
   */
  async getThisMonthEvents(calendarIds = null) {
    const today = new Date();
    
    // 获取本月的开始
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // 获取本月的结束
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return this.getEventsInRange({
      calendarIds: calendarIds || this.calendars.map(cal => cal.id),
      startDate: startOfMonth,
      endDate: endOfMonth,
    });
  }

  /**
   * 计算事件时长（分钟）
   * @param {string} startDate - 开始时间
   * @param {string} endDate - 结束时间
   * @returns {number} 时长（分钟）
   */
  calculateEventDuration(startDate, endDate) {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const durationMs = end - start;
      return Math.round(durationMs / (1000 * 60)); // 转换为分钟
    } catch (error) {
      console.warn('[CalendarManager] ⚠️ 计算事件时长失败:', error);
      return 0;
    }
  }

  /**
   * 格式化事件时间显示
   * @param {string} startDate - 开始时间
   * @param {string} endDate - 结束时间
   * @param {boolean} allDay - 是否全天事件
   * @returns {string} 格式化的时间字符串
   */
  formatEventTime(startDate, endDate, allDay) {
    try {
      if (allDay) {
        return '全天';
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      const startTime = start.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const endTime = end.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // 如果是同一天
      if (start.toDateString() === end.toDateString()) {
        return `${startTime} - ${endTime}`;
      }

      // 如果跨天
      const startDateStr = start.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
      });

      const endDateStr = end.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric',
      });

      return `${startDateStr} ${startTime} - ${endDateStr} ${endTime}`;
    } catch (error) {
      console.warn('[CalendarManager] ⚠️ 格式化事件时间失败:', error);
      return '';
    }
  }

  /**
   * 按日期分组事件
   * @param {Array} events - 事件数组
   * @returns {Object} 按日期分组的事件对象
   */
  groupEventsByDate(events) {
    try {
      const grouped = {};

      events.forEach(event => {
        const date = new Date(event.startDate).toDateString();
        if (!grouped[date]) {
          grouped[date] = [];
        }
        grouped[date].push(event);
      });

      // 对每个日期的事件按开始时间排序
      Object.keys(grouped).forEach(date => {
        grouped[date].sort((a, b) => 
          new Date(a.startDate) - new Date(b.startDate)
        );
      });

      return grouped;
    } catch (error) {
      console.error('[CalendarManager] ❌ 分组事件失败:', error);
      return {};
    }
  }

  /**
   * 获取事件统计信息
   * @param {Array} events - 事件数组
   * @returns {Object} 统计信息
   */
  getEventsStatistics(events) {
    try {
      const stats = {
        total: events.length,
        allDay: 0,
        withLocation: 0,
        totalDuration: 0, // 分钟
        byStatus: {},
      };

      events.forEach(event => {
        if (event.allDay) {
          stats.allDay++;
        }

        if (event.location) {
          stats.withLocation++;
        }

        stats.totalDuration += event.duration || 0;

        const status = event.status || 'unknown';
        stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
      });

      // 转换总时长为小时
      stats.totalDurationHours = Math.round(stats.totalDuration / 60 * 10) / 10;

      return stats;
    } catch (error) {
      console.error('[CalendarManager] ❌ 计算事件统计失败:', error);
      return {
        total: 0,
        allDay: 0,
        withLocation: 0,
        totalDuration: 0,
        totalDurationHours: 0,
        byStatus: {},
      };
    }
  }

  /**
   * 搜索事件
   * @param {Array} events - 事件数组
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的事件数组
   */
  searchEvents(events, keyword) {
    try {
      if (!keyword || keyword.trim() === '') {
        return events;
      }

      const lowerKeyword = keyword.toLowerCase();

      return events.filter(event => {
        const title = (event.title || '').toLowerCase();
        const location = (event.location || '').toLowerCase();
        const notes = (event.notes || '').toLowerCase();

        return (
          title.includes(lowerKeyword) ||
          location.includes(lowerKeyword) ||
          notes.includes(lowerKeyword)
        );
      });
    } catch (error) {
      console.error('[CalendarManager] ❌ 搜索事件失败:', error);
      return [];
    }
  }
}

// 导出单例实例
const calendarManager = new CalendarManager();
export default calendarManager;

