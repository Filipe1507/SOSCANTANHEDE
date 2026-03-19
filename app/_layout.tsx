import { router, Stack } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../lib/firebase";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setReady(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!ready) return;
    router.replace("/login");
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      <Stack.Screen name="new-report" options={{ title: "Nova Ocorrência" }} />
    </Stack>
  );
}