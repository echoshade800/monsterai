import { Image, Platform, StatusBar, StyleSheet, View } from 'react-native';

export default function SocialTab() {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/tab_social_bg.png')}
        style={styles.image}
        resizeMode="cover"
        onLoad={() => console.log('Social tab image loaded successfully')}
        onError={(error) => console.error('Social tab image load error:', error)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
