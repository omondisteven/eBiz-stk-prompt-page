// src/pages/api/stk_api/callback_url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { setPaymentStatus } from '@/utils/paymentStatusStore'; // adjust import as needed

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const mpesaResponse = req.body;

    // Extract identifiers
    const phone = mpesaResponse?.Body?.stkCallback?.CallbackMetadata?.Item?.find((item: any) => item.Name === "PhoneNumber")?.Value;
    const account = mpesaResponse?.Body?.stkCallback?.MerchantRequestID || "unknown";

    // Determine result status
    const resultCode = mpesaResponse?.Body?.stkCallback?.ResultCode;

    const key = `${phone}-${account}`;
    if (resultCode === 0) {
      setPaymentStatus(key, "Success");
    } else if (resultCode === 1032) {
      setPaymentStatus(key, "Cancelled");
    } else {
      setPaymentStatus(key, "Failed");
    }

    // Log for debugging
    const logFilePath = path.join(process.cwd(), 'M_PESAConfirmationResponse.txt');
    fs.appendFileSync(logFilePath, JSON.stringify(mpesaResponse) + '\n');

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Confirmation Received Successfully",
    });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
