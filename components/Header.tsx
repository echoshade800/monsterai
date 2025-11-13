import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { BlurView } from 'expo-blur';
import { User } from 'lucide-react-native';

interface HeaderProps {
  scrollable?: boolean;
}

export function Header({ scrollable = false }: HeaderProps) {
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.header}>
      <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />

      <View style={styles.statusBar}>
        <Text style={styles.time}>{getCurrentTime()}</Text>
        <TouchableOpacity style={styles.iconButton}>
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          <User size={20} color="#000000" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.brandContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>MONSTER AI</Text>
        </View>

        <View style={styles.charactersContainer}>
          <Text style={styles.characterEmoji}>👾</Text>
          <Text style={styles.characterEmoji}>☁️</Text>
          <Text style={styles.characterEmoji}>🦑</Text>
          <Text style={styles.characterEmoji}>🥒</Text>
          <Text style={styles.characterEmoji}>🔥</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    overflow: 'hidden',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20,
    paddingBottom: 15,
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  brandContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  logoContainer: {
    backgroundColor: 'rgba(210, 180, 140, 0.4)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(160, 120, 80, 0.5)',
    marginBottom: 30,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#8B6914',
    letterSpacing: 2,
  },
  charactersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 15,
    paddingHorizontal: 20,
  },
  characterEmoji: {
    fontSize: 60,
  },
});
