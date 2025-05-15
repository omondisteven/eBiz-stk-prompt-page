// /src/pages/api/stk_api/check_payment_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type PaymentStatus = {
  timestamp: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Cancelled';
  details: any;
};

const statusPath = path.join(process.cwd(), 'tmp', 'payment_statuses.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { checkout_id } = req.query;

  if (!checkout_id || typeof checkout_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid checkout_id' });
  }

  if (!fs.existsSync(statusPath)) {
    return res.status(200).json({ status: 'Pending', details: [] });
  }

  const raw = fs.readFileSync(statusPath, 'utf8');
  const statuses: Record<string, PaymentStatus> = JSON.parse(raw);

  const result = statuses[checkout_id];
  if (!result) {
    return res.status(200).json({ status: 'Pending', details: [] });
  }

  return res.status(200).json({ status: result.status, details: result.details });
}
