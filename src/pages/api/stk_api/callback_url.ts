// src/pages/api/stk_api/callback_url.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

<<<<<<< HEAD
const tmpDir = path.join(process.cwd(), 'tmp', 'logs');
const statusFile = path.join(tmpDir, 'payment_statuses.json');
=======
type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
};

type CallbackData = {
  Body?: {
    stkCallback?: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: CallbackMetadataItem[];
      };
    };
  };
  stkCallback?: {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResultCode: number;
    ResultDesc: string;
    CallbackMetadata?: {
      Item: CallbackMetadataItem[];
    };
  };
};

type PaymentStatus = {
  timestamp: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Cancelled';
  details: CallbackMetadataItem[] | string;
};

const tmpDir = path.join('/tmp', 'logs');
const statusPath = path.join(tmpDir, 'payment_statuses.json');
const callbackLogPath = path.join(tmpDir, 'mpesa_callbacks.log');
>>>>>>> 491ed35e5c450424ebbef243c2eef485276ba248

if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ ResultCode: 0, ResultDesc: "Callback received successfully" });

  try {
    const stkCallback = req.body?.Body?.stkCallback || req.body?.stkCallback;

    if (!stkCallback?.CheckoutRequestID) return;

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback;

    const status =
      ResultCode === 0
        ? "Success"
        : ResultCode === 1032
        ? "Cancelled"
        : "Failed";

    const details = CallbackMetadata?.Item || ResultDesc;

    let statuses: Record<string, any> = {};
    if (fs.existsSync(statusFile)) {
      try {
        statuses = JSON.parse(fs.readFileSync(statusFile, 'utf-8'));
      } catch (e) {
        console.error("Error reading status file", e);
      }
    }

    statuses[CheckoutRequestID] = {
      timestamp: new Date().toISOString(),
      status,
      details
    };

    fs.writeFileSync(statusFile, JSON.stringify(statuses, null, 2));
  } catch (e) {
    console.error("Error processing callback:", e);
  }
}
