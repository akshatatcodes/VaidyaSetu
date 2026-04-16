/**
 * LOCATION SERVICE (PHASE 6)
 * Handles browser-based geolocation and provides Indian city fallbacks.
 */
export const detectLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: 'browser'
        });
      },
      (error) => {
        console.warn('Geolocation error:', error);
        reject(error);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 3600000 }
    );
  });
};

/**
 * IP-based location fallback (Approximate)
 * Uses a free public API.
 */
export const detectIPLocation = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      city: data.city,
      state: data.region,
      source: 'ip'
    };
  } catch (error) {
    console.warn('IP Location error:', error);
    return null;
  }
};
