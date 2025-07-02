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
  console.log(`[${new Date().toISOString()}] 🔁 Callback received`);

  if (req.method !== 'POST') {
    console.error('❌ Method not allowed');
    return res.status(405).json({
      ResultCode: 1,
      ResultDesc: 'Method Not Allowed',
    });
  }

  try {
    const callback = req.body?.Body?.stkCallback;

    if (!callback) {
      console.error('❌ Invalid callback structure:', req.body);
      return res.status(400).json({
        ResultCode: 1,
        ResultDesc: 'Invalid request format',
      });
    }

    const {
      CheckoutRequestID,
      ResultCode,
      CallbackMetadata,
      ResultDesc,
    } = callback;

    // ✅ Always respond to M-Pesa first
    res.status(200).json({
      ResultCode: 0,
      ResultDesc: 'Callback received successfully',
    });

    // 🔍 Log full callback for inspection
    console.log('🔥 Full stkCallback:', JSON.stringify(callback, null, 2));

    const items = CallbackMetadata?.Item || [];

    // 🔍 Log extracted items
    console.log('📦 CallbackMetadata.Items:', JSON.stringify(items, null, 2));

    const getValue = (name: string) => {
      return items.find(
        (i: CallbackMetadataItem) =>
          i?.Name?.toLowerCase() === name.toLowerCase()
      )?.Value;
    };

    const amount = getValue('Amount') as number;
    const phoneNumber = getValue('PhoneNumber')?.toString() || undefined;
    const balance = getValue('Balance');
    const receiptNumber =
      getValue('MpesaReceiptNumber')?.toString() ||
      getValue('ReceiptNumber')?.toString() ||
      null;

    console.log('✅ Extracted Receipt:', receiptNumber);

    const status: 'Success' | 'Failed' = ResultCode === 0 ? 'Success' : 'Failed';

    const transactionData = {
      phoneNumber: phoneNumber || 'unknown',
      PhoneNumber: phoneNumber || 'unknown',
      Amount: amount || 0,
      MpesaReceiptNumber: receiptNumber || null,
      receiptNumber: receiptNumber || null,
      Balance: balance || null,
      TransactionDate: new Date().toISOString().replace(/\D/g, '').slice(0, 14),
      processedAt: new Date(),
      timestamp: new Date().toISOString(),
      status,
      transactionType: status === 'Success' ? 'completed' : 'failed',
      ...(Array.isArray(items) ? { details: items } : { details: ResultDesc }),
    };

    // 📝 Log what is being saved
    console.log('📝 Final Firestore transactionData:', JSON.stringify(transactionData, null, 2));

    // ✅ Save transaction to Firestore
    try {
      await adminDb
        .collection('transactions')
        .doc(CheckoutRequestID)
        .set(transactionData, { merge: true });
    } catch (err) {
      console.error('❌ Firestore write error:', err);
    }

    // ✅ Update user profile in 'users' collection
    if (phoneNumber && phoneNumber !== '254') {
      try {
        await adminDb
          .collection('users')
          .doc(phoneNumber)
          .set(
            {
              phoneNumber,
              lastTransaction: new Date(),
              totalTransactions: FieldValue.increment(1),
            },
            { merge: true }
          );
      } catch (userError) {
        console.error('❌ Error saving user:', userError);
      }
    }
  } catch (error) {
    console.error('❌ Callback processing error:', error);
  }
}
