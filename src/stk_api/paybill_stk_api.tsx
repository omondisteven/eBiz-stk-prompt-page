// src/stk_api/paybill_stk_api.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { phone, amount, accountnumber } = req.body;

      if (!phone || !amount || !accountnumber) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const consumerKey = process.env.MPESA_CONSUMER_KEY; // Store in environment variables
      const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
      const BusinessShortCode = process.env.MPESA_BUSINESS_SHORTCODE;
      const Passkey = process.env.MPESA_PASSKEY;
      const CallBackURL = process.env.MPESA_CALLBACK_URL; // Your callback URL

      if (!consumerKey || !consumerSecret || !BusinessShortCode || !Passkey || !CallBackURL) {
        console.error("Missing M-Pesa configuration");
        return res.status(500).json({ message: "M-Pesa configuration error" });
      }


      const Timestamp = new Date().toISOString().replace(/[-T:]/g, '').slice(0, 14);
      const Password = Buffer.from(BusinessShortCode + Passkey + Timestamp).toString('base64');

      const accessTokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json; charset=utf8',
          Authorization: 'Basic ' + Buffer.from(consumerKey + ':' + consumerSecret).toString('base64'),
        },
      });

      if (!accessTokenResponse.ok) {
        const errorData = await accessTokenResponse.json();
        console.error("Access token error:", errorData);
        return res.status(accessTokenResponse.status).json({ message: "Failed to get access token" });
      }

      const accessTokenData = await accessTokenResponse.json();
      const accessToken = accessTokenData.access_token;

      const stkPushResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken,
        },
        body: JSON.stringify({
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
        }),
      });

      if (!stkPushResponse.ok) {
        const errorData = await stkPushResponse.json();
        console.error("STK push error:", errorData);
        return res.status(stkPushResponse.status).json({ message: "Failed to initiate payment" });
      }

      const stkPushData = await stkPushResponse.json();
      res.status(200).json(stkPushData);

    } catch (error) {
      console.error("Error initiating payment:", error);
      res.status(500).json({ message: "An error occurred" });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}