// src/pages/api/stk_api/callback_url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'tmp', 'paymentStatuses.json');

// Initialize storage file if it doesn't exist
if (!fs.existsSync(path.dirname(storagePath))) {
  fs.mkdirSync(path.dirname(storagePath), { recursive: true });
}
if (!fs.existsSync(storagePath)) {
  fs.writeFileSync(storagePath, '{}');
}

function readStatuses() {
  try {
    return JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function writeStatuses(statuses: Record<string, string>) {
  fs.writeFileSync(storagePath, JSON.stringify(statuses, null, 2));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const mpesaResponse = req.body;
    const logFilePath = path.join(process.cwd(), 'M_PESAConfirmationResponse.txt');
    fs.appendFileSync(logFilePath, JSON.stringify(mpesaResponse) + '\n');

    const resultCode = mpesaResponse.Body?.stkCallback?.ResultCode;
    const phone = mpesaResponse.Body?.stkCallback?.CallbackMetadata?.Item?.find(
      (item: any) => item.Name === "PhoneNumber"
    )?.Value;
    const account = mpesaResponse.Body?.stkCallback?.CallbackMetadata?.Item?.find(
      (item: any) => item.Name === "AccountReference"
    )?.Value;

    if (phone && account) {
      const statuses = readStatuses();
      const key = `${phone}-${account}`;
      
      if (resultCode === 0) {
        statuses[key] = "Success";
      } else {
        const resultDesc = mpesaResponse.Body?.stkCallback?.ResultDesc || '';
        statuses[key] = resultDesc.includes("cancelled") ? "Cancelled" : "Failed";
      }
      
      writeStatuses(statuses);
    }

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Confirmation Received Successfully",
    });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}