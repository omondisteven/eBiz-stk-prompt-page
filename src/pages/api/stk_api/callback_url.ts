// src/pages/api/stk_api/callback_url.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
};

type PaymentStatus = {
  timestamp: string;
  status: 'Success' | 'Failed';
  details: CallbackMetadataItem[] | string;
};

type Statuses = {
  [checkoutRequestId: string]: PaymentStatus;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      ResultCode: 1,
      ResultDesc: 'Method Not Allowed' 
    });
  }

  try {
    if (!req.body || !req.body.Body?.stkCallback) {
      console.error('Invalid callback structure:', req.body);
      return res.status(400).json({
        ResultCode: 1,
        ResultDesc: 'Invalid request format'
      });
    }

    // Immediate response to M-Pesa
    res.status(200).json({ 
      ResultCode: 0, 
      ResultDesc: "Callback received successfully" 
    });

    const { stkCallback } = req.body.Body;
    const { CheckoutRequestID, CallbackMetadata, ResultDesc } = stkCallback;

    const statusUpdate: PaymentStatus = {
      timestamp: new Date().toISOString(),
      status: CallbackMetadata ? 'Success' : 'Failed',
      details: CallbackMetadata?.Item || ResultDesc
    };

    console.log('Payment callback:', {
      CheckoutRequestID,
      status: statusUpdate.status,
      details: statusUpdate.details
    });

    if (process.env.NODE_ENV === 'development') {
      const tmpDir = path.join(process.cwd(), 'tmp', 'logs');
      const statusPath = path.join(tmpDir, 'payment_statuses.json');
      
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const statuses: Statuses = fs.existsSync(statusPath)
        ? JSON.parse(fs.readFileSync(statusPath, 'utf-8'))
        : {};

      statuses[CheckoutRequestID] = statusUpdate;
      fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));
    }

  } catch (error) {
    console.error('Callback processing error:', error);
    return res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Internal server error'
    });
  }
}