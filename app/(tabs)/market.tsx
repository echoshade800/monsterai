import { View, Text, StyleSheet, ScrollView, Platform, StatusBar } from 'react-native';
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
    imageSize: '300%',
    imageOffset: 10,
  },
  {
    id: 'face',
    name: 'Face',
    category: 'Beauty',
    description: 'I make your skin glow with data.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/face.png',
    backgroundColor: '#E8F5E9',
    imageSize: '280%',
    imageOffset: 8,
  },
  {
    id: 'posture',
    name: 'Posture',
    category: 'Body',
    description: 'I fix your posture, so you feel great all day.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/posture.png',
    backgroundColor: '#FFE4E1',
    imageSize: '400%',
    imageOffset: 0,
  },
  {
    id: 'sleep',
    name: 'Sleep',
    category: 'Restful',
    description: 'I guide you to better sleep, naturally.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/sleep.png',
    backgroundColor: '#E3F2FD',
    imageSize: '200%',
    imageOffset: 0,
  },
  {
    id: 'stress',
    name: 'Stress',
    category: 'Physical',
    description: 'I help you stay strong and stress-free.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/stress.png',
    backgroundColor: '#FFE0B2',
    imageSize: '400%',
    imageOffset: 10,
  },
  {
    id: 'feces',
    name: 'Feces',
    category: 'Available',
    description: 'Game with your mind and body.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/feces.png',
    backgroundColor: '#F5E6D3',
    imageSize: '300%',
    imageOffset: 10,
  },
];

const GAMES_DATA = [
  {
    id: 'linker',
    name: 'Linker',
    imageUrl: 'https://images.pexels.com/photos/6168061/pexels-photo-6168061.jpeg?auto=compress&cs=tinysrgb&w=400',
    isHot: true,
    rating: 96,
  },
  {
    id: '2048',
    name: '2048',
    imageUrl: 'https://images.pexels.com/photos/4466494/pexels-photo-4466494.jpeg?auto=compress&cs=tinysrgb&w=400',
    isHot: false,
    rating: 94,
  },
  {
    id: 'photopuzzle',
    name: 'Photopuzzle',
    imageUrl: 'https://images.pexels.com/photos/1111371/pexels-photo-1111371.jpeg?auto=compress&cs=tinysrgb&w=400',
    isHot: false,
    rating: 88,
  },
  {
    id: 'flipmatch',
    name: 'FlipMatch',
    imageUrl: 'https://images.pexels.com/photos/4792285/pexels-photo-4792285.jpeg?auto=compress&cs=tinysrgb&w=400',
    isHot: true,
    rating: 92,
  },
  {
    id: 'kidercrush',
    name: 'Kidercrush',
    imageUrl: 'https://images.pexels.com/photos/3661193/pexels-photo-3661193.jpeg?auto=compress&cs=tinysrgb&w=400',
    isHot: true,
    rating: 90,
  },
  {
    id: 'qblock',
    name: 'QBlock',
    imageUrl: 'https://images.pexels.com/photos/4792286/pexels-photo-4792286.jpeg?auto=compress&cs=tinysrgb&w=400',
    isHot: false,
    rating: 87,
  },
  {
    id: 'sudoku',
    name: '数独',
    imageUrl: 'https://images.pexels.com/photos/220057/pexels-photo-220057.jpeg?auto=compress&cs=tinysrgb&w=400',
    isHot: false,
    rating: 93,
  },
  {
    id: 'wordle',
    name: 'Wordle',
    imageUrl: 'https://images.pexels.com/photos/5711855/pexels-photo-5711855.jpeg?auto=compress&cs=tinysrgb&w=400',
    isHot: true,
    rating: 95,
  },
];

export default function MarketTab() {
  const router = useRouter();

  const handleFingerprintPress = (monsterId: string) => {
    router.push({
      pathname: '/monster-detail',
      params: { id: monsterId },
    });
  };

  const handleHirePress = (monsterId: string) => {
    console.log('Hired monster:', monsterId);
  };

  const handlePlayPress = (gameId: string) => {
    console.log('Playing game:', gameId);
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
                onHirePress={() => handleHirePress(monster.id)}
                imageSize={monster.imageSize}
                imageOffset={monster.imageOffset}
              />
            </View>
          ))}
        </View>

        <View style={styles.gamesSection}>
          <Text style={styles.gamesSectionTitle}>Game Store</Text>
          {renderGameRow(GAMES_DATA.slice(0, 4))}
          {renderGameRow(GAMES_DATA.slice(4, 8))}
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
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    fontFamily: 'SF Compact Rounded',
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
    marginTop: 32,
    paddingBottom: 20,
  },
  gamesSectionTitle: {
    fontSize: 28,
    fontWeight: '700',
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
});
