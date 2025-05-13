import { NextApiRequest, NextApiResponse } from 'next';
import kv, { getPaymentKey, getCallbackKey } from '../../../lib/kv';

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
    
    if (!CheckoutRequestID) {
      console.error(`[${callbackId}] Missing CheckoutRequestID`);
      return;
    }

    // Determine status
    let status: 'Success' | 'Failed' | 'Cancelled';
    let details: any;
    
    if (ResultCode === 0) {
      status = 'Success';
      details = CallbackMetadata?.Item || 'No transaction details';
    } else if (ResultCode === 1032) {
      status = 'Cancelled';
      details = 'User cancelled the payment';
    } else {
      status = 'Failed';
      details = ResultDesc;
    }

    // Current timestamp
    const timestamp = new Date().toISOString();

    // Save to KV
    const paymentKey = getPaymentKey(CheckoutRequestID);
    const callbackKey = getCallbackKey(CheckoutRequestID);

    await kv.hset(paymentKey, {
      status,
      details: JSON.stringify(details),
      updatedAt: timestamp
    });

    // Store full callback for debugging
    await kv.set(callbackKey, JSON.stringify(callbackData));

    console.log(`[${callbackId}] KV update complete for ${CheckoutRequestID}`);

  } catch (error) {
    console.error(`[${callbackId}] Callback processing error:`, error);
  }
}