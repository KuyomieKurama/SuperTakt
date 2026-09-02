/**
 * Takt — was sich einem Pfad ansehen lässt, ohne das Dateisystem zu fragen.
 *
 * ## Wozu diese Datei
 *
 * Zwei Ansichten legen einen Pfad aus, und sie meinen dabei Verschiedenes:
 *
 *   `exportDirectoryAdvice.ts`   den **Exportordner** — wählbar, deshalb mit
 *                                Stufen bis zur Sperre (S-04, B-5.2).
 *   `databaseLocationAdvice.ts`  den **Ablageort des Bestandes** — nicht
 *                                wählbar, deshalb reine Auskunft (R-13, C-20).
 *
 * Gemeinsam ist beiden die Mechanik: Wie zerfällt ein Windows-Pfad in seine
 * Teile, welche Ordnernamen gehören einem Synchronisierungsdienst, woran
 * erkennt man eine Netzfreigabe. Diese Mechanik steht hier **einmal**. Zwei
 * Listen von Synchronisierungsordnern wären zwei Listen, die auseinanderlaufen
 * — und die eine davon fiele erst auf, wenn eine Warnung ausbleibt, auf die es
 * ankam.
 *
 * ## Diese Datei ist Auslegung, keine Prüfung
 *
 * Hier steht kein Schutz. Die Grenze zieht der Dienst, und er zieht sie am
 * aufgelösten Pfad, den nur er kennt. Was hier steht, ist die Lesart einer
 * Zeichenkette — sie erkennt, was **im Pfad steht**, und nichts darüber
 * hinaus. Ob `Z:\` ein zugeordnetes Netzlaufwerk ist, ob ein Ordner nach
 * OneDrive umgeleitet wurde, ob ein Synchronisierungsclient einen umbenannten
 * Ordner überwacht: nicht aus dem Pfad zu holen. Jede Aussage, die von hier
 * kommt, sagt deshalb „liegt in" und niemals „ist" — und ein fehlender Befund
 * heißt „nichts gefunden", nicht „unbedenklich" (T-039).
 */

/* ==================================================================== */
/* Zerlegung                                                            */
/* ==================================================================== */

/**
 * Die Bestandteile eines Pfades, ohne leere Stücke.
 *
 * Beide Trennzeichen, weil Windows beide annimmt und ein von Hand getippter
 * Pfad regelmäßig gemischt ist.
 */
export function segmentsOf(path: string): readonly string[] {
  return path.split(/[\\/]+/u).filter((part) => part.length > 0);
}

/** Groß- und Kleinschreibung fällt weg; Windows unterscheidet sie nicht. */
export function fold(part: string): string {
  return part.trim().toLocaleLowerCase("de-DE");
}

export interface PathShape {
  /** `windows` = Laufwerksbuchstabe, `unc` = Freigabe, `posix` = führendes `/`. */
  readonly kind: "windows" | "unc" | "posix" | "relative";
  /** Der Laufwerksbuchstabe mit Doppelpunkt, die Freigabe oder `/`. */
  readonly anchor: string;
  /** Was hinter dem Anker steht. */
  readonly rest: readonly string[];
}

const WINDOWS_DRIVE = /^([A-Za-z]:)[\\/]/u;
const UNC_PREFIX = /^[\\/]{2}/u;
/** `\\?\` und `\\.\` — die Gerätepfadform von Windows. */
const DEVICE_PREFIX = /^[\\/]{2}[?.][\\/]/u;

/**
 * Zerlegt einen Pfad in Anker und Segmente.
 *
 * Segmentweise und nicht als Zeichenkette: Ein `startsWith` auf `C:\Windows`
 * fängt auch `C:\Windows-Sicherung`, und genau diese Falle beschreibt B-5.1
 * Punkt 3.
 */
export function shapeOf(path: string): PathShape {
  if (DEVICE_PREFIX.test(path)) {
    const parts = segmentsOf(path.replace(DEVICE_PREFIX, ""));
    const [head, ...tail] = parts;
    // `\\?\UNC\server\freigabe\…` ist eine Freigabe, `\\?\C:\…` ein Laufwerk.
    if (head !== undefined && fold(head) === "unc") {
      const [server, share, ...rest] = tail;
      return {
        kind: "unc",
        anchor: `\\\\${server ?? ""}\\${share ?? ""}`,
        rest,
      };
    }
    if (head !== undefined && /^[A-Za-z]:$/u.test(head)) {
      return { kind: "windows", anchor: head, rest: tail };
    }
    return { kind: "relative", anchor: "", rest: parts };
  }

  if (UNC_PREFIX.test(path)) {
    const [server, share, ...rest] = segmentsOf(path);
    return { kind: "unc", anchor: `\\\\${server ?? ""}\\${share ?? ""}`, rest };
  }

  const drive = WINDOWS_DRIVE.exec(path);
  if (drive !== null) {
    return {
      kind: "windows",
      anchor: drive[1] ?? "",
      rest: segmentsOf(path.slice(drive[0].length)),
    };
  }

  if (path.startsWith("/")) {
    return { kind: "posix", anchor: "/", rest: segmentsOf(path) };
  }

  return { kind: "relative", anchor: "", rest: segmentsOf(path) };
}

/* ==================================================================== */
/* Namen                                                                */
/* ==================================================================== */

/**
 * Namen von Synchronisierungsordnern (B-5.3 Punkt 3, R-13).
 *
 * Verglichen wird das ganze Segment, nicht ein Teilstück: `Dropbox` fängt den
 * Ordner, `Meine Dropbox-Notizen` nicht. Die Geschäftsfassungen von OneDrive
 * heißen `OneDrive - <Firma>` und werden über den Vorsatz gefangen.
 */
const SYNC_FOLDER_NAMES: ReadonlySet<string> = new Set([
  "onedrive",
  "dropbox",
  "google drive",
  "googledrive",
  "my drive",
  "meine ablage",
  "nextcloud",
  "owncloud",
  "icloud drive",
  "iclouddrive",
  "mobile documents",
  "box",
  "box sync",
  "pclouddrive",
  "seafile",
  "megasync",
  "tresorit",
  "syncthing",
  "creative cloud files",
]);

/** `OneDrive - Kontoso`, `Dropbox (Firma)`, `OneDriveCommercial`. */
const SYNC_FOLDER_PREFIXES: readonly string[] = ["onedrive", "dropbox"];

export function isSyncFolderName(part: string): boolean {
  const folded = fold(part);
  if (SYNC_FOLDER_NAMES.has(folded)) return true;
  return SYNC_FOLDER_PREFIXES.some(
    (prefix) => folded.startsWith(`${prefix} `) || folded.startsWith(`${prefix}-`),
  );
}

/** Das erste Segment, das einem Synchronisierungsdienst gehört — oder `null`. */
export function syncFolderEvidence(shape: PathShape): string | null {
  return shape.rest.find(isSyncFolderName) ?? null;
}

/**
 * Der Beleg dafür, dass der Pfad nicht auf diesem Rechner liegt — oder `null`.
 *
 * Was hier **nicht** steht: der zugeordnete Laufwerksbuchstabe. Ob `Z:\` auf
 * eine Freigabe zeigt, weiß nur das Betriebssystem; im Pfad steht es nicht.
 * Das ist die benannte Lücke dieser Auslegung (S-04, Gegenmittel 2; T-039).
 */
export function networkShareEvidence(shape: PathShape): string | null {
  if (shape.kind === "unc") return shape.anchor;
  if (shape.kind !== "posix") return null;

  const folded = shape.rest.map(fold);
  // Die vom Dateimanager eingehängten Freigaben eines Benutzers.
  if (folded[0] === "run" && folded[1] === "user" && folded[3] === "gvfs") {
    return "/run/user/…/gvfs";
  }
  // Übliche Einhängepunkte für Wechseldatenträger und Freigaben.
  if (folded[0] === "net") return "/net";
  if ((folded[0] === "mnt" || folded[0] === "media") && folded.length > 1) {
    return `/${folded[0]}/${shape.rest[1] ?? ""}`;
  }
  if (folded[0] === "volumes" && folded.length > 1) return `/Volumes/${shape.rest[1] ?? ""}`;
  return null;
}

/** Der Beleg für `AppData\Roaming` — oder `null`. */
export function roamingProfileEvidence(shape: PathShape): string | null {
  const folded = shape.rest.map(fold);
  const index = folded.indexOf("appdata");
  if (index === -1) return null;
  if (folded[index + 1] !== "roaming") return null;
  return "AppData\\Roaming";
}
