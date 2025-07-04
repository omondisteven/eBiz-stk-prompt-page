// lib/server-logger.ts
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

const LOG_DIR = path.join(process.cwd(), 'logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR);
}

export async function logToFile(type: string, data: any) {
  try {
    const date = format(new Date(), 'yyyy-MM-dd');
    const logFile = path.join(LOG_DIR, `${date}-${type}.log`);
    const logEntry = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...data
    }) + '\n';

    await fs.promises.appendFile(logFile, logEntry);
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}