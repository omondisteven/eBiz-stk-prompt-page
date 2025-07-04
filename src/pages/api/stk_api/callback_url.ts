// pages/api/stk_api/callback_url.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
};

// Replace the existing callback handler with this improved version
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`[${new Date().toISOString()}] 🔁 Callback received`);

  if (req.method !== 'POST') {
    return res.status(405).json({
      ResultCode: 1,
      ResultDesc: 'Method Not Allowed',
    });
  }

  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) {
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

    // First respond to the callback to prevent timeout
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback received successfully' });

    // Enhanced metadata extraction
    const items = Array.isArray(CallbackMetadata?.Item) ? CallbackMetadata.Item : [];
    
    // Function to safely get values from metadata
    const getMetadataValue = (names: string[]) => {
      for (const name of names) {
        const item = items.find((i: any) => 
          i?.Name?.toLowerCase().replace(/\s/g, '') === name.toLowerCase().replace(/\s/g, '')
        );
        if (item) return item.Value;
      }
      return null;
    };

    // Extract all possible fields
    const receiptNumber = getMetadataValue(['MpesaReceiptNumber', 'ReceiptNumber', 'mpesareceiptnumber', 'receiptnumber']);
    const phoneNumber = getMetadataValue(['PhoneNumber', 'phonenumber']) || 'unknown';
    const amount = getMetadataValue(['Amount', 'amount']);
    const transactionDate = getMetadataValue(['TransactionDate', 'transactiondate']) || 
                          new Date().toISOString().replace(/\D/g, '').slice(0, 14);

    const status: 'Success' | 'Failed' = ResultCode === 0 ? 'Success' : 'Failed';

    // Prepare transaction data for Firestore
    const transactionData = {
      receiptNumber: receiptNumber?.toString() || null,
      phoneNumber: phoneNumber.toString(),
      amount: amount ? Number(amount) : null,
      transactionDate,
      processedAt: new Date(),
      timestamp: new Date().toISOString(),
      status,
      transactionType: status === 'Success' ? 'completed' : 'failed',
      details: items, // Store the raw items for debugging
      checkoutRequestID: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
    };

    // Save to Firestore
    await adminDb.collection('transactions').doc(CheckoutRequestID).set(transactionData, { merge: true });

    // Update user stats if phone number is valid
    if (phoneNumber !== 'unknown' && phoneNumber !== '254') {
      await adminDb.collection('users').doc(phoneNumber.toString()).set(
        {
          phoneNumber,
          lastTransaction: new Date(),
          totalTransactions: FieldValue.increment(1),
        },
        { merge: true }
      );
    }

  } catch (err) {
    console.error('❌ Callback error:', err);
    // Even if there's an error, we've already responded to the callback
  }
}

