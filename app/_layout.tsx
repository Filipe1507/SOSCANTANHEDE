import { auth } from "@/lib/firebase";
import { registerForPushNotifications, sendLocalNotification } from "@/lib/notifications";
import { listenToMyReports, Report, ReportStatus } from "@/lib/reports";
import { router, Stack } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, useWindowDimensions, View } from "react-native";

const STATUS_MESSAGES: Record<ReportStatus, { title: string; body: string } | null> = {
  pending: null,
  in_review: {
    title: "Ocorrência em análise",
    body: "A tua ocorrência está a ser analisada pela equipa municipal.",
  },
  resolved: {
    title: "Ocorrência resolvida! ✅",
    body: "A tua ocorrência foi marcada como resolvida. Obrigado pelo reporte!",
  },
  rejected: {
    title: "Ocorrência rejeitada",
    body: "A tua ocorrência foi rejeitada. Podes submeter um novo reporte se necessário.",
  },
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { width } = useWindowDimensions();
  const unsubReportsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const minDelay = new Promise((resolve) => setTimeout(resolve, 2000));

    const unsub = onAuthStateChanged(auth, async (user) => {
      await minDelay;
      const authenticated = !!user && user.emailVerified;
      setIsAuthenticated(authenticated);
      setReady(true);

      if (authenticated && user) {
        // Regista para notificações push
        await registerForPushNotifications(user.uid);

        // Ouve mudanças de estado nas ocorrências do utilizador
        unsubReportsRef.current = listenToMyReports(
          user.uid,
          async (report: Report, oldStatus: ReportStatus) => {
            const message = STATUS_MESSAGES[report.status];
            if (message) {
              await sendLocalNotification(
                message.title,
                `"${report.title}" — ${message.body}`
              );
            }
          }
        );
      } else {
        // Limpa o listener ao fazer logout
        if (unsubReportsRef.current) {
          unsubReportsRef.current();
          unsubReportsRef.current = null;
        }
      }
    });

    return () => {
      unsub();
      if (unsubReportsRef.current) {
        unsubReportsRef.current();
      }
    };
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
          style={[styles.logo, { width: width * 0.7, height: width * 0.7 }]}
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
    marginBottom: 32,
  },
  spinner: {
    marginTop: 8,
  },
});