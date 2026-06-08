import * as Sentry from "@sentry/react-native";
import { Stack, router } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Platform, BackHandler, View } from "react-native";
import * as Notifications from "expo-notifications";
import { setBaseUrl, setAuthTokenGetter, useRegisterMyPushToken } from "@workspace/api-client-react";
import { isAuthenticated, getToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/constants";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

if (process.env["EXPO_PUBLIC_SENTRY_DSN"]) {
  Sentry.init({
    dsn: process.env["EXPO_PUBLIC_SENTRY_DSN"],
    enableAutoSessionTracking: true,
    tracesSampleRate: 0.2,
  });
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
    queries: { refetchOnWindowFocus: false, retry: 1 },
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
  const isOnline = useNetworkStatus();

  useEffect(() => {
    setBaseUrl(API_BASE_URL);
    setAuthTokenGetter(async () => getToken());

    // Check token validity on mount
    isAuthenticated().then((ok) => {
      if (!ok) router.replace("/(auth)/login");
    });

    // Push notifications are native-only
    if (Platform.OS !== "web") {
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

  // Android hardware back button — prevent accidental exit on root tabs
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      // Let expo-router handle back navigation; only block if at a root tab
      return false;
    });
    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner visible={!isOnline} />
      <Stack screenOptions={{ headerShown: false }} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RootLayoutInner />
      </QueryClientProvider>
    </ErrorBoundary>
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
    // projectId is injected by EAS into app.json `extra.eas.projectId` after `eas init`.
    // Read it at runtime so the same build works across dev / preview / production.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectId = (global as any).__expoConfig?.extra?.eas?.projectId as string | undefined;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return tokenData.data;
  } catch (err) {
    console.warn("[Push] getExpoPushTokenAsync failed:", err);
    return null;
  }
}
