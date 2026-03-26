import { getPendingReports, rejectReport, Report, resolveReport } from "@/lib/reports";
import { router } from "expo-router";
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
};

export default function AdminScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);

  async function loadReports() {
    try {
      const data = await getPendingReports();
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

  async function handleResolve(report: Report) {
    Alert.alert(
      "Marcar como resolvida",
      `Confirmas que a ocorrência "${report.title}" foi resolvida?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setActioning(report.id);
            try {
              await resolveReport(report.id);
              setReports((prev) => prev.filter((r) => r.id !== report.id));
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
              setReports((prev) => prev.filter((r) => r.id !== report.id));
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
        <Text style={styles.subtitle}>
          {reports.length === 0
            ? "Sem ocorrências por resolver ✅"
            : `${reports.length} ocorrência${reports.length !== 1 ? "s" : ""} pendente${reports.length !== 1 ? "s" : ""}`}
        </Text>
      </View>

      {reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyText}>Todas as ocorrências foram tratadas!</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Voltar ao mapa</Text>
          </TouchableOpacity>
        </View>
      ) : (
        reports.map((report) => (
          <View key={report.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardCategory}>
                {CATEGORY_LABELS[report.category] ?? report.category}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: STATUS_COLORS[report.status] ?? "#999" },
                ]}
              >
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

            {report.imageUrl && (
              <Image
                source={{ uri: report.imageUrl }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.cardActions}>
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
  header: { gap: 4, marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "700", color: "#111" },
  subtitle: { fontSize: 14, color: "#666" },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: "#555", textAlign: "center" },
  backBtn: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  backBtnText: { fontSize: 15, color: "#333", fontWeight: "500" },
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
  cardImage: { width: "100%", height: 180, borderRadius: 8, marginTop: 4 },
  cardActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  rejectBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D32F2F",
    alignItems: "center",
  },
  rejectBtnText: { fontSize: 14, fontWeight: "600", color: "#D32F2F" },
  resolveBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#388E3C",
    alignItems: "center",
  },
  resolveBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  btnDisabled: { opacity: 0.5 },
});