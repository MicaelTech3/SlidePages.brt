import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyB08qitALH0mNWU4miRttF_qxcuab3d5JU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "slidepages-rbt.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "slidepages-rbt",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "slidepages-rbt.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "793668878879",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:793668878879:web:d0eedb5e72c57955a7cb2a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-FJ3TP30V7T"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let analytics = null;
if (typeof window !== "undefined" && firebaseConfig.measurementId) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase Analytics could not be initialized:", error);
  }
}

export { db, auth, analytics };
export default app;
