import { useEffect, useRef } from 'react';
import { AppState, View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore, useHydrated } from '../store/useAppStore';
import { syncAll } from '../services/syncService';
import { theme } from '../constants/theme';

/** Re-syncs native schedules when settings that affect them change, or the app is reopened. */
function useBackgroundSync(ready) {
  const timer = useRef(null);
  useEffect(() => {
    if (!ready) return;
    const run = () => {
      clearTimeout(timer.current);
      timer.current = setTimeout(syncAll, 600);
    };
    run();
    const appSub = AppState.addEventListener('change', (s) => s === 'active' && run());
    const storeSub = useAppStore.subscribe((state, prev) => {
      if (
        state.silent !== prev.silent || state.athan !== prev.athan || state.location !== prev.location ||
        state.calc !== prev.calc || state.guard !== prev.guard || state.language !== prev.language
      ) run();
    });
    return () => {
      appSub.remove();
      storeSub();
      clearTimeout(timer.current);
    };
  }, [ready]);
}

export default function RootLayout() {
  const hydrated = useHydrated();
  useBackgroundSync(hydrated);

  if (!hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.primary, justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.gold} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }} />
    </SafeAreaProvider>
  );
}
