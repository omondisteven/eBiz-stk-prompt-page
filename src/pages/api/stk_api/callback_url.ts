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
  const callbackId = `cb_${Date.now()}`;
  console.log(`[${callbackId}] Callback received`);
  
  // Immediate response
  res.status(200).json({ ResultCode: 0, ResultDesc: "Callback received" });

  try {
    console.log(`[${callbackId}] Headers:`, req.headers);
    console.log(`[${callbackId}] Raw body:`, req.body);

    const callbackData: CallbackData = req.body?.Body?.stkCallback;
    if (!callbackData) {
      console.error(`[${callbackId}] Invalid callback format`);
      return;
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = callbackData;
    console.log(`[${callbackId}] Callback data:`, {
      ResultCode,
      ResultDesc,
      CheckoutRequestID,
      HasMetadata: !!CallbackMetadata
    });

    if (!CheckoutRequestID) {
      console.error(`[${callbackId}] Missing CheckoutRequestID`);
      return;
    }

    // Process status
    let status: PaymentStatus['status'];
    let details: PaymentStatus['details'];
    
    if (ResultCode === 0) {
      status = 'Success';
      details = CallbackMetadata?.Item || 'No transaction details';
      console.log(`[${callbackId}] Payment success:`, details);
    } else {
      status = /cancel/i.test(ResultDesc) ? 'Cancelled' : 'Failed';
      details = ResultDesc;
      console.log(`[${callbackId}] Payment failed:`, ResultDesc);
    }

    // Update status
    const statusUpdate: PaymentStatus = {
      timestamp: new Date().toISOString(),
      status,
      details
    };

    console.log(`[${callbackId}] Writing status update:`, statusUpdate);
    
    let statuses: PaymentStatuses = {};
    if (fs.existsSync(statusPath)) {
      try {
        statuses = JSON.parse(fs.readFileSync(statusPath, 'utf-8')) as PaymentStatuses;
        console.log(`[${callbackId}] Loaded existing statuses`);
      } catch (e) {
        console.error(`[${callbackId}] Error parsing status file:`, e);
      }
    }
    
    statuses[CheckoutRequestID] = statusUpdate;
    fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));
    console.log(`[${callbackId}] Status updated successfully`);

  } catch (error) {
    console.error(`[${callbackId}] Callback processing error:`, error);
  }
}