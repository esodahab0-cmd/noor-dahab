import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyApMfyAVmICEGFmEVR4N1Z2nwlxmcG1P2c",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "planning-with-ai-7364c.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "planning-with-ai-7364c",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "planning-with-ai-7364c.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "809885723603",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:809885723603:web:ad343ba694263e75fa5d26"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with robust Long-Polling fallback
// يمنع تحذيرات 10 ثوانٍ وانقطاع WebChannel في المتصفحات والشبكات المقيدة
let db: any;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  db = getFirestore(app);
}

const storage = getStorage(app);

export { app, db, storage };