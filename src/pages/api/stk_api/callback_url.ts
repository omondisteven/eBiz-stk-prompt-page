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

      // Enhanced metadata extraction with deep inspection
      const extractReceiptNumber = (metadata: any): string | null => {
        if (!metadata) return null;
        
        // Case 1: Direct metadata items array
        if (Array.isArray(metadata.Item)) {
          for (const item of metadata.Item) {
            if (item?.Name?.toLowerCase().includes('receipt')) {
              return item.Value?.toString() || null;
            }
          }
        }
        
        // Case 2: Nested in CallbackMetadata
        if (metadata.CallbackMetadata?.Item) {
          for (const item of metadata.CallbackMetadata.Item) {
            if (item?.Name?.toLowerCase().includes('receipt')) {
              return item.Value?.toString() || null;
            }
          }
        }
        
        // Case 3: Flat object
        if (metadata.MpesaReceiptNumber) return metadata.MpesaReceiptNumber;
        if (metadata.ReceiptNumber) return metadata.ReceiptNumber;
        
        return null;
      };

      const receiptNumber = extractReceiptNumber(CallbackMetadata) || extractReceiptNumber(req.body);
      const phoneNumber = CallbackMetadata?.Item?.find((i: any) => 
        i?.Name?.toLowerCase().includes('phone')
      )?.Value?.toString() || 'unknown';

      const amount = CallbackMetadata?.Item?.find((i: any) => 
        i?.Name?.toLowerCase().includes('amount')
      )?.Value;

      const status: 'Success' | 'Failed' = ResultCode === 0 ? 'Success' : 'Failed';

      const transactionData = {
        receiptNumber,
        phoneNumber,
        amount: amount ? Number(amount) : null,
        transactionDate: new Date().toISOString().replace(/\D/g, '').slice(0, 14),
        processedAt: new Date(),
        timestamp: new Date().toISOString(),
        status,
        transactionType: status === 'Success' ? 'completed' : 'failed',
        rawCallback: req.body, // Store entire callback for debugging
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

