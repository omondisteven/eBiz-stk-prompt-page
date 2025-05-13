// pages/api/stk_api/callback_url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Define types for the callback data structure
type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
};

type PaymentStatus = {
  timestamp: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Cancelled';
  details: CallbackMetadataItem[] | string;
};

type PaymentStatuses = {
  [checkoutId: string]: PaymentStatus; // Explicit string index signature
};

type CallbackData = {
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item: CallbackMetadataItem[];
  };
  CheckoutRequestID?: string;
};

const logDir = path.join(process.cwd(), 'logs');
const statusPath = path.join(logDir, 'payment_statuses.json');
const callbackLogPath = path.join(logDir, 'mpesa_callbacks.log');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Immediate response to M-Pesa
  res.status(200).json({ ResultCode: 0, ResultDesc: "Callback received" });

  // Async processing
  try {
    const timestamp = new Date().toISOString();
    const rawBody = JSON.stringify(req.body, null, 2);
    
    // Log raw callback
    fs.appendFileSync(callbackLogPath, `\n==== ${timestamp} ====\n${rawBody}\n`);

    const callbackData: CallbackData = req.body?.Body?.stkCallback;
    if (!callbackData) {
      fs.appendFileSync(callbackLogPath, `ERROR: Invalid callback format\n`);
      return;
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = callbackData;
    
    if (!CheckoutRequestID) {
      fs.appendFileSync(callbackLogPath, `ERROR: Missing CheckoutRequestID\n`);
      return;
    }

    // Process status
    let status: PaymentStatus['status'];
    let details: PaymentStatus['details'];
    
    if (ResultCode === 0) {
      status = 'Success';
      details = CallbackMetadata?.Item || 'No transaction details';
      fs.appendFileSync(callbackLogPath, `SUCCESS: ${CheckoutRequestID}\n`);
    } else {
      status = /cancel/i.test(ResultDesc) ? 'Cancelled' : 'Failed';
      details = ResultDesc;
      fs.appendFileSync(callbackLogPath, `FAILURE: ${ResultCode} - ${ResultDesc}\n`);
    }

    // Update status file
    const statusUpdate: PaymentStatus = {
      timestamp,
      status,
      details
    };

    // Initialize with proper type
    let statuses: PaymentStatuses = {};
    if (fs.existsSync(statusPath)) {
      try {
        statuses = JSON.parse(fs.readFileSync(statusPath, 'utf-8')) as PaymentStatuses;
      } catch (e) {
        console.error('Error parsing status file:', e);
        statuses = {};
      }
    }
    
    // Now TypeScript knows statuses can be indexed with string
    statuses[CheckoutRequestID] = statusUpdate;
    fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    fs.appendFileSync(callbackLogPath, `EXCEPTION: ${errorMsg}\n`);
  }
}