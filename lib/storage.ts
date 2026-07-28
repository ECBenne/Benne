import type { TaxWizardState } from "./types";

const STORAGE_KEY = "taxifix-web-wizard-state";

export const initialWizardState: TaxWizardState = {
  personal: {
    vorname: "",
    nachname: "",
    steuerId: "",
    familienstand: "ledig",
    bundesland: "",
    kirchensteuerpflichtig: false,
    kinderAnzahl: 0,
  },
  income: {
    bruttoarbeitslohn: "",
    einbehalteneLohnsteuer: "",
    einbehalteneSoli: "",
    einbehalteneKirchensteuer: "",
    rentenversicherungAN: "",
    kvPvAN: "",
    arbeitslosenversicherungAN: "",
  },
  werbungskosten: {
    entfernungKm: "",
    arbeitstageProJahr: "220",
    weitereWerbungskosten: "",
  },
  sonderausgaben: {
    spenden: "",
    weitereSonderausgaben: "",
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
      werbungskosten: {
        ...initialWizardState.werbungskosten,
        ...parsed.werbungskosten,
      },
      sonderausgaben: {
        ...initialWizardState.sonderausgaben,
        ...parsed.sonderausgaben,
      },
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
}
