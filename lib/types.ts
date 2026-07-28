import { BUNDESLAENDER } from "./constants";

export type Bundesland = (typeof BUNDESLAENDER)[number];

export type Familienstand =
  | "ledig"
  | "verheiratet_zusammen"
  | "verheiratet_einzeln"
  | "verwitwet"
  | "geschieden";

export interface PersonalData {
  vorname: string;
  nachname: string;
  steuerId: string;
  familienstand: Familienstand;
  bundesland: Bundesland | "";
  kirchensteuerpflichtig: boolean;
  kinderAnzahl: number;
}

export interface IncomeData {
  bruttoarbeitslohn: string;
  einbehalteneLohnsteuer: string;
  einbehalteneSoli: string;
  einbehalteneKirchensteuer: string;
  rentenversicherungAN: string;
  kvPvAN: string;
  arbeitslosenversicherungAN: string;
}

export interface WerbungskostenData {
  entfernungKm: string;
  arbeitstageProJahr: string;
  weitereWerbungskosten: string;
}

export interface SonderausgabenData {
  spenden: string;
  weitereSonderausgaben: string;
}

export interface TaxWizardState {
  personal: PersonalData;
  income: IncomeData;
  werbungskosten: WerbungskostenData;
  sonderausgaben: SonderausgabenData;
}

export interface TaxCalculationResult {
  bruttoarbeitslohn: number;
  werbungskostenAbzug: number;
  vorsorgeaufwendungen: number;
  sonderausgabenAbzug: number;
  kinderfreibetragAbzug: number;
  zuVersteuerndesEinkommen: number;
  zuVersteuerndesEinkommenMitKinderfreibetrag: number;
  einkommensteuerOhneKinderfreibetrag: number;
  einkommensteuerMitKinderfreibetrag: number;
  kindergeldJahr: number;
  guenstigerpruefungKinderfreibetragGreift: boolean;
  festgesetzteEinkommensteuer: number;
  bemessungsgrundlageSoliKirche: number;
  solidaritaetszuschlag: number;
  kirchensteuer: number;
  kirchensteuersatz: number;
  gesamteSteuerschuld: number;
  bereitsGezahlt: number;
  erstattungOderNachzahlung: number;
}
