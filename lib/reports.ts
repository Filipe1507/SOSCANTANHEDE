import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

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
  userName?: string;
  createdAt?: any;
  updatedAt?: any;
  imageUrl?: string | null;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
  } | null;
};

type CreateReportInput = {
  title: string;
  description: string;
  category: ReportCategory;
  imageUrl?: string | null;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
  } | null;
};

export async function createReport(data: CreateReportInput): Promise<string> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Utilizador não autenticado.");
  if (!data.title.trim()) throw new Error("O título é obrigatório.");
  if (!data.description.trim()) throw new Error("A descrição é obrigatória.");

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
  if (!uid) return [];

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

// Para o mapa — exclui resolvidas e rejeitadas, máximo 50
export async function getAllReports(): Promise<Report[]> {
  const q = query(
    collection(db, "reports"),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  const snap = await getDocs(q);

  return snap.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Report, "id">),
    }))
    .filter((r) => r.status !== "resolved" && r.status !== "rejected");
}

// Para o painel de admin — só pendentes e em revisão
export async function getPendingReports(): Promise<Report[]> {
  const q = query(
    collection(db, "reports"),
    where("status", "in", ["pending", "in_review"]),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Report, "id">),
  }));
}

// Para o painel de admin — TODAS as ocorrências com nome do utilizador
export async function getAllReportsAdmin(): Promise<Report[]> {
  const q = query(
    collection(db, "reports"),
    orderBy("createdAt", "desc")
  );

  const snap = await getDocs(q);
  const reports = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Report, "id">),
  }));

  // Buscar nomes dos utilizadores
  const userIds = [...new Set(reports.map((r) => r.userId))];
  const userNames: Record<string, string> = {};

  await Promise.all(
    userIds.map(async (uid) => {
      try {
        const userSnap = await getDoc(doc(db, "users", uid));
        if (userSnap.exists()) {
          userNames[uid] = userSnap.data().name ?? "Utilizador";
        }
      } catch {
        userNames[uid] = "Utilizador";
      }
    })
  );

  return reports.map((r) => ({
    ...r,
    userName: userNames[r.userId] ?? "Utilizador",
  }));
}

export async function resolveReport(reportId: string): Promise<void> {
  await updateDoc(doc(db, "reports", reportId), {
    status: "resolved" as ReportStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function rejectReport(reportId: string): Promise<void> {
  await updateDoc(doc(db, "reports", reportId), {
    status: "rejected" as ReportStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function setInReview(reportId: string): Promise<void> {
  await updateDoc(doc(db, "reports", reportId), {
    status: "in_review" as ReportStatus,
    updatedAt: serverTimestamp(),
  });
}