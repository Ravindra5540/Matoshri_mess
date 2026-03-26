import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAZaayGQF8rx_z1EPxdQw9OhPTrRmLK4MY",
  authDomain: "mess-management-b803c.firebaseapp.com",
  projectId: "mess-management-b803c",
  storageBucket: "mess-management-b803c.firebasestorage.app",
  messagingSenderId: "205819430047",
  appId: "1:205819430047:web:80bd9cf987ceedbe7b4eaa"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();