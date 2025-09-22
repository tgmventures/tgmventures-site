import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Check for API key
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY environment variable')
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "tgmventures.com",
  projectId: "tgm-ventures-site",
  storageBucket: "tgm-ventures-site.appspot.com",
  messagingSenderId: "411860917330",
  appId: "1:411860917330:web:15501bfa6d8b6ff892138b"
}

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)
export const db = getFirestore(app)

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  hd: 'tgmventures.com', // Restrict to @tgmventures.com domain
  auth_type: 'rerequest',
  access_type: 'online'
})
