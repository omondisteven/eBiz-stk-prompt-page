// pages/api/stk_api/check_payment_status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const statusPath = path.join(process.cwd(), 'logs', 'payment_statuses.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { checkout_id } = req.query;

  if (!checkout_id || typeof checkout_id !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid checkout_id' });
  }

  try {
    const statuses = fs.existsSync(statusPath)
      ? JSON.parse(fs.readFileSync(statusPath, 'utf-8'))
      : {};

    const status = statuses[checkout_id] || 'Pending';
    return res.status(200).json({ status });
  } catch (error) {
    console.error("Status check error:", error);
    return res.status(500).json({ status: 'Error', message: 'Failed to check status' });
  }
}
