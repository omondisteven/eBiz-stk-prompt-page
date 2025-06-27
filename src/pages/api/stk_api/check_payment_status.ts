// src/pages/api/stk_api/check_payment_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { adminDb } from '../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import axios from 'axios';

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
    // First check Firestore
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

    // If not in DB and force_query is true, perform STK query
    if (force_query === 'true') {
      return await queryStkStatus(checkout_id, res);
    }

    // Default pending response
    return res.status(200).json({ 
      status: 'Pending',
      details: 'Waiting for payment confirmation',
      resultCode: '500.001.1001'
    });

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      status: 'Error',
      details: 'Failed to check status',
      resultCode: '500.001.1001'
    });
  }
}

export async function queryStkStatus(checkoutId: string, res: NextApiResponse) {
  try {
    const mpesaEnv = process.env.MPESA_ENVIRONMENT;
    const MPESA_BASE_URL = mpesaEnv === "live"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    const shortcode = process.env.MPESA_SHORTCODE!;
    const passkey = process.env.MPESA_PASSKEY!;
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14);
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');

    // Generate OAuth token
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
    const { data: tokenRes } = await axios.get(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${auth}` }
    });
    const accessToken = tokenRes.access_token;

    const queryUrl = `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`;
    const { data: queryRes } = await axios.post(queryUrl, {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutId
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const {
      ResultCode,
      ResultDesc,
      MpesaReceiptNumber,
      Amount,
      PhoneNumber,
      TransactionDate
    } = queryRes;

    const status = ResultCode === "0" ? 'Success' : 'Failed';

    if (status === 'Success') {
      const transactionData = {
        Amount: Amount || 0,
        MpesaReceiptNumber: MpesaReceiptNumber || null,
        PhoneNumber: PhoneNumber || 'unknown',
        phoneNumber: PhoneNumber || 'unknown',
        receiptNumber: MpesaReceiptNumber || null,
        status: 'Success',
        timestamp: new Date().toISOString(),
        transactionType: 'completed',
        processedAt: new Date(),
        TransactionDate: new Date().toISOString().replace(/\D/g, '').slice(0, 14)
      };

      // Save to Firestore
      await adminDb.collection('transactions').doc(checkoutId).set(transactionData, { merge: true });

      // Update user collection
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
      details: queryRes
    });

  } catch (error) {
    console.error("STK Query Error:", error);
    return res.status(500).json({
      status: 'Error',
      resultCode: '500.001.1002',
      details: 'Failed to query STK push status'
    });
  }
}
