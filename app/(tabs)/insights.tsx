import { View, Text, StyleSheet } from 'react-native';

export default function InsightsTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Insights</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  text: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
});
