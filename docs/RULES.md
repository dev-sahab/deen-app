# Engineering & Development Rules — Deen App

This document outlines the coding standards, conventions, architectural patterns, and rules that must be followed when contributing to the Deen App codebase.

---

## 1. General Principles

1. **Mobile-First & Performance-Conscious:** Avoid heavy dependencies. Keep startup time fast and memory usage minimal.
2. **Offline-First:** No feature may depend on a remote server for core prayer time or silent mode operations.
3. **Respect User Privacy:** Zero ad-tracking, zero location uploading to remote servers. All geocoding and calculation must happen locally or with privacy-respecting native OS APIs.
4. **Bilingual Requirement:** Never hardcode UI text strings. Every user-facing label, placeholder, button, or alert message must exist in `src/constants/translations.js` for both `bn` (Bangla) and `en` (English).

---

## 2. Code Organization & Architecture Rules

### 2.1 File-Based Routing (Expo Router)
- All screen routes reside strictly inside `src/app/`.
- Non-screen code (components, hooks, services, state, utilities) must **never** be placed inside `src/app/`.
- Navigation must use `router.push()`, `router.replace()`, or `<Link>` imported from `expo-router`.

### 2.2 Component Design
- Place all reusable presentation components in `src/components/`.
- Components must be functional components with React Hooks.
- Avoid inline styles where possible; use `StyleSheet.create()` and import design tokens from `src/constants/theme.js`.

### 2.3 State Management (Zustand)
- Store all global app state in `src/store/useAppStore.js`.
- Never mutate state directly; use store action setters.
- Any setting that must survive app restart must be persisted to `AsyncStorage` inside its corresponding action in `useAppStore.js`.

---

## 3. Coding Style & Conventions

### 3.1 Naming Conventions
- **Components:** PascalCase (e.g., `PrayerCard.js`, `PrayerSilentSettingsModal.js`).
- **Hooks:** camelCase with `use` prefix (e.g., `usePrayerCountdown.js`).
- **Services & Utils:** camelCase (e.g., `prayerService.js`, `locationService.js`).
- **Constants:** SCREAMING_SNAKE_CASE for constants, camelCase for object properties.
- **Prayer Keys:** Strictly lowercase: `fajr`, `sunrise`, `dhuhr`, `asr`, `sunset`, `maghrib`, `isha`.

### 3.2 Design System Adherence
- Colors must be sourced from `theme.colors` (e.g., `theme.colors.primary`, `theme.colors.gold`).
- Shadows must use predefined tokens in `theme.shadows.card` or `theme.shadows.activeCard`.
- Corner radii: Standard cards use `borderRadius: 16`, action modals use `borderTopLeftRadius: 20, borderTopRightRadius: 20`.

---

## 4. Native & Expo Rules

1. **Continuous Native Generation (CNG):** Never manually create or edit `android/` or `ios/` folders unless ejecting. Native properties and permissions must be configured via `app.json` plugins.
2. **Package Installation:** Always install dependencies using `npx expo install <package> -- --legacy-peer-deps` to guarantee SDK 58 compatibility.
3. **Native Permissions:** Request permissions (location, notifications, DND access) gracefully with user-friendly explanatory prompts before triggering the system dialog.

---

## 5. Git & Workflow Rules

- **Branching:** Work on feature branches (e.g., `feature/silent-mode-scheduler`, `feature/bangla-calendar`).
- **Commit Messages:** Follow Conventional Commits:
  - `feat: add custom silent window range picker`
  - `fix: correct asr calculation timestamp offset`
  - `docs: update PRD with competitor teardown`
  - `style: refine islamic emerald color token`
- **Clean Commits:** Never commit `.expo/`, `node_modules/`, or temporary build outputs. Maintain `.gitignore` integrity.
