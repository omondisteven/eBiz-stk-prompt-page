import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import Cors from 'cors';

const cors = Cors({
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
});

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
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
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { checkoutRequestID } = req.body;

    if (!checkoutRequestID) {
      return res.status(400).json({ message: 'Missing checkoutRequestID' });
    }

    const consumerKey = 'JOugZC2lkqSZhy8eLeQMx8S0UbOXZ5A8Yzz26fCx9cyU1vqH';
    const consumerSecret = 'fqyZyrdW3QE3pDozsAcWNkVjwDADAL1dFMF3T9v65gJq8XZeyEeaTqBRXbC5RIvC';
    const BusinessShortCode = '174379';
    const Passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const Timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const Password = Buffer.from(`${BusinessShortCode}${Passkey}${Timestamp}`).toString('base64');

    // Get access token
    const authResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
        },
      }
    );

    const access_token = authResponse.data.access_token;

    // Query payment status
    const queryResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        BusinessShortCode: BusinessShortCode,
        Password: Password,
        Timestamp: Timestamp,
        CheckoutRequestID: checkoutRequestID,
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(200).json(queryResponse.data);
  } catch (error) {
    console.error('Error in STK Query:', error);
    return res.status(500).json({ 
      message: 'Internal Server Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}