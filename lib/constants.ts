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
