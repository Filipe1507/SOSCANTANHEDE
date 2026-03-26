import { getMyReports, Report } from "@/lib/reports";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STATUS_COLORS: Record<string, string> = {
  pending: "#FFA000",
  in_review: "#1976D2",
  resolved: "#388E3C",
  rejected: "#D32F2F",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  in_review: "Em análise",
  resolved: "Resolvida",
  rejected: "Rejeitada",
};

const CATEGORY_LABELS: Record<string, string> = {
  infraestrutura: "🏗️ Infraestrutura",
  iluminacao: "💡 Iluminação",
  residuos: "🗑️ Resíduos",
  transito: "🚦 Trânsito",
  ambiente: "🌿 Ambiente",
  outro: "❓ Outro",
};

export default function ReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const data = await getMyReports();
      setReports(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
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
            load();
          }}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Minhas Ocorrências</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push("/new-report")}
        >
          <Text style={styles.newBtnText}>+ Nova</Text>
        </TouchableOpacity>
      </View>

      {reports.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyText}>Ainda não tens ocorrências.</Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push("/new-report")}
          >
            <Text style={styles.emptyBtnText}>Criar primeira ocorrência</Text>
          </TouchableOpacity>
        </View>
      ) : (
        reports.map((report) => (
          <TouchableOpacity
            key={report.id}
            style={styles.card}
            onPress={() => router.push(`../report/${report.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardCategory}>
                {CATEGORY_LABELS[report.category] ?? report.category}
              </Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: STATUS_COLORS[report.status] ?? "#999" },
                ]}
              >
                <Text style={styles.badgeText}>
                  {STATUS_LABELS[report.status] ?? report.status}
                </Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>{report.title}</Text>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {report.description}
            </Text>
            {report.location?.address && (
              <Text style={styles.cardLocation}>
                📍 {report.location.address}
              </Text>
            )}
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111" },
  newBtn: {
    backgroundColor: "#2196F3",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  newBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, color: "#666" },
  emptyBtn: {
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: "#2196F3",
  },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    gap: 6,
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
  cardCategory: { fontSize: 12, color: "#666" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, color: "#fff", fontWeight: "600" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111" },
  cardDescription: { fontSize: 13, color: "#555", lineHeight: 18 },
  cardLocation: { fontSize: 12, color: "#888" },
});