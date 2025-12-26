import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function FiscalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Fiscal Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F1EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontFamily: 'Nunito_700Bold',
    color: '#333',
  },
});
