import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppStore } from '../store/useAppStore';
import { theme } from '../constants/theme';

export default function RootLayout() {
  const loadStoredSettings = useAppStore((state) => state.loadStoredSettings);

  useEffect(() => {
    loadStoredSettings();
  }, []);

  return (
    <>
      <StatusBar style="light" backgroundColor={theme.colors.primary} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
