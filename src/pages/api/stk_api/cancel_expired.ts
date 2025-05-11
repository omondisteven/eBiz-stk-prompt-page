// /src/pages/api/stk_api/cancel_expired.ts
import { NextApiRequest, NextApiResponse } from 'next';
import  db  from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { phone, account } = req.body;

  try {
    // Update all pending transactions older than 60 seconds to 'Timeout'
    db.run(
      `UPDATE transactions SET status = 'Timeout' 
       WHERE phone = ? AND account = ? AND status = 'Pending' 
       AND datetime(created_at) < datetime('now', '-60 seconds')`,
      [phone, account]
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error canceling expired transactions:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}