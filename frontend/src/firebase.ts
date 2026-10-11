import { getApp, getApps, initializeApp } from "@firebase/app";
import { getAnalytics, isSupported, type Analytics } from "@firebase/analytics";

let analyticsPromise: Promise<Analytics | null> | undefined;

export function initializeFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsPromise) return analyticsPromise;

  analyticsPromise = (async () => {
    const config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    };
    if (!config.apiKey || !config.projectId || !config.appId || !config.measurementId) {
      console.warn("Firebase Analytics is not configured. Add the Firebase VITE_* values to frontend/.env.");
      return null;
    }
    if (!(await isSupported())) return null;
    const app = getApps().length ? getApp() : initializeApp(config);
    return getAnalytics(app);
  })().catch((error: unknown) => {
    console.error("Firebase Analytics could not be initialized.", error);
    return null;
  });

  return analyticsPromise;
}
