import { Stack } from "expo-router";

export default function CustomersStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#00450d" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700", fontSize: 15 },
        animation: "slide_from_right",
      }}
    />
  );
}
