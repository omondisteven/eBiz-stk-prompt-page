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
  receiptNumber?: string;
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
    const amountObj = CallbackMetadata?.Item?.find((i: CallbackMetadataItem) => i.Name === "Amount");
    const receiptObj = CallbackMetadata?.Item?.find((i: CallbackMetadataItem) => i.Name === "MpesaReceiptNumber");
    const phoneObj = CallbackMetadata?.Item?.find((i: CallbackMetadataItem) => i.Name === "PhoneNumber");

    const statusUpdate: PaymentStatus = {
      timestamp: new Date().toISOString(),
      status: ResultCode === 0 ? 'Success' : 'Failed',
      details: CallbackMetadata?.Item || ResultDesc,
      amount: amountObj?.Value as number,
      phoneNumber: String(phoneObj?.Value), // Convert to string
      receiptNumber: receiptObj?.Value as string
    };

    // Store the phone number in the database if this is the first transaction
    if (statusUpdate.phoneNumber && statusUpdate.phoneNumber !== "254") {
      try {
        const userDocRef = doc(db, 'users', statusUpdate.phoneNumber);
        await setDoc(userDocRef, { phoneNumber: statusUpdate.phoneNumber }, { merge: true });
      } catch (err) {
        console.error('Error storing user phone number:', err);
      }
    }

    console.log('Processing payment:', {
      requestId: CheckoutRequestID,
      status: statusUpdate.status,
      amount: statusUpdate.amount,
      phone: statusUpdate.phoneNumber,
      receipt: statusUpdate.receiptNumber
    });
    
    // Save to Firestore
    await setDoc(doc(db, 'transactions', CheckoutRequestID), {
      ...statusUpdate,
      processedAt: new Date(),
      transactionType: ResultCode === 0 ? 'completed' : 'failed',
      receiptNumber: statusUpdate.receiptNumber || null
    });

    console.log('Transaction saved to Firestore:', CheckoutRequestID);

    if (statusUpdate.status === 'Success' && statusUpdate.phoneNumber) {
      // Store phone number in localStorage for transaction history
      localStorage.setItem('payerPhoneNumber', statusUpdate.phoneNumber);
    }

  } catch (error) {
    console.error('Callback processing error:', error);
  }
  
}