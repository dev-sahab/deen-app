# Deen App - Prayer Time Auto-Silent Mode

A modern, Islamic-inspired Android/iOS mobile app that automatically silences your phone during prayer times.

## 🌙 Features

### Phase 1 (Current)
- **5 Daily Prayer Times**: Fajr, Dhuhr, Asr, Maghrib, Isha
- **Auto-Silent Mode**: Phone automatically goes silent during prayer times
- **Customizable Silent Windows**: Set exact time ranges for each prayer
  - Example: If Asr prayer is 3:30 PM, set silent from 3:25 PM to 3:50 PM
  - Adjust minutes before prayer starts
  - Adjust duration of silent mode
- **Location-Based Prayer Calculations**: Automatic GPS detection with timezone support
- **Bilingual Interface**: 
  - Default Bengali (বাংলা) for Bangladesh
  - Auto-detect country and set to English for other regions
  - Manual language selection on first launch
- **Modern Islamic UI**: Beautiful emerald green, gold accents, Islamic design aesthetic

## 📱 Tech Stack

**Frontend:**
- React Native 0.88.1
- Expo SDK 58
- Expo Router (file-based routing)
- Zustand (state management)
- React Native Screens & Safe Area Context (navigation)

**Services & Libraries:**
- `adhan` - Accurate Islamic prayer time calculations (Karachi method)
- `expo-location` - GPS location detection & reverse geocoding
- `expo-notifications` - Silent mode notifications
- `@react-native-async-storage/async-storage` - Local data persistence
- `react-native-gesture-handler` - Touch gesture handling
- `@expo/vector-icons` - Beautiful Ionicons

**Design System:**
- Modern Islamic color palette (emerald, gold, dark blue)
- Consistent shadow effects & card-based layout
- Responsive typography

## 🏗️ Project Structure

```
deen-app/
├── src/
│   ├── app/                          # Expo Router screens
│   │   ├── _layout.js                # Root layout (global setup)
│   │   ├── index.js                  # Language setup/onboarding
│   │   └── (tabs)/                   # Tab-based navigation
│   │       ├── _layout.js            # Tabs layout
│   │       ├── index.js              # Prayer Times Dashboard
│   │       ├── silent-settings.js    # Silent mode customization
│   │       └── settings.js           # App settings & language
│   │
│   ├── components/
│   │   ├── PrayerCard.js             # Prayer display card
│   │   └── PrayerSilentSettingsModal.js  # Silent window editor
│   │
│   ├── services/
│   │   ├── prayerService.js          # Prayer time calculations (Adhan)
│   │   └── locationService.js        # Location detection & geocoding
│   │
│   ├── store/
│   │   └── useAppStore.js            # Zustand state management
│   │
│   ├── constants/
│   │   ├── translations.js           # Bangla & English text
│   │   └── theme.js                  # Colors, shadows, typography
│   │
│   ├── hooks/                        # Custom React hooks (future)
│   ├── utils/                        # Helper functions (future)
│   └── types/                        # TypeScript types (future)
│
├── app.json                          # Expo configuration
├── package.json                      # Dependencies
└── README.md                         # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Expo Go app on your Android phone (for testing)
- GPS location services enabled

### Installation

```bash
# Navigate to project
cd deen-app

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npm start

# For Android
npm run android
# Or scan QR code with Expo Go app
```

### First Launch

1. App auto-detects your location
2. If Bangladesh detected → Bengali (বাংলা) selected
3. If other country → English selected
4. Language setup screen shown on first launch
5. Tap "Continue" to proceed to main dashboard

## 🎯 How It Works

### Prayer Time Calculation
- Uses `adhan` library with **Karachi calculation method** (standard for South Asia)
- Automatically fetches GPS coordinates
- Reverse geocodes to get city/country/timezone
- Calculates exact prayer times based on your precise location

### Auto-Silent Mode
1. **Enable Silent Settings**: Toggle on for each prayer
2. **Set Time Range**:
   - **Minutes Before**: When to start silent (default: 5 mins before)
   - **Duration**: How long to stay silent (default: 20-25 mins)
3. **Custom Jamaat Time** (optional): Override with your mosque's time
4. **Silent activates automatically** when current time enters the window

Example:
```
Prayer Time: 4:00 PM
Settings: 5 mins before, 25 mins duration
Silent Window: 3:55 PM → 4:25 PM
```

### State Persistence
- All settings saved to device using AsyncStorage
- Language preference remembered
- Silent settings per prayer saved locally
- Survives app restarts

## 📋 Current Implementation

### Screens & Components

#### 1. Language Setup Screen (`src/app/index.js`)
- Auto-detect location & suggest language
- Manual language selection
- Beautiful Islamic UI with moon icon
- Shows loading state while detecting

#### 2. Prayer Times Dashboard (`src/app/(tabs)/index.js`)
- Display current prayer (Waqt)
- Show next prayer time
- Display all 5 prayers with times
- Silent status indicator per prayer
- Master toggle for auto-silent
- Swipe-to-refresh to update times

#### 3. Silent Settings Editor (`src/app/(tabs)/silent-settings.js`)
- Customize time range for each prayer
- Visual preview of silent window
- Enable/disable per prayer
- Master enable/disable all button
- Beautiful cards with time inputs

#### 4. App Settings (`src/app/(tabs)/settings.js`)
- Language toggle (Bengali ↔ English)
- Location refresh button
- Notifications settings
- App version & info
- Privacy policy link
- Reset settings option

### Components

#### PrayerCard.js
- Shows prayer name & time
- Silent mode status badge
- Toggle switch for enabling/disabling
- Clickable to edit settings

#### PrayerSilentSettingsModal.js
- Modal dialog to configure silent time
- Inputs for minutes before & duration
- Live preview of silent window
- Optional custom Jamaat time field
- Input validation
- Summary showing example time range

## 🎨 Design System

### Color Palette
```
Primary: #0F5132     (Deep Islamic Emerald)
Gold: #D4AF37        (Elegant accent)
Background: #F8F9FA  (Soft off-white)
Text: #1E293B        (Dark slate)
```

### Typography
- Headings: Bold, large sizes (28-32px for titles)
- Body text: Regular weight, readable sizes (14-16px)
- Secondary: Lighter color for descriptions

### Components
- Rounded corners (border-radius: 16px)
- Soft shadows for depth
- Consistent spacing (16px units)
- Touch feedback with opacity changes

## 🔄 State Management (Zustand)

```javascript
useAppStore()
  .language              // 'bn' | 'en'
  .hasCompletedOnboarding // boolean
  .location             // { latitude, longitude, city, country, countryCode }
  .silentSettings       // { fajr, dhuhr, asr, maghrib, isha }
  .isLoadingLocation    // boolean
  
  // Actions
  .setLanguage(lang)
  .completeOnboarding()
  .setLocation(data)
  .updateSilentSetting(prayer, settings)
  .toggleAllSilent(enabled)
  .loadStoredSettings()
```

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| expo | ~58.0.21 | Framework |
| react-native | 0.88.1 | Mobile UI |
| expo-router | latest | Navigation |
| zustand | latest | State mgmt |
| adhan | latest | Prayer times |
| expo-location | ~58.0.x | GPS & geocoding |
| @react-native-async-storage/async-storage | latest | Local storage |

## ✅ Testing Checklist

- [ ] App loads on first launch
- [ ] Language setup screen appears
- [ ] Location is auto-detected
- [ ] Prayer times calculate correctly
- [ ] All 5 prayers display with times
- [ ] Silent settings toggle works
- [ ] Can edit time range for each prayer
- [ ] Settings persist after app restart
- [ ] Language toggle works (Bengali ↔ English)
- [ ] Location refresh button works
- [ ] All text displays in selected language

## 🔮 Phase 2 Features (Planned)

- [ ] **Silent Mode Execution**: Actually silence phone using native APIs
- [ ] **Notifications**: Alert 5 mins before silent starts
- [ ] **Visual Indicators**: Show countdown to next prayer
- [ ] **Offline Mode**: Cache prayer times for 30 days
- [ ] **Dark Mode**: Full dark theme support
- [ ] **More Languages**: Arabic, Urdu, Hindi support
- [ ] **Multiple Calculation Methods**: Adjust prayer time calculation method
- [ ] **Hijri Calendar**: Display Islamic calendar dates
- [ ] **Qibla Direction**: Show direction to Mecca
- [ ] **Dua Reminders**: Islamic supplications at prayer times

## 🛠️ Development Notes

### Adding New Features
1. Create components in `src/components/`
2. Add translations in `src/constants/translations.js`
3. Use theme colors from `src/constants/theme.js`
4. Store app state in `useAppStore` (Zustand)
5. Create service functions in `src/services/`

### Running Tests
```bash
npm run lint      # Lint code
npm run typecheck # TypeScript check (when added)
```

### Building for Production
```bash
# With EAS Build (recommended - no local setup needed)
npx eas-cli@latest build --platform android

# Then submit to Play Store
npx eas-cli@latest submit --platform android
```

## 📝 License

MIT License - Feel free to use and modify for personal or commercial use.

## 🤝 Contributing

This project is open source. Contributions welcome!

---

**Made with ❤️ for the Muslim community**

د*ین اپ - Your Daily Islamic Companion*
