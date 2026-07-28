import { FormField, SkipHint, textInputClass } from "@/components/FormField";
import type { PersonalData, TaxWizardState } from "@/lib/types";

export function BankStep({
  data,
  update,
}: {
  data: PersonalData;
  update: (patch: Partial<PersonalData>) => void;
}) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Deine IBAN brauchst du später beim Einreichen in ELSTER, damit das Finanzamt deine Erstattung
        überweisen kann.
      </p>
      <FormField label="IBAN" htmlFor="iban">
        <input
          id="iban"
          autoFocus
          className={textInputClass()}
          value={data.iban}
          onChange={(e) => update({ iban: e.target.value.toUpperCase() })}
          placeholder="DE00 0000 0000 0000 0000 00"
        />
      </FormField>
      <SkipHint text="Weißt du gerade nicht? Kannst du auch später ergänzen." />
    </div>
  );
}

function euro(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

export function ReviewStep({ state }: { state: TaxWizardState }) {
  const groups: { title: string; rows: [string, string][] }[] = [
    {
      title: "Über dich",
      rows: [
        ["Name", `${state.personal.vorname} ${state.personal.nachname}`.trim() || "–"],
        ["Bundesland", state.personal.bundesland || "–"],
        ["Kinder", String(state.personal.kinderAnzahl)],
      ],
    },
    {
      title: "Einkommen",
      rows: [
        ["Bruttoarbeitslohn", state.income.bruttoarbeitslohn ? euro(Number(state.income.bruttoarbeitslohn)) : "–"],
        ["Lohnersatzleistungen", state.income.lohnersatzleistungen ? euro(Number(state.income.lohnersatzleistungen)) : "–"],
      ],
    },
    {
      title: "Ausgaben",
      rows: [
        ["Arbeitsweg", `${state.werbungskosten.entfernungKm || 0} km`],
        ["Homeoffice-Tage", state.werbungskosten.homeofficeTage || "0"],
        ["Handwerker & Haushaltsnahes", state.haushaltsnahe.handwerkerleistungen || state.haushaltsnahe.haushaltsnaheDienstleistungen ? "angegeben" : "–"],
      ],
    },
  ];

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Kurzer Check – stimmt alles? Im nächsten Schritt zeigen wir dir deine Steuerschätzung.
      </p>
      {groups.map((group) => (
        <div key={group.title} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{group.title}</p>
          {group.rows.map(([label, value]) => (
            <div key={label} className="flex justify-between border-t border-slate-100 py-2 first:border-0 first:pt-0">
              <span className="text-sm text-slate-500">{label}</span>
              <span className="text-sm font-medium text-slate-900">{value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
