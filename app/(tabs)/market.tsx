import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, NativeModules, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GameCard } from '../../components/GameCard';
import { MonsterCard } from '../../components/MonsterCard';
const { MiniAppLauncher } = NativeModules;

const MONSTERS_DATA = [
  {
    id: 'energy',
    name: 'Energy',
    category: 'Health',
    description: 'Stay strong and stress-free.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/energy.png',
    backgroundColor: '#F5E6D3',
    imageSize: '225%',
    imageOffset: 52,
  },
  {
    id: 'face',
    name: 'Face',
    category: 'Beauty',
    description: 'I make your skin glow with data.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/face.png',
    backgroundColor: '#E8F5E9',
    imageSize: '215%',
    imageOffset: 50,
  },
  {
    id: 'posture',
    name: 'Posture',
    category: 'Body',
    description: 'I fix your posture, so you feel great all day.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/posture.png',
    backgroundColor: '#FFE4E1',
    imageSize: '275%',
    imageOffset: 112,
  },
  {
    id: 'sleep',
    name: 'Sleep',
    category: 'Restful',
    description: 'I guide you to better sleep, naturally.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/sleep.png',
    backgroundColor: '#E3F2FD',
    imageSize: '175%',
    imageOffset: 42,
  },
  {
    id: 'stress',
    name: 'Stress',
    category: 'Physical',
    description: "I'm your cozy friend for calm days and happy minds.",
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/stress.png',
    backgroundColor: '#FFE0B2',
    imageSize: '275%',
    imageOffset: 52,
  },
  {
    id: 'feces',
    name: 'Poop',
    category: 'Available',
    description: "I'm your cute buddy for happy, healthy poops!",
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/feces.png',
    backgroundColor: '#F5E6D3',
    imageSize: '225%',
    imageOffset: 52,
  },
];

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
  const [gamesData, setGamesData] = useState<GameData[]>([]);
  const [miniAppsData, setMiniAppsData] = useState<GameData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 从 API 获取数据
  useEffect(() => {
    const fetchMiniAppData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // 添加时间戳参数防止缓存
        const timestamp = Date.now();
        const response = await fetch(`https://dzdbhsix5ppsc.cloudfront.net/monster/miniapp_list_config_debug.json?t=${timestamp}`);
        
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

  const handleFingerprintPress = (monsterId: string) => {
    router.push({
      pathname: '/agent-detail',
      params: { id: monsterId },
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
  const defaultConfig: AppConfig = {
    module_name: 'WordleMiniApp', // 修改为你的模块名
    name: 'Wordle MiniApp', // 修改为你的应用名
    miniAppType: 'RN', // 或 'H5'
  };

  const handlePlayPress = async (gameId: string) => {
    const game = gamesData.find(g => g.id === gameId);
    console.log('Playing game:', gameId, 'URL:', game?.imageUrl);
    
    if (!game) {
      Alert.alert('错误', '未找到游戏信息');
      return;
    }

    try {
      // 使用从 API 获取的配置
      const cfg: AppConfig = {
        module_name: game.module_name || defaultConfig.module_name,
        name: game.name,
        miniAppType: game.miniAppType || defaultConfig.miniAppType,
      };
      
      // 如果是 H5 类型，直接打开 URL
      if (cfg.miniAppType === 'H5' && game.host) {
        console.log('打开 H5 应用:', game.host);
        // 这里可以添加打开 H5 应用的逻辑
        Alert.alert('提示', `H5 应用: ${game.host}`);
        return;
      }
      
      // RN 类型，加载本地 bundle
      const documentsDir = FileSystem.documentDirectory;
      const localAppDir = `${documentsDir}${cfg.module_name}/`;
      
      // 检查本地文件夹是否存在
      const dirInfo = await FileSystem.getInfoAsync(localAppDir);
      
      if (!dirInfo.exists) {
        Alert.alert(
          '⚠️ 目录不存在',
          `本地 bundle 目录不存在：\n${localAppDir}\n\n请确保已经下载并解压了应用包。`,
          [{ text: '确定' }]
        );
        return;
      }

      console.log('加载本地 bundle:', localAppDir);
      console.log('模块名:', cfg.module_name);
      console.log('应用名:', cfg.name);
      console.log('类型:', cfg.miniAppType || 'RN');

      // 调用 MiniAppLauncher 打开本地 bundle
      MiniAppLauncher.open(
        localAppDir,
        cfg.module_name,
        {
          title: cfg.name,
          miniAppType: cfg.miniAppType || 'RN',
          localBundle: true
        }
      );

    } catch (error) {
      console.error('加载本地 bundle 失败:', error);
      Alert.alert(
        '❌ 加载失败',
        `无法加载本地 bundle：\n${error instanceof Error ? error.message : String(error)}`,
        [{ text: '确定' }]
      );
    }
  };

  const handleMiniAppPress = async (appId: string) => {
    const app = miniAppsData.find(a => a.id === appId);
    console.log('Opening mini app:', appId, 'URL:', app?.imageUrl);
    
    if (!app) {
      Alert.alert('错误', '未找到应用信息');
      return;
    }

    try {
      // 使用从 API 获取的配置
      const cfg: AppConfig = {
        module_name: app.module_name || defaultConfig.module_name,
        name: app.name,
        miniAppType: app.miniAppType || defaultConfig.miniAppType,
      };
      
      // 如果是 H5 类型，直接打开 URL
      if (cfg.miniAppType === 'H5' && app.host) {
        console.log('打开 H5 应用:', app.host);
        // 这里可以添加打开 H5 应用的逻辑
        Alert.alert('提示', `H5 应用: ${app.host}`);
        return;
      }
      
      // RN 类型，加载本地 bundle
      const documentsDir = FileSystem.documentDirectory;
      const localAppDir = `${documentsDir}${cfg.module_name}/`;
      
      // 检查本地文件夹是否存在
      const dirInfo = await FileSystem.getInfoAsync(localAppDir);
      
      if (!dirInfo.exists) {
        Alert.alert(
          '⚠️ 目录不存在',
          `本地 bundle 目录不存在：\n${localAppDir}\n\n请确保已经下载并解压了应用包。`,
          [{ text: '确定' }]
        );
        return;
      }

      console.log('加载本地 bundle:', localAppDir);
      console.log('模块名:', cfg.module_name);
      console.log('应用名:', cfg.name);
      console.log('类型:', cfg.miniAppType || 'RN');

      // 调用 MiniAppLauncher 打开本地 bundle
      MiniAppLauncher.open(
        localAppDir,
        cfg.module_name,
        {
          title: cfg.name,
          miniAppType: cfg.miniAppType || 'RN',
          localBundle: true
        }
      );

    } catch (error) {
      console.error('加载本地 bundle 失败:', error);
      Alert.alert(
        '❌ 加载失败',
        `无法加载本地 bundle：\n${error instanceof Error ? error.message : String(error)}`,
        [{ text: '确定' }]
      );
    }
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
          {MONSTERS_DATA.map((monster, index) => (
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
                onFingerprintPress={() => handleFingerprintPress(monster.id)}
                onCardPress={() => handleFingerprintPress(monster.id)}
                onHirePress={() => handleHirePress(monster.id)}
                imageSize={monster.imageSize}
                imageOffset={monster.imageOffset}
                isHired={true}
              />
            </View>
          ))}
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
