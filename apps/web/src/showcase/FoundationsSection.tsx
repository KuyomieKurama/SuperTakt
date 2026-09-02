import { Card } from "../components/Primitives";
import { Section, SubHeading } from "./Section";

interface SwatchDefinition {
  readonly token: string;
  readonly note: string;
  /** Token, das auf der Flaeche als Text sitzt. Nur fuer Textpaare. */
  readonly on?: string;
}

const SURFACE_SWATCHES: readonly SwatchDefinition[] = [
  { token: "--bg-canvas", note: "Anwendungshintergrund" },
  { token: "--bg-surface", note: "Karte, Panel, Dialog" },
  { token: "--bg-surface-alt", note: "Zebrastreifen" },
  { token: "--bg-subtle", note: "Tabellenkopf, Spalte" },
  { token: "--bg-inset", note: "Vertiefung" },
  { token: "--bg-hover", note: "Zeiger" },
  { token: "--bg-active", note: "gedrückt" },
  { token: "--bg-selected", note: "ausgewählt" },
];

const TEXT_SWATCHES: readonly SwatchDefinition[] = [
  { token: "--text-primary", note: "15,76:1 auf Karte", on: "--bg-surface" },
  { token: "--text-secondary", note: "8,39:1 auf Karte", on: "--bg-surface" },
  { token: "--text-muted", note: "5,64:1 auf Karte", on: "--bg-surface" },
  { token: "--text-disabled", note: "3,10:1 — nur deaktiviert", on: "--bg-disabled" },
  { token: "--text-link", note: "8,16:1 auf Karte", on: "--bg-surface" },
];

const ACTION_SWATCHES: readonly SwatchDefinition[] = [
  { token: "--accent-bg", note: "Primäraktion, 5,98:1 mit Weiß" },
  { token: "--danger-bg", note: "destruktiv, 6,75:1 mit Weiß" },
  { token: "--status-open-marker", note: "Marker Offen" },
  { token: "--status-exported-marker", note: "Marker Exportiert" },
  { token: "--status-reopened-marker", note: "Marker Erneut offen" },
  /* „Nicht abgerechnet" bekommt bewusst keine eigene Signalfarbe (E-050):
     Hier ist kein Geld geflossen. Der Zustand trägt neutrales Grau und
     unterscheidet sich über gestrichelte Kontur, Balken statt Punkt,
     durchgestrichenen Kreis und Wortlaut. */
  { token: "--border-strong", note: "Marker Nicht abgerechnet — neutral, kein Signal" },
  { token: "--timer-running-pulse", note: "laufender Timer" },
];

function Swatches({ items }: { readonly items: readonly SwatchDefinition[] }) {
  return (
    <div className="swatches">
      {items.map((item) => (
        <div className="swatch" key={item.token}>
          <div
            className="swatch__chip"
            style={
              item.on === undefined
                ? { backgroundColor: `var(${item.token})` }
                : {
                    backgroundColor: `var(${item.on})`,
                    color: `var(${item.token})`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                  }
            }
          >
            {item.on === undefined ? null : "Beispieltext"}
          </div>
          <div className="swatch__meta">
            <p className="swatch__name">{item.token}</p>
            <p className="swatch__note">{item.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface TypeRow {
  readonly token: string;
  readonly px: string;
  readonly leading: string;
  readonly usage: string;
  readonly weight: number;
}

const TYPE_ROWS: readonly TypeRow[] = [
  { token: "--text-4xl", px: "38px", leading: "1,2", usage: "große Timer-Anzeige", weight: 600 },
  { token: "--text-3xl", px: "30px", leading: "1,2", usage: "Kennzahl auf dem Dashboard", weight: 600 },
  { token: "--text-2xl", px: "24px", leading: "1,2", usage: "Seitentitel", weight: 600 },
  { token: "--text-xl", px: "20px", leading: "1,2", usage: "Panelüberschrift", weight: 600 },
  { token: "--text-lg", px: "18px", leading: "1,35", usage: "Kartenüberschrift", weight: 600 },
  { token: "--text-md", px: "16px", leading: "1,5", usage: "Fließtext, Dialogtext", weight: 400 },
  { token: "--text-base", px: "14px", leading: "1,5", usage: "Standardtext der Oberfläche", weight: 400 },
  { token: "--text-sm", px: "13px", leading: "1,35", usage: "Tabellenzelle, Chip", weight: 400 },
  { token: "--text-xs", px: "12px", leading: "1,35", usage: "Hilfetext, Zeitstempel", weight: 400 },
  { token: "--text-2xs", px: "11px", leading: "1,4", usage: "Versalien-Etikett mit Sperrung", weight: 600 },
];

const SPACE_ROWS: readonly { readonly token: string; readonly px: number }[] = [
  { token: "--space-1", px: 4 },
  { token: "--space-2", px: 8 },
  { token: "--space-3", px: 12 },
  { token: "--space-4", px: 16 },
  { token: "--space-5", px: 20 },
  { token: "--space-6", px: 24 },
  { token: "--space-8", px: 32 },
  { token: "--space-10", px: 40 },
  { token: "--space-12", px: 48 },
  { token: "--space-16", px: 64 },
];

const RADII: readonly { readonly token: string; readonly usage: string }[] = [
  { token: "--radius-sm", usage: "Chip, Etikett" },
  { token: "--radius-md", usage: "Knopf, Eingabefeld" },
  { token: "--radius-lg", usage: "Karte, Kanban-Karte" },
  { token: "--radius-xl", usage: "Panel, Dialog" },
  { token: "--radius-pill", usage: "Statusetikett" },
];

const SHADOWS: readonly { readonly token: string; readonly usage: string }[] = [
  { token: "--shadow-xs", usage: "Karte in Ruhe" },
  { token: "--shadow-sm", usage: "Karte unter dem Zeiger" },
  { token: "--shadow-md", usage: "Auswahlliste" },
  { token: "--shadow-lg", usage: "Dialog, Kontextmenü" },
  { token: "--shadow-drag", usage: "Karte am Zeiger" },
];

export function FoundationsSection() {
  return (
    <Section
      id="grundlagen"
      title="1 — Farbe, Schrift, Abstand"
      lead="Alle Werte liegen als CSS-Variablen in zwei Ebenen vor: Primitive Rampen und darüber eine semantische Ebene, die allein in den Bausteinen benutzt wird. Der dunkle Modus definiert nur die semantische Ebene neu."
      refs={["Abschnitt 13", "Abschnitt 15"]}
    >
      <Card
        title="Flächen"
        description="Vier Stufen von hinten nach vorn: Anwendungshintergrund, Karte, gedämpfte Fläche, Vertiefung. Mehr Stufen braucht die Anwendung nicht."
      >
        <Swatches items={SURFACE_SWATCHES} />
      </Card>

      <Card
        title="Text"
        description="Die Angabe hinter jedem Wert ist der gemessene Kontrast im hellen Modus, nicht geschätzt. Nachmessen mit pnpm contrast."
      >
        <Swatches items={TEXT_SWATCHES} />
      </Card>

      <Card
        title="Aktion und Signal"
        description="Genau eine Markenfarbe. Die übrigen Farben sind Signale und bleiben dem Exportstatus, dem Timer und der Gefahr vorbehalten."
      >
        <Swatches items={ACTION_SWATCHES} />
      </Card>

      <Card
        title="Schriftskala"
        description="Grundgröße 14px. Takt ist eine Desktop-Anwendung mit vielen Tabellen; 16px als Grundgröße würde die Zeilendichte halbieren. Die Wurzelgröße bleibt bei 16px, damit Browser-Zoom und rem-Rechnung stimmen. Systemschriftstapel ohne Netzabruf, weil Takt vollständig lokal läuft."
      >
        <div className="type-scale">
          {TYPE_ROWS.map((row) => (
            <div className="type-row" key={row.token}>
              <span className="type-row__meta">
                {row.token}
                <br />
                {row.px} / {row.leading}
              </span>
              <span
                style={{
                  fontSize: `var(${row.token})`,
                  fontWeight: row.weight,
                  lineHeight: row.leading.replace(",", "."),
                }}
              >
                {row.usage}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid--2">
        <Card
          title="Abstandsraster"
          description="Basis 4px. Jeder Abstand in der Anwendung ist ein Vielfaches davon; Zwischenwerte gibt es nicht."
        >
          <div className="space-scale">
            {SPACE_ROWS.map((row) => (
              <div className="space-row" key={row.token}>
                <code>{row.token}</code>
                <span className="tabular">{row.px} px</span>
                <span className="space-bar" style={{ width: `var(${row.token})` }} />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Radien und Erhebung" description="Fünf Radien, fünf Schattenstufen. Nichts dazwischen.">
          <SubHeading>Radien</SubHeading>
          <div className="demo-row" style={{ marginBottom: "var(--space-6)" }}>
            {RADII.map((item) => (
              <span key={item.token} style={{ textAlign: "center" }}>
                <span
                  style={{
                    display: "block",
                    width: "3.5rem",
                    height: "3rem",
                    borderRadius: `var(${item.token})`,
                    backgroundColor: "var(--bg-inset)",
                    border: "1px solid var(--border-default)",
                  }}
                />
                <span className="swatch__note">{item.usage}</span>
              </span>
            ))}
          </div>
          <SubHeading>Erhebung</SubHeading>
          <div className="demo-row">
            {SHADOWS.map((item) => (
              <span key={item.token} style={{ textAlign: "center" }}>
                <span
                  style={{
                    display: "block",
                    width: "4.5rem",
                    height: "3rem",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "var(--bg-surface)",
                    boxShadow: `var(${item.token})`,
                    marginBottom: "var(--space-2)",
                  }}
                />
                <span className="swatch__note">{item.usage}</span>
              </span>
            ))}
          </div>
        </Card>
      </div>
    </Section>
  );
}
