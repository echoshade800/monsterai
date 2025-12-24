// 一次性提醒的时间信息
export interface OneTimePattern {
  scheduled_time: string;
}

// 重复规则的配置
export interface RepeatRulePattern {
  type: string; // 例如: "daily", "weekly" 等
}

// ReminderItem 基础字段
export interface ReminderItemBase {
  time: string;
  title: string;
  task_type: string;
  original_text?: string;
}

// 一次性提醒类型
export interface ReminderItemOneTime extends ReminderItemBase {
  pattern_type: "one_time";
  one_time: OneTimePattern;
}

// 重复提醒类型
export interface ReminderItemRepeatRule extends ReminderItemBase {
  pattern_type: "repeat_rule";
  repeat_rule: RepeatRulePattern;
}

// ReminderItem 联合类型，确保 one_time 和 repeat_rule 互斥
export type ReminderItem = ReminderItemOneTime | ReminderItemRepeatRule;

export interface ReminderCardData {
  title: string;
  monster: string;
  reminders: ReminderItem[];
}

// 消息类型定义
export interface Message {
  id: string;
  type: 'user' | 'assistant' | 'timestamp' | 'reminderCard';
  content: string;
  avatar?: string;
  photoUri?: string;
  reminderCardData?: ReminderCardData;
  operation?: string; // 服务端下发的 operation 字段
  isMemory?: boolean; // 标识是否为 memory 消息
  timestamp?: number; // 消息时间戳（用于排序和显示）
}

