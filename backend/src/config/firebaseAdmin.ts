// backend/src/config/firebaseAdmin.ts
// Verifies Firebase ID tokens issued to the mobile app (project thebeaconcentre-40f9a).
// Firebase is auth-only here - no Firestore/Storage reads happen server-side.
import { initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let firebaseApp: App | null = null;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (projectId && clientEmail && privateKey) {
  try {
    firebaseApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // .env files store the key with literal "\n" sequences - restore real newlines.
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('🔥 Firebase Admin: initialized');
  } catch (error) {
    console.error('❌ Firebase Admin: initialization failed', error);
    firebaseApp = null;
  }
} else {
  console.log('⚠️  Firebase Admin: not configured (FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY unset) - end-user auth routes will reject requests');
}

export { firebaseApp };

export const verifyFirebaseIdToken = async (idToken: string) => {
  if (!firebaseApp) {
    throw new Error('Firebase Admin is not configured');
  }
  return getAuth(firebaseApp).verifyIdToken(idToken);
};
