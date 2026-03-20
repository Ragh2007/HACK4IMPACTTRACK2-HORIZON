import axios from 'axios';

export const getWeatherForecast = async (location) => {
  try {
    const loc = location || 'Delhi';
    const url = `http://wttr.in/${encodeURIComponent(loc)}?format=j1`;
    console.log(`[WeatherService] Fetching weather from: ${url}`);
    
    const response = await axios.get(url);
    const current = response.data.current_condition[0];
    console.log(`[WeatherService] Received: ${current.temp_C}°C, ${current.weatherDesc[0].value}`);
    
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
