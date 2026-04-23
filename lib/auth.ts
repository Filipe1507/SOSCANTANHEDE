import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updatePassword
} from "firebase/auth";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export async function registerUser(
  name: string,
  email: string,
  password: string,
  phone: string,
  address: string,
  postalCode: string,
  isResidentOfCantanhede: boolean
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(cred.user);
  await setDoc(doc(db, "users", cred.user.uid), {
    name,
    email,
    phone,
    address,
    postalCode,
    isResidentOfCantanhede,
    role: "citizen",
    createdAt: serverTimestamp(),
  });
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

export async function isResidentOfCantanhede(): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return false;
  return snap.data()?.isResidentOfCantanhede === true;
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

export async function getUserProfile(): Promise<{
  name: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  isResidentOfCantanhede: boolean;
  role: string;
}> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Não autenticado.");
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) throw new Error("Perfil não encontrado.");
  const data = snap.data();
  return {
    name: data.name ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    address: data.address ?? "",
    postalCode: data.postalCode ?? "",
    isResidentOfCantanhede: data.isResidentOfCantanhede ?? false,
    role: data.role ?? "citizen",
  };
}

export async function updateUserProfile(data: {
  name: string;
  phone: string;
  address: string;
  postalCode: string;
  isResidentOfCantanhede: boolean;
}): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Não autenticado.");
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("Não autenticado.");
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}