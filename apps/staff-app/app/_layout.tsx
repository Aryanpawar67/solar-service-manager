import * as Sentry from "@sentry/react-native";
import { Stack, router } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { setBaseUrl, setAuthTokenGetter, useRegisterPushToken } from "@workspace/api-client-react";
import { isAuthenticated, getToken } from "@/lib/auth";

const API_BASE_URL = process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3000";

if (process.env["EXPO_PUBLIC_SENTRY_DSN"]) {
  Sentry.init({ dsn: process.env["EXPO_PUBLIC_SENTRY_DSN"] });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false },
  },
});

function RootLayoutInner() {
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const registerPushToken = useRegisterPushToken();

  useEffect(() => {
    setBaseUrl(API_BASE_URL);
    setAuthTokenGetter(async () => SecureStore.getItemAsync("auth_token"));

    // Check token validity on mount
    isAuthenticated().then((ok) => {
      if (!ok) router.replace("/(auth)/login");
    });

    // Register for push notifications
    registerForPushNotifications().then((token) => {
      if (token) {
        registerPushToken.mutate({ data: { token } });
      }
    });

    // Handle notification taps → deep link to job detail
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { jobId?: number };
      if (data.jobId) {
        router.push(`/job/${data.jobId}`);
      }
    });

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
