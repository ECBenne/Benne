import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface FormFieldProps {
  label: string;
  hint?: string;
  htmlFor: string;
  children: ReactNode;
}

export function FormField({ label, hint, htmlFor, children }: FormFieldProps) {
  return (
    <div className="mb-5">
      <label htmlFor={htmlFor} className="block text-base font-semibold text-slate-800">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

export function textInputClass(): string {
  return "block w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-base text-slate-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30";
}

export function EuroInput({
  id,
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        inputMode="decimal"
        autoFocus={autoFocus}
        className={textInputClass() + " pr-10"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">€</span>
    </div>
  );
}

export function HintBox({ children }: { children: ReactNode }) {
  return (
    <div className="mb-5 flex gap-2.5 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
      <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 16v-5M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p>{children}</p>
    </div>
  );
}

export function SkipHint({ text }: { text: string }) {
  return <p className="mt-3 text-center text-xs text-slate-400">{text}</p>;
}

export function YesNoToggle({
  value,
  onChange,
  yesLabel = "Ja",
  noLabel = "Nein",
}: {
  value: boolean;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-3">
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => onChange(true)}
        className={`rounded-xl border-2 px-4 py-3.5 text-center font-semibold transition ${
          value ? "border-brand-500 bg-brand-50 text-slate-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
        }`}
      >
        {yesLabel}
      </motion.button>
      <motion.button
        type="button"
        whileTap={{ scale: 0.96 }}
        onClick={() => onChange(false)}
        className={`rounded-xl border-2 px-4 py-3.5 text-center font-semibold transition ${
          !value ? "border-brand-500 bg-brand-50 text-slate-900" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
        }`}
      >
        {noLabel}
      </motion.button>
    </div>
  );
}
