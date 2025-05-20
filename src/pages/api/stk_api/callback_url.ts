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

type CallbackData = {
  Body: {
    stkCallback: {
      CheckoutRequestID: string;
      ResultCode: number;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
      ResultDesc: string;
    };
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Request method:', req.method);
  console.log('Request headers:', req.headers);
  
  if (req.method === 'GET') {
    // For testing purposes only
    return res.status(200).json({
      message: 'This endpoint requires POST requests',
      example: {
        Body: {
          stkCallback: {
            CheckoutRequestID: "test123",
            ResultCode: 0,
            CallbackMetadata: {
              Item: [
                { Name: "Amount", Value: 100 },
                { Name: "MpesaReceiptNumber", Value: "TEST123" }
              ]
            }
          }
        }
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      ResultCode: 1,
      ResultDesc: 'Method Not Allowed' 
    });
  }

  try {
    const data = req.body as CallbackData;
    console.log('Received callback:', data);

    // Always respond immediately to M-Pesa
    res.status(200).json({ 
      ResultCode: 0, 
      ResultDesc: "Callback received successfully" 
    });

    // Process the callback data here
    console.log('Payment status:', {
      requestId: data.Body.stkCallback.CheckoutRequestID,
      status: data.Body.stkCallback.ResultCode === 0 ? 'Success' : 'Failed',
      details: data.Body.stkCallback.CallbackMetadata || data.Body.stkCallback.ResultDesc
    });

  } catch (error) {
    console.error('Callback processing error:', error);
    res.status(500).json({
      ResultCode: 1,
      ResultDesc: 'Internal server error'
    });
  }
}