import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
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
// Para o mapa — por defeito exclui resolvidas/rejeitadas
// Com admin=true devolve todas para o painel admin
export async function getAllReports(admin = false): Promise<Report[]> {
  const q = query(
    collection(db, "reports"),
    orderBy("createdAt", "desc"),
    limit(admin ? 200 : 50)
  );

  const snap = await getDocs(q);
  const all = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Report, "id">),
  }));

  if (admin) return all;
  return all.filter((r) => r.status !== "resolved" && r.status !== "rejected");
}


// Para o painel de admin
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

// Listener em tempo real das ocorrências do utilizador
// Dispara callback quando alguma muda de estado
export function listenToMyReports(
  userId: string,
  onStatusChange: (report: Report, oldStatus: ReportStatus) => void
): () => void {
  const q = query(
    collection(db, "reports"),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const statusCache: Record<string, ReportStatus> = {};

  const unsub = onSnapshot(q, (snap) => {
    snap.docChanges().forEach((change) => {
      if (change.type === "modified") {
        const report = {
          id: change.doc.id,
          ...(change.doc.data() as Omit<Report, "id">),
        };
        const oldStatus = statusCache[report.id];
        if (oldStatus && oldStatus !== report.status) {
          onStatusChange(report, oldStatus);
        }
        statusCache[report.id] = report.status;
      }
      if (change.type === "added") {
        const report = {
          id: change.doc.id,
          ...(change.doc.data() as Omit<Report, "id">),
        };
        statusCache[report.id] = report.status;
      }
    });
  });

  return unsub;
}