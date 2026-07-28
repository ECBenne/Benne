import { EuroInput, FormField, HintBox, SkipHint } from "@/components/FormField";
import type { BelastungenData, HaushaltsnaheData, SonderausgabenData } from "@/lib/types";

export function ChildcareStep({
  data,
  update,
}: {
  data: SonderausgabenData;
  update: (patch: Partial<SonderausgabenData>) => void;
}) {
  return (
    <div>
      <HintBox>
        Kita, Kindergarten, Hort oder Tagesmutter zählen. 2/3 der Kosten (bis 4.000 € pro Kind) senken
        deine Steuer.
      </HintBox>
      <FormField label="Kinderbetreuungskosten im Jahr" htmlFor="kinderbetreuung">
        <EuroInput
          id="kinderbetreuung"
          autoFocus
          value={data.kinderbetreuungskosten}
          onChange={(v) => update({ kinderbetreuungskosten: v })}
          placeholder="0"
        />
      </FormField>
    </div>
  );
}

export function DonationsStep({
  data,
  update,
}: {
  data: SonderausgabenData;
  update: (patch: Partial<SonderausgabenData>) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Spenden an gemeinnützige Organisationen, Vereinsbeiträge oder Kirchenspenden.
      </p>
      <FormField label="Spenden & Mitgliedsbeiträge" htmlFor="spenden">
        <EuroInput id="spenden" autoFocus value={data.spenden} onChange={(v) => update({ spenden: v })} placeholder="0" />
      </FormField>
      <SkipHint text="Kleinbetrag oder keine Spenden? Einfach leer lassen." />
    </div>
  );
}

export function HandwerkerStep({
  data,
  update,
}: {
  data: HaushaltsnaheData;
  update: (patch: Partial<HaushaltsnaheData>) => void;
}) {
  return (
    <div>
      <HintBox>
        Reparatur, Renovierung, neue Heizung, Malerarbeiten – 20 % des Arbeitslohns (nicht der
        Materialkosten!) auf der Rechnung, bis zu 1.200 € Ersparnis im Jahr.
      </HintBox>
      <FormField label="Handwerkerleistungen – nur der Arbeitslohn-Anteil" htmlFor="handwerker">
        <EuroInput
          id="handwerker"
          autoFocus
          value={data.handwerkerleistungen}
          onChange={(v) => update({ handwerkerleistungen: v })}
          placeholder="0"
        />
      </FormField>
    </div>
  );
}

export function HouseholdStep({
  data,
  update,
}: {
  data: HaushaltsnaheData;
  update: (patch: Partial<HaushaltsnaheData>) => void;
}) {
  return (
    <div>
      <HintBox>
        Putzhilfe, Fensterputzer, Gartenpflege, Winterdienst oder Umzugsservice – 20 % der Kosten, bis
        zu 4.000 € Ersparnis im Jahr.
      </HintBox>
      <FormField label="Haushaltsnahe Dienstleistungen" htmlFor="haushaltsnah">
        <EuroInput
          id="haushaltsnah"
          autoFocus
          value={data.haushaltsnaheDienstleistungen}
          onChange={(v) => update({ haushaltsnaheDienstleistungen: v })}
          placeholder="0"
        />
      </FormField>
    </div>
  );
}

export function HealthStep({
  data,
  update,
}: {
  data: BelastungenData;
  update: (patch: Partial<BelastungenData>) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Zuzahlungen zu Medikamenten, Zahnersatz, Brille, Therapien – alles, was du selbst bezahlt hast
        (nicht von der Krankenkasse erstattet). Zählt nur, wenn es einen bestimmten Betrag übersteigt –
        das prüfen wir automatisch für dich.
      </p>
      <FormField label="Selbst bezahlte Krankheitskosten" htmlFor="krankheit">
        <EuroInput id="krankheit" autoFocus value={data.krankheitskosten} onChange={(v) => update({ krankheitskosten: v })} placeholder="0" />
      </FormField>
    </div>
  );
}
