import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface WizardShellProps {
  icon: ReactNode;
  category: string;
  title: string;
  subtitle?: string;
  stepIndex: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  children: ReactNode;
}

export function WizardShell({
  icon,
  category,
  title,
  subtitle,
  stepIndex,
  totalSteps,
  onBack,
  onNext,
  canGoBack,
  nextLabel = "Weiter",
  nextDisabled,
  children,
}: WizardShellProps) {
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-slate-50/90 px-4 pb-3 pt-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            aria-label="Zurück"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200/70 disabled:opacity-0"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="2">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="w-10 shrink-0 text-right text-xs font-medium text-slate-400">
            {stepIndex + 1}/{totalSteps}
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-32 pt-6 sm:px-6">
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="mb-5 flex items-center gap-3"
        >
          <motion.span
            initial={{ scale: 0.6, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-600"
          >
            {icon}
          </motion.span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{category}</p>
            <h1 className="text-xl font-bold leading-tight text-slate-900">{title}</h1>
          </div>
        </motion.div>
        {subtitle && <p className="mb-5 text-sm leading-relaxed text-slate-500">{subtitle}</p>}

        {children}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
        <p className="mx-auto mb-2 flex max-w-xl items-center justify-center gap-1 text-center text-xs text-slate-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Automatisch gespeichert – du kannst jederzeit später weitermachen
        </p>
        <div className="mx-auto flex max-w-xl gap-3">
          <motion.button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-xl bg-brand-600 px-6 py-3.5 text-center text-base font-semibold text-white shadow-sm shadow-brand-600/20 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {nextLabel}
          </motion.button>
        </div>
      </footer>
    </div>
  );
}
