export const getWeatherForecast = async (location) => {
  // TODO: Phase 3 - Implement Weather API
  return {
    location: location || 'your region',
    condition: 'Sunny',
    temp: '28°C',
    advice: 'Good time for irrigation.'
  };
};
