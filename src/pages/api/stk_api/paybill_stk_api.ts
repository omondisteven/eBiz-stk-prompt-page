// /src/pages/api/stk_api/paybill_stk_api.ts
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import db from '@/lib/db';
import Cors from 'cors';

// Initialize CORS middleware
const cors = Cors({
  methods: ['POST', 'OPTIONS'],
  origin: process.env.NODE_ENV === 'development' ? '*' : process.env.DOMAIN,
});

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, cors);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { phone, amount, accountnumber } = req.body;

    // Validate input
    if (!phone || !amount || !accountnumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create transaction record
    const tx = db.prepare(`
      INSERT INTO transactions 
      (phone, account, amount, transaction_type) 
      VALUES (?, ?, ?, ?)
    `).run(phone, accountnumber, amount, 'PayBill');

    // M-Pesa API credentials
    const credentials = {
      consumerKey: process.env.MPESA_CONSUMER_KEY || 'your_consumer_key',
      consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'your_consumer_secret',
      businessShortCode: process.env.MPESA_BUSINESS_SHORTCODE || '174379',
      passkey: process.env.MPESA_PASSKEY || 'your_passkey',
    };

    // Generate access token
    const authResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64')}`,
        },
      }
    );

    const accessToken = authResponse.data.access_token;
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, '')
      .slice(0, -3);
    const password = Buffer.from(
      `${credentials.businessShortCode}${credentials.passkey}${timestamp}`
    ).toString('base64');

    // Prepare STK push payload
    const stkPayload = {
      BusinessShortCode: credentials.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phone,
      PartyB: credentials.businessShortCode,
      PhoneNumber: phone,
      CallBackURL: `${process.env.BASE_URL}/api/stk_api/callback_url`,
      AccountReference: accountnumber,
      TransactionDesc: 'Payment via M-Poster',
    };

    // Initiate STK push
    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Update transaction with checkout request ID
    db.prepare(`
      UPDATE transactions 
      SET checkout_request_id = ? 
      WHERE id = ?
    `).run(stkResponse.data.CheckoutRequestID, tx.lastInsertRowid);

    return res.status(200).json({
      success: true,
      message: 'STK push initiated successfully',
      data: stkResponse.data,
    });
  } catch (error: any) {
    console.error('STK Push Error:', error);

    // Update transaction status if it was created
    if (error.config?.data) {
      try {
        const { phone } = JSON.parse(error.config.data);
        db.prepare(`
          UPDATE transactions 
          SET status = 'Failed' 
          WHERE phone = ? AND status = 'Pending'
        `).run(phone);
      } catch (dbError) {
        console.error('Failed to update transaction status:', dbError);
      }
    }

    const errorMessage = error.response?.data?.errorMessage || 
                        error.message || 
                        'Failed to initiate payment';

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
}