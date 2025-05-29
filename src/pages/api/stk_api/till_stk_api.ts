// Till_stk_api.tsx
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import Cors from 'cors';

// Initialize the CORS middleware
const cors = Cors({
  origin: '*', // Allow all origins (for testing)
  methods: ['POST', 'OPTIONS'], // Allowed methods
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
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // Allow POST and OPTIONS
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow Content-Type header


    console.log("Handler started"); //debugging
  await runMiddleware(req, res, cors);
    console.log("Middleware finished"); //debugging

  if (req.method === 'OPTIONS') {
    console.log("Options request received"); //debugging
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { phone, amount, accountnumber } = req.body;

      console.log("Payment details:", { phone, amount, accountnumber });

      const consumerKey = 'JOugZC2lkqSZhy8eLeQMx8S0UbOXZ5A8Yzz26fCx9cyU1vqH';
      const consumerSecret = 'fqyZyrdW3QE3pDozsAcWNkVjwDADAL1dFMF3T9v65gJq8XZeyEeaTqBRXbC5RIvC';
      const BusinessShortCode = '174379';
      const Passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
      const Timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const Password = Buffer.from(`${BusinessShortCode}${Passkey}${Timestamp}`).toString('base64');

      const access_token_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
      const initiate_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
      const CallBackURL = 'https://e-biz-stk-prompt-page.vercel.app/api/stk_api/callback_url';
      
      console.log('Using callback URL:', CallBackURL);

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
        TransactionType: 'CustomerBuyGoodsOnline',
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

      res.status(200).json(stkResponse.data);
    } catch (error) {
      console.error("Error in STK Push:", error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
   } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  } 

}