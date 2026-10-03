import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View,
} from "react-native";
import { Card, fmt, priceEur, priceUsd, searchCards } from "../lib/api";
import { useSelection } from "../lib/selection";

export default function SearchScreen() {
  const router = useRouter();
  const { selected, toggle } = useSelection();
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setCards(await searchCards(query));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.container}>
      <TextInput
        style={s.input}
        placeholder="Karte suchen, z. B. Glurak"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={submit}
        returnKeyType="search"
        autoCorrect={false}
      />
      {loading && <ActivityIndicator style={s.pad} />}
      {error && <Text style={[s.pad, s.error]}>{error}</Text>}
      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingBottom: 90 }}
        renderItem={({ item }) => {
          const on = selected.some((x) => x.id === item.id);
          return (
            <Pressable style={[s.row, on && s.rowOn]} onPress={() => toggle(item)}>
              <Image source={{ uri: item.images.small }} style={s.img} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.name}</Text>
                <Text style={s.sub}>{item.set.name} · #{item.number}</Text>
                <Text style={s.sub}>
                  {fmt(priceEur(item), "EUR")} · {fmt(priceUsd(item), "USD")}
                </Text>
              </View>
              <Text style={s.check}>{on ? "✓" : ""}</Text>
            </Pressable>
          );
        }}
      />
      {selected.length === 2 && (
        <Pressable style={s.cta} onPress={() => router.push("/compare")}>
          <Text style={s.ctaText}>Vergleichen</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  input: { margin: 12, padding: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 10, fontSize: 16 },
  pad: { padding: 12 },
  error: { color: "#c00" },
  row: { flexDirection: "row", alignItems: "center", padding: 10, gap: 12 },
  rowOn: { backgroundColor: "#e6f0ff" },
  img: { width: 56, height: 78 },
  name: { fontSize: 16, fontWeight: "600" },
  sub: { color: "#666", marginTop: 2 },
  check: { fontSize: 22, color: "#007AFF", width: 24 },
  cta: { position: "absolute", left: 16, right: 16, bottom: 24, backgroundColor: "#007AFF", padding: 16, borderRadius: 12, alignItems: "center" },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
