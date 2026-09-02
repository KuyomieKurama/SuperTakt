/**
 * Takt — was am Ablageort des Bestandes auffällt (R-13, C-20).
 *
 * ## Warum das nicht dieselbe Datei wie der Exportordner ist
 *
 * Beide legen einen Pfad aus, aber sie enden verschieden. Der Exportordner ist
 * **wählbar**: Dort ergibt eine Stufe „abgewiesen" einen Sinn, weil es einen
 * Knopf gibt, den man sperren kann, und eine Rückfrage, die man beantworten
 * kann (B-5.2). Der Ablageort des Bestandes ist **nicht wählbar** — er folgt
 * dem Anwendungsdatenverzeichnis dieses Benutzers (E-018) und ist über keine
 * Route und kein Startargument verstellbar (B-1.6 Punkt 1).
 *
 * Daraus folgt der ganze Zuschnitt dieser Datei: Es gibt keine Stufen, weil es
 * nichts zu sperren gibt. Jeder Befund führt stattdessen einen **Handgriff**
 * mit, der außerhalb von Takt liegt — den Ordner im Synchronisierungsclient
 * ausnehmen, die Verwaltung des Rechners fragen, die Anwendung aus ihrer
 * Verknüpfung starten. Eine Warnung ohne Ausweg wäre hier nur ein Vorwurf.
 *
 * ## Was die Datei ist, um die es geht
 *
 * Eine einzige SQLite-Datei mit allen Todos, Buchungen und Vermerken im
 * Klartext. Sichern heißt: diese Datei sichern. Abfließen heißt: diese Datei
 * abfließen. Über Synchronisierungsordner ist im Zusammenhang mit dem
 * **Export** viel entschieden worden — E-018 legt die Vorgabe bewusst lokal,
 * T-036 warnt dreistufig beim Exportordner. Für die Datei mit den Kundendaten
 * selbst konnte bisher niemand nachsehen, wo sie liegt. Genau das ist R-13.
 *
 * ## Und was diese Datei ausdrücklich nicht kann
 *
 * Zum Exportordner belegt der Dienst Merkmale beim Betriebssystem
 * (`exportDirectoryTraits`, T-039). Zu dieser Datei tut er das **nicht**:
 * `GET /settings` liefert den Pfad und sonst nichts. Was hier steht, ist
 * deshalb reine Auslegung einer Zeichenkette — und ein fehlender Befund heißt
 * „im Pfad steht nichts", nicht „unbedenklich". Die Einschränkung aus T-039
 * gilt hier verschärft, und die Ansicht sagt das (`DatabaseLocationFact`).
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
 * Was am Ablageort aufgefallen ist.
 *
 *   `sync_folder`       Die Datei wird hochgeladen.
 *   `network_share`     Die Datei liegt nicht auf diesem Rechner.
 *   `roaming_profile`   Die Datei wandert beim Abmelden auf einen Server.
 *   `temporary_folder`  Die Datei kann beim nächsten Aufräumen fehlen.
 */
export type DatabaseLocationConcernKind =
  | "sync_folder"
  | "network_share"
  | "roaming_profile"
  | "temporary_folder";

/**
 * Worauf ein Befund zielt.
 *
 *   `confidentiality`  Die Kundendaten verlassen diesen Rechner (R-13).
 *   `durability`       Der Bestand kann verschwinden oder beschädigt werden.
 *
 * Die Unterscheidung steht hier und nicht in der Ansicht, weil sie zum Befund
 * gehört und nicht zu seiner Darstellung: Ein Synchronisierungsordner ist
 * beides, und welches von beidem schwerer wiegt, entscheidet nicht die Farbe
 * eines Kastens.
 */
export type DatabaseLocationImpact = "confidentiality" | "durability";

export interface DatabaseLocationConcern {
  readonly kind: DatabaseLocationConcernKind;
  readonly impacts: readonly DatabaseLocationImpact[];
  /** Was gefunden wurde, in einer Zeile. */
  readonly title: string;
  /** Warum das hier zählt. Der Grund, nicht die Regel. */
  readonly body: string;
  /**
   * Was der Benutzer tun kann. Pflichtfeld: Takt kann den Ablageort nicht
   * verlegen, und ein Befund ohne Ausweg wäre an dieser Stelle nutzlos.
   */
  readonly remedy: string;
  /**
   * Was im Pfad den Ausschlag gab — wörtlich, damit der Benutzer die Auskunft
   * nachvollziehen und ihr widersprechen kann.
   */
  readonly evidence: string;
}

export interface DatabaseLocationAdvice {
  readonly concerns: readonly DatabaseLocationConcern[];
}

const NOTHING: DatabaseLocationAdvice = { concerns: [] };

/* ==================================================================== */
/* Flüchtige Ordner                                                     */
/* ==================================================================== */

/**
 * Ordnernamen, deren Inhalt planmäßig gelöscht wird.
 *
 * Ganze Segmente, nicht Teilstücke: `Temp` fängt den Ordner, `Template` nicht.
 * `cache` steht bewusst nicht dabei — `AppData\Local` heißt bei manchen
 * Einrichtungen im Pfad so, und ein Fehlalarm an dieser Stelle entwertet die
 * drei Befunde daneben.
 */
const VOLATILE_FOLDER_NAMES: ReadonlySet<string> = new Set(["temp", "tmp"]);

/* ==================================================================== */
/* Die Auskunft                                                         */
/* ==================================================================== */

/**
 * Beurteilt den vom Dienst gemeldeten Ablageort.
 *
 * Ein leerer Pfad ergibt keinen Befund: „kein Pfad" ist der Bestand im
 * Arbeitsspeicher (`databasePath: null`), und der hat in der Ansicht seinen
 * eigenen Satz — dort ist er der Normalfall des Prüfbetriebs und kein Fund.
 */
export function adviseDatabaseLocation(rawPath: string): DatabaseLocationAdvice {
  const path = rawPath.trim();
  if (path.length === 0) return NOTHING;

  const shape = shapeOf(path);
  const found: DatabaseLocationConcern[] = [];

  /* Synchronisierungsordner — R-13, B-5.3 Punkt 3. Der schwerste Fund. */
  const syncEvidence = syncFolderEvidence(shape);
  if (syncEvidence !== null) {
    found.push({
      kind: "sync_folder",
      impacts: ["confidentiality", "durability"],
      title: "Der Bestand liegt in einem Synchronisierungsordner",
      body: "In dieser Datei stehen alle Todos, Buchungen und Vermerke im Klartext. Der Client des Anbieters lädt sie fortlaufend hoch — auch während Takt läuft, ohne Rückfrage und ohne dass es jemand sieht. Damit liegen die Daten Ihrer Kunden bei einem Anbieter. Dazu kommt ein zweites Problem: Eine Datenbankdatei, die mitten im Schreiben kopiert wird, kommt dort regelmäßig unbrauchbar an, und wenn zwei Rechner denselben Ordner synchronisieren, beschädigen sie einander die Datei.",
      remedy: "Takt kann den Ablageort nicht verlegen — er folgt dem Anwendungsdatenverzeichnis dieses Benutzers. Nehmen Sie diesen Ordner im Synchronisierungsclient von der Übertragung aus.",
      evidence: syncEvidence,
    });
  }

  /* Netzfreigabe — R-13, B-5.2 Punkt 2. */
  const networkEvidence = networkShareEvidence(shape);
  if (networkEvidence !== null) {
    found.push({
      kind: "network_share",
      impacts: ["confidentiality", "durability"],
      title: "Der Bestand liegt nicht auf diesem Rechner",
      body: "Der Pfad zeigt auf eine Netzfreigabe. Eine SQLite-Datei über das Netz zu führen gilt als unsicher: Die Sperren, mit denen sie sich gegen gleichzeitige Zugriffe schützt, wirken über viele Netzdateisysteme nicht zuverlässig, und ein Verbindungsabriss mitten im Schreiben kann sie beschädigen. Außerdem liegen die Kundendaten damit auf einem anderen Rechner — bei einem Produkt, das laut E-001 vollständig lokal arbeitet.",
      remedy: "Das Anwendungsdatenverzeichnis gehört auf die lokale Festplatte. Wenn es hier im Netz liegt, ist das eine Einstellung des Windows-Profils; das entscheidet die Verwaltung des Rechners, nicht Takt.",
      evidence: networkEvidence,
    });
  }

  /* Servergespeichertes Profil — R-13, E-018. */
  const roamingEvidence = roamingProfileEvidence(shape);
  if (roamingEvidence !== null) {
    found.push({
      kind: "roaming_profile",
      impacts: ["confidentiality", "durability"],
      title: "Der Bestand liegt im servergespeicherten Profil",
      body: "Der Ordner AppData\\Roaming wird beim An- und Abmelden auf einen Dateiserver kopiert, wenn das Konto ein servergespeichertes Profil hat. Der ganze Bestand wandert dann mit, Kundennotizen inbegriffen — und kopiert wird auch eine Datei, die gerade noch geöffnet war. Genau deshalb legt Takt seine Daten unter AppData\\Local ab (E-018).",
      remedy: "Steht hier trotzdem Roaming, ist dieses Windows-Profil anders eingerichtet. Auch das entscheidet die Verwaltung des Rechners.",
      evidence: roamingEvidence,
    });
  }

  /* Flüchtiger Ordner — der Bestand kann beim nächsten Start fehlen. */
  const volatileEvidence = shape.rest.find((part) => VOLATILE_FOLDER_NAMES.has(fold(part)));
  if (volatileEvidence !== undefined) {
    found.push({
      kind: "temporary_folder",
      impacts: ["durability"],
      title: "Der Bestand liegt in einem Ordner für flüchtige Dateien",
      body: "Ordner mit dem Namen Temp oder tmp werden von der Windows-Speicheroptimierung, von Aufräumwerkzeugen und je nach System beim Neustart geleert — ohne Rückfrage. Was Sie eintragen, kann beim nächsten Start fehlen. Im Prüf- und Entwicklungsbetrieb ist das gewollt; auf einem Arbeitsplatz ist es ein Fehler in der Einrichtung.",
      remedy: "Starten Sie Takt über die installierte Verknüpfung. Ein abweichendes Anwendungsdatenverzeichnis kommt aus der Umgebung, in der die Anwendung gestartet wurde, und nicht aus den Einstellungen.",
      evidence: volatileEvidence,
    });
  }

  if (found.length === 0) return NOTHING;
  return { concerns: found };
}
