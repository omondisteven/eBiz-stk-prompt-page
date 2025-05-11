// /src/pages/api/stk_api/check_payment_status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import  db  from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { phone, account } = req.query;

  if (!phone || !account) {
    return res.status(400).json({ message: 'Phone and account parameters are required' });
  }

  try {
    db.get(
      'SELECT status FROM transactions WHERE phone = ? AND account = ? ORDER BY created_at DESC LIMIT 1',
      [phone, account],
      (err: any, row: { status: string }) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        if (!row) {
          return res.status(404).json({ message: 'Transaction not found' });
        }

        return res.status(200).json({ status: row.status });
      }
    );
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}