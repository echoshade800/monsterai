import Clipboard from '@react-native-clipboard/clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronRight, RefreshCw } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import mobileDataManager from '../src/utils/mobile-data-manager';

interface UploadHistoryRecord {
  id: string;
  uploadTime: number;
  dataSummary: {
    hasData: boolean;
    recordCount: number;
    stepCount: number;
    heartRate: number;
    activeEnergy: number;
    distance: number;
    sleepRecords: number;
    calendarEvents: number;
    hasLocation: boolean;
    hasGyroscope: boolean;
  };
  fullData?: {
    uid: string;
    data: any[];
  };
}

export default function PhoneDataScreen() {
  const router = useRouter();
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<UploadHistoryRecord | null>(null);

  const loadUploadHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const history = await mobileDataManager.getUploadHistory();
      setUploadHistory(history);
    } catch (error) {
      console.error('[PhoneData] Failed to load upload history:', error);
      Alert.alert('错误', '加载上传历史失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 加载数据
  useFocusEffect(
    useCallback(() => {
      loadUploadHistory();
    }, [loadUploadHistory])
  );

  const handleBack = () => {
    if (selectedRecord) {
      setSelectedRecord(null);
    } else {
      router.back();
    }
  };

  const handleRefresh = () => {
    loadUploadHistory();
  };

  const handleClearHistory = () => {
    Alert.alert(
      '清除历史',
      '确定要清除所有上传历史吗？此操作无法撤销。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            try {
              await mobileDataManager.clearUploadHistory();
              setUploadHistory([]);
              Alert.alert('成功', '上传历史已清除');
            } catch (error) {
              console.error('[PhoneData] Failed to clear history:', error);
              Alert.alert('错误', '清除历史失败');
            }
          },
        },
      ]
    );
  };

  const handleRecordPress = (record: UploadHistoryRecord) => {
    setSelectedRecord(record);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}天前`;
    } else if (hours > 0) {
      return `${hours}小时前`;
    } else if (minutes > 0) {
      return `${minutes}分钟前`;
    } else {
      return '刚刚';
    }
  };

  const formatFullTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 详情视图
  if (selectedRecord) {
    return <DetailView record={selectedRecord} onBack={handleBack} />;
  }

  // 列表视图
  const renderRecordItem = ({ item }: { item: UploadHistoryRecord }) => {
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => handleRecordPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.listItemContent}>
          <View style={styles.listItemLeft}>
            <Text style={styles.listItemTime}>{formatTime(item.uploadTime)}</Text>
            <Text style={styles.listItemDate}>{formatFullTime(item.uploadTime)}</Text>
            {item.dataSummary.hasData && (
              <View style={styles.listItemSummary}>
                {item.dataSummary.stepCount > 0 && (
                  <Text style={styles.listItemSummaryText}>
                    步数: {Math.round(item.dataSummary.stepCount).toLocaleString()}
                  </Text>
                )}
                {item.dataSummary.heartRate > 0 && (
                  <Text style={styles.listItemSummaryText}>
                    心率: {Math.round(item.dataSummary.heartRate)} bpm
                  </Text>
                )}
              </View>
            )}
          </View>
          <ChevronRight size={20} color="#999999" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>上传历史</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton} disabled={isLoading}>
          <RefreshCw size={20} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {uploadHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>暂无上传历史</Text>
          <Text style={styles.emptySubtext}>上传手机数据后，历史记录将显示在这里</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={uploadHistory}
            renderItem={renderRecordItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
          <TouchableOpacity style={styles.clearButton} onPress={handleClearHistory}>
            <Text style={styles.clearButtonText}>清除所有历史</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// 详情视图组件
function DetailView({ record, onBack }: { record: UploadHistoryRecord; onBack: () => void }) {
  const fullData = record.fullData;

  const handleCopyJson = async (jsonString: string) => {
    try {
      await Clipboard.setString(jsonString);
      Alert.alert('成功', 'JSON 数据已复制到剪贴板');
    } catch (error) {
      console.error('[PhoneData] Failed to copy to clipboard:', error);
      Alert.alert('错误', '复制失败，请重试');
    }
  };

  const renderDataSection = (title: string, content: any) => {
    const jsonString = JSON.stringify(content, null, 2);
    return (
      <View style={detailStyles.section}>
        <View style={detailStyles.sectionHeader}>
          <Text style={detailStyles.sectionTitle}>{title}</Text>
          <TouchableOpacity onPress={() => handleCopyJson(jsonString)}>
            <Text style={detailStyles.copyButton}>复制</Text>
          </TouchableOpacity>
        </View>
        <View style={detailStyles.sectionContent}>
          <Text style={detailStyles.jsonText} selectable>
            {jsonString}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={detailStyles.container}>
      <View style={detailStyles.header}>
        <TouchableOpacity onPress={onBack} style={detailStyles.backButton}>
          <Text style={detailStyles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={detailStyles.headerTitle}>上传详情</Text>
        <View style={detailStyles.backButton} />
      </View>

      <ScrollView
        style={detailStyles.scrollView}
        contentContainerStyle={detailStyles.scrollContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        <View style={detailStyles.infoCard}>
          <Text style={detailStyles.infoTitle}>上传时间</Text>
          <Text style={detailStyles.infoValue}>
            {new Date(record.uploadTime).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </Text>
        </View>

        {fullData ? (
          <>
            <View style={detailStyles.infoCard}>
              <Text style={detailStyles.infoTitle}>用户ID</Text>
              <Text style={detailStyles.infoValue}>{fullData.uid || '未知'}</Text>
            </View>

            {fullData.data && Array.isArray(fullData.data) && fullData.data.length > 0 ? (
              fullData.data.map((dataRecord: any, index: number) => (
                <View key={index} style={detailStyles.dataCard}>
                  <Text style={detailStyles.dataCardTitle}>数据记录 #{index + 1}</Text>
                  {renderDataSection('完整数据', dataRecord)}
                </View>
              ))
            ) : (
              <View style={detailStyles.infoCard}>
                <Text style={detailStyles.infoTitle}>数据</Text>
                <Text style={detailStyles.infoValue}>无数据</Text>
              </View>
            )}
          </>
        ) : (
          <View style={detailStyles.infoCard}>
            <Text style={detailStyles.infoTitle}>完整数据</Text>
            <Text style={detailStyles.infoValue}>未保存完整数据（此记录为旧格式）</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 32,
    color: '#000000',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  refreshButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  listItemLeft: {
    flex: 1,
  },
  listItemTime: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  listItemDate: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  listItemSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  listItemSummaryText: {
    fontSize: 12,
    color: '#999999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  clearButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
});

const detailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 32,
    color: '#000000',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  dataCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  dataCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  copyButton: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  jsonText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#333333',
    lineHeight: 18,
  },
});
