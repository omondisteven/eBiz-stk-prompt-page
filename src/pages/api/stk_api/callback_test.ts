// pages/api/stk_api/callback_test.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const logPath = path.join(process.cwd(), 'logs', 'callback_test.log');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    method: req.method,
    headers: req.headers,
    body: req.body
  };

  fs.appendFileSync(logPath, JSON.stringify(logData, null, 2) + '\n');
  res.status(200).json({ success: true });
}