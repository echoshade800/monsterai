import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useState } from 'react';

const MONSTERS_DETAIL = {
  energy: {
    name: 'Energy',
    category: 'Health',
    fullDescription: 'Energy Monster helps you stay strong and stress-free throughout the day. It monitors your energy levels, provides personalized recommendations, and helps you maintain optimal vitality.',
    abilities: [
      'Track daily energy patterns',
      'Personalized energy boost tips',
      'Stress level monitoring',
      'Activity recommendations',
    ],
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/energy.png',
    backgroundColor: '#F5E6D3',
  },
  face: {
    name: 'Face',
    category: 'Beauty',
    fullDescription: 'Face Monster uses data-driven insights to help your skin glow. Get personalized skincare routines and track your skin health over time.',
    abilities: [
      'Skin health analysis',
      'Personalized skincare routines',
      'Daily skin condition tracking',
      'Product recommendations',
    ],
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/face.png',
    backgroundColor: '#E8F5E9',
  },
  posture: {
    name: 'Posture',
    category: 'Body',
    fullDescription: 'Posture Monster fixes your posture so you feel great all day. Real-time posture monitoring and corrections help prevent pain and improve your well-being.',
    abilities: [
      'Real-time posture monitoring',
      'Posture correction alerts',
      'Ergonomic recommendations',
      'Daily posture reports',
    ],
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/posture.png',
    backgroundColor: '#FFE4E1',
  },
  sleep: {
    name: 'Sleep',
    category: 'Restful',
    fullDescription: 'Sleep Monster guides you to better sleep naturally. Track your sleep patterns, get personalized sleep tips, and wake up refreshed every day.',
    abilities: [
      'Sleep quality tracking',
      'Personalized sleep schedules',
      'Sleep environment optimization',
      'Dream journaling',
    ],
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/sleep.png',
    backgroundColor: '#E3F2FD',
  },
  stress: {
    name: 'Stress',
    category: 'Physical',
    fullDescription: 'Stress Monster helps you stay strong and stress-free. Learn to manage stress effectively with personalized techniques and daily mindfulness exercises.',
    abilities: [
      'Stress level monitoring',
      'Breathing exercises',
      'Meditation guidance',
      'Stress relief techniques',
    ],
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/stress.png',
    backgroundColor: '#FFE0B2',
  },
  feces: {
    name: 'Feces',
    category: 'Available',
    fullDescription: 'Feces Monster helps you game with your mind and body. Track digestive health and get insights into your gut wellness.',
    abilities: [
      'Digestive health tracking',
      'Dietary recommendations',
      'Health pattern analysis',
      'Wellness insights',
    ],
    imageUrl: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/feces.png',
    backgroundColor: '#F5E6D3',
  },
};

export default function MonsterDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const monsterId = params.id as string;
  const [isHired, setIsHired] = useState(false);

  const monster = MONSTERS_DETAIL[monsterId as keyof typeof MONSTERS_DETAIL];

  if (!monster) {
    return (
      <View style={styles.container}>
        <Text>Monster not found</Text>
      </View>
    );
  }

  const handleHire = () => {
    setIsHired(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: monster.backgroundColor }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          <ArrowLeft size={24} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: monster.imageUrl }}
            style={styles.monsterImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.contentCard}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />

          <View style={styles.headerSection}>
            <Text style={styles.name}>{monster.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{monster.category}</Text>
            </View>
          </View>

          <Text style={styles.description}>{monster.fullDescription}</Text>

          <View style={styles.abilitiesSection}>
            <Text style={styles.abilitiesTitle}>Abilities</Text>
            {monster.abilities.map((ability, index) => (
              <View key={index} style={styles.abilityItem}>
                <View style={styles.abilityDot} />
                <Text style={styles.abilityText}>{ability}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.hireButton, isHired && styles.hiredButton]}
            onPress={handleHire}
            disabled={isHired}
            activeOpacity={0.8}
          >
            {isHired ? (
              <>
                <Check size={24} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.hireButtonText}>Hired</Text>
              </>
            ) : (
              <Text style={styles.hireButtonText}>Hire This Monster</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 0) + 10,
    left: 20,
    zIndex: 100,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 100 : (StatusBar.currentHeight || 0) + 50,
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  monsterImage: {
    width: '320%',
    height: '400%',
  },
  contentCard: {
    marginHorizontal: 20,
    borderRadius: 32,
    padding: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 40,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
  },
  description: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    lineHeight: 24,
    marginBottom: 24,
  },
  abilitiesSection: {
    marginBottom: 32,
  },
  abilitiesTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    marginBottom: 16,
  },
  abilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  abilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000000',
    marginRight: 12,
  },
  abilityText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    flex: 1,
  },
  hireButton: {
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  hiredButton: {
    backgroundColor: '#4CAF50',
  },
  hireButtonText: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#FFFFFF',
  },
});
