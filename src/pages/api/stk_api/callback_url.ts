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
  ResultCode: number;
  ResultDesc: string;
  CallbackMetadata?: {
    Item: CallbackMetadataItem[];
  };
  CheckoutRequestID?: string;
};

const tmpDir = path.join('/tmp', 'logs');
const statusPath = path.join(tmpDir, 'payment_statuses.json');
const callbackLogPath = path.join(tmpDir, 'mpesa_callbacks.log');

if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const callbackId = `cb_${Date.now()}`;
  console.log(`[${callbackId}] Callback received`);

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

    // Initialize statuses object first
    let statuses: Record<string, PaymentStatus> = {};
    if (fs.existsSync(statusPath)) {
      try {
        statuses = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
      } catch (e) {
        console.error(`[${callbackId}] Error reading status file`, e);
      }
    }

    let status: PaymentStatus['status'];
    let details: PaymentStatus['details'];

    if (ResultCode === 0) {
      status = 'Success';
      details = CallbackMetadata?.Item || 'No transaction details';
      
      // Update statuses immediately
      statuses[CheckoutRequestID] = {
        timestamp: new Date().toISOString(),
        status,
        details
      };
      
      // Write the updated statuses immediately
      fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));
      console.log(`[${callbackId}] Success status written immediately`);
    } else if (ResultCode === 1032) {
      status = 'Cancelled';
      details = 'User cancelled the payment';
    } else {
      status = 'Failed';
      details = ResultDesc;
    }

    // For non-success cases, update statuses after determining status
    if (ResultCode !== 0) {
      statuses[CheckoutRequestID] = {
        timestamp: new Date().toISOString(),
        status,
        details
      };
      fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));
    }

    fs.appendFileSync(callbackLogPath, 
      `${new Date().toISOString()} - ${CheckoutRequestID} - ${status}\n${JSON.stringify(callbackData, null, 2)}\n\n`
    );

    console.log(`[${callbackId}] Status for ${CheckoutRequestID} set to ${status}`);
    
  } catch (error) {
    console.error(`[${callbackId}] Callback processing error:`, error);
    fs.appendFileSync(callbackLogPath, 
      `${new Date().toISOString()} - ERROR\n${error instanceof Error ? error.stack : String(error)}\n\n`
    );
  }
}
