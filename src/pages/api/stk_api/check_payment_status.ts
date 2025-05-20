// src/pages/api/stk_api/check_payment_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

type PaymentStatus = {
  timestamp: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Cancelled';
  details: any;
  resultCode?: string;
};

const tmpDir = path.join(process.cwd(), 'tmp', 'logs');
const statusPath = path.join(tmpDir, 'payment_statuses.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { checkout_id, force_query } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkout_id || typeof checkout_id !== 'string') {
    return res.status(400).json({ error: 'Invalid checkout_id' });
  }

  try {
    // Initialize default response
    const defaultResponse = { 
      status: 'Pending' as const, 
      details: 'Waiting for payment confirmation',
      resultCode: '500.001.1001' // Default pending code
    };

    // Check if status file exists
    if (!fs.existsSync(statusPath)) {
      if (force_query === 'true') {
        return await queryStkStatus(checkout_id, res);
      }
      return res.status(200).json(defaultResponse);
    }

    // Read and parse status file
    const rawData = fs.readFileSync(statusPath, 'utf-8');
    const statuses: Record<string, PaymentStatus> = JSON.parse(rawData);
    const result = statuses[checkout_id];

    // If we have a result and it's not pending, return it immediately
    if (result && result.status !== 'Pending') {
      return res.status(200).json(result);
    }

    // If force_query is true or we don't have a result, perform STK query
    if (force_query === 'true' || !result) {
      return await queryStkStatus(checkout_id, res);
    }

    // Otherwise return the pending status
    return res.status(200).json(result || defaultResponse);

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
    
    // Determine status based on ResultCode
    let status: PaymentStatus['status'] = 'Pending';
    if (queryData.ResultCode === '0') {
      status = 'Success';
    } else if (queryData.ResultCode === '1032') {
      status = 'Cancelled';
    } else if (queryData.ResultCode && queryData.ResultCode !== '0') {
      status = 'Failed';
    }

    // Update status file
    let statuses: Record<string, PaymentStatus> = {};
    if (fs.existsSync(statusPath)) {
      statuses = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
    }

    statuses[checkoutId] = {
      timestamp: new Date().toISOString(),
      status,
      details: queryData.ResultDesc || 'No details available',
      resultCode: queryData.ResultCode
    };

    fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));

    return res.status(200).json(statuses[checkoutId]);

  } catch (error: any) {
    console.error('STK Query error:', error);
    
    // Handle specific M-Pesa error codes
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