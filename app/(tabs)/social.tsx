import { View, StyleSheet, Image } from 'react-native';

export default function SocialTab() {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/social2.png' }}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  image: {
    width: '100%',
    height: '100%',
    marginTop: -10,
  },
});
