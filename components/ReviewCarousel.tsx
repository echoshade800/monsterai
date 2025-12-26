import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_MARGIN = 12;

export interface ReviewCardData {
  id: string;
  title: string;
  subtitle: string;
  coverImage: any; // Using local require or URI
  ctaRoute: string;
  status: 'ready' | 'generating' | 'locked';
}

interface ReviewCarouselProps {
  data: ReviewCardData[];
}

export function ReviewCarousel({ data }: ReviewCarouselProps) {
  const router = useRouter();

  if (!data || data.length === 0) return null;

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_MARGIN}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {data.map((item) => (
          <View key={item.id} style={styles.cardShadowOuter}>
            <View style={styles.cardShadowInner}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => router.push(item.ctaRoute as any)}
                style={styles.cardWrapper}
              >
                <BlurView intensity={30} tint="light" style={styles.glassCard}>
                  <View style={styles.cardContent}>
                    {/* Left Thumbnail */}
                    <Image source={item.coverImage} style={styles.thumbnail} />

                    {/* Center Text */}
                    <View style={styles.textContainer}>
                      <Text style={styles.title} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.subtitle} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    </View>

                    {/* Right Arrow */}
                    <View style={styles.arrowContainer}>
                      <ChevronRight size={20} color="#000000" strokeWidth={2.5} />
                    </View>
                  </View>
                  
                  {/* Highlight Overlay - Simulated refraction */}
                  <View style={styles.highlightBorder} />
                </BlurView>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    width: '100%',
    height: 96, // Increased to account for larger shadow falloff
    marginTop: 20,
    marginBottom: -4,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8, // Padding for top shadow
    paddingBottom: 16, // Padding for bottom shadow
    paddingRight: SCREEN_WIDTH * 0.15,
  },
  cardShadowOuter: {
    width: CARD_WIDTH,
    marginRight: CARD_MARGIN,
    height: 72,
    borderRadius: 12,
    backgroundColor: 'transparent',
    shadowColor: '#4A3728', // Warm brown-ish diffused shadow
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  cardShadowInner: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'transparent',
    shadowColor: '#2D1E14', // Closer, slightly stronger warm shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
  },
  cardWrapper: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  glassCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnail: {
    width: 66,
    height: 54,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    color: '#000000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
    color: 'rgba(0, 0, 0, 0.5)',
  },
  arrowContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    pointerEvents: 'none',
  },
});

