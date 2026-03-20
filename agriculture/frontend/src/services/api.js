import axios from 'axios';

const API_BASE_URL = 'https://hack4impacttrack2-horizon-production.up.railway.app/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeIntent = async (text, lang) => {
  const response = await apiClient.post('/analyze-intent', {
    text,
    lang,
  });
  return response.data;
};

// other api functions will go here (like weather, prices) later
