import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { registerUser } from "../lib/auth";

function validatePassword(password: string): string | null {
  if (password.length < 8) return "A password deve ter pelo menos 8 caracteres.";
  if (!/[0-9]/.test(password)) return "A password deve conter pelo menos um número.";
  if (!/[A-Z]/.test(password)) return "A password deve conter pelo menos uma letra maiúscula.";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return "A password deve conter pelo menos um caractere especial (!@#$%...).";
  return null;
}

async function checkPostalCode(postalCode: string): Promise<boolean> {
  try {
    const cleaned = postalCode.replace(/\s/g, "").replace("-", "");
    const prefix = cleaned.substring(0, 4);
    if (prefix === "3060") return true;

    const url = "https://nominatim.openstreetmap.org/search?postalcode=" + postalCode.trim() + "&country=Portugal&format=json&addressdetails=1&limit=1";
    const response = await fetch(url, { headers: { "Accept-Language": "pt" } });
    const data = await response.json();
    if (!data || data.length === 0) return false;
    const addr = data[0]?.address ?? {};
    const fields = [
      addr.county ?? "",
      addr.municipality ?? "",
      addr.city ?? "",
      addr.town ?? "",
      addr.village ?? "",
      addr.state_district ?? "",
    ].map((f) => f.toLowerCase());
    return fields.some((f) => f.includes("cantanhede"));
  } catch {
    return false;
  }
}

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isCantanhede, setIsCantanhede] = useState<boolean | null>(null);
  const [checkingPostal, setCheckingPostal] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const checks = [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "Pelo menos um número", ok: /[0-9]/.test(password) },
    { label: "Pelo menos uma letra maiúscula", ok: /[A-Z]/.test(password) },
    { label: "Pelo menos um caractere especial (!@#$%...)", ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];

  async function handlePostalCodeBlur() {
    if (!postalCode.trim()) {
      setIsCantanhede(null);
      return;
    }
    setCheckingPostal(true);
    const result = await checkPostalCode(postalCode.trim());
    setIsCantanhede(result);
    setCheckingPostal(false);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 30}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
      >
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
            <Text style={styles.sectionLabel}>Dados pessoais</Text>

            <TextInput
              placeholder="Nome completo"
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
              placeholder="Telemóvel"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
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

            <View style={styles.requirementsBox}>
              <Text style={styles.requirementsTitle}>A password deve ter:</Text>
              {checks.map((check) => (
                <View key={check.label} style={styles.checkRow}>
                  <View style={[styles.checkIcon, check.ok && styles.checkIconOk]}>
                    <Text style={styles.checkIconText}>{check.ok ? "✓" : "•"}</Text>
                  </View>
                  <Text style={[styles.checkLabel, check.ok && styles.checkLabelOk]}>
                    {check.label}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionLabel}>Morada</Text>
            <Text style={styles.sectionHint}>
              Se a tua morada for no concelho de Cantanhede, podes submeter ocorrências mesmo estando fora do concelho.
            </Text>

            <TextInput
              placeholder="Morada (ex: Rua Central, 10)"
              placeholderTextColor="#999"
              value={address}
              onChangeText={setAddress}
              style={styles.input}
            />
            <TextInput
              placeholder="Código postal (ex: 3060-100)"
              placeholderTextColor="#999"
              value={postalCode}
              onChangeText={(v) => {
                setPostalCode(v);
                setIsCantanhede(null);
              }}
              onBlur={handlePostalCodeBlur}
              style={styles.input}
            />

            {checkingPostal && (
              <View style={styles.postalRow}>
                <ActivityIndicator size="small" color="#2196F3" />
                <Text style={styles.postalChecking}>A verificar código postal...</Text>
              </View>
            )}

            {isCantanhede === true && (
              <Text style={styles.postalOk}>✓ Código postal reconhecido em Cantanhede</Text>
            )}
            {isCantanhede === false && (
              <Text style={styles.postalFail}>⚠ Código postal fora do concelho de Cantanhede. Poderás submeter ocorrências apenas com localização GPS.</Text>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={async () => {
                setMsg("");
                if (!name.trim()) { setMsg("O nome é obrigatório."); return; }
                if (!email.trim()) { setMsg("O email é obrigatório."); return; }
                if (!phone.trim()) { setMsg("O telemóvel é obrigatório."); return; }
                if (!address.trim()) { setMsg("A morada é obrigatória."); return; }
                if (!postalCode.trim()) { setMsg("O código postal é obrigatório."); return; }
                if (isCantanhede === null) { setMsg("Aguarda a verificação do código postal."); return; }
                const passwordError = validatePassword(password);
                if (passwordError) { setMsg(passwordError); return; }
                try {
                  await registerUser(
                    name.trim(),
                    email.trim(),
                    password,
                    phone.trim(),
                    address.trim(),
                    postalCode.trim(),
                    isCantanhede === true
                  );
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 12,
    paddingBottom: 60,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111",
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginTop: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: "#777",
    lineHeight: 18,
    marginTop: -6,
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
  requirementsBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
    marginBottom: 2,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  checkIconOk: {
    backgroundColor: "#388E3C",
  },
  checkIconText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "700",
  },
  checkLabel: {
    fontSize: 12,
    color: "#999",
  },
  checkLabelOk: {
    color: "#388E3C",
    fontWeight: "600",
  },
  postalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  postalChecking: {
    fontSize: 12,
    color: "#666",
  },
  postalOk: {
    fontSize: 12,
    color: "#388E3C",
    fontWeight: "600",
  },
  postalFail: {
    fontSize: 12,
    color: "#F57C00",
    lineHeight: 18,
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