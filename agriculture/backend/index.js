import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

import { logger } from './services/logger.service.js';

dotenv.config();

const app = express();


const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.send('API is running ');
});


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


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
