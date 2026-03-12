import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";

export type ReportStatus = "pending" | "in_review" | "resolved" | "rejected";

export type ReportCategory =
  | "infraestrutura"
  | "iluminacao"
  | "residuos"
  | "transito"
  | "ambiente"
  | "outro";

export type Report = {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  userId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  imageUrl?: string | null;
  location?: {
    lat: number;
    lng: number;
  } | null;
};

type CreateReportInput = {
  title: string;
  description: string;
  category: ReportCategory;
  imageUrl?: string | null;
  location?: {
    lat: number;
    lng: number;
  } | null;
};

export async function createReport(data: CreateReportInput): Promise<string> {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("Utilizador não autenticado.");
  }

  if (!data.title.trim()) {
    throw new Error("O título é obrigatório.");
  }

  if (!data.description.trim()) {
    throw new Error("A descrição é obrigatória.");
  }

  const ref = await addDoc(collection(db, "reports"), {
    title: data.title.trim(),
    description: data.description.trim(),
    category: data.category,
    status: "pending" as ReportStatus,
    userId: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    imageUrl: data.imageUrl ?? null,
    location: data.location ?? null,
  });

  return ref.id;
}

export async function getMyReports(): Promise<Report[]> {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    return [];
  }

  const q = query(
    collection(db, "reports"),
    where("userId", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);

  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Report, "id">),
  }));
}