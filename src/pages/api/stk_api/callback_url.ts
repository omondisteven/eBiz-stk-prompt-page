// /src/pages/api/stk_api/callback_url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
};

type PaymentStatus = {
  timestamp: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Cancelled';
  details: CallbackMetadataItem[] | string;
};

type CallbackData = {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: CallbackMetadataItem[];
      };
    };
  };
};

const tmpDir = path.join('/tmp', 'logs');
const statusPath = path.join(tmpDir, 'payment_statuses.json');
const callbackLogPath = path.join(tmpDir, 'mpesa_callbacks.log');

if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const callback: CallbackData = req.body;
  const stkCallback = callback.Body.stkCallback;
  const checkoutId = stkCallback.CheckoutRequestID;

  let status: PaymentStatus;

  switch (stkCallback.ResultCode) {
    case 0:
      status = {
        timestamp: new Date().toISOString(),
        status: 'Success',
        details: stkCallback.CallbackMetadata?.Item || [],
      };
      break;
    case 1032:
      status = {
        timestamp: new Date().toISOString(),
        status: 'Cancelled',
        details: stkCallback.ResultDesc,
      };
      break;
    default:
      status = {
        timestamp: new Date().toISOString(),
        status: 'Failed',
        details: stkCallback.ResultDesc,
      };
      break;
  }

  // Save status to file
  let statuses: Record<string, PaymentStatus> = {};
  if (fs.existsSync(statusPath)) {
    const file = fs.readFileSync(statusPath, 'utf-8');
    statuses = JSON.parse(file || '{}');
  }

  statuses[checkoutId] = status;
  fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));

  // Also log the full callback
  fs.appendFileSync(callbackLogPath, JSON.stringify(callback, null, 2) + '\n\n');

  res.status(200).json({ success: true });
}
