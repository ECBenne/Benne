"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Baby,
  Briefcase,
  Car,
  ClipboardCheck,
  Church,
  Gift,
  Hammer,
  Heart,
  HeartHandshake,
  HeartPulse,
  Home as HomeIcon,
  IdCard,
  Landmark,
  Laptop,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import { WizardShell } from "@/components/WizardShell";
import {
  AddressStep,
  ChildrenStep,
  MaritalStatusStep,
  NameStep,
  ReligionStep,
  TaxIdStep,
} from "@/components/steps/PersonalSteps";
import { InsuranceStep, SalaryStep, WageReplacementStep } from "@/components/steps/IncomeSteps";
import { CommuteStep, HomeofficeStep, WorkExpensesStep } from "@/components/steps/ExpenseSteps";
import {
  ChildcareStep,
  DonationsStep,
  HandwerkerStep,
  HealthStep,
  HouseholdStep,
} from "@/components/steps/DeductionSteps";
import { BankStep, ReviewStep } from "@/components/steps/FinalSteps";
import { initialWizardState, loadWizardState, saveWizardState } from "@/lib/storage";
import type { TaxWizardState } from "@/lib/types";

interface StepDef {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  relevant?: (state: TaxWizardState) => boolean;
}

const STEP_DEFS: StepDef[] = [
  { id: "name", category: "Über dich", title: "Schön, dass du da bist!", subtitle: "Fangen wir mit deinem Namen an.", icon: <User className="h-6 w-6" /> },
  { id: "address", category: "Über dich", title: "Wo wohnst du?", icon: <HomeIcon className="h-6 w-6" /> },
  { id: "taxid", category: "Über dich", title: "Steuer-ID & Bundesland", icon: <IdCard className="h-6 w-6" /> },
  { id: "marital", category: "Über dich", title: "Wie ist dein Familienstand?", icon: <Heart className="h-6 w-6" /> },
  { id: "children", category: "Über dich", title: "Hast du Kinder?", icon: <Baby className="h-6 w-6" /> },
  { id: "religion", category: "Über dich", title: "Gehörst du einer Kirche an?", icon: <Church className="h-6 w-6" /> },
  { id: "salary", category: "Einkommen", title: "Dein Gehalt", icon: <Wallet className="h-6 w-6" /> },
  { id: "insurance", category: "Einkommen", title: "Deine Versicherungsbeiträge", icon: <ShieldCheck className="h-6 w-6" /> },
  { id: "wagereplacement", category: "Einkommen", title: "Elterngeld & Co.", icon: <HeartHandshake className="h-6 w-6" /> },
  { id: "commute", category: "Ausgaben & Vorteile", title: "Dein Arbeitsweg", icon: <Car className="h-6 w-6" /> },
  { id: "homeoffice", category: "Ausgaben & Vorteile", title: "Homeoffice", icon: <Laptop className="h-6 w-6" /> },
  { id: "workexpenses", category: "Ausgaben & Vorteile", title: "Kosten rund um den Job", icon: <Briefcase className="h-6 w-6" /> },
  {
    id: "childcare",
    category: "Ausgaben & Vorteile",
    title: "Kinderbetreuung",
    icon: <Baby className="h-6 w-6" />,
    relevant: (s) => s.personal.kinderAnzahl > 0,
  },
  { id: "donations", category: "Ausgaben & Vorteile", title: "Spenden", icon: <Gift className="h-6 w-6" /> },
  { id: "handwerker", category: "Ausgaben & Vorteile", title: "Handwerkerleistungen", icon: <Hammer className="h-6 w-6" /> },
  { id: "household", category: "Ausgaben & Vorteile", title: "Haushaltshilfen", icon: <Sparkles className="h-6 w-6" /> },
  { id: "health", category: "Ausgaben & Vorteile", title: "Krankheitskosten", icon: <HeartPulse className="h-6 w-6" /> },
  { id: "bank", category: "Fast fertig", title: "Deine Bankverbindung", icon: <Landmark className="h-6 w-6" /> },
  { id: "review", category: "Fast fertig", title: "Alles im Überblick", icon: <ClipboardCheck className="h-6 w-6" /> },
];

export default function InterviewPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<TaxWizardState>(initialWizardState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setState(loadWizardState());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveWizardState(state);
  }, [state, loaded]);

  const activeSteps = useMemo(
    () => STEP_DEFS.filter((s) => !s.relevant || s.relevant(state)),
    [state]
  );
  const clampedIndex = Math.min(stepIndex, activeSteps.length - 1);
  const step = activeSteps[clampedIndex];

  function update<K extends keyof TaxWizardState>(section: K, patch: Partial<TaxWizardState[K]>) {
    setState((prev) => ({ ...prev, [section]: { ...prev[section], ...patch } }));
  }

  function goNext() {
    if (clampedIndex === activeSteps.length - 1) {
      router.push("/ergebnis");
      return;
    }
    setStepIndex(clampedIndex + 1);
    window.scrollTo({ top: 0 });
  }

  function goBack() {
    setStepIndex(Math.max(clampedIndex - 1, 0));
    window.scrollTo({ top: 0 });
  }

  if (!loaded || !step) return null;

  const nextDisabled = step.id === "taxid" && !state.personal.bundesland;

  return (
    <WizardShell
      icon={step.icon}
      category={step.category}
      title={step.title}
      subtitle={step.subtitle}
      stepIndex={clampedIndex}
      totalSteps={activeSteps.length}
      onBack={goBack}
      onNext={goNext}
      canGoBack={clampedIndex > 0}
      nextDisabled={nextDisabled}
      nextLabel={step.id === "review" ? "Steuerschätzung berechnen" : "Weiter"}
    >
      {step.id === "name" && <NameStep data={state.personal} update={(p) => update("personal", p)} />}
      {step.id === "address" && <AddressStep data={state.personal} update={(p) => update("personal", p)} />}
      {step.id === "taxid" && <TaxIdStep data={state.personal} update={(p) => update("personal", p)} />}
      {step.id === "marital" && <MaritalStatusStep data={state.personal} update={(p) => update("personal", p)} />}
      {step.id === "children" && <ChildrenStep data={state.personal} update={(p) => update("personal", p)} />}
      {step.id === "religion" && <ReligionStep data={state.personal} update={(p) => update("personal", p)} />}
      {step.id === "salary" && <SalaryStep data={state.income} update={(p) => update("income", p)} />}
      {step.id === "insurance" && <InsuranceStep data={state.income} update={(p) => update("income", p)} />}
      {step.id === "wagereplacement" && <WageReplacementStep data={state.income} update={(p) => update("income", p)} />}
      {step.id === "commute" && <CommuteStep data={state.werbungskosten} update={(p) => update("werbungskosten", p)} />}
      {step.id === "homeoffice" && <HomeofficeStep data={state.werbungskosten} update={(p) => update("werbungskosten", p)} />}
      {step.id === "workexpenses" && <WorkExpensesStep data={state.werbungskosten} update={(p) => update("werbungskosten", p)} />}
      {step.id === "childcare" && <ChildcareStep data={state.sonderausgaben} update={(p) => update("sonderausgaben", p)} />}
      {step.id === "donations" && <DonationsStep data={state.sonderausgaben} update={(p) => update("sonderausgaben", p)} />}
      {step.id === "handwerker" && <HandwerkerStep data={state.haushaltsnahe} update={(p) => update("haushaltsnahe", p)} />}
      {step.id === "household" && <HouseholdStep data={state.haushaltsnahe} update={(p) => update("haushaltsnahe", p)} />}
      {step.id === "health" && <HealthStep data={state.belastungen} update={(p) => update("belastungen", p)} />}
      {step.id === "bank" && <BankStep data={state.personal} update={(p) => update("personal", p)} />}
      {step.id === "review" && <ReviewStep state={state} />}
    </WizardShell>
  );
}
