import { NextApiRequest, NextApiResponse } from 'next';
import kv, { getPaymentKey } from '../../../lib/kv';

// Define the expected shape of our payment data in KV
interface PaymentData {
  status?: string;
  details?: string;
  updatedAt?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { checkout_id } = req.query;

  if (!checkout_id || typeof checkout_id !== 'string') {
    return res.status(400).json({ error: 'Invalid checkout_id' });
  }

  try {
    const paymentKey = getPaymentKey(checkout_id);
    const paymentData = (await kv.hgetall(paymentKey)) as PaymentData;

    if (!paymentData?.status) {
      return res.status(200).json({ 
        status: 'Pending', 
        details: 'Waiting for payment confirmation' 
      });
    }

    // Safely parse details if they exist
    let parsedDetails: any = null;
    if (paymentData.details) {
      try {
        parsedDetails = JSON.parse(paymentData.details);
      } catch (e) {
        console.error('Error parsing payment details:', e);
        parsedDetails = paymentData.details; // Fallback to raw string
      }
    }

    return res.status(200).json({
      status: paymentData.status,
      details: parsedDetails,
      updatedAt: paymentData.updatedAt || null
    });

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({ 
      status: 'Error',
      details: 'Failed to check status',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}