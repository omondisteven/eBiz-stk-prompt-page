// pages/api/stk_api/clear_status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Define types for our status and transaction objects
type PaymentStatuses = {
  [key: string]: string; // Allows string keys with string values
};

type TransactionDetails = {
  [key: string]: any; // Allows string keys with any values (or use more specific type)
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
    // Clear status - properly type the statuses object
    let statuses: PaymentStatuses = {};
    if (fs.existsSync(statusPath)) {
      statuses = JSON.parse(fs.readFileSync(statusPath, 'utf-8')) as PaymentStatuses;
      delete statuses[checkout_id]; // Now TypeScript knows this is allowed
      fs.writeFileSync(statusPath, JSON.stringify(statuses, null, 2));
    }

    // Clear transaction details - properly type the transactions object
    let transactions: TransactionDetails = {};
    if (fs.existsSync(transactionDetailsPath)) {
      transactions = JSON.parse(fs.readFileSync(transactionDetailsPath, 'utf-8')) as TransactionDetails;
      delete transactions[checkout_id]; // Now TypeScript knows this is allowed
      fs.writeFileSync(transactionDetailsPath, JSON.stringify(transactions, null, 2));
    }

    return res.status(200).json({ message: 'Status cleared successfully' });
  } catch (error) {
    console.error("Clear status error:", error);
    return res.status(500).json({ message: 'Failed to clear status' });
  }
}