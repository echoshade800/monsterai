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
          colors={['rgba(232, 212, 184, 0)', 'rgba(232, 212, 184, 0.6)']}
          style={styles.gradient}
          locations={[0.5, 1]}
        />

        <View style={styles.statusBar}>
          <Text style={styles.time}>{getCurrentTime()}</Text>
          <View style={styles.dynamicIsland} />
          <TouchableOpacity style={styles.iconButton}>
            <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
            <User size={20} color="#000000" strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: 380,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
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
  dynamicIsland: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight || 20,
    left: '50%',
    marginLeft: -60,
    width: 120,
    height: 28,
    borderRadius: 20,
    backgroundColor: '#000000',
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
});
