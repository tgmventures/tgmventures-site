import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCNdqeqeJL1W2vP0hpRLuEwYNPXomKkxRo",
  authDomain: "tgm-ventures-site.firebaseapp.com",
  projectId: "tgm-ventures-site",
  storageBucket: "tgm-ventures-site.appspot.com",
  messagingSenderId: "411860917330",
  appId: "1:411860917330:web:8a9f3c1e6b7d4e5f9g2h3i"
}

// Initialize Firebase only if it hasn't been initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const auth = getAuth(app)

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  hd: 'tgmventures.com' // Restrict to @tgmventures.com domain
})
