import { FormField, HintBox, textInputClass } from "@/components/FormField";
import { BUNDESLAENDER } from "@/lib/constants";
import type { Familienstand, Konfession, PersonalData } from "@/lib/types";

type Update = (patch: Partial<PersonalData>) => void;

export function NameStep({ data, update }: { data: PersonalData; update: Update }) {
  return (
    <div>
      <FormField label="Wie heißt du?" htmlFor="vorname">
        <input
          id="vorname"
          autoFocus
          placeholder="Vorname"
          className={textInputClass()}
          value={data.vorname}
          onChange={(e) => update({ vorname: e.target.value })}
        />
      </FormField>
      <FormField label="Und dein Nachname?" htmlFor="nachname">
        <input
          id="nachname"
          placeholder="Nachname"
          className={textInputClass()}
          value={data.nachname}
          onChange={(e) => update({ nachname: e.target.value })}
        />
      </FormField>
      <FormField label="Geburtsdatum" htmlFor="geburtsdatum">
        <input
          id="geburtsdatum"
          type="date"
          className={textInputClass()}
          value={data.geburtsdatum}
          onChange={(e) => update({ geburtsdatum: e.target.value })}
        />
      </FormField>
    </div>
  );
}

export function AddressStep({ data, update }: { data: PersonalData; update: Update }) {
  return (
    <div>
      <FormField label="Straße und Hausnummer" htmlFor="strasse">
        <input
          id="strasse"
          autoFocus
          placeholder="Musterstraße 1"
          className={textInputClass()}
          value={data.strasseHausnummer}
          onChange={(e) => update({ strasseHausnummer: e.target.value })}
        />
      </FormField>
      <div className="grid grid-cols-[1fr_2fr] gap-3">
        <FormField label="PLZ" htmlFor="plz">
          <input
            id="plz"
            inputMode="numeric"
            placeholder="12345"
            className={textInputClass()}
            value={data.plz}
            onChange={(e) => update({ plz: e.target.value })}
          />
        </FormField>
        <FormField label="Ort" htmlFor="ort">
          <input
            id="ort"
            placeholder="Musterstadt"
            className={textInputClass()}
            value={data.ort}
            onChange={(e) => update({ ort: e.target.value })}
          />
        </FormField>
      </div>
    </div>
  );
}

export function TaxIdStep({ data, update }: { data: PersonalData; update: Update }) {
  return (
    <div>
      <HintBox>
        Deine Steuer-ID ist 11-stellig. Du findest sie auf deiner Lohnsteuerbescheinigung, deinem letzten Steuerbescheid oder einem Brief vom Bundeszentralamt für Steuern.
      </HintBox>
      <FormField label="Steuer-Identifikationsnummer" htmlFor="steuerId">
        <input
          id="steuerId"
          autoFocus
          inputMode="numeric"
          placeholder="z. B. 12 345 678 901"
          className={textInputClass()}
          value={data.steuerId}
          onChange={(e) => update({ steuerId: e.target.value })}
        />
      </FormField>
      <FormField label="In welchem Bundesland wohnst du?" htmlFor="bundesland">
        <select
          id="bundesland"
          className={textInputClass()}
          value={data.bundesland}
          onChange={(e) => update({ bundesland: e.target.value as PersonalData["bundesland"] })}
        >
          <option value="">Bitte wählen</option>
          {BUNDESLAENDER.map((land) => (
            <option key={land} value={land}>
              {land}
            </option>
          ))}
        </select>
      </FormField>
    </div>
  );
}

const FAMILIENSTAND_OPTIONS: { value: Familienstand; label: string; desc: string }[] = [
  { value: "ledig", label: "Ledig", desc: "Ich bin nicht verheiratet" },
  { value: "verheiratet_zusammen", label: "Verheiratet", desc: "Gemeinsame Steuererklärung mit meinem Partner" },
  { value: "verheiratet_einzeln", label: "Verheiratet (getrennt)", desc: "Ich reiche einzeln ein" },
  { value: "geschieden", label: "Geschieden", desc: "" },
  { value: "verwitwet", label: "Verwitwet", desc: "" },
];

export function MaritalStatusStep({ data, update }: { data: PersonalData; update: Update }) {
  return (
    <div className="space-y-2.5">
      {FAMILIENSTAND_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => update({ familienstand: opt.value })}
          className={`w-full rounded-xl border-2 px-4 py-3.5 text-left transition ${
            data.familienstand === opt.value
              ? "border-brand-500 bg-brand-50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="font-semibold text-slate-900">{opt.label}</p>
          {opt.desc && <p className="text-sm text-slate-500">{opt.desc}</p>}
        </button>
      ))}
    </div>
  );
}

export function ChildrenStep({ data, update }: { data: PersonalData; update: Update }) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Zähle nur Kinder, für die du Kindergeld bekommst (z. B. eigene Kinder oder Pflegekinder).
      </p>
      <div className="flex items-center justify-center gap-6 rounded-xl border border-slate-200 bg-white py-8">
        <button
          type="button"
          aria-label="Weniger Kinder"
          onClick={() => update({ kinderAnzahl: Math.max(0, data.kinderAnzahl - 1) })}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl font-bold text-slate-600 active:scale-95"
        >
          −
        </button>
        <span className="w-16 text-center text-4xl font-bold text-slate-900">{data.kinderAnzahl}</span>
        <button
          type="button"
          aria-label="Mehr Kinder"
          onClick={() => update({ kinderAnzahl: data.kinderAnzahl + 1 })}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white active:scale-95"
        >
          +
        </button>
      </div>
    </div>
  );
}

const KONFESSION_OPTIONS: { value: Konfession; label: string }[] = [
  { value: "keine", label: "Keine / bin ausgetreten" },
  { value: "evangelisch", label: "Evangelisch" },
  { value: "katholisch", label: "Katholisch" },
  { value: "andere", label: "Andere kirchensteuerpflichtige Gemeinschaft" },
];

export function ReligionStep({ data, update }: { data: PersonalData; update: Update }) {
  return (
    <div className="space-y-2.5">
      <p className="mb-2 text-sm text-slate-500">
        Das entscheidet, ob Kirchensteuer für dich anfällt. Steht auch auf deiner Lohnsteuerbescheinigung (Konfessionskennzeichen).
      </p>
      {KONFESSION_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => update({ konfession: opt.value })}
          className={`w-full rounded-xl border-2 px-4 py-3.5 text-left font-semibold transition ${
            data.konfession === opt.value
              ? "border-brand-500 bg-brand-50 text-slate-900"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
