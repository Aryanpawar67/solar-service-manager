import * as Sentry from "@sentry/react-native";
import { Stack, router } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { setBaseUrl, setAuthTokenGetter, useRegisterMyPushToken } from "@workspace/api-client-react";
import { isAuthenticated, getToken } from "@/lib/auth";

const API_BASE_URL = process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3000";

if (process.env["EXPO_PUBLIC_SENTRY_DSN"]) {
  Sentry.init({ dsn: process.env["EXPO_PUBLIC_SENTRY_DSN"] });
}

// Notification handler only makes sense on native
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false },
  },
});

/** Route a notification tap to the correct screen based on the data payload. */
function handleNotificationDeepLink(data: Record<string, unknown>) {
  const screen = data.screen as string | undefined;
  if (screen === "customer-service-detail" && data.serviceId) {
    router.push(`/(customer)/services/${data.serviceId}`);
  } else if (data.jobId) {
    router.push(`/job/${data.jobId}`);
  }
}

function RootLayoutInner() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const registerPushToken = useRegisterMyPushToken();

  useEffect(() => {
    setBaseUrl(API_BASE_URL);
    setAuthTokenGetter(async () => getToken());

    // Check token validity on mount
    isAuthenticated().then((ok) => {
      if (!ok) router.replace("/(auth)/login");
    });

    // Push notifications are native-only
    if (Platform.OS !== "web") {
      // Register for push notifications
      registerForPushNotifications().then((token) => {
        if (token) {
          registerPushToken.mutate(token);
        }
      });

      // Cold-start deep link: app was killed and opened via notification tap
      Notifications.getLastNotificationResponseAsync().then((response) => {
        if (response) {
          const data = response.notification.request.content.data as Record<string, unknown>;
          handleNotificationDeepLink(data);
        }
      });

      // Warm/foreground deep link: app was backgrounded and notification was tapped
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, unknown>;
        handleNotificationDeepLink(data);
      });
    }

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutInner />
    </QueryClientProvider>
  );
}

async function registerForPushNotifications(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    return null;
  }
}
