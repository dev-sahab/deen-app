# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Deen App is an Islamic prayer time auto-silent mode mobile app built with React Native + Expo. It calculates 5 daily prayer times using the `adhan` library, auto-detects user location/timezone, and allows customizable silent windows for each prayer.

## Development Commands

```bash
# Install dependencies (required: --legacy-peer-deps for Expo SDK 58 + React 19)
npm install --legacy-peer-deps

# Native modules do NOT run in Expo Go — build a dev client once via EAS
npm run build:dev        # EAS dev-client APK
npm start                # Metro for the dev client
npm run build:apk        # shareable test APK (build:prod → Play AAB)

# Quick check that the whole JS bundle compiles
npx expo export --platform android
```

No local JDK/Android SDK is assumed; Kotlin is compiled on EAS. See docs/STACK.md.

## Architecture

### File-Based Routing with Expo Router

Routes in `src/app/`:
- `index.js` - onboarding (location → language); redirects to tabs when done
- `(tabs)/` - Home (times, countdown, Hijri, daily hadith), Quran, Hadith, Guard, More
- `quran/[surah].js`, `hadith/[book]/index.js`, `hadith/[book]/[section].js`
- `silent.js`, `qibla.js`, `tasbih.js`, `settings.js`, `blocked-apps.js`
- `_layout.js` - waits for store hydration, calls `syncAll()` on launch / foreground / settings change

### Native module: `modules/deen-guard`

Local Expo module (Kotlin; iOS is a capability stub): auto-silent alarm chain (`SilentScheduler.kt`),
local DNS-VPN content filter (`DnsVpnService.kt`), accessibility app blocker (`AppBlockerService.kt`).
The JS wrapper `modules/deen-guard/index.js` is safe to call anywhere (no-ops without native code).
Behaviour rules and Play-policy notes: docs/STACK.md.

### State Management (Zustand)

`src/store/useAppStore.js` uses zustand `persist` (AsyncStorage): language, onboarding, location,
calc (method / madhab / hijriOffset), silent (mode, per-prayer before/after/jamaatTime, jumuah),
athan, guard (filter preset, custom domains, blocked apps), quran, tasbih.

### Services Layer

- `prayerService.js` - adhan times (Karachi + Hanafi default), current/next prayer, `buildSilentWindows`
- `syncService.js` - pushes state to native (silent windows, filter config); schedules athan notifications
- `contentService.js` - Quran/Hadith from fawazahmed0 APIs with on-disk cache
- `hijri.js`, `locationService.js`; UI text via `useT()` (src/hooks/useT.js)

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