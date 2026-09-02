import { useState } from "react";
import {
  EXPORT_STATE,
  EXPORT_STATUS_LABEL,
  ExportStatusBadge,
  ExportStatusMarker,
  exportStatusOf,
  type ExportDisplayState,
} from "../components/ExportStatus";
import { ExportSummaryStrip } from "../components/Kanban";
import { Card, InlineMessage } from "../components/Primitives";
import { cx } from "../lib/cx";
import { Section, SubHeading } from "./Section";

const STATES: readonly ExportDisplayState[] = ["open", "exported", "reopened", "not_billed"];

interface TraitRow {
  readonly trait: string;
  readonly open: string;
  readonly exported: string;
  readonly reopened: string;
  readonly notBilled: string;
}

const TRAITS: readonly TraitRow[] = [
  {
    trait: "Füllung",
    open: "Kontur, helle Fläche",
    exported: "voll gefüllt, kräftig",
    reopened: "Kontur mit Schraffur",
    notBilled: "Kontur, neutrale Fläche",
  },
  {
    trait: "Kontur",
    open: "durchgezogen",
    exported: "durchgezogen",
    reopened: "durchgezogen",
    notBilled: "gestrichelt",
  },
  {
    trait: "Symbol",
    open: "Kreis",
    exported: "Haken im Kreis",
    reopened: "Pfeil zurück",
    notBilled: "durchgestrichener Kreis",
  },
  {
    trait: "Form des Punktes",
    open: "Ring",
    exported: "gefüllte Scheibe",
    reopened: "Raute",
    notBilled: "waagerechter Balken",
  },
  {
    trait: "Beschriftung",
    open: "„Offen“",
    exported: "„Exportiert“",
    reopened: "„Erneut offen“",
    notBilled: "„Nicht abgerechnet“",
  },
  {
    trait: "Zeilenrand",
    open: "bernsteinfarben",
    exported: "grün, Zeile getönt",
    reopened: "rosé",
    notBilled: "neutral, gestrichelt",
  },
  {
    trait: "Bearbeitbar",
    open: "ja",
    exported: "nein, gesperrt (A-6.9)",
    reopened: "ja, mit Warnung",
    notBilled: "nein, gesperrt (A-6.9)",
  },
  {
    trait: "Zusatz am Etikett",
    open: "keiner",
    exported: "Exportzeitpunkt",
    reopened: "Exportzähler",
    notBilled: "„ausgebucht am …“",
  },
  {
    trait: "Fachlicher Status",
    open: `${EXPORT_STATUS_LABEL[exportStatusOf("open")]} (open)`,
    exported: `${EXPORT_STATUS_LABEL[exportStatusOf("exported")]} (exported)`,
    reopened: `${EXPORT_STATUS_LABEL[exportStatusOf("reopened")]} (open) — kein eigener Wert`,
    notBilled: `${EXPORT_STATUS_LABEL[exportStatusOf("not_billed")]} (exported) — kein eigener Wert`,
  },
];

export function ExportStatusSection() {
  const [grayscale, setGrayscale] = useState(false);

  return (
    <Section
      id="exportstatus"
      title="2 — Exportstatus"
      lead="Der wichtigste Einzelbaustein. Der Exportstatus einer Buchung muss überall eindeutig sein, nicht nur in der Export-Ansicht. Der Status selbst hat genau zwei Werte — offen und exportiert. Dargestellt wird er in vier Ausprägungen, weil eine zurückgesetzte und eine ausgebuchte Buchung als solche erkennbar bleiben müssen."
      refs={["A-6.5", "A-6.6", "A-6.7", "A-6.9", "A-8.6", "E-012", "E-032", "E-047", "E-050", "R-10"]}
    >
      <Card
        title="Zwei Werte, vier Darstellungen"
        description="Die vier Darstellungen unterscheiden sich in neun Merkmalen. Nur eines davon ist Farbe — und „Nicht abgerechnet“ trägt bewusst gar keine, weil hier kein Geld geflossen ist und es nichts zu signalisieren gibt. Die Probe daneben schaltet die Seite in Graustufen; die Darstellungen bleiben unterscheidbar."
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
          <SubHeading>Etikett, Standardgröße</SubHeading>
          <div className="demo-row" style={{ marginBottom: "var(--space-6)" }}>
            {STATES.map((state) => (
              <ExportStatusBadge key={state} state={state} />
            ))}
          </div>

          <SubHeading>Etikett mit Zusatz, dichte Größe für Tabellen</SubHeading>
          <div className="demo-row" style={{ marginBottom: "var(--space-6)" }}>
            <ExportStatusBadge state="open" size="sm" />
            <ExportStatusBadge state="exported" size="sm" detail="30.08.2026" />
            <ExportStatusBadge state="reopened" size="sm" detail="zurückgesetzt am 31.08.2026" />
            <ExportStatusBadge state="not_billed" size="sm" detail="ausgebucht am 01.09.2026" />
          </div>

          <SubHeading>Nur Symbol — Beschriftung bleibt für Hilfsmittel erhalten</SubHeading>
          <div className="demo-row" style={{ marginBottom: "var(--space-6)" }}>
            {STATES.map((state) => (
              <ExportStatusBadge key={state} state={state} iconOnly />
            ))}
          </div>

          <SubHeading>Zustandspunkt für enge Stellen</SubHeading>
          <div className="demo-row" style={{ marginBottom: "var(--space-6)" }}>
            {STATES.map((state) => (
              <span
                key={state}
                style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}
              >
                <ExportStatusMarker state={state} labelled={false} />
                <span className="muted" style={{ fontSize: "var(--text-xs)" }}>
                  {EXPORT_STATE[state].label}
                </span>
              </span>
            ))}
          </div>

          <SubHeading>Zusammenfassung auf einer Kanban-Karte</SubHeading>
          <div className="demo-row">
            <ExportSummaryStrip summary={{ open: 3, exported: 5, reopened: 1, not_billed: 2 }} />
            <ExportSummaryStrip summary={{ open: 0, exported: 2, reopened: 0, not_billed: 0 }} />
            <ExportSummaryStrip summary={{ open: 0, exported: 0, reopened: 0, not_billed: 0 }} />
          </div>
        </div>
      </Card>

      <Card
        title="Unterscheidungsmerkmale"
        description="Farbfehlsichtigkeit betrifft rund acht Prozent der Männer. Bernstein, Grün und Rosé sind für Deuteranopie die schwierigste Kombination überhaupt — deshalb tragen Form, Symbol und Beschriftung die Aussage, und die Farbe verstärkt sie nur."
      >
        <table className="statematrix">
          <thead>
            <tr>
              <th scope="col">Merkmal</th>
              <th scope="col">Offen</th>
              <th scope="col">Exportiert</th>
              <th scope="col">Erneut offen</th>
              <th scope="col">Nicht abgerechnet</th>
            </tr>
          </thead>
          <tbody>
            {TRAITS.map((row) => (
              <tr key={row.trait}>
                <td>{row.trait}</td>
                <td>{row.open}</td>
                <td>{row.exported}</td>
                <td>{row.reopened}</td>
                <td>{row.notBilled}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card
        id="nicht-abgerechnet"
        title="„Nicht abgerechnet“ — der vierte Anzeigezustand (E-050)"
        description="Er entsteht nicht aus einem neuen Statuswert, sondern aus einem Vorgang, den es seit E-047 gibt."
      >
        <p className="section__lead">
          E-047 hat „von Hand als exportiert markieren“ abgeschafft. An seine Stelle ist{" "}
          <strong>„nicht abrechnen“</strong> getreten: Der Benutzer führt eine Buchung als
          abgeschlossen, ohne dass je eine Datei entstanden wäre. Der Statuswert dafür ist{" "}
          <code>exported</code> — mehr Werte gibt es nicht, und E-032 hält das ausdrücklich fest.
          Stünde danach „Exportiert“ in der Liste, hieße der Vorgang in der Anzeige genau das, was
          er bewusst nirgends heißt, und die Unterscheidung lebte nur noch im Protokoll, wo sie
          niemand sieht.
        </p>

        <table className="statematrix">
          <thead>
            <tr>
              <th scope="col">Status (zwei Werte)</th>
              <th scope="col">Exportzähler</th>
              <th scope="col">Darstellung</th>
              <th scope="col">Wie sie entstanden ist</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>exported</code>
              </td>
              <td>größer 0</td>
              <td>„Exportiert“</td>
              <td>ein Exportlauf hat eine Datei geschrieben</td>
            </tr>
            <tr>
              <td>
                <code>exported</code>
              </td>
              <td>
                <strong>0</strong>
              </td>
              <td>„Nicht abgerechnet“</td>
              <td>
                von Hand ausgebucht (E-047). <code>markNotBilled</code> lässt den Zähler
                unverändert — es gab keinen Lauf.
              </td>
            </tr>
          </tbody>
        </table>

        <div className="demo-row" style={{ marginBlock: "var(--space-4)" }}>
          <ExportStatusBadge state="exported" detail="30.08.2026" />
          <ExportStatusBadge state="not_billed" detail="ausgebucht am 01.09.2026" />
        </div>

        <InlineMessage tone="info" title="Anzeige, kein Wert">
          „Nicht abgerechnet“ ist <strong>kein dritter Statuswert</strong> und nie ein
          Filterkriterium. Der Filter in Abschnitt 3 führt weiterhin genau zwei Werte, und eine
          ausgebuchte Buchung erscheint dort unter „Exportiert“ — richtig so, denn sie geht in
          keinen Export mehr ein. Was der Zustand ändert, ist ausschließlich das Wort auf dem
          Etikett und der Zusatz dahinter: „ausgebucht am“ statt eines Exportdatums, das es nie
          gab. Rückgängig geht beides über denselben Weg — „Exportstatus zurücksetzen“.
        </InlineMessage>
      </Card>

      <Card
        id="zur-entscheidung"
        className="card--decision"
        title="Entschieden — wie eine zurückgesetzte Buchung aussieht"
        description="Hier standen zwei Varianten zur Wahl. Der Auftraggeber hat entschieden; die Stelle bleibt auffindbar, damit später niemand die Frage neu aufmacht."
        actions={<span className="decision-pill">Entschieden</span>}
      >
        <p className="decision-summary">
          <strong>Der Unterschied war:</strong> Variante A zeigt den zurückgesetzten Exportstatus
          als <em>ein</em> Etikett mit eigener Beschriftung „Erneut offen“, Variante B als das
          gewohnte Etikett „Offen“ <em>plus</em> ein zweites, getrenntes Zeichen „schon einmal
          exportiert“. <strong>Gesetzt ist Variante A</strong> — meine Empfehlung, weil dieser Fall
          Geld kostet (R-10) und in einer Liste mit dreißig Zeilen auf den ersten Blick auffallen
          muss. Variante B war das sauberere Abbild der Zweiwertigkeit aus A-6.9, aber leichter zu
          überlesen. Sie ist aus dem Quelltext entfernt, damit keine zwei Wahrheiten bleiben.
        </p>
        <div className="demo-row">
          <ExportStatusBadge state="reopened" detail="zurückgesetzt am 31.08.2026" />
          <span className="muted" style={{ fontSize: "var(--text-xs)" }}>
            So sieht sie überall aus — in der Tabelle, auf der Karte, in der Exportvorschau.
          </span>
        </div>
      </Card>

      <Card
        title="„Erneut offen“ ist kein dritter Wert des Exportstatus"
        description="Der wichtigste Satz dieses Abschnitts, und der einzige, dessen Missachtung Geld kostet."
      >
        <p className="section__lead">
          E-012 erlaubt, den Exportstatus jeder einzelnen Buchung zurückzusetzen. Fachlich ist die
          Buchung danach <strong>offen</strong> — nicht „erneut offen“. Der Status bleibt
          zweiwertig, so wie A-6.9 es verlangt und E-032 es festhält. Was die Oberfläche zusätzlich
          zeigt, hängt an einem <strong>eigenen Merkmal</strong>: daran, wie oft die Buchung schon
          in einem Exportlauf war (<code>time_entry.export_count</code>). Aus „offen“ und einem
          Zähler größer null wird die Darstellung „Erneut offen“ — abgeleitet, nirgends
          gespeichert.
        </p>

        <table className="statematrix">
          <thead>
            <tr>
              <th scope="col">Status (zwei Werte)</th>
              <th scope="col">Exportzähler</th>
              <th scope="col">Darstellung</th>
              <th scope="col">Geht in den nächsten Export</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>open</code>
              </td>
              <td>0</td>
              <td>„Offen“</td>
              <td>ja</td>
            </tr>
            <tr>
              <td>
                <code>open</code>
              </td>
              <td>größer 0</td>
              <td>„Erneut offen“</td>
              <td>
                <strong>ja</strong>
              </td>
            </tr>
            <tr>
              <td>
                <code>exported</code>
              </td>
              <td>größer 0</td>
              <td>„Exportiert“</td>
              <td>nein</td>
            </tr>
            <tr>
              <td>
                <code>exported</code>
              </td>
              <td>0</td>
              <td>„Nicht abgerechnet“</td>
              <td>nein</td>
            </tr>
          </tbody>
        </table>

        <InlineMessage
          tone="warning"
          title="Warum das kein Formalismus ist"
        >
          Wer „Erneut offen“ für einen dritten Statuswert hält und einen Filter, eine Abfrage oder
          eine Exportauswahl darauf baut, lässt eine zurückgesetzte Buchung aus dem nächsten Export
          herausfallen. Sie wurde absichtlich zurückgesetzt, damit sie noch einmal abgerechnet
          wird — und käme dann nie an. Deshalb tragen die beiden Begriffe im Quelltext
          verschiedene Typen: <code>ExportStatus</code> mit zwei Werten für alles, was filtert und
          auswählt, <code>ExportDisplayState</code> mit vier Werten ausschließlich für die
          Darstellung. Der Filter in Abschnitt 3 führt genau zwei Werte; die Exportvorschau in
          Abschnitt 4 nimmt die zurückgesetzte Buchung ganz normal in ihre Tagesgruppe auf.
        </InlineMessage>

        <p className="section__lead">
          Regel für alle 14 Ansichten: Wo eine Buchung auftaucht, taucht ihr Exportstand mit auf.
          Wo für ein Etikett kein Platz ist, steht mindestens der Zustandspunkt. Wo mehrere
          Buchungen zusammengefasst werden, steht die Zusammenfassung mit Zahl je Darstellung.
        </p>
      </Card>
    </Section>
  );
}
