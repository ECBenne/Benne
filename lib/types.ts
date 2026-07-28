import { BUNDESLAENDER } from "./constants";

export type Bundesland = (typeof BUNDESLAENDER)[number];

export type Familienstand =
  | "ledig"
  | "verheiratet_zusammen"
  | "verheiratet_einzeln"
  | "verwitwet"
  | "geschieden";

export type Konfession = "keine" | "evangelisch" | "katholisch" | "andere";

export interface PersonalData {
  vorname: string;
  nachname: string;
  geburtsdatum: string;
  strasseHausnummer: string;
  plz: string;
  ort: string;
  steuerId: string;
  familienstand: Familienstand;
  bundesland: Bundesland | "";
  konfession: Konfession;
  kinderAnzahl: number;
  iban: string;
}

export interface IncomeData {
  bruttoarbeitslohn: string;
  einbehalteneLohnsteuer: string;
  einbehalteneSoli: string;
  einbehalteneKirchensteuer: string;
  rentenversicherungAN: string;
  kvPvAN: string;
  arbeitslosenversicherungAN: string;
  lohnersatzleistungen: string;
}

export interface WerbungskostenData {
  entfernungKm: string;
  arbeitstageProJahr: string;
  homeofficeTage: string;
  weitereWerbungskosten: string;
}

export interface SonderausgabenData {
  spenden: string;
  kinderbetreuungskosten: string;
  weitereSonderausgaben: string;
}

export interface HaushaltsnaheData {
  handwerkerleistungen: string;
  haushaltsnaheDienstleistungen: string;
}

export interface BelastungenData {
  krankheitskosten: string;
}

export interface TaxWizardState {
  personal: PersonalData;
  income: IncomeData;
  werbungskosten: WerbungskostenData;
  sonderausgaben: SonderausgabenData;
  haushaltsnahe: HaushaltsnaheData;
  belastungen: BelastungenData;
}

export interface TaxCalculationResult {
  bruttoarbeitslohn: number;
  werbungskostenAbzug: number;
  homeofficePauschale: number;
  vorsorgeaufwendungen: number;
  kinderbetreuungAbzug: number;
  sonderausgabenAbzug: number;
  aussergewoehnlicheBelastungAbzug: number;
  zumutbareBelastung: number;
  kinderfreibetragAbzug: number;
  gesamtabzuege: number;
  zuVersteuerndesEinkommen: number;
  zuVersteuerndesEinkommenMitKinderfreibetrag: number;
  einkommensteuerOhneKinderfreibetrag: number;
  einkommensteuerMitKinderfreibetrag: number;
  kindergeldJahr: number;
  guenstigerpruefungKinderfreibetragGreift: boolean;
  lohnersatzleistungen: number;
  steuersatzDurchProgressionsvorbehalt: boolean;
  handwerkerErmaessigung: number;
  haushaltsnaheErmaessigung: number;
  festgesetzteEinkommensteuer: number;
  bemessungsgrundlageSoliKirche: number;
  solidaritaetszuschlag: number;
  kirchensteuer: number;
  kirchensteuersatz: number;
  gesamteSteuerschuld: number;
  bereitsGezahlt: number;
  erstattungOderNachzahlung: number;
}
