import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD_KiH36-csZFfJv55VL03lqKul6qtJTJY",
  authDomain: "joyeria-c5fb4.firebaseapp.com",
  projectId: "joyeria-c5fb4",
  storageBucket: "joyeria-c5fb4.firebasestorage.app",
  messagingSenderId: "963629510788",
  appId: "1:963629510788:web:a45927cce8ee415f6e52d1",
  measurementId: "G-6S8NDW7QVM"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence).catch(console.error);
