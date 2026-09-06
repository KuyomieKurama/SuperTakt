import { useMemo, useState } from "react";
import { ConfirmDialog } from "../components/ConfirmDialog";
import {
  Base64Notice,
  ExportDirectoryConcernList,
  ExportDirectoryField,
} from "../components/ExportDirectoryField";
import { Button, Card, InlineMessage } from "../components/Primitives";
import { adviseExportDirectory } from "../lib/exportDirectoryAdvice";
import { Section, SubHeading } from "./Section";

/**
 * Musterseite, Abschnitt 4a — die Wahl des Exportordners (Befund S-04).
 *
 * Der Abschnitt ist **bedienbar** und nicht abgebildet: Die Beispielpfade
 * setzen den echten Baustein, und die Befunde entstehen aus
 * `adviseExportDirectory`, nicht aus einer Liste hier. Wer die Heuristik
 * ändert, sieht die Änderung an dieser Stelle — eine nachgestellte Warnung
 * wäre beim ersten Umbau still falsch geworden.
 *
 * Die Musterseite läuft ohne Tauri-Hülle. Der Baustein zeigt hier deshalb
 * seinen **Rückfallweg**: das Textfeld plus den Hinweis, dass es den
 * Systemdialog im Browser nicht gibt. Genau das sieht auch, wer `pnpm dev`
 * ohne Hülle fährt.
 */

interface Example {
  readonly label: string;
  readonly path: string;
  readonly why: string;
}

/**
 * Die Beispiele decken jede Stufe ab. Sie sind erfunden, aber der Bauform
 * nach echt: `OneDrive - Musterfirma` ist die Schreibweise, die Windows für
 * die Geschäftsfassung anlegt.
 */
const EXAMPLES: readonly Example[] = [
  {
    label: "Vorgabe",
    path: "C:\\Users\\mmueller\\AppData\\Local\\Takt\\exports",
    why: "Der Ablageort aus E-018. Nicht synchronisiert, nicht umgeleitet, kein Befund.",
  },
  {
    label: "OneDrive",
    path: "C:\\Users\\mmueller\\OneDrive - Musterfirma\\Takt",
    why: "Synchronisierungsordner — Rückfrage, keine Sperre (B-5.3 Punkt 3).",
  },
  {
    label: "Netzfreigabe",
    path: "\\\\fileserver\\abrechnung\\takt",
    why: "UNC-Pfad — Rückfrage. Kann der gewollte Übergabeweg sein (B-5.2 Punkt 2).",
  },
  {
    label: "Roaming-Profil",
    path: "C:\\Users\\mmueller\\AppData\\Roaming\\Takt",
    why: "Wandert beim Abmelden auf den Dateiserver (R-13).",
  },
  {
    label: "Dokumente",
    path: "C:\\Users\\mmueller\\Dokumente\\Takt",
    why: "Auf verwalteten Rechnern häufig nach OneDrive umgeleitet — Hinweis, keine Rückfrage.",
  },
  {
    label: "Systemordner",
    path: "C:\\Windows\\System32\\Takt",
    why: "Abgewiesen. Dorthin gehört nichts, was Takt schreibt (B-5.2 Punkt 1).",
  },
  {
    label: "Laufwerkswurzel",
    path: "D:\\",
    why: "Abgewiesen.",
  },
  {
    label: "Ohne Anfang",
    path: "takt\\export",
    why: "Abgewiesen — ein Pfad ohne Laufwerk zeigt je nach Arbeitsverzeichnis woandershin.",
  },
];

export function ExportDirectorySection() {
  const [path, setPath] = useState(EXAMPLES[0]?.path ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const advice = useMemo(() => adviseExportDirectory(path), [path]);
  const leading = advice.concerns[0] ?? null;
  const blocked = advice.verdict === "reject";

  return (
    <Section
      id="exportordner"
      title="4a — Der Exportordner"
      lead="Gewählt wird im Systemdialog, nicht getippt. Die Warnungen erklären, sie verbieten nicht — abgewiesen wird nur, wohin nichts gehört, was Takt schreibt."
      refs={["S-04", "B-5.1", "B-5.2", "B-5.3", "B-6.1", "E-011", "E-018"]}
    >
      <Card
        title="Beispielpfade"
        description="Jeder setzt den echten Baustein darunter. Die Befunde entstehen aus derselben Funktion, die die Einstellungen benutzen."
      >
        <div className="demo-row">
          {EXAMPLES.map((example) => (
            <Button
              key={example.label}
              size="sm"
              variant={path === example.path ? "primary" : "secondary"}
              aria-pressed={path === example.path}
              onClick={() => {
                setPath(example.path);
                setSaved(null);
              }}
            >
              {example.label}
            </Button>
          ))}
        </div>
        <p className="field__hint">
          {EXAMPLES.find((example) => example.path === path)?.why ??
            "Eigene Eingabe — die Beurteilung läuft bei jedem Zeichen mit."}
        </p>
      </Card>

      <Card
        title="Exportordner (S-09)"
        description="So steht das Feld in den Einstellungen. Ohne Hülle zeigt es seinen Rückfallweg."
        actions={
          <Button
            variant="primary"
            disabled={blocked}
            onClick={() => {
              if (advice.verdict === "confirm") setConfirmOpen(true);
              else setSaved(path);
            }}
          >
            Speichern
          </Button>
        }
      >
        <ExportDirectoryField
          value={path}
          onChange={(next) => {
            setPath(next);
            setSaved(null);
          }}
          advice={advice}
          serviceState="ok"
          /* Auf der Musterseite gibt es kein Betriebssystem, das etwas belegen
             könnte. Die leere Liste zeigt genau den Fall, der in T-039 zählt:
             „nichts belegt" ist keine Entwarnung, und die Ansicht sagt das. */
          serviceTraits={[]}
          unsaved={saved !== path}
        />
        {/* Dieselbe Bauart wie in den Einstellungen (O-GQ, T-191): Die Region
            steht immer da, der Satz kommt später. Die Musterseite zeigt die
            Bauart mit, sonst wird hier abgeschrieben, was dort behoben ist. */}
        <p className="field__error" role="status">
          {blocked ? "Solange dieser Ordner eingetragen ist, lässt sich nichts speichern." : null}
        </p>
        {saved === null ? null : (
          <InlineMessage tone="success" title="Eingestellt">
            Der Exportordner steht jetzt auf <span className="mono">{saved}</span>. In der
            Anwendung folgte hier der Abruf von <span className="mono">GET /settings</span>, der
            den Ordner ein zweites Mal prüft.
          </InlineMessage>
        )}
      </Card>

      <SubHeading>Die Rückfrage</SubHeading>
      <p className="section__lead">
        Sie erscheint beim Speichern und nur für Befunde der Stufe „Rückfrage“ — und nur einmal je
        Pfad. Wer danach einen anderen Netzordner wählt, wird wieder gefragt; eine Zustimmung, die
        für jeden künftigen Ordner gälte, wäre keine.
      </p>
      <Card
        title="Alle Befunde nebeneinander"
        description="Was die Heuristik zu diesem Pfad sagt — Beleg inbegriffen, damit man ihr widersprechen kann."
      >
        {advice.concerns.length === 0 ? (
          <p className="muted">
            Nichts aufgefallen. Das ist der Normalfall und braucht keinen Kasten — hier steht der
            Satz nur, weil die Musterseite auch den Leerzustand zeigt.
          </p>
        ) : (
          <ExportDirectoryConcernList concerns={advice.concerns} />
        )}
      </Card>

      <Card title="Zustandsmatrix — die drei Stufen">
        <table className="statematrix">
          <thead>
            <tr>
              <th scope="col">Stufe</th>
              <th scope="col">Was auslöst</th>
              <th scope="col">Speichern</th>
              <th scope="col">Rückfrage</th>
              <th scope="col">Bleibt stehen</th>
              <th scope="col">Bedrohung</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Abweisen</td>
              <td>Systemverzeichnis, Laufwerkswurzel, Pfad ohne Anfang</td>
              <td>gesperrt</td>
              <td>nein — es gibt nichts zu entscheiden</td>
              <td>ja, als Fehler</td>
              <td>B-5.2 Punkt 1</td>
            </tr>
            <tr>
              <td>Rückfrage</td>
              <td>UNC-Pfad, eingehängte Freigabe, Synchronisierungsordner, AppData\Roaming</td>
              <td>frei</td>
              <td>ja, einmal je Pfad, mit Kontrollkästchen</td>
              <td>ja, als Warnung</td>
              <td>B-5.2 Punkt 2 · B-5.3 Punkt 3 · R-13</td>
            </tr>
            <tr>
              <td>Hinweis</td>
              <td>Desktop, Dokumente, Bilder, Downloads</td>
              <td>frei</td>
              <td>nein — der Befund ist möglich, nicht sicher</td>
              <td>ja, als Warnung</td>
              <td>B-5.3 · E-018</td>
            </tr>
            <tr>
              <td>Nichts</td>
              <td>alles übrige, darunter die Vorgabe aus E-018</td>
              <td>frei</td>
              <td>nein</td>
              <td>nein — kein Kasten für den Normalfall</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
        <p className="field__hint">
          Die Prüfung des <strong>Dienstes</strong> läuft danach noch einmal und unabhängig davon:
          vorhanden, ein Ordner, beschreibbar, und der Zielpfad segmentweise gegen den aufgelösten
          Ordner. Diese Tabelle ist die Erklärung, nicht die Grenze — ein Fehler hier macht eine
          Warnung falsch, keinen Angriff möglich.
        </p>
        <p className="field__hint">
          Seit T-039 kommt vom Dienst zweierlei dazu. Erstens <strong>belegte Merkmale</strong> —
          UNC, Netzdateisystem, Ablageordner eines Synchronisierungsdienstes, Systemverzeichnis —,
          gefunden über <span className="mono">%OneDrive%</span>,{" "}
          <span className="mono">%SystemRoot%</span> und die Art des Dateisystems statt über einen
          Namensvergleich. Sie sagen „ist“, wo diese Tabelle „liegt in“ sagt. Zweitens der Zustand{" "}
          <strong>„antwortet nicht“</strong>: Die Prüfung wartet drei Sekunden, und was danach
          kommt, ist nicht als abwesend belegt.
        </p>
        <p className="field__hint">
          <strong>Und eine leere Merkmalsliste ist keine Entwarnung.</strong> Ein zugeordnetes
          Netzlaufwerk wie <span className="mono">Z:\</span> steht weder im Pfad noch in einer
          Auskunft, die der Dienst bekommt. Die Ansicht sagt deshalb „nichts belegt“ und nennt die
          Grenze — sie sagt an keiner Stelle, der Ordner sei in Ordnung. Darüber im Feld steht der
          Satz dazu, auch hier auf der Musterseite, wo es gar kein Betriebssystem zu fragen gibt.
        </p>
      </Card>

      <SubHeading>Der stehende Satz zu Base64 (B-6.1 Punkt 1)</SubHeading>
      <p className="section__lead">
        Er steht an genau zwei Stellen: dort, wo der Ordner gewählt wird, und in S-07 neben dem
        Exportziel. Nicht in einem Hilfetext — die Bedrohung verlangt ihn in der Ansicht.
      </p>
      <Base64Notice />

      <ConfirmDialog
        open={confirmOpen && leading !== null}
        tone="danger"
        title={leading?.title ?? ""}
        description={leading?.body ?? ""}
        consequence="Die Exportdatei enthält lesbare Kundennotizen. Base64 ist eine Kodierung, keine Verschlüsselung — wer die Datei öffnen kann, kann sie lesen."
        confirmLabel="Ordner trotzdem einstellen"
        cancelLabel="Anderen Ordner wählen"
        acknowledgeLabel="Ich weiß, dass die Kundennotizen dorthin gelangen, und will es so."
        onConfirm={() => {
          setSaved(path);
          setConfirmOpen(false);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </Section>
  );
}
