import { createContext, ReactNode, useContext, useState } from "react";
import type { Card } from "./api";

type Ctx = { selected: Card[]; toggle: (c: Card) => void; clear: () => void };
const SelectionContext = createContext<Ctx | null>(null);

export const MAX_COMPARE = 2;

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selected, setSelected] = useState<Card[]>([]);
  const toggle = (c: Card) =>
    setSelected((s) =>
      s.some((x) => x.id === c.id)
        ? s.filter((x) => x.id !== c.id)
        : [...s, c].slice(-MAX_COMPARE)
    );
  return (
    <SelectionContext.Provider value={{ selected, toggle, clear: () => setSelected([]) }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error("SelectionProvider fehlt");
  return ctx;
}
