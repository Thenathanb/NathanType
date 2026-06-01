import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBhGc1WTHdgTzG3p3Blx3pg8YL9wRXRoHI",
  authDomain: "nathantype-c2c7f.firebaseapp.com",
  projectId: "nathantype-c2c7f",
  storageBucket: "nathantype-c2c7f.firebasestorage.app",
  messagingSenderId: "716700020714",
  appId: "1:716700020714:web:e78cfb35bee40e81cacc93",
  measurementId: "G-10X41SSQBN"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
