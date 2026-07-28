"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, textInputClass } from "@/components/FormField";
import { BUNDESLAENDER } from "@/lib/constants";
import { initialWizardState, loadWizardState, saveWizardState } from "@/lib/storage";
import type { Familienstand, TaxWizardState } from "@/lib/types";

const STEP_TITLES = [
  "Persönliche Daten",
  "Einkommen (Lohnsteuerbescheinigung)",
  "Werbungskosten",
  "Sonderausgaben",
  "Übersicht",
];

export default function InterviewPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<TaxWizardState>(initialWizardState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setState(loadWizardState());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveWizardState(state);
  }, [state, loaded]);

  function update<K extends keyof TaxWizardState>(
    section: K,
    patch: Partial<TaxWizardState[K]>
  ) {
    setState((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));
  }

  const isLastStep = step === STEP_TITLES.length - 1;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="text-sm text-brand-600 hover:underline">
        ← Zurück zur Startseite
      </Link>

      <div className="mt-4 mb-8">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>
            Schritt {step + 1} von {STEP_TITLES.length}
          </span>
          <span>{STEP_TITLES[step]}</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
          <div
            className="h-2 rounded-full bg-brand-500 transition-all"
            style={{ width: `${((step + 1) / STEP_TITLES.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 0 && (
          <StepPersonal state={state} update={(p) => update("personal", p)} />
        )}
        {step === 1 && (
          <StepIncome state={state} update={(p) => update("income", p)} />
        )}
        {step === 2 && (
          <StepWerbungskosten
            state={state}
            update={(p) => update("werbungskosten", p)}
          />
        )}
        {step === 3 && (
          <StepSonderausgaben
            state={state}
            update={(p) => update("sonderausgaben", p)}
          />
        )}
        {step === 4 && <StepReview state={state} />}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-0"
        >
          Zurück
        </button>
        {isLastStep ? (
          <button
            type="button"
            onClick={() => router.push("/ergebnis")}
            className="rounded-md bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Steuerschätzung berechnen
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1))}
            className="rounded-md bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            Weiter
          </button>
        )}
      </div>
    </main>
  );
}

function StepPersonal({
  state,
  update,
}: {
  state: TaxWizardState;
  update: (patch: Partial<TaxWizardState["personal"]>) => void;
}) {
  const p = state.personal;
  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Vorname" htmlFor="vorname">
          <input
            id="vorname"
            className={textInputClass()}
            value={p.vorname}
            onChange={(e) => update({ vorname: e.target.value })}
          />
        </FormField>
        <FormField label="Nachname" htmlFor="nachname">
          <input
            id="nachname"
            className={textInputClass()}
            value={p.nachname}
            onChange={(e) => update({ nachname: e.target.value })}
          />
        </FormField>
      </div>

      <FormField
        label="Steuer-Identifikationsnummer"
        hint="11-stellig, findest du auf deiner Lohnsteuerbescheinigung oder einem Schreiben vom Finanzamt."
        htmlFor="steuerId"
      >
        <input
          id="steuerId"
          className={textInputClass()}
          value={p.steuerId}
          onChange={(e) => update({ steuerId: e.target.value })}
        />
      </FormField>

      <FormField label="Familienstand" htmlFor="familienstand">
        <select
          id="familienstand"
          className={textInputClass()}
          value={p.familienstand}
          onChange={(e) => update({ familienstand: e.target.value as Familienstand })}
        >
          <option value="ledig">Ledig</option>
          <option value="verheiratet_zusammen">Verheiratet – Zusammenveranlagung</option>
          <option value="verheiratet_einzeln">Verheiratet – Einzelveranlagung</option>
          <option value="verwitwet">Verwitwet</option>
          <option value="geschieden">Geschieden</option>
        </select>
      </FormField>

      <FormField label="Bundesland" htmlFor="bundesland">
        <select
          id="bundesland"
          className={textInputClass()}
          value={p.bundesland}
          onChange={(e) => update({ bundesland: e.target.value as TaxWizardState["personal"]["bundesland"] })}
        >
          <option value="">Bitte wählen</option>
          {BUNDESLAENDER.map((land) => (
            <option key={land} value={land}>
              {land}
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Anzahl Kinder (kindergeldberechtigt)" htmlFor="kinderAnzahl">
        <input
          id="kinderAnzahl"
          type="number"
          min={0}
          className={textInputClass()}
          value={p.kinderAnzahl}
          onChange={(e) => update({ kinderAnzahl: Math.max(0, parseInt(e.target.value) || 0) })}
        />
      </FormField>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={p.kirchensteuerpflichtig}
          onChange={(e) => update({ kirchensteuerpflichtig: e.target.checked })}
        />
        Ich bin Mitglied einer kirchensteuerpflichtigen Religionsgemeinschaft
      </label>
    </div>
  );
}

function StepIncome({
  state,
  update,
}: {
  state: TaxWizardState;
  update: (patch: Partial<TaxWizardState["income"]>) => void;
}) {
  const i = state.income;
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Diese Werte findest du auf deiner Lohnsteuerbescheinigung (von deinem
        Arbeitgeber, meist auch in der Gehaltsabrechnung Dezember).
      </p>
      <FormField label="Bruttoarbeitslohn (Zeile 3)" htmlFor="brutto">
        <input
          id="brutto"
          inputMode="decimal"
          className={textInputClass()}
          value={i.bruttoarbeitslohn}
          onChange={(e) => update({ bruttoarbeitslohn: e.target.value })}
          placeholder="z. B. 45000"
        />
      </FormField>
      <FormField label="Einbehaltene Lohnsteuer (Zeile 4)" htmlFor="lohnsteuer">
        <input
          id="lohnsteuer"
          inputMode="decimal"
          className={textInputClass()}
          value={i.einbehalteneLohnsteuer}
          onChange={(e) => update({ einbehalteneLohnsteuer: e.target.value })}
        />
      </FormField>
      <FormField label="Einbehaltener Solidaritätszuschlag (Zeile 5)" htmlFor="soli">
        <input
          id="soli"
          inputMode="decimal"
          className={textInputClass()}
          value={i.einbehalteneSoli}
          onChange={(e) => update({ einbehalteneSoli: e.target.value })}
        />
      </FormField>
      <FormField label="Einbehaltene Kirchensteuer (Zeile 6)" htmlFor="kirchensteuer">
        <input
          id="kirchensteuer"
          inputMode="decimal"
          className={textInputClass()}
          value={i.einbehalteneKirchensteuer}
          onChange={(e) => update({ einbehalteneKirchensteuer: e.target.value })}
        />
      </FormField>
      <FormField
        label="Beitrag zur gesetzlichen Rentenversicherung, AN-Anteil (Zeile 22a)"
        htmlFor="rv"
      >
        <input
          id="rv"
          inputMode="decimal"
          className={textInputClass()}
          value={i.rentenversicherungAN}
          onChange={(e) => update({ rentenversicherungAN: e.target.value })}
        />
      </FormField>
      <FormField
        label="Beiträge zur Kranken- & Pflegeversicherung, AN-Anteil (Zeile 25/26)"
        htmlFor="kvpv"
      >
        <input
          id="kvpv"
          inputMode="decimal"
          className={textInputClass()}
          value={i.kvPvAN}
          onChange={(e) => update({ kvPvAN: e.target.value })}
        />
      </FormField>
      <FormField
        label="Beitrag zur Arbeitslosenversicherung, AN-Anteil (Zeile 23)"
        hint="Optional – wirkt sich bei den meisten Angestellten nicht zusätzlich steuermindernd aus."
        htmlFor="av"
      >
        <input
          id="av"
          inputMode="decimal"
          className={textInputClass()}
          value={i.arbeitslosenversicherungAN}
          onChange={(e) => update({ arbeitslosenversicherungAN: e.target.value })}
        />
      </FormField>
    </div>
  );
}

function StepWerbungskosten({
  state,
  update,
}: {
  state: TaxWizardState;
  update: (patch: Partial<TaxWizardState["werbungskosten"]>) => void;
}) {
  const w = state.werbungskosten;
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Werbungskosten sind Ausgaben rund um deinen Job. Ohne Angaben nutzen
        wir automatisch den Arbeitnehmer-Pauschbetrag (1.230 €).
      </p>
      <FormField
        label="Einfache Entfernung Wohnung–Arbeitsstätte (km)"
        htmlFor="km"
      >
        <input
          id="km"
          inputMode="decimal"
          className={textInputClass()}
          value={w.entfernungKm}
          onChange={(e) => update({ entfernungKm: e.target.value })}
        />
      </FormField>
      <FormField label="Arbeitstage im Büro/vor Ort pro Jahr" htmlFor="tage">
        <input
          id="tage"
          inputMode="decimal"
          className={textInputClass()}
          value={w.arbeitstageProJahr}
          onChange={(e) => update({ arbeitstageProJahr: e.target.value })}
        />
      </FormField>
      <FormField
        label="Weitere Werbungskosten (Arbeitsmittel, Fortbildung, Homeoffice-Pauschale, …)"
        htmlFor="weitereWk"
      >
        <input
          id="weitereWk"
          inputMode="decimal"
          className={textInputClass()}
          value={w.weitereWerbungskosten}
          onChange={(e) => update({ weitereWerbungskosten: e.target.value })}
        />
      </FormField>
    </div>
  );
}

function StepSonderausgaben({
  state,
  update,
}: {
  state: TaxWizardState;
  update: (patch: Partial<TaxWizardState["sonderausgaben"]>) => void;
}) {
  const s = state.sonderausgaben;
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Ohne Angaben nutzen wir automatisch den Sonderausgaben-Pauschbetrag
        (36 € bzw. 72 € bei Zusammenveranlagung).
      </p>
      <FormField label="Spenden & Mitgliedsbeiträge" htmlFor="spenden">
        <input
          id="spenden"
          inputMode="decimal"
          className={textInputClass()}
          value={s.spenden}
          onChange={(e) => update({ spenden: e.target.value })}
        />
      </FormField>
      <FormField
        label="Weitere Sonderausgaben (z. B. Kinderbetreuung, Ausbildungskosten)"
        htmlFor="weitereSa"
      >
        <input
          id="weitereSa"
          inputMode="decimal"
          className={textInputClass()}
          value={s.weitereSonderausgaben}
          onChange={(e) => update({ weitereSonderausgaben: e.target.value })}
        />
      </FormField>
    </div>
  );
}

function StepReview({ state }: { state: TaxWizardState }) {
  return (
    <div className="space-y-4 text-sm">
      <p className="text-slate-500">
        Kurze Übersicht deiner Angaben. Im nächsten Schritt berechnen wir
        deine Steuerschätzung.
      </p>
      <ReviewRow label="Name" value={`${state.personal.vorname} ${state.personal.nachname}`} />
      <ReviewRow label="Bundesland" value={state.personal.bundesland || "–"} />
      <ReviewRow label="Bruttoarbeitslohn" value={state.income.bruttoarbeitslohn || "0"} />
      <ReviewRow label="Entfernung zur Arbeit" value={`${state.werbungskosten.entfernungKm || 0} km`} />
      <ReviewRow label="Kinder" value={String(state.personal.kinderAnzahl)} />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
