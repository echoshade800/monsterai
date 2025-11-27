import Clipboard from '@react-native-clipboard/clipboard';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ReminderCard } from './ReminderCard';

interface ReminderItem {
  time: string;
  title: string;
}

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
}

interface ConversationSectionProps {
  messages?: Message[];
  isLoading?: boolean;
  isSending?: boolean;
  currentResponse?: string;
  keyboardHeight?: number;
}

// Monster 颜色映射表（统一管理）
const MONSTER_COLORS: Record<string, string> = {
  foodie: '#F38319',
  moodie: '#7A4DBA',
  sleeper: '#206BDB',
  poopy: '#844E02',
  posture: '#32C25F',
  facey: '#FF4FB0',
  butler: '#666666',
};

// Monster 头像 URL 映射表
const MONSTER_AVATARS: Record<string, string> = {
  foodie: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profileenergy.png',
  moodie: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profilestress.png',
  sleeper: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profilesleep.png',
  poopy: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profilepoop.png',
  posture: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profileposture.png',
  facey: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profileface.png',
  butler: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/profilesteward.png',
};

// 统一渲染函数：给所有 [MonsterName] 标签加颜色，并在标签前显示头像
const renderMonsterColoredText = (text: string) => {
  if (!text) return null;

  // 使用 split 分割文本，保留标签作为独立元素
  // 正则 /(\[[^\]]+\])/g 会匹配所有 [MonsterName] 标签，并保留在结果数组中
  const parts = text.split(/(\[[^\]]+\])/g);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {parts.map((part, index) => {
        // 跳过空字符串（split 可能在开头/结尾产生空字符串）
        if (part.length === 0) {
          return null;
        }

        // 检查是否是标签格式 [MonsterName]
        const tagMatch = part.match(/^\[([^\]]+)\]$/);
        if (tagMatch) {
          const name = tagMatch[1].trim().toLowerCase();
          const color = MONSTER_COLORS[name] ?? '#000000';
          const avatarUrl = MONSTER_AVATARS[name];
          
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
                {tagMatch[1]}
              </Text>
            </View>
          );
        }

        // 普通文本（包括冒号、空格、换行符等）
        // 如果紧跟在标签后面，删除开头的冒号（中文冒号：或英文冒号:）和多余的空行
        let displayText = part;
        if (index > 0) {
          const prevPart = parts[index - 1];
          // 检查前一个部分是否是标签
          if (prevPart && prevPart.match(/^\[([^\]]+)\]$/)) {
            // 删除开头的冒号（中文或英文）
            displayText = part.replace(/^[：:]\s*/, '');
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

        return (
          <Text key={index} style={{ fontSize: 15, fontFamily: 'Nunito_400Regular', lineHeight: 22 }}>
            {displayText}
          </Text>
        );
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
  keyboardHeight = 0
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

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollContainer}
      contentContainerStyle={[styles.container, { paddingBottom: dynamicPaddingBottom }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
    >
      {messages.map((message) => {
        if (message.type === 'timestamp') {
          return (
            <View key={message.id} style={styles.timestampContainer}>
              <Text style={styles.timestamp}>{message.content}</Text>
            </View>
          );
        }

        if (message.type === 'reminderCard') {
          return (
            <View key={message.id} style={styles.reminderCardContainer}>
              {message.reminderCardData && (
                <ReminderCard
                  title={message.reminderCardData.title}
                  monster={message.reminderCardData.monster}
                  reminders={message.reminderCardData.reminders}
                />
              )}
            </View>
          );
        }

        if (message.type === 'assistant') {
          return (
            <View key={message.id} style={styles.assistantMessageContainer}>
              <Pressable
                onLongPress={() => handleCopyMessage(message.content)}
                style={styles.assistantTextWrapper}
              >
                {renderMonsterColoredText(message.content)}
              </Pressable>
            </View>
          );
        }

        return (
          <View key={message.id} style={styles.userMessageContainer}>
            <Pressable
              onLongPress={() => handleCopyMessage(message.content || 'Image message')}
              style={[styles.userBubble, message.photoUri && styles.userBubbleWithPhoto]}
            >
              {message.photoUri && (
                <MessageImage uri={message.photoUri} />
              )}
              {message.content ? (
                <Text style={[styles.userText, message.photoUri && styles.textWithImage]}>
                  {message.content}
                </Text>
              ) : message.photoUri && !message.content ? (
                <Text style={styles.photoOnlyText}>📷 Image</Text>
              ) : null}
            </Pressable>
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
    width: '100%',
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
});
