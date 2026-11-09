import * as Location from 'expo-location';

/** Asks for permission, reads GPS once, reverse-geocodes. Never throws. */
export const detectLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return { success: false, error: 'permission' };

    const pos =
      (await Location.getLastKnownPositionAsync({ maxAge: 6 * 3600_000 })) ||
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const { latitude, longitude } = pos.coords;

    let geo = null;
    try {
      [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
    } catch {}

    const countryCode = geo?.isoCountryCode || '';
    return {
      success: true,
      location: {
        latitude,
        longitude,
        city:
          geo?.city || geo?.district || geo?.subregion || geo?.region ||
          `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        country: geo?.country || '',
        countryCode,
        detected: true,
      },
      suggestedLang: countryCode === 'BD' ? 'bn' : 'en',
    };
  } catch (e) {
    return { success: false, error: e?.message || 'unknown' };
  }
};
