import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, NativeEventEmitter, NativeModules, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { unzip } from 'react-native-zip-archive';
import { GameCard } from '../../components/GameCard';
import { MonsterCard } from '../../components/MonsterCard';
import { api } from '../../src/services/api-clients/client';
import { API_ENDPOINTS, getBaseUrl, getConfigFileName } from '../../src/services/api/api';
import storageManager from '../../src/utils/storage';
const { MiniAppLauncher,NetworkTrigger } = NativeModules;
const emitter = new NativeEventEmitter(NetworkTrigger);

// Monster 数据类型定义
interface MonsterData {
  id: string;
  agentName: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  backgroundColor: string;
  imageSize: string;
  imageOffset: number;
}

// MiniApp 和游戏数据类型（基于 JSON 配置文件结构）
interface MiniAppConfig {
  // JSON 配置文件中的必需字段
  id: string;
  version: string;
  name: string;
  icon: string;
  color: string;
  miniAppType: string;
  host: string;
  module_name: string;
  category: string;
  image: string;
  releaseUrl: string;
  // 可选字段（可能在某些配置中存在）
  tag: string[];
  score?: string;
  hot: boolean;
}

export function useNativeTrigger() {
  console.log('useNativeTrigger 初始化 - 只执行一次');
  
  const sub = emitter.addListener('NativeAction', async (evt) => {
    // 约定 evt 结构，比如 { type: 'request', payload: {...} }
    console.log('收到原生事件:', evt);
    if (evt) {
      if (evt.type === 'miniapp_rn') {
        console.log('处理 MiniApp 事件:', evt.payload);
        const mini_app_name = evt.payload.mini_app_name;
        try {
          // 从本地取出来数据
          const data = await storageManager.getMiniAppData(mini_app_name);
          if (!data) {
            console.log('本地数据未找到:', mini_app_name);
            return;
          }
          console.log('upload mini app data to server', mini_app_name, data);
          // 在这里触发网络请求
          const response = await api.post(API_ENDPOINTS.MINI_APP.UPDATE_DATA, {
            "appName": mini_app_name,
            "data": JSON.stringify(data)
          });
          console.log('upload mini app data to server success', response);
        } catch (error) {
          console.error('处理 MiniApp 事件失败:', error);
        }
      } else if (evt.type === 'miniapp_h5') {
        console.log('处理 MiniApp H5 事件:', evt.payload);
        const mini_app_name = evt.payload.mini_app_name;
        try {
          const data = evt.payload.data;
          if (!data) {
            console.log('本地数据未找到:', mini_app_name);
            return;
          }
          console.log('upload mini app data to server', mini_app_name, data);
          // 在这里触发网络请求
          const response = await api.post(API_ENDPOINTS.MINI_APP.UPDATE_DATA, {
            "appName": mini_app_name,
            "data": JSON.stringify(data)
          });
          console.log('upload mini app data to server success', response);
        } catch (error) {
          console.error('处理 MiniApp 事件失败:', error);
        }
      } else {
        console.log('处理其他事件:', evt.payload);
      }
    }
  });
  
  // 返回清理函数
  return () => {
    console.log('清理原生事件监听器');
    sub.remove();
  };
}


export default function MarketTab() {
  const router = useRouter();
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [monstersData, setMonstersData] = useState<MonsterData[]>([]);
  const [gamesData, setGamesData] = useState<MiniAppConfig[]>([]);
  const [miniAppsData, setMiniAppsData] = useState<MiniAppConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMonstersLoading, setIsMonstersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // 使用单独的 useEffect 来设置原生事件监听器，确保只执行一次
  useEffect(() => {
    const cleanup = useNativeTrigger();
    // 返回清理函数
    return cleanup;
  }, []);
  // 从 API 获取 Monsters 数据
  useEffect(() => {
    const fetchMonstersData = async () => {
      try {
        setIsMonstersLoading(true);
        // 根据环境选择不同的配置文件
        const configFile = getConfigFileName('agent');
        // 添加时间戳参数防止缓存
        const timestamp = Date.now();
        const cdnBaseUrl = getBaseUrl('cdn');
        const fullUrl = `${cdnBaseUrl}/${configFile}?t=${timestamp}`
        console.log('fetchMonstersAgentData fullUrl', fullUrl);
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: MonsterData[] = await response.json();
        console.log('Monsters data:', JSON.stringify(data, null, 2));
        setMonstersData(data);
      } catch (err) {
        console.error('获取 Monsters 数据失败:', err);
        // 发生错误时使用空数组，避免应用崩溃
        setMonstersData([]);
      } finally {
        setIsMonstersLoading(false);
      }
    };

    fetchMonstersData();
  }, []);

  // 从 API 获取 MiniApp 数据
  useEffect(() => {
    const fetchMiniAppData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // 根据环境选择不同的配置文件
        const configFile = getConfigFileName('miniapp');
        // 添加时间戳参数防止缓存
        const timestamp = Date.now();
        const cdnBaseUrl = getBaseUrl('cdn');
        const fullUrl = `${cdnBaseUrl}/${configFile}?t=${timestamp}`;
        console.log('fetchMiniAppData fullUrl', fullUrl);
        const response = await fetch(fullUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: MiniAppConfig[] = await response.json();
        
        // 将 API 数据映射到现有格式，并同时分类
        const games: MiniAppConfig[] = [];
        const miniApps: MiniAppConfig[] = [];
        
        data.forEach((item) => {
          const mappedItem: MiniAppConfig = {
            ...item,
          };
          
          // 根据 category 分类：gaming 类别的是 games，其他是 miniapps
          if (item.category === 'gaming') {
            games.push(mappedItem);
          } else {
            miniApps.push(mappedItem);
          }
        });
        
        setGamesData(games);
        setMiniAppsData(miniApps);
      } catch (err) {
        console.error('获取 MiniApp 数据失败:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // 发生错误时使用空数组，避免应用崩溃
        setGamesData([]);
        setMiniAppsData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMiniAppData();
  }, []);

  const handleFingerprintPress = (agentName: string) => {
    console.log('Fingerprint pressed:', agentName);
    router.push({
      pathname: '/agent-detail',
      params: { id: agentName },
    });
  };

  const handleHirePress = (monsterId: string) => {
    console.log('Hired monster:', monsterId);
  };

  // 将版本号从 "1.0.0" 格式转换为 "1_0_0" 格式（用于文件名）
  const formatVersionForFileName = (version: string): string => {
    return version.replace(/\./g, '_');
  };

  // 公共的 MiniApp 启动逻辑
  const launchMiniApp = async (appConfig: MiniAppConfig) => {
    try {
      if (appConfig.miniAppType === 'H5') {
        // 开发环境使用 host，生产环境使用 releaseUrl
        const h5Url = __DEV__ ? appConfig.host : appConfig.releaseUrl;
        if (!h5Url) {
          Alert.alert('Error', __DEV__ ? 'H5 app host address not found' : 'H5 app releaseUrl address not found');
          return;
        }
        console.log('打开 H5 应用:', h5Url);
        const params = {
          title: appConfig.name,
          miniAppType: appConfig.miniAppType,
        };
        MiniAppLauncher.open(h5Url, appConfig.module_name, '', params);
        return;
      } else {
        
        const documentsDir = FileSystem.documentDirectory;
        const moduleName = appConfig.module_name;
        const version = appConfig.version || '1.0.0';
        const versionForFileName = formatVersionForFileName(version);
        const targetDir = `${documentsDir}MiniApp/${moduleName}/${versionForFileName}/`;
        const targetModuleName = `${documentsDir}MiniApp/${moduleName}/`;
        // 检查本地文件夹是否存在
        const dirInfo = await FileSystem.getInfoAsync(targetDir);
        
        if (!dirInfo.exists && appConfig.releaseUrl) {
          // 需要下载和解压
          try {
            // 显示下载 Loading
            setIsDownloading(true);
            
            // 如果 targetDir 不存在，先删除 targetModuleName 路径下的所有子文件夹
            const moduleDirInfo = await FileSystem.getInfoAsync(targetModuleName);
            if (moduleDirInfo.exists && moduleDirInfo.isDirectory) {
              const subDirs = await FileSystem.readDirectoryAsync(targetModuleName);
              console.log('发现旧版本文件夹，开始清理:', subDirs);
              for (const subDir of subDirs) {
                const subDirPath = `${targetModuleName}${subDir}/`;
                try {
                  await FileSystem.deleteAsync(subDirPath, { idempotent: true });
                  console.log('已删除旧版本文件夹:', subDirPath);
                } catch (deleteError) {
                  console.warn('删除旧版本文件夹失败:', subDirPath, deleteError);
                }
              }
            }
            
            // 下载压缩包
            const zipFileName = `${moduleName}_${versionForFileName}.zip`;
            const zipFilePath = `${documentsDir}${zipFileName}`;
            
            console.log('开始下载:', appConfig.releaseUrl);
            const downloadResult = await FileSystem.downloadAsync(appConfig.releaseUrl, zipFilePath);
            
            if (downloadResult.status !== 200) {
              throw new Error(`Download failed, status code: ${downloadResult.status}`);
            }
            
            console.log('下载完成，开始解压:', zipFilePath);
            
            // 确保目标目录存在
            await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
            
            // 解压到目标目录
            const unzipPath = await unzip(zipFilePath, targetDir);
            console.log('解压完成:', unzipPath);
            // 删除临时 zip 文件
            await FileSystem.deleteAsync(zipFilePath, { idempotent: true });
            console.log('临时文件已删除');
            
            // 隐藏下载 Loading
            setIsDownloading(false);
          } catch (downloadError) {
            // 隐藏下载 Loading
            setIsDownloading(false);
            console.error('下载或解压失败:', downloadError);
            Alert.alert(
              '❌ Download Failed',
              `Unable to download or extract app package:\n${downloadError instanceof Error ? downloadError.message : String(downloadError)}`,
              [{ text: 'OK' }]
            );
            return;
          }
        } else if (!dirInfo.exists) {
          
          Alert.alert(
            '⚠️ Directory Not Found',
            `Local bundle directory does not exist:\n${targetDir}\n\nAnd no download URL provided.`,
            [{ text: 'OK' }]
          );
          return;
        }
        
        // 检查解压后的目录是否存在
        // 解压后的文件结构为: rnbundle/main.jsbundle
        const targetDirInfo = await FileSystem.getInfoAsync(targetDir);
        console.log('targetDirInfo', targetDirInfo);
        if (!targetDirInfo.exists) {
          Alert.alert(
            '⚠️ Directory Not Found',
            `Local bundle directory does not exist:\n${targetDir}`,
            [{ text: 'OK' }]
          );
          return;
        }

        // 构建完整路径: {targetDir}rnbundle/main.jsbundle
        const bundlePath = `${targetDir}rnbundle/main.jsbundle`;
        
        console.log('加载本地 bundle:', bundlePath);
        console.log('模块名:', appConfig.module_name);
        console.log('应用名:', appConfig.name);
        console.log('类型:', appConfig.miniAppType || 'RN');

        // 调用 MiniAppLauncher 打开本地 bundle
        const params = {
          title: appConfig.name,
          miniAppType: appConfig.miniAppType || 'RN',
          localBundle: true,
        };
        MiniAppLauncher.open(
          bundlePath,
          appConfig.module_name,
          versionForFileName,
          params,
        );
      }
    } catch (error) {
      console.error('打开MiniApp失败:', error);
      Alert.alert(
        '❌ Failed to Open MiniApp',
        `Unable to open MiniApp\n${error instanceof Error ? error.message : String(error)}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handlePlayPress = async (gameId: string) => {
    const game = gamesData.find(g => g.id === gameId);
    console.log('Playing game:', gameId, 'URL:', game?.image);
    
    if (!game) {
      Alert.alert('Error', 'Game information not found');
      return;
    }

    await launchMiniApp(game);
  };

  const handleMiniAppPress = async (appId: string) => {
    const app = miniAppsData.find(a => a.id === appId);
    console.log('Opening mini app:', appId, 'URL:', app?.image);
    
    if (!app) {
      Alert.alert('Error', 'App information not found');
      return;
    }



    await launchMiniApp(app);
  };

  const handleBannerPress = () => {
    setShowComingSoonModal(true);
  };

  const closeModal = () => {
    setShowComingSoonModal(false);
  };

  const renderGameRow = (games: MiniAppConfig[]) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.gamesRow}
      contentContainerStyle={styles.gamesRowContent}
    >
      {games.map((game: MiniAppConfig) => (
        console.log('game', game),
        <GameCard
          key={game.id}
          id={game.id}
          name={game.name}
          imageUrl={game.image}
          isHot={game.hot}
          rating={game.score ? parseInt(game.score.match(/(\d+)/)?.[1] || '0', 10) : 0}
          tags={game.tag}
          score={game.score}
          onPlayPress={handlePlayPress}
        />
      ))}
    </ScrollView>
  );

  const renderMiniAppRow = (apps: MiniAppConfig[]) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.gamesRow}
      contentContainerStyle={styles.gamesRowContent}
    >
      {apps.map((app: MiniAppConfig) => (
        <GameCard
          key={app.id}
          id={app.id}
          name={app.name}
          imageUrl={app.image}
          isHot={app.hot}
          rating={app.score ? parseInt(app.score.match(/(\d+)/)?.[1] || '0', 10) : 0}
          tags={app.tag}
          score={app.score}
          onPlayPress={handleMiniAppPress}
        />
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>MonsterAI</Text>
          <Text style={styles.subtitle}>Your personal agent store</Text>
        </View>

        <View style={styles.grid}>
          {isMonstersLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : monstersData.length > 0 ? (
            monstersData.map((monster, index) => (
              <View
                key={monster.id}
                style={[
                  styles.cardWrapper,
                  index % 2 === 0 ? styles.cardLeft : styles.cardRight,
                ]}
              >
                <MonsterCard
                  name={monster.name}
                  category={monster.category}
                  description={monster.description}
                  imageUrl={monster.imageUrl}
                  backgroundColor={monster.backgroundColor}
                  onFingerprintPress={() => handleFingerprintPress(monster.agentName)}
                  onCardPress={() => handleFingerprintPress(monster.agentName)}
                  onHirePress={() => handleHirePress(monster.id)}
                  imageSize={monster.imageSize}
                  imageOffset={monster.imageOffset}
                  isHired={true}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No data available</Text>
            </View>
          )}
        </View>

        <View style={styles.gamesSection}>
          <Text style={styles.gamesSectionTitle}>Game Store</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load: {error}</Text>
            </View>
          ) : gamesData.length > 0 ? (
            renderGameRow(gamesData)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No games available</Text>
            </View>
          )}
        </View>

        <View style={styles.miniAppsSection}>
          <Text style={styles.gamesSectionTitle}>Mini APPs</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load: {error}</Text>
            </View>
          ) : miniAppsData.length > 0 ? (
            renderMiniAppRow(miniAppsData)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No apps available</Text>
            </View>
          )}
        </View>

        {/* <View style={styles.bannerSection}>
          <TouchableOpacity onPress={handleBannerPress} activeOpacity={0.8}>
            <Image
              source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/spark.png' }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View> */}
      </ScrollView>

      <Modal
        visible={showComingSoonModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>🌟 Coming Soon!</Text>
            <Text style={styles.modalMessage}>
              We're preparing the MiniApp Program.{'\n'}
              Can't wait to welcome you onboard soon.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={closeModal}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={isDownloading}
        transparent
        animationType="fade"
      >
        <View style={styles.downloadModalOverlay}>
          <View style={styles.downloadModalContent}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.downloadModalText}>Downloading app package, please wait...</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 20,
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Nunito_500Medium',
    color: '#666666',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  cardWrapper: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  cardLeft: {
    paddingRight: 8,
  },
  cardRight: {
    paddingLeft: 8,
  },
  gamesSection: {
    marginTop: 16,
    paddingBottom: 20,
  },
  miniAppsSection: {
    marginTop: 0,
    paddingBottom: 20,
  },
  gamesSectionTitle: {
    fontSize: 28,
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  gamesRow: {
    marginBottom: 16,
  },
  gamesRowContent: {
    paddingHorizontal: 20,
  },
  bannerSection: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  bannerImage: {
    width: 369,
    height: 108,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#666666',
  },
  errorContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#FF0000',
    textAlign: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    color: '#999999',
  },
  downloadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  downloadModalText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Nunito_400Regular',
    color: '#666666',
    textAlign: 'center',
  },
});

