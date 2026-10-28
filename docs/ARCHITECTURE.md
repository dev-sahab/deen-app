# System Architecture & Technical Design — Deen App

## 1. Architectural Philosophy

Deen App follows an **Offline-First, Lightweight Client Architecture**. It eliminates external cloud dependencies for core functionality: prayer times, silent windows, and device states are computed directly on the user's phone.

```
┌─────────────────────────────────────────────────────────────┐
│                     UI / Navigation Layer                   │
│   Expo Router (src/app/) + Modular Components               │
│   - index.js (Onboarding / Language)                        │
│   - (tabs)/index.js (Dashboard & Current Waqt)              │
│   - (tabs)/silent-settings.js (Time Range Sliders / Config) │
│   - (tabs)/settings.js (Preferences & Location Refresh)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Dispatches Actions / Reads State
┌──────────────────────────────▼──────────────────────────────┐
│                    State Management Layer                   │
│        Zustand Reactive Store (src/store/useAppStore.js)    │
│        - language ('bn' | 'en')                             │
│        - location { lat, lng, city, country, countryCode }  │
│        - silentSettings { fajr, dhuhr, asr, maghrib, isha } │
│        - hasCompletedOnboarding (boolean)                   │
└──────────────┬──────────────────────────────┬───────────────┘
               │ Auto Sync                    │
┌──────────────▼─────────────┐  ┌─────────────▼───────────────┐
│     Persistence Layer      │  │        Services Layer       │
│       AsyncStorage         │  │ 1. prayerService.js (Adhan) │
│  - app_language            │  │ 2. locationService.js (GPS) │
│  - onboarding_complete     │  │ 3. silentScheduler.js       │
│  - silent_settings         │  │    (Native Android DND/Zen) │
└────────────────────────────┘  └─────────────────────────────┘
```

---

## 2. Directory Structure

```
deen-app/
├── src/
│   ├── app/                      # Expo Router (file-based navigation)
│   │   ├── _layout.js            # Root layout, theme injection, bootstrap
│   │   ├── index.js              # First-launch language setup & location check
│   │   └── (tabs)/               # Bottom tab navigator
│   │       ├── _layout.js        # Tab bar styling & icon definitions
│   │       ├── index.js          # Main Dashboard: Today's prayer times & Waqt
│   │       ├── silent-settings.js# Silent mode custom window configuration
│   │       └── settings.js       # Language switch, location refresh, app info
│   ├── components/               # Atomic & composite reusable components
│   │   ├── PrayerCard.js         # Single prayer row with silent status badge
│   │   └── PrayerSilentSettingsModal.js # Time range customization modal
│   ├── services/                 # Pure business logic and native device bridges
│   │   ├── prayerService.js      # Adhan library wrapper with Karachi calculation method
│   │   └── locationService.js    # GPS coordinates, reverse geocode, language detector
│   ├── store/                    # State management
│   │   └── useAppStore.js        # Centralized Zustand store with persistence
│   └── constants/                # Project constants & design tokens
│       ├── theme.js              # Color palette, spacing, shadows, radii
│       └── translations.js       # Bengali and English dictionary
├── docs/                         # Comprehensive project documentation
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Rules.md
│   ├── Tasks.md
│   ├── Design.md
│   ├── Memory.md
│   └── Competitors.md
├── app.json                      # Expo application config
├── package.json                  # Dependencies & scripts
└── CLAUDE.md                     # Agent guide
```

---

## 3. Core Modules & Data Flow

### 3.1 Bootstrap & Localization Flow
1. App mounts `src/app/_layout.js`.
2. Triggers `loadStoredSettings()` from `useAppStore`:
   - Checks `onboarding_complete` flag in AsyncStorage.
   - If not found, routes to `src/app/index.js` (Language Setup).
   - `locationService.js` fetches GPS coordinates and country code.
   - If `countryCode === 'BD'` → initializes `language = 'bn'`, else `language = 'en'`.
3. Once the user confirms the language, sets `hasCompletedOnboarding = true` and navigates to `/(tabs)`.

### 3.2 Prayer Time Calculation Engine
- Calculation engine powered by `adhan` (pure math astronomical calculations based on solar position).
- Location parameters: `latitude`, `longitude`.
- Calculation Method: **University of Islamic Sciences, Karachi** (standard across Bangladesh, Pakistan, and India).
- Calculations happen on-device in < 5ms. Zero network latency.

### 3.3 Silent Mode Scheduling Engine (Native Android Bridge)
To transition from UI simulation to native Android device execution:
1. **Android Permission:** Requires `android.permission.ACCESS_NOTIFICATION_POLICY` (Do Not Disturb access).
2. **Scheduling Engine:**
   - On prayer times update or settings save, calculate start timestamp and end timestamp for each enabled prayer:
     - `SilentStart = PrayerTime - (offsetBefore * 60 * 1000)`
     - `SilentEnd = PrayerTime + (duration * 60 * 1000)`
   - Android `AlarmManager` / `WorkManager` registers alarms matching exact timestamps.
   - At `SilentStart` → Set Android audio ringer mode to `RINGER_MODE_SILENT` or activate `ZEN_MODE_IMPORTANT_INTERRUPTIONS`.
   - At `SilentEnd` → Restore previous audio ringer mode (`RINGER_MODE_NORMAL`).

---

## 4. Scalability & Extensibility

1. **State Decoupling:** UI screens do not calculate times directly; they observe `prayerTimes` and `silentSettings` from the store.
2. **Translation Extensibility:** Adding a new language (e.g., Arabic `ar` or Urdu `ur`) requires only adding a new key object in `src/constants/translations.js`.
3. **Calculation Method Pluggability:** Calculation method in `prayerService.js` is structured to allow user customization in Phase 3 (ISNA, Muslim World League, Umm al-Qura).
