// src/pages/api/stk_api/check_payment_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const storagePath = path.join(process.cwd(), 'tmp', 'paymentStatuses.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { phone, account } = req.query;

  if (!phone || !account) {
    return res.status(400).json({ message: "Phone and account parameters are required" });
  }

  try {
    const statuses = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
    const key = `${phone}-${account}`;
    const status = statuses[key] || "Pending";

    console.log(`Status check for ${key}: ${status}`);
    
    return res.status(200).json({ 
      status,
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(200).json({
      status: "Pending",
      timestamp: new Date().toISOString()
    });
  }
}