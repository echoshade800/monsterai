import { View, StyleSheet } from 'react-native';
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
      <Header
        isCollapsed={isCollapsed}
        onCollapse={handleCollapse}
      />

      <ConversationSection />

      <InputField onFocus={handleInputFocus} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8D4B8',
  },
});
