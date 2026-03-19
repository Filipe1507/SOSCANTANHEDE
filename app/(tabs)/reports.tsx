import { getMyReports, Report } from "@/lib/reports";
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

export default function ReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    try {
      setLoading(true);
      const data = await getMyReports();
      setReports(data);
    } catch (error) {
      console.log("Erro ao carregar ocorrências:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.title}>As Minhas Ocorrências</Text>

      <TouchableOpacity style={styles.refreshBtn} onPress={loadReports}>
        <Text style={styles.refreshBtnText}>ATUALIZAR</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.infoText}>A carregar ocorrências...</Text>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.infoText}>Ainda não tens ocorrências registadas.</Text>
        </View>
      ) : (
        reports.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardText}>{item.description}</Text>
            <Text style={styles.cardText}>Estado: {item.status}</Text>
            <Text style={styles.cardText}>Categoria: {item.category ?? "outro"}</Text>
            {item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    backgroundColor: "#f5f5f5",
  },
  container: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    backgroundColor: "#f5f5f5",
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
    marginBottom: 16,
  },
  refreshBtn: {
    backgroundColor: "#2196F3",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  refreshBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
    letterSpacing: 0.5,
  },
  center: {
    alignItems: "center",
    marginTop: 40,
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: "#555",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },
  cardText: {
    fontSize: 14,
    color: "#555",
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 8,
  },
});