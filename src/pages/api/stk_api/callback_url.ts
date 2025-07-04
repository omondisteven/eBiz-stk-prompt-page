// pages/api/stk_api/callback_url.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log(`[${new Date().toISOString()}] 🔁 Callback received`, JSON.stringify(req.body, null, 2));

  if (req.method !== 'POST') {
    return res.status(405).json({
      ResultCode: 1,
      ResultDesc: 'Method Not Allowed',
    });
  }

  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) {
      console.error('Invalid callback format:', req.body);
      return res.status(400).json({
        ResultCode: 1,
        ResultDesc: 'Invalid request format',
      });
    }

    const { CheckoutRequestID, ResultCode, CallbackMetadata, ResultDesc } = callback;

    // First respond to the callback to prevent timeout
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback received successfully' });

    // Enhanced metadata extraction using CallbackMetadataItem type
    const extractMetadata = (metadata: any): {
      receiptNumber: string | null;
      phoneNumber: string;
      amount: number | null;
      items: CallbackMetadataItem[];
    } => {
      let receiptNumber: string | null = null;
      let phoneNumber = 'unknown';
      let amount: number | null = null;
      const items: CallbackMetadataItem[] = [];

      const processItems = (itemsArray: any[]) => {
        itemsArray.forEach((item) => {
          if (!item?.Name) return;
          
          // Store all items for debugging
          items.push({
            Name: item.Name,
            Value: item.Value
          });

          // Check for receipt number
          if (item.Name.toLowerCase().includes('receipt')) {
            receiptNumber = item.Value?.toString() || null;
          }

          // Check for phone number
          if (item.Name.toLowerCase().includes('phone')) {
            phoneNumber = item.Value?.toString() || 'unknown';
          }

          // Check for amount
          if (item.Name.toLowerCase().includes('amount')) {
            amount = Number(item.Value) || null;
          }
        });
      };

      // Process metadata items from different possible locations
      if (Array.isArray(metadata?.Item)) {
        processItems(metadata.Item);
      }
      if (Array.isArray(metadata?.CallbackMetadata?.Item)) {
        processItems(metadata.CallbackMetadata.Item);
      }
      if (Array.isArray(req.body?.Body?.stkCallback?.CallbackMetadata?.Item)) {
        processItems(req.body.Body.stkCallback.CallbackMetadata.Item);
      }

      // Check flat object properties as fallback
      if (!receiptNumber) {
        if (metadata?.MpesaReceiptNumber) receiptNumber = metadata.MpesaReceiptNumber;
        if (metadata?.ReceiptNumber) receiptNumber = metadata.ReceiptNumber;
      }

      return { receiptNumber, phoneNumber, amount, items };
    };

    const { receiptNumber, phoneNumber, amount, items } = extractMetadata(CallbackMetadata || req.body);

    const status: 'Success' | 'Failed' = ResultCode === 0 ? 'Success' : 'Failed';

    const transactionData = {
      receiptNumber,
      phoneNumber,
      amount,
      transactionDate: new Date().toISOString().replace(/\D/g, '').slice(0, 14),
      processedAt: new Date(),
      timestamp: new Date().toISOString(),
      status,
      transactionType: status === 'Success' ? 'completed' : 'failed',
      callbackMetadata: items, // Store all metadata items using the defined type
      rawCallback: req.body,
      checkoutRequestID: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
    };

    console.log('Storing transaction:', transactionData);
    await adminDb.collection('transactions').doc(CheckoutRequestID).set(transactionData, { merge: true });

    if (phoneNumber !== 'unknown' && phoneNumber !== '254') {
      await adminDb.collection('users').doc(phoneNumber).set(
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
  }
}

