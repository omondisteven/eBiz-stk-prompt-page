// /src/pages/api/stk_api/check_payment_status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

const tmpDir = path.join('/tmp', 'logs');
const statusPath = path.join(tmpDir, 'payment_statuses.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { checkout_id, mobile } = req.query;
  const isMobile = mobile === 'true';

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkout_id || typeof checkout_id !== 'string') {
    console.warn('Invalid or missing checkout_id:', checkout_id);
    return res.status(400).json({ error: 'Invalid checkout_id' });
  }

  if (isMobile) {
    console.log('Mobile status check for:', checkout_id);
  }

  try {
    let allStatuses: { [key: string]: { status: string; details: any } } = {};
    if (fs) {
      if (await fs.stat(statusPath).then(() => true).catch(() => false)) {
        const rawData = await fs.readFile(statusPath, 'utf-8');
        allStatuses = JSON.parse(rawData);
      }
    }

    const statusData = allStatuses[checkout_id] ?? { status: 'Pending', details: null };
    return res.status(200).json(statusData);

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      status: 'Error',
      details: 'Failed to check status'
    });
  }
}
