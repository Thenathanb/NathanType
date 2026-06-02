import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Env vars are injected at build time via GitHub Actions secrets.
// Fallback values keep the site working when secrets aren't configured yet.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            ?? 'AIzaSyBhGc1WTHdgTzG3p3Blx3pg8YL9wRXRoHI',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        ?? 'nathantype-c2c7f.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         ?? 'nathantype-c2c7f',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     ?? 'nathantype-c2c7f.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '716700020714',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             ?? '1:716700020714:web:e78cfb35bee40e81cacc93',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID     ?? 'G-10X41SSQBN',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
