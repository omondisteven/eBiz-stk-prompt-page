// /src/pages/api/stk_api/callback_url.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
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

type PaymentStatus = {
  timestamp: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Cancelled';
  details: CallbackMetadataItem[] | string;
};

const tmpDir = path.join(process.cwd(), 'tmp');
const statusPath = path.join(tmpDir, 'payment_statuses.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const data = req.body as CallbackData;
  const callback = data?.Body?.stkCallback;
  if (!callback?.CheckoutRequestID) return res.status(400).json({ error: 'Missing CheckoutRequestID' });

  const checkoutId = callback.CheckoutRequestID;
  const resultCode = callback.ResultCode;
  const status: PaymentStatus = {
    timestamp: new Date().toISOString(),
    status: 'Pending',
    details: 'No details'
  };

  if (resultCode === 0) {
    status.status = 'Success';
    status.details = callback.CallbackMetadata?.Item || 'No metadata';
  } else if (resultCode === 1032) {
    status.status = 'Cancelled';
    status.details = callback.ResultDesc;
  } else {
    status.status = 'Failed';
    status.details = callback.ResultDesc;
  }

  // Ensure tmp dir exists
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  // Read existing statuses
  let statuses: Record<string, PaymentStatus> = {};
  if (fs.existsSync(statusPath)) {
    const raw = fs.readFileSync(statusPath, 'utf8');
    try {
      statuses = JSON.parse(raw);
    } catch {
      statuses = {};
    }
  }

  // Update status
  statuses[checkoutId] = status;
  fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));

  return res.status(200).json({ message: 'Callback processed successfully' });
}
