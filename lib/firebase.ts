import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJKzXA7jaWu-Z29xUKe0GCZZ4uCzQtOkA",
  authDomain: "sos-cantanhede.firebaseapp.com",
  projectId: "sos-cantanhede",
  storageBucket: "sos-cantanhede.firebasestorage.app",
  messagingSenderId: "684104116676",
  appId: "1:684104116676:web:23284a418c8abc6fb55c91",
};

// Inicializa a app apenas uma vez
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Inicializa o Auth sempre com persistência — apenas uma vez
let auth: ReturnType<typeof initializeAuth>;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e: any) {
  // Se já foi inicializado (hot reload), usa o existente
  const { getAuth } = require("firebase/auth");
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);