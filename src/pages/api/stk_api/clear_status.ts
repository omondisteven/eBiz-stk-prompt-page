// src/pages/api/stk_api/clear_status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'tmp', 'paymentStatuses.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { phone, account } = req.query;

  if (!phone || !account) {
    return res.status(400).json({ message: 'Phone and account parameters are required' });
  }

  try {
    const statuses = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
    const key = `${phone}-${account}`;
    delete statuses[key];
    fs.writeFileSync(storagePath, JSON.stringify(statuses, null, 2));
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(200).json({ success: false });
  }
}