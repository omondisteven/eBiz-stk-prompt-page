import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { Body: body } = req.body;
    if (!body?.stkCallback) {
      return res.status(400).json({ message: 'Invalid callback format' });
    }

    const { ResultCode, CheckoutRequestID, ResultDesc = '' } = body.stkCallback;
    const status = determineStatus(ResultCode, ResultDesc);

    if (CheckoutRequestID) {
      updateTransactionStatus(db, CheckoutRequestID, status);
    }

    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Callback processed successfully"
    });
  } catch (error) {
    console.error('Callback processing error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

function determineStatus(resultCode: number, resultDesc: string): string {
  if (resultCode === 0) return 'Success';
  if (/cancelled/i.test(resultDesc)) return 'Cancelled';
  if (/timeout/i.test(resultDesc)) return 'Timeout';
  return 'Failed';
}

function updateTransactionStatus(db: any, checkoutId: string, status: string) {
  const stmt = db.prepare(`
    UPDATE transactions 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE checkout_request_id = ?
  `);
  stmt.run(status, checkoutId);
}