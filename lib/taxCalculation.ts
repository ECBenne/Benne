import {
  ARBEITNEHMERPAUSCHBETRAG,
  BEA_FREIBETRAG_BEIDE_ELTERN,
  GRUNDFREIBETRAG,
  HANDWERKER_ANTEIL,
  HANDWERKER_MAX_ERMAESSIGUNG,
  HAUSHALTSNAHE_ANTEIL,
  HAUSHALTSNAHE_MAX_ERMAESSIGUNG,
  HOMEOFFICE_MAX_TAGE,
  HOMEOFFICE_PAUSCHALE_PRO_TAG,
  KINDERBETREUUNG_ANTEIL,
  KINDERBETREUUNG_MAX_PRO_KIND,
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
  ZUMUTBARE_BELASTUNG_SAETZE,
  ZUMUTBARE_BELASTUNG_STUFEN,
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
function tarif(zvE: number, splitting: boolean): number {
  if (splitting) {
    return grundtabelle2025(zvE / 2) * 2;
  }
  return grundtabelle2025(zvE);
}

/**
 * Einkommensteuer inkl. Progressionsvorbehalt (§ 32b EStG) für Lohnersatzleistungen
 * wie Elterngeld, Kurzarbeitergeld oder Arbeitslosengeld: Der Steuersatz wird auf
 * Basis von (zvE + Lohnersatzleistungen) ermittelt, aber nur auf das zvE angewendet.
 */
function berechneEinkommensteuerMitProgressionsvorbehalt(
  zvE: number,
  lohnersatzleistungen: number,
  splitting: boolean
): number {
  if (lohnersatzleistungen <= 0) {
    return tarif(zvE, splitting);
  }
  const zvEMitLEL = zvE + lohnersatzleistungen;
  const estMitLEL = tarif(zvEMitLEL, splitting);
  const durchschnittssatz = zvEMitLEL > 0 ? estMitLEL / zvEMitLEL : 0;
  return Math.floor(Math.max(durchschnittssatz * zvE, 0));
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

function zumutbareBelastungSatz(
  familienstand: string,
  kinderAnzahl: number,
  stufeIndex: number
): number {
  if (kinderAnzahl >= 3) return ZUMUTBARE_BELASTUNG_SAETZE.dreiUndMehrKinder[stufeIndex];
  if (kinderAnzahl >= 1) return ZUMUTBARE_BELASTUNG_SAETZE.einsZweiKinder[stufeIndex];
  if (familienstand === "verheiratet_zusammen") {
    return ZUMUTBARE_BELASTUNG_SAETZE.ohneKinderVerheiratet[stufeIndex];
  }
  return ZUMUTBARE_BELASTUNG_SAETZE.ohneKinderLedig[stufeIndex];
}

function berechneZumutbareBelastung(
  gesamtbetragDerEinkuenfte: number,
  familienstand: string,
  kinderAnzahl: number
): number {
  const [stufe1, stufe2] = ZUMUTBARE_BELASTUNG_STUFEN;
  const gde = Math.max(gesamtbetragDerEinkuenfte, 0);

  let belastung = 0;
  const stufe1Betrag = Math.min(gde, stufe1);
  belastung += stufe1Betrag * zumutbareBelastungSatz(familienstand, kinderAnzahl, 0);

  if (gde > stufe1) {
    const stufe2Betrag = Math.min(gde, stufe2) - stufe1;
    belastung += stufe2Betrag * zumutbareBelastungSatz(familienstand, kinderAnzahl, 1);
  }
  if (gde > stufe2) {
    const stufe3Betrag = gde - stufe2;
    belastung += stufe3Betrag * zumutbareBelastungSatz(familienstand, kinderAnzahl, 2);
  }

  return belastung;
}

export function berechneSteuer(state: TaxWizardState): TaxCalculationResult {
  const splitting = isVerheiratetZusammen(state);
  const { personal, income, werbungskosten, sonderausgaben, haushaltsnahe, belastungen } = state;

  const bruttoarbeitslohn = num(income.bruttoarbeitslohn);

  // Werbungskosten: höherer Wert aus Pauschbetrag und tatsächlichen Kosten
  const km = num(werbungskosten.entfernungKm);
  const tage = num(werbungskosten.arbeitstageProJahr) || 220;
  const ersten20km = Math.min(km, 20) * PENDLERPAUSCHALE_BIS_20KM;
  const ab21km = Math.max(km - 20, 0) * PENDLERPAUSCHALE_AB_21KM;
  const pendlerpauschale = (ersten20km + ab21km) * tage;

  const homeofficeTageAngesetzt = Math.min(num(werbungskosten.homeofficeTage), HOMEOFFICE_MAX_TAGE);
  const homeofficePauschale = homeofficeTageAngesetzt * HOMEOFFICE_PAUSCHALE_PRO_TAG;

  const tatsaechlicheWerbungskosten =
    pendlerpauschale + homeofficePauschale + num(werbungskosten.weitereWerbungskosten);
  const werbungskostenAbzug = Math.max(tatsaechlicheWerbungskosten, ARBEITNEHMERPAUSCHBETRAG);

  // Vorsorgeaufwendungen (Sonderausgaben): AN-Anteil RV zu 100 % abziehbar (seit 2023),
  // KV/PV-Pflichtbeiträge (Basisabsicherung) voll abziehbar. Vereinfachte Schätzung.
  const vorsorgeaufwendungen = num(income.rentenversicherungAN) + num(income.kvPvAN);

  // Kinderbetreuungskosten: 2/3 der Kosten, max. 4.000 €/Kind (§ 10 Abs. 1 Nr. 5 EStG)
  const kinderbetreuungAbzug = Math.min(
    num(sonderausgaben.kinderbetreuungskosten) * KINDERBETREUUNG_ANTEIL,
    KINDERBETREUUNG_MAX_PRO_KIND * Math.max(personal.kinderAnzahl, 1)
  );

  // Sonderausgaben: höherer Wert aus Pauschbetrag und tatsächlichen Ausgaben
  const sonderausgabenPauschbetrag = splitting
    ? SONDERAUSGABEN_PAUSCHBETRAG_VERHEIRATET
    : SONDERAUSGABEN_PAUSCHBETRAG_SINGLE;
  const tatsaechlicheSonderausgaben =
    num(sonderausgaben.spenden) + kinderbetreuungAbzug + num(sonderausgaben.weitereSonderausgaben);
  const sonderausgabenAbzug = Math.max(tatsaechlicheSonderausgaben, sonderausgabenPauschbetrag);

  // Außergewöhnliche Belastungen: Krankheitskosten abzüglich zumutbarer Belastung
  const gesamtbetragDerEinkuenfte = Math.max(bruttoarbeitslohn - werbungskostenAbzug, 0);
  const zumutbareBelastung = berechneZumutbareBelastung(
    gesamtbetragDerEinkuenfte,
    personal.familienstand,
    personal.kinderAnzahl
  );
  const aussergewoehnlicheBelastungAbzug = Math.max(
    num(belastungen.krankheitskosten) - zumutbareBelastung,
    0
  );

  const gesamtabzuege =
    werbungskostenAbzug + vorsorgeaufwendungen + sonderausgabenAbzug + aussergewoehnlicheBelastungAbzug;
  const zuVersteuerndesEinkommen = Math.max(bruttoarbeitslohn - gesamtabzuege, 0);

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

  const lohnersatzleistungen = num(income.lohnersatzleistungen);

  const einkommensteuerOhneKinderfreibetrag = berechneEinkommensteuerMitProgressionsvorbehalt(
    zuVersteuerndesEinkommen,
    lohnersatzleistungen,
    splitting
  );
  const estMitKinderfreibetragVorErstattung = berechneEinkommensteuerMitProgressionsvorbehalt(
    zuVersteuerndesEinkommenMitKinderfreibetrag,
    lohnersatzleistungen,
    splitting
  );
  const einkommensteuerMitKinderfreibetrag = estMitKinderfreibetragVorErstattung + kindergeldJahr;

  const guenstigerpruefungKinderfreibetragGreift =
    kinderAnzahl > 0 && einkommensteuerMitKinderfreibetrag < einkommensteuerOhneKinderfreibetrag;

  const festgesetztVor35a = guenstigerpruefungKinderfreibetragGreift
    ? einkommensteuerMitKinderfreibetrag
    : einkommensteuerOhneKinderfreibetrag;

  // Steuerermäßigung § 35a EStG: Handwerkerleistungen & haushaltsnahe Dienstleistungen
  const handwerkerErmaessigung = Math.min(
    num(haushaltsnahe.handwerkerleistungen) * HANDWERKER_ANTEIL,
    HANDWERKER_MAX_ERMAESSIGUNG
  );
  const haushaltsnaheErmaessigung = Math.min(
    num(haushaltsnahe.haushaltsnaheDienstleistungen) * HAUSHALTSNAHE_ANTEIL,
    HAUSHALTSNAHE_MAX_ERMAESSIGUNG
  );
  const ermaessigung35a = handwerkerErmaessigung + haushaltsnaheErmaessigung;

  const festgesetzteEinkommensteuer = Math.max(festgesetztVor35a - ermaessigung35a, 0);

  // Soli & Kirchensteuer werden immer auf Basis der ESt MIT Kinderfreibetrag (vor
  // Kindergeld-Hinzurechnung) und nach Abzug der § 35a-Ermäßigung berechnet (§ 51a EStG).
  const bemessungsgrundlageSoliKirche = Math.max(
    estMitKinderfreibetragVorErstattung - ermaessigung35a,
    0
  );

  const solidaritaetszuschlag = berechneSolidaritaetszuschlag(bemessungsgrundlageSoliKirche, splitting);

  const kirchensteuersatz =
    personal.konfession !== "keine" ? kirchensteuersatzFuerBundesland(personal.bundesland) : 0;
  const kirchensteuer =
    personal.konfession !== "keine"
      ? Math.floor(bemessungsgrundlageSoliKirche * kirchensteuersatz)
      : 0;

  const gesamteSteuerschuld = festgesetzteEinkommensteuer + solidaritaetszuschlag + kirchensteuer;

  const bereitsGezahlt =
    num(income.einbehalteneLohnsteuer) +
    num(income.einbehalteneSoli) +
    num(income.einbehalteneKirchensteuer);

  const erstattungOderNachzahlung = bereitsGezahlt - gesamteSteuerschuld;

  return {
    bruttoarbeitslohn,
    werbungskostenAbzug,
    homeofficePauschale,
    vorsorgeaufwendungen,
    kinderbetreuungAbzug,
    sonderausgabenAbzug,
    aussergewoehnlicheBelastungAbzug,
    zumutbareBelastung,
    kinderfreibetragAbzug,
    gesamtabzuege,
    zuVersteuerndesEinkommen,
    zuVersteuerndesEinkommenMitKinderfreibetrag,
    einkommensteuerOhneKinderfreibetrag,
    einkommensteuerMitKinderfreibetrag,
    kindergeldJahr,
    guenstigerpruefungKinderfreibetragGreift,
    lohnersatzleistungen,
    steuersatzDurchProgressionsvorbehalt: lohnersatzleistungen > 0,
    handwerkerErmaessigung,
    haushaltsnaheErmaessigung,
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
