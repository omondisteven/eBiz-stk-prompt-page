// src/pages/api/stk_api/callback_url.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

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

const tmpDir = path.join(process.cwd(), 'tmp', 'logs');
const statusPath = path.join(tmpDir, 'payment_statuses.json');
const callbackLogPath = path.join(tmpDir, 'mpesa_callbacks.log');

// Ensure tmp directory exists
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const callbackId = `cb_${Date.now()}`;
  console.log(`[${callbackId}] Callback received`);

  // Always respond quickly to M-Pesa
  res.status(200).json({ ResultCode: 0, ResultDesc: "Callback received successfully" });

  try {
    const callbackData: CallbackData = req.body;
    const stkCallback = callbackData.Body?.stkCallback || callbackData.stkCallback;
    
    if (!stkCallback?.CheckoutRequestID) {
      console.error(`[${callbackId}] Missing CheckoutRequestID`);
      return;
    }

    const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = stkCallback;
    console.log(`[${callbackId}] Callback data:`, {
      ResultCode,
      ResultDesc,
      CheckoutRequestID,
      HasMetadata: !!CallbackMetadata
    });

    // Initialize statuses
    let statuses: Record<string, PaymentStatus> = {};
    if (fs.existsSync(statusPath)) {
      try {
        statuses = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
      } catch (e) {
        console.error(`[${callbackId}] Error reading status file`, e);
      }
    }

    // Determine status
    let status: PaymentStatus['status'];
    let details: PaymentStatus['details'];

    if (ResultCode === 0) {
      status = 'Success';
      details = CallbackMetadata?.Item || 'No transaction details';
    } else if (ResultCode === 1032) {
      status = 'Cancelled';
      details = ResultDesc;
    } else {
      status = 'Failed';
      details = ResultDesc;
    }

    // Update statuses
    statuses[CheckoutRequestID] = {
      timestamp: new Date().toISOString(),
      status,
      details
    };

    // Write statuses
    fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));
    
    // Log callback
    fs.appendFileSync(callbackLogPath, 
      `${new Date().toISOString()} - ${CheckoutRequestID} - ${status}\n` +
      `${JSON.stringify(stkCallback, null, 2)}\n\n`
    );

    console.log(`[${callbackId}] Status for ${CheckoutRequestID} set to ${status}`);

  } catch (error) {
    console.error(`[${callbackId}] Callback processing error:`, error);
    if (fs.existsSync(callbackLogPath)) {
      fs.appendFileSync(callbackLogPath, 
        `${new Date().toISOString()} - ERROR\n` +
        `${error instanceof Error ? error.stack : String(error)}\n\n`
      );
    }
  }
}