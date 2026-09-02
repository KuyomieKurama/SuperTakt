/**
 * Takt — was an einem gewählten Exportordner auffällt, und warum es zählt.
 *
 * Befund S-04 der Sicherheitsprüfung, Bedrohungen B-5.1 Punkt 1, B-5.2 Punkte
 * 1 bis 3, B-5.3 Punkt 3.
 *
 * ## Diese Datei ist die Erklärung, nicht die Grenze
 *
 * Die Grenze zieht der Dienst: `checkExportDirectory` prüft vorhanden, Ordner,
 * beschreibbar, und der Schreibpfad wird gegen den aufgelösten Ordner geprüft,
 * bevor irgendetwas entsteht (B-5.1 Punkt 3). Das hält — die Prüfung von T-023
 * hat es gemessen. Hier steht deshalb **kein** Schutz, sondern der Satz, der
 * dem Benutzer sagt, worauf er sich einlässt, **bevor** er speichert.
 *
 * Der Unterschied ist wichtig für jeden, der hier etwas ändert: Ein Fehler in
 * dieser Datei macht eine Warnung falsch. Er macht keinen Angriff möglich.
 * Umgekehrt gilt das nicht — wer hier eine Prüfung einbaut und sie im Dienst
 * spart, hat sie nicht.
 *
 * ## Warum überhaupt gewarnt und nicht gesperrt wird
 *
 * E-011 sagt: Der Ordner ist konfigurierbar. Das bleibt. Eine Netzfreigabe
 * kann der gewollte Übergabeweg an das Abrechnungstool sein, und B-5.2 Punkt 2
 * sagt es wörtlich: „Nicht verbieten … aber niemals stillschweigend zulassen."
 * Abgewiesen wird genau das, wohin nichts gehört, was Takt schreibt:
 * Systemverzeichnisse und die Wurzel eines Laufwerks.
 *
 * ## Warum die Heuristik eine Heuristik ist, und das auch sagt
 *
 * Ob `Z:\` ein zugeordnetes Netzlaufwerk ist, steht nicht im Pfad. Ob
 * `C:\Users\…\Dokumente` nach OneDrive umgeleitet ist, ebenso wenig — das weiß
 * nur das Betriebssystem. Diese Datei erkennt, was im Pfad steht: den
 * UNC-Vorsatz, den Namen eines Synchronisierungsdienstes, `AppData\Roaming`.
 * Das erwischt den häufigsten Fall (B-5.3 Punkt 3) und nennt sich deshalb
 * nirgends „geprüft". Die Meldungen sagen „liegt in", nicht „ist".
 */

/*
 * Die Mechanik — Zerlegung eines Pfades, die Namen der
 * Synchronisierungsdienste, die Belege für Freigabe und Roaming-Profil —
 * steht seit T-049 in `pathInspection.ts`. Sie wird dort von der Auskunft
 * zum Ablageort des Bestandes mitbenutzt (`databaseLocationAdvice.ts`), und
 * zwei Listen von Synchronisierungsordnern wären zwei Listen, die
 * auseinanderlaufen. Was hier bleibt, ist die **Bewertung**: welche Stufe ein
 * Befund hat und welcher Satz dazugehört.
 */
import {
  fold,
  networkShareEvidence,
  roamingProfileEvidence,
  shapeOf,
  syncFolderEvidence,
} from "./pathInspection";

/* ==================================================================== */
/* Gestalt                                                              */
/* ==================================================================== */

/**
 * Was an einem Pfad aufgefallen ist.
 *
 * Ausgeschriebene Fälle statt eines freien Textes: Die Oberfläche entscheidet
 * an dieser Kennung, wie laut sie wird, und ein Vergleich auf eine Überschrift
 * wäre beim ersten Umformulieren still falsch.
 */
export type ExportDirectoryConcernKind =
  | "not_absolute"
  | "system_directory"
  | "drive_root"
  | "network_share"
  | "sync_folder"
  | "roaming_profile"
  | "redirected_folder"
  | "volatile_folder";

/**
 * Wie schwer der Befund wiegt.
 *
 *   `reject`   Takt speichert diesen Pfad nicht. Dorthin gehört nichts, was
 *              Takt schreibt (B-5.2 Punkt 1).
 *   `confirm`  Rückfrage vor dem Speichern. Der Benutzer darf, aber nicht
 *              stillschweigend (B-5.2 Punkt 2).
 *   `warn`     Stehender Hinweis, kein Dialog. Der Befund ist möglich, nicht
 *              sicher — eine Rückfrage auf einen Verdacht hin wäre eine
 *              Rückfrage, die man wegklickt.
 */
export type ExportDirectoryVerdict = "reject" | "confirm" | "warn";

export interface ExportDirectoryConcern {
  readonly kind: ExportDirectoryConcernKind;
  readonly verdict: ExportDirectoryVerdict;
  /** Was gefunden wurde, in einer Zeile. */
  readonly title: string;
  /** Warum das hier zählt. Der Grund, nicht die Regel. */
  readonly body: string;
  /**
   * Was im Pfad den Ausschlag gab — wörtlich, damit der Benutzer die Warnung
   * nachvollziehen und ihr widersprechen kann. Eine Warnung ohne Beleg ist
   * eine Behauptung.
   */
  readonly evidence: string;
}

export interface ExportDirectoryAdvice {
  /** Der schwerste Befund. `ok`, wenn nichts aufgefallen ist. */
  readonly verdict: "ok" | ExportDirectoryVerdict;
  /** Alle Befunde, schwerster zuerst. */
  readonly concerns: readonly ExportDirectoryConcern[];
}

/** Nichts aufgefallen — der Normalfall und ein eigener Wert, kein `null`. */
const NOTHING: ExportDirectoryAdvice = { verdict: "ok", concerns: [] };

/* ==================================================================== */
/* Listen                                                               */
/* ==================================================================== */

/**
 * Erste Ebene unter einem Laufwerksbuchstaben, in die Takt nicht schreibt
 * (B-5.2 Punkt 1). Alles darunter zählt mit: `C:\Windows\Temp` ist so wenig
 * ein Exportordner wie `C:\Windows`.
 */
const WINDOWS_SYSTEM_ROOTS: ReadonlySet<string> = new Set([
  "windows",
  "winnt",
  "program files",
  "program files (x86)",
  "programdata",
  "system volume information",
  "$recycle.bin",
  "recovery",
  "perflogs",
  "boot",
  "efi",
]);

/**
 * Dasselbe für Unix. Takt ist ein Windows-Produkt (A-8.5), aber der
 * Entwicklungsbetrieb läuft hier — und eine Warnung, die nur auf einem
 * Betriebssystem greift, prüft niemand nach.
 *
 * `run` fehlt bewusst: Darunter liegen unter `run/user/<uid>/gvfs` die
 * eingehängten Netzfreigaben des Benutzers. Die sind eine Rückfrage wert und
 * keine Abweisung; sie werden weiter unten gefangen.
 */
const POSIX_SYSTEM_ROOTS: ReadonlySet<string> = new Set([
  "bin",
  "sbin",
  "boot",
  "dev",
  "etc",
  "lib",
  "lib32",
  "lib64",
  "proc",
  "sys",
  "usr",
  "var",
]);

/**
 * Ordner, die unter Windows regelmäßig nach OneDrive umgeleitet sind
 * („Bekannte Ordner verschieben"). Das ist der Grund, aus dem E-018 die
 * Vorgabe ausdrücklich **nicht** auf Desktop oder Dokumente gelegt hat.
 */
const REDIRECTED_FOLDER_NAMES: ReadonlySet<string> = new Set([
  "desktop",
  "schreibtisch",
  "documents",
  "dokumente",
  "eigene dateien",
  "pictures",
  "bilder",
]);

/* ==================================================================== */
/* Die Beurteilung                                                      */
/* ==================================================================== */

const ORDER: Readonly<Record<ExportDirectoryVerdict, number>> = {
  reject: 0,
  confirm: 1,
  warn: 2,
};

/**
 * Beurteilt einen eingetippten oder im Dialog gewählten Ordner.
 *
 * Ein leerer Pfad ergibt `ok` ohne Befund: „noch nicht gewählt" ist kein
 * Fehler dieser Datei, sondern der Zustand `not_set` des Dienstes, und der hat
 * seinen eigenen Satz in der Ansicht.
 */
export function adviseExportDirectory(rawPath: string): ExportDirectoryAdvice {
  const path = rawPath.trim();
  if (path.length === 0) return NOTHING;

  const found: ExportDirectoryConcern[] = [];
  const shape = shapeOf(path);

  if (shape.kind === "relative") {
    return {
      verdict: "reject",
      concerns: [
        {
          kind: "not_absolute",
          verdict: "reject",
          title: "Das ist kein vollständiger Pfad",
          body: "Takt braucht den ganzen Weg zum Ordner — unter Windows mit Laufwerksbuchstaben, etwa C:\\Takt\\Export. Ein Pfad ohne Anfang zeigt je nach Arbeitsverzeichnis woandershin.",
          evidence: path,
        },
      ],
    };
  }

  /* Wurzel eines Laufwerks — B-5.2 Punkt 1. */
  if (shape.rest.length === 0 && (shape.kind === "windows" || shape.kind === "posix")) {
    found.push({
      kind: "drive_root",
      verdict: "reject",
      title: "Das ist die Wurzel eines Laufwerks",
      body: "Dorthin schreibt Takt nicht. Exportdateien in der Laufwerkswurzel sind für jedes Programm sichtbar, das das Laufwerk durchsucht, und lassen sich später von den Dateien des Systems nicht mehr auseinanderhalten. Legen Sie einen eigenen Unterordner an.",
      evidence: shape.kind === "windows" ? `${shape.anchor}\\` : "/",
    });
  }

  /* Systemverzeichnisse — B-5.2 Punkt 1. */
  const first = shape.rest[0];
  if (first !== undefined) {
    const isWindowsSystem = shape.kind === "windows" && WINDOWS_SYSTEM_ROOTS.has(fold(first));
    const isPosixSystem = shape.kind === "posix" && POSIX_SYSTEM_ROOTS.has(fold(first));
    if (isWindowsSystem || isPosixSystem) {
      found.push({
        kind: "system_directory",
        verdict: "reject",
        title: "Das ist ein Verzeichnis des Betriebssystems",
        body: "Dorthin gehört nichts, was Takt schreibt. Der Export enthält Kundendaten, die in einem Systemordner niemand vermutet und die dort bei der nächsten Aktualisierung oder Bereinigung ohne Vorwarnung verschwinden können. Wählen Sie einen Ordner unter Ihrem Benutzerprofil.",
        evidence: shape.kind === "windows" ? `${shape.anchor}\\${first}` : `/${first}`,
      });
    }
  }

  /* Freigabe oder eingehängtes Netzlaufwerk — B-5.2 Punkt 2. */
  const networkEvidence = networkShareEvidence(shape);
  if (networkEvidence !== null) {
    found.push({
      kind: "network_share",
      verdict: "confirm",
      title: "Dieser Ordner liegt nicht auf diesem Rechner",
      body: "Die Exportdatei enthält lesbare Kundennotizen und verlässt damit diesen Rechner — bei einem Produkt, das laut E-001 vollständig lokal arbeitet. Und der Export schlägt fehl, sobald die Verbindung gerade nicht steht: Das Laufwerk ist getrennt, der Server nicht erreichbar, das Notebook nicht im Firmennetz. Wenn das Ihr Übergabeweg an die Abrechnung ist, ist es der richtige Ordner — dann wissen Sie jetzt, was darin liegt.",
      evidence: networkEvidence,
    });
  }

  /* Synchronisierungsordner — B-5.3 Punkt 3, R-13. */
  const syncSegment = syncFolderEvidence(shape);
  if (syncSegment !== null) {
    found.push({
      kind: "sync_folder",
      verdict: "confirm",
      title: "Dieser Ordner wird in einen Onlinespeicher synchronisiert",
      body: "Alles, was Takt hier ablegt, wird kurz darauf hochgeladen — automatisch, ohne weitere Rückfrage und ohne dass es jemand sieht. Die Exportdatei enthält lesbare Kundennotizen; Base64 ist eine Kodierung, keine Verschlüsselung. Damit liegen die Daten Ihrer Kunden bei einem Anbieter, und die Entscheidung dafür trifft man besser hier als später beim Aufräumen.",
      evidence: syncSegment,
    });
  }

  /* Roaming-Profil — R-13, E-018. */
  const roamingEvidence = roamingProfileEvidence(shape);
  if (roamingEvidence !== null) {
    found.push({
      kind: "roaming_profile",
      verdict: "confirm",
      title: "Dieser Ordner gehört zum servergespeicherten Profil",
      body: "Der Ordner AppData\\Roaming wird beim An- und Abmelden auf einen Dateiserver kopiert, wenn das Konto ein servergespeichertes Profil hat. Die Exportdateien mit ihren lesbaren Kundennotizen wandern dann mit. Genau deswegen liegen die Daten von Takt unter AppData\\Local (E-018) — dort bleiben sie auf diesem Rechner.",
      evidence: roamingEvidence,
    });
  }

  /*
   * Umgeleiteter bekannter Ordner — nur, wenn der Pfad nicht schon aus einem
   * härteren Grund auffiel. „Könnte umgeleitet sein" neben „wird
   * synchronisiert" zu stellen wäre die schwächere Aussage über dieselbe
   * Sache, und die laute Meldung verlöre daran.
   */
  const alreadyExplained = found.some(
    (concern) => concern.kind === "sync_folder" || concern.kind === "roaming_profile",
  );
  const redirected = shape.rest.find((part) => REDIRECTED_FOLDER_NAMES.has(fold(part)));
  if (!alreadyExplained && redirected !== undefined) {
    found.push({
      kind: "redirected_folder",
      verdict: "warn",
      title: "Dieser Ordner ist auf verwalteten Rechnern häufig nach OneDrive umgeleitet",
      body: "Desktop, Dokumente und Bilder werden auf geschäftlichen Windows-Rechnern regelmäßig über „Bekannte Ordner verschieben“ in OneDrive gelegt. Von außen sieht der Pfad unverändert aus. Prüfen Sie im Explorer, ob der Ordner ein Wolkensymbol trägt — wenn ja, gehen die Exportdateien in den Onlinespeicher.",
      evidence: redirected,
    });
  }

  /* Downloads — B-5.3, Bewertung der Voreinstellungen. */
  if (shape.rest.some((part) => fold(part) === "downloads")) {
    found.push({
      kind: "volatile_folder",
      verdict: "warn",
      title: "Der Downloads-Ordner wird von Aufräumwerkzeugen geleert",
      body: "Windows-Speicheroptimierung und die meisten Bereinigungswerkzeuge löschen hier ohne Rückfrage. Eine Exportdatei, die noch nicht in der Abrechnung angekommen ist, wäre dann weg — und die Buchungen darin sind bereits als exportiert markiert.",
      evidence: "Downloads",
    });
  }

  if (found.length === 0) return NOTHING;

  const concerns = [...found].sort((left, right) => ORDER[left.verdict] - ORDER[right.verdict]);
  // Nach der Sortierung steht der schwerste vorn; `concerns[0]` ist damit
  // gesetzt, aber `noUncheckedIndexedAccess` weiss das nicht.
  const worst = concerns[0]?.verdict ?? "warn";
  return { verdict: worst, concerns };
}

/* ==================================================================== */
/* Vergleich zweier Pfade                                               */
/* ==================================================================== */

/**
 * Liegt `filePath` innerhalb von `directory`?
 *
 * **Nur für die Anzeige.** Die Oberfläche fragt damit, ob schon einmal in
 * diesen Ordner exportiert wurde (B-6.1 Punkt 2) — nicht, ob geschrieben
 * werden darf. Diese Frage beantwortet der Dienst, und er beantwortet sie mit
 * dem aufgelösten Pfad, den nur er kennt.
 *
 * Verglichen wird segmentweise und nicht mit `startsWith`: Sonst läge
 * `C:\Export-Geheim\datei.json` in `C:\Export`. Das ist genau die Falle aus
 * B-5.1 Punkt 3, und sie ist hier so wenig richtig wie dort.
 */
export function isPathInsideDirectory(filePath: string, directory: string): boolean {
  const dir = directory.trim();
  if (dir.length === 0) return false;

  const outer = shapeOf(dir);
  const inner = shapeOf(filePath.trim());
  if (outer.kind !== inner.kind) return false;
  if (fold(outer.anchor) !== fold(inner.anchor)) return false;
  if (inner.rest.length <= outer.rest.length) return false;

  return outer.rest.every((part, index) => fold(part) === fold(inner.rest[index] ?? ""));
}
