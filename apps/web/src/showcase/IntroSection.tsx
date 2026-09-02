import { Card, InlineMessage } from "../components/Primitives";
import { Section } from "./Section";

interface FocusPoint {
  readonly anchor: string;
  readonly title: string;
  readonly text: string;
}

/** Die drei Stellen, an denen die Abnahme wirklich hängt. */
const FOCUS: readonly FocusPoint[] = [
  {
    anchor: "#exportstatus",
    title: "Abschnitt 2 — Exportstatus, mit Graustufenprobe",
    text: "Eine Zeitbuchung ist entweder noch abzurechnen oder schon abgerechnet. Das muss überall zu sehen sein, nicht nur in der Export-Ansicht. Bitte den Schalter „Graustufenprobe“ drücken: Wenn die Zustände auch ohne Farbe unterscheidbar bleiben, hält die Lösung auch für die rund acht Prozent der Männer mit einer Farbfehlsichtigkeit.",
  },
  {
    anchor: "#export",
    title: "Abschnitt 4 — Exportvorschau, gegliedert nach Tagesgruppen",
    text: "Eine Zeile in der Exportdatei ist ein Todo an einem Kalendertag, nicht eine einzelne Buchung: Die Zeiten werden zuerst addiert und erst dann auf die nächste Viertelstunde aufgerundet. Bitte die erste Gruppe aufklappen und die mittlere Buchung herausnehmen — die gerundete Zeit fällt sofort von 0,75 auf 0,25. Das ist die Stelle, an der aus erfasster Zeit ein Rechnungsbetrag wird.",
  },
  {
    anchor: "#board",
    title: "Abschnitt 5 — Spalte und „Erledigt“ sind zwei Dinge",
    text: "Die Spalten des Boards sind frei benannt, das Erledigt-Kennzeichen hängt am Todo. Ein Todo kann also in der Spalte „Erledigt“ stehen und trotzdem offen sein. Beide überraschenden Fälle stehen auf dem Board, jede Karte sagt ausdrücklich, woran sie ist. Bitte den Abspielknopf auf der erledigten Karte drücken.",
  },
  {
    anchor: "#notizen",
    title: "Abschnitt 7 — Vermerk und Leistung",
    text: "Zwei Textfelder, die in der Spezifikation beide „Notiz“ heißen. Der Vermerk bleibt in Takt, die Leistung steht später auf der Rechnung des Kunden. Sie zu verwechseln ist der wahrscheinlichste Bedienfehler dieses Produkts, und er fällt erst beim Kunden auf. Auch hier gibt es eine Graustufenprobe.",
  },
];

/**
 * Einleitung der Musterseite. Sie setzt kein Vorwissen voraus: weder das
 * Anforderungsdokument noch die Berichte der anderen Aufgaben. Wer die Seite
 * zur Abnahme öffnet, soll nach diesem Abschnitt wissen, was er vor sich hat
 * und worauf er achten soll.
 */
export function IntroSection() {
  return (
    <Section id="einleitung" title="Was Sie hier sehen">
      <p className="intro__lead">
        Takt ist eine lokale Anwendung für Todos, Zeiterfassung und die Übergabe erfasster Zeiten
        an ein Abrechnungstool. Diese Seite ist noch nicht die Anwendung. Sie ist ihr Bauplan in
        sichtbarer Form: alle Farben, Schriftgrößen, Abstände und Bausteine, aus denen die
        vierzehn Ansichten später zusammengesetzt werden — jeder Baustein in allen Zuständen, die
        er annehmen kann. Das Designsystem ist abgenommen; was hier steht, gilt überall.
      </p>

      <Card
        title="Worauf Sie besonders achten sollten"
        description="Zehn Abschnitte, vier Stellen, an denen ein Fehler teuer wird. Der Rest ist Handwerk und lässt sich später ohne Schaden nachjustieren."
      >
        <ol className="intro__list">
          {FOCUS.map((point, index) => (
            <li className="intro__item" key={point.anchor}>
              <span className="intro__step" aria-hidden>
                {index + 1}
              </span>
              <p className="intro__text">
                <a href={point.anchor}>
                  <strong>{point.title}</strong>
                </a>
                <br />
                {point.text}
              </p>
            </li>
          ))}
        </ol>
      </Card>

      <Card
        title="So bedienen Sie die Seite"
        description="Alles auf dieser Seite ist echt und anklickbar. Nichts davon speichert etwas; beim Neuladen steht wieder der Anfangszustand."
      >
        <ul className="intro__list">
          <li className="intro__item">
            <span className="intro__step" aria-hidden>
              ⇥
            </span>
            <p className="intro__text">
              <strong>Nur mit der Tastatur.</strong> Mit <kbd>Tab</kbd> von oben durchgehen. Jedes
              Element, das den Fokus hat, bekommt einen deutlich sichtbaren Ring. Der erste Halt
              ist die Sprungmarke „Zum Inhalt springen“. Das ist keine Kür: Die Anwendung muss ohne
              Maus vollständig bedienbar sein.
            </p>
          </li>
          <li className="intro__item">
            <span className="intro__step" aria-hidden>
              ◐
            </span>
            <p className="intro__text">
              <strong>Oben rechts zwei Schalter.</strong> <em>Hell / Dunkel / System</em> schaltet
              den Farbmodus, <em>Normal / Kompakt</em> die Zeilenhöhe für Tabellen. Beide Modi sind
              vollständig ausgearbeitet, nicht nur der helle.
            </p>
          </li>
          <li className="intro__item">
            <span className="intro__step" aria-hidden>
              ↔
            </span>
            <p className="intro__text">
              <strong>Anfassen erwünscht.</strong> Karten im Board lassen sich ziehen oder per
              Menü und <kbd>Strg</kbd> + <kbd>→</kbd> verschieben, Tabellenzeilen auswählen, Timer
              starten, Dialoge öffnen. Wo etwas fehlt, ist es benannt statt weggelassen.
            </p>
          </li>
        </ul>
      </Card>

      <InlineMessage tone="info" title="Die Zahlen auf dieser Seite sind Beispiele, keine Rechnung">
        Kundennamen, Call-Nummern und Zeiten sind erfunden. Die Oberfläche rechnet grundsätzlich
        nicht selbst: Sie bekommt Dauer, Exportwert und Datum fertig formatiert von der Fachlogik.
        Die gezeigten Exportwerte folgen aber der bestätigten Regel (E-008) — aufgerundet auf die
        nächste Viertelstunde, mindestens 0,25. Deshalb steht in Abschnitt 3 neben 0:07 h der
        Exportwert 0,25 und neben 1:07 h der Wert 1,25. In Abschnitt 4 ist zu jeder möglichen
        Auswahl das fertige Ergebnis hinterlegt, damit sich die Wirkung eines Ausschlusses
        vorführen lässt, ohne dass die Oberfläche selbst rundet.
      </InlineMessage>
    </Section>
  );
}
