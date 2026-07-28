interface FormFieldProps {
  label: string;
  hint?: string;
  htmlFor: string;
  children: React.ReactNode;
}

export function FormField({ label, hint, htmlFor, children }: FormFieldProps) {
  return (
    <div className="mb-5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function textInputClass(): string {
  return "block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500";
}
