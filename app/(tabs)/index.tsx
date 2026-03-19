import { getAllReports, Report } from "@/lib/reports";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

const STATUS_COLORS: Record<string, string> = {
  pending: "#FFA000",
  in_review: "#1976D2",
  resolved: "#388E3C",
  rejected: "#D32F2F",
};

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
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
                // Centro de Cantanhede como fallback
                latitude: 40.3567,
                longitude: -8.5974,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }
        }
      >
              {reports.map((report) =>
        report.location?.lat && report.location?.lng ? (
          <Marker
            key={report.id}
            coordinate={{
              latitude: report.location.lat,
              longitude: report.location.lng,
            }}
            title={report.title}
            description={report.description}
            pinColor={STATUS_COLORS[report.status] ?? "#2196F3"}
          />
        ) : null
      )}
      </MapView>

      {/* Botão Nova Ocorrência */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.newReportBtn}
          onPress={() => router.push("/new-report")}
        >
          <Text style={styles.newReportBtnText}>+ Nova Ocorrência</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: "#555",
  },
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
  newReportBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111",
  },
});