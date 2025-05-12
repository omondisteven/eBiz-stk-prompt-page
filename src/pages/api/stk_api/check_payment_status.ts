// src/pages/api/stk_api/check_payment_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// Temporary storage for payment statuses
const paymentStatuses: Record<string, string> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const { phone, account } = req.query;

  if (!phone || !account) {
    return res.status(400).json({ message: "Phone and account parameters are required" });
  }

  const key = `${phone}-${account}`;
  
  // In a real implementation, you would check your database or M-Pesa API here
  // For now, we'll simulate different statuses
  if (!paymentStatuses[key]) {
    // Simulate initial pending state
    paymentStatuses[key] = "Pending";
    
    // Simulate eventual status change (in real app, this would come from callback)
    setTimeout(() => {
      const randomStatus = Math.random() > 0.5 ? "Success" : "Cancelled";
      paymentStatuses[key] = randomStatus;
    }, 15000);
  }

  return res.status(200).json({ status: paymentStatuses[key] });
}