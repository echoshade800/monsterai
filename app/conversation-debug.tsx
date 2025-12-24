import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ConversationDebug() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // 从路由参数中获取消息数据
  let messagesData: any[] = [];
  try {
    if (params.messagesData) {
      const dataStr = Array.isArray(params.messagesData) 
        ? params.messagesData[0] 
        : params.messagesData as string;
      messagesData = JSON.parse(dataStr);
    }
  } catch (error) {
    console.error('Failed to parse messages data:', error);
    messagesData = [];
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>会话调试页面</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>消息列表原始数据</Text>
          <Text style={styles.infoText}>消息总数: {Array.isArray(messagesData) ? messagesData.length : 0}</Text>
        </View>
        
        <View style={styles.dataSection}>
          <Text style={styles.dataTitle}>原始 JSON 数据:</Text>
          <ScrollView 
            horizontal 
            style={styles.jsonScrollView}
            contentContainerStyle={styles.jsonContentContainer}
          >
            <Text style={styles.jsonText} selectable>
              {JSON.stringify(messagesData, null, 2)}
            </Text>
          </ScrollView>
        </View>
        
        {Array.isArray(messagesData) && messagesData.length > 0 && (
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>消息列表详情</Text>
            {messagesData.map((message: any, index: number) => (
              <View key={message.id || index} style={styles.messageItem}>
                <Text style={styles.messageIndex}>#{index + 1}</Text>
                <View style={styles.messageContent}>
                  <Text style={styles.messageId}>ID: {message.id || 'N/A'}</Text>
                  <Text style={styles.messageType}>类型: {message.type || 'N/A'}</Text>
                  {message.timestamp && (
                    <Text style={styles.messageTimestamp}>
                      时间戳: {new Date(message.timestamp).toLocaleString()}
                    </Text>
                  )}
                  {message.isMemory && (
                    <Text style={styles.memoryTag}>🧠 Memory 消息</Text>
                  )}
                  {message.content && (
                    <Text style={styles.messageText} numberOfLines={3}>
                      内容: {message.content}
                    </Text>
                  )}
                  <View style={styles.messageData}>
                    <Text style={styles.messageDataTitle}>完整数据:</Text>
                    <Text style={styles.messageDataText} selectable>
                      {JSON.stringify(message, null, 2)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#206BDB',
    fontFamily: 'Nunito_600SemiBold',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#666666',
  },
  dataSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dataTitle: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#000000',
    marginBottom: 8,
  },
  jsonScrollView: {
    maxHeight: 300,
  },
  jsonContentContainer: {
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  jsonText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#333333',
  },
  listSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  messageIndex: {
    fontSize: 14,
    fontFamily: 'Nunito_700Bold',
    color: '#206BDB',
    marginRight: 12,
    minWidth: 40,
  },
  messageContent: {
    flex: 1,
  },
  messageId: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#666666',
    marginBottom: 4,
  },
  messageType: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#666666',
    marginBottom: 4,
  },
  messageTimestamp: {
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
    color: '#999999',
    marginBottom: 4,
  },
  memoryTag: {
    fontSize: 12,
    fontFamily: 'Nunito_600SemiBold',
    color: '#6B8EFF',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 13,
    fontFamily: 'Nunito_400Regular',
    color: '#000000',
    marginBottom: 8,
    lineHeight: 18,
  },
  messageData: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  messageDataTitle: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    color: '#666666',
    marginBottom: 4,
  },
  messageDataText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#333333',
  },
});

