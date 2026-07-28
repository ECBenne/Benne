"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Baby, FileCheck2, Sparkles } from "lucide-react";
import { HeroIllustration } from "@/components/illustrations";
import { clearWizardState, hasSavedProgress } from "@/lib/storage";

const steps = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Ein paar einfache Fragen",
    text: "Wie bei einem Gespräch – keine Fachbegriffe, keine Formulare.",
  },
  {
    icon: <FileCheck2 className="h-5 w-5" />,
    title: "Deine Steuerschätzung",
    text: "Wir rechnen live mit, nach aktuellem deutschen Steuerrecht.",
  },
  {
    icon: <Baby className="h-5 w-5" />,
    title: "Fertige Unterlagen",
    text: "PDF mit allen Werten, sortiert nach Formular – zum Einfügen bei ELSTER.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [savedProgress, setSavedProgress] = useState(false);

  useEffect(() => {
    setSavedProgress(hasSavedProgress());
  }, []);

  function startFresh() {
    clearWizardState();
    router.push("/interview");
  }

  return (
    <main className="min-h-dvh overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
      <div className="mx-auto max-w-xl px-5 pb-12 pt-8 sm:px-6 sm:pt-14">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            S
          </span>
          <span className="text-sm font-bold tracking-tight text-slate-900">Steuerfix</span>
        </div>

        <HeroIllustration className="mx-auto mt-6 h-52 w-full max-w-xs sm:h-64" />

        <h1 className="mt-6 text-center text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
          Steuererklärung, ohne Steuer-Chinesisch.
        </h1>
        <p className="mt-3 text-center text-base leading-relaxed text-slate-600">
          Beantworte ein paar einfache Fragen und erfahre in Minuten, ob du Geld vom Finanzamt zurückbekommst.
        </p>

        <ol className="mt-8 space-y-3">
          {steps.map((step, i) => (
            <li key={step.title} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                {step.icon}
              </span>
              <div>
                <p className="font-semibold text-slate-900">{step.title}</p>
                <p className="text-sm text-slate-500">{step.text}</p>
              </div>
              <span className="ml-auto text-xs font-bold text-slate-300">{i + 1}</span>
            </li>
          ))}
        </ol>

        {savedProgress ? (
          <>
            <motion.div whileTap={{ scale: 0.98 }}>
              <Link
                href="/interview"
                className="mt-8 flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
              >
                Weiter machen →
              </Link>
            </motion.div>
            <button
              type="button"
              onClick={startFresh}
              className="mt-3 w-full text-center text-sm font-medium text-slate-400 underline-offset-2 hover:underline"
            >
              Von vorne anfangen
            </button>
          </>
        ) : (
          <motion.div whileTap={{ scale: 0.98 }}>
            <Link
              href="/interview"
              className="mt-8 flex w-full items-center justify-center rounded-xl bg-brand-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
            >
              Kostenlos starten →
            </Link>
          </motion.div>
        )}

        <p className="mt-5 text-center text-xs leading-relaxed text-slate-400">
          Deine Angaben werden nur auf diesem Gerät gespeichert – du kannst jederzeit unterbrechen und
          später weitermachen. Vereinfachte, unverbindliche Schätzung, ersetzt keine Steuerberatung. Die
          Übermittlung ans Finanzamt erfolgt selbst über ELSTER. Gedacht für Angestellte mit Gehalt,
          Kapitalerträgen & haushaltsnahen Kosten – (noch) nicht für Selbstständigkeit, Vermietung oder
          Auslandseinkünfte.
        </p>
      </div>
    </main>
  );
}
