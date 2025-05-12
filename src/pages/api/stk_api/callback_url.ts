// src/pages/api/stk_api/callback_url.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const mpesaResponse = req.body;

    // Log the response to a file
    const logFilePath = path.join(process.cwd(), 'M_PESAConfirmationResponse.txt');
    fs.appendFileSync(logFilePath, JSON.stringify(mpesaResponse) + '\n');

    res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Confirmation Received Successfully",
    });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
