import Clipboard from '@react-native-clipboard/clipboard';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'timestamp';
  content: string;
  avatar?: string;
  photoUri?: string;
}

interface ConversationSectionProps {
  messages?: Message[];
  isLoading?: boolean;
}

// 图片组件，带加载和错误处理
function MessageImage({ uri }: { uri: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri }}
        style={styles.messageImage}
        resizeMode="cover"
        onLoadStart={() => {
          setIsLoading(true);
          setHasError(false);
        }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {isLoading && (
        <View style={styles.imageLoadingContainer}>
          <ActivityIndicator size="small" color="#666666" />
        </View>
      )}
      {hasError && (
        <View style={styles.imageErrorContainer}>
          <Text style={styles.imageErrorText}>图片加载失败</Text>
        </View>
      )}
    </View>
  );
}

export function ConversationSection({ messages = [], isLoading = false }: ConversationSectionProps) {
  const scrollViewRef = useRef<ScrollView>(null);

  // 当消息更新时，滚动到底部
  useEffect(() => {
    if (messages.length > 0 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // 复制消息到剪贴板
  const handleCopyMessage = (content: string) => {
    Clipboard.setString(content);
    Alert.alert('已复制', '消息已复制到剪贴板', [{ text: '确定' }]);
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
        <Text style={styles.emptyText}>暂无对话记录</Text>
      </View>
    );
  }
  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {messages.map((message) => {
        if (message.type === 'timestamp') {
          return (
            <View key={message.id} style={styles.timestampContainer}>
              <Text style={styles.timestamp}>{message.content}</Text>
            </View>
          );
        }

        if (message.type === 'assistant') {
          return (
            <View key={message.id} style={styles.assistantMessageContainer}>
              <Image
                source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/chatposture.png' }}
                style={styles.assistantAvatar}
              />
              <Pressable
                onLongPress={() => handleCopyMessage(message.content)}
                style={styles.assistantTextWrapper}
              >
                <Text style={styles.assistantText}>{message.content}</Text>
              </Pressable>
            </View>
          );
        }

        return (
          <View key={message.id} style={styles.userMessageContainer}>
            <Pressable
              onLongPress={() => handleCopyMessage(message.content || '图片消息')}
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
                <Text style={styles.photoOnlyText}>📷 图片</Text>
              ) : null}
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F5F7F9',
  },
  container: {
    paddingHorizontal: 20,
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
    fontWeight: '500',
    fontFamily: 'SF Compact Rounded',
  },
  assistantMessageContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginBottom: 15,
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
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
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
    fontFamily: 'SF Compact Rounded',
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
    fontFamily: 'SF Compact Rounded',
  },
  photoOnlyText: {
    fontSize: 13,
    fontFamily: 'SF Compact Rounded',
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
    fontFamily: 'SF Compact Rounded',
    color: '#999999',
  },
});
