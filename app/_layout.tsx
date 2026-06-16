import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Webseiten-Vorschau" }} />
      <Stack.Screen name="preview" options={{ title: "Vorschau" }} />
    </Stack>
  );
}
