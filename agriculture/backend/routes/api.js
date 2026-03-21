import express from 'express';
import { analyzeIntent } from '../controllers/analyze.controller.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Agri-Voice Backend is running!' });
});

router.post('/analyze-intent', analyzeIntent);

export default router;
