import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

import { logger } from './services/logger.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Duration: ${duration}ms`);
  });
  next();
});

app.use('/api', apiRoutes);

app.listen(PORT, () => {
  logger.info(`Server started on http://localhost:${PORT}`);
});
