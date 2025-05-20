// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD1neC0h2J9qcUpiBFZcI1fx7zgkg12Y_s",
  authDomain: "ebizdb-9042d.firebaseapp.com",
  projectId: "ebizdb-9042d",
  storageBucket: "ebizdb-9042d.firebasestorage.app",
  messagingSenderId: "1004547674536",
  appId: "1:1004547674536:web:8bc3f298af30d45020cd9d",
  measurementId: "G-YMGL338LP2"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export { app, db };