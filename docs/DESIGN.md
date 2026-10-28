# Modern Islamic UI/UX Design System — Deen App

This document defines the visual identity, design tokens, typography, component styling, and user experience rules for Deen App.

---

## 1. Visual Philosophy: Modern Islamic Aesthetic

The design blends **reverent Islamic heritage** with **clean, modern minimalism**:
- **Emerald Green:** Symbolizes peace, Islamic tradition, and spiritual tranquility.
- **Warm Gold Accents:** Symbolizes elegance, mihrab illumination, and timeless dignity.
- **Airy White/Slate Canvas:** Generous breathing room, avoiding the visual clutter and heavy ads common in older Islamic utility apps.
- **Subtle Elevation & Curves:** Soft 16px corner radii and diffused shadows create tactile, modern Android surfaces.

---

## 2. Color Palette & Tokens

| Token | Hex Value | Usage / Meaning |
|-------|-----------|-----------------|
| `primary` | `#0F5132` | Deep Islamic Emerald — Main brand color, top banners, active buttons |
| `primaryLight` | `#198754` | Light Emerald — Active highlights, success states, secondary badges |
| `primaryDark` | `#0A3622` | Dark Forest Green — Onboarding header card, footer backgrounds |
| `gold` | `#D4AF37` | Islamic Metallic Gold — Icons, crescent accents, premium badges |
| `goldLight` | `#F3E5AB` | Soft Champagne Gold — Subtitle texts on dark backgrounds |
| `background` | `#F8F9FA` | Off-White Slate — Main app canvas background |
| `cardBg` | `#FFFFFF` | Crisp White — Surface cards, tab bar background |
| `cardBgDark` | `#122620` | Dark Islamic Card — Dark mode container background |
| `textPrimary` | `#1E293B` | Dark Slate — Headings, prayer times, primary text |
| `textSecondary` | `#64748B` | Slate Gray — Subtitles, captions, disabled states |
| `textLight` | `#F8FAFC` | Light Crisp White — Typography on emerald surfaces |
| `border` | `#E2E8F0` | Soft Gray — Card borders, list dividers |
| `silentActive` | `#8B5CF6` | Soft Violet — Badge indicator when silent mode is actively armed |
| `success` | `#10B981` | Emerald Success — Enabled switches, confirmation icons |
| `danger` | `#EF4444` | Red Warning — Reset settings, destructive actions |

---

## 3. Typography Guidelines

- **English Typography:** Clean system sans-serif (Inter / Roboto / System) with crisp legibility.
- **Bangla Typography:** Optimized for high-readability Bangla glyphs with appropriate line-height (`1.4` to `1.6`) to prevent vowel diacritic clipping.
- **Scale:**
  - **Screen Titles:** 28px – 32px, Bold (`fontWeight: '700'`)
  - **Prayer Clock:** 24px – 36px, Bold
  - **Card Headers:** 16px – 18px, Semi-Bold (`fontWeight: '600'`)
  - **Body / Labels:** 14px – 15px, Regular (`fontWeight: '400'`)
  - **Subtitles & Captions:** 12px – 13px, Regular (`fontWeight: '400'`)

---

## 4. Component Patterns

### 4.1 Prayer Card (`PrayerCard.js`)
- **Structure:** Left side displays prayer name and calculated time. Center displays the silent mode status badge. Right side contains the active toggle switch.
- **Active State:** When silent mode is currently active for that prayer, card receives a subtle 2px border in `theme.colors.success`.
- **Card Radius:** `borderRadius: 16`.
- **Shadow:**
  ```javascript
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 10,
  elevation: 3
  ```

### 4.2 Header Banner Card
- **Background:** `theme.colors.primary` (`#0F5132`) with gold location badge.
- **Focal Point:** Current Waqt name displayed in large, prominent typography.
- **Secondary Info:** Time remaining until the next prayer with gold accent text.

### 4.3 Custom Silent Window Modal (`PrayerSilentSettingsModal.js`)
- Bottom-sheet presentation with rounded top edges (`borderTopLeftRadius: 20`, `borderTopRightRadius: 20`).
- Dedicated numeric input fields for **Minutes Before** and **Silent Duration**.
- Live interactive summary box showing real-world timing examples (e.g., *"If Asr is 4:00 PM, phone will silence from 3:55 PM to 4:20 PM"*).

---

## 5. Accessibility & Ergonomics

1. **Touch Targets:** All interactive icons, switches, and buttons have a minimum touch hit-box of 44x44 dp.
2. **Contrast Ratio:** Text on emerald green meets WCAG AA standards (minimum 4.5:1 contrast).
3. **One-Handed Navigation:** Bottom tab navigator allows easy thumb access to all three main areas of the app.
