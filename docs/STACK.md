# Tech Stack & Platform Decisions

## Why Expo (React Native) + a local native module

| Need | Choice | Reason |
|------|--------|--------|
| One codebase, Android first, iOS later | **Expo SDK 58 + Expo Router** | Already in place; CNG (`expo prebuild`) + EAS Build means no Android Studio needed for most work. |
| Auto-silent, content filter, app blocker | **Local Expo module `modules/deen-guard`** (Kotlin) | These need Android system APIs that no JS library covers reliably. The Expo Modules API keeps them inside the same project and autolinks them. |
| Prayer times | `adhan` (Karachi + **Hanafi** Asr by default) | Offline, accurate, the standard for South Asia. |
| Quran / Hadith | fawazahmed0 `quran-api` / `hadith-api` via jsDelivr, cached to disk with `expo-file-system` | Free, no key, Bangla editions (Abu Bakr Zakaria Quran translation; Bangla Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasai, Ibn Majah, Malik, Nawawi). Works offline after the first read. |
| Athan | `expo-notifications` local notifications, custom `athan.wav` if bundled | No server needed. |
| State | Zustand + `persist` (AsyncStorage) | Small, already used. |

Flutter / KMP were considered: they would not remove the need for native Android code for the guard
features, and would mean rewriting the existing app.

## Native features (Android)

### Auto-silent (`SilentScheduler.kt`)
- JS computes 3 weeks of windows (`buildSilentWindows`) and sends them on every app open / settings change.
- Native side keeps **one** `AlarmManager` exact alarm armed (next start or end) and chains the next one
  when it fires, so it keeps working when the app is closed. `BootReceiver` re-arms after reboot/time change.
- **Start:** if the phone is already silent/vibrate/DND → do nothing (and do nothing at the end).
  Otherwise switch to Silent/Vibrate and remember the ringer mode actually set.
- **End:** restore Normal only if the ringer is still what we set (the user didn't change it).
- Needs: Do Not Disturb access, "Alarms & reminders" (Android 12+), ideally battery optimization off on
  Xiaomi/Oppo/Vivo/Samsung.

### Content filter (`DnsVpnService.kt`, `DnsPacket.kt`)
- Local `VpnService` that routes **only a virtual DNS address** into the tunnel; normal traffic is untouched.
- Blocked names (built-in DoH bypass list + user list) get NXDOMAIN; everything else is forwarded to a
  family-safe resolver (default AdGuard Family: adult + ads + SafeSearch; also Cloudflare Family, CleanBrowsing).
- This is how Kahf Guard–style filtering works on Android without a server. "Always-on VPN" in system
  settings keeps it running across reboots.
- Limits: a browser using its own Secure DNS to an unlisted provider, or a real VPN app, can bypass it.

### App blocker (`AppBlockerService.kt`)
- Accessibility service subscribed only to window-state changes; when a blocked package comes to the
  foreground it performs GLOBAL_ACTION_HOME. No screen content is read.

## iOS reality
- **Apple does not allow apps to change the ringer/silent switch.** iOS users get athan notifications and
  a guide to a Shortcuts Focus automation.
- System-wide filtering needs a Network Extension (`NEDNSSettingsManager` / content filter) with Apple
  entitlements, and app blocking needs the Screen Time (FamilyControls) entitlement. Planned for a later
  version; the iOS module currently reports these as unsupported.

## Google Play policy notes (check before release)
- **VpnService:** must fill the VpnService declaration; content filtering apps must show an in-app
  prominent disclosure (implemented) and must not touch ad monetization of other apps. Ad blocking via
  VPN is a known rejection risk — be ready to ship a Play build with ad blocking off by default (adult
  filter only) and a full build via direct APK.
- **Accessibility API:** needs the Accessibility declaration + prominent disclosure (implemented) and a
  demo video. Apps that aren't accessibility tools are reviewed strictly.
- **SCHEDULE_EXACT_ALARM:** user-granted; justified by prayer-time silencing.

## Building
Native code cannot run in Expo Go. Use a development build:
```bash
npm i -g eas-cli && eas login
npm run build:dev        # dev-client APK (install once on the phone)
npm start                # then open the app; JS reloads live
npm run build:apk        # shareable test APK
npm run build:prod       # Play Store AAB
```
Local builds (`npm run android`) need JDK 17 + Android SDK.
