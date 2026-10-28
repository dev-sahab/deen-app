import * as Location from 'expo-location';

export const detectUserLocationAndLanguage = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: 'Permission denied',
        suggestedLang: 'bn', // Default fallback
      };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const [geo] = await Location.reverseGeocodeAsync({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    });

    const isBangladesh = geo?.isoCountryCode === 'BD' || geo?.country === 'Bangladesh';
    const suggestedLang = isBangladesh ? 'bn' : 'en';

    return {
      success: true,
      coords: {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      },
      address: {
        city: geo?.city || geo?.subregion || 'Dhaka',
        country: geo?.country || 'Bangladesh',
        countryCode: geo?.isoCountryCode || 'BD',
      },
      suggestedLang,
    };
  } catch (error) {
    console.log('Location detection error:', error);
    return {
      success: false,
      error: error.message,
      suggestedLang: 'bn',
    };
  }
};
