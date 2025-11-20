import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, NativeModules, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { unzip } from 'react-native-zip-archive';
import { GameCard } from '../../components/GameCard';
import { MonsterCard } from '../../components/MonsterCard';
const { MiniAppLauncher } = NativeModules;

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

// API 数据类型定义
interface MiniAppConfig {
  id: string;
  version?: string;
  name: string;
  icon: string;
  color: string;
  miniAppType: string;
  host: string;
  module_name: string;
  category: string;
  tags?: string[];
  score?: string;
  image: string;
  releaseUrl: string;
}

// 游戏和 MiniApp 数据类型
interface GameData {
  id: string;
  name: string;
  imageUrl: string;
  isHot: boolean;
  rating: number;
  module_name?: string;
  miniAppType?: string;
  host?: string;
  releaseUrl?: string;
  version?: string;
  tags?: string[];
  score?: string;
}

export default function MarketTab() {
  const router = useRouter();
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [monstersData, setMonstersData] = useState<MonsterData[]>([]);
  const [gamesData, setGamesData] = useState<GameData[]>([]);
  const [miniAppsData, setMiniAppsData] = useState<GameData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMonstersLoading, setIsMonstersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从 API 获取 Monsters 数据
  useEffect(() => {
    const fetchMonstersData = async () => {
      try {
        setIsMonstersLoading(true);
        // 根据环境选择不同的配置文件
        const configFile = __DEV__ ? 'agent_list_config_debug.json' : 'agent_list_config_prod.json';
        // 添加时间戳参数防止缓存
        const timestamp = Date.now();
        const response = await fetch(`https://dzdbhsix5ppsc.cloudfront.net/monster/${configFile}?t=${timestamp}`);
        
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
        const configFile = __DEV__ ? 'miniapp_list_config_debug.json' : 'miniapp_list_config_prod.json';
        // 添加时间戳参数防止缓存
        const timestamp = Date.now();
        const response = await fetch(`https://dzdbhsix5ppsc.cloudfront.net/monster/${configFile}?t=${timestamp}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: MiniAppConfig[] = await response.json();
        
        // 将 API 数据映射到现有格式，并同时分类
        const games: GameData[] = [];
        const miniApps: GameData[] = [];
        
        data.forEach((item) => {
          // 从 score 字段中提取数字作为 rating（如果 score 存在）
          let rating = 90; // 默认值
          if (item.score) {
            const match = item.score.match(/(\d+)/);
            if (match) {
              rating = parseInt(match[1], 10);
            }
          }
          
          const mappedItem: GameData = {
            id: item.id,
            name: item.name,
            imageUrl: item.image || '',
            isHot: false, // API 数据中没有此字段，默认为 false
            rating: rating,
            module_name: item.module_name,
            miniAppType: item.miniAppType,
            host: item.host,
            releaseUrl: item.releaseUrl,
            version: item.version,
            tags: item.tags,
            score: item.score,
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
        setError(err instanceof Error ? err.message : '未知错误');
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
  interface AppConfig {
    module_name: string;
    name: string;
    miniAppType?: string;
  }

  // 将版本号从 "1.0.0" 格式转换为 "1_0_0" 格式（用于文件名）
  const formatVersionForFileName = (version: string): string => {
    return version.replace(/\./g, '_');
  };

  // 公共的 MiniApp 启动逻辑
  const launchMiniApp = async (appData: GameData) => {
    try {
      // 使用从 API 获取的配置
      const cfg: AppConfig = {
        module_name: appData.module_name || '',
        name: appData.name || '',
        miniAppType: appData.miniAppType,
      };

      if (cfg.miniAppType === 'H5') {
        // 开发环境使用 host，生产环境使用 releaseUrl
        const h5Url = __DEV__ ? appData.host : appData.releaseUrl;
        if (!h5Url) {
          Alert.alert('错误', __DEV__ ? '未找到 H5 应用的 host 地址' : '未找到 H5 应用的 releaseUrl 地址');
          return;
        }
        console.log('打开 H5 应用:', h5Url);
        const params = {
          title: cfg.name,
          miniAppType: cfg.miniAppType,
        };
        MiniAppLauncher.open(h5Url, cfg.module_name, '', params);
        return;
      } else {
        const documentsDir = FileSystem.documentDirectory;
        const moduleName = cfg.module_name;
        const version = appData.version || '1.0.0';
        const versionForFileName = formatVersionForFileName(version);
        const targetDir = `${documentsDir}MiniApp/${moduleName}/${versionForFileName}/`;
        // 检查本地文件夹是否存在
        const dirInfo = await FileSystem.getInfoAsync(targetDir);
        
        if (!dirInfo.exists && appData.releaseUrl) {
          // 需要下载和解压
          try {
            Alert.alert('提示', '正在下载应用包，请稍候...');
            
            // 下载压缩包
            const zipFileName = `${moduleName}_${versionForFileName}.zip`;
            const zipFilePath = `${documentsDir}${zipFileName}`;
            
            console.log('开始下载:', appData.releaseUrl);
            const downloadResult = await FileSystem.downloadAsync(appData.releaseUrl, zipFilePath);
            
            if (downloadResult.status !== 200) {
              throw new Error(`下载失败，状态码: ${downloadResult.status}`);
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
          } catch (downloadError) {
            console.error('下载或解压失败:', downloadError);
            Alert.alert(
              '❌ 下载失败',
              `无法下载或解压应用包：\n${downloadError instanceof Error ? downloadError.message : String(downloadError)}`,
              [{ text: '确定' }]
            );
            return;
          }
        } else if (!dirInfo.exists && !appData.releaseUrl) {
          Alert.alert(
            '⚠️ 目录不存在',
            `本地 bundle 目录不存在：\n${targetDir}\n\n且未提供下载地址。`,
            [{ text: '确定' }]
          );
          return;
        }
        
        // 检查解压后的目录是否存在
        // 解压后的文件结构为: ios/rnbundle/main.jsbundle
        const targetDirInfo = await FileSystem.getInfoAsync(targetDir);
        console.log('targetDirInfo', targetDirInfo);
        if (!targetDirInfo.exists) {
          Alert.alert(
            '⚠️ 目录不存在',
            `本地 bundle 目录不存在：\n${targetDir}`,
            [{ text: '确定' }]
          );
          return;
        }

        // 构建完整路径: {targetDir}ios/rnbundle/main.jsbundle
        const bundlePath = `${targetDir}ios/rnbundle/main.jsbundle`;
        
        console.log('加载本地 bundle:', bundlePath);
        console.log('模块名:', cfg.module_name);
        console.log('应用名:', cfg.name);
        console.log('类型:', cfg.miniAppType || 'RN');

        // 调用 MiniAppLauncher 打开本地 bundle
        const params = {
          title: cfg.name,
          miniAppType: cfg.miniAppType || 'RN',
          localBundle: true,
        };
        MiniAppLauncher.open(
          bundlePath,
          cfg.module_name,
          versionForFileName,
          params,
        );
      }
    } catch (error) {
      console.error('打开MiniApp失败:', error);
      Alert.alert(
        '❌ 打开MiniApp失败',
        `无法打开MiniApp\n${error instanceof Error ? error.message : String(error)}`,
        [{ text: '确定' }]
      );
    }
  };

  const handlePlayPress = async (gameId: string) => {
    const game = gamesData.find(g => g.id === gameId);
    console.log('Playing game:', gameId, 'URL:', game?.imageUrl);
    
    if (!game) {
      Alert.alert('错误', '未找到游戏信息');
      return;
    }

    await launchMiniApp(game);
  };

  const handleMiniAppPress = async (appId: string) => {
    const app = miniAppsData.find(a => a.id === appId);
    console.log('Opening mini app:', appId, 'URL:', app?.imageUrl);
    
    if (!app) {
      Alert.alert('错误', '未找到应用信息');
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

  const renderGameRow = (games: GameData[]) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.gamesRow}
      contentContainerStyle={styles.gamesRowContent}
    >
      {games.map((game: GameData) => (
        <GameCard
          key={game.id}
          id={game.id}
          name={game.name}
          imageUrl={game.imageUrl}
          isHot={game.isHot}
          rating={game.rating}
          tags={game.tags}
          score={game.score}
          onPlayPress={handlePlayPress}
        />
      ))}
    </ScrollView>
  );

  const renderMiniAppRow = (apps: GameData[]) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.gamesRow}
      contentContainerStyle={styles.gamesRowContent}
    >
      {apps.map((app: GameData) => (
        <GameCard
          key={app.id}
          id={app.id}
          name={app.name}
          imageUrl={app.imageUrl}
          isHot={app.isHot}
          rating={app.rating}
          tags={app.tags}
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
              <Text style={styles.loadingText}>加载中...</Text>
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
              <Text style={styles.emptyText}>暂无数据</Text>
            </View>
          )}
        </View>

        <View style={styles.gamesSection}>
          <Text style={styles.gamesSectionTitle}>Game Store</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>加载失败: {error}</Text>
            </View>
          ) : gamesData.length > 0 ? (
            renderGameRow(gamesData)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无游戏</Text>
            </View>
          )}
        </View>

        <View style={styles.miniAppsSection}>
          <Text style={styles.gamesSectionTitle}>Mini APPs</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#000000" />
              <Text style={styles.loadingText}>加载中...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>加载失败: {error}</Text>
            </View>
          ) : miniAppsData.length > 0 ? (
            renderMiniAppRow(miniAppsData)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无应用</Text>
            </View>
          )}
        </View>

        <View style={styles.bannerSection}>
          <TouchableOpacity onPress={handleBannerPress} activeOpacity={0.8}>
            <Image
              source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/spark.png' }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
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
});

