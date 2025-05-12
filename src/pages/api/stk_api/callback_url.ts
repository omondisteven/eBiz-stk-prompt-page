// src/pages/api/stk_api/callback_url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'tmp', 'paymentStatuses.json');

// Initialize storage
function initStorage() {
  if (!fs.existsSync(path.dirname(storagePath))) {
    fs.mkdirSync(path.dirname(storagePath), { recursive: true });
  }
  if (!fs.existsSync(storagePath)) {
    fs.writeFileSync(storagePath, '{}');
  }
}

function getStatuses() {
  initStorage();
  try {
    return JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
  } catch (e) {
    return {};
  }
}

function updateStatus(key: string, status: string) {
  const statuses = getStatuses();
  statuses[key] = status;
  fs.writeFileSync(storagePath, JSON.stringify(statuses, null, 2));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const mpesaResponse = req.body;
      console.log('MPesa Callback:', JSON.stringify(mpesaResponse, null, 2));

      // Log the raw callback
      const logFilePath = path.join(process.cwd(), 'mpesa_callback.log');
      fs.appendFileSync(logFilePath, `${new Date().toISOString()}: ${JSON.stringify(mpesaResponse)}\n`);

      const resultCode = mpesaResponse.Body?.stkCallback?.ResultCode;
      const metadata = mpesaResponse.Body?.stkCallback?.CallbackMetadata?.Item || [];
      
      const phone = metadata.find((item: any) => item.Name === "PhoneNumber")?.Value;
      const account = metadata.find((item: any) => item.Name === "AccountReference")?.Value;

      if (phone && account) {
        const key = `${phone}-${account}`;
        
        if (resultCode === 0) {
          updateStatus(key, "Success");
          console.log(`Payment success for ${key}`);
        } else {
          const resultDesc = mpesaResponse.Body?.stkCallback?.ResultDesc || '';
          if (resultDesc.toLowerCase().includes('cancel')) {
            updateStatus(key, "Cancelled");
            console.log(`Payment cancelled for ${key}`);
          } else {
            updateStatus(key, "Failed");
            console.log(`Payment failed for ${key}`);
          }
        }
      }

      res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Confirmation received successfully",
      });
    } catch (error) {
      console.error('Callback handler error:', error);
      res.status(500).json({
        ResultCode: 1,
        ResultDesc: "Internal server error",
      });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}