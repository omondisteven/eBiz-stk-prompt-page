// pages/api/stk_api/callback_url.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { CallbackMetadataItem } from '@/utils/getReceiptFromDetails';

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

    // Extract metadata items using proper typing
    const metadataItems: CallbackMetadataItem[] = CallbackMetadata?.Item || [];
    
    // Extract important fields
    const amountItem = metadataItems.find(item => item.Name.toLowerCase() === 'amount');
    const receiptItem = metadataItems.find(item => 
      item.Name.toLowerCase().includes('receipt') || 
      item.Name.toLowerCase().includes('mpesareceipt')
    );
    const phoneItem = metadataItems.find(item => item.Name.toLowerCase().includes('phone'));
    const balanceItem = metadataItems.find(item => item.Name.toLowerCase() === 'balance');
    const dateItem = metadataItems.find(item => item.Name.toLowerCase().includes('date'));

    const status: 'Success' | 'Failed' = ResultCode === 0 ? 'Success' : 'Failed';

    // Prepare transaction data with proper structure
    const transactionData = {
      amount: amountItem ? Number(amountItem.Value) : null,
      details: metadataItems, // Store all metadata items as array of {Name, Value}
      phoneNumber: phoneItem ? phoneItem.Value.toString() : 'unknown',
      processedAt: FieldValue.serverTimestamp(),
      receiptNumber: receiptItem ? receiptItem.Value.toString() : null,
      status,
      timestamp: new Date().toISOString(),
      transactionType: status === 'Success' ? 'completed' : 'failed',
      checkoutRequestID: CheckoutRequestID,
      resultCode: ResultCode,
      resultDesc: ResultDesc,
      rawCallback: req.body // Store the complete callback for reference
    };

    console.log('Storing transaction:', transactionData);
    await adminDb.collection('transactions').doc(CheckoutRequestID).set(transactionData, { merge: true });

    // Update user stats if phone number is valid
    const phoneNumber = transactionData.phoneNumber;
    if (phoneNumber !== 'unknown' && phoneNumber !== '254') {
      await adminDb.collection('users').doc(phoneNumber).set(
        {
          phoneNumber,
          lastTransaction: FieldValue.serverTimestamp(),
          totalTransactions: FieldValue.increment(1),
        },
        { merge: true }
      );
    }

  } catch (err) {
    console.error('❌ Callback error:', err);
  }
}

