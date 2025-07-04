// pages/api/stk_api/callback_url.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

type CallbackMetadataItem = {
  Name: string;
  Value: string | number;
};

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
      console.error('❌ Missing stkCallback in body');
      return res.status(400).json({
        ResultCode: 1,
        ResultDesc: 'Invalid request format',
      });
    }

    // ✅ Log full callback body for diagnostics
    console.log('📦 FULL Safaricom Callback:', JSON.stringify(callback, null, 2));

    const {
      CheckoutRequestID,
      ResultCode,
      CallbackMetadata,
      ResultDesc,
    } = callback;

    // ✅ Send ACK immediately to Safaricom
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback received successfully' });

    // ✅ Extract and normalize metadata items
    const items: CallbackMetadataItem[] = Array.isArray(CallbackMetadata?.Item)
      ? CallbackMetadata.Item
      : [];

    if (!items.length) {
      console.warn(`[${CheckoutRequestID}] ⚠️ CallbackMetadata.Item is empty or missing`);
    }

    // ✅ Helper to get a value by key name (case- and space-insensitive)
    const getValue = (name: string): string | null => {
      const normalized = name.toLowerCase().replace(/\s/g, '');
      const match = items.find(i =>
        i?.Name?.toLowerCase().replace(/\s/g, '') === normalized
      );
      return match?.Value?.toString() || null;
    };

    // ✅ Try all common variations of receipt field names
    let receiptNumber =
      getValue('MpesaReceiptNumber') ||
      getValue('ReceiptNumber') ||
      getValue('TransactionReceipt');

    // 🔁 Last-resort fallback: find any key that loosely matches "receipt"
    if (!receiptNumber && items.length) {
      const fallback = items.find(i => /receipt/i.test(i?.Name));
      receiptNumber = fallback?.Value?.toString() || null;
    }

    const phoneNumber = getValue('PhoneNumber') || 'unknown';
    const amount = Number(getValue('Amount') || 0);

    const status: 'Success' | 'Failed' = ResultCode === 0 ? 'Success' : 'Failed';

    const transactionData = {
      receiptNumber,
      phoneNumber,
      amount,
      Balance: getValue('Balance') || null,
      TransactionDate: new Date().toISOString().replace(/\D/g, '').slice(0, 14),
      processedAt: new Date(),
      timestamp: new Date().toISOString(),
      status,
      transactionType: status === 'Success' ? 'completed' : 'failed',
      details: items.length ? items : ResultDesc, // 🔥 Critical fix to ensure front-end access
    };

    await adminDb
      .collection('transactions')
      .doc(CheckoutRequestID)
      .set(transactionData, { merge: true });

    // ✅ Optional: track user usage if phone is valid
    if (phoneNumber !== '254' && phoneNumber !== 'unknown') {
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
    }

    console.log(`[${CheckoutRequestID}] ✅ Callback processed. Receipt: ${receiptNumber}`);

  } catch (err) {
    console.error('❌ Callback processing error:', err);
  }
}

