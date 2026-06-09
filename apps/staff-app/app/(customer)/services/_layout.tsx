import { Stack } from "expo-router";

export default function ServicesStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#16a34a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "700", fontSize: 15 },
        animation: "slide_from_right",
      }}
    />
  );
}
