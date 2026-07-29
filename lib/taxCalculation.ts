import {
  ABGELTUNGSSTEUER_SATZ,
  ARBEITNEHMERPAUSCHBETRAG,
  BEA_FREIBETRAG_BEIDE_ELTERN,
  BEHINDERTEN_PAUSCHBETRAG,
  BEHINDERTEN_PAUSCHBETRAG_BL_H,
  FAMILIENHEIMFAHRT_PAUSCHALE_PRO_KM,
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
  PFLEGE_PAUSCHBETRAG,
  RIESTER_GRUNDZULAGE,
  RIESTER_HOECHSTBETRAG,
  RIESTER_KINDERZULAGE_AB_2008,
  SOLI_FREIGRENZE_SINGLE,
  SOLI_FREIGRENZE_VERHEIRATET,
  SOLI_MILDERUNGSSATZ,
  SOLI_SATZ,
  SONDERAUSGABEN_PAUSCHBETRAG_SINGLE,
  SONDERAUSGABEN_PAUSCHBETRAG_VERHEIRATET,
  SPARERPAUSCHBETRAG_SINGLE,
  SPARERPAUSCHBETRAG_VERHEIRATET,
  TARIFZONEN_2025,
  UMZUGSPAUSCHALE_BERECHTIGTE,
  UMZUGSPAUSCHALE_WEITERE_PERSON,
  UNTERHALT_ANRECHNUNGSFREIBETRAG,
  UNTERHALT_HOECHSTBETRAG,
  VERPFLEGUNGSPAUSCHALE_AN_ABREISE,
  VERPFLEGUNGSPAUSCHALE_VOLLER_TAG,
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

function berechneBehindertenPauschbetrag(grad: string): number {
  if (grad === "bl_h") return BEHINDERTEN_PAUSCHBETRAG_BL_H;
  return BEHINDERTEN_PAUSCHBETRAG[grad] ?? 0;
}

interface TariflichesErgebnis {
  festgesetztVor35a: number;
  bemessungsgrundlageSoliKircheVor35a: number;
  guenstigerpruefungKinderfreibetragGreift: boolean;
  kinderfreibetragAbzug: number;
  kindergeldJahr: number;
}

/** Berechnet ESt inkl. Kinderfreibetrag-Günstigerprüfung (§ 31 EStG) und Progressionsvorbehalt für ein gegebenes zvE. */
function berechneTariflichesErgebnis(
  zvEBasis: number,
  kinderAnzahl: number,
  splitting: boolean,
  lohnersatzleistungen: number
): TariflichesErgebnis {
  const freibetragProKind = splitting
    ? KINDERFREIBETRAG_BEIDE_ELTERN + BEA_FREIBETRAG_BEIDE_ELTERN
    : (KINDERFREIBETRAG_BEIDE_ELTERN + BEA_FREIBETRAG_BEIDE_ELTERN) / 2;
  const kinderfreibetragAbzug = kinderAnzahl * freibetragProKind;
  const kindergeldJahr = kinderAnzahl * KINDERGELD_MONATLICH * 12;

  const zvEMitKinderfreibetrag = Math.max(zvEBasis - kinderfreibetragAbzug, 0);

  const estOhneKinderfreibetrag = berechneEinkommensteuerMitProgressionsvorbehalt(
    zvEBasis,
    lohnersatzleistungen,
    splitting
  );
  const estMitKinderfreibetragVorErstattung = berechneEinkommensteuerMitProgressionsvorbehalt(
    zvEMitKinderfreibetrag,
    lohnersatzleistungen,
    splitting
  );
  const estMitKinderfreibetrag = estMitKinderfreibetragVorErstattung + kindergeldJahr;

  const guenstigerpruefungKinderfreibetragGreift =
    kinderAnzahl > 0 && estMitKinderfreibetrag < estOhneKinderfreibetrag;

  return {
    festgesetztVor35a: guenstigerpruefungKinderfreibetragGreift
      ? estMitKinderfreibetrag
      : estOhneKinderfreibetrag,
    bemessungsgrundlageSoliKircheVor35a: estMitKinderfreibetragVorErstattung,
    guenstigerpruefungKinderfreibetragGreift,
    kinderfreibetragAbzug,
    kindergeldJahr,
  };
}

function abschluss(
  ergebnis: TariflichesErgebnis,
  ermaessigung35a: number,
  splitting: boolean,
  konfession: string,
  kirchensteuersatz: number
) {
  const festgesetzteEinkommensteuer = Math.max(ergebnis.festgesetztVor35a - ermaessigung35a, 0);
  const bemessungsgrundlageSoliKirche = Math.max(
    ergebnis.bemessungsgrundlageSoliKircheVor35a - ermaessigung35a,
    0
  );
  const solidaritaetszuschlag = berechneSolidaritaetszuschlag(bemessungsgrundlageSoliKirche, splitting);
  const kirchensteuer =
    konfession !== "keine" ? Math.floor(bemessungsgrundlageSoliKirche * kirchensteuersatz) : 0;
  const summe = festgesetzteEinkommensteuer + solidaritaetszuschlag + kirchensteuer;
  return { festgesetzteEinkommensteuer, bemessungsgrundlageSoliKirche, solidaritaetszuschlag, kirchensteuer, summe };
}

interface KernParams {
  zuVersteuerndesEinkommen: number;
  kinderAnzahl: number;
  splitting: boolean;
  lohnersatzleistungen: number;
  ermaessigung35a: number;
  konfession: string;
  kirchensteuersatz: number;
  kapitalertraegeSteuerpflichtig: number;
  abgeltungssteuerGesamt: number;
}

/** Rechnet Kinderfreibetrag- und Kapitalerträge-Günstigerprüfung für ein gegebenes zvE komplett durch. */
function berechneKern(p: KernParams) {
  const ergebnisOhneKapital = berechneTariflichesErgebnis(
    p.zuVersteuerndesEinkommen,
    p.kinderAnzahl,
    p.splitting,
    p.lohnersatzleistungen
  );
  const abschlussOhneKapital = abschluss(
    ergebnisOhneKapital,
    p.ermaessigung35a,
    p.splitting,
    p.konfession,
    p.kirchensteuersatz
  );
  const totalMitAbgeltungssteuer = abschlussOhneKapital.summe + p.abgeltungssteuerGesamt;

  let finalAbschluss = abschlussOhneKapital;
  let kapitalertraegeGuenstigerpruefungGreift = false;
  let abgeltungssteuerAufKapitalertraege = p.abgeltungssteuerGesamt;

  if (p.kapitalertraegeSteuerpflichtig > 0) {
    const ergebnisMitKapital = berechneTariflichesErgebnis(
      p.zuVersteuerndesEinkommen + p.kapitalertraegeSteuerpflichtig,
      p.kinderAnzahl,
      p.splitting,
      p.lohnersatzleistungen
    );
    const abschlussMitKapital = abschluss(
      ergebnisMitKapital,
      p.ermaessigung35a,
      p.splitting,
      p.konfession,
      p.kirchensteuersatz
    );
    if (abschlussMitKapital.summe < totalMitAbgeltungssteuer) {
      finalAbschluss = abschlussMitKapital;
      kapitalertraegeGuenstigerpruefungGreift = true;
      abgeltungssteuerAufKapitalertraege = 0;
    }
  }

  return {
    ergebnisOhneKapital,
    finalAbschluss,
    kapitalertraegeGuenstigerpruefungGreift,
    abgeltungssteuerAufKapitalertraege,
    gesamt: finalAbschluss.summe + abgeltungssteuerAufKapitalertraege,
  };
}

export function berechneSteuer(state: TaxWizardState): TaxCalculationResult {
  const splitting = state.personal.familienstand === "verheiratet_zusammen";
  const { personal, income, werbungskosten, sonderausgaben, haushaltsnahe, belastungen, kapitalertraege, behinderung } = state;

  // Minijob (geringfügige Beschäftigung): Wird er pauschal vom Arbeitgeber versteuert
  // (§ 40a EStG, der Normalfall), bleibt er komplett außen vor – steuerfrei und nicht
  // Teil der Steuererklärung. Nur ein individuell versteuerter Minijob (z. B. Steuerklasse VI)
  // zählt wie ein ganz normaler zweiter Arbeitgeber zum Bruttoarbeitslohn dazu.
  const minijobAngerechnet =
    income.minijobVorhanden && !income.minijobPauschalversteuert ? num(income.minijobBruttolohn) : 0;
  const minijobLohnsteuerAngerechnet =
    income.minijobVorhanden && !income.minijobPauschalversteuert ? num(income.minijobLohnsteuer) : 0;

  const bruttoarbeitslohn = num(income.bruttoarbeitslohn) + minijobAngerechnet;

  // Werbungskosten: höherer Wert aus Pauschbetrag und tatsächlichen Kosten
  const km = num(werbungskosten.entfernungKm);
  const tage = num(werbungskosten.arbeitstageProJahr) || 220;
  const ersten20km = Math.min(km, 20) * PENDLERPAUSCHALE_BIS_20KM;
  const ab21km = Math.max(km - 20, 0) * PENDLERPAUSCHALE_AB_21KM;
  const pendlerpauschale = (ersten20km + ab21km) * tage;

  const homeofficeTageAngesetzt = Math.min(num(werbungskosten.homeofficeTage), HOMEOFFICE_MAX_TAGE);
  const homeofficePauschale = homeofficeTageAngesetzt * HOMEOFFICE_PAUSCHALE_PRO_TAG;

  // Umzugskosten (beruflich veranlasst): Pauschale nach BUKG oder höhere Nachweiskosten
  const umzugPauschale = werbungskosten.umzugBeruflich
    ? UMZUGSPAUSCHALE_BERECHTIGTE + num(werbungskosten.umzugWeiterePersonen) * UMZUGSPAUSCHALE_WEITERE_PERSON
    : 0;
  const umzugAbzug = werbungskosten.umzugBeruflich
    ? Math.max(umzugPauschale, num(werbungskosten.umzugTatsaechlicheKosten))
    : 0;

  // Verpflegungsmehraufwand bei Dienstreisen (§ 9 Abs. 4a EStG)
  const reisekostenAbzug =
    num(werbungskosten.reisetageUeber8Std) * VERPFLEGUNGSPAUSCHALE_AN_ABREISE +
    num(werbungskosten.reisetageUeber24Std) * VERPFLEGUNGSPAUSCHALE_VOLLER_TAG;

  // Doppelte Haushaltsführung: Miete Zweitwohnung + Familienheimfahrten
  const doppelteHaushaltsfuehrungAbzug = werbungskosten.doppelteHaushaltsfuehrung
    ? num(werbungskosten.zweitwohnungMieteJahr) +
      num(werbungskosten.familienheimfahrten) *
        num(werbungskosten.familienheimfahrtKm) *
        FAMILIENHEIMFAHRT_PAUSCHALE_PRO_KM
    : 0;

  const tatsaechlicheWerbungskosten =
    pendlerpauschale +
    homeofficePauschale +
    num(werbungskosten.weitereWerbungskosten) +
    umzugAbzug +
    reisekostenAbzug +
    doppelteHaushaltsfuehrungAbzug;
  const werbungskostenAbzug = Math.max(tatsaechlicheWerbungskosten, ARBEITNEHMERPAUSCHBETRAG);

  // Vorsorgeaufwendungen (Sonderausgaben): AN-Anteil RV + Rürup/Basisrente zu 100 % abziehbar
  // (seit 2023), KV/PV-Pflichtbeiträge (Basisabsicherung) voll abziehbar. Vereinfachte Schätzung.
  const vorsorgeaufwendungen =
    num(income.rentenversicherungAN) + num(income.kvPvAN) + num(income.weitereAltersvorsorge);

  // Kinderbetreuungskosten: seit 2025 80 % der Kosten, max. 4.800 €/Kind (§ 10 Abs. 1 Nr. 5 EStG)
  const kinderbetreuungAbzug = Math.min(
    num(sonderausgaben.kinderbetreuungskosten) * KINDERBETREUUNG_ANTEIL,
    KINDERBETREUUNG_MAX_PRO_KIND * Math.max(personal.kinderAnzahl, 1)
  );

  // Ausbildungskosten (Erstausbildung/Erststudium ohne Ausbildungsverhältnis), max. 6.000 €
  const ausbildungskostenAbzug = Math.min(num(sonderausgaben.ausbildungskosten), 6000);

  // Riester-Rente: Sonderausgabenabzug (max. 2.100 €) vs. Zulage – Günstigerprüfung (§ 10a EStG)
  const kinderAnzahl = Math.max(personal.kinderAnzahl, 0);
  const riesterZulage = num(sonderausgaben.riesterBeitrag) > 0 ? RIESTER_GRUNDZULAGE + kinderAnzahl * RIESTER_KINDERZULAGE_AB_2008 : 0;
  const riesterSonderausgabenabzug = Math.min(
    num(sonderausgaben.riesterBeitrag) + riesterZulage,
    RIESTER_HOECHSTBETRAG
  );

  // Sonderausgaben: höherer Wert aus Pauschbetrag und tatsächlichen Ausgaben
  const sonderausgabenPauschbetrag = splitting
    ? SONDERAUSGABEN_PAUSCHBETRAG_VERHEIRATET
    : SONDERAUSGABEN_PAUSCHBETRAG_SINGLE;
  const sonstigeSonderausgaben =
    num(sonderausgaben.spenden) +
    kinderbetreuungAbzug +
    num(sonderausgaben.weitereSonderausgaben) +
    ausbildungskostenAbzug;
  const sonderausgabenAbzugOhneRiester = Math.max(sonstigeSonderausgaben, sonderausgabenPauschbetrag);
  const sonderausgabenAbzugMitRiester = sonderausgabenAbzugOhneRiester + riesterSonderausgabenabzug;

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

  // Pflege-Pauschbetrag (§ 33b Abs. 6 EStG) – ohne Anrechnung einer zumutbaren Belastung
  const pflegePauschbetrag = PFLEGE_PAUSCHBETRAG[belastungen.pflegegrad] ?? 0;

  // Unterhalt an bedürftige Angehörige (§ 33a Abs. 1 EStG)
  const unterhaltEigeneinkuenfteAnrechnung = Math.max(
    num(belastungen.unterhaltEigeneinkuenfte) - UNTERHALT_ANRECHNUNGSFREIBETRAG,
    0
  );
  const unterhaltHoechstbetrag = Math.max(UNTERHALT_HOECHSTBETRAG - unterhaltEigeneinkuenfteAnrechnung, 0);
  const unterhaltAbzug = Math.min(num(belastungen.unterhaltBetrag), unterhaltHoechstbetrag);

  // Behinderten-Pauschbetrag (§ 33b EStG)
  const behindertenPauschbetrag = berechneBehindertenPauschbetrag(behinderung.grad);

  const sonstigeAbzuege =
    werbungskostenAbzug +
    vorsorgeaufwendungen +
    aussergewoehnlicheBelastungAbzug +
    behindertenPauschbetrag +
    pflegePauschbetrag +
    unterhaltAbzug;

  const zuVersteuerndesEinkommenOhneRiester = Math.max(
    bruttoarbeitslohn - sonstigeAbzuege - sonderausgabenAbzugOhneRiester,
    0
  );
  const zuVersteuerndesEinkommenMitRiester = Math.max(
    bruttoarbeitslohn - sonstigeAbzuege - sonderausgabenAbzugMitRiester,
    0
  );

  const lohnersatzleistungen = num(income.lohnersatzleistungen);

  const kirchensteuersatz =
    personal.konfession !== "keine" ? kirchensteuersatzFuerBundesland(personal.bundesland) : 0;

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

  // Kapitalerträge: Abgeltungssteuer (25 % + Soli + ggf. Kirchensteuer) vs. Günstigerprüfung
  const sparerpauschbetrag = splitting ? SPARERPAUSCHBETRAG_VERHEIRATET : SPARERPAUSCHBETRAG_SINGLE;
  const kapitalertraegeSteuerpflichtig = Math.max(
    num(kapitalertraege.kapitalertraege) - sparerpauschbetrag,
    0
  );
  const abgeltungssteuerBasis = Math.floor(kapitalertraegeSteuerpflichtig * ABGELTUNGSSTEUER_SATZ);
  const soliAufAbgeltungssteuer = Math.floor(abgeltungssteuerBasis * SOLI_SATZ);
  const kirchensteuerAufAbgeltungssteuer =
    personal.konfession !== "keine" ? Math.floor(abgeltungssteuerBasis * kirchensteuersatz) : 0;
  const abgeltungssteuerGesamt = abgeltungssteuerBasis + soliAufAbgeltungssteuer + kirchensteuerAufAbgeltungssteuer;

  const kernParamsBasis = {
    kinderAnzahl,
    splitting,
    lohnersatzleistungen,
    ermaessigung35a,
    konfession: personal.konfession,
    kirchensteuersatz,
    kapitalertraegeSteuerpflichtig,
    abgeltungssteuerGesamt,
  };

  const kernOhneRiester = berechneKern({
    ...kernParamsBasis,
    zuVersteuerndesEinkommen: zuVersteuerndesEinkommenOhneRiester,
  });

  let kern = kernOhneRiester;
  let sonderausgabenAbzug = sonderausgabenAbzugOhneRiester;
  let zuVersteuerndesEinkommen = zuVersteuerndesEinkommenOhneRiester;
  let riesterGuenstigerpruefungGreift = false;

  if (riesterSonderausgabenabzug > 0) {
    const kernMitRiester = berechneKern({
      ...kernParamsBasis,
      zuVersteuerndesEinkommen: zuVersteuerndesEinkommenMitRiester,
    });
    if (kernOhneRiester.gesamt - kernMitRiester.gesamt > riesterZulage) {
      kern = kernMitRiester;
      sonderausgabenAbzug = sonderausgabenAbzugMitRiester;
      zuVersteuerndesEinkommen = zuVersteuerndesEinkommenMitRiester;
      riesterGuenstigerpruefungGreift = true;
    }
  }

  const gesamteSteuerschuld = kern.gesamt;

  const bereitsGezahlt =
    num(income.einbehalteneLohnsteuer) +
    minijobLohnsteuerAngerechnet +
    num(income.einbehalteneSoli) +
    num(income.einbehalteneKirchensteuer) +
    num(kapitalertraege.einbehalteneKapitalertragsteuer);

  const erstattungOderNachzahlung = bereitsGezahlt - gesamteSteuerschuld;

  return {
    bruttoarbeitslohn,
    minijobAngerechnet,
    werbungskostenAbzug,
    homeofficePauschale,
    umzugAbzug,
    reisekostenAbzug,
    doppelteHaushaltsfuehrungAbzug,
    vorsorgeaufwendungen,
    kinderbetreuungAbzug,
    riesterSonderausgabenabzug: riesterGuenstigerpruefungGreift ? riesterSonderausgabenabzug : 0,
    riesterZulage,
    riesterGuenstigerpruefungGreift,
    ausbildungskostenAbzug,
    sonderausgabenAbzug,
    aussergewoehnlicheBelastungAbzug,
    zumutbareBelastung,
    behindertenPauschbetrag,
    pflegePauschbetrag,
    unterhaltAbzug,
    kinderfreibetragAbzug: kern.ergebnisOhneKapital.kinderfreibetragAbzug,
    gesamtabzuege: sonstigeAbzuege + sonderausgabenAbzug,
    zuVersteuerndesEinkommen,
    zuVersteuerndesEinkommenMitKinderfreibetrag: Math.max(
      zuVersteuerndesEinkommen - kern.ergebnisOhneKapital.kinderfreibetragAbzug,
      0
    ),
    einkommensteuerOhneKinderfreibetrag: kern.ergebnisOhneKapital.festgesetztVor35a,
    einkommensteuerMitKinderfreibetrag: kern.ergebnisOhneKapital.festgesetztVor35a,
    kindergeldJahr: kern.ergebnisOhneKapital.kindergeldJahr,
    guenstigerpruefungKinderfreibetragGreift: kern.ergebnisOhneKapital.guenstigerpruefungKinderfreibetragGreift,
    lohnersatzleistungen,
    steuersatzDurchProgressionsvorbehalt: lohnersatzleistungen > 0,
    handwerkerErmaessigung,
    haushaltsnaheErmaessigung,
    kapitalertraegeSteuerpflichtig,
    kapitalertraegeGuenstigerpruefungGreift: kern.kapitalertraegeGuenstigerpruefungGreift,
    abgeltungssteuerAufKapitalertraege: kern.abgeltungssteuerAufKapitalertraege,
    festgesetzteEinkommensteuer: kern.finalAbschluss.festgesetzteEinkommensteuer,
    bemessungsgrundlageSoliKirche: kern.finalAbschluss.bemessungsgrundlageSoliKirche,
    solidaritaetszuschlag: kern.finalAbschluss.solidaritaetszuschlag,
    kirchensteuer: kern.finalAbschluss.kirchensteuer,
    kirchensteuersatz,
    gesamteSteuerschuld,
    bereitsGezahlt,
    erstattungOderNachzahlung,
  };
}
