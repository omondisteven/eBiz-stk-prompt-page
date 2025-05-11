// src/pages/api/stk_api/callback_url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Temporary storage for payment statuses
const paymentStatuses: Record<string, string> = {};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const mpesaResponse = req.body;

    // Log the response to a file
    const logFilePath = path.join(process.cwd(), 'M_PESAConfirmationResponse.txt');
    fs.appendFileSync(logFilePath, JSON.stringify(mpesaResponse) + '\n');

    // Extract relevant information from the callback
    const resultCode = mpesaResponse.Body?.stkCallback?.ResultCode;
    const phone = mpesaResponse.Body?.stkCallback?.CallbackMetadata?.Item.find(
      (item: any) => item.Name === "PhoneNumber"
    )?.Value;
    const account = mpesaResponse.Body?.stkCallback?.CallbackMetadata?.Item.find(
      (item: any) => item.Name === "AccountReference"
    )?.Value;

    if (phone && account) {
      const key = `${phone}-${account}`;
      
      if (resultCode === 0) {
        paymentStatuses[key] = "Success";
      } else {
        paymentStatuses[key] = mpesaResponse.Body?.stkCallback?.ResultDesc?.includes("cancelled") 
          ? "Cancelled" 
          : "Failed";
      }
    }

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Confirmation Received Successfully",
    });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}