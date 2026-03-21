# HACK4IMPACTTRACK2-HORIZON
## Team Name - Horizon
### Team Members -
1.Raghav Sinha (2428038)
2.Aditya Raj (2428027)
3.Shivam Kumar(2428042)
4.Shree Shivam(2429035)

## Domain - Smart Agriculture
# Approved Problem Statement 
Small-scale farmers, especially those with low digital literacy, face challenges in effectively accessing and utilizing digital platforms for fair pricing and access, and lack simple tools for understanding market trends and making crop related decisions.

# 🌾 Agri-Voice: Intelligence for the Indian Farmer

[![React](https://img.shields.io/badge/React-19.0-blue?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js)](https://nodejs.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-orange?logo=google-gemini)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3FCF8E?logo=supabase)](https://supabase.com/)

**Agri-Voice** is a voice-driven, AI-integrated decision engine designed specifically for Indian farmers. It bridges the digital literacy gap by providing real-time mandi prices, weather forecasts, and expert crop advice through voice commands in **Hindi and English**.

---

## 🚀 API & Services Documentation

The application relies on several external APIs to provide real-time data and AI capabilities.

### 1. Google Gemini AI (`gemini-2.5-flash-lite`)
- **Purpose**: Powering intent classification, text extraction from search results, and multilingual speech-to-text (STT).
- **Location of Logic**: 
  - `backend/services/ai.service.js` (Classification and analysis)
  - `backend/services/stt.service.js` (Audio transcription)
- **Stored In**: `backend/.env` under `GEMINI_API_KEY`.
- **How to Change**: [Get a key here](https://aistudio.google.com/) and update the `.env` file. To change the model version, update the `GEMINI_MODEL` or `STT_MODEL` constants in the respective service files.

### 2. SerpApi (Google Search API)
- **Purpose**: Fetching the latest mandi prices and agricultural news by searching the live web.
- **Location of Logic**: `backend/services/mandi.service.js`.
- **Stored In**: `backend/.env` under `SERPAPI_KEY`.
- **How to Change**: [Get a key here](https://serpapi.com/) and update the `.env` file.

### 3. wttr.in (Weather Forecast)
- **Purpose**: Real-time location-aware weather forecasting and agricultural advice.
- **Location of Logic**: `backend/services/weather.service.js`.
- **Stored In**: No API key required (Open source).
- **How to Change**: Modify the `getWeatherForecast` function; it currently pulls fresh JSON data from `wttr.in`.

### 4. Supabase (Database & Logging)
- **Purpose**: Logging farmer queries, intents, crops, and locations for trend analysis.
- **Location of Logic**: `backend/services/db.service.js`.
- **Stored In**: `backend/.env` under `SUPABASE_URL` and `SUPABASE_KEY`.
- **How to Change**: Create a project on [Supabase.com](https://supabase.com/), create a `user_queries` table, and update your credentials in the `.env` file.

### 5. Web Speech API (Browser Native)
- **Purpose**: Providing Text-to-Speech (TTS) capabilities.
- **Location of Logic**: `frontend/src/App.jsx` (`speak` function).
- **Stored In**: Built into modern browsers (Chrome, Edge, Safari).
- **How to Change**: You can modify the `targetLang`, `rate`, and `voice` selection in the `speak` function to adjust the speech quality or supported languages.

---

## ✨ Key Features

- 🎙️ **Multi-lingual Voice Assistant**: High-fidelity transcription for both Hindi and English with auto-language detection.
- 💰 **Real-time Mandi Prices**: Live market values for crops across India via AI-powered web extraction.
- 🌦️ **Precision Weather Forecasts**: Dynamic forecasts with actionable farming tips based on your GPS location.
- 🧠 **AI-Powered Intent Analysis**: Deep semantic understanding that extracts crop names and locations from natural speech.
- 💎 **Premium UI/UX**: State-of-the-art glassmorphism design with animated waveforms, smooth transitions, and mobile-first responsiveness.

---

## 📂 Project Structure

```text
├── agriculture/
│   ├── backend/          # Node-Express logic
│   │   ├── controllers/  # Intent analysis & Transcription handling
│   │   ├── routes/       # API endpoints (/api/analyze-intent, /api/transcribe)
│   │   ├── uploads/      # Temporary audio storage (auto-cleaned)
│   │   └── services/     # Core logic (AI, Mandi, Weather, DB)
│   ├── frontend/         # React application (Vite template)
│   │   └── src/          # Components & Premium CSS styles
```

---

## 🛠️ Setup Procedure

1. **Backend Configuration**:
   - `cd agriculture/backend`
   - Create `.env` from `example.env` and add your `GEMINI_API_KEY` and `SERPAPI_KEY`.
   - `npm install && npm run dev`

2. **Frontend Configuration**:
   - `cd agriculture/frontend`
   - `npm install && npm run dev`

---
*Created with ❤️ by schallten*
