import type { TaxWizardState } from "./types";

const STORAGE_KEY = "taxifix-web-wizard-state";

export const initialWizardState: TaxWizardState = {
  personal: {
    vorname: "",
    nachname: "",
    geburtsdatum: "",
    strasseHausnummer: "",
    plz: "",
    ort: "",
    steuerId: "",
    familienstand: "ledig",
    bundesland: "",
    konfession: "keine",
    kinderAnzahl: 0,
    iban: "",
  },
  income: {
    bruttoarbeitslohn: "",
    einbehalteneLohnsteuer: "",
    einbehalteneSoli: "",
    einbehalteneKirchensteuer: "",
    rentenversicherungAN: "",
    kvPvAN: "",
    arbeitslosenversicherungAN: "",
    weitereAltersvorsorge: "",
    lohnersatzleistungen: "",
  },
  werbungskosten: {
    entfernungKm: "",
    arbeitstageProJahr: "220",
    homeofficeTage: "",
    weitereWerbungskosten: "",
    umzugBeruflich: false,
    umzugWeiterePersonen: "",
    umzugTatsaechlicheKosten: "",
    reisetageUeber8Std: "",
    reisetageUeber24Std: "",
    doppelteHaushaltsfuehrung: false,
    zweitwohnungMieteJahr: "",
    familienheimfahrten: "",
    familienheimfahrtKm: "",
  },
  sonderausgaben: {
    spenden: "",
    kinderbetreuungskosten: "",
    weitereSonderausgaben: "",
    riesterBeitrag: "",
    ausbildungskosten: "",
  },
  haushaltsnahe: {
    handwerkerleistungen: "",
    haushaltsnaheDienstleistungen: "",
  },
  belastungen: {
    krankheitskosten: "",
    pflegegrad: "keine",
    unterhaltBetrag: "",
    unterhaltEigeneinkuenfte: "",
  },
  kapitalertraege: {
    kapitalertraege: "",
    einbehalteneKapitalertragsteuer: "",
  },
  behinderung: {
    grad: "keine",
  },
};

export function loadWizardState(): TaxWizardState {
  if (typeof window === "undefined") return initialWizardState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialWizardState;
    const parsed = JSON.parse(raw);
    return {
      personal: { ...initialWizardState.personal, ...parsed.personal },
      income: { ...initialWizardState.income, ...parsed.income },
      werbungskosten: { ...initialWizardState.werbungskosten, ...parsed.werbungskosten },
      sonderausgaben: { ...initialWizardState.sonderausgaben, ...parsed.sonderausgaben },
      haushaltsnahe: { ...initialWizardState.haushaltsnahe, ...parsed.haushaltsnahe },
      belastungen: { ...initialWizardState.belastungen, ...parsed.belastungen },
      kapitalertraege: { ...initialWizardState.kapitalertraege, ...parsed.kapitalertraege },
      behinderung: { ...initialWizardState.behinderung, ...parsed.behinderung },
    };
  } catch {
    return initialWizardState;
  }
}

export function saveWizardState(state: TaxWizardState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearWizardState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(STEP_KEY);
}

const STEP_KEY = "taxifix-web-wizard-step";

export function loadStepIndex(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STEP_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function saveStepIndex(index: number): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STEP_KEY, String(index));
}

/** Grobe Heuristik: gibt es schon nennenswert ausgefüllte Angaben zum Fortsetzen? */
export function hasSavedProgress(): boolean {
  if (typeof window === "undefined") return false;
  const state = loadWizardState();
  return (
    state.personal.vorname.trim() !== "" ||
    state.income.bruttoarbeitslohn.trim() !== "" ||
    loadStepIndex() > 0
  );
}
