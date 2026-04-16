import { auth } from "@/lib/firebase";
import { router, Stack } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user && user.emailVerified);

      // Tempo mínimo de 2 segundos para mostrar o splash
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
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#2196F3" style={styles.spinner} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen name="new-report" options={{ title: "Nova Ocorrência" }} />
      <Stack.Screen name="admin" options={{ title: "Painel Admin" }} />
      <Stack.Screen name="report/[id]" options={{ title: "Detalhe" }} />
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
  logo: {
    width: 350,
    height: 350,
    marginBottom: 32,
  },
  spinner: {
    marginTop: 8,
  },
});