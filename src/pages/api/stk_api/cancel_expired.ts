// // /src/pages/api/stk_api/cancel_expired.ts
// import { NextApiRequest, NextApiResponse } from 'next';
// // import db from '../../../lib/db';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   try {
//     const { phone, account } = req.body;

//     // Using prepared statement for better security
//     const stmt = db.prepare(`
//       UPDATE transactions 
//       SET status = 'Timeout' 
//       WHERE phone = ? AND account = ? AND status = 'Pending'
//       AND datetime(created_at) < datetime('now', '-60 seconds')
//     `);

//     const result = stmt.run(phone, account);
    
//     return res.status(200).json({
//       message: 'Expired transactions updated',
//       changes: result.changes
//     });
//   } catch (error) {
//     console.error('Error canceling expired transactions:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// }