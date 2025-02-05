// src/stk_api/callback_url.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const mpesaResponse = req.body;

      // Log the response (adapt logging as needed)
      const logFile = "M_PESAConfirmationResponse.txt"; // Consider a more robust logging solution
      // In a serverless environment, writing to a file directly might not be ideal.
      // Consider using a logging service or database.
      console.log(mpesaResponse); // Example: log to console

      res.status(200).json({
        ResultCode: 0,
        ResultDesc: "Confirmation Received Successfully",
      });
    } catch (error) {
      console.error("Error handling callback:", error);
      res.status(500).json({
        ResultCode: 1, // Or another appropriate error code
        ResultDesc: "Error processing callback",
      });
    }
  } else {
    res.status(405).end(); // Method Not Allowed
  }
}