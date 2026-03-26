import { getCurrentUserName, isAdmin, logoutUser } from "@/lib/auth";
import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { router } from "expo-router";
import { Drawer } from "expo-router/drawer";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

function CustomDrawerContent(props: any) {
  const [name, setName] = useState("");
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    getCurrentUserName().then(setName);
    isAdmin().then(setAdmin);
  }, []);

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContainer}>
      {/* Cabeçalho do drawer */}
      <View style={styles.drawerHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {name ? name[0].toUpperCase() : "?"}
          </Text>
        </View>
        <Text style={styles.drawerName}>{name || "..."}</Text>
      </View>

      {/* Itens de navegação */}
      <DrawerItemList {...props} />

      {/* Admin (só aparece se for admin) */}
      {admin && (
        <DrawerItem
          label="🛠️ Painel Admin"
          onPress={() => router.push("/admin")}
          labelStyle={styles.adminLabel}
        />
      )}

      {/* Separador + Logout */}
      <View style={styles.separator} />
      <DrawerItem
        label="🚪 Terminar sessão"
        onPress={async () => {
          await logoutUser();
          router.replace("/login");
        }}
        labelStyle={styles.logoutLabel}
      />
    </DrawerContentScrollView>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerActiveTintColor: "#2196F3",
        drawerInactiveTintColor: "#444",
        headerTintColor: "#111",
        headerStyle: { backgroundColor: "#fff" },
        drawerStyle: { backgroundColor: "#fff" },
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: "Mapa",
          drawerLabel: "🗺️ Mapa",
        }}
      />
      <Drawer.Screen
        name="reports"
        options={{
          title: "Minhas Ocorrências",
          drawerLabel: "📋 Minhas Ocorrências",
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          title: "Perfil",
          drawerLabel: "👤 Perfil",
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    paddingTop: 0,
  },
  drawerHeader: {
    backgroundColor: "#2196F3",
    padding: 24,
    paddingTop: 48,
    paddingBottom: 20,
    marginBottom: 8,
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  drawerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  adminLabel: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "600",
  },
  separator: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: 16,
    marginVertical: 8,
  },
  logoutLabel: {
    fontSize: 14,
    color: "#D32F2F",
    fontWeight: "600",
  },
});