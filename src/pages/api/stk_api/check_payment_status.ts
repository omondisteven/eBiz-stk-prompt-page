// /src/pages/api/stk_api/check_payment_status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import  db  from '@/lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  const { phone, account } = req.query;

  if (!phone || !account) {
    return res.status(400).json({ message: 'Phone and account parameters are required' });
  }

  db.get(
    'SELECT status FROM transactions WHERE phone = ? AND account = ? ORDER BY created_at DESC LIMIT 1',
    [phone.toString(), account.toString()],
    (err: { message: any; }, row: { status: any; }) => {
      if (err) {
        console.error('Database query error:', err.message);
        return res.status(500).json({ message: 'Internal server error' });
      }

      if (row) {
        return res.status(200).json({ status: row.status });
      } else {
        return res.status(200).json({ status: 'Pending' });
      }
    }
  );
}