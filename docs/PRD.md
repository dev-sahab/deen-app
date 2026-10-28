# Product Requirements Document (PRD) — Deen App

**Document Version:** 1.1.0  
**Status:** In Progress  
**Target Platform:** Android (Primary), iOS (Cross-platform ready)  
**Primary Market:** Bangladesh (with global multilingual fallback)

---

## 1. Executive Overview

**Deen App (দ্বীন অ্যাপ)** is an intelligent, privacy-first Islamic companion for Android designed to eliminate phone disruptions during Salah (prayer). By calculating exact local prayer times and allowing customizable silent windows per prayer (e.g., muting 5 minutes before Jamaat and unmuting 15 minutes after), Deen App protects the user's spiritual focus without requiring manual intervention every day.

---

## 2. Problem Statement & Motivation

1. **Mosque Distractions:** In Bangladesh and worldwide, mobile phones frequently ring during congregational prayers, breaking congregation focus and causing embarrassment.
2. **Dynamic Prayer Shifts:** Prayer times shift daily by 1–2 minutes across the solar calendar. Static phone alarms or fixed Do-Not-Disturb (DND) schedules fail to track these shifts.
3. **Cluttered Competitors:** Popular Islamic apps are plagued by intrusive advertisements, sluggish performance, and heavy battery usage from background tracking.
4. **Lack of Tailored Silent Windows:** Most apps only alert with sound or Athan, but do not provide an automated, customizable silent window tailored to when a user's local mosque actually performs Jamaat.

---

## 3. User Personas

### Persona 1: Tanvir (29, Urban Professional in Dhaka)
- **Routine:** Works full-time, walks to nearby mosque for Dhuhr, Asr, and Maghrib.
- **Pain Point:** Frequently enters the mosque in a rush right after meetings, forgetting his phone is on high volume.
- **Goal:** Set a one-time rule for Asr (e.g., mute 4:10 PM to 4:30 PM) and never worry about ringing in the mosque again.

### Persona 2: Uncle Rafiq (56, Mosque Regular in Chittagong)
- **Routine:** Attends all 5 daily prayers in Jamaat.
- **Pain Point:** Finds English-heavy apps confusing; gets frustrated by popup ads in apps like Muslim Day.
- **Goal:** Needs a clean, large-font Bangla interface that automatically calculates accurate prayer times for his district and silences his phone automatically.

### Persona 3: Nusrat (24, Student Abroad in London)
- **Routine:** Balances university classes with prayer timings that change drastically between summer and winter.
- **Goal:** Clean English interface, automatic GPS timezone handling, ad-free experience with modern aesthetics.

---

## 4. Scope & Feature Requirements

### 4.1 Auto-Silent Mode (P0 — Core USP)
- **FR-1.1:** Compute daily 5 prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) + Sunrise/Sunset using location coordinates.
- **FR-1.2:** Configurable time window per prayer:
  - `offsetBefore`: Minutes to trigger silent mode *before* prayer/Jamaat time (0 to 60 mins).
  - `duration`: Duration of silent mode in minutes (5 to 120 mins).
  - `customJamaatTime`: Optional manual override for local mosque congregation time.
- **FR-1.3:** Auto-Silent Master Switch: One-tap toggle to enable/disable silent mode across all 5 prayers.
- **FR-1.4:** Individual Prayer Toggles: Ability to toggle auto-silent independently for each prayer (e.g., keep silent active for Dhuhr and Asr, but disabled for Fajr if at home).
- **FR-1.5:** Native Audio Control: Integration with Android DND / Ringer mode (Vibrate/Silent) without requiring user interaction at prayer time.
- **FR-1.6:** Auto-Restore: Immediately restores previous volume profile once prayer duration expires.

### 4.2 Location & Smart Localization (P0)
- **FR-2.1:** First-Launch Geocoding: Automatically detect user's country and city via GPS reverse geocoding.
- **FR-2.2:** Default Language Rule:
  - If user is in Bangladesh (`countryCode === 'BD'`) → Default language is **Bangla (বাংলা)**.
  - If in any other country → Default language is **English**.
- **FR-2.3:** Onboarding Language Selector: Visual language choice displayed on first launch, allowing users to override detected default before entering the app.
- **FR-2.4:** Persistent Language Toggle: Ability to switch languages anytime from the Settings tab.

### 4.3 Modern Islamic UI/UX (P1)
- **FR-3.1:** Design Language: Emerald green palette (`#0F5132`) with gold accents (`#D4AF37`), soft off-white background, and dark slate typography.
- **FR-3.2:** Active Waqt Indicator: Clearly highlights which prayer time is currently active and time remaining until the next prayer.
- **FR-3.3:** Tabbed Navigation: Clean 3-tab layout (Today's Prayers, Auto-Silent Settings, General Settings).
- **FR-3.4:** Offline First: Fully operational without an active internet connection once location is cached.

---

## 5. Non-Functional Requirements

- **Performance:** Cold start time < 1.5 seconds.
- **Battery Optimization:** No continuous GPS polling; location is queried only on demand or upon significant network cell change.
- **Privacy:** 100% on-device calculations; zero telemetry of user prayer habits, zero ad trackers.
- **Reliability:** Background silent triggers must execute within ±15 seconds of scheduled window start.
