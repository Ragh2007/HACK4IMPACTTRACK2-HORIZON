# 🚜 Agri-Voice Quickstart Guide

Follow these steps to get the full-stack application running with all recent upgrades.

## 1. Environment Setup
- Navigate to the `backend` directory.
- Copy `example.env` to a new file named `.env`.
- Fill in your `GEMINI_API_KEY` (and `SUPABASE_URL`/`SUPABASE_KEY` if you want database logging).

## 2. Start the Backend
Open a terminal in the `backend` folder and run:
```bash
npm install
npm run dev
```
The server will start at `http://localhost:5000`.

## 3. Start the Frontend
Open a new terminal in the `frontend` folder and run:
```bash
npm install
npm run dev
```
The app will be available at the URL provided by Vite (usually `http://localhost:5173`).

## 4. Usage
- Tap the **Microphone** to speak in Hindi or English.
- Use **Quick Actions** for Mandi Prices or Weather.
- The UI will auto-detect your language and switch automatically.
