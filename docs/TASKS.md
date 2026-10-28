# Tasks & Development Phases — Deen App

This document tracks progress across the 18 development stages and breaks them down into executable phases.

---

## 18-Stage Progress Tracker

| # | Stage | Status | Deliverables / Files |
|---|-------|--------|----------------------|
| 1 | Idea | Completed | Auto-silent prayer companion for Android |
| 2 | Research | Completed | Teardown of Muslim Day, Al Hadith, Athan, Kahf Guard in `docs/Competitors.md` |
| 3 | User Definition | Completed | Personas (Tanvir, Rafiq, Nusrat) documented in `docs/PRD.md` |
| 4 | PRD | Completed | Full Product Requirements Document in `docs/PRD.md` |
| 5 | Tech Stack | Completed | React Native, Expo SDK 58, Expo Router, Zustand, Adhan |
| 6 | Architecture | Completed | System Architecture & data flow documented in `docs/Architecture.md` |
| 7 | Design | Completed | Modern Islamic Design System documented in `docs/Design.md` |
| 8 | Rules | Completed | Engineering rules & coding standards in `docs/Rules.md` |
| 9 | Tasks | Completed | Phase breakdown and task checklist in this file (`docs/Tasks.md`) |
| 10 | Setup | Completed | Clean root folder structure, dependencies installed, git initialized |
| 11 | Development | In Progress | Core prayer calculation, UI screens, Zustand store complete |
| 12 | Testing | Pending | Unit tests for calculations, time offset validators, UI tests |
| 13 | Security Check | Pending | DND permission auditing, AsyncStorage security |
| 14 | Code Review | Pending | Code quality review, memory leak checks |
| 15 | Preview Dev | In Progress | Web preview running at `http://localhost:8081` |
| 16 | QA Testing | Pending | Physical device testing on Android 10–14 |
| 17 | Production | Pending | EAS Build setup, signed Android APK/AAB |
| 18 | Monitoring | Pending | Crash reporting (Sentry) and lightweight privacy analytics |

---

## Detailed Task Checklist by Phase

### Phase 1: Core Foundation & UI (Completed ✅)
- [x] Configure root directory layout and remove nested directory
- [x] Install Expo SDK 58 dependencies with legacy peer resolution
- [x] Set up Expo Router file-based navigation (`src/app/`)
- [x] Implement bilingual dictionary (Bangla & English) in `src/constants/translations.js`
- [x] Implement modern Islamic theme system in `src/constants/theme.js`
- [x] Create prayer calculation engine with `adhan` in `src/services/prayerService.js`
- [x] Build location detection and country reverse geocoding in `src/services/locationService.js`
- [x] Build Zustand global state store with AsyncStorage in `src/store/useAppStore.js`
- [x] Implement Language Setup Onboarding screen in `src/app/index.js`
- [x] Implement Prayer Times Dashboard in `src/app/(tabs)/index.js`
- [x] Implement Silent Settings Configuration screen in `src/app/(tabs)/silent-settings.js`
- [x] Implement Time Range Customization Modal in `src/components/PrayerSilentSettingsModal.js`
- [x] Implement App Settings screen in `src/app/(tabs)/settings.js`
- [x] Fix Metro web bundler and verify browser preview at `http://localhost:8081`

### Phase 2: Native Android Silent Mode (Next Priority 🎯)
- [ ] Research Android Do Not Disturb (DND) / Zen Mode APIs in React Native
- [ ] Create an Expo Config Plugin for `android.permission.ACCESS_NOTIFICATION_POLICY`
- [ ] Test ringer mode switching: `RINGER_MODE_NORMAL` ↔ `RINGER_MODE_SILENT`
- [ ] Implement background task scheduler (WorkManager / Expo BackgroundFetch)
- [ ] Add pre-silent push notification ("Phone will be silenced in 5 minutes for Asr")
- [ ] Implement persistent volume level memory (restore exact volume before silent mode)
- [ ] Add notification drawer status widget indicating active silent mode

### Phase 3: Enhancements & Islamic Lifestyle Features
- [ ] Add active countdown timer (Hours : Minutes : Seconds) to next Waqt
- [ ] Add Hijri (Islamic) calendar date display alongside Gregorian date
- [ ] Add Sehri and Iftar times during Ramadan
- [ ] Implement district-wise calculation adjustments for Bangladesh (64 districts)
- [ ] Add Qibla compass direction finder
- [ ] Support custom calculation methods (Muslim World League, ISNA, Umm al-Qura)
- [ ] Add Dark Theme mode for night reading

### Phase 4: Quality Assurance & Production Release
- [ ] Write Jest unit tests for `prayerService.js` timestamp calculations
- [ ] Perform Android permission security audit
- [ ] Configure `app.json` with package name `com.deenapp.mobile` and versioning
- [ ] Set up EAS Build (`eas.json`) for Android production APK/AAB
- [ ] Test on real Android hardware across Samsung, Xiaomi, and Pixel devices
- [ ] Google Play Store submission assets (screenshots, bilingual descriptions)
