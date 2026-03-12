import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDJKzXA7jaWu-Z29xUKe0GCZZ4uCzQtOkA",
  authDomain: "sos-cantanhede.firebaseapp.com",
  projectId: "sos-cantanhede",
  storageBucket: "sos-cantanhede.firebasestorage.app",
  messagingSenderId: "684104116676",
  appId: "1:684104116676:web:23284a418c8abc6fb55c91",
  measurementId: "G-SKQ67L6Y4H",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);