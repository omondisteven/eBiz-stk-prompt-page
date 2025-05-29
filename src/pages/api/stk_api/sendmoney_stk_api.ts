// src/pages/api/stk_api/sendMoney_stk_api.ts
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { phone, amount, accountnumber, businessShortCode } = req.body; // Destructure businessShortCode
    const consumerKey = 'JOugZC2lkqSZhy8eLeQMx8S0UbOXZ5A8Yzz26fCx9cyU1vqH';
    const consumerSecret = 'fqyZyrdW3QE3pDozsAcWNkVjwDADAL1dFMF3T9v65gJq8XZeyEeaTqBRXbC5RIvC';
    // For SendMoney, BusinessShortCode is often the standard Safaricom shortcode for person-to-person
    // or a specific business shortcode if the QR data implies a business initiating.
    // Assuming '174379' for sandbox by default, but allowing override.
    const BusinessShortCode = businessShortCode || '174379'; // Use dynamic, or fallback
    const Passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const Timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const Password = Buffer.from(`${BusinessShortCode}${Passkey}${Timestamp}`).toString('base64');

    const access_token_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    const initiate_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    const CallBackURL = 'https://e-biz-stk-prompt-page.vercel.app/api/stk_api/callback_url';

    try {
      // Get access token
      const authResponse = await axios.get(access_token_url, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
        },
      });
      const access_token = authResponse.data.access_token;

      // Initiate STK push
      const stkResponse = await axios.post(initiate_url, {
        BusinessShortCode, // Use the dynamic BusinessShortCode
        Password,
        Timestamp,
        TransactionType: 'CustomerPayBillOnline', // 'CustomerPayBillOnline' is generally used for C2B, even for "Send Money" to another phone number via PayBill. For true C2C (B2C API), the API call would be different.
        Amount: amount,
        PartyA: phone,
        PartyB: BusinessShortCode, // PartyB should be the BusinessShortCode
        PhoneNumber: phone,
        CallBackURL,
        AccountReference: accountnumber, // The recipient's phone number
        TransactionDesc: 'Send Money',
      }, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });
      res.status(200).json(stkResponse.data);
    } catch (error: any) {
      console.error('SendMoney STK Error:', error?.response?.data || error.message || error);
      res.status(500).json({ message: error?.response?.data?.errorMessage || 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}