import { useEffect, useRef } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'timestamp';
  content: string;
  avatar?: string;
}

interface ConversationSectionProps {
  messages?: Message[];
  isLoading?: boolean;
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
              <View style={styles.assistantBubble}>
                <Text style={styles.assistantText}>{message.content}</Text>
              </View>
            </View>
          );
        }

        return (
          <View key={message.id} style={styles.userMessageContainer}>
            <View style={styles.userBubble}>
              <Text style={styles.userText}>{message.content}</Text>
            </View>
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
    paddingBottom: 120,
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
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 15,
  },
  assistantBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 18,
    padding: 14,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  userText: {
    fontSize: 15,
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    lineHeight: 22,
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
