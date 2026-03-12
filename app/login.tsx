import { Link, router } from "expo-router";
import { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { loginUser } from "../lib/auth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "600" }}>Login</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 12, borderRadius: 8 }}
      />

      <Button
        title="Entrar"
        onPress={async () => {
          setMsg("");
          try {
            await loginUser(email.trim(), password);
            router.replace("/"); // vai para home (tabs)
          } catch (e: any) {
            setMsg(e?.message ?? "Erro no login");
          }
        }}
      />

      {!!msg && <Text style={{ color: "red" }}>{msg}</Text>}

      <Link href="/register">Não tens conta? Regista-te</Link>
    </View>
  );
}