// pages/api/stk_api/callback_url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type TransactionDetails = {
  [key: string]: CallbackMetadataItem[] | undefined;
};

type PaymentStatuses = {
  [key: string]: string;
};

type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
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
const callbackLogPath = path.join(logDir, 'callbacks.log');
const transactionDetailsPath = path.join(logDir, 'transaction_details.json');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function logCallback(data: string) {
  fs.appendFileSync(callbackLogPath, `${new Date().toISOString()}: ${data}\n`);
}

function updateStatus(key: string, status: string, metadata?: CallbackMetadataItem[]) {
  let statuses: PaymentStatuses = {};
  try {
    if (fs.existsSync(statusPath)) {
      statuses = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    }
  } catch (e) {
    console.error('Error reading status file:', e);
  }

  statuses[key] = status;
  fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));
  
  // Store transaction details if available
  if (metadata) {
    let transactions: TransactionDetails = {};
    try {
      if (fs.existsSync(transactionDetailsPath)) {
        transactions = JSON.parse(fs.readFileSync(transactionDetailsPath, 'utf-8'));
      }
    } catch (e) {
      console.error('Error reading transaction details file:', e);
    }
    
    transactions[key] = metadata;
    fs.writeFileSync(transactionDetailsPath, JSON.stringify(transactions, null, 2));
  }

  logCallback(`Status updated: ${key} => ${status}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Callback received - Headers:', req.headers);
  console.log('Callback received - Body:', req.body);
  logCallback(`Incoming request headers: ${JSON.stringify(req.headers)}`);
  logCallback(`Incoming request body: ${JSON.stringify(req.body, null, 2)}`);

  if (req.method === 'POST') {
    try {
      console.log('Processing callback...');
      const callbackData: CallbackData = req.body?.Body?.stkCallback;
      
      if (!callbackData) {
        console.error('Invalid callback format - missing stkCallback');
        return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid callback format" });
      }

      const checkoutId = callbackData.CheckoutRequestID;
      const resultCode = callbackData.ResultCode;
      const resultDesc = callbackData.ResultDesc || '';
      
      console.log(`Processing callback for CheckoutID: ${checkoutId}, ResultCode: ${resultCode}, Desc: ${resultDesc}`);

      if (!checkoutId) {
        console.error('Missing CheckoutRequestID in callback');
        logCallback('Missing CheckoutRequestID');
        return res.status(400).json({ ResultCode: 1, ResultDesc: "Missing CheckoutRequestID" });
      }

      if (resultCode === 0) {
        const transactionDetails = callbackData.CallbackMetadata?.Item;
        console.log('Successful payment with details:', transactionDetails);
        updateStatus(checkoutId, 'Success', transactionDetails);
      } else {
        console.log(`Payment failed with code ${resultCode}: ${resultDesc}`);
        // Determine if it's a cancellation
        const status = /cancel/i.test(resultDesc) ? 'Cancelled' : 'Failed';
        updateStatus(checkoutId, status);
      }

      console.log('Callback processed successfully');
      return res.status(200).json({ ResultCode: 0, ResultDesc: "Callback processed successfully" });
    } catch (error: any) {
      console.error('Callback processing error:', error);
      logCallback(`Callback error: ${error.stack || error.message}`);
      return res.status(500).json({ ResultCode: 1, ResultDesc: "Internal server error" });
    }
  }

  console.log('Method not allowed - received:', req.method);
  return res.status(405).json({ message: 'Method Not Allowed' });
}