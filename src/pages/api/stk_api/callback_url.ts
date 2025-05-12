// src/pages/api/stk_api/callback_url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Store payment status persistently (you can later replace this with SQLite, Redis, etc.)
const paymentStatuses: Record<string, string> = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const mpesaResponse = req.body;

    // Log the full response
    const logFilePath = path.join(process.cwd(), 'M_PESAConfirmationResponse.txt');
    fs.appendFileSync(logFilePath, JSON.stringify(mpesaResponse) + '\n');

    const callback = mpesaResponse.Body?.stkCallback;
    const resultCode = callback?.ResultCode;
    const phone = callback?.CallbackMetadata?.Item?.find((item: any) => item.Name === 'PhoneNumber')?.Value;
    const account = callback?.MerchantRequestID || 'unknown';

    if (phone) {
      if (resultCode === 0) {
        paymentStatuses[`${phone}_${account}`] = 'Success';
      } else if (resultCode === 1032) {
        paymentStatuses[`${phone}_${account}`] = 'Cancelled'; // User dismissed prompt
      } else {
        paymentStatuses[`${phone}_${account}`] = 'Failed'; // Other failure
      }
    }

    res.status(200).json({ message: 'Callback received' });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

// Expose status for polling (optional: move to separate /check_payment_status route file)
export const getPaymentStatus = (phone: string, account: string): string => {
  return paymentStatuses[`${phone}_${account}`] || 'Pending';
};
