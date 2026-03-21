import axios from 'axios';
import { logger } from './logger.service.js';

export const getWeatherForecast = async (location, coords) => {
  try {
    let loc = location || 'Delhi';
    if (!location && coords) {
      loc = `${coords.lat},${coords.lon}`;
    }
    const url = `http://wttr.in/${encodeURIComponent(loc)}?format=j1`;
    logger.info(`Fetching weather data for: ${loc}`);
    
    const response = await axios.get(url);
    const current = response.data.current_condition[0];
    logger.debug(`Loaded weather condition: ${current.weatherDesc[0].value}`);
    
    let advice = 'Conditions look normal.';
    const temp = parseInt(current.temp_C);
    const condition = current.weatherDesc[0].value.toLowerCase();
    
    if (temp > 35) {
      advice = 'High temperatures. Ensure adequate watering and protect sensitive crops.';
    } else if (condition.includes('rain')) {
      advice = 'Rain is expected. Avoid spraying chemicals today.';
    } else if (condition.includes('clear') || condition.includes('sun')) {
      advice = 'Good time for irrigation and outdoor field work.';
    }

    return {
      location: loc,
      condition: current.weatherDesc[0].value,
      temp: `${current.temp_C}°C`,
      advice: advice
    };
  } catch (error) {
    console.error("Weather fetch failed:", error.message);
    return {
      location: location || 'your region',
      condition: 'Sunny (fallback)',
      temp: '28°C',
      advice: 'Good time for irrigation.'
    };
  }
};
