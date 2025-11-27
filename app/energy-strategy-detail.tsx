import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getStrategyById } from '../constants/strategies';

export default function StrategyDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const strategyId = params.strategyId as string;
  const currentStrategyId = params.currentStrategyId as string | undefined;

  const strategy = getStrategyById(strategyId);

  if (!strategy) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Strategy not found</Text>
      </View>
    );
  }

  const handleUseStrategy = () => {
    // Navigate back to Energy Detail with the new strategy ID
    router.push({
      pathname: '/energy-detail',
      params: { selectedStrategyId: strategy.id },
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
        <Text style={styles.navTitle}>Back</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconWrapper}>
            <Text style={styles.heroIcon}>{strategy.icon}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{strategy.name}</Text>
          <Text style={styles.subtitle}>{strategy.shortSubtitle}</Text>

          {/* Description */}
          <Text style={styles.description}>{strategy.longDescription}</Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View style={[styles.fixedButtonContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleUseStrategy}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Use this strategy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'Nunito',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for fixed button
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroIcon: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Nunito',
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Nunito',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
    textAlign: 'left',
    marginBottom: 80, // Extra margin for fixed button
    fontFamily: 'Nunito',
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9EDF0',
  },
  primaryButton: {
    backgroundColor: '#000000',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Nunito',
  },
  errorText: {
    fontSize: 17,
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
    fontFamily: 'Nunito',
  },
});

