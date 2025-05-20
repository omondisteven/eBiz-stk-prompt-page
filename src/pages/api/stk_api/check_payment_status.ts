// src/pages/api/stk_api/check_payment_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

type PaymentStatus = {
  timestamp: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Cancelled';
  details: any;
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
      details: 'Waiting for payment confirmation' 
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

    // If no result or still pending and force_query is true, perform active query
    if ((!result || result.status === 'Pending') && force_query === 'true') {
      return await queryStkStatus(checkout_id, res);
    }

    // Return the status if found
    if (!result) {
      return res.status(200).json(defaultResponse);
    }

    return res.status(200).json({ 
      status: result.status, 
      details: result.details 
    });

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      status: 'Error',
      details: 'Failed to check status'
    });
  }
}

async function queryStkStatus(checkoutId: string, res: NextApiResponse) {
  try {
    // Generate token
    const auth = Buffer.from(
      `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
    ).toString('base64');

    const tokenResponse = await axios.get(
      `${process.env.MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
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
      `${process.env.MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
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
    
    // Map M-Pesa response codes to our statuses
    let status: 'Pending' | 'Success' | 'Failed' | 'Cancelled' = 'Pending';
    if (queryData.ResultCode === '0') {
      status = 'Success';
    } else if (queryData.ResultCode === '1032') {
      status = 'Cancelled';
    } else if (queryData.ResultCode && queryData.ResultCode !== '0') {
      status = 'Failed';
    }

    return res.status(200).json({
      status,
      details: queryData.ResultDesc || 'No details available'
    });

  } catch (error) {
    console.error('STK Query error:', error);
    return res.status(200).json({
      status: 'Pending',
      details: 'Status check in progress'
    });
  }
}