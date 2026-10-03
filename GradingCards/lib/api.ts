// Pokémon TCG API: https://docs.pokemontcg.io
const BASE = "https://api.pokemontcg.io/v2";

export type Card = {
  id: string;
  name: string;
  number: string;
  rarity?: string;
  set: { name: string };
  images: { small: string; large: string };
  tcgplayer?: {
    url?: string;
    prices?: Record<string, { market?: number | null }>;
  };
  cardmarket?: {
    url?: string;
    prices?: { averageSellPrice?: number | null; trendPrice?: number | null };
  };
};

export async function searchCards(query: string): Promise<Card[]> {
  const q = encodeURIComponent(`name:"${query.trim()}*"`);
  const res = await fetch(`${BASE}/cards?q=${q}&pageSize=30&orderBy=-set.releaseDate`);
  if (!res.ok) throw new Error(`API-Fehler ${res.status}`);
  const json = (await res.json()) as { data: Card[] };
  return json.data;
}

/** Cardmarket-Trend in EUR, sonst null. */
export function priceEur(card: Card): number | null {
  return card.cardmarket?.prices?.trendPrice ?? card.cardmarket?.prices?.averageSellPrice ?? null;
}

/** Höchster TCGplayer-Marktpreis in USD über alle Varianten, sonst null. */
export function priceUsd(card: Card): number | null {
  const vals = Object.values(card.tcgplayer?.prices ?? {})
    .map((p) => p.market)
    .filter((v): v is number => typeof v === "number");
  return vals.length ? Math.max(...vals) : null;
}

export const fmt = (v: number | null, cur: "EUR" | "USD") =>
  v == null ? "–" : v.toLocaleString("de-DE", { style: "currency", currency: cur });
