"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { berechneSteuer } from "@/lib/taxCalculation";
import { generateSteuerPdf } from "@/lib/pdf";
import { initialWizardState, loadWizardState } from "@/lib/storage";
import type { TaxWizardState } from "@/lib/types";

const euro = (n: number) =>
  n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export default function ErgebnisPage() {
  const [state, setState] = useState<TaxWizardState>(initialWizardState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setState(loadWizardState());
    setLoaded(true);
  }, []);

  const result = useMemo(() => berechneSteuer(state), [state]);

  if (!loaded) return null;

  const isErstattung = result.erstattungOderNachzahlung >= 0;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/interview" className="text-sm text-brand-600 hover:underline">
        ← Angaben bearbeiten
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Deine Steuerschätzung
      </h1>

      <div
        className={`mt-6 rounded-xl border p-6 shadow-sm ${
          isErstattung
            ? "border-brand-200 bg-brand-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <p className="text-sm font-medium text-slate-600">
          {isErstattung ? "Voraussichtliche Erstattung" : "Voraussichtliche Nachzahlung"}
        </p>
        <p
          className={`mt-1 text-4xl font-bold ${
            isErstattung ? "text-brand-700" : "text-amber-700"
          }`}
        >
          {euro(Math.abs(result.erstattungOderNachzahlung))}
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Details</h2>
        <Row label="Zu versteuerndes Einkommen" value={euro(result.zuVersteuerndesEinkommen)} />
        <Row label="Werbungskosten (angesetzt)" value={euro(result.werbungskostenAbzug)} />
        <Row label="Vorsorgeaufwendungen" value={euro(result.vorsorgeaufwendungen)} />
        <Row label="Sonderausgaben (angesetzt)" value={euro(result.sonderausgabenAbzug)} />
        {state.personal.kinderAnzahl > 0 && (
          <Row
            label="Kinderfreibetrag berücksichtigt"
            value={result.guenstigerpruefungKinderfreibetragGreift ? "Ja" : "Nein (Kindergeld günstiger)"}
          />
        )}
        <Row label="Festgesetzte Einkommensteuer" value={euro(result.festgesetzteEinkommensteuer)} />
        <Row label="Solidaritätszuschlag" value={euro(result.solidaritaetszuschlag)} />
        {state.personal.kirchensteuerpflichtig && (
          <Row
            label={`Kirchensteuer (${(result.kirchensteuersatz * 100).toFixed(0)} %)`}
            value={euro(result.kirchensteuer)}
          />
        )}
        <Row label="Gesamte Steuerschuld" value={euro(result.gesamteSteuerschuld)} bold />
        <Row label="Bereits gezahlt" value={euro(result.bereitsGezahlt)} />
      </div>

      <button
        type="button"
        onClick={() => generateSteuerPdf(state, result).save("steuerfix-zusammenfassung.pdf")}
        className="mt-6 w-full rounded-lg bg-brand-600 px-6 py-3 text-center font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Zusammenfassung als PDF herunterladen
      </button>

      <p className="mt-4 text-xs text-slate-400">
        Vereinfachte, unverbindliche Schätzung auf Basis deiner Angaben – ersetzt
        keine Steuerberatung. Bitte übertrage die Werte selbst in{" "}
        <a
          href="https://www.elster.de"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          ELSTER
        </a>{" "}
        und prüfe sie dort vor der Übermittlung ans Finanzamt.
      </p>
    </main>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-2 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm ${bold ? "font-bold text-slate-900" : "font-medium text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}
