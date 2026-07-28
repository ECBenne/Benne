import { EuroInput, FormField, HintBox, SkipHint, textInputClass } from "@/components/FormField";
import { ARBEITNEHMERPAUSCHBETRAG, HOMEOFFICE_MAX_TAGE } from "@/lib/constants";
import type { WerbungskostenData } from "@/lib/types";

type Update = (patch: Partial<WerbungskostenData>) => void;

export function CommuteStep({ data, update }: { data: WerbungskostenData; update: Update }) {
  return (
    <div>
      <FormField label="Wie weit ist dein Arbeitsweg (einfache Strecke)?" hint="In Kilometern" htmlFor="km">
        <input
          id="km"
          autoFocus
          inputMode="decimal"
          className={textInputClass()}
          value={data.entfernungKm}
          onChange={(e) => update({ entfernungKm: e.target.value })}
          placeholder="z. B. 15"
        />
      </FormField>
      <FormField label="An wie vielen Tagen warst du im Büro / vor Ort?" htmlFor="tage">
        <input
          id="tage"
          inputMode="decimal"
          className={textInputClass()}
          value={data.arbeitstageProJahr}
          onChange={(e) => update({ arbeitstageProJahr: e.target.value })}
          placeholder="z. B. 220"
        />
      </FormField>
    </div>
  );
}

export function HomeofficeStep({ data, update }: { data: WerbungskostenData; update: Update }) {
  return (
    <div>
      <HintBox>
        Für jeden Tag im Homeoffice gibt es pauschal 6 € – ganz ohne Belege, bis maximal {HOMEOFFICE_MAX_TAGE} Tage im Jahr.
      </HintBox>
      <FormField label="An wie vielen Tagen hast du von zu Hause gearbeitet?" htmlFor="homeoffice">
        <input
          id="homeoffice"
          autoFocus
          inputMode="decimal"
          className={textInputClass()}
          value={data.homeofficeTage}
          onChange={(e) => update({ homeofficeTage: e.target.value })}
          placeholder="0"
        />
      </FormField>
    </div>
  );
}

export function WorkExpensesStep({ data, update }: { data: WerbungskostenData; update: Update }) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Zum Beispiel: Laptop, Handy, Fachbücher, Fortbildungen, Arbeitskleidung, Bewerbungskosten. Ohne
        Angabe rechnen wir automatisch mit der Pauschale von {ARBEITNEHMERPAUSCHBETRAG.toLocaleString("de-DE")} € – die bekommst du sowieso.
      </p>
      <FormField label="Weitere Kosten rund um deinen Job" htmlFor="weitereWk">
        <EuroInput id="weitereWk" autoFocus value={data.weitereWerbungskosten} onChange={(v) => update({ weitereWerbungskosten: v })} placeholder="0" />
      </FormField>
      <SkipHint text="Nicht sicher? Einfach leer lassen – wir nutzen dann die Pauschale." />
    </div>
  );
}
