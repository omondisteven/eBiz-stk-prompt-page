// src/pages/api/stk_api/check_payment_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
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

async function queryStkStatus(checkoutId: string, res: NextApiResponse) {
  try {
    const mpesaEnv = process.env.MPESA_ENVIRONMENT;
    const MPESA_BASE_URL = mpesaEnv === "live"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    // Generate token
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const tokenResponse = await axios.get(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          authorization: `Basic ${auth}`,
        },
      }
    );

    const token = tokenResponse.data.access_token;

    const date = new Date();
    const timestamp =
      date.getFullYear() +
      ("0" + (date.getMonth() + 1)).slice(-2) +
      ("0" + date.getDate()).slice(-2) +
      ("0" + date.getHours()).slice(-2) +
      ("0" + date.getMinutes()).slice(-2) +
      ("0" + date.getSeconds()).slice(-2);

    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const queryResponse = await axios.post(
      `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
      {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const queryData = queryResponse.data;
    
    // Extract receipt number from callback metadata if available
    let receiptNumber = null;
    if (queryData.ResultCode === '0' && queryData.CallbackMetadata && queryData.CallbackMetadata.Item) {
      const receiptObj = queryData.CallbackMetadata.Item.find((i: any) => i.Name === "MpesaReceiptNumber");
      receiptNumber = receiptObj?.Value || null;
    }

    return res.status(200).json({
      status: queryData.ResultCode === '0' ? 'Success' : 'Failed',
      details: queryData.ResultDesc || 'No details available',
      resultCode: queryData.ResultCode,
      receiptNumber
    });

  } catch (error: any) {
    console.error('STK Query error:', error);
    
    if (error.response?.data?.errorCode === '500.001.1001') {
      return res.status(200).json({
        status: 'Pending',
        details: 'The transaction is still processing',
        resultCode: '500.001.1001'
      });
    }

    return res.status(200).json({
      status: 'Pending',
      details: 'Status check in progress',
      resultCode: '500.001.1001'
    });
  }
}