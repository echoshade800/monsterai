import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'timestamp';
  content: string;
  avatar?: string;
}

const messages: Message[] = [
  { id: '1', type: 'timestamp', content: '8:42' },
  {
    id: '2',
    type: 'assistant',
    content: 'What are your plans for breakfast this morning?',
    avatar: '🦑',
  },
  {
    id: '3',
    type: 'user',
    content: 'I had a cup of yogurt with cereal.',
  },
  {
    id: '4',
    type: 'assistant',
    content: 'Let me take a quick look.',
    avatar: '🦑',
  },
  {
    id: '5',
    type: 'assistant',
    content: 'A croissant and latte are okay occasionally, but may be high in sugar and fats for your current goals.',
    avatar: '🦑',
  },
  {
    id: '6',
    type: 'assistant',
    content: "If you'd like to keep it balanced, here's a better portion suggestion:\n• Croissant: Half or pair with eggs\n• Latte: Choose oat milk or no sugar\n\nWould you like me to log this as your planned breakfast?",
    avatar: '🦑',
  },
];

export function ConversationSection() {
  return (
    <View style={styles.container}>
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
              <View style={styles.avatarContainer}>
                <Text style={styles.avatar}>{message.avatar}</Text>
              </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
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
  },
  assistantMessageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatar: {
    fontSize: 24,
  },
  assistantBubble: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 18,
    padding: 14,
    maxWidth: '75%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  assistantText: {
    fontSize: 15,
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
    color: '#000000',
    lineHeight: 22,
  },
});
