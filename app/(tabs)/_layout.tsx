import { Tabs } from 'expo-router';
import { MessageCircle, Home, Store, Users } from 'lucide-react-native';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#666666',
        tabBarBackground: () => (
          <BlurView intensity={90} style={StyleSheet.absoluteFill} tint="light" />
        ),
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: [
          styles.tabBarItem,
          route.name === 'index' && styles.tabBarItemActive
        ],
        tabBarIconStyle: styles.tabBarIcon,
      })}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Echo',
          tabBarIcon: ({ size, color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <MessageCircle size={size} color={color} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: 'Store',
          tabBarIcon: ({ size, color }) => (
            <Store size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: 'Social',
          tabBarIcon: ({ size, color }) => (
            <Users size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 25,
    left: '50%',
    marginLeft: -180,
    width: 360,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 0,
    elevation: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 8 : 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    marginTop: -2,
  },
  tabBarItem: {
    paddingVertical: 6,
  },
  tabBarItemActive: {
    borderRadius: 30,
  },
  tabBarIcon: {
    marginTop: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});
