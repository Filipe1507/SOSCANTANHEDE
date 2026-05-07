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
  
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#FFA000",
  in_review: "#1976D2",
  resolved: "#388E3C",
  rejected: "#D32F2F",
};

const DAYS_UNTIL_HISTORY = 7;

type Tab = "active" | "history";
type FilterStatus = "all" | "pending" | "in_review" | "resolved" | "rejected";

function isOlderThan(report: Report, days: number): boolean {
  if (!report.updatedAt?.toDate) return false;
  const updated = report.updatedAt.toDate();
  const diff = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= days;
}

function formatDate(report: Report): string {
  if (!report.createdAt?.toDate) return "";
  return report.createdAt.toDate().toLocaleDateString("pt-PT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function daysUntilHistory(report: Report): number {
  if (!report.updatedAt?.toDate) return DAYS_UNTIL_HISTORY;
  const updated = report.updatedAt.toDate();
  const diff = (Date.now() - updated.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(DAYS_UNTIL_HISTORY - diff));
}

export default function AdminScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("active");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  async function loadReports() {
    try {
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

  // Ativas — pendentes e em análise (independente do tempo)
  const activeReports = reports.filter(
    (r) => r.status === "pending" || r.status === "in_review"
  );

  // Histórico — resolvidas ou rejeitadas com mais de 7 dias
  const historyReports = reports.filter(
    (r) =>
      (r.status === "resolved" || r.status === "rejected") &&
      isOlderThan(r, DAYS_UNTIL_HISTORY)
  );

  // Recentes — resolvidas/rejeitadas ainda dentro dos 7 dias
  // Aparecem nas ativas para o admin ver o que foi tratado recentemente
  const recentlyClosed = reports.filter(
    (r) =>
      (r.status === "resolved" || r.status === "rejected") &&
      !isOlderThan(r, DAYS_UNTIL_HISTORY)
  );

  const currentList = tab === "active"
    ? [...activeReports, ...recentlyClosed]
    : historyReports;

  const filtered = currentList.filter((r) => {
    if (filterStatus === "all") return true;
    return r.status === filterStatus;
  });

  const stats = {
    pending: activeReports.filter((r) => r.status === "pending").length,
    in_review: activeReports.filter((r) => r.status === "in_review").length,
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
                prev.map((r) => r.id === report.id ? { ...r, status: "in_review" } : r)
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
                prev.map((r) => r.id === report.id ? { ...r, status: "resolved", updatedAt: { toDate: () => new Date() } } : r)
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
                prev.map((r) => r.id === report.id ? { ...r, status: "rejected", updatedAt: { toDate: () => new Date() } } : r)
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
          onRefresh={() => { setRefreshing(true); loadReports(); }}
        />
      }
    >
      {/* Header */}
      <Text style={styles.title}>Painel Admin</Text>

      {/* Estatísticas */}
      <View style={styles.statsRow}>
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
        <View style={[styles.statBox, { borderTopColor: "#D32F2F" }]}>
          <Text style={styles.statNumber}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>Rejeitadas</Text>
        </View>
      </View>

      {/* Abas */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "active" && styles.tabActive]}
          onPress={() => { setTab("active"); setFilterStatus("all"); }}
        >
          <Text style={[styles.tabText, tab === "active" && styles.tabTextActive]}>
            Ativas
            {activeReports.length > 0 && (
              <Text style={styles.tabBadge}> {activeReports.length}</Text>
            )}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "history" && styles.tabActive]}
          onPress={() => { setTab("history"); setFilterStatus("all"); }}
        >
          <Text style={[styles.tabText, tab === "history" && styles.tabTextActive]}>
            Histórico
            {historyReports.length > 0 && (
              <Text style={styles.tabBadge}> {historyReports.length}</Text>
            )}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filtro por estado */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
  {(tab === "active"
    ? ["all", "pending", "in_review"]
    : ["all", "resolved", "rejected"]
  ).map((s) => (
    <TouchableOpacity
      key={s}
      style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
      onPress={() => setFilterStatus(s as FilterStatus)}
    >
      <Text style={[styles.filterChipText, filterStatus === s && styles.filterChipTextActive]}>
        {s === "all" ? "Todos" : s === "pending" ? "Pendente" : s === "in_review" ? "Em análise" : s === "resolved" ? "Resolvida" : "Rejeitada"}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>

      <Text style={styles.resultsText}>
        {filtered.length} ocorrência{filtered.length !== 1 ? "s" : ""}
        {tab === "history" && ` · arquivadas há mais de ${DAYS_UNTIL_HISTORY} dias`}
      </Text>

      {/* Lista */}
      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>{tab === "active" ? "🎉" : "📂"}</Text>
          <Text style={styles.emptyText}>
            {tab === "active"
              ? "Nenhuma ocorrência ativa."
              : `Nenhuma ocorrência no histórico.\nAs ocorrências resolvidas/rejeitadas aparecem aqui após ${DAYS_UNTIL_HISTORY} dias.`}
          </Text>
        </View>
      ) : (
        filtered.map((report) => {
          const isActive = report.status === "pending" || report.status === "in_review";
          const isRecentlyClosed = (report.status === "resolved" || report.status === "rejected")
            && !isOlderThan(report, DAYS_UNTIL_HISTORY);
          const remaining = isRecentlyClosed ? daysUntilHistory(report) : 0;

          return (
            <View key={report.id} style={[
              styles.card,
              tab === "history" && styles.cardHistory,
            ]}>
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
                <Text style={styles.cardDate}>🕐 {formatDate(report)}</Text>
              )}

              {/* Aviso de dias restantes antes de ir para histórico */}
              {isRecentlyClosed && remaining > 0 && (
                <View style={styles.archiveBadge}>
                  <Text style={styles.archiveBadgeText}>
                    📦 Vai para histórico em {remaining} dia{remaining !== 1 ? "s" : ""}
                  </Text>
                </View>
              )}

              {report.imageUrl && (
                <Image
                  source={{ uri: report.imageUrl }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              )}

              {/* Ações — só para pendentes e em análise */}
              {isActive && (
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[
                      styles.reviewBtn,
                      (report.status === "in_review" || actioning === report.id) && styles.btnDisabled,
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
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
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

  // Abas
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: "500", color: "#888" },
  tabTextActive: { color: "#111", fontWeight: "700" },
  tabBadge: { fontSize: 13, color: "#2196F3", fontWeight: "700" },

  // Filtros
  filterRow: { flexGrow: 0 },
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
  resultsText: { fontSize: 12, color: "#999" },

  // Cards
  emptyContainer: { alignItems: "center", paddingTop: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 15, color: "#555", textAlign: "center", lineHeight: 22 },
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
  cardHistory: {
    opacity: 0.85,
    borderLeftWidth: 3,
    borderLeftColor: "#ccc",
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
  archiveBadge: {
    backgroundColor: "#FFF8E1",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  archiveBadgeText: { fontSize: 12, color: "#F57F17", fontWeight: "500" },
  cardImage: { width: "100%", height: 180, borderRadius: 8, marginTop: 4 },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  reviewBtn: {
    flex: 1, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: "#1976D2", alignItems: "center",
  },
  reviewBtnText: { fontSize: 13, fontWeight: "600", color: "#1976D2" },
  rejectBtn: {
    flex: 1, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: "#D32F2F", alignItems: "center",
  },
  rejectBtnText: { fontSize: 13, fontWeight: "600", color: "#D32F2F" },
  resolveBtn: {
    flex: 1, padding: 12, borderRadius: 10,
    backgroundColor: "#388E3C", alignItems: "center",
  },
  resolveBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  btnDisabled: { opacity: 0.5 },
});