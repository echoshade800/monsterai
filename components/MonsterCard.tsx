import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { Fingerprint, Check } from 'lucide-react-native';
import { useState } from 'react';

interface MonsterCardProps {
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  backgroundColor: string;
  onFingerprintPress: () => void;
  isHired?: boolean;
  onHirePress?: () => void;
  imageSize?: string;
  imageOffset?: number;
  onCardPress?: () => void;
}

export function MonsterCard({
  name,
  category,
  description,
  imageUrl,
  backgroundColor,
  onFingerprintPress,
  isHired = false,
  onHirePress,
  imageSize = '400%',
  imageOffset = 0,
  onCardPress,
}: MonsterCardProps) {
  const [hired, setHired] = useState(isHired);

  const handleHirePress = (e: any) => {
    e.stopPropagation();
    setHired(true);
    onHirePress?.();
  };

  const handleFingerprintPress = (e: any) => {
    e.stopPropagation();
    onFingerprintPress();
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor }]}
      onPress={onCardPress || onFingerprintPress}
      activeOpacity={0.95}
    >
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.topPickBadge}>
          <Text style={styles.topPickText}>Top Pick</Text>
        </View>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.monsterImage, { width: imageSize, height: imageSize, marginTop: imageOffset }]}
          resizeMode="contain"
        />
        <View style={styles.descriptionOverlay}>
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.hireButton}
          onPress={handleHirePress}
          disabled={hired}
          activeOpacity={0.8}
        >
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          {hired ? (
            <Check size={18} color="#4CAF50" strokeWidth={2.5} />
          ) : (
            <Check size={18} color="#666666" strokeWidth={2.5} />
          )}
          <Text style={[styles.hireText, hired && styles.hiredText]}>
            {hired ? 'Hired' : 'Hire'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.fingerprintButton}
          onPress={handleFingerprintPress}
          activeOpacity={0.8}
        >
          <View style={styles.fingerprintInner}>
            <Fingerprint size={24} color="#000000" strokeWidth={2} />
          </View>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    height: 200,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  topPickBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginLeft: -3,
  },
  topPickText: {
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
    position: 'relative',
  },
  descriptionOverlay: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  descriptionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  description: {
    fontSize: 12,
    fontFamily: 'Nunito_500Medium',
    color: '#000000',
    lineHeight: 14,
  },
  monsterImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  hireButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    gap: 6,
  },
  hireText: {
    fontSize: 14,
    fontFamily: 'Nunito_600SemiBold',
    color: '#000000',
  },
  hiredText: {
    color: '#4CAF50',
  },
  fingerprintButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginRight: -10,
  },
  fingerprintInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
