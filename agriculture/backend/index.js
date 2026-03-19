import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Main Ping Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Agri-Voice Backend is running!' });
});

// Mock Gemini Prediction Route (To be connected to your frontend later)
app.post('/api/analyze-intent', (req, res) => {
  const { text } = req.body;
  // This will later integrate with Gemini and your database layers
  res.json({
    intent: "unknown",
    response: `Received text: ${text}`
  });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
