import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Vite environment variables with safe defaults
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key-placeholder",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "jansetu-gov-ai.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "jansetu-gov-ai",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "jansetu-gov-ai.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:000000000000"
};

let app: FirebaseApp;
let auth: Auth;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  auth = getAuth(app);
} catch (error) {
  console.warn("Firebase client SDK initialization in offline/placeholder mode:", error);
  // Fallback placeholder object if Firebase credentials are unconfigured
  app = {} as FirebaseApp;
  auth = {} as Auth;
}

export { app, auth };
