// src/pages/api/stk_api/get_transaction.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing transaction ID' });
  }

  try {
    const docRef = doc(db, 'transactions', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    return res.status(200).json(docSnap.data());
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}