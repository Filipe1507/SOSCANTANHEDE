import { Link, router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { loginUser } from "../lib/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

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

      <TouchableOpacity
        style={styles.button}
        onPress={async () => {
          setMsg("");
          try {
            await loginUser(email.trim(), password);
            router.replace("/");
          } catch (e: any) {
            setMsg(e?.message ?? "Erro no login");
          }
        }}
      >
        <Text style={styles.buttonText}>ENTRAR</Text>
      </TouchableOpacity>

      {!!msg && <Text style={styles.error}>{msg}</Text>}

      <Link href="/register">
        <Text style={styles.link}>Não tens conta? Regista-te</Text>
      </Link>
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
  link: {
    color: "#2196F3",
    fontSize: 14,
    marginTop: 4,
  },
});