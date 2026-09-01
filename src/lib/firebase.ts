import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  projectId: "mystical-works-6zp2g",
  appId: "1:399220680591:web:1f699470c2f7f3dad1cdfa",
  apiKey: "AIzaSyBR5DtCHGmxTIfTOQZrK4CwwnIp_xVkvkE",
  authDomain: "mystical-works-6zp2g.firebaseapp.com",
  storageBucket: "mystical-works-6zp2g.firebasestorage.app",
  messagingSenderId: "399220680591",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-catlogodejoyera-a4e17969-60ac-4631-951d-29bbc8a56b28");
export const auth = getAuth(app);
