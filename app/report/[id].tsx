import { getMyReports, Report } from "@/lib/reports";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
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

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await getMyReports();
        const found = all.find((r) => r.id === id);
        setReport(found ?? null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Ocorrência não encontrada.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Status banner */}
      <View
        style={[
          styles.statusBanner,
          { backgroundColor: STATUS_COLORS[report.status] ?? "#999" },
        ]}
      >
        <Text style={styles.statusBannerText}>
          {STATUS_LABELS[report.status] ?? report.status}
        </Text>
      </View>

      {/* Categoria */}
      <Text style={styles.category}>
        {CATEGORY_LABELS[report.category] ?? report.category}
      </Text>

      {/* Título */}
      <Text style={styles.title}>{report.title}</Text>

      {/* Descrição */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Descrição</Text>
        <Text style={styles.sectionText}>{report.description}</Text>
      </View>

      {/* Localização */}
      {report.location?.address && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Localização</Text>
          <Text style={styles.sectionText}>📍 {report.location.address}</Text>
        </View>
      )}

      {/* Fotografia */}
      {report.imageUrl && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Fotografia</Text>
          <Image
            source={{ uri: report.imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Data */}
      {report.createdAt?.toDate && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Submetida em</Text>
          <Text style={styles.sectionText}>
            {report.createdAt.toDate().toLocaleDateString("pt-PT", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← Voltar às minhas ocorrências</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f5f5f5",
  },
  notFound: { fontSize: 16, color: "#555" },
  backLink: { fontSize: 15, color: "#2196F3", fontWeight: "600" },
  container: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
    backgroundColor: "#f5f5f5",
  },
  statusBanner: {
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  statusBannerText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  category: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111",
    lineHeight: 30,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 8,
    marginTop: 4,
  },
  backBtn: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  backBtnText: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "600",
  },
});