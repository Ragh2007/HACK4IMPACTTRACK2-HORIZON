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

**Agri-Voice** is a voice-driven, AI-integrated decision engine designed to bridge the digital literacy gap for Indian farmers. By providing real-time mandi prices, weather forecasts, and expert crop advice through simple voice commands in **Hindi and English**, Agri-Voice empowers farmers to make data-driven decisions and eliminate middlemen.

---

## ✨ Key Features

- 🎙️ **Multi-lingual Voice Assistant**: Seamlessly switch between Hindi and English; optimized for natural Indian accents and Hinglish queries.
- 💰 **Real-time Mandi Prices**: Get the latest market rates for crops across various locations using AI-driven structured data extraction.
- 🌦️ **Precision Weather Forecasts**: Location-aware weather updates with practical agricultural advice (e.g., "Good time for irrigation").
- 🧠 **AI-Powered Intent Analysis**: Uses Google's **Gemini AI** to understand complex queries and extract crop names, locations, and intents.
- 🚀 **Performant Architecture**: Built with React 19 and TanStack Query for a snappy, lightning-fast user experience.
- 📊 **Query Analytics**: Logs user queries to Supabase for future trend analysis and personalized advice.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) with [Vite](https://vitejs.dev/)
- **State Management & Caching**: [TanStack Query (React Query) v5](https://tanstack.com/query/latest)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Modern, Clean, and Accessible UI

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/)
- **AI Engine**: [Google Gemini Pro](https://ai.google.dev/) (`@google/generative-ai`)
- **Database**: [Supabase (PostgreSQL)](https://supabase.com/)
- **External Services**: [Firebase](https://firebase.google.com/) (Auth/Admin), Custom Weather & Mandi APIs

---

## 🚀 Getting Started

To run the full-stack application locally:

### 1. Prerequisites
- Node.js installed on your system.
- A Google Cloud account with Gemini API enabled.
- A Supabase project (optional for logging).

### 2. Setup Procedure

Clone the repository and follow these steps:

#### Backend Configuration
1. Navigate to `agriculture/backend`.
2. Create a `.env` file based on `example.env`.
3. Fill in your API keys:
   ```env
   GEMINI_API_KEY=your_key_here
   SUPABASE_URL=your_url
   SUPABASE_KEY=your_key
   ```
4. Run the server:
   ```bash
   npm install
   npm run dev
   ```

#### Frontend Configuration
1. Navigate to `agriculture/frontend`.
2. Run the development server:
   ```bash
   npm install
   npm run dev
   ```

---

## 📂 Project Structure

```text
├── agriculture/
│   ├── backend/          # Express API with Gemini integration
│   │   ├── controllers/  # Intent analysis logic
│   │   ├── routes/       # API endpoints
│   │   └── services/     # AI, Mandi, Weather & DB service layers
│   ├── frontend/         # React application (Vite template)
│   │   └── src/          # Components, Hooks & UI Logic
│   └── QUICKSTART.md     # Detailed setup guide
└── README.md             # this file
```

---

## 🗺️ Roadmap & Future Enhancements

- [ ] **Phase 1**: Price trend graphs for historical analysis.
- [ ] **Phase 2**: Crop growth predictor using weather and soil data.
- [ ] **Phase 3**: Phone-number based authentication (perfect for rural connectivity).
- [ ] **Phase 4**: Expansion to more regional languages (Marathi, Telugu, Punjabi).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
