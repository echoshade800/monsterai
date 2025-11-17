import { View, Text, StyleSheet, ScrollView, Platform, StatusBar, Image } from 'react-native';
import { MonsterCard } from '../../components/MonsterCard';
import { GameCard } from '../../components/GameCard';
import { useRouter } from 'expo-router';

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

const GAMES_DATA = [
  {
    id: '2048',
    name: '2048',
    imageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/2048.jpeg',
    isHot: false,
    rating: 94,
  },
  {
    id: 'flipmatch',
    name: 'FlipMatch',
    imageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/FlipMatch.jpeg',
    isHot: true,
    rating: 92,
  },
  {
    id: 'kidercrush',
    name: 'Kidercrush',
    imageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/kidercrush.jpeg',
    isHot: true,
    rating: 90,
  },
  {
    id: 'linker',
    name: 'Linker',
    imageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/linker.png',
    isHot: false,
    rating: 96,
  },
  {
    id: 'qblock',
    name: 'QBlock',
    imageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/qblock.jpeg',
    isHot: true,
    rating: 87,
  },
  {
    id: 'wordle',
    name: 'Wordle',
    imageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/wordle.jpeg',
    isHot: true,
    rating: 95,
  },
  {
    id: 'memory',
    name: 'Memory',
    imageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/memory.jpeg',
    isHot: false,
    rating: 89,
  },
  {
    id: 'sudoku',
    name: '数独',
    imageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/sudoku.jpeg',
    isHot: false,
    rating: 93,
  },
];

const MINIAPPS_DATA = [
  {
    id: 'leaflens',
    name: 'leaflens',
    imageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/miniapp1.jpeg',
    isHot: false,
    rating: 92,
  },
  {
    id: 'accounting',
    name: 'Accounting',
    imageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/miniapp2.jpeg',
    isHot: true,
    rating: 95,
  },
  {
    id: 'countdownday',
    name: 'countdown day',
    imageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/miniapp3.jpeg',
    isHot: false,
    rating: 88,
  },
  {
    id: 'todo',
    name: 'todo',
    imageUrl: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/miniapp4.png',
    isHot: true,
    rating: 91,
  },
];

export default function MarketTab() {
  const router = useRouter();

  const handleFingerprintPress = (monsterId: string) => {
    router.push({
      pathname: '/agent-detail',
      params: { id: monsterId },
    });
  };

  const handleHirePress = (monsterId: string) => {
    console.log('Hired monster:', monsterId);
  };

  const handlePlayPress = (gameId: string) => {
    const game = GAMES_DATA.find(g => g.id === gameId);
    console.log('Playing game:', gameId, 'URL:', game?.imageUrl);
  };

  const handleMiniAppPress = (appId: string) => {
    const app = MINIAPPS_DATA.find(a => a.id === appId);
    console.log('Opening mini app:', appId, 'URL:', app?.imageUrl);
  };

  const renderGameRow = (games: typeof GAMES_DATA) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.gamesRow}
      contentContainerStyle={styles.gamesRowContent}
    >
      {games.map((game) => (
        <GameCard
          key={game.id}
          id={game.id}
          name={game.name}
          imageUrl={game.imageUrl}
          isHot={game.isHot}
          rating={game.rating}
          onPlayPress={handlePlayPress}
        />
      ))}
    </ScrollView>
  );

  const renderMiniAppRow = (apps: typeof MINIAPPS_DATA) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.gamesRow}
      contentContainerStyle={styles.gamesRowContent}
    >
      {apps.map((app) => (
        <GameCard
          key={app.id}
          id={app.id}
          name={app.name}
          imageUrl={app.imageUrl}
          isHot={app.isHot}
          rating={app.rating}
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
          <Text style={styles.title}>Monster AI</Text>
          <Text style={styles.subtitle}>your personal agent store</Text>
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
          {renderGameRow(GAMES_DATA)}
        </View>

        <View style={styles.miniAppsSection}>
          <Text style={styles.gamesSectionTitle}>Mini APPs</Text>
          {renderMiniAppRow(MINIAPPS_DATA)}
        </View>

        <View style={styles.bannerSection}>
          <Image
            source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/spark.png' }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        </View>
      </ScrollView>
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
    borderRadius: 16,
    overflow: 'hidden',
  },
});
