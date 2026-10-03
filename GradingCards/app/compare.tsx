import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, fmt, priceEur, priceUsd } from "../lib/api";
import { useSelection } from "../lib/selection";

function Column({ card, cheapest }: { card: Card; cheapest: boolean }) {
  const url = card.cardmarket?.url ?? card.tcgplayer?.url;
  return (
    <View style={[s.col, cheapest && s.colBest]}>
      <Image source={{ uri: card.images.large }} style={s.img} resizeMode="contain" />
      <Text style={s.name}>{card.name}</Text>
      <Text style={s.sub}>{card.set.name} · #{card.number}</Text>
      <Text style={s.sub}>{card.rarity ?? "–"}</Text>
      <Text style={s.price}>{fmt(priceEur(card), "EUR")}</Text>
      <Text style={s.sub}>{fmt(priceUsd(card), "USD")}</Text>
      {url && (
        <Pressable style={s.buy} onPress={() => Linking.openURL(url)}>
          <Text style={s.buyText}>Zum Angebot</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function CompareScreen() {
  const { selected } = useSelection();
  if (selected.length < 2) {
    return <Text style={s.empty}>Wähle zuerst zwei Karten aus.</Text>;
  }
  const [a, b] = selected;
  const pa = priceEur(a), pb = priceEur(b);
  const best = pa != null && pb != null ? (pa <= pb ? a.id : b.id) : null;
  return (
    <ScrollView contentContainerStyle={s.container}>
      <Column card={a} cheapest={best === a.id} />
      <Column card={b} cheapest={best === b.id} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flexDirection: "row", padding: 8, gap: 8 },
  col: { flex: 1, alignItems: "center", padding: 8, borderRadius: 12, borderWidth: 2, borderColor: "transparent" },
  colBest: { borderColor: "#2e9e4f" },
  img: { width: "100%", aspectRatio: 0.72 },
  name: { fontSize: 16, fontWeight: "700", marginTop: 8, textAlign: "center" },
  sub: { color: "#666", marginTop: 2, textAlign: "center" },
  price: { fontSize: 20, fontWeight: "700", marginTop: 8 },
  buy: { marginTop: 12, backgroundColor: "#007AFF", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  buyText: { color: "#fff", fontWeight: "600" },
  empty: { padding: 24, textAlign: "center" },
});
