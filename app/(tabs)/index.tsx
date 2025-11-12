import { View, StyleSheet, ImageBackground, Platform, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useState } from 'react';
import { Header } from '../../components/Header';
import { ActionCard } from '../../components/ActionCard';
import { StatusCard } from '../../components/StatusCard';
import { ConversationSection } from '../../components/ConversationSection';
import { InputField } from '../../components/InputField';
import { LinearGradient } from 'expo-linear-gradient';

export default function EchoTab() {
  const scrollY = useSharedValue(0);
  const [showActionCard, setShowActionCard] = useState(true);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const contentAnimatedStyle = useAnimatedStyle(() => {
    const marginTop = interpolate(
      scrollY.value,
      [0, 150],
      [420, 120],
      Extrapolate.CLAMP
    );

    return {
      marginTop,
    };
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8D4B8', '#DCC9AA', '#D4BC9C']}
        style={StyleSheet.absoluteFill}
      />

      <Header scrollY={scrollY} isCollapsed={scrollY.value > 150} />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={contentAnimatedStyle}>
          {showActionCard && (
            <ActionCard onDismiss={() => setShowActionCard(false)} />
          )}

          <StatusCard />

          <ConversationSection />
        </Animated.View>
      </Animated.ScrollView>

      <InputField />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
  },
});
