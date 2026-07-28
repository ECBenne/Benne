import { EuroInput, FormField, HintBox, SkipHint } from "@/components/FormField";
import type { IncomeData, KapitalertraegeData } from "@/lib/types";

type Update = (patch: Partial<IncomeData>) => void;

export function SalaryStep({ data, update }: { data: IncomeData; update: Update }) {
  return (
    <div>
      <HintBox>
        Alle Werte hier findest du auf deiner Lohnsteuerbescheinigung – die bekommst du von deinem
        Arbeitgeber, meist Anfang des Jahres oder in der Gehaltsabrechnung Dezember. Hattest du
        mehrere Arbeitgeber im Jahr? Dann zähle einfach alle Werte zusammen.
      </HintBox>
      <FormField label="Dein Bruttoarbeitslohn im Jahr" hint="Zeile 3 der Lohnsteuerbescheinigung" htmlFor="brutto">
        <EuroInput id="brutto" autoFocus value={data.bruttoarbeitslohn} onChange={(v) => update({ bruttoarbeitslohn: v })} placeholder="45.000" />
      </FormField>
      <FormField label="Einbehaltene Lohnsteuer" hint="Zeile 4" htmlFor="lohnsteuer">
        <EuroInput id="lohnsteuer" value={data.einbehalteneLohnsteuer} onChange={(v) => update({ einbehalteneLohnsteuer: v })} />
      </FormField>
      <FormField label="Einbehaltener Solidaritätszuschlag" hint="Zeile 5 – oft 0 €" htmlFor="soli">
        <EuroInput id="soli" value={data.einbehalteneSoli} onChange={(v) => update({ einbehalteneSoli: v })} />
      </FormField>
      <FormField label="Einbehaltene Kirchensteuer" hint="Zeile 6 – nur falls du kirchensteuerpflichtig bist" htmlFor="kist">
        <EuroInput id="kist" value={data.einbehalteneKirchensteuer} onChange={(v) => update({ einbehalteneKirchensteuer: v })} />
      </FormField>
    </div>
  );
}

export function InsuranceStep({ data, update }: { data: IncomeData; update: Update }) {
  return (
    <div>
      <HintBox>
        Auch das steht auf der Lohnsteuerbescheinigung – dein Arbeitgeber hat diese Beiträge schon vom Brutto abgezogen.
      </HintBox>
      <FormField label="Rentenversicherung" hint="Dein Anteil, Zeile 22a" htmlFor="rv">
        <EuroInput id="rv" autoFocus value={data.rentenversicherungAN} onChange={(v) => update({ rentenversicherungAN: v })} />
      </FormField>
      <FormField label="Kranken- & Pflegeversicherung" hint="Dein Anteil, Zeile 25/26" htmlFor="kvpv">
        <EuroInput id="kvpv" value={data.kvPvAN} onChange={(v) => update({ kvPvAN: v })} />
      </FormField>
      <FormField
        label="Rürup-Rente / Basisrente"
        hint="Falls vorhanden – eigene Einzahlungen in eine private Basisrente"
        htmlFor="ruerup"
      >
        <EuroInput id="ruerup" value={data.weitereAltersvorsorge} onChange={(v) => update({ weitereAltersvorsorge: v })} placeholder="0" />
      </FormField>
    </div>
  );
}

export function WageReplacementStep({ data, update }: { data: IncomeData; update: Update }) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Hast du im Jahr Elterngeld, Kurzarbeitergeld, Arbeitslosengeld oder Krankengeld bekommen? Das
        ist zwar steuerfrei, erhöht aber deinen persönlichen Steuersatz etwas. Falls nicht: einfach leer lassen.
      </p>
      <FormField label="Erhaltene Lohnersatzleistungen (gesamt)" htmlFor="lel">
        <EuroInput id="lel" autoFocus value={data.lohnersatzleistungen} onChange={(v) => update({ lohnersatzleistungen: v })} placeholder="0" />
      </FormField>
    </div>
  );
}

export function CapitalIncomeStep({
  data,
  update,
}: {
  data: KapitalertraegeData;
  update: (patch: Partial<KapitalertraegeData>) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Zinsen, Dividenden oder Ausschüttungen aus Aktien/ETFs/Tagesgeld. Die ersten 1.000 € (2.000 €
        bei Zusammenveranlagung) im Jahr sind steuerfrei.
      </p>
      <FormField label="Zinsen & Dividenden im Jahr" htmlFor="kapitalertraege">
        <EuroInput id="kapitalertraege" autoFocus value={data.kapitalertraege} onChange={(v) => update({ kapitalertraege: v })} placeholder="0" />
      </FormField>
      <FormField
        label="Davon schon einbehaltene Steuer (Abgeltungssteuer)"
        hint="Steht auf deiner Jahressteuerbescheinigung der Bank, falls kein Freistellungsauftrag genutzt wurde"
        htmlFor="kest"
      >
        <EuroInput id="kest" value={data.einbehalteneKapitalertragsteuer} onChange={(v) => update({ einbehalteneKapitalertragsteuer: v })} placeholder="0" />
      </FormField>
      <SkipHint text="Nur Sparbuch/Girokonto ohne nennenswerte Zinsen? Einfach leer lassen." />
    </div>
  );
}
