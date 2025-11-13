import { View, StyleSheet, ScrollView } from 'react-native';
import { Header } from '../../components/Header';
import { ConversationSection } from '../../components/ConversationSection';
import { InputField } from '../../components/InputField';
import { LinearGradient } from 'expo-linear-gradient';

export default function EchoTab() {
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
