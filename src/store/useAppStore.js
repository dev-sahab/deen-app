import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const prayer = (before, after) => ({ enabled: true, before, after, jamaatTime: '' });

export const DEFAULT_SILENT = {
  enabled: false, // master switch; turned on after the user grants DND access
  mode: 'silent', // 'silent' | 'vibrate'
  prayers: {
    fajr: prayer(5, 25),
    dhuhr: prayer(5, 25),
    asr: prayer(5, 20),
    maghrib: prayer(2, 18),
    isha: prayer(5, 25),
  },
  jumuah: { enabled: true, before: 10, after: 60, jamaatTime: '' },
};

export const FILTER_PRESETS = {
  adguardFamily: { label: 'AdGuard Family (adult + ads + SafeSearch)', servers: ['94.140.14.15', '94.140.15.16'] },
  cloudflareFamily: { label: 'Cloudflare Family (adult + malware)', servers: ['1.1.1.3', '1.0.0.3'] },
  cleanBrowsing: { label: 'CleanBrowsing Family (adult + mixed content)', servers: ['185.228.168.168', '185.228.169.168'] },
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      language: 'bn',
      hasCompletedOnboarding: false,

      location: {
        latitude: 23.8103, // Dhaka until GPS says otherwise
        longitude: 90.4125,
        city: 'Dhaka',
        country: 'Bangladesh',
        countryCode: 'BD',
        detected: false,
      },

      calc: { method: 'Karachi', madhab: 'hanafi', hijriOffset: 0 },

      silent: DEFAULT_SILENT,

      athan: {
        enabled: true,
        prayers: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
        reminderMinutes: 0, // extra "prayer in N minutes" notification; 0 = off
      },

      guard: {
        filterPreset: 'adguardFamily',
        customDomains: [],
        blockedApps: [],
      },

      quran: { arabicEdition: 'ara-quranindopak', showTranslation: true, lastRead: null },

      tasbih: { count: 0, target: 33, total: 0 },

      setLanguage: (language) => set({ language }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setLocation: (loc) => set({ location: { ...get().location, ...loc } }),
      setCalc: (patch) => set({ calc: { ...get().calc, ...patch } }),

      setSilent: (patch) => set({ silent: { ...get().silent, ...patch } }),
      setSilentPrayer: (key, patch) => {
        const s = get().silent;
        if (key === 'jumuah') set({ silent: { ...s, jumuah: { ...s.jumuah, ...patch } } });
        else set({ silent: { ...s, prayers: { ...s.prayers, [key]: { ...s.prayers[key], ...patch } } } });
      },

      setAthan: (patch) => set({ athan: { ...get().athan, ...patch } }),
      setAthanPrayer: (key, on) => {
        const a = get().athan;
        set({ athan: { ...a, prayers: { ...a.prayers, [key]: on } } });
      },

      setGuard: (patch) => set({ guard: { ...get().guard, ...patch } }),
      setQuran: (patch) => set({ quran: { ...get().quran, ...patch } }),
      setTasbih: (patch) => set({ tasbih: { ...get().tasbih, ...patch } }),
    }),
    {
      name: 'deen-app-store',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // v1 kept separate AsyncStorage keys; only language/onboarding are worth carrying over.
      migrate: (persisted) => persisted || {},
    }
  )
);

/** Resolves once AsyncStorage has been read, so screens don't flash defaults. */
export const useHydrated = () => {
  const [hydrated, setHydrated] = useState(useAppStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAppStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
};
