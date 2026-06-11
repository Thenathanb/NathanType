import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || 'AIzaSyBGuWvy27RlSXBz2pMW08UESsn04SfOdLM',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || 'issueflow-abd60.firebaseapp.com',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || 'issueflow-abd60',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || 'issueflow-abd60.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '910836660636',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              || '1:910836660636:web:16ce9b6f908da15b9cf059',
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID      || 'G-8PZLJ5HBT7',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Analytics only works in browser environments with a measurement ID
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  getAnalytics(app)
}
