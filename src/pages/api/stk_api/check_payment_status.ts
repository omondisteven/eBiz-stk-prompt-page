// pages/api/stk_api/check_payment_status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type PaymentStatuses = {
  [key: string]: string;
};

type TransactionDetails = {
  [key: string]: any; // Or use a more specific type for your transaction details
};

const statusPath = path.join(process.cwd(), 'logs', 'payment_statuses.json');
const transactionDetailsPath = path.join(process.cwd(), 'logs', 'transaction_details.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { checkout_id } = req.query;

  if (!checkout_id || typeof checkout_id !== 'string') {
    return res.status(400).json({ message: 'Missing or invalid checkout_id' });
  }

  try {
    // Read payment status
    const statuses: PaymentStatuses = fs.existsSync(statusPath)
      ? JSON.parse(fs.readFileSync(statusPath, 'utf-8'))
      : {};

    const status = statuses[checkout_id] || 'Pending';

    // Read transaction details if they exist
    let transactionDetails = null;
    if (fs.existsSync(transactionDetailsPath)) {
      const allTransactions: TransactionDetails = JSON.parse(
        fs.readFileSync(transactionDetailsPath, 'utf-8')
      );
      transactionDetails = allTransactions[checkout_id] || null;
    }

    return res.status(200).json({ 
      status,
      transactionDetails 
    });
  } catch (error) {
    console.error("Status check error:", error);
    return res.status(500).json({ 
      status: 'Error', 
      message: 'Failed to check status',
      transactionDetails: null
    });
  }
}