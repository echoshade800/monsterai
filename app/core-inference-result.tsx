import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import api from '../src/services/api-clients/client';
import { API_ENDPOINTS } from '../src/services/api/api';

export default function CoreInferenceResultScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    router.back();
  };

  // 调用 data-agent/launch 接口并展示结果
  const callLaunchApi = useCallback(async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);
    console.log('[CoreInferenceResult] 🚀 Calling data-agent/launch API...');

    try {
      // 等待 API 响应
      const response = await api.post(API_ENDPOINTS.DATA_AGENT.LAUNCH, {}, {
        requireAuth: false,
      });
      
      console.log('[CoreInferenceResult] ✅ Launch API response:', response);
      
      // 只展示 final_output 部分的内容
      if (response.isSuccess() && response.data?.final_output) {
        // final_output 本身就是 Markdown 格式，直接使用
        setResult(response.data.final_output);
      } else {
        // 如果没有 final_output，显示错误信息
        const errorMsg = response.getMessage() || '未获取到 final_output 数据';
        setError(`## 错误\n\n**错误信息:** ${errorMsg}\n\n`);
      }
    } catch (error: any) {
      console.error('[CoreInferenceResult] ❌ Error calling launch API:', error);
      const errorMessage = error?.message || '未知错误';
      setError(`## 错误\n\n**错误信息:** ${errorMessage}\n\n`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>核心推理结果</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={[styles.button, isLoading && styles.buttonDisabled]} 
          onPress={callLaunchApi}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>触发 Launch API</Text>
          )}
        </TouchableOpacity>

        {(result || error) && (
          <ScrollView 
            style={styles.resultContainer}
            contentContainerStyle={styles.resultContent}
            showsVerticalScrollIndicator={true}
          >
            <Markdown style={markdownStyles}>
              {result || error || ''}
            </Markdown>
          </ScrollView>
        )}

        {!result && !error && !isLoading && (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>核心推理结果页面</Text>
            <Text style={styles.placeholderSubtext}>点击上方按钮触发 API 调用</Text>
          </View>
        )}
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
    minHeight: 48,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  resultContent: {
    paddingBottom: 20,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

// Markdown 样式配置
const markdownStyles = {
  body: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  heading1: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 12,
    marginBottom: 8,
    color: '#000000',
  },
  heading2: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 10,
    marginBottom: 6,
    color: '#000000',
  },
  heading3: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginTop: 8,
    marginBottom: 4,
    color: '#000000',
  },
  strong: {
    fontWeight: '700' as const,
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

