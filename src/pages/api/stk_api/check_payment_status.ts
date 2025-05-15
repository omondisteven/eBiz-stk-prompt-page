// /src/pages/api/stk_api/check_payment_status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const statusPath = path.join('/tmp', 'logs', 'payment_statuses.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const checkoutId = req.query.checkout_id as string;
  if (!checkoutId) return res.status(400).json({ error: 'Missing checkout_id' });

  if (!fs.existsSync(statusPath)) {
    return res.status(404).json({ status: 'Pending' });
  }

  const statuses = JSON.parse(fs.readFileSync(statusPath, 'utf-8') || '{}');
  const statusEntry = statuses[checkoutId];

  if (!statusEntry) {
    return res.status(404).json({ status: 'Pending' });
  }

  return res.status(200).json(statusEntry);
}
