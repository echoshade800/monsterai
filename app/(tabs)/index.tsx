import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { useState } from 'react';
import { Header } from '../../components/Header';
import { ActionCard } from '../../components/ActionCard';
import { StatusCard } from '../../components/StatusCard';
import { ConversationSection } from '../../components/ConversationSection';
import { LinearGradient } from 'expo-linear-gradient';

export default function EchoTab() {
  const [showActionCard, setShowActionCard] = useState(true);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8D4B8', '#DCC9AA', '#D4BC9C']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header scrollY={scrollY} />

        {showActionCard && (
          <ActionCard onDismiss={() => setShowActionCard(false)} />
        )}

        <StatusCard />

        <ConversationSection />
      </Animated.ScrollView>
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
