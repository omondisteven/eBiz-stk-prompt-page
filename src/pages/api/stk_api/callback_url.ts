import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { Body: body } = req.body;
    
    try {
      if (!body?.stkCallback) {
        throw new Error('Invalid callback format');
      }

      const { ResultCode, CheckoutRequestID, ResultDesc = '' } = body.stkCallback;
      
      let status: 'Success' | 'Cancelled' | 'Failed';
      if (ResultCode === 0) {
        status = 'Success';
      } else if (/cancelled/i.test(ResultDesc)) {
        status = 'Cancelled';
      } else {
        status = 'Failed';
      }

      // Immediately update database
      db.prepare(`
        UPDATE transactions 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE checkout_request_id = ?
      `).run(status, CheckoutRequestID);

      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Callback processed successfully"
      });

    } catch (error) {
      console.error('Callback processing error:', error);
      return res.status(500).json({
        ResultCode: 1,
        ResultDesc: "Error processing callback"
      });
    }
  }
  return res.status(405).json({ message: 'Method not allowed' });
}