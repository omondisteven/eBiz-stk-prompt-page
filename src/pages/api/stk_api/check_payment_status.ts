import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const statusPath = path.join('/tmp', 'logs', 'payment_statuses.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { checkout_id } = req.query;

  if (!checkout_id || typeof checkout_id !== 'string') {
    return res.status(400).json({ error: 'Invalid checkout_id' });
  }

  try {
    let statusData = { status: 'Pending', details: null };

    if (fs.existsSync(statusPath)) {
      const rawData = fs.readFileSync(statusPath, 'utf-8');
      const allStatuses = JSON.parse(rawData);

      if (allStatuses[checkout_id]) {
        statusData = {
          status: allStatuses[checkout_id].status,
          details: allStatuses[checkout_id].details,
        };
      }
    }

    return res.status(200).json(statusData);

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      status: 'Error',
      details: 'Failed to check status'
    });
  }
}
