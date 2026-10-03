import { Stack } from "expo-router";
import { SelectionProvider } from "../lib/selection";

export default function Layout() {
  return (
    <SelectionProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: "GradingCards" }} />
        <Stack.Screen name="compare" options={{ title: "Vergleich" }} />
      </Stack>
    </SelectionProvider>
  );
}
