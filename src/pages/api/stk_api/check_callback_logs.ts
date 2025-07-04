// pages/api/stk_api/check_callback_logs.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { checkout_id } = req.query;

  if (!checkout_id || typeof checkout_id !== 'string') {
    return res.status(400).json({ error: 'Invalid checkout ID' });
  }

  try {
    const doc = await adminDb.collection('transactions').doc(checkout_id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const data = doc.data();
    return res.status(200).json({
      receiptNumber: data?.receiptNumber,
      rawCallback: data?.rawCallback,
      status: data?.status
    });
  } catch (err) {
    console.error('Error checking callback logs:', err);
    return res.status(500).json({ error: 'Failed to check logs' });
  }
}