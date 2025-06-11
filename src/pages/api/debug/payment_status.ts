// import { NextApiRequest, NextApiResponse } from 'next';
// import kv, { getPaymentKey, getCallbackKey } from '../../../lib/kv';

// interface PaymentData {
//   status?: string;
//   details?: string;
//   updatedAt?: string;
// }

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   const { checkout_id } = req.query;

//   if (!checkout_id || typeof checkout_id !== 'string') {
//     return res.status(400).json({ error: 'Invalid checkout_id' });
//   }

//   try {
//     const paymentKey = getPaymentKey(checkout_id);
//     const callbackKey = getCallbackKey(checkout_id);

//     // Get payment data with proper typing
//     const paymentData = (await kv.hgetall(paymentKey)) as PaymentData;

//     // Safely get and parse callback data
//     let callbackData: any = null;
//     const rawCallbackData = await kv.get(callbackKey);
    
//     if (rawCallbackData && typeof rawCallbackData === 'string') {
//       try {
//         callbackData = JSON.parse(rawCallbackData);
//       } catch (e) {
//         console.error('Error parsing callback data:', e);
//         callbackData = rawCallbackData;
//       }
//     }

//     return res.status(200).json({
//       payment: paymentData,
//       callback: callbackData
//     });

//   } catch (error) {
//     console.error('Debug error:', error);
//     return res.status(500).json({ 
//       error: error instanceof Error ? error.message : String(error),
//       message: 'Failed to retrieve debug information'
//     });
//   }
// }