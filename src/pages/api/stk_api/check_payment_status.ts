// pages/api/stk_api/check_payment_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import axios, { AxiosError } from 'axios';

// Replace the existing status check with this improved version
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { checkout_id, force_query } = req.query;

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!checkout_id || typeof checkout_id !== 'string') return res.status(400).json({ error: 'Invalid checkout_id' });

  try {
    const docRef = doc(db, 'transactions', checkout_id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Enhanced receipt number extraction
      const receiptNumber = data.receiptNumber || 
                          (Array.isArray(data.details) ? 
                            data.details.find((i: any) => 
                              i?.Name?.toLowerCase().includes('receipt')
                            )?.Value : null);

      const isSuccess = data.status === 'Success' && !!receiptNumber;

      return res.status(200).json({
        status: isSuccess ? 'Success' : data.status || 'Pending',
        details: data.details,
        resultCode: isSuccess ? '0' : data.resultCode || '500.001.1001',
        receiptNumber: receiptNumber?.toString() || null,
      });
    }

    // If not in Firestore and force_query is true, query Safaricom directly
    if (force_query === 'true') {
      return await queryStkStatus(checkout_id, res);
    }

    return res.status(200).json({
      status: 'Pending',
      details: 'Waiting for payment confirmation',
      resultCode: '500.001.1001',
    });
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      status: 'Error',
      details: 'Failed to check status',
      resultCode: '500',
    });
  }
}

// ✅ Helper to extract receipt number robustly from details
function extractReceiptNumber(data: any): string | null {
  const details = data.details;

  if (!Array.isArray(details)) return data.receiptNumber || null;

  const receiptItem = details.find((item: any) =>
    typeof item?.Name === 'string' &&
    /receipt/i.test(item.Name)
  );

  return receiptItem?.Value?.toString() || data.receiptNumber || null;
}

// ✅ Query Safaricom if needed
async function queryStkStatus(checkoutId: string, res: NextApiResponse) {
  try {
    const MPESA_BASE_URL =
      process.env.MPESA_ENVIRONMENT === 'live'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke';

    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const tokenRes = await axios.get(
      `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { authorization: `Basic ${auth}` } }
    );

    const token = tokenRes.data.access_token;
    const now = new Date();
    const timestamp = now.toISOString().replace(/\D/g, '').slice(0, 14);

    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString('base64');

    const queryRes = await axios.post(
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

    const queryData = queryRes.data;

    const metadataItems = queryData.CallbackMetadata?.Item || [];

    let receiptNumber = null;

    const receiptItem = metadataItems.find(
      (i: any) => typeof i?.Name === 'string' && /receipt/i.test(i.Name)
    );

    if (receiptItem) {
      receiptNumber = receiptItem.Value?.toString();
    }

    return res.status(200).json({
      status: queryData.ResultCode === '0' ? 'Success' : 'Failed',
      details: metadataItems,
      resultCode: queryData.ResultCode,
      receiptNumber,
    });

  } catch (error) {
    const axiosError = error as AxiosError;
    console.error('STK query error:', axiosError?.response?.data || axiosError.message || error);
    return res.status(200).json({
      status: 'Pending',
      details: 'Transaction still processing',
      resultCode: '500.001.1001',
    });
  }
}
