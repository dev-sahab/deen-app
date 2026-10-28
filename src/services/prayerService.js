import { Coordinates, CalculationMethod, PrayerTimes, SunnahTimes } from 'adhan';

export const getPrayerTimesForLocation = (latitude, longitude, date = new Date()) => {
  try {
    const coordinates = new Coordinates(latitude, longitude);

    // Karachi method is standard for Bangladesh / South Asia (University of Islamic Sciences, Karachi)
    const params = CalculationMethod.Karachi();

    const prayerTimes = new PrayerTimes(coordinates, date, params);
    const sunnahTimes = new SunnahTimes(prayerTimes);

    return {
      fajr: prayerTimes.fajr,
      sunrise: prayerTimes.sunrise,
      dhuhr: prayerTimes.dhuhr,
      asr: prayerTimes.asr,
      sunset: prayerTimes.sunset,
      maghrib: prayerTimes.maghrib,
      isha: prayerTimes.isha,
      currentPrayer: prayerTimes.currentPrayer(),
      nextPrayer: prayerTimes.nextPrayer(),
      timeForPrayer: (prayer) => prayerTimes.timeForPrayer(prayer),
      lastThirdOfTheNight: sunnahTimes.lastThirdOfTheNight,
      middleOfTheNight: sunnahTimes.middleOfTheNight
    };
  } catch (error) {
    console.error('Error calculating prayer times:', error);
    return null;
  }
};

export const formatPrayerTime = (date) => {
  if (!date) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
};
