import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Play } from 'lucide-react-native';
import { useState } from 'react';

interface GameCardProps {
  id: string;
  name: string;
  imageUrl: string;
  isHot?: boolean;
  rating: number;
  onPlayPress: (gameId: string) => void;
}

export function GameCard({ id, name, imageUrl, isHot = false, rating, onPlayPress }: GameCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {isHot && (
          <View style={styles.hotBadge}>
            <Text style={styles.hotText}>🔥 Hot</Text>
          </View>
        )}
        {imageLoading && !imageError && (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>Loading...</Text>
          </View>
        )}
        {imageError && (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>🎮</Text>
          </View>
        )}
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
          onLoad={() => setImageLoading(false)}
          onError={() => {
            setImageError(true);
            setImageLoading(false);
          }}
        />
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.gameName}>{name}</Text>

        <View style={styles.tagsContainer}>
          <View style={styles.creatorsBadge}>
            <Text style={styles.creatorsText}>😍 Creators love</Text>
          </View>

          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>😃 {rating}%</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.playButton}
          onPress={() => onPlayPress(id)}
          activeOpacity={0.8}
        >
          <Text style={styles.playButtonText}>Play</Text>
          <Play color="#FFFFFF" size={16} fill="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    marginRight: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  hotBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  hotText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  contentContainer: {
    padding: 12,
    position: 'relative',
    minHeight: 140,
  },
  gameName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  creatorsBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  creatorsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  ratingBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  ratingText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '600',
  },
  playButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000000',
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  imagePlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  placeholderText: {
    fontSize: 32,
    color: '#CCCCCC',
  },
});
