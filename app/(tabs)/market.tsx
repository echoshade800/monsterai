import { View, Text, StyleSheet, ScrollView, Platform, StatusBar } from 'react-native';
import { MonsterCard } from '../../components/MonsterCard';
import { useRouter } from 'expo-router';

const MONSTERS_DATA = [
  {
    id: 'energy',
    name: 'Energy',
    category: 'Health',
    description: 'Stay strong and stress-free.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/energy.png',
    backgroundColor: '#F5E6D3',
    imageScale: 2.5,
  },
  {
    id: 'face',
    name: 'Face',
    category: 'Beauty',
    description: 'I make your skin glow with data.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/face.png',
    backgroundColor: '#E8F5E9',
    imageScale: 2.5,
  },
  {
    id: 'posture',
    name: 'Posture',
    category: 'Body',
    description: 'I fix your posture, so you feel great all day.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/posture.png',
    backgroundColor: '#FFE4E1',
    imageScale: 4,
  },
  {
    id: 'sleep',
    name: 'Sleep',
    category: 'Restful',
    description: 'I guide you to better sleep, naturally.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/sleep.png',
    backgroundColor: '#E3F2FD',
    imageScale: 2,
  },
  {
    id: 'stress',
    name: 'Stress',
    category: 'Physical',
    description: 'I help you stay strong and stress-free.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/stress.png',
    backgroundColor: '#FFE0B2',
    imageScale: 4,
  },
  {
    id: 'feces',
    name: 'Feces',
    category: 'Available',
    description: 'Game with your mind and body.',
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/feces.png',
    backgroundColor: '#F5E6D3',
    imageScale: 2.5,
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
                imageScale={monster.imageScale}
              />
            </View>
          ))}
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
});
