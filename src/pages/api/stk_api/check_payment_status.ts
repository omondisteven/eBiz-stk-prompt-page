// src/pages/api/stk_api/check_payment_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getPaymentStatus } from '@/utils/paymentStatusStore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const { phone, account } = req.query;

  const key = `${phone}-${account}`;
  const status = getPaymentStatus(key);

  return res.status(200).json({ status });
}
