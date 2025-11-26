import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

  const handleSeeOtherStrategies = () => {
    router.back(); // Go back to strategy list
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Navigation Bar with theme color */}
      <View style={[styles.navBar, { backgroundColor: strategy.themeColor, paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Back</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <Image
          source={{ uri: strategy.heroImageUrl }}
          style={styles.heroImage}
          resizeMode="cover"
        />

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

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {/* Primary Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleUseStrategy}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Use this strategy</Text>
            </TouchableOpacity>

            {/* Secondary Button */}
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSeeOtherStrategies}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryButtonText}>See other strategies</Text>
            </TouchableOpacity>
          </View>
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Nunito',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F5F7FA',
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
    marginBottom: 32,
    fontFamily: 'Nunito',
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
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
  secondaryButton: {
    backgroundColor: '#F5F7FA',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
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

