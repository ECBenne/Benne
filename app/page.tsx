import Link from "next/link";

const steps = [
  {
    title: "Fragebogen ausfüllen",
    text: "Beantworte einfache Fragen zu Gehalt, Werbungskosten und Sonderausgaben – wie bei einem Interview.",
  },
  {
    title: "Steuerschätzung erhalten",
    text: "Wir berechnen deine voraussichtliche Erstattung oder Nachzahlung nach aktuellem Steuerrecht.",
  },
  {
    title: "Unterlagen herunterladen",
    text: "Du bekommst eine PDF-Zusammenfassung aller Werte, sortiert nach den Steuerformularen (Anlagen) – zum Selbst-Übertragen bei ELSTER.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-600">
        Steuerfix
      </p>
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Deine Steuererklärung, verständlich erklärt.
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Beantworte ein paar Fragen und erhalte eine Schätzung deiner
        Steuererstattung – inklusive fertiger Zusammenfassung für ELSTER. Die
        Übermittlung ans Finanzamt machst du selbst.
      </p>

      <ol className="mt-10 space-y-5">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 font-semibold text-white">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-slate-900">{step.title}</p>
              <p className="text-slate-600">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>

      <Link
        href="/interview"
        className="mt-10 inline-flex w-fit items-center justify-center rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Jetzt starten
      </Link>

      <p className="mt-6 text-xs text-slate-400">
        Hinweis: Steuerfix bietet eine vereinfachte Schätzung auf Basis
        deiner Angaben und ersetzt keine Steuerberatung. Alle Werte ohne
        Gewähr – bitte vor dem Einreichen selbst prüfen.
      </p>
    </main>
  );
}
