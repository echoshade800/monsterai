import { View, StyleSheet } from 'react-native';
import { Header } from '../../components/Header';
import { ConversationSection } from '../../components/ConversationSection';
import { InputField } from '../../components/InputField';
import { useState, useCallback } from 'react';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const HEADER_EXPANDED_HEIGHT = 520;
const HEADER_COLLAPSED_HEIGHT = 180;
const SCROLL_THRESHOLD = 50;

export default function EchoTab() {
  const scrollY = useSharedValue(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const handleInputFocus = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const handleCollapse = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        <Header
          scrollY={scrollY}
          isCollapsed={isCollapsed}
          onCollapse={handleCollapse}
        />

        <ConversationSection />
      </Animated.ScrollView>

      <InputField onFocus={handleInputFocus} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D4B8',
  },
  scrollContent: {
    paddingTop: 0,
    backgroundColor: '#F5F7F9',
  },
});
