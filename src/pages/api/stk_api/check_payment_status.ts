// src/pages/api/stk_api/check_payment_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// Import or define your paymentStatuses storage
import { paymentStatuses } from './callback_url';  // Correct import syntax

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { phone, account } = req.query;

  if (!phone || !account) {
    return res.status(400).json({ message: "Phone and account parameters are required" });
  }

  const key = `${phone}-${account}`;
  
  // Check the actual status from callback updates
  const status = paymentStatuses[key] || "Pending";

  return res.status(200).json({ 
    status,
    timestamp: new Date().toISOString() 
  });
}