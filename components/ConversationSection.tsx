import Clipboard from '@react-native-clipboard/clipboard';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { ReminderCard } from './ReminderCard';

// 一次性提醒的时间信息
interface OneTimePattern {
  scheduled_time: string;
}

// 重复规则的配置
interface RepeatRulePattern {
  type: string; // 例如: "daily", "weekly" 等
}

// ReminderItem 基础字段
interface ReminderItemBase {
  time: string;
  title: string;
  task_type: string;
  original_text?: string;
}

// 一次性提醒类型
interface ReminderItemOneTime extends ReminderItemBase {
  pattern_type: "one_time";
  one_time: OneTimePattern;
}

// 重复提醒类型
interface ReminderItemRepeatRule extends ReminderItemBase {
  pattern_type: "repeat_rule";
  repeat_rule: RepeatRulePattern;
}

// ReminderItem 联合类型，确保 one_time 和 repeat_rule 互斥
type ReminderItem = ReminderItemOneTime | ReminderItemRepeatRule;

interface ReminderCardData {
  title: string;
  monster: string;
  reminders: ReminderItem[];
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'timestamp' | 'reminderCard';
  content: string;
  avatar?: string;
  photoUri?: string;
  reminderCardData?: ReminderCardData;
  operation?: string; // 服务端下发的 operation 字段
  isMemory?: boolean; // 标识是否为 memory 消息
}

interface ConversationSectionProps {
  messages?: Message[];
  isLoading?: boolean;
  isSending?: boolean;
  currentResponse?: string;
  keyboardHeight?: number;
  onSendMessage?: (operation: string, text: string) => void; // 发送消息的回调函数，operation 和 text 字段
}

// Monster 统一配置（包含名称、颜色和头像）
const MONSTER_CONFIG: Record<string, { color: string; avatar: string }> = {
  foodie: {
    color: '#F38319',
    avatar: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profileenergy.png',
  },
  moodie: {
    color: '#7A4DBA',
    avatar: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profilestress.png',
  },
  sleeper: {
    color: '#206BDB',
    avatar: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profilesleep.png',
  },
  poopy: {
    color: '#844E02',
    avatar: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profilefeces.png',
  },
  posture: {
    color: '#32C25F',
    avatar: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profileposture.png',
  },
  facey: {
    color: '#FF4FB0',
    avatar: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profileface.png',
  },
  butler: {
    color: '#666666',
    avatar: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profilesteward.png',
  },
};

// Markdown 样式配置
const markdownStyles = {
  body: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: '#000000',
    lineHeight: 22,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  heading1: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    marginTop: 12,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    marginTop: 10,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
    marginTop: 8,
    marginBottom: 4,
  },
  strong: {
    fontFamily: 'Nunito_700Bold',
  },
  em: {
    fontStyle: 'italic' as const,
  },
  code_inline: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  code_block: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  list_item: {
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  link: {
    color: '#206BDB',
    textDecorationLine: 'underline' as const,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#CCCCCC',
    paddingLeft: 12,
    marginLeft: 0,
    marginVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    paddingVertical: 8,
    paddingRight: 12,
  },
};

// 渲染带 Markdown 和 Monster 标签的文本
// 策略：先分割文本（按 monster 标签），然后对每个文本部分应用 markdown 渲染
const renderMarkdownWithMonsterTags = (text: string) => {
  if (!text) return null;

  // 从统一配置中提取所有 monster 名字列表
  const monsterNames = Object.keys(MONSTER_CONFIG);
  
  // 匹配带括号的标签格式 [MonsterName] 或 @MonsterName
  const bracketRegex = new RegExp(`\\[(${monsterNames.join('|')})\\]`, 'gi');
  const mentionRegex = new RegExp(`@(${monsterNames.join('|')})\\b`, 'gi');
  
  // 分割文本，保留 monster 标签
  const parts: Array<{ type: 'text' | 'tag', content: string, monsterName?: string, tagType?: 'bracket' | 'mention' }> = [];
  let lastIndex = 0;
  
  const bracketMatches: Array<{ index: number, name: string, fullMatch: string, tagType: 'bracket' }> = [];
  let match;
  
  while ((match = bracketRegex.exec(text)) !== null) {
    bracketMatches.push({
      index: match.index,
      name: match[1].toLowerCase(),
      fullMatch: match[0],
      tagType: 'bracket'
    });
  }
  
  const mentionMatches: Array<{ index: number, name: string, fullMatch: string, tagType: 'mention' }> = [];
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const isInBracket = bracketMatches.some(bm => 
      match!.index >= bm.index && match!.index < bm.index + bm.fullMatch.length
    );
    if (!isInBracket) {
      mentionMatches.push({
        index: match.index,
        name: match[1].toLowerCase(),
        fullMatch: match[0],
        tagType: 'mention'
      });
    }
  }
  
  const allMatches = [
    ...bracketMatches,
    ...mentionMatches
  ].sort((a, b) => a.index - b.index);
  
  // 构建 parts 数组
  for (let i = 0; i < allMatches.length; i++) {
    const currentMatch = allMatches[i];
    
    if (currentMatch.index > lastIndex) {
      const textBefore = text.substring(lastIndex, currentMatch.index);
      if (textBefore) {
        parts.push({ type: 'text', content: textBefore });
      }
    }
    
    parts.push({
      type: 'tag',
      content: currentMatch.fullMatch,
      monsterName: currentMatch.name,
      tagType: currentMatch.tagType
    });
    
    lastIndex = currentMatch.index + currentMatch.fullMatch.length;
  }
  
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }
  }
  
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  // 渲染每个部分
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {parts.map((part, index) => {
        if (part.type === 'tag') {
          // 渲染 monster 标签
          const name = part.monsterName || '';
          const monsterConfig = MONSTER_CONFIG[name];
          const color = monsterConfig?.color ?? '#000000';
          const avatarUrl = monsterConfig?.avatar;
          
          let displayName = part.content;
          if (part.tagType === 'bracket') {
            displayName = displayName.replace(/^\[|\]$/g, '');
          } else if (part.tagType === 'mention') {
            displayName = displayName.replace(/^@/, '');
          }
          
          return (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
              {avatarUrl && (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 20, height: 20, marginRight: 4, borderRadius: 10 }}
                  resizeMode="cover"
                />
              )}
              <Text style={{ color, fontWeight: '600', fontFamily: 'Nunito_600SemiBold', fontSize: 15, lineHeight: 22 }}>
                {displayName}
              </Text>
            </View>
          );
        }

        if (part.type === 'text') {
          // 对文本部分应用 markdown 渲染
          let displayText = part.content;
          
          // 如果紧跟在 monster 名字后面，删除开头的冒号和多余的空行
          if (index > 0) {
            const prevPart = parts[index - 1];
            if (prevPart && prevPart.type === 'tag') {
              displayText = displayText.replace(/^[：:]\s*/, '');
              if (displayText.match(/^[\s\n]*$/)) {
                displayText = displayText.replace(/[\n\s]+/g, '');
              } else {
                displayText = displayText.replace(/^\n+/, '');
              }
            }
          }
          
          if (index === 0 && displayText.match(/^[\s\n]*$/)) {
            return null;
          }
          
          displayText = displayText.replace(/\n{2,}/g, '\n');
          
          if (displayText.length === 0) {
            return null;
          }

          // 使用 Markdown 组件渲染文本
          return (
            <Markdown
              key={index}
              style={markdownStyles}
              mergeStyle={false}
            >
              {displayText}
            </Markdown>
          );
        }

        return null;
      })}
    </View>
  );
};

// 统一渲染函数：给所有 [MonsterName] 或 @MonsterName 标签或直接出现的 MonsterName 加颜色，并在标签前显示头像
// 保留此函数用于向后兼容（用户消息等不需要 markdown 的地方）
const renderMonsterColoredText = (text: string) => {
  if (!text) return null;

  // 从统一配置中提取所有 monster 名字列表
  const monsterNames = Object.keys(MONSTER_CONFIG);
  
  // 只匹配带括号的格式 [MonsterName] 或 @MonsterName，避免误匹配普通文本中的单词（如 "sleep", "face", "stress" 等）
  const parts: Array<{ type: 'text' | 'tag', content: string, monsterName?: string, tagType?: 'bracket' | 'mention' }> = [];
  let lastIndex = 0;
  
  // 匹配带括号的标签格式 [MonsterName]，支持大小写（如 [Foodie] 或 [foodie]）
  const bracketRegex = new RegExp(`\\[(${monsterNames.join('|')})\\]`, 'gi');
  let match;
  const bracketMatches: Array<{ index: number, name: string, fullMatch: string, tagType: 'bracket' }> = [];
  
  while ((match = bracketRegex.exec(text)) !== null) {
    bracketMatches.push({
      index: match.index,
      name: match[1].toLowerCase(),
      fullMatch: match[0],
      tagType: 'bracket'
    });
  }
  
  // 匹配 @ 符号格式 @MonsterName，支持大小写（如 @Foodie 或 @foodie）
  const mentionRegex = new RegExp(`@(${monsterNames.join('|')})\\b`, 'gi');
  const mentionMatches: Array<{ index: number, name: string, fullMatch: string, tagType: 'mention' }> = [];
  
  while ((match = mentionRegex.exec(text)) !== null) {
    // 检查这个匹配是否在某个括号匹配的范围内（避免重复匹配）
    const isInBracket = bracketMatches.some(bm => 
      match!.index >= bm.index && match!.index < bm.index + bm.fullMatch.length
    );
    if (!isInBracket) {
      mentionMatches.push({
        index: match.index,
        name: match[1].toLowerCase(),
        fullMatch: match[0],
        tagType: 'mention'
      });
    }
  }
  
  // 合并所有匹配并按位置排序
  const allMatches = [
    ...bracketMatches,
    ...mentionMatches
  ].sort((a, b) => a.index - b.index);
  
  // 构建 parts 数组
  for (let i = 0; i < allMatches.length; i++) {
    const currentMatch = allMatches[i];
    
    // 添加匹配前的文本
    if (currentMatch.index > lastIndex) {
      const textBefore = text.substring(lastIndex, currentMatch.index);
      if (textBefore) {
        parts.push({ type: 'text', content: textBefore });
      }
    }
    
    // 添加匹配的 monster 名字（支持 [MonsterName] 和 @MonsterName 两种格式）
    parts.push({
      type: 'tag',
      content: currentMatch.fullMatch,
      monsterName: currentMatch.name,
      tagType: currentMatch.tagType
    });
    
    lastIndex = currentMatch.index + currentMatch.fullMatch.length;
  }
  
  // 添加最后剩余的文本
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push({ type: 'text', content: remainingText });
    }
  }
  
  // 如果没有匹配到任何 monster 名字，返回原始文本
  if (parts.length === 0) {
    parts.push({ type: 'text', content: text });
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {parts.map((part, index) => {
        // 处理 monster 名字（支持 [MonsterName] 和 @MonsterName 两种格式）
        if (part.type === 'tag') {
          const name = part.monsterName || '';
          const monsterConfig = MONSTER_CONFIG[name];
          const color = monsterConfig?.color ?? '#000000';
          const avatarUrl = monsterConfig?.avatar;
          
          // 根据标签类型去掉前缀：bracket 类型去掉 [ ]，mention 类型去掉 @
          let displayName = part.content;
          if (part.tagType === 'bracket') {
            displayName = displayName.replace(/^\[|\]$/g, '');
          } else if (part.tagType === 'mention') {
            displayName = displayName.replace(/^@/, '');
          }
          
          return (
            <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 4 }}>
              {avatarUrl && (
                <Image
                  source={{ uri: avatarUrl }}
                  style={{ width: 20, height: 20, marginRight: 4, borderRadius: 10 }}
                  resizeMode="cover"
                />
              )}
              <Text style={{ color, fontWeight: '600', fontFamily: 'Nunito_600SemiBold', fontSize: 15, lineHeight: 22 }}>
                {displayName}
              </Text>
            </View>
          );
        }

        // 处理普通文本
        if (part.type === 'text') {
          let displayText = part.content;
          
          // 如果紧跟在 monster 名字后面，删除开头的冒号（中文冒号：或英文冒号:）和多余的空行
          if (index > 0) {
            const prevPart = parts[index - 1];
            if (prevPart && prevPart.type === 'tag') {
              // 删除开头的冒号（中文或英文）
              displayText = displayText.replace(/^[：:]\s*/, '');
              // 如果紧跟在标签后面且只包含换行符和空白字符，删除所有换行符
              if (displayText.match(/^[\s\n]*$/)) {
                displayText = displayText.replace(/[\n\s]+/g, '');
              } else {
                // 否则只删除开头的换行符
                displayText = displayText.replace(/^\n+/, '');
              }
            }
          }
          
          // 如果是消息开头且只包含换行符和空白字符，删除它
          if (index === 0 && displayText.match(/^[\s\n]*$/)) {
            return null;
          }
          
          // 将多个连续的换行符压缩为单个换行符（但保留文本内容）
          displayText = displayText.replace(/\n{2,}/g, '\n');
          
          // 跳过空字符串
          if (displayText.length === 0) {
            return null;
          }

          return (
            <Text key={index} style={{ fontSize: 15, fontFamily: 'Nunito_400Regular', lineHeight: 22 }}>
              {displayText}
            </Text>
          );
        }

        return null;
      })}
    </View>
  );
};

// 图片组件，带加载和错误处理
function MessageImage({ uri }: { uri: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 处理图片URI，确保格式正确
  const getImageSource = () => {
    if (!uri) {
      return { uri: '' };
    }

    // 对于本地文件路径，确保格式正确
    // iOS 上 file:// 路径需要正确编码
    let processedUri = uri.trim();
    
    // 如果是本地文件路径且没有 file:// 前缀，添加它
    if (processedUri.startsWith('/') && !processedUri.startsWith('file://')) {
      processedUri = `file://${processedUri}`;
    }

    // 对于 file:// 路径，确保路径中的特殊字符被正确编码
    // 但不要重复编码已经编码过的路径
    if (processedUri.startsWith('file://')) {
      try {
        // 分离 file:// 前缀和路径部分
        const pathPart = processedUri.substring(7); // 去掉 'file://'
        // 如果路径包含空格或特殊字符，需要编码
        // 但 React Native 的 Image 组件通常能处理未编码的 file:// 路径
        // 所以这里只做基本处理
        if (pathPart.includes(' ')) {
          // 对于包含空格的路径，尝试编码
          const encodedPath = encodeURI(pathPart);
          processedUri = `file://${encodedPath}`;
        }
      } catch (e) {
        console.warn('Error processing file path:', e);
      }
    }

    // 记录图片加载信息
    console.log('Loading image:', {
      originalUri: uri.length > 100 ? uri.substring(0, 100) + '...' : uri,
      processedUri: processedUri.length > 100 ? processedUri.substring(0, 100) + '...' : processedUri,
      isLocalFile: processedUri.startsWith('file://'),
      isHttp: processedUri.startsWith('http://') || processedUri.startsWith('https://')
    });

    return { uri: processedUri };
  };

  const handleLoadError = (error: any) => {
    console.error('Image loading failed:', {
      uri: uri.substring(0, 100),
      error: error?.nativeEvent?.error || error
    });
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <View style={styles.imageContainer}>
      <Image
        source={getImageSource()}
        style={styles.messageImage}
        resizeMode="cover"
        onLoadStart={() => {
          console.log('Starting to load image:', uri.substring(0, 100));
          setIsLoading(true);
          setHasError(false);
        }}
        onLoad={() => {
          console.log('Image loaded successfully:', uri.substring(0, 100));
          setIsLoading(false);
        }}
        onError={handleLoadError}
      />
      {isLoading && (
        <View style={styles.imageLoadingContainer}>
          <ActivityIndicator size="small" color="#666666" />
        </View>
      )}
      {hasError && (
        <View style={styles.imageErrorContainer}>
          <Text style={styles.imageErrorText}>Image loading failed</Text>
        </View>
      )}
    </View>
  );
}

export function ConversationSection({
  messages = [],
  isLoading = false,
  isSending = false,
  currentResponse = '',
  keyboardHeight = 0,
  onSendMessage
}: ConversationSectionProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const dot1Anim = useRef(new Animated.Value(0.4)).current;
  const dot2Anim = useRef(new Animated.Value(0.4)).current;
  const dot3Anim = useRef(new Animated.Value(0.4)).current;

  // 打字指示器动画
  useEffect(() => {
    if (isSending && !currentResponse) {
      console.log('Starting typing indicator animation');
      
      // 重置动画值
      dot1Anim.setValue(0.4);
      dot2Anim.setValue(0.4);
      dot3Anim.setValue(0.4);
      
      const createAnimation = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0.4,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const anim1 = createAnimation(dot1Anim, 0);
      const anim2 = createAnimation(dot2Anim, 200);
      const anim3 = createAnimation(dot3Anim, 400);

      // 启动动画
      anim1.start();
      anim2.start();
      anim3.start();

      return () => {
        console.log('Stopping typing indicator animation');
        anim1.stop();
        anim2.stop();
        anim3.stop();
        dot1Anim.setValue(0.4);
        dot2Anim.setValue(0.4);
        dot3Anim.setValue(0.4);
      };
    } else {
      // 停止动画
      dot1Anim.setValue(0.4);
      dot2Anim.setValue(0.4);
      dot3Anim.setValue(0.4);
    }
  }, [isSending, currentResponse, dot1Anim, dot2Anim, dot3Anim]);

  // 当消息更新时，滚动到底部
  useEffect(() => {
    if ((messages.length > 0 || isSending) && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, messages, isSending, currentResponse]);

  // 当键盘出现时，滚动到底部
  useEffect(() => {
    if (keyboardHeight > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [keyboardHeight]);

  // 复制消息到剪贴板
  const handleCopyMessage = (content: string) => {
    Clipboard.setString(content);
    Alert.alert('Copied', 'Message copied to clipboard', [{ text: 'OK' }]);
  };

  if (isLoading) {
    return (
      <View style={[styles.scrollContainer, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#999999" />
      </View>
    );
  }

  if (!messages || messages.length === 0) {
    return (
      <View style={[styles.scrollContainer, styles.emptyContainer]}>
        <Text style={styles.emptyText}>No conversation history</Text>
      </View>
    );
  }

  // Calculate dynamic padding based on keyboard height
  const dynamicPaddingBottom = keyboardHeight > 0 ? keyboardHeight + 80 : 200;

  // 找到所有 reminderCard 类型的消息，确定最后一条的索引
  const reminderCardIndices = messages
    .map((msg, index) => msg.type === 'reminderCard' ? index : -1)
    .filter(index => index !== -1);
  const lastReminderCardIndex = reminderCardIndices.length > 0 
    ? reminderCardIndices[reminderCardIndices.length - 1] 
    : -1;

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollContainer}
      contentContainerStyle={[styles.container, { paddingBottom: dynamicPaddingBottom }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      scrollEventThrottle={16}
    >
      {messages.map((message, index) => {
        // 过滤掉用户侧发出的带 operation 字段的消息
        console.log('message', message);
        //
        // 过滤掉用户侧发出的带 operation 字段的消息（operation 存在且不为空）
        if (message.type === 'user' && message.operation) {
          return null;
        }

        if (message.type === 'timestamp') {
          return (
            <View key={message.id} style={styles.timestampContainer}>
              <Text style={styles.timestamp}>{message.content}</Text>
            </View>
          );
        }

        if (message.type === 'reminderCard') {
          // 只有最后一条 reminderCard 可以交互
          const isLastReminderCard = index === lastReminderCardIndex;
          return (
            <View 
              key={message.id} 
              style={styles.reminderCardContainer}
              collapsable={false}
            >
              {message.reminderCardData && (
                <ReminderCard
                  title={message.reminderCardData.title}
                  monster={message.reminderCardData.monster}
                  reminders={message.reminderCardData.reminders}
                  disabled={!isLastReminderCard}
                  messageId={message.id}
                  onSendMessage={onSendMessage}
                />
              )}
            </View>
          );
        }

        if (message.type === 'assistant') {
          // 如果是 memory 消息，使用独特的样式
          if (message.isMemory) {
            return (
              <View key={message.id} style={styles.memoryMessageContainer} collapsable={false}>
                <View style={styles.memoryHeader}>
                  <Text style={styles.memoryIcon}>🧠</Text>
                  <Text style={styles.memoryLabel}>记忆</Text>
                </View>
                <TouchableOpacity
                  onLongPress={() => handleCopyMessage(message.content)}
                  delayLongPress={500}
                  activeOpacity={1}
                  style={styles.memoryContentWrapper}
                  hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                >
                  {renderMarkdownWithMonsterTags(message.content)}
                </TouchableOpacity>
              </View>
            );
          }
          
          // 普通 assistant 消息
          return (
            <View key={message.id} style={styles.assistantMessageContainer} collapsable={false}>
              <TouchableOpacity
                onLongPress={() => handleCopyMessage(message.content)}
                delayLongPress={500}
                activeOpacity={1}
                style={styles.assistantTextWrapper}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                {renderMarkdownWithMonsterTags(message.content)}
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <View key={message.id} style={styles.userMessageContainer}>
            <TouchableOpacity
              onLongPress={() => handleCopyMessage(message.content || 'Image message')}
              delayLongPress={500}
              activeOpacity={1}
              style={[styles.userBubble, message.photoUri && styles.userBubbleWithPhoto]}
            >
              {message.photoUri && (
                <MessageImage uri={message.photoUri} />
              )}
              {message.content ? (
                <View style={message.photoUri && styles.textWithImage}>
                  {renderMonsterColoredText(message.content)}
                </View>
              ) : message.photoUri && !message.content ? (
                <Text style={styles.photoOnlyText}>📷 Image</Text>
              ) : null}
            </TouchableOpacity>
          </View>
        );
      })}
      
      {/* 显示正在响应的状态 */}
      {isSending && !currentResponse && (
        <View style={styles.assistantMessageContainer} key="typing-indicator">
          <View style={styles.typingIndicatorWrapper}>
            <View style={styles.typingIndicator}>
              <Animated.View 
                style={[
                  styles.typingDot, 
                  { 
                    opacity: dot1Anim,
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.typingDot, 
                  { 
                    opacity: dot2Anim,
                  }
                ]} 
              />
              <Animated.View 
                style={[
                  styles.typingDot, 
                  { 
                    opacity: dot3Anim,
                  }
                ]} 
              />
            </View>
            <Text style={styles.typingText} numberOfLines={1}>Thinking...</Text>
          </View>
        </View>
      )}
      {/* 调试信息 */}
      {__DEV__ && (
        <View style={{ padding: 10, backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <Text style={{ fontSize: 10 }}>isSending: {String(isSending)}</Text>
          <Text style={{ fontSize: 10 }}>currentResponse: {currentResponse ? 'Has content' : 'Empty'}</Text>
          <Text style={{ fontSize: 10 }}>Show indicator: {String(isSending && !currentResponse)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F5F7F9',
  },
  container: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 200,
  },
  timestampContainer: {
    alignItems: 'center',
    marginVertical: 15,
  },
  timestamp: {
    fontSize: 13,
    color: '#999999',
    fontFamily: 'Nunito_500Medium',
  },
  assistantMessageContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginBottom: 0,
    alignItems: 'flex-start',
  },
  assistantAvatar: {
    width: 36,
    height: 36,
    marginBottom: 8,
  },
  assistantTextWrapper: {
    alignSelf: 'flex-start',
    flexShrink: 1,
  },
  assistantText: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: '#000000',
    lineHeight: 22,
  },
  monsterTag: {
    fontSize: 15,
    fontFamily: 'Nunito_600SemiBold',
    lineHeight: 22,
  },
  userMessageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    marginBottom: 15,
  },
  userBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    padding: 14,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userBubbleWithPhoto: {
    maxWidth: '85%',
    padding: 8,
  },
  userText: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: '#000000',
    lineHeight: 22,
  },
  imageContainer: {
    position: 'relative',
    width: 220,
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  messageImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageErrorText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: 'Nunito_400Regular',
  },
  photoOnlyText: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#666666',
  },
  textWithImage: {
    marginTop: 0,
    paddingHorizontal: 6,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Nunito_400Regular',
    color: '#999999',
  },
  typingIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 18,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999999',
  },
  typingText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#999999',
    fontStyle: 'italic',
    flexShrink: 0,
  },
  reminderCardContainer: {
    marginBottom: 15,
    width: '100%',
  },
  memoryMessageContainer: {
    flexDirection: 'column',
    marginBottom: 15,
    marginTop: 8,
    backgroundColor: '#F0F4FF',
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#6B8EFF',
    shadowColor: '#6B8EFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  memoryIcon: {
    fontSize: 16,
  },
  memoryLabel: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: '#6B8EFF',
    letterSpacing: 0.5,
  },
  memoryContentWrapper: {
    alignSelf: 'flex-start',
    flexShrink: 1,
  },
});
