import { auth } from "@/lib/firebase";
import { router, Stack } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";

function BackButton({ label }: { label: string }) {
  return (
    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
      <Text style={styles.backButtonText}>‹ {label}</Text>
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user && user.emailVerified);
      setTimeout(() => setReady(true), 2000);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (isAuthenticated) {
      router.replace("/(tabs)");
    } else {
      router.replace("/login");
    }
  }, [ready, isAuthenticated]);

  if (!ready) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require("../assets/images/splash-icon.png")}
          style={{ width: width * 2, height: height }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="register"
        options={{
          title: "Registo",
          headerLeft: () => <BackButton label="Login" />,
        }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen
        name="new-report"
        options={{
          title: "Nova Ocorrência",
          headerLeft: () => <BackButton label="Mapa" />,
        }}
      />
      <Stack.Screen
        name="admin"
        options={{
          title: "Painel Admin",
          headerLeft: () => <BackButton label="Mapa" />,
        }}
      />
      <Stack.Screen
        name="report/[id]"
        options={{
          title: "Detalhe",
          headerLeft: () => <BackButton label="Ocorrências" />,
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: "Editar Perfil",
          headerLeft: () => <BackButton label="Perfil" />,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  backButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  backButtonText: {
    fontSize: 17,
    color: "#2196F3",
    fontWeight: "500",
  },
});