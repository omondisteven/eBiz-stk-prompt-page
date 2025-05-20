// src/pages/api/stk_api/callback_url.ts
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
      CallbackMetadata?: {
        Item: CallbackMetadataItem[];
      };
      ResultDesc: string;
    };
  };
};

const tmpDir = path.join(process.cwd(), 'tmp', 'logs');
const statusPath = path.join(tmpDir, 'payment_statuses.json');
const callbackLogPath = path.join(tmpDir, 'mpesa_callbacks.log');

// Ensure tmp directory exists
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Always respond quickly to M-Pesa first
  res.status(200).json({ ResultCode: 0, ResultDesc: "Callback received successfully" });

  try {
    const data: CallbackData = req.body;

    if (!data.Body.stkCallback.CallbackMetadata) {
      console.log(data.Body.stkCallback.ResultDesc);
      return;
    }

    const body = data.Body.stkCallback.CallbackMetadata;

    const amountObj = body.Item.find((obj: any) => obj.Name === "Amount");
    const codeObj = body.Item.find((obj: any) => obj.Name === "MpesaReceiptNumber");
    const phoneNumberObj = body.Item.find((obj: any) => obj.Name === "PhoneNumber");

    const amount = amountObj?.Value;
    const mpesaCode = codeObj?.Value;
    const phoneNumber = phoneNumberObj?.Value?.toString();

    // Initialize statuses
    let statuses: Record<string, any> = {};
    if (fs.existsSync(statusPath)) {
      statuses = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    }

    // Update status with successful payment details
    statuses[req.body.Body.stkCallback.CheckoutRequestID] = {
      timestamp: new Date().toISOString(),
      status: 'Success',
      details: body.Item
    };

    // Write statuses
    fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));

    // Log callback
    fs.appendFileSync(callbackLogPath, 
      `${new Date().toISOString()} - ${req.body.Body.stkCallback.CheckoutRequestID}\n` +
      `${JSON.stringify(req.body, null, 2)}\n\n`
    );

    console.log('Payment successful:', { amount, mpesaCode, phoneNumber });

  } catch (error) {
    console.error('Callback processing error:', error);
    if (fs.existsSync(callbackLogPath)) {
      fs.appendFileSync(callbackLogPath, 
        `${new Date().toISOString()} - ERROR\n` +
        `${error instanceof Error ? error.stack : String(error)}\n\n`
      );
    }
  }
}