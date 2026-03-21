import express from 'express';
import { analyzeIntent } from '../controllers/analyze.controller.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Agri-Voice Backend is running!' });
});

router.post('/analyze-intent', analyzeIntent);
export const analyzeIntent = async (text, lang, type = 'chat') => {
  const response = await apiClient.post('/analyze-intent', {
    text,
    lang,
    type,  // 'chat' | 'news'
  });
  return response.data;
};

export default router;
