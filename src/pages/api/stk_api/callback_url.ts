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
  [checkoutId: string]: PaymentStatus;
};

type CallbackData = {
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item: CallbackMetadataItem[];
  };
  CheckoutRequestID?: string;
};

const tmpDir = path.join('/tmp', 'logs'); // works both locally and on Vercel
const statusPath = path.join(tmpDir, 'payment_statuses.json');
const callbackLogPath = path.join(tmpDir, 'mpesa_callbacks.log');

// Ensure log directory exists
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const callbackId = `cb_${Date.now()}`;
  console.log(`[${callbackId}] Callback received`);
  
  // Immediate response
  res.status(200).json({ ResultCode: 0, ResultDesc: "Callback received successfully" });

  try {
    const callbackData: CallbackData = req.body?.Body?.stkCallback || req.body?.stkCallback;
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

    // Process status based on MPESA documentation
    let status: PaymentStatus['status'];
    let details: PaymentStatus['details'];
    
    if (ResultCode === 0) {
      status = 'Success';
      details = CallbackMetadata?.Item || 'No transaction details';
      console.log(`[${callbackId}] Payment success:`, details);
    } else if (ResultCode === 1032) {
      status = 'Cancelled';
      details = 'User cancelled the payment';
      console.log(`[${callbackId}] Payment cancelled by user`);
    } else {
      status = 'Failed';
      details = ResultDesc;
      console.log(`[${callbackId}] Payment failed:`, ResultDesc);
    }

    // Update status
    const statusUpdate: PaymentStatus = {
      timestamp: new Date().toISOString(),
      status,
      details
    };

    // Log the callback for debugging
    fs.appendFileSync(callbackLogPath, 
      `${new Date().toISOString()} - ${CheckoutRequestID} - ${status}\n${JSON.stringify(callbackData, null, 2)}\n\n`
    );

    let statuses: PaymentStatuses = {};
    if (fs.existsSync(statusPath)) {
      try {
        statuses = JSON.parse(fs.readFileSync(statusPath, 'utf-8')) as PaymentStatuses;
      } catch (e) {
        console.error(`[${callbackId}] Error parsing status file:`, e);
      }
    }
    
    statuses[CheckoutRequestID] = statusUpdate;
    fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));
    console.log(`[${callbackId}] Status updated successfully`);

  } catch (error) {
    console.error(`[${callbackId}] Callback processing error:`, error);
    fs.appendFileSync(callbackLogPath, 
      `${new Date().toISOString()} - ERROR\n${error instanceof Error ? error.stack : String(error)}\n\n`
    );
  }
}