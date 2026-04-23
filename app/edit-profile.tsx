import { changePassword, getUserProfile, updateUserProfile } from "@/lib/auth";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

function validatePassword(password: string): string | null {
  if (password.length < 8) return "A password deve ter pelo menos 8 caracteres.";
  if (!/[0-9]/.test(password)) return "A password deve conter pelo menos um número.";
  if (!/[A-Z]/.test(password)) return "A password deve conter pelo menos uma letra maiúscula.";
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return "A password deve conter pelo menos um caractere especial.";
  return null;
}

function checkPostalCode(postalCode: string): boolean {
  const cleaned = postalCode.replace(/\s/g, "").replace("-", "");
  return cleaned.substring(0, 4) === "3060";
}

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordChecks = [
    { label: "Mínimo 8 caracteres", ok: newPassword.length >= 8 },
    { label: "Pelo menos um número", ok: /[0-9]/.test(newPassword) },
    { label: "Pelo menos uma letra maiúscula", ok: /[A-Z]/.test(newPassword) },
    { label: "Pelo menos um caractere especial", ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) },
  ];

  useEffect(() => {
    getUserProfile().then((profile) => {
      setName(profile.name);
      setPhone(profile.phone);
      setAddress(profile.address);
      setPostalCode(profile.postalCode);
      setLoading(false);
    }).catch(() => {
      Alert.alert("Erro", "Não foi possível carregar o perfil.");
      router.back();
    });
  }, []);

  async function handleSaveProfile() {
    if (!name.trim()) { Alert.alert("Erro", "O nome é obrigatório."); return; }
    if (!phone.trim()) { Alert.alert("Erro", "O telemóvel é obrigatório."); return; }
    if (!address.trim()) { Alert.alert("Erro", "A morada é obrigatória."); return; }
    if (!postalCode.trim()) { Alert.alert("Erro", "O código postal é obrigatório."); return; }

    const resident = checkPostalCode(postalCode.trim());

    setSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        postalCode: postalCode.trim(),
        isResidentOfCantanhede: resident,
      });
      Alert.alert("Sucesso", "Perfil atualizado com sucesso.");
    } catch (e: any) {
      Alert.alert("Erro", e?.message ?? "Não foi possível atualizar o perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword.trim()) { Alert.alert("Erro", "Introduz a password atual."); return; }
    const passwordError = validatePassword(newPassword);
    if (passwordError) { Alert.alert("Erro", passwordError); return; }
    if (newPassword !== confirmPassword) { Alert.alert("Erro", "As passwords não coincidem."); return; }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Sucesso", "Password alterada com sucesso.");
    } catch (e: any) {
      Alert.alert("Erro", "Password atual incorreta ou sessão expirada.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
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
        <Text style={styles.sectionTitle}>Dados do perfil</Text>

        <TextInput
          placeholder="Nome completo"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
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
          placeholder="Morada"
          placeholderTextColor="#999"
          value={address}
          onChangeText={setAddress}
          style={styles.input}
        />
        <TextInput
          placeholder="Código postal (ex: 3060-100)"
          placeholderTextColor="#999"
          value={postalCode}
          onChangeText={setPostalCode}
          style={styles.input}
        />

        {postalCode.trim().length > 0 && (
          checkPostalCode(postalCode) ? (
            <Text style={styles.postalOk}>✓ Código postal de Cantanhede</Text>
          ) : (
            <Text style={styles.postalFail}>⚠ Código postal fora de Cantanhede</Text>
          )
        )}

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>GUARDAR PERFIL</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Alterar password</Text>

        <TextInput
          placeholder="Password atual"
          placeholderTextColor="#999"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          style={styles.input}
        />
        <TextInput
          placeholder="Nova password"
          placeholderTextColor="#999"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          style={styles.input}
        />

        {newPassword.length > 0 && (
          <View style={styles.requirementsBox}>
            {passwordChecks.map((check) => (
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
        )}

        <TextInput
          placeholder="Confirmar nova password"
          placeholderTextColor="#999"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          style={styles.input}
        />

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleChangePassword}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>ALTERAR PASSWORD</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 12,
    paddingBottom: 60,
    backgroundColor: "#f5f5f5",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
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
  postalOk: { fontSize: 12, color: "#388E3C", fontWeight: "600" },
  postalFail: { fontSize: 12, color: "#F57C00" },
  requirementsBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },
  checkIconOk: { backgroundColor: "#388E3C" },
  checkIconText: { fontSize: 11, color: "#fff", fontWeight: "700" },
  checkLabel: { fontSize: 12, color: "#999" },
  checkLabelOk: { color: "#388E3C", fontWeight: "600" },
  button: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: { backgroundColor: "#90CAF9" },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});