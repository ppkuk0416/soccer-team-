import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
      {focused && <View style={styles.dot} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="⚽" label="팀" focused={focused} />,
      }} />
      <Tabs.Screen name="attend" options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="📅" label="출석" focused={focused} />,
      }} />
      <Tabs.Screen name="matcher" options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="🔀" label="매칭" focused={focused} />,
      }} />
      <Tabs.Screen name="matches" options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="기록" focused={focused} />,
      }} />
      <Tabs.Screen name="admin" options={{
        tabBarIcon: ({ focused }) => <TabIcon emoji="🛡️" label="평가" focused={focused} />,
      }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopColor: '#f3f4f6',
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    position: 'relative',
  },
  emoji: { fontSize: 20, lineHeight: 24 },
  label: { fontSize: 10, fontWeight: '500', color: '#9ca3af', marginTop: 2 },
  labelActive: { color: '#16a34a' },
  dot: {
    position: 'absolute',
    bottom: -6,
    width: 16,
    height: 2,
    backgroundColor: '#22c55e',
    borderRadius: 1,
  },
});
