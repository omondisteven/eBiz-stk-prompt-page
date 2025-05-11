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

// Helper to run middleware
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
  try {
    // Run CORS middleware
    await runMiddleware(req, res, cors);

    // Handle OPTIONS requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ 
        success: false,
        message: 'Method not allowed' 
      });
      return;
    }

    const { phone, amount, accountnumber } = req.body;

    // Validate required fields
    if (!phone?.trim() || !amount || !accountnumber?.trim()) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields (phone, amount, accountnumber)'
      });
      return;
    }

    // Validate amount is a number
    if (isNaN(Number(amount))) {
      res.status(400).json({
        success: false,
        message: 'Amount must be a valid number'
      });
      return;
    }

    // Create transaction record with 60s expiration
    const tx = db.prepare(`
      INSERT INTO transactions 
      (phone, account, amount, transaction_type, expires_at) 
      VALUES (?, ?, ?, ?, datetime('now', '+60 seconds'))
    `).run(phone.trim(), accountnumber.trim(), amount, 'PayBill');

    // Verify M-Pesa credentials
    const credentials = {
      consumerKey: process.env.MPESA_CONSUMER_KEY,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET,
      businessShortCode: process.env.MPESA_BUSINESS_SHORTCODE,
      passkey: process.env.MPESA_PASSKEY,
    };

    if (!credentials.consumerKey || !credentials.consumerSecret) {
      throw new Error('M-Pesa credentials not configured');
    }

    // Get access token with timeout
    const authResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64')}`,
        },
        timeout: 10000 // 10 second timeout
      }
    );

    if (!authResponse.data.access_token) {
      throw new Error('Failed to get access token');
    }

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

    // Initiate STK push with timeout
    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000 // 15 second timeout
      }
    );

    if (!stkResponse.data?.CheckoutRequestID) {
      throw new Error('Invalid response from M-Pesa API');
    }

    // Update transaction with checkout request ID
    db.prepare(`
      UPDATE transactions 
      SET checkout_request_id = ?, status = 'Pending'
      WHERE id = ?
    `).run(stkResponse.data.CheckoutRequestID, tx.lastInsertRowid);

    res.status(200).json({
      success: true,
      message: 'STK push initiated successfully',
      data: {
        CheckoutRequestID: stkResponse.data.CheckoutRequestID,
        phone: phone.trim(),
        account: accountnumber.trim(),
        amount: amount
      }
    });
    return;

  } catch (error: any) {
    console.error('STK Push Error:', error);
    
    // Update transaction status if it was created
    try {
      if (req.body?.phone) {
        db.prepare(`
          UPDATE transactions 
          SET status = 'Failed' 
          WHERE phone = ? AND status = 'Pending'
        `).run(req.body.phone.trim());
      }
    } catch (dbError) {
      console.error('Failed to update transaction status:', dbError);
    }

    // Determine appropriate error message
    let errorMessage = 'Failed to initiate payment';
    if (error.response) {
      errorMessage = error.response.data?.errorMessage || 
                    error.response.statusText ||
                    `Server responded with ${error.response.status}`;
    } else if (error.request) {
      errorMessage = 'No response received from payment service';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    return;
  }
}