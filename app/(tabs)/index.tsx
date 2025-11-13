import { View, StyleSheet, ScrollView } from 'react-native';
import { Header } from '../../components/Header';
import { ConversationSection } from '../../components/ConversationSection';
import { InputField } from '../../components/InputField';
import { useState, useCallback } from 'react';

export default function EchoTab() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleInputFocus = useCallback(() => {
    setIsCollapsed(true);
  }, []);

  const handleCollapse = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  return (
    <View style={styles.container}>
      {/* Fixed Header at the top */}
      <View style={styles.headerContainer}>
        <Header
          isCollapsed={isCollapsed}
          onCollapse={handleCollapse}
        />
      </View>

      {/* Scrollable conversation area */}
      <View style={styles.conversationWrapper}>
        <ScrollView
          style={styles.conversationContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <ConversationSection />
        </ScrollView>
      </View>

      {/* Fixed input at bottom */}
      <View style={styles.inputWrapper}>
        <InputField onFocus={handleInputFocus} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D4B8',
  },
  headerContainer: {
    zIndex: 10,
  },
  conversationWrapper: {
    flex: 1,
    backgroundColor: '#F5F7F9',
  },
  conversationContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  inputWrapper: {
    backgroundColor: '#F5F7F9',
    paddingTop: 10,
    paddingBottom: 90,
  },
});
