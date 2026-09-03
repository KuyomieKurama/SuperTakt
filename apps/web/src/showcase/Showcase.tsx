import { Icon, type IconName } from "../components/Icon";
import { cx } from "../lib/cx";
import { THEME_LABEL } from "../lib/labels";
import { useDensity, useThemePreference, type Density, type ThemePreference } from "../lib/theme";
import { BoardSection } from "./BoardSection";
import { ControlsSection } from "./ControlsSection";
import { DataSection } from "./DataSection";
import { ExportDirectorySection } from "./ExportDirectorySection";
import { WorkstationSection } from "./WorkstationSection";
import { ExportPreviewSection } from "./ExportPreviewSection";
import { ExportStatusSection } from "./ExportStatusSection";
import { FoundationsSection } from "./FoundationsSection";
import { IntroSection } from "./IntroSection";
import { InventorySection } from "./InventorySection";
import { NotesSection } from "./NotesSection";
import { RuleSection } from "./RuleSection";
import { ShellStateSection } from "./ShellStateSection";
import { TagsSection } from "./TagsSection";
import { TimeSection } from "./TimeSection";

interface NavEntry {
  readonly id: string;
  readonly label: string;
  /** Hervorgehoben: Stelle, an der eine Entscheidung des Auftraggebers fehlt. */
  readonly decision?: boolean;
}

const NAV: readonly NavEntry[] = [
  { id: "einleitung", label: "Was Sie hier sehen" },
  { id: "grundlagen", label: "1 — Farbe, Schrift, Abstand" },
  { id: "exportstatus", label: "2 — Exportstatus" },
  { id: "zur-entscheidung", label: "↳ Entschieden: Erneut offen", decision: true },
  { id: "nicht-abgerechnet", label: "↳ Nicht abgerechnet (E-050)", decision: true },
  { id: "tabelle", label: "3 — Suche, Filter, Tabelle" },
  { id: "export", label: "4 — Exportvorschau" },
  { id: "exportprotokoll", label: "↳ Exportprotokoll (R-10)" },
  { id: "exportordner", label: "↳ Exportordner (S-04)" },
  { id: "arbeitsplatz", label: "↳ Arbeitsplatz (C-20)" },
  { id: "board", label: "5 — Kanban-Board" },
  { id: "regel", label: "↳ Die Regel einer Spalte (T-079)" },
  { id: "zeit", label: "6 — Zeiterfassung" },
  { id: "notizen", label: "7 — Vermerk und Leistung" },
  { id: "tags", label: "8 — Tags und Ordner" },
  { id: "bausteine", label: "9 — Bedienelemente und Zustände" },
  { id: "huelle", label: "10 — Wenn Takt nicht startet" },
  { id: "inventar", label: "11 — Komponenteninventar" },
];

/**
 * Die Beschriftungen kommen aus `lib/labels.ts` und werden hier nicht neu
 * getippt: `app_setting.theme` fuehrt `system`, `light` und `dark`, auf dem
 * Bildschirm stehen Systemvorgabe, Hell und Dunkel (E-041).
 */
const THEMES: ReadonlyArray<{
  readonly value: ThemePreference;
  readonly icon: IconName;
}> = [
  { value: "light", icon: "sun" },
  { value: "dark", icon: "moon" },
  { value: "system", icon: "monitor" },
];

const DENSITIES: ReadonlyArray<{ readonly value: Density; readonly label: string }> = [
  { value: "comfortable", label: "Normal" },
  { value: "compact", label: "Kompakt" },
];

export function Showcase() {
  const [theme, setTheme] = useThemePreference("light");
  const [density, setDensity] = useDensity("comfortable");

  return (
    <div className="showcase">
      <a className="skip-link" href="#inhalt">
        Zum Inhalt springen
      </a>

      <header className="appbar">
        <div className="appbar__brand">
          <span className="appbar__mark">Takt</span>
          <span className="appbar__sub">
            Designsystem — abgenommen, Stand T-015
          </span>
        </div>

        <div className="appbar__controls">
          <div className="segmented" role="group" aria-label="Darstellung">
            {THEMES.map((option) => (
              <button
                key={option.value}
                type="button"
                className="segmented__option"
                aria-pressed={theme === option.value}
                onClick={() => setTheme(option.value)}
              >
                <Icon name={option.icon} size={13} />
                {THEME_LABEL[option.value]}
              </button>
            ))}
          </div>

          <div className="segmented" role="group" aria-label="Zeilendichte">
            {DENSITIES.map((option) => (
              <button
                key={option.value}
                type="button"
                className="segmented__option"
                aria-pressed={density === option.value}
                onClick={() => setDensity(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="layout">
        <nav className="sidenav" aria-label="Abschnitte des Designsystems">
          <p className="overline sidenav__title">Abschnitte</p>
          {NAV.map((item) => (
            <a
              className={cx(
                "sidenav__link",
                item.decision === true && "sidenav__link--decision",
              )}
              key={item.id}
              href={`#${item.id}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <main className="content" id="inhalt" tabIndex={-1}>
          <IntroSection />
          <FoundationsSection />
          <ExportStatusSection />
          <DataSection />
          <ExportPreviewSection />
          <ExportDirectorySection />
          <WorkstationSection />
          <BoardSection />
          <RuleSection />
          <TimeSection />
          <NotesSection />
          <TagsSection />
          <ControlsSection />
          <ShellStateSection />
          <InventorySection />
        </main>
      </div>
    </div>
  );
}
