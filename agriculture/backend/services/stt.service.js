import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { logger } from './logger.service.js';
import fs from 'fs';
dotenv.config();

// Use the same model as ai.service.js — supports multimodal (text + audio)
const STT_MODEL = 'gemini-2.5-flash-lite';

let sttAI = null;
if (process.env.GEMINI_API_KEY) {
  sttAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  logger.warn('GEMINI_API_KEY missing — STT service will not work.');
}


/**
 * Transcribe an audio file using Gemini's multimodal audio understanding.
 * @param {string} filePath - absolute path to the audio file (webm/ogg/wav)
 * @param {string} lang     - 'en' or 'hi'
 * @returns {Promise<string>} - transcribed text
 */
export const transcribeAudio = async (filePath, lang = 'en') => {
  if (!sttAI) {
    throw new Error('Gemini API key not configured');
  }

  const model = sttAI.getGenerativeModel({ model: STT_MODEL });

  // Read audio file and encode to base64
  const audioBuffer = fs.readFileSync(filePath);
  const base64Audio = audioBuffer.toString('base64');

  // Determine MIME type from extension
  const ext = filePath.split('.').pop().toLowerCase();
  const mimeMap = {
    webm: 'audio/webm',
    ogg:  'audio/ogg',
    wav:  'audio/wav',
    mp4:  'audio/mp4',
    m4a:  'audio/mp4',
  };
  const mimeType = mimeMap[ext] || 'audio/webm';

  // Auto-detect language: always transcribe in the original spoken language.
  // Prefix with [LANG:xx] so the frontend can reliably detect the language.
  const langInstruction =
    'Listen to this audio and transcribe it exactly as spoken. ' +
    'If the speaker speaks Hindi, transcribe in Hindi (Devanagari script). ' +
    'If the speaker speaks English, transcribe in English. ' +
    'If the speaker mixes both languages, keep Hindi words in Devanagari and English words in Latin script. ' +
    'Start your response with [LANG:hi] if the primary language is Hindi, or [LANG:en] if English. ' +
    'After the tag, return ONLY the transcribed text, nothing else.';

  logger.debug(`Transcribing audio | file: ${filePath} | mimeType: ${mimeType} | lang: ${lang}`);

  try {
    const result = await model.generateContent([
      { text: langInstruction },
      {
        inlineData: {
          mimeType,
          data: base64Audio,
        },
      },
    ]);

    const transcript = result.response.text().trim();
    logger.info(`Transcription result: "${transcript}"`);
    return transcript;
  } catch (error) {
    logger.error('Gemini audio transcription failed', error);
    throw error;
  }
};
