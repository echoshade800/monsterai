import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function UnderConstructionScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/linker/dim.png' }}
        style={styles.background}
      />

      <View style={styles.content}>
        <Image
          source={{ uri: 'https://dzdbhsix5ppsc.cloudfront.net/monster/materials/icon.png' }}
          style={styles.monsterIcon}
          resizeMode="contain"
        />

        <Text style={styles.title}>We're still building access!</Text>
        <Text style={styles.subtitle}>
          Invite-only for now. Come back soon or get a code from a friend.
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.backButtonText}>Back to start</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B8A892',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 100,
  },
  monsterIcon: {
    width: 180,
    height: 180,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#555',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 60,
  },
  backButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#1A1A1A',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});
