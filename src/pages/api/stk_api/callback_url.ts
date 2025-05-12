// pages/api/stk_api/callback_url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Define the type for payment statuses
type PaymentStatuses = {
  [key: string]: string; // This is the index signature
};

const logDir = path.join(process.cwd(), 'logs');
const statusPath = path.join(logDir, 'payment_statuses.json');
const callbackLogPath = path.join(logDir, 'callbacks.log');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function logCallback(data: string) {
  fs.appendFileSync(callbackLogPath, `${new Date().toISOString()}: ${data}\n`);
}

function updateStatus(key: string, status: string) {
  let statuses: PaymentStatuses = {};
  
  try {
    const rawData = fs.readFileSync(statusPath, 'utf-8');
    statuses = JSON.parse(rawData) as PaymentStatuses;
  } catch (e) {
    console.error('Error reading status file:', e);
    statuses = {};
  }
  
  statuses[key] = status; // No more type error here
  fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));
  logCallback(`Status updated: ${key} => ${status}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  logCallback(`Incoming request: ${JSON.stringify(req.body, null, 2)}`);

  if (req.method === 'POST') {
    try {
      const payload = req.body;
      if (!payload.Body?.stkCallback) {
        logCallback('Invalid callback format - missing stkCallback');
        return res.status(400).json({
          ResultCode: 1,
          ResultDesc: "Invalid callback format"
        });
      }

      const callback = payload.Body.stkCallback;
      const resultCode = callback.ResultCode;
      const metadata = callback.CallbackMetadata?.Item || [];
      
      const phoneItem = metadata.find((item: any) => item.Name === "PhoneNumber");
      const accountItem = metadata.find((item: any) => item.Name === "AccountReference");

      const phone = phoneItem?.Value;
      const account = accountItem?.Value;

      if (!phone || !account) {
        logCallback('Missing phone or account reference');
        return res.status(400).json({
          ResultCode: 1,
          ResultDesc: "Missing phone or account reference"
        });
      }

      const key = `${phone}-${account}`;
      let status = 'Failed';
      
      if (resultCode === 0) {
        status = 'Success';
      } else if (callback.ResultDesc?.toLowerCase().includes('cancel')) {
        status = 'Cancelled';
      }

      updateStatus(key, status);
      logCallback(`Processed callback for ${key}: ${status}`);

      return res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Callback processed successfully"
      });
    } catch (error: any) {
      logCallback(`Error processing callback: ${error.message}`);
      console.error('Callback error:', error);
      return res.status(500).json({
        ResultCode: 1,
        ResultDesc: "Internal server error"
      });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}