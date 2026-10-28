# Project Memory & Technical Log — Deen App

This document records architectural decisions, key milestones, state snapshots, and context retained across development sessions.

---

## 1. Core Technical Decisions Log

### Decision 1: Expo SDK 58 + React Native 0.88.1
- **Context:** Selected to ensure bleeding-edge performance, modern React 19 compatibility, and robust TypeScript support.
- **Tradeoff:** Requires `--legacy-peer-deps` during npm installation due to strict peer dependency resolutions in React 19.

### Decision 2: Expo Router (File-Based Navigation)
- **Context:** Chose over React Navigation's manual stack configuration.
- **Benefit:** Cleaner folder structure matching Next.js paradigms (`src/app/` for routes, `src/components/` for UI).

### Decision 3: Client-Side `adhan` Library for Prayer Calculations
- **Context:** Evaluated cloud REST APIs vs local calculation library.
- **Decision:** Chose `adhan` (Karachi calculation method) for 100% offline availability, zero network latency, and complete user privacy.

### Decision 4: Zustand + AsyncStorage for State Management
- **Context:** Evaluated Redux Toolkit, Context API, and Zustand.
- **Decision:** Zustand was selected for its ultra-lightweight footprint, zero boilerplate, and simple middleware support for AsyncStorage persistence.

---

## 2. Session Milestone Summary

- **Phase 1 Foundation Completed:**
  - Project directory cleaned and nested directory resolved.
  - Bilingual localization framework established (Bangla default for Bangladesh, English default internationally).
  - Prayer calculation service and location geocoding fully implemented.
  - Three main tabs built: Dashboard, Silent Settings, and App Settings.
  - Metro bundler configured and web preview running successfully at `http://localhost:8081`.

---

## 3. Active Technical Debt & Caveats

1. **Native DND Permission:** Currently, the app's auto-silent toggle simulates state in the UI store. Phase 2 requires implementing the native Android Do Not Disturb permission (`ACCESS_NOTIFICATION_POLICY`) and `AlarmManager` background bridge.
2. **Peer Dependencies:** When adding new packages, always use `npx expo install <package> -- --legacy-peer-deps` to prevent React 19 resolution conflicts.
