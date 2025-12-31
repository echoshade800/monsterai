import { Tabs } from 'expo-router';
import { ScrollableGlassTabBar } from '../../components/ScrollableGlassTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ScrollableGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="daily-brief"
        options={{
          title: 'Daily Brief',
        }}
      />
      <Tabs.Screen
        name="nutri"
        options={{
          title: 'Nutri',
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Store',
        }}
      />
    </Tabs>
  );
}
