import { useState } from "react";
import { NoteField } from "../components/NoteField";
import { Card, InlineMessage } from "../components/Primitives";
import { cx } from "../lib/cx";
import { Section, SubHeading } from "./Section";

interface DifferenceRow {
  readonly trait: string;
  readonly billing: string;
  readonly internal: string;
}

const DIFFERENCES: readonly DifferenceRow[] = [
  { trait: "Randschiene", billing: "4px durchgezogen, Akzentfarbe", internal: "4px unterbrochen, Grau" },
  {
    trait: "Kopfband",
    billing: "„Verlässt Takt · steht in der Abrechnung“, Pfeil nach außen",
    internal: "„Bleibt in Takt“, Schloss",
  },
  {
    trait: "Marke vor der Beschriftung",
    billing: "gefülltes Quadrat mit Pfeil nach außen",
    internal: "gestrichelte Kontur mit Schloss",
  },
  { trait: "Schreibfläche", billing: "hell, wie ein Ausgabefeld", internal: "gedämpft, wie ein Notizzettel" },
  {
    trait: "Fußnote",
    billing: "nennt Empfänger und Zielfeld der Exportvorlage",
    internal: "sagt ausdrücklich „wird nie exportiert“",
  },
  { trait: "Ort", billing: "immer an einer Buchung", internal: "immer am Todo" },
];

export function NotesSection() {
  const [billingNote, setBillingNote] = useState(
    "Fehleranalyse im Rechnungslauf durchgeführt und die Zuordnung der Positionen korrigiert.",
  );
  const [internalNote, setInternalNote] = useState(
    "Ansprechpartner ist im Urlaub. Vertretung meldet sich erst nächste Woche.",
  );
  const [emptyBilling, setEmptyBilling] = useState("");
  const [grayscale, setGrayscale] = useState(false);

  return (
    <Section
      id="notizen"
      title="7 — Vermerk und Leistung: zwei Feldarten"
      lead="In der Spezifikation heißen beide Felder „Notiz“. Nur eines geht in die Abrechnung. Das ist der wahrscheinlichste Bedienfehler dieses Produkts, und er fällt erst beim Kunden auf. Deshalb tragen sie nach E-016 Namen ohne gemeinsamen Wortstamm — Vermerk bleibt in Takt, Leistung geht in den Export — und sind zusätzlich zwei sichtbar verschiedene Feldarten."
      refs={["A-7.1", "A-7.2", "A-7.3", "A-7.4", "E-016", "R-08", "R-06"]}
    >
      <Card
        title="Die zwei Feldarten"
        description="Die Beschriftung allein sagt, was drinsteht, nicht wohin es geht. Sechs sichtbare Merkmale sagen das Zweite. Die Probe daneben schaltet den Abschnitt in Graustufen — die beiden Feldarten bleiben unterscheidbar."
        actions={
          <button
            type="button"
            className="segmented__option"
            aria-pressed={grayscale}
            onClick={() => setGrayscale((previous) => !previous)}
            style={{
              border: "1px solid var(--border-control)",
              minHeight: "var(--control-height-md)",
            }}
          >
            Graustufenprobe
          </button>
        }
      >
        <div className={cx(grayscale && "grayscale")}>
          <div className="grid grid--2">
            <NoteField
              scope="billing"
              value={billingNote}
              onChange={setBillingNote}
              maxLength={500}
            />
            <NoteField
              scope="internal"
              value={internalNote}
              onChange={setInternalNote}
              maxLength={2000}
            />
          </div>
        </div>
      </Card>

      <Card
        title="Woran der Benutzer die Feldart erkennt"
        description="Sechs Unterschiede, bevor ein Wort gelesen ist. Nur einer davon ist Farbe."
      >
        <table className="statematrix">
          <thead>
            <tr>
              <th scope="col">Merkmal</th>
              <th scope="col">Leistung — geht an die Abrechnung</th>
              <th scope="col">Vermerk — bleibt in Takt</th>
            </tr>
          </thead>
          <tbody>
            {DIFFERENCES.map((row) => (
              <tr key={row.trait}>
                <td>{row.trait}</td>
                <td>{row.billing}</td>
                <td>{row.internal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card
        title="Warum nicht einfach längere Namen"
        description="Der Auftraggeber hat die Namen gesetzt: Vermerk und Leistung (E-016). Beide sind kurz genug für eine Feldbeschriftung in einer dichten Ansicht, und sie teilen keinen Wortstamm mehr — anders als „Persönliche Notiz“ gegen „Leistungsnotiz“, wo unter Zeitdruck beide Male nur „Notiz“ hängen bleibt."
      >
        <p className="section__lead">
          „Leistung“ sagt, <em>was</em> in dem Feld steht, nicht <em>wohin</em> es geht. Diese
          zweite Hälfte trägt deshalb nicht der Name, sondern die Gestaltung: die durchgezogene
          Randschiene gegen die unterbrochene des Vermerks, das Kopfband mit der Richtung und die
          gefüllte Marke unmittelbar vor dem Wort. Die Marke ist neu gegenüber T-006 und der Grund dafür, dass die Zuordnung auch
          dann steht, wenn das Kopfband außerhalb des Blickfelds liegt — etwa in einem schmalen
          Dialog oder im Outlook-Add-in.
        </p>
      </Card>

      <SubHeading>Weitere Zustände des Leistungsfelds</SubHeading>
      <div className="grid grid--2">
        <div className="stack" style={{ gap: "var(--space-3)" }}>
          <p className="overline">Fehlerzustand</p>
          <NoteField
            scope="billing"
            value={emptyBilling}
            onChange={setEmptyBilling}
            required
            maxLength={500}
            error="Ohne Eintrag im Feld „Leistung“ lässt sich diese Buchung nicht exportieren."
          />
        </div>
        <div className="stack" style={{ gap: "var(--space-3)" }}>
          <p className="overline">Gesperrt, weil bereits exportiert</p>
          <NoteField
            scope="billing"
            value="Rückfrage zur Buchungsperiode telefonisch geklärt."
            onChange={() => undefined}
            readOnly
            readOnlyHint="Diese Buchung wurde am 30.08.2026 exportiert. Zum Bearbeiten zuerst den Exportstatus zurücksetzen."
          />
        </div>
      </div>

      <InlineMessage tone="warning" title="Die Grenze wird nicht nur gestaltet, sondern erzwungen">
        Der Vermerk ist im Vorlagen-Motor als Feldquelle strukturell nicht wählbar (E-005, E-017,
        R-06). Die Gestaltung hier verhindert den Bedienfehler; die geschlossene Quellenliste im
        Motor verhindert die Umgehung über eine eigene Exportvorlage. Der Schlüssel in der
        Exportdatei heißt weiterhin <code>Notiz</code>, weil ihn das Abrechnungstool vorgibt
        (A-8.2) — Beschriftung und Schlüssel dürfen auseinandergehen.
      </InlineMessage>
    </Section>
  );
}
