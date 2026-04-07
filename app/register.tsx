import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { registerUser } from "../lib/auth";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registo</Text>

      {success ? (
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>Conta criada!</Text>
          <Text style={styles.successText}>
            Enviámos um email de verificação para {email}. Verifica a tua caixa de entrada e clica no link antes de fazer login.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.buttonText}>IR PARA O LOGIN</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TextInput
            placeholder="Nome"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
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
            placeholder="Password (mín. 6 caracteres)"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
          <TouchableOpacity
            style={styles.button}
            onPress={async () => {
              setMsg("");
              try {
                await registerUser(name.trim(), email.trim(), password);
                setSuccess(true);
              } catch (e: any) {
                setMsg(e?.message ?? "Erro no registo");
              }
            }}
          >
            <Text style={styles.buttonText}>CRIAR CONTA</Text>
          </TouchableOpacity>
          {!!msg && <Text style={styles.error}>{msg}</Text>}
        </>
      )}
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
  },
  successBox: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2E7D32",
  },
  successText: {
    fontSize: 14,
    color: "#388E3C",
    lineHeight: 20,
  },
});