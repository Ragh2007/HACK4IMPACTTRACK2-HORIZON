import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { transcribeAudio } from '../services/stt.service.js';
import { logger } from '../services/logger.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Store uploads in a temp directory inside backend
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = file.originalname.split('.').pop() || 'webm';
    cb(null, `audio_${timestamp}.${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are accepted'), false);
    }
  },
});

export const uploadMiddleware = upload.single('audio');

export const transcribeAudioController = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file received' });
  }

  const filePath = req.file.path;
  const lang = req.body.lang || 'en';

  logger.info(`Transcribe request | file: ${req.file.filename} | size: ${req.file.size}B | lang: ${lang}`);

  try {
    const transcript = await transcribeAudio(filePath, lang);

    // Clean up temp file after transcription
    fs.unlink(filePath, (err) => {
      if (err) logger.warn(`Could not delete temp audio file: ${filePath}`);
    });

    return res.json({ transcript });
  } catch (error) {
    // Clean up on error too
    fs.unlink(filePath, () => {});
    logger.error('Transcription controller error', error);
    return res.status(500).json({ error: 'Transcription failed', detail: error.message });
  }
};
