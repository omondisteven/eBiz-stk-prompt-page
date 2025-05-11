// /src/pages/api/stk_api/paybill_stk_api.ts
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import Cors from 'cors';
import  db  from '@/lib/db';

// Initialize the CORS middleware
const cors = Cors({
  origin: '*',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
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

  if (req.method === 'POST') {
    try {
      const { phone, amount, accountnumber } = req.body;

      // Insert transaction into database
      const stmt = db.prepare(
        'INSERT INTO transactions (phone, account, amount, transaction_type) VALUES (?, ?, ?, ?)'
      );
      stmt.run(phone, accountnumber, amount, 'PayBill');
      stmt.finalize();

      // Rest of your STK push implementation...
      const consumerKey = 'JOugZC2lkqSZhy8eLeQMx8S0UbOXZ5A8Yzz26fCx9cyU1vqH';
      const consumerSecret = 'fqyZyrdW3QE3pDozsAcWNkVjwDADAL1dFMF3T9v65gJq8XZeyEeaTqBRXbC5RIvC';
      const BusinessShortCode = '174379';
      const Passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
      const Timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const Password = Buffer.from(`${BusinessShortCode}${Passkey}${Timestamp}`).toString('base64');

      const access_token_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
      const initiate_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
      const CallBackURL = 'https://yourdomain.com/api/stk_api/callback_url';

      const authResponse = await axios.get(access_token_url, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
        },
      });

      const access_token = authResponse.data.access_token;

      const stkResponse = await axios.post(initiate_url, {
        BusinessShortCode,
        Password,
        Timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: BusinessShortCode,
        PhoneNumber: phone,
        CallBackURL,
        AccountReference: accountnumber,
        TransactionDesc: 'Bill Payment',
      }, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      // Update transaction with checkout request ID
      const checkoutRequestId = stkResponse.data.CheckoutRequestID;
      db.run(
        'UPDATE transactions SET checkout_request_id = ? WHERE phone = ? AND account = ? AND status = "Pending"',
        [checkoutRequestId, phone, accountnumber]
      );

      res.status(200).json(stkResponse.data);
    } catch (error) {
      console.error("Error in STK Push:", error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}