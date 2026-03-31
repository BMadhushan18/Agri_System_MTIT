export const SRI_LANKA_CITIES = {
  Western: [{ name: 'Colombo', lat: 6.9271, lon: 79.8612 }, { name: 'Gampaha', lat: 7.0873, lon: 79.9992 }, { name: 'Kalutara', lat: 6.5854, lon: 79.9607 }],
  Central: [{ name: 'Kandy', lat: 7.2906, lon: 80.6337 }, { name: 'Matale', lat: 7.4659, lon: 80.6276 }, { name: 'Nuwara Eliya', lat: 6.9497, lon: 80.7891 }],
  Southern: [{ name: 'Galle', lat: 6.0535, lon: 80.221 }, { name: 'Matara', lat: 5.9549, lon: 80.5366 }, { name: 'Hambantota', lat: 6.1245, lon: 81.1213 }],
  Northern: [{ name: 'Jaffna', lat: 9.6615, lon: 80.0255 }, { name: 'Kilinochchi', lat: 9.3803, lon: 80.377 }, { name: 'Mannar', lat: 8.9749, lon: 79.8996 }, { name: 'Vavuniya', lat: 8.7514, lon: 79.9723 }, { name: 'Mullaitivu', lat: 9.2671, lon: 80.8142 }],
  Eastern: [{ name: 'Trincomalee', lat: 8.5878, lon: 81.2152 }, { name: 'Batticaloa', lat: 7.7139, lon: 81.6322 }, { name: 'Ampara', lat: 7.3018, lon: 81.6747 }],
  'North Western': [{ name: 'Kurunegala', lat: 7.4818, lon: 80.3609 }, { name: 'Puttalam', lat: 8.0362, lon: 79.8283 }],
  'North Central': [{ name: 'Anuradhapura', lat: 8.3114, lon: 80.4037 }, { name: 'Polonnaruwa', lat: 7.9403, lon: 81.0188 }],
  Uva: [{ name: 'Badulla', lat: 6.9934, lon: 81.055 }, { name: 'Monaragala', lat: 6.8728, lon: 81.3508 }],
  Sabaragamuwa: [{ name: 'Ratnapura', lat: 6.6828, lon: 80.3992 }, { name: 'Kegalle', lat: 7.2513, lon: 80.3466 }],
};

export function mapWeatherCode(code) {
  const lookup = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime Fog',
    51: 'Light Drizzle',
    53: 'Drizzle',
    55: 'Dense Drizzle',
    61: 'Light Rain',
    63: 'Rain',
    65: 'Heavy Rain',
    71: 'Light Snow',
    73: 'Snow',
    75: 'Heavy Snow',
    80: 'Rain Showers',
    81: 'Heavy Showers',
    82: 'Violent Showers',
    95: 'Thunderstorm',
  };
  return lookup[code] || 'Unknown';
}
