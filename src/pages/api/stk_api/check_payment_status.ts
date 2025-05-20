// src/pages/api/stk_api/check_payment_status.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const tmpDir = path.join(process.cwd(), 'tmp', 'logs');
const statusFile = path.join(tmpDir, 'payment_statuses.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { checkout_id, force_query } = req.query;

  if (!checkout_id || typeof checkout_id !== 'string') {
    return res.status(400).json({ error: "Missing or invalid CheckoutRequestID" });
  }

  try {
    let statusData: any = {};
    if (fs.existsSync(statusFile)) {
      const fileContent = fs.readFileSync(statusFile, 'utf-8');
      statusData = JSON.parse(fileContent);
    }

    const record = statusData[checkout_id];
    if (record) {
      return res.status(200).json(record);
    }

    // Optional: STK Push Query fallback
    if (force_query === "true") {
      // You may call your `stkPushQuery` logic here if needed
      return res.status(200).json({ status: "Pending", details: "Awaiting user action" });
    }

    return res.status(200).json({ status: "Pending", details: "No callback yet" });
  } catch (e) {
    console.error("Check status error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
