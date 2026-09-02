import { useState } from "react";
import { Button, Card } from "../components/Primitives";
import { BillingUserFact, DatabaseLocationFact } from "../components/WorkstationFacts";
import { adviseDatabaseLocation } from "../lib/databaseLocationAdvice";
import { Section, SubHeading } from "./Section";

/**
 * Musterseite, Abschnitt 4b — die zwei Auskünfte über diesen Arbeitsplatz
 * (C-20).
 *
 * Der Abschnitt ist **bedienbar** und nicht abgebildet: Die Beispielwerte
 * setzen die echten Bausteine, und die Befunde entstehen aus
 * `adviseDatabaseLocation`, nicht aus einer Liste hier. Wer die Auslegung
 * ändert, sieht die Änderung an dieser Stelle — eine nachgestellte Warnung
 * wäre beim ersten Umbau still falsch geworden.
 */

interface PathExample {
  readonly label: string;
  /** `null` ist der Bestand im Arbeitsspeicher und ein eigener Zustand. */
  readonly path: string | null;
  readonly why: string;
}

/**
 * Erfunden, aber der Bauform nach echt: `OneDrive - Musterfirma` ist die
 * Schreibweise, die Windows für die Geschäftsfassung anlegt, und
 * `AppData\Local\Takt` ist die Vorgabe aus E-018.
 */
const PATHS: readonly PathExample[] = [
  {
    label: "Vorgabe",
    path: "C:\\Users\\mmueller\\AppData\\Local\\Takt\\takt.db",
    why: "Der Ablageort aus E-018. Lokal, nicht synchronisiert, kein Befund — und trotzdem steht der Grenzsatz darunter.",
  },
  {
    label: "OneDrive",
    path: "C:\\Users\\mmueller\\OneDrive - Musterfirma\\Takt\\takt.db",
    why: "Der ganze Bestand wird hochgeladen. Zusätzlich beschädigt ein Client, der während des Schreibens kopiert, die Datei (R-13).",
  },
  {
    label: "Netzfreigabe",
    path: "\\\\fileserver\\profile\\mmueller\\Takt\\takt.db",
    why: "SQLite über Netz: Sperren wirken dort nicht zuverlässig, ein Verbindungsabriss beschädigt die Datei.",
  },
  {
    label: "Roaming-Profil",
    path: "C:\\Users\\mmueller\\AppData\\Roaming\\Takt\\takt.db",
    why: "Wandert beim Abmelden auf den Dateiserver — genau deshalb liegt die Vorgabe unter AppData\\Local.",
  },
  {
    label: "Temp",
    path: "C:\\Users\\mmueller\\AppData\\Local\\Temp\\takt-pruefung\\takt.db",
    why: "Wird von Aufräumwerkzeugen geleert. Im Prüfbetrieb gewollt, am Arbeitsplatz ein Fehler in der Einrichtung.",
  },
  {
    label: "Arbeitsspeicher",
    path: null,
    why: "`databasePath: null` — keine Datei. Ein eigener Zustand, kein Befund: So läuft der Prüfbetrieb und diese Musterseite.",
  },
];

interface UserExample {
  readonly label: string;
  readonly user: string;
  readonly why: string;
}

const USERS: readonly UserExample[] = [
  {
    label: "Angemeldet",
    user: "MUSTERFIRMA\\mmueller",
    why: "So kommt der Name über die zweite stdin-Zeile von der Hülle — Domäne und Anmeldename, wie ihn das Betriebssystem führt.",
  },
  {
    label: "Kein Name",
    user: "",
    why: "Der Dienst meldet keinen. Kein leeres Feld, sondern ein Satz dazu, was das für den Export bedeutet und was zu tun ist.",
  },
];

export function WorkstationSection() {
  const [pathIndex, setPathIndex] = useState(0);
  const [userIndex, setUserIndex] = useState(0);

  const pathExample = PATHS[pathIndex] ?? PATHS[0];
  const userExample = USERS[userIndex] ?? USERS[0];
  const path = pathExample?.path ?? null;
  const user = userExample?.user ?? "";
  const advice = adviseDatabaseLocation(path ?? "");

  return (
    <Section
      id="arbeitsplatz"
      title="4b — Arbeitsplatz: Name und Ablageort"
      lead="Zwei Werte, die keine Einstellungen sind. Der Name geht in jede Exportzeile, der Pfad zeigt auf die Datei mit den Kundendaten. Ändern lässt sich hier nichts — nachsehen alles."
      refs={["C-20", "E-010", "E-042", "E-018", "R-13", "B-1.6", "B-8.1"]}
    >
      <Card
        title="Beispielwerte"
        description="Jeder setzt die echten Bausteine darunter. Die Befunde zum Pfad entstehen aus derselben Funktion, die die Einstellungen benutzen."
      >
        <div className="demo-row">
          {USERS.map((example, index) => (
            <Button
              key={example.label}
              size="sm"
              variant={index === userIndex ? "primary" : "secondary"}
              aria-pressed={index === userIndex}
              onClick={() => setUserIndex(index)}
            >
              {example.label}
            </Button>
          ))}
        </div>
        <p className="field__hint">{userExample?.why ?? ""}</p>

        <div className="demo-row">
          {PATHS.map((example, index) => (
            <Button
              key={example.label}
              size="sm"
              variant={index === pathIndex ? "primary" : "secondary"}
              aria-pressed={index === pathIndex}
              onClick={() => setPathIndex(index)}
            >
              {example.label}
            </Button>
          ))}
        </div>
        <p className="field__hint">{pathExample?.why ?? ""}</p>
      </Card>

      <Card
        title="Dieser Arbeitsplatz (S-09)"
        description="So steht die Karte in den Einstellungen — ohne Speichern-Knopf, weil es nichts zu speichern gibt."
      >
        <div className="workstation">
          <BillingUserFact user={user} />
          <DatabaseLocationFact path={path} />
        </div>
      </Card>

      <SubHeading>Warum die Anzeige zur Absicherung gehört</SubHeading>
      <p className="section__lead">
        E-042 holt den Benutzernamen ausdrücklich nicht aus der Umgebungsvariablen, sondern über
        einen eigenen Kanal vom Betriebssystem — sonst genügte{" "}
        <span className="mono">set USERNAME=fremder &amp;&amp; Takt.exe</span>, um fremde
        Arbeitszeit unter eigenem Namen abzurechnen. Diese Absicherung ist wertlos, wenn niemand
        nachsehen kann, welcher Name tatsächlich verwendet wird. Und der Moment, in dem man es
        wissen will, liegt <strong>vor</strong> dem ersten Export — nicht danach im Protokoll.
        Deshalb steht der Name auch in S-07 neben Vorlage, Rundung und Exportordner.
      </p>

      <Card title="Zustandsmatrix">
        <table className="statematrix">
          <thead>
            <tr>
              <th scope="col">Auskunft</th>
              <th scope="col">Zustand</th>
              <th scope="col">Was die Ansicht zeigt</th>
              <th scope="col">Deckung</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Benutzername</td>
              <td>gemeldet</td>
              <td>Name, Satz über die Exportzeile, Herkunft aus dem abgesicherten Kanal</td>
              <td>E-010 · E-042 · B-8.1</td>
            </tr>
            <tr>
              <td>Benutzername</td>
              <td>leer</td>
              <td>Warnung mit Folge und Handgriff, kein leeres Feld</td>
              <td>E-042</td>
            </tr>
            <tr>
              <td>Ablageort</td>
              <td>Pfad, nichts gefunden</td>
              <td>Pfad, Kopierknopf, Sicherungshinweis — und der Grenzsatz</td>
              <td>R-13 · E-018</td>
            </tr>
            <tr>
              <td>Ablageort</td>
              <td>Synchronisierungsordner</td>
              <td>Befund mit Grund, Beleg, Handgriff; Wirkung: Vertraulichkeit und Bestand</td>
              <td>R-13 · B-5.3 Punkt 3</td>
            </tr>
            <tr>
              <td>Ablageort</td>
              <td>Netzfreigabe</td>
              <td>dito — dazu die Unzuverlässigkeit von SQLite über Netz</td>
              <td>R-13 · B-5.2 Punkt 2</td>
            </tr>
            <tr>
              <td>Ablageort</td>
              <td>Roaming-Profil</td>
              <td>dito — mit dem Verweis auf die Vorgabe unter AppData\Local</td>
              <td>R-13 · E-018</td>
            </tr>
            <tr>
              <td>Ablageort</td>
              <td>Temp-Ordner</td>
              <td>Befund zum Bestand: Was hier steht, kann beim nächsten Start fehlen</td>
              <td>E-018</td>
            </tr>
            <tr>
              <td>Ablageort</td>
              <td>
                <span className="mono">null</span>
              </td>
              <td>„Diese Fassung führt keine Datei“ — eigener Satz, kein Befund</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>

        <p className="field__hint">
          Es gibt hier <strong>keine Stufen</strong>. Beim Exportordner gibt es einen Knopf zu
          sperren und eine Rückfrage zu stellen; der Ablageort des Bestandes ist über keine Route
          und kein Startargument einstellbar (B-1.6 Punkt 1). Jeder Befund führt deshalb einen
          Handgriff mit, der außerhalb von Takt liegt — eine Warnung ohne Ausweg wäre an dieser
          Stelle nur ein Vorwurf.
        </p>

        <p className="field__hint">
          <strong>Und kein Befund ist keine Entwarnung.</strong> Zum Exportordner fragt der Dienst
          das Betriebssystem und belegt Merkmale (T-039); zu dieser Datei liefert er nur den Pfad.
          Beurteilt ist damit ausschließlich, was <em>im Pfad steht</em>. Ein zugeordnetes
          Netzlaufwerk wie <span className="mono">Z:\</span> und ein Ordner, den ein
          Synchronisierungsclient nach einer Umbenennung weiter überwacht, stehen dort nicht — und
          die Ansicht sagt genau das, gerade im Fall{" "}
          <span className="mono">{advice.concerns.length === 0 ? "ohne Befund" : "mit Befund"}</span>.
        </p>
      </Card>
    </Section>
  );
}
