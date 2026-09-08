import type { SVGProps } from "react";

/**
 * Symbolsatz von Takt.
 *
 * Eine einzige Familie, einheitlich 24x24 Zeichenflaeche, Strichstaerke 1.75,
 * runde Enden. Keine Emoji, keine Rasterbilder, keine Fremdbibliothek.
 * Symbole sind grundsaetzlich dekorativ und per `aria-hidden` ausgeblendet;
 * die Bedeutung traegt immer der Text daneben oder ein `aria-label` am Knopf.
 */
export type IconName =
  | "alert-circle"
  | "alert-triangle"
  | "arrow-down"
  | "arrow-up"
  | "arrow-up-right"
  | "calendar"
  | "calendar-clock"
  | "check"
  | "copy"
  | "check-circle"
  | "chevron-down"
  | "chevron-right"
  | "circle"
  | "clock"
  | "download"
  | "drag"
  | "filter"
  | "folder"
  | "folder-open"
  | "image"
  | "info"
  | "inbox"
  | "link"
  | "lock"
  | "monitor"
  | "moon"
  | "more-horizontal"
  | "paperclip"
  | "pause"
  | "pencil"
  | "play"
  | "plus"
  | "rotate-ccw"
  | "search"
  | "shield"
  | "slash-circle"
  | "square"
  | "sun"
  | "tag"
  | "trash"
  | "x";

/** Pfaddaten je Symbol, gezeichnet auf einem 24x24-Raster. */
const PATHS: Record<IconName, readonly string[]> = {
  "alert-circle": ["M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z", "M12 8v5", "M12 16.2h.01"],
  "alert-triangle": ["M12 4.2 2.8 19.2h18.4L12 4.2Z", "M12 10v4", "M12 16.9h.01"],
  "arrow-down": ["M12 5v14", "M6.5 13.5 12 19l5.5-5.5"],
  "arrow-up": ["M12 19V5", "M6.5 10.5 12 5l5.5 5.5"],
  "arrow-up-right": ["M7.5 16.5 16.5 7.5", "M9.5 7.5h7v7"],
  /* Kalenderblatt: die Frist ohne Zustandswort ("spaeter faellig", A-19.5).
     Bewusst ruhig — nur zwei der drei Zustaende sind laut. */
  calendar: [
    "M4.5 6.5h15v13h-15v-13Z",
    "M4.5 10.5h15",
    "M8.5 4.2v3",
    "M15.5 4.2v3",
  ],
  /* Kalenderblatt mit Zeiger: "heute faellig". Dasselbe Blatt, damit die drei
     Zustaende als eine Familie lesbar bleiben, plus die Uhr aus `clock`. */
  "calendar-clock": [
    "M19.5 11.2v-4.7h-15v13h6.4",
    "M4.5 10.5h15",
    "M8.5 4.2v3",
    "M15.5 4.2v3",
    "M17 12.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Z",
    "M17 14.9v2.2l1.6 1",
  ],
  check: ["M4.5 12.5 9.5 17.5 19.5 6.5"],
  copy: [
    "M9 9.2a1.7 1.7 0 0 1 1.7-1.7h7.6A1.7 1.7 0 0 1 20 9.2v7.6a1.7 1.7 0 0 1-1.7 1.7h-7.6A1.7 1.7 0 0 1 9 16.8V9.2Z",
    "M15 7.5V6.2a1.7 1.7 0 0 0-1.7-1.7H5.7A1.7 1.7 0 0 0 4 6.2v7.6a1.7 1.7 0 0 0 1.7 1.7H7",
  ],
  "check-circle": ["M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z", "M8 12.2l2.8 2.8L16.2 9.6"],
  "chevron-down": ["M6.5 9.5 12 15l5.5-5.5"],
  "chevron-right": ["M9.5 6.5 15 12l-5.5 5.5"],
  circle: ["M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z"],
  clock: ["M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z", "M12 7.2v5.1l3.4 2"],
  download: ["M12 4v11", "M7.5 10.5 12 15l4.5-4.5", "M4.5 19.5h15"],
  drag: ["M9 6h.01", "M9 12h.01", "M9 18h.01", "M15 6h.01", "M15 12h.01", "M15 18h.01"],
  filter: ["M3.5 5.5h17l-6.6 7.7v5.4l-3.8 1.9v-7.3L3.5 5.5Z"],
  folder: ["M3.5 6.8a1.8 1.8 0 0 1 1.8-1.8h3.4l2 2.4h7a1.8 1.8 0 0 1 1.8 1.8v8a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8V6.8Z"],
  "folder-open": [
    "M3.5 6.8a1.8 1.8 0 0 1 1.8-1.8h3.4l2 2.4h7a1.8 1.8 0 0 1 1.8 1.8v1.3",
    "M3.5 10.5h17.2l-2 7.2a1.6 1.6 0 0 1-1.5 1.1H5.3a1.8 1.8 0 0 1-1.8-1.8v-6.5Z",
  ],
  inbox: [
    "M3.5 12.5h4l1.6 3h5.8l1.6-3h4",
    "M6.2 4.6h11.6l2.7 7.9v5a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8v-5l2.7-7.9Z",
  ],
  /* Bild: Rahmen, Sonne, Bergzug — der Bildanhang (A-19.13). */
  image: [
    "M4 5.5h16v13H4v-13Z",
    "M8.4 10.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z",
    "M4 15.4l4.6-4.1 4.2 3.7 3-2.6L20 15.2",
  ],
  info: ["M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z", "M12 11v5", "M12 7.9h.01"],
  /* Zwei Kettenglieder: der Verweis (A-19.9). Nicht "Link" — das Wort steht
     auf dem Bildschirm nirgends, das Zeichen dafuer schon. */
  link: [
    "M10.2 13.8a3.4 3.4 0 0 0 5 .3l2.6-2.6a3.4 3.4 0 0 0-4.8-4.8l-1.5 1.5",
    "M13.8 10.2a3.4 3.4 0 0 0-5-.3l-2.6 2.6a3.4 3.4 0 0 0 4.8 4.8l1.5-1.5",
  ],
  lock: ["M6.2 10.6h11.6v8.2H6.2v-8.2Z", "M8.6 10.6V8.2a3.4 3.4 0 0 1 6.8 0v2.4"],
  monitor: ["M3.5 5h17v10h-17V5Z", "M9 19h6", "M12 15v4"],
  moon: ["M20 13.4A8.2 8.2 0 0 1 10.6 4a8.4 8.4 0 1 0 9.4 9.4Z"],
  "more-horizontal": ["M6 12h.01", "M12 12h.01", "M18 12h.01"],
  /* Bueroklammer: der Anhang als Sammelsache (A-19.8). */
  paperclip: [
    "M17.6 10.4 11 17a3.7 3.7 0 0 1-5.2-5.2l7.3-7.3a2.5 2.5 0 0 1 3.5 3.5l-7.3 7.3a1.2 1.2 0 0 1-1.8-1.8l6.6-6.6",
  ],
  pause: ["M9.2 5.5v13", "M14.8 5.5v13"],
  pencil: ["M4.5 19.5h4l10-10a2.1 2.1 0 0 0-3-3l-10 10v3Z", "M14.5 6.5l3 3"],
  play: ["M7.5 5.2 18.6 12 7.5 18.8V5.2Z"],
  plus: ["M12 5.5v13", "M5.5 12h13"],
  "rotate-ccw": ["M4.2 9.6h5V4.7", "M4.6 9.6a8 8 0 1 1-1 5.4"],
  search: ["M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z", "M15.8 15.8 20 20"],
  shield: ["M12 3.6 4.8 6.3v5.2c0 4 3 7.5 7.2 8.9 4.2-1.4 7.2-4.9 7.2-8.9V6.3L12 3.6Z"],
  /* Durchgestrichener Kreis: abgeschlossen, aber nicht abgerechnet (E-050).
     Der Schraegstrich endet auf dem Kreisbogen — Radius 8.5 um (12,12). */
  "slash-circle": ["M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17Z", "M6 6 18 18"],
  square: ["M6.5 6.5h11v11h-11v-11Z"],
  sun: [
    "M12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8Z",
    "M12 2.6v2",
    "M12 19.4v2",
    "M2.6 12h2",
    "M19.4 12h2",
    "M5.4 5.4 6.8 6.8",
    "M17.2 17.2l1.4 1.4",
    "M18.6 5.4 17.2 6.8",
    "M6.8 17.2 5.4 18.6",
  ],
  tag: ["M4.5 4.5h6.2l8.8 8.8-6.2 6.2-8.8-8.8V4.5Z", "M8.2 8.2h.01"],
  trash: ["M4.5 6.8h15", "M9.5 6.8V4.6h5v2.2", "M6.6 6.8l1 12.6h8.8l1-12.6", "M10.4 10.4v5.6", "M13.6 10.4v5.6"],
  x: ["M6 6l12 12", "M18 6 6 18"],
};

/** Symbole, die als Flaeche statt als Kontur gezeichnet werden. */
const FILLED: ReadonlySet<IconName> = new Set<IconName>(["play", "square"]);

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  readonly name: IconName;
  /** Kantenlaenge in Pixeln. Vorgabe 16, passend zu --icon-md. */
  readonly size?: number;
  /**
   * Zugaenglicher Name. Nur setzen, wenn das Symbol allein steht und
   * Bedeutung traegt. Sonst bleibt es fuer Hilfsmittel unsichtbar.
   */
  readonly title?: string;
}

export function Icon({ name, size = 16, title, ...rest }: IconProps) {
  const paths = PATHS[name];
  const filled = FILLED.has(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title === undefined ? undefined : "img"}
      aria-hidden={title === undefined ? true : undefined}
      aria-label={title}
      focusable="false"
      {...rest}
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
