import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA8zEvYKW6X2Cw3NzqU9zf1H37Tz-zWx-4",
  authDomain: "shortwave-ut.firebaseapp.com",
  projectId: "shortwave-ut",
  storageBucket: "shortwave-ut.firebasestorage.app",
  messagingSenderId: "1074232606689",
  appId: "1:1074232606689:web:c519e44b44807eb27f5ca0",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
await setPersistence(auth, browserLocalPersistence);
