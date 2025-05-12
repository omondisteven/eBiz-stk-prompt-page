// pages/api/stk_api/check_payment_status.ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const statusPath = path.join(process.cwd(), 'logs', 'payment_statuses.json');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { phone, account } = req.query;
  
  if (!phone || !account) {
    return res.status(400).json({ 
      message: 'Missing phone or account parameters' 
    });
  }

  try {
    const rawData = fs.existsSync(statusPath) 
      ? fs.readFileSync(statusPath, 'utf-8')
      : '{}';
    
    const statuses = JSON.parse(rawData);
    const key = `${phone}-${account}`;
    const status = statuses[key] || 'Pending';

    console.log(`Status check for ${key}: ${status}`);
    
    return res.status(200).json({
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Status check error:', error);
    return res.status(500).json({
      status: 'Error',
      message: 'Failed to check status'
    });
  }
}