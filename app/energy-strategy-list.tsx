import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { STRATEGIES } from '../constants/strategies';

export default function StrategyListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const currentStrategyId = params.currentStrategyId as string | undefined;

  const handleStrategyPress = (strategyId: string) => {
    router.push({
      pathname: '/energy-strategy-detail',
      params: { strategyId, currentStrategyId: currentStrategyId || '' },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Navigation Bar */}
      <View style={[styles.navBar, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#000000" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Weight Management Strategy</Text>
      </View>

      {/* Strategy List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {STRATEGIES.map((strategy) => {
          const isSelected = strategy.id === currentStrategyId;
          
          return (
            <TouchableOpacity
              key={strategy.id}
              style={[styles.strategyCard, isSelected && styles.strategyCardSelected]}
              onPress={() => handleStrategyPress(strategy.id)}
              activeOpacity={0.7}
            >
              {/* Icon */}
              <View style={styles.iconContainer}>
                <Text style={styles.icon}>{strategy.icon}</Text>
              </View>

              {/* Text Content */}
              <View style={styles.textContent}>
                <Text style={styles.strategyName}>{strategy.name}</Text>
                <Text style={styles.strategySubtitle}>{strategy.shortSubtitle}</Text>
              </View>

              {/* Selected Indicator */}
              {isSelected && (
                <View style={styles.checkmarkContainer}>
                  <Check size={20} color="#4CCB5E" strokeWidth={2.5} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EBEDF5',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#EBEDF5',
    borderBottomWidth: 0,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  navTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Nunito',
    textAlign: 'left',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingBottom: 40,
  },
  strategyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  strategyCardSelected: {
    borderColor: '#4CCB5E',
    backgroundColor: '#F0FFF4',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  textContent: {
    flex: 1,
    marginRight: 8,
  },
  strategyName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    fontFamily: 'Nunito',
  },
  strategySubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
    fontFamily: 'Nunito',
  },
  checkmarkContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

