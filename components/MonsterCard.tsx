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
}: MonsterCardProps) {
  const [hired, setHired] = useState(isHired);

  const handleHirePress = () => {
    setHired(true);
    onHirePress?.();
  };

  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
      </View>

      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.monsterImage, { width: imageSize, height: imageSize, marginTop: imageOffset }]}
          resizeMode="contain"
        />
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{description}</Text>
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
          onPress={onFingerprintPress}
          activeOpacity={0.8}
        >
          <View style={styles.fingerprintInner}>
            <Fingerprint size={24} color="#000000" strokeWidth={2} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    paddingBottom: 12,
    height: 200,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
  },
  descriptionContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    maxWidth: '95%',
  },
  description: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'SF Compact Rounded',
    color: '#000000',
    lineHeight: 14,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  monsterImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
    marginLeft: -8,
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
    fontWeight: '600',
    fontFamily: 'SF Compact Rounded',
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
  },
  fingerprintInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
