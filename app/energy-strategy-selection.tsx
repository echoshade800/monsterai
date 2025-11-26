import { useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Strategy {
  id: string;
  name: string;
  description: string;
}

const STRATEGIES: Strategy[] = [
  {
    id: '1',
    name: 'Intermittent Fasting (16/8)',
    description: 'Fast for 16 hours, eat within 8-hour window',
  },
  {
    id: '2',
    name: 'Calorie Cycling',
    description: 'Alternate between high and low calorie days',
  },
  {
    id: '3',
    name: 'Low-Carb Week',
    description: 'Reduce carb intake for faster fat burn',
  },
  {
    id: '4',
    name: 'Gentle Deficit',
    description: 'Slow and steady calorie reduction',
  },
];

export default function EnergyStrategySelectionScreen() {
  const router = useRouter();
  const [selectedStrategy, setSelectedStrategy] = useState('1');

  const handleStrategySelect = (id: string) => {
    setSelectedStrategy(id);
    // Navigate back after a short delay
    setTimeout(() => {
      router.back();
    }, 300);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Choose your strategy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {STRATEGIES.map((strategy) => (
          <TouchableOpacity
            key={strategy.id}
            style={[
              styles.strategyCard,
              selectedStrategy === strategy.id && styles.strategyCardSelected,
            ]}
            onPress={() => handleStrategySelect(strategy.id)}
            activeOpacity={0.7}
          >
            <View style={styles.strategyContent}>
              <Text style={styles.strategyName}>{strategy.name}</Text>
              <Text style={styles.strategyDescription}>{strategy.description}</Text>
            </View>
            {selectedStrategy === strategy.id && (
              <View style={styles.checkIcon}>
                <Check size={20} color="#4CCB5E" strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F9',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#F5F7F9',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  strategyCardSelected: {
    borderWidth: 2,
    borderColor: '#4CCB5E',
    shadowOpacity: 0.15,
  },
  strategyContent: {
    flex: 1,
    marginRight: 12,
  },
  strategyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'Nunito',
  },
  strategyDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    fontFamily: 'Nunito',
  },
  checkIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8F7EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

