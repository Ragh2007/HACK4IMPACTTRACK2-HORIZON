import axios from 'axios';

//const API_BASE_URL = 'https://hack4impacttrack2-horizon-production.up.railway.app/api';
const API_BASE_URL = 'http://localhost:8080/api';
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeIntent = async (text, lang, type = 'chat') => {
  const response = await apiClient.post('/analyze-intent', {
    text,
    lang,
    type,
  });
  return response.data;
};

/**
 * Send a recorded audio Blob to the backend for Gemini STT transcription.
 * @param {Blob} audioBlob
 * @param {string} lang - 'en' or 'hi'
 * @returns {Promise<string>} - transcribed text
 */
export const transcribeAudio = async (audioBlob, lang = 'en') => {
  const formData = new FormData();
  // Use .webm extension — Chrome MediaRecorder default
  formData.append('audio', audioBlob, `recording.${getExtension(audioBlob.type)}`);
  formData.append('lang', lang);

  const response = await fetch(`${API_BASE_URL}/transcribe`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Transcription failed: ${response.status}`);
  }

  const data = await response.json();
  return data.transcript;
};

function getExtension(mimeType = '') {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg'))  return 'ogg';
  if (mimeType.includes('wav'))  return 'wav';
  if (mimeType.includes('mp4'))  return 'mp4';
  return 'webm';
}
