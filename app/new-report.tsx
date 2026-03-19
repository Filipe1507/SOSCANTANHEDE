import { createReport, ReportCategory } from "@/lib/reports";
import { uploadImage } from "@/lib/storage";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

const CATEGORIES: { label: string; value: ReportCategory }[] = [
  { label: "🏗️ Infraestrutura", value: "infraestrutura" },
  { label: "💡 Iluminação", value: "iluminacao" },
  { label: "🗑️ Resíduos / Lixo", value: "residuos" },
  { label: "🚦 Trânsito", value: "transito" },
  { label: "🌿 Ambiente", value: "ambiente" },
  { label: "❓ Outro", value: "outro" },
];

const CANTANHEDE: Region = {
  latitude: 40.3567,
  longitude: -8.5974,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

type LocationMode = "gps" | "map" | "manual" | null;

type LocationData = {
  lat?: number;
  lng?: number;
  address?: string;
};

async function getAddressFromCoords(lat: number, lng: number): Promise<string> {
  try {
    const params = "lat=" + lat + "&lon=" + lng + "&format=json&accept-language=pt";
    const url = "https://nominatim.openstreetmap.org/reverse?" + params;

    const response = await fetch(url);
    const data = await response.json();

    if (data && data.address) {
      const a = data.address;

      const full = [
        a.road,
        a.house_number,
        a.village || a.town || a.city || a.county,
        a.municipality || a.state,
      ].filter(Boolean);

      if (full.length > 0) return full.join(", ");

      const partial = [
        a.suburb || a.neighbourhood,
        a.village || a.town || a.city || a.county,
        a.municipality || a.state,
      ].filter(Boolean);

      if (partial.length > 0) return partial.join(", ");

      if (data.display_name) return data.display_name;
    }

    const latStr = lat.toFixed(5);
    const lngStr = lng.toFixed(5);
    return latStr + ", " + lngStr;
  } catch (e) {
    const latStr = lat.toFixed(5);
    const lngStr = lng.toFixed(5);
    return latStr + ", " + lngStr;
  }
}

export default function NewReportScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReportCategory>("outro");
  const [customCategory, setCustomCategory] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [locationMode, setLocationMode] = useState<LocationMode>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [manualAddress, setManualAddress] = useState("");
  const [mapVisible, setMapVisible] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region>(CANTANHEDE);
  const [pinCoords, setPinCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const clearLocation = () => {
    setLocationMode(null);
    setLocation(null);
    setManualAddress("");
    setPinCoords(null);
  };

  const useCurrentLocation = async () => {
    clearLocation();
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão negada", "Não foi possível aceder à localização.");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      const address = await getAddressFromCoords(coords.lat, coords.lng);
      setLocation({ ...coords, address });
      setLocationMode("gps");
    } catch {
      Alert.alert("Erro", "Não foi possível obter a localização.");
    }
  };

  const openMapPicker = async () => {
    clearLocation();
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setMapRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch {
      // fallback para Cantanhede
    }
    setMapVisible(true);
  };

  const confirmMapLocation = async () => {
    if (!pinCoords) {
      Alert.alert("Atenção", "Toca no mapa para colocar o pin no local da ocorrência.");
      return;
    }

    const address = await getAddressFromCoords(
      pinCoords.latitude,
      pinCoords.longitude
    );

    setLocation({
      lat: pinCoords.latitude,
      lng: pinCoords.longitude,
      address,
    });
    setLocationMode("map");
    setMapVisible(false);
  };

  const selectManual = () => {
    clearLocation();
    setLocationMode("manual");
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Permite acesso à galeria.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permissão necessária", "Permite acesso à câmara.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      Alert.alert("Campos em falta", "Preenche o título e a descrição.");
      return;
    }
    if (category === "outro" && !customCategory.trim()) {
      Alert.alert("Campos em falta", "Descreve a categoria.");
      return;
    }

    try {
      setSubmitting(true);
      let imageUrl = null;
      if (image) imageUrl = await uploadImage(image);

      let finalLocation: LocationData | null = null;
      if (locationMode === "manual" && manualAddress.trim()) {
        finalLocation = { address: manualAddress.trim() };
      } else if (location) {
        finalLocation = location;
      }

      await createReport({
        title: title.trim(),
        description: description.trim(),
        category,
        imageUrl,
        location: finalLocation,
      });

      Alert.alert("Sucesso", "Ocorrência criada com sucesso.");
      router.replace("/reports");
    } catch (error) {
      Alert.alert("Erro", String(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nova Ocorrência</Text>

        <TextInput
          placeholder="Título"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />

        <TextInput
          placeholder="Descrição"
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Categoria</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryBtn,
                category === cat.value && styles.categoryBtnActive,
              ]}
              onPress={() => setCategory(cat.value)}
            >
              <Text
                style={[
                  styles.categoryBtnText,
                  category === cat.value && styles.categoryBtnTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {category === "outro" && (
          <TextInput
            placeholder="Descreve a categoria"
            placeholderTextColor="#999"
            value={customCategory}
            onChangeText={setCustomCategory}
            style={styles.input}
          />
        )}

        <Text style={styles.label}>Localização</Text>

        <View style={styles.locationButtons}>
          <TouchableOpacity
            style={[
              styles.locationBtn,
              locationMode === "gps" && styles.locationBtnActive,
            ]}
            onPress={useCurrentLocation}
          >
            <Text
              style={[
                styles.locationBtnText,
                locationMode === "gps" && styles.locationBtnTextActive,
              ]}
            >
              📡 Localização atual
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.locationBtn,
              locationMode === "map" && styles.locationBtnActive,
            ]}
            onPress={openMapPicker}
          >
            <Text
              style={[
                styles.locationBtnText,
                locationMode === "map" && styles.locationBtnTextActive,
              ]}
            >
              🗺️ Escolher no mapa
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.locationBtn,
              locationMode === "manual" && styles.locationBtnActive,
            ]}
            onPress={selectManual}
          >
            <Text
              style={[
                styles.locationBtnText,
                locationMode === "manual" && styles.locationBtnTextActive,
              ]}
            >
              ✏️ Escrever morada
            </Text>
          </TouchableOpacity>
        </View>

        {(locationMode === "gps" || locationMode === "map") && location?.address && (
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText} numberOfLines={2}>
              📍 {location.address}
            </Text>
            <TouchableOpacity onPress={clearLocation}>
              <Text style={styles.locationClear}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {locationMode === "manual" && (
          <TextInput
            placeholder="Ex: Rua Manuel Lopes Porto, Cantanhede"
            placeholderTextColor="#999"
            value={manualAddress}
            onChangeText={setManualAddress}
            style={styles.input}
          />
        )}

        <Text style={styles.label}>Fotografia</Text>
        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
            <Text style={styles.imageBtnText}>📁 Galeria</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.imageBtn} onPress={takePhoto}>
            <Text style={styles.imageBtnText}>📷 Câmara</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <Image
            source={{ uri: image }}
            style={styles.preview}
            resizeMode="cover"
          />
        )}

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? "A submeter..." : "SUBMETER OCORRÊNCIA"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={mapVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Escolhe o local da ocorrência</Text>
          <Text style={styles.modalSubtitle}>
            Toca no mapa para colocar o pin
          </Text>

          <MapView
            style={styles.modalMap}
            provider={PROVIDER_GOOGLE}
            initialRegion={mapRegion}
            showsUserLocation
            onPress={(e) => setPinCoords(e.nativeEvent.coordinate)}
          >
            {pinCoords && (
              <Marker coordinate={pinCoords} pinColor="#2196F3" />
            )}
          </MapView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setMapVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirmBtn}
              onPress={confirmMapLocation}
            >
              <Text style={styles.modalConfirmBtnText}>Confirmar local</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
    paddingBottom: 40,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
    backgroundColor: "#fff",
    fontSize: 15,
    color: "#111",
  },
  textArea: {
    minHeight: 120,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  categoryBtnActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  categoryBtnText: {
    fontSize: 13,
    color: "#444",
  },
  categoryBtnTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  locationButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  locationBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  locationBtnActive: {
    backgroundColor: "#2196F3",
    borderColor: "#2196F3",
  },
  locationBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  locationBtnTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E3F2FD",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#90CAF9",
  },
  locationBadgeText: {
    fontSize: 13,
    color: "#1565C0",
    flex: 1,
  },
  locationClear: {
    fontSize: 16,
    color: "#1565C0",
    paddingLeft: 8,
  },
  imageButtons: {
    flexDirection: "row",
    gap: 12,
  },
  imageBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  imageBtnText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  preview: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  submitBtn: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: {
    backgroundColor: "#90CAF9",
  },
  submitBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    padding: 20,
    paddingBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#777",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  modalMap: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#fff",
  },
  modalCancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  modalCancelBtnText: {
    fontSize: 15,
    color: "#555",
    fontWeight: "600",
  },
  modalConfirmBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#2196F3",
    alignItems: "center",
  },
  modalConfirmBtnText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "700",
  },
});