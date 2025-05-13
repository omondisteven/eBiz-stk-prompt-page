// pages/api/stk_api/paybill_stk_api.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const logDir = path.join(process.cwd(), 'logs');
const statusPath = path.join(logDir, 'payment_statuses.json');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const shortcode = process.env.MPESA_SHORTCODE!;
const passkey = process.env.MPESA_PASSKEY!;
const consumerKey = process.env.MPESA_CONSUMER_KEY!;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/stk_api/callback_url`;

async function getAccessToken(): Promise<string> {
  const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

  const res = await axios.get(url, {
    headers: {
      Authorization: `Basic ${credentials}`
    }
  });

  return res.data.access_token;
}

function generatePassword(timestamp: string): string {
  const raw = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString('base64');
}

function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
}

function storeInitialStatus(checkoutId: string) {
  let statuses = {};
  if (fs.existsSync(statusPath)) {
    statuses = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
  }
  (statuses as any)[checkoutId] = 'Pending';
  fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { phone, accountnumber, amount } = req.body;

    if (!phone || !accountnumber || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const timestamp = getTimestamp();
    const password = generatePassword(timestamp);
    const accessToken = await getAccessToken();

    const payload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: accountnumber,
      TransactionDesc: "Payment"
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    const checkoutId = response.data.CheckoutRequestID;
    storeInitialStatus(checkoutId);

    return res.status(200).json({
      message: "STK Push initiated",
      CheckoutRequestID: checkoutId,
      CustomerMessage: response.data.CustomerMessage,
      MerchantRequestID: response.data.MerchantRequestID
    });
  } catch (error: any) {
    console.error('STK Push error:', error.response?.data || error.message);
    return res.status(500).json({
      message: 'Failed to initiate STK Push',
      details: error.response?.data || error.message
    });
  }
}
