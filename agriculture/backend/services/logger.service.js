import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'app.log');

const log = (level, message, meta = null) => {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (meta) {
    if (meta instanceof Error) {
      logMessage += ` | Error: ${meta.message}\n${meta.stack}`;
    } else {
      logMessage += ` | Meta: ${JSON.stringify(meta)}`;
    }
  }
  
  logMessage += '\n';
  
  // Append to file
  fs.appendFile(logFile, logMessage, (err) => {
    if (err) console.error("Failed to write to log file:", err);
  });
  
  // Also console log for dev environment
  console.log(`[${level.toUpperCase()}] ${message}`);
};

export const logger = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  debug: (msg, meta) => log('debug', msg, meta)
};
