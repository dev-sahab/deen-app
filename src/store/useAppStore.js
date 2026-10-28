import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useAppStore = create((set, get) => ({
  // Language & Onboarding
  language: 'bn', // 'bn' | 'en'
  hasCompletedOnboarding: false,

  // Location
  location: {
    latitude: 23.8103, // Default Dhaka
    longitude: 90.4125,
    city: 'Dhaka',
    country: 'Bangladesh',
    countryCode: 'BD',
  },
  isLoadingLocation: false,

  // Prayer Silent Settings
  // Format per prayer:
  // { enabled: boolean, offsetBefore: number (mins), duration: number (mins), customJamaatTime: string | null }
  silentSettings: {
    fajr: { enabled: true, offsetBefore: 5, duration: 25, customJamaatTime: null },
    dhuhr: { enabled: true, offsetBefore: 5, duration: 20, customJamaatTime: null },
    asr: { enabled: true, offsetBefore: 5, duration: 20, customJamaatTime: null },
    maghrib: { enabled: true, offsetBefore: 5, duration: 15, customJamaatTime: null },
    isha: { enabled: true, offsetBefore: 5, duration: 25, customJamaatTime: null },
  },

  // Actions
  setLanguage: async (lang) => {
    set({ language: lang });
    await AsyncStorage.setItem('app_language', lang);
  },

  completeOnboarding: async () => {
    set({ hasCompletedOnboarding: true });
    await AsyncStorage.setItem('onboarding_complete', 'true');
  },

  setLocation: (locationData) => {
    set({ location: { ...get().location, ...locationData } });
  },

  setLoadingLocation: (loading) => {
    set({ isLoadingLocation: loading });
  },

  updateSilentSetting: async (prayer, settings) => {
    const current = get().silentSettings;
    const updated = {
      ...current,
      [prayer]: { ...current[prayer], ...settings },
    };
    set({ silentSettings: updated });
    await AsyncStorage.setItem('silent_settings', JSON.stringify(updated));
  },

  toggleAllSilent: async (enabled) => {
    const current = get().silentSettings;
    const updated = {};
    Object.keys(current).forEach((key) => {
      updated[key] = { ...current[key], enabled };
    });
    set({ silentSettings: updated });
    await AsyncStorage.setItem('silent_settings', JSON.stringify(updated));
  },

  loadStoredSettings: async () => {
    try {
      const storedLang = await AsyncStorage.getItem('app_language');
      const storedOnboarding = await AsyncStorage.getItem('onboarding_complete');
      const storedSilent = await AsyncStorage.getItem('silent_settings');

      set({
        language: storedLang || 'bn',
        hasCompletedOnboarding: storedOnboarding === 'true',
        silentSettings: storedSilent ? JSON.parse(storedSilent) : get().silentSettings,
      });
    } catch (e) {
      console.log('Error loading saved store settings:', e);
    }
  },
}));
