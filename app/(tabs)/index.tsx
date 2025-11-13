import { View, StyleSheet, ScrollView } from 'react-native';
import { useState } from 'react';
import { Header } from '../../components/Header';
import { ActionCard } from '../../components/ActionCard';
import { StatusCard } from '../../components/StatusCard';
import { ConversationSection } from '../../components/ConversationSection';
import { InputField } from '../../components/InputField';
import { LinearGradient } from 'expo-linear-gradient';

export default function EchoTab() {
  const [showActionCard, setShowActionCard] = useState(true);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E8D4B8', '#DCC9AA', '#D4BC9C']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header />

        {showActionCard && (
          <ActionCard onDismiss={() => setShowActionCard(false)} />
        )}

        <StatusCard />

        <ConversationSection />
      </ScrollView>

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
