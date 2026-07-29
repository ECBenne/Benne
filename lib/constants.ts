/**
 * Steuerliche Eckwerte für den Veranlagungszeitraum 2025.
 * Quellen: § 32a EStG, BMF, finanz-tools.de, finanztip.de (Stand: Recherche Juli 2026).
 * Werte ohne Gewähr – dienen nur der Schätzung, keine Steuerberatung.
 */
export const ASSESSMENT_YEAR = 2025;

export const GRUNDFREIBETRAG = 12096;

// § 32a EStG Tarifzonen 2025 (Grundtabelle)
export const TARIFZONEN_2025 = {
  zone2Start: 12097,
  zone2End: 17443,
  zone3Start: 17444,
  zone3End: 68480,
  zone4Start: 68481,
  zone4End: 277825,
  zone5Start: 277826,
};

export const ARBEITNEHMERPAUSCHBETRAG = 1230;
export const SONDERAUSGABEN_PAUSCHBETRAG_SINGLE = 36;
export const SONDERAUSGABEN_PAUSCHBETRAG_VERHEIRATET = 72;
export const SPARERPAUSCHBETRAG_SINGLE = 1000;
export const SPARERPAUSCHBETRAG_VERHEIRATET = 2000;

export const PENDLERPAUSCHALE_BIS_20KM = 0.3; // €/km, erste 20 km
export const PENDLERPAUSCHALE_AB_21KM = 0.38; // €/km, ab dem 21. km

export const KINDERFREIBETRAG_BEIDE_ELTERN = 6672;
export const BEA_FREIBETRAG_BEIDE_ELTERN = 2928;
export const KINDERGELD_MONATLICH = 255;

export const SOLI_SATZ = 0.055;
export const SOLI_MILDERUNGSSATZ = 0.119;
export const SOLI_FREIGRENZE_SINGLE = 19950; // festzusetzende ESt
export const SOLI_FREIGRENZE_VERHEIRATET = 39900;

export const KIRCHENSTEUER_8_PROZENT_LAENDER = ["Bayern", "Baden-Württemberg"];
export const KIRCHENSTEUER_9_PROZENT = 0.09;
export const KIRCHENSTEUER_8_PROZENT = 0.08;

// Homeoffice-Pauschale (§ 4 Abs. 5 Nr. 6c EStG), unverändert seit 2023
export const HOMEOFFICE_PAUSCHALE_PRO_TAG = 6;
export const HOMEOFFICE_MAX_TAGE = 210;

// Kinderbetreuungskosten (§ 10 Abs. 1 Nr. 5 EStG): seit 2025 (JStG 2024) 80 % der
// Kosten, max. 4.800 €/Kind (vorher 2/3, max. 4.000 €).
export const KINDERBETREUUNG_ANTEIL = 0.8;
export const KINDERBETREUUNG_MAX_PRO_KIND = 4800;

// Umzugskostenpauschale (BUKG), Stand März 2024, unverändert 2025/2026
export const UMZUGSPAUSCHALE_BERECHTIGTE = 964;
export const UMZUGSPAUSCHALE_WEITERE_PERSON = 643;
export const UMZUGSPAUSCHALE_OHNE_HAUSSTAND = 482;

// Verpflegungspauschale bei Dienstreisen (§ 9 Abs. 4a EStG)
export const VERPFLEGUNGSPAUSCHALE_VOLLER_TAG = 28;
export const VERPFLEGUNGSPAUSCHALE_AN_ABREISE = 14;

// Familienheimfahrten bei doppelter Haushaltsführung: gleiche Pauschale wie Pendlerpauschale
export const FAMILIENHEIMFAHRT_PAUSCHALE_PRO_KM = 0.3;

// Riester-Rente (§ 10a EStG)
export const RIESTER_HOECHSTBETRAG = 2100;
export const RIESTER_GRUNDZULAGE = 175;
export const RIESTER_KINDERZULAGE_AB_2008 = 300;
export const RIESTER_KINDERZULAGE_VOR_2008 = 185;

// Pflege-Pauschbetrag (§ 33b Abs. 6 EStG), seit 2021 nach Pflegegrad gestaffelt
export const PFLEGE_PAUSCHBETRAG: Record<string, number> = {
  "2": 600,
  "3": 1100,
  "4": 1800,
  "5": 1800,
};

// Unterhalt an bedürftige Angehörige (§ 33a Abs. 1 EStG)
export const UNTERHALT_HOECHSTBETRAG = 12096; // entspricht dem Grundfreibetrag
export const UNTERHALT_ANRECHNUNGSFREIBETRAG = 624; // eigene Einkünfte des Empfängers

// Steuerermäßigung haushaltsnahe Beschäftigungen/Dienstleistungen & Handwerkerleistungen (§ 35a EStG)
export const HAUSHALTSNAHE_ANTEIL = 0.2;
export const HAUSHALTSNAHE_MAX_ERMAESSIGUNG = 4000;
export const HANDWERKER_ANTEIL = 0.2;
export const HANDWERKER_MAX_ERMAESSIGUNG = 1200;

// Zumutbare Belastung (§ 33 Abs. 3 EStG) – Prozentsatz vom Gesamtbetrag der Einkünfte
// je nach Einkommensstufe, Familienstand und Kinderzahl.
export const ZUMUTBARE_BELASTUNG_STUFEN = [15340, 51130];
export const ZUMUTBARE_BELASTUNG_SAETZE = {
  ohneKinderLedig: [0.05, 0.06, 0.07],
  ohneKinderVerheiratet: [0.04, 0.05, 0.06],
  einsZweiKinder: [0.02, 0.03, 0.04],
  dreiUndMehrKinder: [0.01, 0.01, 0.02],
};

// Abgeltungssteuer auf Kapitalerträge (§ 32d EStG)
export const ABGELTUNGSSTEUER_SATZ = 0.25;

// Behinderten-Pauschbetrag (§ 33b EStG), Werte seit 2021
export const BEHINDERTEN_PAUSCHBETRAG: Record<string, number> = {
  "20": 384,
  "30": 620,
  "40": 860,
  "50": 1140,
  "60": 1440,
  "70": 1780,
  "80": 2120,
  "90": 2460,
  "100": 2840,
};
export const BEHINDERTEN_PAUSCHBETRAG_BL_H = 7400;

// Häusliches Arbeitszimmer (§ 4 Abs. 5 Nr. 6b EStG), Jahrespauschale seit 2023 –
// nur wenn das Zimmer Mittelpunkt der gesamten beruflichen Tätigkeit ist. Alternativ
// zur Homeoffice-Pauschale (nicht kombinierbar für dieselben Tage).
export const ARBEITSZIMMER_JAHRESPAUSCHALE = 1260;

// Schulgeld für Privatschulen (§ 10 Abs. 1 Nr. 9 EStG): 30 % der Kosten, max. 5.000 €/Kind
export const SCHULGELD_ANTEIL = 0.3;
export const SCHULGELD_MAX_PRO_KIND = 5000;

export const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
] as const;
