import { useState } from "react";
import { FilterToggle } from "../components/FilterBar";
import { Select } from "../components/Select";
import { Card, InlineMessage } from "../components/Primitives";
import {
  ShellStatus,
  type ShellServiceExit,
  type ShellStateSnapshot,
  type UserNameFinding,
} from "../components/ShellStatus";
import { Section, SubHeading } from "./Section";

/**
 * Abschnitt 10 der Musterseite — die drei Zustaende, die die Tauri-Huelle beim
 * Start meldet (T-020).
 *
 * Sie stehen seit T-008b in `shellState()` bereit und waren bis hierher
 * unsichtbar. Der Abschnitt macht sie abnehmbar: Jeder Zustand laesst sich
 * einzeln und in Kombination einschalten, mit denselben Bausteinen, die die
 * Anwendung spaeter benutzt.
 */

/** Die Saetze stammen woertlich aus der Huelle — nachgestellt, nicht erfunden. */
const DEMO_PROBLEMS: readonly string[] = [
  "Der Windows-Benutzername ließ sich nicht vom Betriebssystem lesen. Takt startet den lokalen Dienst nicht, weil ein Export ohne Urheber nicht nachvollziehbar wäre.",
  "icacls endete mit exit code: 5. Die Zugriffsrechte sind unverändert.",
];

/**
 * Klartext und Zusatz getrennt (T-020b) — genau so liefert es die Huelle.
 * Vorher stand „Kopierte WAL-Dateien beschädigen die Datenbank" als erster
 * Satz auf dem Bildschirm.
 */
const DEMO_SYNC_WARNING =
  "Der Datenordner von Takt liegt in einem Ordner, der laufend an einen anderen Ort kopiert wird: C:\\Users\\mmueller\\OneDrive - Musterfirma\\AppData\\Local\\Takt";

const DEMO_SYNC_DETAIL =
  "Der Pfad trägt den Namen eines Synchronisierungsdienstes. Die Datenbank besteht aus mehreren Dateien, die zusammengehören; werden sie einzeln und zeitversetzt kopiert, wird die Datenbank beschädigt — und die kopierten Daten liegen danach außerhalb dieses Rechners.";

type ExitCase = "port" | "unexpected";

const EXIT_CASES: ReadonlyArray<{ readonly value: ExitCase; readonly label: string }> = [
  { value: "port", label: "Der Port ist belegt (Code 74)" },
  { value: "unexpected", label: "Unerwartet beendet (ohne Code)" },
];

const DEMO_EXITS: Readonly<Record<ExitCase, ShellServiceExit>> = {
  port: {
    code: 74,
    message:
      "Takt konnte den lokalen Dienst nicht starten, weil ein anderes Programm den Zugang belegt, über den Takt mit sich selbst spricht. Am häufigsten ist das Takt selbst: Läuft es vielleicht schon in einem anderen Fenster?",
    detail:
      "Der Port 17843 auf 127.0.0.1 ist belegt. Takt weicht bewusst nicht auf einen anderen Port aus, weil sich sonst ein fremdes Programm als Takt ausgeben könnte.",
  },
  unexpected: {
    code: null,
    message: "Der lokale Dienst von Takt hat sich unerwartet beendet.",
    detail: null,
  },
};

export function ShellStateSection() {
  const [startupFailed, setStartupFailed] = useState(false);
  const [syncFolder, setSyncFolder] = useState(false);
  const [serviceStopped, setServiceStopped] = useState(false);
  const [exitCase, setExitCase] = useState<ExitCase>("port");
  const [userNameBlocked, setUserNameBlocked] = useState(false);
  const [quitDemo, setQuitDemo] = useState(false);

  const userName: UserNameFinding = userNameBlocked ? "forbidden_characters" : "unknown";

  const state: ShellStateSnapshot = {
    directory: {
      path: syncFolder
        ? "C:\\Users\\mmueller\\OneDrive - Musterfirma\\AppData\\Local\\Takt"
        : "C:\\Users\\mmueller\\AppData\\Local\\Takt",
      permissionsApplied: !startupFailed,
      permissionsDetail: startupFailed
        ? "icacls endete mit exit code: 5. Die Zugriffsrechte sind unverändert."
        : "Vererbung entfernt; Vollzugriff nur für dieses Konto und SYSTEM.",
      syncWarning: syncFolder ? DEMO_SYNC_WARNING : null,
      syncDetail: syncFolder ? DEMO_SYNC_DETAIL : null,
    },
    // Die Huelle legt die Ordnerwarnung zusaetzlich hier ab. Genau diese
    // Doppelung faengt `startupProblems()` ab — der Schalter unten zeigt es:
    // "Datenordner" allein erzeugt keine Startmeldung.
    problems: [
      ...(startupFailed ? DEMO_PROBLEMS : []),
      ...(syncFolder ? [DEMO_SYNC_WARNING] : []),
    ],
    serviceExit: serviceStopped ? DEMO_EXITS[exitCase] : null,
  };

  const nothingToShow = !startupFailed && !syncFolder && !serviceStopped && !userNameBlocked;

  return (
    <Section
      id="huelle"
      title="10 — Wenn Takt nicht vollständig startet"
      lead="Drei Zustände meldet die Anwendungshülle beim Start, und alle drei kann ein Anwender als Erstes zu sehen bekommen. Sie unterscheiden sich in der Lautstärke: Der Ausfall des lokalen Dienstes sperrt die Anwendung, eine unvollständige Startmeldung bleibt dauerhaft über der Ansicht stehen, der Hinweis auf den Datenordner bleibt ruhig. Keiner der drei lässt sich wegklicken, weil keiner durch Wegklicken aufhört zu gelten."
      refs={["Abschnitt 15", "B-7.1", "B-7.2", "R-13", "E-018", "E-042"]}
    >
      <Card
        title="Zustände einschalten"
        description="Jeder Schalter setzt genau das Feld, das die Hülle liefert. Die Vorschau darunter ist derselbe Baustein, den die Anwendung benutzt — nichts davon ist nachgezeichnet."
      >
        <div className="stack" style={{ gap: "var(--space-3)" }}>
          <FilterToggle
            label="Takt ist nicht vollständig gestartet"
            hint="zwei Meldungen aus der Hülle"
            pressed={startupFailed}
            onChange={setStartupFailed}
          />
          <FilterToggle
            label="Der Datenordner liegt in einem Synchronisierungsordner"
            hint="R-13 — die Warnung, die eine beschädigte Datenbank verhindert"
            pressed={syncFolder}
            onChange={setSyncFolder}
          />
          <FilterToggle
            label="Der lokale Dienst hat sich beendet"
            hint="sperrt die Anwendung — Ausgang ist „Takt beenden“"
            pressed={serviceStopped}
            onChange={setServiceStopped}
          />
          <FilterToggle
            label="Der Windows-Benutzername ist nicht abrechenbar"
            hint="O-AJ — steht vor dem Ausfall des Dienstes, weil er dessen Ursache ist"
            pressed={userNameBlocked}
            onChange={setUserNameBlocked}
          />
          {/* Bewusst immer sichtbar: Solange die Sperrmeldung steht, ist der
              Rest der Seite nicht bedienbar — eine Auswahl, die erst mit dem
              Zustand erscheint, waere danach nicht mehr erreichbar. */}
          <Select
            label="Grund des Ausfalls"
            value={exitCase}
            onChange={setExitCase}
            options={EXIT_CASES}
          />
          <p className="section__lead">
            Der dritte Schalter legt eine Sperrmeldung über die ganze Seite. Sie hat genau
            einen Ausgang, und der steht im Dialog: „Takt beenden“. Auf dieser Musterseite
            beendet der Knopf nichts, sondern schaltet den Zustand zurück und sagt es.
          </p>
          {quitDemo ? (
            <InlineMessage
              tone="info"
              title="„Takt beenden“ wurde gewählt"
              onDismiss={() => setQuitDemo(false)}
            >
              In der Anwendung ruft dieser Knopf den Beenden-Befehl der Hülle auf: Der
              lokale Dienst wird gestoppt, danach schließt sich das Fenster. Hier auf der
              Musterseite bleibt es bei dieser Meldung.
            </InlineMessage>
          ) : null}
        </div>
      </Card>

      <Card
        title="Vorschau"
        description="So sieht der Benutzer die eingeschalteten Zustände — in der Anwendung stehen sie über der Ansicht, vor Navigation und Inhalt."
      >
        {nothingToShow ? (
          <InlineMessage tone="success" title="Takt ist vollständig gestartet">
            Der Normalfall zeigt nichts. Das ist der Leerzustand dieser Anzeige und braucht
            keinen Platzhalter: „Alles in Ordnung“ ist die Abwesenheit einer Meldung und
            kein eigener Kasten.
          </InlineMessage>
        ) : (
          <ShellStatus
            state={state}
            userName={userName}
            /*
              Auf der Musterseite beendet der Knopf nichts — er schaltet die
              Zustaende zurueck. Er schaltet **alle** zurueck und nicht nur den
              sperrenden: Seit T-124 wartet der Knopf fuenf Sekunden darauf,
              dass Takt endet, und sagt danach, dass es nicht geklappt hat.
              Bliebe hier eine Meldung mit „Takt beenden" stehen, zeigte die
              Musterseite nach fuenf Sekunden eine Notfallanleitung fuer einen
              Fehlschlag, den es nicht gibt.
            */
            onQuit={() => {
              setServiceStopped(false);
              setStartupFailed(false);
              setUserNameBlocked(false);
              setQuitDemo(true);
            }}
          />
        )}
      </Card>

      <div className="grid grid--2">
        <Card title="Was jede Meldung leistet">
          <SubHeading>Startmeldung — Takt ist nicht vollständig gestartet</SubHeading>
          <p className="section__lead" style={{ marginBottom: "var(--space-4)" }}>
            Der Rahmen ist von uns, die Aufzählung nicht: Jeder Satz kommt unverändert aus
            der Hülle und benennt, was fehlt. Ein Fehlercode allein wäre keine Auskunft,
            und eine zusammengefasste Meldung nähme dem Benutzer genau das, was er
            weitergeben kann. Seit dem Start ohne lesbaren Anmeldenamen ist das der erste
            Zustand, den ein Anwender überhaupt sehen kann: Ohne diese Meldung sähe er eine
            Anwendung, die nichts tut, und erführe den Grund nicht.
          </p>

          <SubHeading>Sperrmeldung — der lokale Dienst ist weg</SubHeading>
          <p className="section__lead" style={{ marginBottom: "var(--space-4)" }}>
            Der einzige Ort in Takt, an dem eine Meldung die Bedienung anhält. Ohne den
            Dienst wird nichts mehr geschrieben; eine weggeklickte Meldung ließe den
            Benutzer weiterarbeiten und seine Zeit verlieren. Deshalb: kein Schließkreuz,
            kein Abbrechen, keine Escape-Taste. Der Dialog sagt zusätzlich, was
            <em> nicht</em> verloren ist — bereits Gespeichertes bleibt erhalten.
          </p>
          <p className="section__lead" style={{ marginBottom: "var(--space-4)" }}>
            Seit T-020b meldet die Hülle den Ausfall von sich aus. Vorher stand der Grund
            nur im Zustand, und die Oberfläche erfuhr davon erst beim nächsten Abruf — eine
            Sperrmeldung, die so aktuell ist wie der letzte Abruf, sperrt nichts, sondern
            beschreibt hinterher.
          </p>

          <SubHeading>Datenordner — der Hinweis nach R-13</SubHeading>
          <p className="section__lead">
            Ernst genug, um dauerhaft stehen zu bleiben, aber nicht dringend genug für
            eine Sperre: Takt arbeitet weiter. Der Befund der Hülle steht zuerst, danach
            in eigenen Worten, was er bedeutet — eine beschädigte Datenbank und
            Kundendaten, die den Rechner verlassen — und was zu tun ist. Den Ordner kann
            Takt nicht selbst verlegen; das gehört gesagt, statt eine Schaltfläche
            anzubieten, die es nicht gibt.
          </p>
        </Card>

        <Card title="Zustandsmatrix">
          <table className="statematrix">
            <thead>
              <tr>
                <th scope="col">Zustand</th>
                <th scope="col">Form</th>
                <th scope="col">Schließbar</th>
                <th scope="col">Ansage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nichts aufgefallen</td>
                <td>keine Anzeige</td>
                <td>—</td>
                <td>keine</td>
              </tr>
              <tr>
                <td>Start unvollständig</td>
                <td>Band über der Ansicht, Fehlerton, Aufzählung der Meldungen</td>
                <td>nein</td>
                <td>sofort, als Fehler</td>
              </tr>
              <tr>
                <td>Datenordner</td>
                <td>Band über der Ansicht, Warnton</td>
                <td>nein</td>
                <td>höflich, nach der laufenden Ansage</td>
              </tr>
              <tr>
                <td>Dienst beendet</td>
                <td>Sperrdialog über der ganzen Anwendung</td>
                <td>nein — Ausgang ist „Takt beenden“</td>
                <td>sofort, als Fehlerdialog</td>
              </tr>
              <tr>
                <td>Alle drei zugleich</td>
                <td>Sperrdialog über beiden Bändern</td>
                <td>nein</td>
                <td>Dialog zuerst, er hat den Fokus</td>
              </tr>
              <tr>
                <td>Dienst fällt im Betrieb aus</td>
                <td>Sperrdialog erscheint sofort — die Hülle meldet den Ausfall</td>
                <td>nein</td>
                <td>sofort, als Fehlerdialog</td>
              </tr>
            </tbody>
          </table>

          <div className="stack" style={{ gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
            <InlineMessage tone="success" title="Die Ordnerwarnung stand in der Hülle zweimal">
              Sie lag in <code>directory.syncWarning</code> und zusätzlich in der Liste der
              Startmeldungen — unbesehen übernommen stünde sie zweimal auf dem Bildschirm,
              einmal davon unter einer Überschrift, die für sie zu laut ist. Die zweite
              Ablage ist seit T-020b weg. Der Filter in der Oberfläche bleibt trotzdem: Er
              kostet nichts und fängt den Fall, dass die Dopplung zurückkehrt. Schalten Sie
              oben nur den Datenordner ein — es erscheint kein Fehlerband.
            </InlineMessage>
            <InlineMessage tone="success" title="Zwei Sätze für zwei Leser">
              „WAL-Dateien“ und „Port 17843“ standen früher als erster Satz auf dem
              Bildschirm: für die Systembetreuung genau richtig, für den Anwender ein
              Fremdwort im Moment seiner größten Ratlosigkeit. Seit T-020b liefert die
              Hülle beides getrennt — Klartext oben, technischer Zusatz darunter unter
              „Für die Systembetreuung“. Zwei Rust-Tests halten die Trennung fest: Sie
              fallen, sobald ein Fachbegriff zurück nach vorn wandert.
            </InlineMessage>
          </div>
        </Card>
      </div>
    </Section>
  );
}
