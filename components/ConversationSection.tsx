import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { messageService, supabase, Message } from '@/services/messageService';


export function ConversationSection() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadMessages();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  async function loadMessages() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const loadedMessages = await messageService.getMessages(user.id);
      setMessages(loadedMessages);
    }
    setLoading(false);
  }

  function setupRealtimeSubscription() {
    let unsubscribe: (() => void) | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        unsubscribe = messageService.subscribeToMessages(user.id, (newMessage) => {
          setMessages((prev) => [...prev, newMessage]);
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading messages...</Text>
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
                source={{ uri: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/Group%2092.png' }}
                style={styles.avatarImage}
              />
              <Text style={styles.assistantText}>{message.content}</Text>
            </View>
          );
        }

        return (
          <View key={message.id} style={styles.userMessageContainer}>
            <View style={styles.userBubble}>
              {message.image_url && (
                <Image
                  source={{ uri: message.image_url }}
                  style={styles.messageImage}
                  resizeMode="cover"
                />
              )}
              {message.content && (
                <Text style={styles.userText}>{message.content}</Text>
              )}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F7F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 15,
    fontFamily: 'SF Compact Rounded',
    color: '#999999',
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
    flexDirection: 'column',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  avatarImage: {
    width: 40,
    height: 40,
    marginBottom: 8,
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
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
});
