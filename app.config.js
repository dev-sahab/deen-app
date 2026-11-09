const fs = require('fs');
const path = require('path');

// Drop a licensed athan recording at assets/sounds/athan.wav (<30s for iOS) to use it as the
// notification sound. Without it, the default notification sound is used.
const ATHAN = './assets/sounds/athan.wav';
const hasAthanSound = fs.existsSync(path.join(__dirname, ATHAN));

module.exports = {
  expo: {
    name: 'Deen App',
    slug: 'deen-app',
    scheme: 'deenapp',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: { image: './assets/splash-icon.png', resizeMode: 'contain', backgroundColor: '#0F5132' },
    ios: {
      bundleIdentifier: 'com.deenapp.mobile',
      supportsTablet: false,
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'Your location is used on-device to calculate prayer times and the Qibla direction.',
        UIBackgroundModes: ['remote-notification'],
      },
    },
    android: {
      package: 'com.deenapp.mobile',
      versionCode: 1,
      adaptiveIcon: {
        backgroundColor: '#0F5132',
        foregroundImage: './assets/android-icon-foreground.png',
        backgroundImage: './assets/android-icon-background.png',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'POST_NOTIFICATIONS',
        'VIBRATE',
      ],
      blockedPermissions: ['android.permission.RECORD_AUDIO'],
    },
    web: { favicon: './assets/favicon.png' },
    plugins: [
      'expo-router',
      ['expo-build-properties', { android: { minSdkVersion: 26 } }],
      [
        'expo-location',
        { locationWhenInUsePermission: 'Your location is used on-device to calculate prayer times and the Qibla direction.' },
      ],
      [
        'expo-notifications',
        { color: '#0F5132', ...(hasAthanSound ? { sounds: [ATHAN] } : {}) },
      ],
    ],
    extra: { hasAthanSound },
  },
};
