import { cx } from "../lib/cx";
import { Icon, type IconName } from "./Icon";

/**
 * Exportstatus einer Zeitbuchung — A-6.5 bis A-6.7, A-6.9, A-8.6, E-012,
 * E-032, E-047, E-050, R-10.
 *
 * **Der Status hat genau zwei Werte.** A-6.9 verlangt das, E-032 haelt es
 * ausdruecklich fest: `open` und `exported`. Eine zurueckgesetzte Buchung
 * (E-012) ist danach wieder `open` — nicht "erneut offen". Eine nach E-047
 * ausgebuchte Buchung traegt `exported` — und heisst trotzdem nicht
 * "exportiert". Beide Unterscheidungen sind **Anzeige**, kein dritter und kein
 * vierter Statuswert, und beide haengen an einem eigenen Merkmal:
 * `exportCount`, der Zahl der Exportlaeufe, in denen die Buchung schon war.
 *
 * Warum das hier so streng getrennt ist: Wer "erneut offen" fuer einen dritten
 * Statuswert haelt und einen Filter darauf baut, laesst eine zurueckgesetzte
 * Buchung aus dem naechsten Export herausfallen — und dann ist R-10 auf dem
 * Kopf. Deshalb tragen die Begriffe verschiedene Typen:
 *
 *   `ExportStatus`        — zwei Werte. Filter, Abfragen, Exportauswahl.
 *   `ExportDisplayState`  — vier Werte. Nur Darstellung, nie gespeichert,
 *                           nie ein Filterkriterium.
 *
 * ## Der vierte Zustand: "Nicht abgerechnet" (E-050)
 *
 * E-047 hat den Vorgang "von Hand als exportiert markieren" abgeschafft und
 * durch **"nicht abrechnen"** ersetzt: Die Buchung wird als abgeschlossen
 * gefuehrt, ohne dass je eine Datei entstand. Der Statuswert dafuer ist
 * `exported` — fachlich richtig, denn mehr Werte gibt es nicht. Stuende danach
 * "Exportiert" in der Liste, hiesse der Vorgang in der Anzeige genau das, was
 * er bewusst nirgends heisst, und die Unterscheidung lebte nur noch im
 * Protokoll, wo sie niemand sieht.
 *
 * Der Zustand ist **ableitbar** und wird nirgends gespeichert: `exported` bei
 * einem Exportzaehler von 0 gibt es nur nach E-047. `markNotBilled` laesst
 * `exportCount` ausdruecklich unveraendert (die Buchung war in keinem Lauf),
 * und ein Exportlauf erhoeht ihn immer.
 *
 * Die vier Anzeigezustaende unterscheiden sich in **sechs** voneinander
 * unabhaengigen Merkmalen, damit die Unterscheidung nicht an der Farbe haengt
 * und auch bei Farbfehlsichtigkeit und in Graustufen traegt — die **Schraffur**
 * in der Spalte Fuellung zaehlt dabei nicht mit, sie ist eine Verstaerkung und
 * kein Traeger (Rechenweg bei `.badge--reopened` in `styles/components.css`):
 *
 *   |                    | Fuellung           | Kontur      | Punkt    | Symbol        | Beschriftung      | Zeilenrand |
 *   |--------------------|--------------------|-------------|----------|---------------|-------------------|------------|
 *   | offen              | Kontur, hell       | durchgezogen| Ring     | Kreis         | "Offen"           | bernstein  |
 *   | exportiert         | voll gefuellt      | durchgezogen| Scheibe  | Haken         | "Exportiert"      | gruen      |
 *   | erneut offen       | Kontur + Schraffur | durchgezogen| Raute    | Pfeil zurueck | "Erneut offen"    | rose       |
 *   | nicht abgerechnet  | Kontur, gedaempft  | gestrichelt | Balken   | Kreis mit Strich | "Nicht abgerechnet" | neutral |
 *
 * Der Baustein rechnet nichts und formatiert nichts. Datum und Dauer kommen
 * fertig formatiert von aussen.
 */

/**
 * Fachlicher Exportstatus. Genau zwei Werte, so wie `time_entry.export_status`
 * in der Datenbank und `ExportStatus` in `packages/domain` (A-6.9, E-032).
 */
export type ExportStatus = "open" | "exported";

/**
 * Anzeigezustand. Wird aus Status und `exportCount` abgeleitet und existiert
 * nur auf dem Bildschirm. **Kein Filterkriterium** — dafuer gibt es
 * `ExportStatus` — und niemals ein Merkmal, das eine Buchung aus dem Export
 * haelt.
 */
export type ExportDisplayState = ExportStatus | "reopened" | "not_billed";

/**
 * Leitet den Anzeigezustand ab. Die einzige Stelle, an der aus zwei Werten
 * vier Darstellungen werden.
 *
 * @param status      Fachlicher Status der Buchung.
 * @param exportCount Wie oft die Buchung schon in einem Exportlauf war
 *                    (`time_entry.export_count`). Kommt aus der Fachlogik.
 */
export function exportDisplayState(
  status: ExportStatus,
  exportCount: number,
): ExportDisplayState {
  if (status === "exported") return exportCount > 0 ? "exported" : "not_billed";
  return exportCount > 0 ? "reopened" : "open";
}

/**
 * Fuehrt den Anzeigezustand auf den fachlichen Status zurueck. Wer damit
 * filtert, filtert richtig: "Erneut offen" faellt auf `open` zusammen,
 * "Nicht abgerechnet" auf `exported`.
 */
export function exportStatusOf(state: ExportDisplayState): ExportStatus {
  return state === "exported" || state === "not_billed" ? "exported" : "open";
}

/** Beschriftung der beiden fachlichen Werte — fuer Filter und Auswahllisten. */
export const EXPORT_STATUS_LABEL: Readonly<Record<ExportStatus, string>> = {
  open: "Offen",
  exported: "Exportiert",
};

interface StateDefinition {
  readonly label: string;
  /** Langform fuer Hilfsmittel und Erklaertexte. */
  readonly description: string;
  readonly icon: IconName;
  /**
   * Anhaengsel fuer CSS-Klassen (`badge--not-billed`). Ausgeschrieben und
   * nicht aus dem Schluessel gerechnet: Der Schluessel folgt dem Ereignisnamen
   * des Protokolls (`not_billed`), die Klasse der Schreibweise des
   * Stylesheets. Eine stille Umwandlung zwischen beiden waere eine Regel, die
   * man beim Lesen des Markups nicht sieht.
   */
  readonly slug: string;
  /** Auf welchen der zwei fachlichen Werte dieser Anzeigezustand faellt. */
  readonly status: ExportStatus;
}

export const EXPORT_STATE: Readonly<Record<ExportDisplayState, StateDefinition>> = {
  open: {
    label: "Offen",
    description: "Noch nicht an das Abrechnungstool uebertragen.",
    icon: "circle",
    slug: "open",
    status: "open",
  },
  exported: {
    label: "Exportiert",
    description:
      "Bereits an das Abrechnungstool uebertragen. Gesperrt, solange der Exportstatus nicht zurueckgesetzt wird.",
    icon: "check-circle",
    slug: "exported",
    status: "exported",
  },
  reopened: {
    label: "Erneut offen",
    description:
      "Der Exportstatus wurde zurueckgesetzt. Fachlich ist die Buchung offen; sie war aber schon einmal im Export und geht beim naechsten Export erneut in die Abrechnung.",
    icon: "rotate-ccw",
    slug: "reopened",
    status: "open",
  },
  not_billed: {
    label: "Nicht abgerechnet",
    description:
      "Von Hand ausgebucht: Diese Zeit wird nicht abgerechnet. Eine Exportdatei hat sie nie enthalten. Fachlich ist die Buchung abgeschlossen und damit gesperrt; rueckgaengig geht das ueber das Zuruecksetzen des Exportstatus.",
    icon: "slash-circle",
    slug: "not-billed",
    status: "exported",
  },
};

export type BadgeSize = "sm" | "md";

export interface ExportStatusBadgeProps {
  readonly state: ExportDisplayState;
  readonly size?: BadgeSize;
  /**
   * Zusatz hinter der Beschriftung, zum Beispiel das Exportdatum.
   * Muss bereits formatiert uebergeben werden.
   */
  readonly detail?: string;
  /** Blendet die Beschriftung optisch aus. Sie bleibt fuer Hilfsmittel erhalten. */
  readonly iconOnly?: boolean;
  readonly className?: string;
}

export function ExportStatusBadge({
  state,
  size = "md",
  detail,
  iconOnly = false,
  className,
}: ExportStatusBadgeProps) {
  const definition = EXPORT_STATE[state];
  return (
    <span
      className={cx(
        "badge",
        `badge--${definition.slug}`,
        `badge--${size}`,
        iconOnly && "badge--icon-only",
        className,
      )}
    >
      <Icon name={definition.icon} size={size === "sm" ? 12 : 14} />
      <span className={cx(iconOnly && "visually-hidden")}>
        <span className="visually-hidden">Exportstatus: </span>
        {definition.label}
        {detail !== undefined && !iconOnly ? (
          <span className="badge__detail">{detail}</span>
        ) : null}
      </span>
    </span>
  );
}

export interface ExportStatusMarkerProps {
  readonly state: ExportDisplayState;
  /**
   * Wenn `true`, traegt der Marker den Zustandsnamen fuer Hilfsmittel.
   * Auf `false` setzen, wenn direkt daneben ohnehin ein Etikett steht.
   */
  readonly labelled?: boolean;
  readonly className?: string;
}

/**
 * Kleiner Zustandspunkt fuer Stellen ohne Platz fuer ein Etikett:
 * Kanban-Karte, Listenzeile, Baumknoten. Ring, Scheibe, Raute und Balken sind
 * schon bei 10 Pixeln auseinanderzuhalten.
 */
export function ExportStatusMarker({
  state,
  labelled = true,
  className,
}: ExportStatusMarkerProps) {
  const definition = EXPORT_STATE[state];
  return (
    <span
      className={cx("status-marker", `status-marker--${definition.slug}`, className)}
      aria-hidden={!labelled}
    >
      {labelled ? (
        <span className="visually-hidden">Exportstatus: {definition.label}</span>
      ) : null}
    </span>
  );
}
