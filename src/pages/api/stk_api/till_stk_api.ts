import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { phone, amount, accountnumber } = req.body; // accountnumber should contain the TILL number

      const consumerKey = 'JOugZC2lkqSZhy8eLeQMx8S0UbOXZ5A8Yzz26fCx9cyU1vqH';
      const consumerSecret = 'fqyZyrdW3QE3pDozsAcWNkVjwDADAL1dFMF3T9v65gJq8XZeyEeaTqBRXbC5RIvC';
      const Passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
      
      // For sandbox till payments, use 600xxx as the BusinessShortCode
      const BusinessShortCode = '600000'; // Sandbox till number
      const TillNumber = accountnumber || '600000'; // Use provided till number or fallback to sandbox default
      
      const Timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const Password = Buffer.from(`${BusinessShortCode}${Passkey}${Timestamp}`).toString('base64');

      const access_token_url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
      const initiate_url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
      const CallBackURL = 'https://e-biz-stk-prompt-page.vercel.app/api/stk_api/callback_url';

      // Get access token
      const authResponse = await axios.get(access_token_url, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
        },
      });

      const access_token = authResponse.data.access_token;

      // Initiate STK push for till payment
      const stkResponse = await axios.post(initiate_url, {
        BusinessShortCode: BusinessShortCode,
        Password,
        Timestamp,
        TransactionType: 'CustomerBuyGoodsOnline',
        Amount: amount,
        PartyA: phone,
        PartyB: TillNumber, // This MUST be the till number
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

      console.log('STK Push initiated successfully:', stkResponse.data);
      res.status(200).json(stkResponse.data);
    } catch (error: any) {
      console.error('Error in BuyGoods STK Push:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      res.status(500).json({ 
        message: 'STK Push Failed',
        error: error.response?.data || error.message 
      });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}