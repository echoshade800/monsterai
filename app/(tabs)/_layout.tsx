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
        name="fiscal"
        options={{
          title: 'Fiscal',
        }}
      />
      <Tabs.Screen
        name="architect"
        options={{
          title: 'Architect',
        }}
      />
      <Tabs.Screen
        name="nutri"
        options={{
          title: 'Nutri',
        }}
      />
      <Tabs.Screen
        name="somno"
        options={{
          title: 'Somno',
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
        }}
      />
      <Tabs.Screen
        name="brew"
        options={{
          title: 'Brew',
        }}
      />
      <Tabs.Screen
        name="zen"
        options={{
          title: 'Zen',
        }}
      />
      <Tabs.Screen
        name="muse"
        options={{
          title: 'Muse',
        }}
      />
    </Tabs>
  );
}
