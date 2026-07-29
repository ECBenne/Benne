"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Coins, Download, ExternalLink, Landmark } from "lucide-react";
import confetti from "canvas-confetti";
import { berechneSteuer } from "@/lib/taxCalculation";
import { generateSteuerPdf } from "@/lib/pdf";
import { initialWizardState, loadWizardState } from "@/lib/storage";
import type { TaxWizardState } from "@/lib/types";
import { CelebrationIllustration, ThinkingIllustration } from "@/components/illustrations";
import { CountUp } from "@/components/CountUp";

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

  const isErstattung = result.erstattungOderNachzahlung >= 0;

  useEffect(() => {
    if (!loaded || !isErstattung) return;
    const timer = setTimeout(() => {
      confetti({
        particleCount: 90,
        spread: 75,
        startVelocity: 40,
        origin: { y: 0.35 },
        colors: ["#0f9d63", "#facc15", "#f472b6", "#60a5fa"],
      });
    }, 200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, isErstattung]);

  if (!loaded) return null;

  const rows: [string, string][] = [
    ["Zu versteuerndes Einkommen", euro(result.zuVersteuerndesEinkommen)],
    ["Werbungskosten (angesetzt)", euro(result.werbungskostenAbzug)],
  ];
  if (result.arbeitszimmerAbzug > result.homeofficePauschale) {
    rows.push(["   davon häusliches Arbeitszimmer", euro(result.arbeitszimmerAbzug)]);
  } else if (result.homeofficePauschale > 0) {
    rows.push(["   davon Homeoffice-Pauschale", euro(result.homeofficePauschale)]);
  }
  if (result.umzugAbzug > 0) rows.push(["   davon Umzugskosten", euro(result.umzugAbzug)]);
  if (result.reisekostenAbzug > 0) rows.push(["   davon Verpflegungspauschale", euro(result.reisekostenAbzug)]);
  if (result.doppelteHaushaltsfuehrungAbzug > 0) {
    rows.push(["   davon doppelte Haushaltsführung", euro(result.doppelteHaushaltsfuehrungAbzug)]);
  }
  rows.push(["Vorsorgeaufwendungen", euro(result.vorsorgeaufwendungen)]);
  rows.push(["Sonderausgaben (angesetzt)", euro(result.sonderausgabenAbzug)]);
  if (result.riesterSonderausgabenabzug > 0) {
    rows.push(["   davon Riester-Sonderausgabenabzug", euro(result.riesterSonderausgabenabzug)]);
  }
  if (result.ausbildungskostenAbzug > 0) rows.push(["   davon Ausbildungskosten", euro(result.ausbildungskostenAbzug)]);
  if (result.schulgeldAbzug > 0) rows.push(["   davon Schulgeld", euro(result.schulgeldAbzug)]);
  if (result.aussergewoehnlicheBelastungAbzug > 0) {
    rows.push(["Außergewöhnliche Belastungen", euro(result.aussergewoehnlicheBelastungAbzug)]);
  }
  if (result.pflegePauschbetrag > 0) rows.push(["Pflege-Pauschbetrag", euro(result.pflegePauschbetrag)]);
  if (result.unterhaltAbzug > 0) rows.push(["Unterhalt an Angehörige", euro(result.unterhaltAbzug)]);
  if (result.behindertenPauschbetrag > 0) {
    rows.push(["Behinderten-Pauschbetrag", euro(result.behindertenPauschbetrag)]);
  }
  if (state.personal.kinderAnzahl > 0) {
    rows.push([
      "Kinderfreibetrag berücksichtigt",
      result.guenstigerpruefungKinderfreibetragGreift ? "Ja" : "Nein (Kindergeld günstiger)",
    ]);
  }
  const ermaessigung35a = result.handwerkerErmaessigung + result.haushaltsnaheErmaessigung;
  if (ermaessigung35a > 0) {
    rows.push(["Einkommensteuer (tariflich)", euro(result.festgesetzteEinkommensteuer + ermaessigung35a)]);
    rows.push(["Steuerermäßigung Handwerker & Haushaltshilfen", "− " + euro(ermaessigung35a)]);
  }
  rows.push(["Festgesetzte Einkommensteuer", euro(result.festgesetzteEinkommensteuer)]);
  rows.push(["Solidaritätszuschlag", euro(result.solidaritaetszuschlag)]);
  if (state.personal.konfession !== "keine") {
    rows.push([`Kirchensteuer (${(result.kirchensteuersatz * 100).toFixed(0)} %)`, euro(result.kirchensteuer)]);
  }
  if (result.kapitalertraegeSteuerpflichtig > 0 && !result.kapitalertraegeGuenstigerpruefungGreift) {
    rows.push(["Abgeltungssteuer auf Kapitalerträge", euro(result.abgeltungssteuerAufKapitalertraege)]);
  }

  return (
    <main className="min-h-dvh bg-slate-50 pb-16">
      <div className="mx-auto max-w-xl px-5 pt-6 sm:px-6">
        <Link href="/interview" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Angaben bearbeiten
        </Link>

        <div
          className={`mt-5 overflow-hidden rounded-3xl border p-6 text-center shadow-sm ${
            isErstattung ? "border-brand-200 bg-gradient-to-b from-brand-50 to-white" : "border-amber-200 bg-gradient-to-b from-amber-50 to-white"
          }`}
        >
          {isErstattung ? (
            <CelebrationIllustration className="mx-auto h-28 w-28" />
          ) : (
            <ThinkingIllustration className="mx-auto h-28 w-28" />
          )}
          <p className="mt-2 text-sm font-medium text-slate-500">
            {isErstattung ? "Du bekommst voraussichtlich zurück" : "Voraussichtliche Nachzahlung"}
          </p>
          <p className={`mt-1 text-5xl font-extrabold tracking-tight ${isErstattung ? "text-brand-700" : "text-amber-700"}`}>
            <CountUp value={Math.abs(result.erstattungOderNachzahlung)} formatter={euro} />
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-400">Wie kommt das zustande?</h2>
          <dl className="space-y-0.5">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-slate-100 py-2.5 text-sm last:border-0">
                <dt className={label.startsWith("   ") ? "pl-3 text-slate-400" : "text-slate-500"}>{label.trim()}</dt>
                <dd className="shrink-0 whitespace-nowrap font-medium text-slate-900">{value}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 pt-3 text-base font-bold text-slate-900">
              <dt>Gesamte Steuerschuld</dt>
              <dd className="shrink-0 whitespace-nowrap">{euro(result.gesamteSteuerschuld)}</dd>
            </div>
            <div className="flex justify-between gap-4 pt-1 text-sm text-slate-500">
              <dt>Bereits gezahlt</dt>
              <dd className="shrink-0 whitespace-nowrap">{euro(result.bereitsGezahlt)}</dd>
            </div>
          </dl>
        </div>

        {state.income.minijobVorhanden && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Coins className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Dein Minijob</p>
              <p className="text-sm font-medium text-slate-900">
                {state.income.minijobPauschalversteuert
                  ? "Pauschal versteuert – steuerfrei, taucht in der Steuererklärung nicht auf."
                  : `Individuell versteuert – ${euro(result.minijobAngerechnet)} sind oben im Gehalt mit eingerechnet.`}
              </p>
            </div>
          </div>
        )}

        {state.personal.iban && (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
              <Landmark className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Erstattung geht an</p>
              <p className="font-medium text-slate-900">{state.personal.iban}</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => generateSteuerPdf(state, result).save("steuerfix-zusammenfassung.pdf")}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 active:scale-[0.99]"
        >
          <Download className="h-5 w-5" />
          Zusammenfassung als PDF
        </button>

        <a
          href="https://www.elster.de"
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Jetzt bei ELSTER einreichen
          <ExternalLink className="h-4 w-4" />
        </a>

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
          Vereinfachte, unverbindliche Schätzung auf Basis deiner Angaben – ersetzt keine
          Steuerberatung. Bitte übertrage die Werte selbst in ELSTER und prüfe sie dort vor der
          Übermittlung ans Finanzamt.
        </p>
      </div>
    </main>
  );
}
