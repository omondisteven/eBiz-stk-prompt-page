// src/pages/api/stk_api/check_payment_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

type PaymentStatus = {
  timestamp: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Cancelled';
  details: any;
  resultCode?: string;
  receiptNumber?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { checkout_id, force_query } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkout_id || typeof checkout_id !== 'string') {
    return res.status(400).json({ error: 'Invalid checkout_id' });
  }

  try {
    // 1. Check Firestore for the transaction
    const docRef = doc(db, 'transactions', checkout_id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return res.status(200).json({
        status: data.status === 'Success' ? 'Success' : 'Failed',
        details: data.details,
        resultCode: data.status === 'Success' ? '0' : '1',
        receiptNumber: data.receiptNumber || null
      });
    }

    // 2. If not found, and force_query is true, fallback to STK Query
    if (force_query === 'true') {
      return await queryStkStatus(checkout_id, res);
    }

    // 3. Default pending response
    return res.status(200).json({
      status: 'Pending',
      details: 'Waiting for payment confirmation',
      resultCode: '500.001.1001'
    });

  } catch (error) {
    console.error('🔥 Top-level status check error:', error);
    return res.status(500).json({
      status: 'Error',
      details: 'Unexpected server error during status check',
      resultCode: '500.001.1000'
    });
  }
}

async function queryStkStatus(checkoutId: string, res: NextApiResponse) {
  try {
    const mpesaEnv = process.env.MPESA_ENVIRONMENT;
    const MPESA_BASE_URL = mpesaEnv === 'live'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke';

    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY!;
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');

    const tokenRes = await axios.get(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` }
    });

    const accessToken = tokenRes.data.access_token;
    if (!accessToken) throw new Error('❌ No access token received');

    const stkQueryUrl = `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`;
    const stkQueryPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutId,
    };

    const queryRes = await axios.post(stkQueryUrl, stkQueryPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    const {
      ResultCode,
      ResultDesc,
      MpesaReceiptNumber,
      Amount,
      PhoneNumber
    } = queryRes.data;

    const status: PaymentStatus['status'] = ResultCode === '0' ? 'Success' : 'Failed';
    const timestampNow = new Date().toISOString();

    if (status === 'Success') {
      const txData = {
        Amount: Amount || 0,
        MpesaReceiptNumber: MpesaReceiptNumber || null,
        PhoneNumber: PhoneNumber || 'unknown',
        phoneNumber: PhoneNumber || 'unknown',
        receiptNumber: MpesaReceiptNumber || null,
        status: 'Success',
        timestamp: timestampNow,
        transactionType: 'completed',
        processedAt: new Date(),
        TransactionDate: timestampNow.replace(/\D/g, '').slice(0, 14),
        source: 'STK_QUERY'
      };

      await adminDb.collection('transactions').doc(checkoutId).set(txData, { merge: true });

      // Optionally update users collection
      if (PhoneNumber && PhoneNumber !== '254') {
        await adminDb.collection('users').doc(PhoneNumber).set({
          phoneNumber: PhoneNumber,
          lastTransaction: new Date(),
          totalTransactions: FieldValue.increment(1)
        }, { merge: true });
      }
    }

    return res.status(200).json({
      status,
      resultCode: ResultCode,
      receiptNumber: MpesaReceiptNumber || null,
      details: queryRes.data
    });

  } catch (error: any) {
    console.error('❌ STK Query Error:', error?.response?.data || error.message || error);
    return res.status(500).json({
      status: 'Error',
      resultCode: '500.001.1003',
      details: error?.response?.data || 'Unhandled server error in queryStkStatus'
    });
  }
}
