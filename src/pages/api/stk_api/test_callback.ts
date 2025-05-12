// Add this test endpoint to check if your callback URL is publicly accessible
// pages/api/stk_api/test_callback.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Callback test received:', req.method, req.body);
  res.status(200).json({
    ResultCode: 0,
    ResultDesc: "Test successful",
    ReceivedData: req.body
  });
}