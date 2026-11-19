import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const envStr = (v: unknown, fallback: string) =>
  typeof v === 'string' && v.trim() ? v.trim() : fallback;

const firebaseConfig = {
  apiKey: envStr(import.meta.env.VITE_FIREBASE_API_KEY, 'demo-api-key'),
  authDomain: envStr(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, 'demo-himasri.firebaseapp.com'),
  projectId: envStr(import.meta.env.VITE_FIREBASE_PROJECT_ID, 'demo-himasri'),
  storageBucket: envStr(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, 'demo-himasri.firebasestorage.app'),
  messagingSenderId: envStr(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, '000000000000'),
  appId: envStr(import.meta.env.VITE_FIREBASE_APP_ID, '1:000000000000:web:demo000000000000'),
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-southeast2');

const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (typeof window !== 'undefined' && recaptchaKey && import.meta.env.VITE_USE_EMULATORS !== 'true') {
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
    isTokenAutoRefreshEnabled: true,
  });
}

let emulatorsConnected = false;

if (import.meta.env.VITE_USE_EMULATORS === 'true' && !emulatorsConnected) {
  emulatorsConnected = true;
  const host = typeof window !== 'undefined' ? window.location.hostname || '127.0.0.1' : '127.0.0.1';
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  connectFunctionsEmulator(functions, host, 5001);
}

export { app };
