import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React, { useRef, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  Zap,
  Wallet,
  Layout,
  ChefHat,
  Moon,
  Dumbbell,
  Coffee,
  Wind,
  Music,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TAB_ICONS: Record<string, any> = {
  home: Home,
  'daily-brief': Zap,
  fiscal: Wallet,
  architect: Layout,
  nutri: ChefHat,
  somno: Moon,
  coach: Dumbbell,
  brew: Coffee,
  zen: Wind,
  muse: Music,
};

const TAB_LABELS: Record<string, string> = {
  home: 'Home',
  'daily-brief': 'Daily Brief',
  fiscal: 'Fiscal',
  architect: 'Architect',
  nutri: 'Nutri',
  somno: 'Somno',
  coach: 'Coach',
  brew: 'Brew',
  zen: 'Zen',
  muse: 'Muse',
};

export function ScrollableGlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to active tab
  useEffect(() => {
    const activeIndex = state.index;
    // Simple heuristic for scrolling
    if (activeIndex > 2) {
      scrollViewRef.current?.scrollTo({ x: (activeIndex - 2) * 80, animated: true });
    } else {
      scrollViewRef.current?.scrollTo({ x: 0, animated: true });
    }
  }, [state.index]);

  return (
    <View style={[styles.container, { bottom: insets.bottom - 2 }]}>
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        <View style={styles.innerShadowHighlight} />
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = TAB_LABELS[route.name] || route.name;
            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const Icon = TAB_ICONS[route.name] || Home;

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={[
                  styles.tabItem,
                  isFocused && styles.tabItemFocused
                ]}
                activeOpacity={0.7}
              >
                <Icon
                  size={22}
                  color={isFocused ? '#F38319' : '#8E8E93'}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? '#F38319' : '#8E8E93' },
                    isFocused && styles.tabLabelFocused
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rightFade}
          pointerEvents="none"
        />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: -40, // Extend further to completely hide the right rounded corner
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.9)' : 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  blurContainer: {
    flex: 1,
    borderRadius: 35,
  },
  innerShadowHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: 5,
    pointerEvents: 'none',
  },
  scrollContent: {
    paddingLeft: 15,
    paddingRight: 100, // Increased to account for wider fade effect
    alignItems: 'center',
  },
  tabItem: {
    paddingHorizontal: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 77,
  },
  tabItemFocused: {
    // Optional background highlight
    // backgroundColor: 'rgba(243, 131, 25, 0.05)',
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: 'Nunito_500Medium',
  },
  tabLabelFocused: {
    fontFamily: 'Nunito_700Bold',
  },
  rightFade: {
    position: 'absolute',
    right: 40, // Align with the actual screen edge (since container right is -40)
    top: 0,
    bottom: 0,
    width: 64, // Widened for a smoother transition
    zIndex: 10,
  },
});

