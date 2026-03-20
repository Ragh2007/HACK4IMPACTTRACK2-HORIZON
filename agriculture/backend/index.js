import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();


const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.send('API is running ');
});


app.use('/api', apiRoutes);


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
