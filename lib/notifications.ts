import Constants from "expo-constants";

function isExpoGo(): boolean {
  return Constants.appOwnership === "expo";
}

export async function registerForPushNotifications(userId: string): Promise<void> {
  if (isExpoGo()) return;

  const { default: Device } = await import("expo-device");
  const Notifications = await import("expo-notifications");
  const { doc, updateDoc } = await import("firebase/firestore");
  const { db } = await import("./firebase");
  const { Platform } = await import("react-native");

  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("ocorrencias", {
      name: "Ocorrências",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2196F3",
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await updateDoc(doc(db, "users", userId), {
      expoPushToken: token,
    });
  } catch {
    // Ignora silenciosamente
  }
}

export async function sendLocalNotification(
  title: string,
  body: string
): Promise<void> {
  if (isExpoGo()) {
    // No Expo Go mostra um Alert em vez de notificação
    const { Alert } = await import("react-native");
    Alert.alert(title, body);
    return;
  }

  const Notifications = await import("expo-notifications");
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true, data: {} },
      trigger: null,
    });
  } catch {
    // Ignora
  }
}