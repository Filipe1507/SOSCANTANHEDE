import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJKzXA7jaWu-Z29xUKe0GCZZ4uCzQtOkA",
  authDomain: "sos-cantanhede.firebaseapp.com",
  projectId: "sos-cantanhede",
  storageBucket: "sos-cantanhede.firebasestorage.app",
  messagingSenderId: "684104116676",
  appId: "1:684104116676:web:23284a418c8abc6fb55c91",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getApps().length
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

export const db = getFirestore(app);