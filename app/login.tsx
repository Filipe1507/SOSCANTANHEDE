import { router } from "expo-router";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { loginUser } from "../lib/auth";
import { auth } from "../lib/firebase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const [resetVisible, setResetVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetMsgType, setResetMsgType] = useState<"error" | "success">("error");
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  async function handleLogin() {
    setMsg("");
    try {
      await loginUser(email.trim(), password);

      if (!auth.currentUser?.emailVerified) {
        await signOut(auth);
        setMsg(
          "Email ainda não verificado. Verifica a tua caixa de entrada e clica no link enviado."
        );
        return;
      }

      router.replace("/");
    } catch (e: any) {
      setMsg(e?.message ?? "Erro no login");
    }
  }

  async function handleResetPassword() {
    setResetMsg("");
    const trimmed = resetEmail.trim();

    if (!trimmed) {
      setResetMsg("Introduz o teu email.");
      setResetMsgType("error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setResetMsg("Introduz um email válido.");
      setResetMsgType("error");
      return;
    }

    setResetting(true);
    try {
      await sendPasswordResetEmail(auth, trimmed);
      setResetMsg(
        `Email de recuperação enviado para ${trimmed}. Verifica a tua caixa de entrada.`
      );
      setResetMsgType("success");
      setResetDone(true);
    } catch (e: any) {
      if (
        e.code === "auth/user-not-found" ||
        e.code === "auth/invalid-email"
      ) {
        setResetMsg("Não existe nenhuma conta associada a este email.");
        setResetMsgType("error");
      } else {
        setResetMsg("Não foi possível enviar o email. Tenta novamente.");
        setResetMsgType("error");
      }
    } finally {
      setResetting(false);
    }
  }

  function closeResetModal() {
    setResetVisible(false);
    setResetEmail("");
    setResetMsg("");
    setResetDone(false);
    setResetting(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>ENTRAR</Text>
      </TouchableOpacity>

      {!!msg && <Text style={styles.error}>{msg}</Text>}

      <TouchableOpacity onPress={() => setResetVisible(true)}>
        <Text style={styles.forgotPassword}>Esqueci a password</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={styles.link}>Não tens conta? Regista-te</Text>
      </TouchableOpacity>

      {/* Modal de recuperação de password */}
      <Modal
        visible={resetVisible}
        transparent
        animationType="fade"
        onRequestClose={closeResetModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeResetModal}
        >
          <TouchableOpacity
            style={styles.modalCard}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Recuperar password</Text>
              <TouchableOpacity onPress={closeResetModal}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {!resetDone ? (
              <>
                <Text style={styles.modalSubtitle}>
                  Introduz o email associado à tua conta e enviamos um link para recuperares a password.
                </Text>

                <TextInput
                  placeholder="O teu email"
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={resetEmail}
                  onChangeText={(t) => {
                    setResetEmail(t);
                    setResetMsg("");
                  }}
                  style={styles.modalInput}
                  autoFocus
                />

                {!!resetMsg && (
                  <View style={[
                    styles.msgBox,
                    resetMsgType === "error" ? styles.msgBoxError : styles.msgBoxSuccess,
                  ]}>
                    <Text style={[
                      styles.msgText,
                      resetMsgType === "error" ? styles.msgTextError : styles.msgTextSuccess,
                    ]}>
                      {resetMsgType === "error" ? "⚠️" : "✅"} {resetMsg}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.modalButton, resetting && styles.modalButtonDisabled]}
                  onPress={handleResetPassword}
                  disabled={resetting}
                >
                  {resetting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonText}>Enviar link de recuperação</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={closeResetModal}>
                  <Text style={styles.modalCancel}>Cancelar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.successContainer}>
                  <Text style={styles.successEmoji}>✉️</Text>
                  <Text style={styles.successTitle}>Email enviado!</Text>
                  <Text style={styles.successText}>{resetMsg}</Text>
                </View>

                <TouchableOpacity style={styles.modalButton} onPress={closeResetModal}>
                  <Text style={styles.modalButtonText}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    gap: 12,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#fff",
    fontSize: 15,
    color: "#111",
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  error: {
    color: "red",
    fontSize: 13,
    lineHeight: 18,
  },
  forgotPassword: {
    color: "#2196F3",
    fontSize: 14,
    textAlign: "center",
  },
  link: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  modalClose: {
    fontSize: 18,
    color: "#999",
    paddingLeft: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
    fontSize: 15,
    color: "#111",
  },
  msgBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  msgBoxError: {
    backgroundColor: "#FFF3F3",
    borderColor: "#FFCDD2",
  },
  msgBoxSuccess: {
    backgroundColor: "#F1F8E9",
    borderColor: "#C5E1A5",
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgTextError: {
    color: "#C62828",
  },
  msgTextSuccess: {
    color: "#2E7D32",
  },
  modalButton: {
    backgroundColor: "#2196F3",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtonDisabled: {
    backgroundColor: "#90CAF9",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  modalCancel: {
    color: "#999",
    fontSize: 14,
    textAlign: "center",
  },
  successContainer: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  successEmoji: {
    fontSize: 48,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  successText: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    lineHeight: 20,
  },
});