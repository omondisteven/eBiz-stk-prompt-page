// callback_url.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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
  receiptNumber?: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`[${new Date().toISOString()}] Callback received`);
  
  if (req.method !== 'POST') {
    console.error('Method not allowed');
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
    // const receiptObj = CallbackMetadata?.Item?.find((i: CallbackMetadataItem) => i.Name === "MpesaReceiptNumber" || i.Name === "ReceiptNumber");
    const phoneObj = CallbackMetadata?.Item?.find((i: CallbackMetadataItem) => i.Name === "PhoneNumber");
    const balanceObj = CallbackMetadata?.Item?.find((i: CallbackMetadataItem) => i.Name === "Balance");
    
    // const receiptNumber = receiptObj?.Value as string;
    const phoneNumber = phoneObj?.Value ? String(phoneObj.Value) : undefined;
    const amount = amountObj?.Value as number;
    const balance = balanceObj?.Value as number;

    const callbackItems = stkCallback.CallbackMetadata?.Item || [];
    const receiptObj = callbackItems.find((i: CallbackMetadataItem) =>
      i.Name?.toLowerCase() === "mpesareceiptnumber" || i.Name?.toLowerCase() === "receiptnumber"
    );
    const receiptNumber = receiptObj?.Value?.toString() || null;
    console.log("CallbackMetadata Items:", JSON.stringify(callbackItems, null, 2));

    const statusUpdate: PaymentStatus = {
      timestamp: new Date().toISOString(),
      status: ResultCode === 0 ? 'Success' : 'Failed',
      details: CallbackMetadata?.Item || ResultDesc,
      amount,
      phoneNumber,
      receiptNumber: receiptNumber || null
    };

    // Prepare transaction data for Firestore
    const transactionData = {
      phoneNumber: phoneNumber || 'unknown',
      Amount: amount,
      MpesaReceiptNumber: receiptNumber || null,
      Balance: balance || null,
      TransactionDate: new Date().toISOString().replace(/\D/g, '').slice(0, 14),
      PhoneNumber: phoneNumber || null,
      processedAt: new Date(),
      receiptNumber: receiptNumber || null,
      status: statusUpdate.status,
      timestamp: statusUpdate.timestamp,
      transactionType: ResultCode === 0 ? 'completed' : 'failed',
      ...(Array.isArray(statusUpdate.details) && {
        details: statusUpdate.details
      })
    };

    // Save to Firestore
  try {
    await adminDb
      .collection('transactions')
      .doc(CheckoutRequestID)
      .set({
        Amount: statusUpdate.amount || 0,
        MpesaReceiptNumber: receiptNumber,
        Balance: null, // Update if available
        TransactionDate: statusUpdate.timestamp.replace(/\D/g, '').slice(0, 14), // Format as YYYYMMDDHHmmss
        PhoneNumber: statusUpdate.phoneNumber || 'unknown',
        phoneNumber: statusUpdate.phoneNumber || 'unknown',
        processedAt: new Date(),
        receiptNumber: receiptNumber,
        status: statusUpdate.status === 'Success' ? 'Success' : 'Failed',
        timestamp: statusUpdate.timestamp,
        transactionType: statusUpdate.status === 'Success' ? 'completed' : 'failed'
      }, { merge: true });

      // Store the phone number in users collection if valid
      if (phoneNumber && phoneNumber !== "254") {
        try {
          await adminDb
            .collection('users')
            .doc(phoneNumber)
            .set({ 
              phoneNumber,
              lastTransaction: new Date(),
              totalTransactions: FieldValue.increment(1)
            }, { merge: true });
        } catch (userError) {
          console.error('Error storing user phone number:', userError);
        }
      }

      // Store in localStorage for web client (via API response)
      if (statusUpdate.status === 'Success' && phoneNumber) {
        // Note: This won't work server-side - consider alternative approach
        console.log('Would store in localStorage:', phoneNumber);
      }

    } catch (firestoreError) {
      console.error('Firestore write error:', firestoreError);
      // Consider sending to error tracking service
    }

  } catch (error) {
    console.error('Callback processing error:', error);
    // Even if there's an error, we've already responded to M-Pesa
  }
}