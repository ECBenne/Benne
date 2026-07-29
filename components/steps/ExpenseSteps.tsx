import { EuroInput, FormField, HintBox, SkipHint, YesNoToggle, textInputClass } from "@/components/FormField";
import {
  ARBEITNEHMERPAUSCHBETRAG,
  ARBEITSZIMMER_JAHRESPAUSCHALE,
  HOMEOFFICE_MAX_TAGE,
  UMZUGSPAUSCHALE_BERECHTIGTE,
  UMZUGSPAUSCHALE_WEITERE_PERSON,
} from "@/lib/constants";
import type { WerbungskostenData } from "@/lib/types";

type Update = (patch: Partial<WerbungskostenData>) => void;

export function CommuteStep({ data, update }: { data: WerbungskostenData; update: Update }) {
  return (
    <div>
      <FormField label="Wie weit ist dein Arbeitsweg (einfache Strecke)?" hint="In Kilometern" htmlFor="km">
        <input
          id="km"
          autoFocus
          inputMode="decimal"
          className={textInputClass()}
          value={data.entfernungKm}
          onChange={(e) => update({ entfernungKm: e.target.value })}
          placeholder="z. B. 15"
        />
      </FormField>
      <FormField label="An wie vielen Tagen warst du im Büro / vor Ort?" htmlFor="tage">
        <input
          id="tage"
          inputMode="decimal"
          className={textInputClass()}
          value={data.arbeitstageProJahr}
          onChange={(e) => update({ arbeitstageProJahr: e.target.value })}
          placeholder="z. B. 220"
        />
      </FormField>
    </div>
  );
}

export function HomeofficeStep({ data, update }: { data: WerbungskostenData; update: Update }) {
  return (
    <div>
      <HintBox>
        Für jeden Tag im Homeoffice gibt es pauschal 6 € – ganz ohne Belege, bis maximal {HOMEOFFICE_MAX_TAGE} Tage im Jahr.
      </HintBox>
      <FormField label="An wie vielen Tagen hast du von zu Hause gearbeitet?" htmlFor="homeoffice">
        <input
          id="homeoffice"
          autoFocus
          inputMode="decimal"
          className={textInputClass()}
          value={data.homeofficeTage}
          onChange={(e) => update({ homeofficeTage: e.target.value })}
          placeholder="0"
        />
      </FormField>
    </div>
  );
}

export function ArbeitszimmerStep({ data, update }: { data: WerbungskostenData; update: Update }) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Anders als die Homeoffice-Pauschale gilt das für ein separates Zimmer, das (fast) nur beruflich
        genutzt wird und der Mittelpunkt deiner gesamten beruflichen Tätigkeit ist – z. B. wenn du
        komplett im Homeoffice arbeitest und kein Büro beim Arbeitgeber hast.
      </p>
      <FormField label="Hast du so ein Arbeitszimmer?" htmlFor="arbeitszimmer">
        <YesNoToggle value={data.arbeitszimmerVorhanden} onChange={(v) => update({ arbeitszimmerVorhanden: v })} />
      </FormField>
      {data.arbeitszimmerVorhanden && (
        <>
          <FormField
            label="Ist es der Mittelpunkt deiner kompletten beruflichen Tätigkeit?"
            hint="Kein anderer Arbeitsplatz beim Arbeitgeber verfügbar"
            htmlFor="arbeitszimmerMittelpunkt"
          >
            <YesNoToggle value={data.arbeitszimmerMittelpunkt} onChange={(v) => update({ arbeitszimmerMittelpunkt: v })} />
          </FormField>
          {data.arbeitszimmerMittelpunkt && (
            <FormField
              label="Tatsächliche Kosten im Jahr (falls höher als die Pauschale)"
              hint={`Anteilige Miete, Nebenkosten etc. – ohne Angabe nutzen wir die Pauschale von ${ARBEITSZIMMER_JAHRESPAUSCHALE.toLocaleString("de-DE")} €`}
              htmlFor="arbeitszimmerKosten"
            >
              <EuroInput id="arbeitszimmerKosten" autoFocus value={data.arbeitszimmerKosten} onChange={(v) => update({ arbeitszimmerKosten: v })} placeholder="0" />
            </FormField>
          )}
        </>
      )}
    </div>
  );
}

export function WorkExpensesStep({ data, update }: { data: WerbungskostenData; update: Update }) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Ohne Angaben rechnen wir automatisch mit der Pauschale von {ARBEITNEHMERPAUSCHBETRAG.toLocaleString("de-DE")} € – die bekommst du sowieso. Trag ein, was du tatsächlich ausgegeben hast.
      </p>
      <FormField label="Arbeitsmittel" hint="Laptop, Handy, Werkzeug, Bürobedarf" htmlFor="arbeitsmittel">
        <EuroInput id="arbeitsmittel" autoFocus value={data.arbeitsmittelKosten} onChange={(v) => update({ arbeitsmittelKosten: v })} placeholder="0" />
      </FormField>
      <FormField label="Fortbildung & Fachliteratur" hint="Kurse, Seminare, Fachbücher" htmlFor="fortbildung">
        <EuroInput id="fortbildung" value={data.fortbildungKosten} onChange={(v) => update({ fortbildungKosten: v })} placeholder="0" />
      </FormField>
      <FormField label="Bewerbungskosten" hint="Bewerbungsfotos, Porto, Fahrten zu Vorstellungsgesprächen" htmlFor="bewerbung">
        <EuroInput id="bewerbung" value={data.bewerbungskosten} onChange={(v) => update({ bewerbungskosten: v })} placeholder="0" />
      </FormField>
      <FormField label="Berufsverband / Gewerkschaft" hint="Mitgliedsbeiträge, z. B. Gewerkschaft" htmlFor="berufsverband">
        <EuroInput id="berufsverband" value={data.berufsverbandBeitrag} onChange={(v) => update({ berufsverbandBeitrag: v })} placeholder="0" />
      </FormField>
      <FormField label="Sonstiges" hint="Arbeitskleidung, Kontoführung usw." htmlFor="weitereWk">
        <EuroInput id="weitereWk" value={data.weitereWerbungskosten} onChange={(v) => update({ weitereWerbungskosten: v })} placeholder="0" />
      </FormField>
      <SkipHint text="Nicht sicher? Einfach leer lassen – wir nutzen dann die Pauschale." />
    </div>
  );
}

export function MovingStep({ data, update }: { data: WerbungskostenData; update: Update }) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Bist du wegen eines neuen Jobs oder eines kürzeren Arbeitswegs umgezogen? Dann gibt es dafür
        eine Pauschale von {UMZUGSPAUSCHALE_BERECHTIGTE.toLocaleString("de-DE")} € – ganz ohne Belege,
        pro weiterer Person im Haushalt {UMZUGSPAUSCHALE_WEITERE_PERSON.toLocaleString("de-DE")} € mehr.
      </p>
      <FormField label="War dein Umzug beruflich bedingt?" htmlFor="umzug">
        <YesNoToggle value={data.umzugBeruflich} onChange={(v) => update({ umzugBeruflich: v })} />
      </FormField>
      {data.umzugBeruflich && (
        <>
          <FormField label="Weitere Personen, die mit umgezogen sind" hint="Partner:in, Kinder – ohne dich selbst" htmlFor="umzugPersonen">
            <input
              id="umzugPersonen"
              autoFocus
              inputMode="numeric"
              className={textInputClass()}
              value={data.umzugWeiterePersonen}
              onChange={(e) => update({ umzugWeiterePersonen: e.target.value })}
              placeholder="0"
            />
          </FormField>
          <FormField
            label="Tatsächliche Umzugskosten (falls höher als die Pauschale)"
            hint="Spedition, Makler etc. – nur falls du Belege hast und mehr als die Pauschale ausgegeben hast"
            htmlFor="umzugKosten"
          >
            <EuroInput id="umzugKosten" value={data.umzugTatsaechlicheKosten} onChange={(v) => update({ umzugTatsaechlicheKosten: v })} placeholder="0" />
          </FormField>
        </>
      )}
    </div>
  );
}

export function TravelStep({ data, update }: { data: WerbungskostenData; update: Update }) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Warst du beruflich unterwegs (Dienstreisen, Kundentermine, Schulungen auswärts)? Dafür gibt es
        pauschale Verpflegungssätze – unabhängig von deinen tatsächlichen Kosten.
      </p>
      <FormField
        label="Tage mit 8–24 Std. Abwesenheit"
        hint="An- und Abreisetage bei mehrtägigen Reisen zählen auch dazu (14 € pro Tag)"
        htmlFor="reise8"
      >
        <input
          id="reise8"
          autoFocus
          inputMode="numeric"
          className={textInputClass()}
          value={data.reisetageUeber8Std}
          onChange={(e) => update({ reisetageUeber8Std: e.target.value })}
          placeholder="0"
        />
      </FormField>
      <FormField label="Tage mit vollen 24 Std. Abwesenheit" hint="28 € pro Tag" htmlFor="reise24">
        <input
          id="reise24"
          inputMode="numeric"
          className={textInputClass()}
          value={data.reisetageUeber24Std}
          onChange={(e) => update({ reisetageUeber24Std: e.target.value })}
          placeholder="0"
        />
      </FormField>
    </div>
  );
}

export function DualHouseholdStep({ data, update }: { data: WerbungskostenData; update: Update }) {
  return (
    <div>
      <p className="mb-4 text-sm text-slate-500">
        Hast du aus beruflichen Gründen eine zweite Wohnung am Arbeitsort, während dein Lebensmittelpunkt
        (z. B. mit Familie) woanders ist? Miete und Heimfahrten sind dann absetzbar.
      </p>
      <FormField label="Doppelte Haushaltsführung?" htmlFor="dhf">
        <YesNoToggle value={data.doppelteHaushaltsfuehrung} onChange={(v) => update({ doppelteHaushaltsfuehrung: v })} />
      </FormField>
      {data.doppelteHaushaltsfuehrung && (
        <>
          <FormField label="Miete für die Zweitwohnung im Jahr" htmlFor="dhfMiete">
            <EuroInput id="dhfMiete" autoFocus value={data.zweitwohnungMieteJahr} onChange={(v) => update({ zweitwohnungMieteJahr: v })} placeholder="0" />
          </FormField>
          <FormField label="Anzahl Familienheimfahrten im Jahr" hint="z. B. jedes Wochenende nach Hause = ca. 48" htmlFor="dhfFahrten">
            <input
              id="dhfFahrten"
              inputMode="numeric"
              className={textInputClass()}
              value={data.familienheimfahrten}
              onChange={(e) => update({ familienheimfahrten: e.target.value })}
              placeholder="0"
            />
          </FormField>
          <FormField label="Entfernung pro Heimfahrt (einfache Strecke, km)" htmlFor="dhfKm">
            <input
              id="dhfKm"
              inputMode="decimal"
              className={textInputClass()}
              value={data.familienheimfahrtKm}
              onChange={(e) => update({ familienheimfahrtKm: e.target.value })}
              placeholder="0"
            />
          </FormField>
        </>
      )}
    </div>
  );
}
