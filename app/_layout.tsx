import { auth } from "@/lib/firebase";
import { router, Stack } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setReady(true);
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

  if (!ready) return null;

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