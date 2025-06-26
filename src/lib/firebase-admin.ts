// lib/firebase-admin.ts
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string
);

const app = getApps().length === 0
  ? initializeApp({
      credential: cert(serviceAccount),
    })
  : getApps()[0];

  const testFirebase = async () => {
    try {
      const testRef = adminDb.collection('test').doc('connection-test');
      await testRef.set({ test: new Date().toISOString() });
      console.log('Firebase connection test successful');
    } catch (error) {
      console.error('Firebase connection test failed:', error);
    }
  };
  testFirebase();

export const adminDb = getFirestore(app);
