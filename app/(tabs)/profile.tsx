import { getCurrentUserName, isAdmin, logoutUser } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProfileScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    getCurrentUserName().then(setName);
    isAdmin().then(setAdmin);
    setEmail(auth.currentUser?.email ?? "");
  }, []);

  async function handleLogout() {
    Alert.alert("Terminar sessão", "Tens a certeza?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logoutUser();
          router.replace("/login");
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name ? name[0].toUpperCase() : "?"}
          </Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
        {admin && (
          <View style={styles.adminBadge}>
            <Text style={styles.adminBadgeText}>Administrador</Text>
          </View>
        )}
      </View>

      {/* Ações */}
      <View style={styles.section}>
        {admin && (
          <TouchableOpacity
            style={styles.item}
            onPress={() => router.push("/admin")}
          >
            <Text style={styles.itemText}>🛠️ Painel Admin</Text>
            <Text style={styles.itemArrow}>›</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.item}
          onPress={() => router.push("/new-report")}
        >
          <Text style={styles.itemText}>📝 Nova Ocorrência</Text>
          <Text style={styles.itemArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutBtnText}>🚪 Terminar sessão</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  avatarSection: {
    backgroundColor: "#2196F3",
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 32,
    gap: 6,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  avatarText: { fontSize: 32, fontWeight: "700", color: "#fff" },
  name: { fontSize: 20, fontWeight: "700", color: "#fff" },
  email: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  adminBadge: {
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  adminBadgeText: { fontSize: 12, color: "#fff", fontWeight: "600" },
  section: {
    backgroundColor: "#fff",
    marginTop: 24,
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemText: { fontSize: 15, color: "#222" },
  itemArrow: { fontSize: 20, color: "#ccc" },
  logoutBtn: {
    margin: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ffcdd2",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutBtnText: { fontSize: 15, fontWeight: "600", color: "#D32F2F" },
});