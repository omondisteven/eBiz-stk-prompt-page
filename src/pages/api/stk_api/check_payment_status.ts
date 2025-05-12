// src/pages/api/stk_api/check_payment_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';

// Simulated temporary memory store
let mockConfirmedNumbers: Record<string, boolean> = {};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const { phone, account } = req.query;

  // Simulate a success randomly after some time (for demo)
  if (Math.random() > 0.7) {
    mockConfirmedNumbers[`${phone}-${account}`] = true;
  }

  if (mockConfirmedNumbers[`${phone}-${account}`]) {
    return res.status(200).json({ status: "Success" });
  } else {
    return res.status(200).json({ status: "Pending" });
  }
}
