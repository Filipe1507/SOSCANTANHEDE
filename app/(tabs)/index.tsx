import { auth } from "@/lib/firebase";
import { getAllReports, Report } from "@/lib/reports";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const COLORS = {
  othersPending: "#FF6B00",
  othersReview:  "#1565C0",
  minePending:   "#AD1457",
  mineReview:    "#6A1B9A",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  in_review: "Em análise",
  resolved: "Resolvida",
  rejected: "Rejeitada",
};

const CATEGORY_LABELS: Record<string, string> = {
  infraestrutura: "Infraestrutura",
  iluminacao: "Iluminação",
  residuos: "Resíduos",
  transito: "Trânsito",
  ambiente: "Ambiente",
  outro: "Outro",
};

function getPinColor(report: Report, currentUid: string | undefined): string {
  const isMine = report.userId === currentUid;
  if (isMine) {
    return report.status === "in_review" ? COLORS.mineReview : COLORS.minePending;
  }
  return report.status === "in_review" ? COLORS.othersReview : COLORS.othersPending;
}

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    async function init() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
        const data = await getAllReports();
        setReports(data);
      } catch (error) {
        console.log("Erro ao inicializar mapa:", error);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>A carregar mapa...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        initialRegion={
          location
            ? {
                latitude: location.lat,
                longitude: location.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }
            : {
                latitude: 40.3567,
                longitude: -8.5974,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
        }
      >
        {reports.map((report) => {
          if (!report.location?.lat || !report.location?.lng) return null;
          const color = getPinColor(report, currentUid);

          return (
            <Marker
              key={report.id}
              coordinate={{
                latitude: report.location.lat,
                longitude: report.location.lng,
              }}
              pinColor={color}
              onPress={() => setSelectedReport(report)}
            />
          );
        })}
      </MapView>

      {/* Legenda */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legenda</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.othersPending }]} />
          <Text style={styles.legendText}>Pendente</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.othersReview }]} />
          <Text style={styles.legendText}>Em análise</Text>
        </View>
        <View style={styles.legendDivider} />
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.minePending }]} />
          <Text style={styles.legendText}>Minha (pendente)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.mineReview }]} />
          <Text style={styles.legendText}>Minha (análise)</Text>
        </View>
      </View>

      {/* Botão Nova Ocorrência */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.newReportBtn}
          onPress={() => router.push("/new-report")}
        >
          <Text style={styles.newReportBtnText}>+ Nova Ocorrência</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de detalhe ao clicar num pino */}
      <Modal
        visible={!!selectedReport}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedReport(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedReport(null)}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            {selectedReport && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalCategory}>
                    {CATEGORY_LABELS[selectedReport.category] ?? selectedReport.category}
                  </Text>
                  <View
                    style={[
                      styles.modalBadge,
                      { backgroundColor: getPinColor(selectedReport, currentUid) },
                    ]}
                  >
                    <Text style={styles.modalBadgeText}>
                      {STATUS_LABELS[selectedReport.status] ?? selectedReport.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalTitle}>{selectedReport.title}</Text>
                <Text style={styles.modalDescription}>{selectedReport.description}</Text>

                {selectedReport.location?.address && (
                  <Text style={styles.modalLocation}>
                    {selectedReport.location.address}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedReport(null)}
                >
                  <Text style={styles.modalCloseBtnText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 12,
  },
  loadingText: { fontSize: 15, color: "#555" },
  legend: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 10,
    padding: 10,
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  legendDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 3,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: "#333" },
  bottomBar: {
    position: "absolute",
    bottom: 32,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  newReportBtn: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  newReportBtnText: { fontSize: 16, fontWeight: "600", color: "#111" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
    gap: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#ddd",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalCategory: { fontSize: 13, color: "#666", fontWeight: "500" },
  modalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  modalBadgeText: { fontSize: 11, color: "#fff", fontWeight: "600" },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#111" },
  modalDescription: { fontSize: 14, color: "#444", lineHeight: 20 },
  modalLocation: { fontSize: 13, color: "#777" },
  modalCloseBtn: {
    marginTop: 6,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  modalCloseBtnText: { fontSize: 15, fontWeight: "600", color: "#333" },
});