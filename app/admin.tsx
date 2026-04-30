import { getAllReports, rejectReport, Report, resolveReport, setInReview } from "@/lib/reports";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CATEGORY_LABELS: Record<string, string> = {
  infraestrutura: "🏗️ Infraestrutura",
  iluminacao: "💡 Iluminação",
  residuos: "🗑️ Resíduos",
  transito: "🚦 Trânsito",
  ambiente: "🌿 Ambiente",
  outro: "❓ Outro",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  in_review: "Em análise",
  resolved: "Resolvida",
  rejected: "Rejeitada",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#FFA000",
  in_review: "#1976D2",
  resolved: "#388E3C",
  rejected: "#D32F2F",
};

type FilterStatus = "all" | "pending" | "in_review" | "resolved" | "rejected";
type FilterCategory = "all" | string;

export default function AdminScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterCategory, setFilterCategory] = useState<FilterCategory>("all");

  async function loadReports() {
    try {
      // getAllReports sem filtro de status para o admin ver tudo
      const data = await getAllReports(true);
      setReports(data);
    } catch {
      Alert.alert("Erro", "Não foi possível carregar as ocorrências.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const filtered = reports.filter((r) => {
    const statusOk = filterStatus === "all" || r.status === filterStatus;
    const categoryOk = filterCategory === "all" || r.category === filterCategory;
    return statusOk && categoryOk;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    in_review: reports.filter((r) => r.status === "in_review").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    rejected: reports.filter((r) => r.status === "rejected").length,
  };

  async function handleSetInReview(report: Report) {
    Alert.alert(
      "Marcar como em análise",
      `Confirmas que estás a analisar "${report.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setActioning(report.id);
            try {
              await setInReview(report.id);
              setReports((prev) =>
                prev.map((r) =>
                  r.id === report.id ? { ...r, status: "in_review" } : r
                )
              );
            } catch {
              Alert.alert("Erro", "Não foi possível atualizar a ocorrência.");
            } finally {
              setActioning(null);
            }
          },
        },
      ]
    );
  }

  async function handleResolve(report: Report) {
    Alert.alert(
      "Marcar como resolvida",
      `Confirmas que "${report.title}" foi resolvida?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setActioning(report.id);
            try {
              await resolveReport(report.id);
              setReports((prev) =>
                prev.map((r) =>
                  r.id === report.id ? { ...r, status: "resolved" } : r
                )
              );
            } catch {
              Alert.alert("Erro", "Não foi possível atualizar a ocorrência.");
            } finally {
              setActioning(null);
            }
          },
        },
      ]
    );
  }

  async function handleReject(report: Report) {
    Alert.alert(
      "Rejeitar ocorrência",
      `Tens a certeza que queres rejeitar "${report.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Rejeitar",
          style: "destructive",
          onPress: async () => {
            setActioning(report.id);
            try {
              await rejectReport(report.id);
              setReports((prev) =>
                prev.map((r) =>
                  r.id === report.id ? { ...r, status: "rejected" } : r
                )
              );
            } catch {
              Alert.alert("Erro", "Não foi possível rejeitar a ocorrência.");
            } finally {
              setActioning(null);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>A carregar ocorrências...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadReports();
          }}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Painel Admin</Text>
      </View>

      {/* Estatísticas */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statBox, { borderTopColor: "#FFA000" }]}>
          <Text style={styles.statNumber}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pendentes</Text>
        </View>
        <View style={[styles.statBox, { borderTopColor: "#1976D2" }]}>
          <Text style={styles.statNumber}>{stats.in_review}</Text>
          <Text style={styles.statLabel}>Em análise</Text>
        </View>
        <View style={[styles.statBox, { borderTopColor: "#388E3C" }]}>
          <Text style={styles.statNumber}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Resolvidas</Text>
        </View>
      </View>

      {/* Filtro por estado */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(["all", "pending", "in_review", "resolved", "rejected"] as FilterStatus[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
            onPress={() => setFilterStatus(s)}
          >
            <Text style={[styles.filterChipText, filterStatus === s && styles.filterChipTextActive]}>
              {s === "all" ? "Todos" : STATUS_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Filtro por categoria */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(["all", "infraestrutura", "iluminacao", "residuos", "transito", "ambiente", "outro"]).map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.filterChip, filterCategory === c && styles.filterChipActive]}
            onPress={() => setFilterCategory(c)}
          >
            <Text style={[styles.filterChipText, filterCategory === c && styles.filterChipTextActive]}>
              {c === "all" ? "Todas" : CATEGORY_LABELS[c]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.resultsText}>
        {filtered.length} ocorrência{filtered.length !== 1 ? "s" : ""}
      </Text>

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyText}>Nenhuma ocorrência encontrada.</Text>
        </View>
      ) : (
        filtered.map((report) => (
          <View key={report.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardCategory}>
                {CATEGORY_LABELS[report.category] ?? report.category}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[report.status] ?? "#999" }]}>
                <Text style={styles.statusText}>
                  {STATUS_LABELS[report.status] ?? report.status}
                </Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>{report.title}</Text>
            <Text style={styles.cardDescription}>{report.description}</Text>

            {report.location?.address && (
              <Text style={styles.cardLocation}>📍 {report.location.address}</Text>
            )}

            {report.createdAt?.toDate && (
              <Text style={styles.cardDate}>
                🕐 {report.createdAt.toDate().toLocaleDateString("pt-PT", {
                  day: "2-digit", month: "2-digit", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </Text>
            )}

            {report.imageUrl && (
              <Image
                source={{ uri: report.imageUrl }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            )}

            {(report.status === "pending" || report.status === "in_review") && (
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[
                    styles.reviewBtn,
                    report.status === "in_review" && styles.btnDisabled,
                    actioning === report.id && styles.btnDisabled,
                  ]}
                  onPress={() => handleSetInReview(report)}
                  disabled={actioning === report.id || report.status === "in_review"}
                >
                  <Text style={styles.reviewBtnText}>Em análise</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rejectBtn, actioning === report.id && styles.btnDisabled]}
                  onPress={() => handleReject(report)}
                  disabled={actioning === report.id}
                >
                  <Text style={styles.rejectBtnText}>✕ Rejeitar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.resolveBtn, actioning === report.id && styles.btnDisabled]}
                  onPress={() => handleResolve(report)}
                  disabled={actioning === report.id}
                >
                  {actioning === report.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.resolveBtnText}>✓ Concluído</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f5f5f5",
  },
  loadingText: { fontSize: 15, color: "#555" },
  header: { gap: 4 },
  title: { fontSize: 24, fontWeight: "700", color: "#111" },
  statsRow: { flexDirection: "row", gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderTopWidth: 3,
    borderTopColor: "#ccc",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: { fontSize: 20, fontWeight: "700", color: "#111" },
  statLabel: { fontSize: 11, color: "#666", marginTop: 2 },
  filterRow: { flexGrow: 0, marginBottom: 4 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#fff",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterChipActive: { backgroundColor: "#2196F3", borderColor: "#2196F3" },
  filterChipText: { fontSize: 13, color: "#555" },
  filterChipTextActive: { color: "#fff", fontWeight: "600" },
  resultsText: { fontSize: 13, color: "#888" },
  emptyContainer: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: "#555", textAlign: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCategory: { fontSize: 13, color: "#555", fontWeight: "500" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, color: "#fff", fontWeight: "600" },
  cardTitle: { fontSize: 17, fontWeight: "700", color: "#111" },
  cardDescription: { fontSize: 14, color: "#444", lineHeight: 20 },
  cardLocation: { fontSize: 12, color: "#777" },
  cardDate: { fontSize: 12, color: "#999" },
  cardImage: { width: "100%", height: 180, borderRadius: 8, marginTop: 4 },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  reviewBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1976D2",
    alignItems: "center",
  },
  reviewBtnText: { fontSize: 13, fontWeight: "600", color: "#1976D2" },
  rejectBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D32F2F",
    alignItems: "center",
  },
  rejectBtnText: { fontSize: 13, fontWeight: "600", color: "#D32F2F" },
  resolveBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#388E3C",
    alignItems: "center",
  },
  resolveBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  btnDisabled: { opacity: 0.5 },
});