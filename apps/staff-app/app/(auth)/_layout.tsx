import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: true }} />
      <Stack.Screen name="reset-password" options={{ headerShown: true }} />
      <Stack.Screen name="register" options={{ headerShown: true }} />
    </Stack>
  );
}
