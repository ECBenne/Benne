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
  weitereAltersvorsorge: string;
  lohnersatzleistungen: string;
  minijobVorhanden: boolean;
  minijobPauschalversteuert: boolean;
  minijobBruttolohn: string;
  minijobLohnsteuer: string;
}

export interface KapitalertraegeData {
  kapitalertraege: string;
  einbehalteneKapitalertragsteuer: string;
  kapitalverluste: string;
}

export type BehinderungGrad =
  | "keine"
  | "20"
  | "30"
  | "40"
  | "50"
  | "60"
  | "70"
  | "80"
  | "90"
  | "100"
  | "bl_h";

export interface BehinderungData {
  grad: BehinderungGrad;
}

export interface WerbungskostenData {
  entfernungKm: string;
  arbeitstageProJahr: string;
  homeofficeTage: string;
  arbeitszimmerVorhanden: boolean;
  arbeitszimmerMittelpunkt: boolean;
  arbeitszimmerKosten: string;
  arbeitsmittelKosten: string;
  fortbildungKosten: string;
  bewerbungskosten: string;
  berufsverbandBeitrag: string;
  weitereWerbungskosten: string;
  umzugBeruflich: boolean;
  umzugWeiterePersonen: string;
  umzugTatsaechlicheKosten: string;
  reisetageUeber8Std: string;
  reisetageUeber24Std: string;
  doppelteHaushaltsfuehrung: boolean;
  zweitwohnungMieteJahr: string;
  familienheimfahrten: string;
  familienheimfahrtKm: string;
}

export interface SonderausgabenData {
  spenden: string;
  kinderbetreuungskosten: string;
  weitereSonderausgaben: string;
  riesterBeitrag: string;
  ausbildungskosten: string;
  schulgeld: string;
}

export interface HaushaltsnaheData {
  handwerkerleistungen: string;
  haushaltsnaheDienstleistungen: string;
}

export interface BelastungenData {
  krankheitskosten: string;
  pflegegrad: "keine" | "2" | "3" | "4" | "5";
  unterhaltBetrag: string;
  unterhaltEigeneinkuenfte: string;
}

export interface TaxWizardState {
  personal: PersonalData;
  income: IncomeData;
  werbungskosten: WerbungskostenData;
  sonderausgaben: SonderausgabenData;
  haushaltsnahe: HaushaltsnaheData;
  belastungen: BelastungenData;
  kapitalertraege: KapitalertraegeData;
  behinderung: BehinderungData;
}

export interface TaxCalculationResult {
  bruttoarbeitslohn: number;
  minijobAngerechnet: number;
  werbungskostenAbzug: number;
  homeofficePauschale: number;
  arbeitszimmerAbzug: number;
  umzugAbzug: number;
  reisekostenAbzug: number;
  doppelteHaushaltsfuehrungAbzug: number;
  vorsorgeaufwendungen: number;
  kinderbetreuungAbzug: number;
  riesterSonderausgabenabzug: number;
  riesterZulage: number;
  riesterGuenstigerpruefungGreift: boolean;
  ausbildungskostenAbzug: number;
  schulgeldAbzug: number;
  sonderausgabenAbzug: number;
  aussergewoehnlicheBelastungAbzug: number;
  zumutbareBelastung: number;
  behindertenPauschbetrag: number;
  pflegePauschbetrag: number;
  unterhaltAbzug: number;
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
  kapitalertraegeSteuerpflichtig: number;
  kapitalertraegeGuenstigerpruefungGreift: boolean;
  abgeltungssteuerAufKapitalertraege: number;
  festgesetzteEinkommensteuer: number;
  bemessungsgrundlageSoliKirche: number;
  solidaritaetszuschlag: number;
  kirchensteuer: number;
  kirchensteuersatz: number;
  gesamteSteuerschuld: number;
  bereitsGezahlt: number;
  erstattungOderNachzahlung: number;
}
