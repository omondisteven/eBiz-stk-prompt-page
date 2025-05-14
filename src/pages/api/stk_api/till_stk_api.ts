// src/pages/api/stk_api/till_stk_api.ts
import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { phone, amount, accountnumber } = req.body; // accountnumber is actually the TILL number here

      const consumerKey = 'JOugZC2lkqSZhy8eLeQMx8S0UbOXZ5A8Yzz26fCx9cyU1vqH';
      const consumerSecret = 'fqyZyrdW3QE3pDozsAcWNkVjwDADAL1dFMF3T9v65gJq8XZeyEeaTqBRXbC5RIvC';
      const Passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
      const BusinessShortCode = '174379'; // This is not used in PartyB for till
      const Timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const Password = Buffer.from(`${BusinessShortCode}${Passkey}${Timestamp}`).toString('base64');

      const access_token_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
      const initiate_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
      const CallBackURL = 'https://e-biz-stk-prompt-page.vercel.app/api/stk_api/callback_url';

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
        TransactionType: 'CustomerBuyGoodsOnline', // 💡 Important!
        Amount: amount,
        PartyA: phone,
        PartyB: accountnumber, // 💡 This must be the Till Number
        PhoneNumber: phone,
        CallBackURL,
        AccountReference: accountnumber,
        TransactionDesc: 'Buy Goods Till Payment',
      }, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
      });

      res.status(200).json(stkResponse.data);
    } catch (error: any) {
      console.error('Error in BuyGoods STK Push:', error?.response?.data || error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error?.response?.data || error.message });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
