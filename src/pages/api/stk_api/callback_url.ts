// /src/pages/api/stk_api/callback_url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import  db  from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const mpesaResponse = req.body;
    const resultCode = mpesaResponse.Body?.stkCallback?.ResultCode;
    const checkoutRequestId = mpesaResponse.Body?.stkCallback?.CheckoutRequestID;
    const resultDesc = mpesaResponse.Body?.stkCallback?.ResultDesc || '';

    try {
      if (checkoutRequestId) {
        let status = 'Failed';
        if (resultCode === 0) {
          status = 'Success';
        } else if (resultDesc.toLowerCase().includes('cancelled')) {
          status = 'Cancelled';
        } else if (resultDesc.toLowerCase().includes('timeout')) {
          status = 'Timeout';
        }

        // Update transaction status in database
        db.run(
          'UPDATE transactions SET status = ? WHERE checkout_request_id = ?',
          [status, checkoutRequestId]
        );
      }

      res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Confirmation Received Successfully",
      });
    } catch (error) {
      console.error('Error processing callback:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}