# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Deen App is an Islamic prayer time auto-silent mode mobile app built with React Native + Expo. It calculates 5 daily prayer times using the `adhan` library, auto-detects user location/timezone, and allows customizable silent windows for each prayer.

## Development Commands

```bash
# Install dependencies (required: --legacy-peer-deps for Expo SDK 58 + React 19)
npm install --legacy-peer-deps

# Start development server
npm start

# Run on Android (emulator or physical device)
npm run android

# Run on iOS (macOS only)
npm run ios

# Run on web browser
npm run web
```

## Architecture

### File-Based Routing with Expo Router

Routes are defined in `src/app/` following Next.js-style file-based routing:
- `src/app/index.js` - First-launch language setup screen
- `src/app/(tabs)/` - Tab-navigated screens (Prayer Times, Silent Settings, Settings)
- `src/app/_layout.js` - Root layout with providers

### State Management (Zustand)

All app state lives in `src/store/useAppStore.js` using Zustand with AsyncStorage persistence for:
- `language` - 'bn' | 'en'
- `hasCompletedOnboarding` - First launch flag
- `location` - { latitude, longitude, city, country, countryCode }
- `silentSettings` - Per-prayer config: { enabled, offsetBefore, duration, customJamaatTime }

### Services Layer

- `src/services/prayerService.js` - Prayer time calculations using `adhan` library (Karachi method)
- `src/services/locationService.js` - GPS detection + reverse geocoding for country/language auto-detection

### Constants

- `src/constants/translations.js` - Bangla (bn) and English (en) UI text
- `src/constants/theme.js` - Design system: colors, shadows, typography

## Adding New Features

1. **New screen**: Create file in `src/app/(tabs)/` or `src/app/`
2. **New component**: Add to `src/components/`
3. **New service logic**: Add to `src/services/`
4. **New translations**: Add to both `bn` and `en` objects in `translations.js`
5. **New state**: Add to `useAppStore.js` Zustand store (includes AsyncStorage persistence)

## Prayer Time Calculation

Uses `adhan` library with Karachi calculation method (standard for South Asia):
```javascript
import { CalculationMethod, PrayerTimes } from 'adhan';
const params = CalculationMethod.Karachi();
```

## Key Dependencies

- `expo-router` ~58.0.28 - File-based navigation
- `zustand` ^5.0.16 - State management
- `adhan` ^4.4.6 - Islamic prayer time calculations
- `expo-location` ~58.0.20 - GPS location
- `@react-native-async-storage/async-storage` - Local persistence