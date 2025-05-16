// src/pages/api/stk_api/query_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const consumerKey = process.env.MPESA_CONSUMER_KEY!;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
const BusinessShortCode = '174379';
const Passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { checkout_id } = req.query;

  if (!checkout_id || typeof checkout_id !== 'string') {
    return res.status(400).json({ error: 'Missing checkout_id' });
  }

  try {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenRes = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const access_token = tokenRes.data.access_token;
    const Timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const Password = Buffer.from(`${BusinessShortCode}${Passkey}${Timestamp}`).toString('base64');

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        BusinessShortCode,
        Password,
        Timestamp,
        CheckoutRequestID: checkout_id,
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('STK Query Error:', error);
    res.status(500).json({ error: 'Failed to query STK status' });
  }
}
