import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, ImageBackground } from 'react-native';
import { BlurView } from 'expo-blur';
import { User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
      <ImageBackground
        source={{ uri: 'https://fluqztsizojdgpzxycmy.supabase.co/storage/v1/object/public/mon/image%20(92).png' }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(232, 212, 184, 0)', 'rgba(232, 212, 184, 0.3)', 'rgba(232, 212, 184, 0.8)']}
          style={styles.gradient}
          locations={[0, 0.7, 1]}
        />

        <View style={styles.statusBar}>
          <Text style={styles.time}>{getCurrentTime()}</Text>
          <TouchableOpacity style={styles.iconButton}>
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
            <User size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.brandContainer}>
          <View style={styles.logoContainer}>
            <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
            <Text style={styles.logoText}>MONSTER AI</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  backgroundImage: {
    width: '100%',
    height: 520,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
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
    paddingBottom: 40,
  },
  logoContainer: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(160, 120, 80, 0.5)',
    overflow: 'hidden',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#8B6914',
    letterSpacing: 2,
  },
});
