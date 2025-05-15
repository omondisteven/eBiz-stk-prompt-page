import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

type PaymentStatus = {
  timestamp: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Cancelled';
  details: any;
};

const tmpDir = path.join(process.cwd(), 'tmp', 'logs');
const statusPath = path.join(tmpDir, 'payment_statuses.json');

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { checkout_id, mobile } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!checkout_id || typeof checkout_id !== 'string') {
    console.warn('Invalid or missing checkout_id:', checkout_id);
    return res.status(400).json({ error: 'Invalid checkout_id' });
  }

  if (mobile === 'true') {
    console.log('Mobile status check for:', checkout_id);
  }

  try {
    // Initialize default response
    const defaultResponse = { 
      status: 'Pending' as const, 
      details: [] 
    };

    // Check if status file exists
    if (!fs.existsSync(statusPath)) {
      return res.status(200).json(defaultResponse);
    }

    // Read and parse status file
    const rawData = fs.readFileSync(statusPath, 'utf-8');
    const statuses: Record<string, PaymentStatus> = JSON.parse(rawData);

    // Return the status if found
    const result = statuses[checkout_id];
    if (!result) {
      return res.status(200).json(defaultResponse);
    }

    return res.status(200).json({ 
      status: result.status, 
      details: result.details 
    });

  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      status: 'Error',
      details: 'Failed to check status'
    });
  }
}