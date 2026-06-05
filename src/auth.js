import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, getIdToken } from 'firebase/auth'

const firebaseConfig = {
    apiKey:     import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId:      import.meta.env.VITE_FIREBASE_APP_ID,
}

const app  = initializeApp(firebaseConfig)
export const auth = getAuth(app)
const provider = new GoogleAuthProvider()

export async function loggaIn() {
    return signInWithPopup(auth, provider)
}

export async function loggaUt() {
    return signOut(auth)
}

export function onAuth(callback) {
    return onAuthStateChanged(auth, callback)
}

export async function hämtaToken() {
    const user = auth.currentUser
    if (!user) return null
    return getIdToken(user)
}
