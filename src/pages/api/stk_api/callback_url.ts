// pages/api/stk_api/callback_url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type PaymentStatuses = {
  [key: string]: string;
};

const logDir = path.join(process.cwd(), 'logs');
const statusPath = path.join(logDir, 'payment_statuses.json');
const callbackLogPath = path.join(logDir, 'callbacks.log');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function logCallback(data: string) {
  fs.appendFileSync(callbackLogPath, `${new Date().toISOString()}: ${data}\n`);
}

function updateStatus(key: string, status: string) {
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
  logCallback(`Status updated: ${key} => ${status}`);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  logCallback(`Incoming request: ${JSON.stringify(req.body, null, 2)}`);

  if (req.method === 'POST') {
    try {
      const callback = req.body?.Body?.stkCallback;

      if (!callback) {
        return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid callback format" });
      }

      const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

      if (!CheckoutRequestID) {
        logCallback('Missing CheckoutRequestID');
        return res.status(400).json({ ResultCode: 1, ResultDesc: "Missing CheckoutRequestID" });
      }

      // Determine the payment status
      let status = ResultCode === 0 ? 'Success' : /cancel/i.test(ResultDesc) ? 'Cancelled' : 'Failed';

      // Save the status
      updateStatus(CheckoutRequestID, status);

      if (ResultCode === 0 && CallbackMetadata?.Item) {
        const transactionDetails = CallbackMetadata.Item;
        logCallback(`Payment successful. Transaction details: ${JSON.stringify(transactionDetails, null, 2)}`);
      } else {
        logCallback(`Payment failed: ${ResultDesc}`);
      }

      return res.status(200).json({ ResultCode: 0, ResultDesc: "Callback processed successfully" });

    } catch (error: any) {
      logCallback(`Callback error: ${error.message}`);
      return res.status(500).json({ ResultCode: 1, ResultDesc: "Internal server error" });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
