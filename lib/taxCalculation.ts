import {
  ARBEITNEHMERPAUSCHBETRAG,
  BEA_FREIBETRAG_BEIDE_ELTERN,
  GRUNDFREIBETRAG,
  KINDERFREIBETRAG_BEIDE_ELTERN,
  KINDERGELD_MONATLICH,
  KIRCHENSTEUER_8_PROZENT,
  KIRCHENSTEUER_8_PROZENT_LAENDER,
  KIRCHENSTEUER_9_PROZENT,
  PENDLERPAUSCHALE_AB_21KM,
  PENDLERPAUSCHALE_BIS_20KM,
  SOLI_FREIGRENZE_SINGLE,
  SOLI_FREIGRENZE_VERHEIRATET,
  SOLI_MILDERUNGSSATZ,
  SOLI_SATZ,
  SONDERAUSGABEN_PAUSCHBETRAG_SINGLE,
  SONDERAUSGABEN_PAUSCHBETRAG_VERHEIRATET,
  TARIFZONEN_2025,
} from "./constants";
import type { TaxCalculationResult, TaxWizardState } from "./types";

function num(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** § 32a EStG Grundtabelle 2025, zvE wird vorab auf volle Euro abgerundet. */
function grundtabelle2025(zvEInput: number): number {
  const zvE = Math.floor(Math.max(zvEInput, 0));
  let est: number;

  if (zvE <= GRUNDFREIBETRAG) {
    est = 0;
  } else if (zvE <= TARIFZONEN_2025.zone2End) {
    const y = (zvE - GRUNDFREIBETRAG) / 10000;
    est = (932.3 * y + 1400) * y;
  } else if (zvE <= TARIFZONEN_2025.zone3End) {
    const z = (zvE - TARIFZONEN_2025.zone2End) / 10000;
    est = (176.64 * z + 2397) * z + 1015.13;
  } else if (zvE <= TARIFZONEN_2025.zone4End) {
    est = 0.42 * zvE - 10911.92;
  } else {
    est = 0.45 * zvE - 19246.67;
  }

  return Math.floor(Math.max(est, 0));
}

function isVerheiratetZusammen(state: TaxWizardState): boolean {
  return state.personal.familienstand === "verheiratet_zusammen";
}

/** Einkommensteuer nach Grund- oder Splittingtarif. */
function berechneEinkommensteuer(zvE: number, splitting: boolean): number {
  if (splitting) {
    return grundtabelle2025(zvE / 2) * 2;
  }
  return grundtabelle2025(zvE);
}

function berechneSolidaritaetszuschlag(est: number, splitting: boolean): number {
  const freigrenze = splitting ? SOLI_FREIGRENZE_VERHEIRATET : SOLI_FREIGRENZE_SINGLE;
  if (est <= freigrenze) return 0;
  const milderung = SOLI_MILDERUNGSSATZ * (est - freigrenze);
  const voll = SOLI_SATZ * est;
  return Math.floor(Math.min(milderung, voll));
}

function kirchensteuersatzFuerBundesland(bundesland: string): number {
  return KIRCHENSTEUER_8_PROZENT_LAENDER.includes(bundesland)
    ? KIRCHENSTEUER_8_PROZENT
    : KIRCHENSTEUER_9_PROZENT;
}

export function berechneSteuer(state: TaxWizardState): TaxCalculationResult {
  const splitting = isVerheiratetZusammen(state);
  const { personal, income, werbungskosten, sonderausgaben } = state;

  const bruttoarbeitslohn = num(income.bruttoarbeitslohn);

  // Werbungskosten: höherer Wert aus Pauschbetrag und tatsächlichen Kosten
  const km = num(werbungskosten.entfernungKm);
  const tage = num(werbungskosten.arbeitstageProJahr) || 220;
  const ersten20km = Math.min(km, 20) * PENDLERPAUSCHALE_BIS_20KM;
  const ab21km = Math.max(km - 20, 0) * PENDLERPAUSCHALE_AB_21KM;
  const pendlerpauschale = (ersten20km + ab21km) * tage;
  const tatsaechlicheWerbungskosten =
    pendlerpauschale + num(werbungskosten.weitereWerbungskosten);
  const werbungskostenAbzug = Math.max(
    tatsaechlicheWerbungskosten,
    ARBEITNEHMERPAUSCHBETRAG
  );

  // Vorsorgeaufwendungen (Sonderausgaben): AN-Anteil RV zu 100 % abziehbar (seit 2023),
  // KV/PV-Pflichtbeiträge (Basisabsicherung) voll abziehbar. Vereinfachte Schätzung.
  const vorsorgeaufwendungen =
    num(income.rentenversicherungAN) + num(income.kvPvAN);

  // Sonderausgaben: höherer Wert aus Pauschbetrag und tatsächlichen Ausgaben
  const sonderausgabenPauschbetrag = splitting
    ? SONDERAUSGABEN_PAUSCHBETRAG_VERHEIRATET
    : SONDERAUSGABEN_PAUSCHBETRAG_SINGLE;
  const tatsaechlicheSonderausgaben =
    num(sonderausgaben.spenden) + num(sonderausgaben.weitereSonderausgaben);
  const sonderausgabenAbzug = Math.max(
    tatsaechlicheSonderausgaben,
    sonderausgabenPauschbetrag
  );

  const gesamtabzuege =
    werbungskostenAbzug + vorsorgeaufwendungen + sonderausgabenAbzug;
  const zuVersteuerndesEinkommen = Math.max(
    bruttoarbeitslohn - gesamtabzuege,
    0
  );

  // Kinderfreibetrag-Günstigerprüfung (§ 31 EStG)
  const kinderAnzahl = Math.max(personal.kinderAnzahl, 0);
  const freibetragProKind = splitting
    ? KINDERFREIBETRAG_BEIDE_ELTERN + BEA_FREIBETRAG_BEIDE_ELTERN
    : (KINDERFREIBETRAG_BEIDE_ELTERN + BEA_FREIBETRAG_BEIDE_ELTERN) / 2;
  const kinderfreibetragAbzug = kinderAnzahl * freibetragProKind;
  const kindergeldJahr = kinderAnzahl * KINDERGELD_MONATLICH * 12;

  const zuVersteuerndesEinkommenMitKinderfreibetrag = Math.max(
    zuVersteuerndesEinkommen - kinderfreibetragAbzug,
    0
  );

  const einkommensteuerOhneKinderfreibetrag = berechneEinkommensteuer(
    zuVersteuerndesEinkommen,
    splitting
  );
  const estMitKinderfreibetragVorErstattung = berechneEinkommensteuer(
    zuVersteuerndesEinkommenMitKinderfreibetrag,
    splitting
  );
  const einkommensteuerMitKinderfreibetrag =
    estMitKinderfreibetragVorErstattung + kindergeldJahr;

  const guenstigerpruefungKinderfreibetragGreift =
    kinderAnzahl > 0 &&
    einkommensteuerMitKinderfreibetrag < einkommensteuerOhneKinderfreibetrag;

  const festgesetzteEinkommensteuer = guenstigerpruefungKinderfreibetragGreift
    ? einkommensteuerMitKinderfreibetrag
    : einkommensteuerOhneKinderfreibetrag;

  // Soli & Kirchensteuer werden unabhängig von der Günstigerprüfung immer auf Basis
  // der ESt MIT Kinderfreibetrag berechnet (§ 51a EStG).
  const bemessungsgrundlageSoliKirche = kinderAnzahl > 0
    ? estMitKinderfreibetragVorErstattung
    : einkommensteuerOhneKinderfreibetrag;

  const solidaritaetszuschlag = berechneSolidaritaetszuschlag(
    bemessungsgrundlageSoliKirche,
    splitting
  );

  const kirchensteuersatz = personal.kirchensteuerpflichtig
    ? kirchensteuersatzFuerBundesland(personal.bundesland)
    : 0;
  const kirchensteuer = personal.kirchensteuerpflichtig
    ? Math.floor(bemessungsgrundlageSoliKirche * kirchensteuersatz)
    : 0;

  const gesamteSteuerschuld =
    festgesetzteEinkommensteuer + solidaritaetszuschlag + kirchensteuer;

  const bereitsGezahlt =
    num(income.einbehalteneLohnsteuer) +
    num(income.einbehalteneSoli) +
    num(income.einbehalteneKirchensteuer);

  const erstattungOderNachzahlung = bereitsGezahlt - gesamteSteuerschuld;

  return {
    bruttoarbeitslohn,
    werbungskostenAbzug,
    vorsorgeaufwendungen,
    sonderausgabenAbzug,
    kinderfreibetragAbzug,
    zuVersteuerndesEinkommen,
    zuVersteuerndesEinkommenMitKinderfreibetrag,
    einkommensteuerOhneKinderfreibetrag,
    einkommensteuerMitKinderfreibetrag,
    kindergeldJahr,
    guenstigerpruefungKinderfreibetragGreift,
    festgesetzteEinkommensteuer,
    bemessungsgrundlageSoliKirche,
    solidaritaetszuschlag,
    kirchensteuer,
    kirchensteuersatz,
    gesamteSteuerschuld,
    bereitsGezahlt,
    erstattungOderNachzahlung,
  };
}
