import { jsPDF } from "jspdf";
import { ASSESSMENT_YEAR } from "./constants";
import type { TaxCalculationResult, TaxWizardState } from "./types";

const euro = (n: number) =>
  n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export function generateSteuerPdf(
  state: TaxWizardState,
  result: TaxCalculationResult
): jsPDF {
  const doc = new jsPDF();
  const marginX = 18;
  let y = 20;

  const heading = (text: string) => {
    y += 4;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(text, marginX, y);
    y += 2;
    doc.setDrawColor(200);
    doc.line(marginX, y, 192, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
  };

  const row = (label: string, value: string) => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }
    doc.setTextColor(90);
    doc.text(label, marginX, y);
    doc.setTextColor(20);
    doc.text(value, 192, y, { align: "right" });
    y += 6.5;
  };

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Steuerfix – Zusammenfassung", marginX, y);
  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110);
  doc.text(
    `Steuerschätzung für den Veranlagungszeitraum ${ASSESSMENT_YEAR} · Erstellt am ${new Date().toLocaleDateString("de-DE")}`,
    marginX,
    y
  );
  doc.setTextColor(20);
  y += 8;

  heading("Mantelbogen (ESt 1 A) – Persönliche Daten");
  row("Name", `${state.personal.vorname} ${state.personal.nachname}`.trim() || "–");
  row("Steuer-ID", state.personal.steuerId || "–");
  row("Bundesland", state.personal.bundesland || "–");
  row("Familienstand", familienstandLabel(state.personal.familienstand));
  row("Anzahl Kinder", String(state.personal.kinderAnzahl));
  row("Kirchensteuerpflichtig", state.personal.kirchensteuerpflichtig ? "Ja" : "Nein");

  heading("Anlage N – Einkünfte aus nichtselbstständiger Arbeit");
  row("Bruttoarbeitslohn", euro(result.bruttoarbeitslohn));
  row("Einbehaltene Lohnsteuer", euro(parseNum(state.income.einbehalteneLohnsteuer)));
  row("Einbehaltener Solidaritätszuschlag", euro(parseNum(state.income.einbehalteneSoli)));
  row("Einbehaltene Kirchensteuer", euro(parseNum(state.income.einbehalteneKirchensteuer)));
  row("Werbungskosten (angesetzt)", euro(result.werbungskostenAbzug));
  row("  davon Entfernungspauschale-Basis (km)", `${state.werbungskosten.entfernungKm || 0} km × ${state.werbungskosten.arbeitstageProJahr || 220} Tage`);

  heading("Anlage Vorsorgeaufwand");
  row("Rentenversicherung (AN-Anteil)", euro(parseNum(state.income.rentenversicherungAN)));
  row("Kranken-/Pflegeversicherung (AN-Anteil)", euro(parseNum(state.income.kvPvAN)));
  row("Summe abziehbare Vorsorgeaufwendungen", euro(result.vorsorgeaufwendungen));

  heading("Anlage Sonderausgaben");
  row("Spenden & Mitgliedsbeiträge", euro(parseNum(state.sonderausgaben.spenden)));
  row("Weitere Sonderausgaben", euro(parseNum(state.sonderausgaben.weitereSonderausgaben)));
  row("Angesetzte Sonderausgaben (inkl. Pauschbetrag)", euro(result.sonderausgabenAbzug));

  if (state.personal.kinderAnzahl > 0) {
    heading("Anlage Kind");
    row("Kinderfreibetrag + BEA (gesamt)", euro(result.kinderfreibetragAbzug));
    row("Erhaltenes Kindergeld (Jahr)", euro(result.kindergeldJahr));
    row(
      "Günstigerprüfung",
      result.guenstigerpruefungKinderfreibetragGreift
        ? "Kinderfreibetrag vorteilhafter"
        : "Kindergeld bleibt vorteilhafter"
    );
  }

  heading("Ergebnis der Steuerschätzung");
  row("Zu versteuerndes Einkommen", euro(result.zuVersteuerndesEinkommen));
  row("Festgesetzte Einkommensteuer", euro(result.festgesetzteEinkommensteuer));
  row("Solidaritätszuschlag", euro(result.solidaritaetszuschlag));
  if (state.personal.kirchensteuerpflichtig) {
    row(`Kirchensteuer (${(result.kirchensteuersatz * 100).toFixed(0)} %)`, euro(result.kirchensteuer));
  }
  row("Gesamte Steuerschuld", euro(result.gesamteSteuerschuld));
  row("Bereits gezahlt (Lohnsteuer/Soli/Kirchensteuer)", euro(result.bereitsGezahlt));

  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const resultLabel =
    result.erstattungOderNachzahlung >= 0
      ? "Voraussichtliche Erstattung"
      : "Voraussichtliche Nachzahlung";
  row(resultLabel, euro(Math.abs(result.erstattungOderNachzahlung)));

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(140);
  y += 8;
  const disclaimer =
    "Diese Zusammenfassung ist eine vereinfachte, unverbindliche Schätzung auf Basis deiner Angaben und ersetzt keine Steuerberatung. " +
    "Bitte übertrage die Werte selbst in ELSTER (www.elster.de) und prüfe sie dort vor der Übermittlung ans Finanzamt.";
  doc.text(doc.splitTextToSize(disclaimer, 174), marginX, y);

  return doc;
}

function parseNum(value: string): number {
  const n = parseFloat(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function familienstandLabel(value: string): string {
  switch (value) {
    case "ledig":
      return "Ledig";
    case "verheiratet_zusammen":
      return "Verheiratet – Zusammenveranlagung";
    case "verheiratet_einzeln":
      return "Verheiratet – Einzelveranlagung";
    case "verwitwet":
      return "Verwitwet";
    case "geschieden":
      return "Geschieden";
    default:
      return value;
  }
}
