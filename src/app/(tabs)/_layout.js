import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useT } from '../../hooks/useT';

const ICONS = {
  index: 'time-outline',
  quran: 'book-outline',
  hadith: 'library-outline',
  guard: 'shield-checkmark-outline',
  more: 'grid-outline',
};

export default function TabLayout() {
  const { t } = useT();
  const titles = { index: t.home, quran: t.quran, hadith: t.hadith, guard: t.guard, more: t.more };
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        title: titles[route.name],
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarStyle: { backgroundColor: theme.colors.cardBg, borderTopColor: theme.colors.border },
        tabBarIcon: ({ color, size }) => <Ionicons name={ICONS[route.name]} size={size} color={color} />,
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="quran" />
      <Tabs.Screen name="hadith" />
      <Tabs.Screen name="guard" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
