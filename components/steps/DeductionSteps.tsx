import { EuroInput, FormField, HintBox, SkipHint, textInputClass } from "@/components/FormField";
import type { BehinderungData, BelastungenData, HaushaltsnaheData, SonderausgabenData } from "@/lib/types";

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
        Kita, Kindergarten, Hort oder Tagesmutter zählen. 80 % der Kosten (bis 4.800 € pro Kind) senken
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

export function SchoolFeesStep({
  data,
  update,
}: {
  data: SonderausgabenData;
  update: (patch: Partial<SonderausgabenData>) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Besucht dein Kind eine Privatschule oder eine Schule in freier Trägerschaft? 30 % des
        Schulgelds (ohne Kosten für Unterkunft, Verpflegung oder Betreuung) sind absetzbar, bis 5.000 €
        pro Kind.
      </p>
      <FormField label="Gezahltes Schulgeld im Jahr" htmlFor="schulgeld">
        <EuroInput id="schulgeld" autoFocus value={data.schulgeld} onChange={(v) => update({ schulgeld: v })} placeholder="0" />
      </FormField>
      <SkipHint text="Öffentliche Schule? Einfach leer lassen." />
    </div>
  );
}

export function RiesterStep({
  data,
  update,
}: {
  data: SonderausgabenData;
  update: (patch: Partial<SonderausgabenData>) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Zahlst du in eine Riester-Rente ein? Wir prüfen automatisch, ob der Sonderausgabenabzug für
        dich günstiger ist als deine staatliche Zulage – falls ja, gibt es zusätzlich Geld zurück.
      </p>
      <FormField label="Dein Riester-Eigenbeitrag im Jahr" htmlFor="riester">
        <EuroInput id="riester" autoFocus value={data.riesterBeitrag} onChange={(v) => update({ riesterBeitrag: v })} placeholder="0" />
      </FormField>
      <SkipHint text="Keinen Riester-Vertrag? Einfach leer lassen." />
    </div>
  );
}

export function EducationStep({
  data,
  update,
}: {
  data: SonderausgabenData;
  update: (patch: Partial<SonderausgabenData>) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Kosten für deine erste Berufsausbildung oder dein Erststudium (ohne vorheriges
        Ausbildungsverhältnis) – z. B. Studiengebühren, Fachliteratur, Fahrtkosten zur Uni. Bis 6.000 €
        im Jahr absetzbar.
      </p>
      <FormField label="Ausbildungs-/Studienkosten im Jahr" htmlFor="ausbildung">
        <EuroInput id="ausbildung" autoFocus value={data.ausbildungskosten} onChange={(v) => update({ ausbildungskosten: v })} placeholder="0" />
      </FormField>
      <SkipHint text="Trifft nicht zu? Einfach leer lassen." />
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

const PFLEGEGRAD_OPTIONS: { value: BelastungenData["pflegegrad"]; label: string }[] = [
  { value: "keine", label: "Nein / trifft nicht zu" },
  { value: "2", label: "Pflegegrad 2" },
  { value: "3", label: "Pflegegrad 3" },
  { value: "4", label: "Pflegegrad 4" },
  { value: "5", label: "Pflegegrad 5" },
];

export function CareStep({
  data,
  update,
}: {
  data: BelastungenData;
  update: (patch: Partial<BelastungenData>) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Pflegst du einen Angehörigen (z. B. Eltern) persönlich zu Hause, unentgeltlich? Dann gibt es
        dafür einen Pauschbetrag – ganz ohne Belege.
      </p>
      <FormField label="Pflegegrad der gepflegten Person" htmlFor="pflegegrad">
        <select
          id="pflegegrad"
          className={textInputClass()}
          value={data.pflegegrad}
          onChange={(e) => update({ pflegegrad: e.target.value as BelastungenData["pflegegrad"] })}
        >
          {PFLEGEGRAD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}

export function MaintenanceStep({
  data,
  update,
}: {
  data: BelastungenData;
  update: (patch: Partial<BelastungenData>) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Unterstützt du finanziell einen bedürftigen Angehörigen (z. B. Eltern im Pflegeheim, erwachsenes
        Kind ohne Kindergeldanspruch)? Bis zu 12.096 € im Jahr sind absetzbar.
      </p>
      <FormField label="Gezahlter Unterhalt im Jahr" htmlFor="unterhalt">
        <EuroInput id="unterhalt" autoFocus value={data.unterhaltBetrag} onChange={(v) => update({ unterhaltBetrag: v })} placeholder="0" />
      </FormField>
      {num(data.unterhaltBetrag) > 0 && (
        <FormField
          label="Eigene Einkünfte der unterstützten Person im Jahr"
          hint="Rente, Minijob etc. – die ersten 624 € zählen nicht"
          htmlFor="unterhaltEinkuenfte"
        >
          <EuroInput
            id="unterhaltEinkuenfte"
            value={data.unterhaltEigeneinkuenfte}
            onChange={(v) => update({ unterhaltEigeneinkuenfte: v })}
            placeholder="0"
          />
        </FormField>
      )}
      <SkipHint text="Trifft nicht zu? Einfach leer lassen." />
    </div>
  );
}

function num(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const GRAD_OPTIONS: { value: BehinderungData["grad"]; label: string }[] = [
  { value: "keine", label: "Nein / trifft nicht zu" },
  { value: "20", label: "20" },
  { value: "30", label: "30" },
  { value: "40", label: "40" },
  { value: "50", label: "50" },
  { value: "60", label: "60" },
  { value: "70", label: "70" },
  { value: "80", label: "80" },
  { value: "90", label: "90" },
  { value: "100", label: "100" },
  { value: "bl_h", label: "Merkzeichen Bl, H oder Tbl (unabhängig vom Grad)" },
];

export function DisabilityStep({
  data,
  update,
}: {
  data: BehinderungData;
  update: (patch: Partial<BehinderungData>) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Bist du amtlich als Mensch mit Behinderung anerkannt? Dann bekommst du dafür einen
        Pauschbetrag – ganz ohne Belege. Steht auf deinem Schwerbehindertenausweis oder Bescheid.
      </p>
      <FormField label="Dein Grad der Behinderung (GdB)" htmlFor="gdb">
        <select
          id="gdb"
          className={textInputClass()}
          value={data.grad}
          onChange={(e) => update({ grad: e.target.value as BehinderungData["grad"] })}
        >
          {GRAD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}
