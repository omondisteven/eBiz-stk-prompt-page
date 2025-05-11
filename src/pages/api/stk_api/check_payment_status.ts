// /src/pages/api/stk_api/check_payment_status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import db from '@/lib/db';

type Status = 'Pending' | 'Success' | 'Failed' | 'Cancelled' | 'Timeout' | 'NotFound';

interface QueryParams {
  phone?: string;
  account?: string;
  checkoutRequestId?: string;
}

interface DatabaseResult {
  status: Status;
  is_expired: number; // SQLite returns 0 or 1 for boolean
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    const { phone, account, checkoutRequestId } = req.query as QueryParams;

    // Validate required parameters
    if (!checkoutRequestId && (!phone || !account)) {
      return res.status(400).json({
        success: false,
        message: 'Either (phone and account) or checkoutRequestId must be provided'
      });
    }

    // Ensure string values (TypeScript safety)
    const safePhone = phone?.toString();
    const safeAccount = account?.toString();
    const safeCheckoutId = checkoutRequestId?.toString();

    // Build query based on available parameters
    let query: string;
    let params: string[];

    if (safeCheckoutId) {
      query = `
        SELECT status, expires_at < datetime('now') as is_expired 
        FROM transactions 
        WHERE checkout_request_id = ?
        LIMIT 1
      `;
      params = [safeCheckoutId];
    } else if (safePhone && safeAccount) {
      query = `
        SELECT status, expires_at < datetime('now') as is_expired 
        FROM transactions 
        WHERE phone = ? AND account = ? 
        ORDER BY created_at DESC 
        LIMIT 1
      `;
      params = [safePhone, safeAccount];
    } else {
      // This should never happen due to earlier validation
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters'
      });
    }

    // Execute query with proper typing
    const row = db.prepare(query).get(...params) as DatabaseResult | undefined;

    if (!row) {
      return res.status(200).json({
        success: true,
        status: 'NotFound' as Status,
        isExpired: false
      });
    }

    // Determine final status (check for expiration if still pending)
    const finalStatus: Status = row.status === 'Pending' && row.is_expired === 1 
      ? 'Timeout' 
      : row.status;

    return res.status(200).json({
      success: true,
      status: finalStatus,
      isExpired: row.is_expired === 1
    });

  } catch (error: unknown) {
    console.error('Payment status check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: errorMessage
    });
  }
}