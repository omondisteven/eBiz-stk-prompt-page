// src/pages/api/stk_api/callback_url.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
};

type PaymentStatus = {
  timestamp: string;
  status: 'Success' | 'Failed';
  details: CallbackMetadataItem[] | string;
  amount?: number;
  phoneNumber?: string;
  // receiptNumber?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`[${new Date().toISOString()}] Callback received`);
  
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

    const { stkCallback } = req.body.Body;
    const { CheckoutRequestID, ResultCode, CallbackMetadata, ResultDesc } = stkCallback;

    // Always respond immediately to M-Pesa
    res.status(200).json({ 
      ResultCode: 0, 
      ResultDesc: "Callback received successfully" 
    });

    // Extract payment details
    const amountObj = CallbackMetadata?.Item.find((i: CallbackMetadataItem) => i.Name === "Amount");
    // const receiptObj = CallbackMetadata?.Item.find((i: CallbackMetadataItem) => i.Name === "MpesaReceiptNumber");
    const phoneObj = CallbackMetadata?.Item.find((i: CallbackMetadataItem) => i.Name === "PhoneNumber");

    const statusUpdate: PaymentStatus = {
      timestamp: new Date().toISOString(),
      status: ResultCode === 0 ? 'Success' : 'Failed',
      details: CallbackMetadata?.Item || ResultDesc,
      amount: amountObj?.Value as number,
      phoneNumber: phoneObj?.Value as string,
      // receiptNumber: receiptObj?.Value as string
    };

    console.log('Processing payment:', {
      requestId: CheckoutRequestID,
      status: statusUpdate.status,
      amount: statusUpdate.amount,
      phone: statusUpdate.phoneNumber
    });
    
    // Save to Firestore
    await setDoc(doc(db, 'transactions', CheckoutRequestID), {
      ...statusUpdate,
      processedAt: new Date(),
      // Add any additional fields you want to store
      transactionType: req.body.Body?.stkCallback?.ResultCode === 0 ? 'completed' : 'failed',
      // receiptNumber: receiptObj?.Value || null  // Add this line to store receipt number
    });

    console.log('Transaction saved to Firestore:', CheckoutRequestID);

  } catch (error) {
    console.error('Callback processing error:', error);
    // Response already sent, but log the error
  }
}