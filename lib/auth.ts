import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  // Envia email de verificação
  await sendEmailVerification(cred.user);

  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    email,
    role: "citizen",
    createdAt: serverTimestamp(),
  });

  // Faz logout imediato para forçar login manual
  await signOut(auth);

  return cred.user;
}

export async function loginUser(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logoutUser() {
  await signOut(auth);
}

export async function isAdmin(): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const snap = await getDoc(doc(db, "users", uid));
  
  if (!snap.exists()) return false;
  return snap.data()?.role === "admin";
}

export async function getCurrentUserName(): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) return "Utilizador";
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return "Utilizador";
  return snap.data()?.name ?? "Utilizador";
}

export async function isEmailVerified(): Promise<boolean> {
  return auth.currentUser?.emailVerified ?? false;
}