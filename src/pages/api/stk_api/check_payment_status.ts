// src/pages/api/stk_api/check_payment_status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getPaymentStatus } from './callback_url'; // import the function

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { phone, account } = req.query;

  if (typeof phone !== 'string' || typeof account !== 'string') {
    return res.status(400).json({ status: 'Error', message: 'Invalid parameters' });
  }

  const status = getPaymentStatus(phone, account);
  res.status(200).json({ status });
}
