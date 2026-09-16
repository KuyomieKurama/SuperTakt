import { TagAdministration } from "../tags/TagAdministration";
import { PoolAdministration } from "../tags/PoolAdministration";
import { PrioritySettings } from "./PrioritySettings";
import { THEME_PRESETS, themePreset } from "./themePresets";
import { useEffect } from "react";
import { listSecurityNotices, type SecurityNoticeKind } from "./api";
import { OutlookSetup } from "./OutlookSetup";
import { BillingUserFact, DatabaseLocationFact } from "./WorkstationFacts";
import { RadioRow } from "../../shared/ui/RadioRow";
import { Select } from "../../shared/ui/Select";
import { Icon, type IconName } from "../../shared/ui/Icon";
import { Button, Card } from "../../shared/ui/Primitives";
import { usePreferences } from "./PreferencesContext";
import { href } from "../../app/router";
import { useStructure } from "../../app/StructureContext";
import { useAsync } from "../../app/useAsync";
import { cx } from "../../lib/cx";
import { formatDateTime, plural } from "../../lib/format";
import type { Density } from "./theme";
import { AsyncBoundary } from "../../shared/ui/AsyncBoundary";
import { RunArea, ScreenFrame } from "../../shared/ui/ScreenBody";
import { ScreenHeader } from "../../shared/ui/ScreenHeader";
import { AddinSettings } from "./AddinSettings";
import { DataTransferSettings } from "./DataTransferSettings";
import { DefaultTagSettings } from "./DefaultTagSettings";
import { ExportSettings } from "./ExportSettings";
import { StatusSettings } from "./StatusSettings";
import { readIdleActivity } from "../../app/connection";

/**
 * Takt — S-09 (Einstellungen), S-10 (Standard-Tags) und S-13 (Add-in).
 *
 * Vorgeschichte: `docs/decisions/settings.md`.
 *
 * ## Zwei Auskünfte, die keine Einstellungen sind (C-20)
 *
 * `GET /settings` führt neben den Einstellungen den **Benutzernamen**, unter
 * dem abgerechnet wird, und den **Ablageort des Bestandes**. Beide sind hier
 * nicht änderbar; sie stehen auf einer eigenen Karte, damit man sie nachsehen
 * kann, bevor es darauf ankommt — der Name vor dem ersten Export (E-042), der
 * Pfad, bevor jemand nach der Datei mit den Kundendaten sucht (R-13). Der
 * Inhalt liegt in `features/settings/WorkstationFacts.tsx`.
 *
 * ## Bereiche statt einer langen Liste (T-057, Punkt 2)
 *
 * Jetzt gibt es sechs Bereiche mit einer Leiste links — der sechste, „Status“,
 * kam mit T-073 dazu, als die Statusstruktur ihr Bedienelement auf dem Board
 * verlor. Jeder Bereich hat **eine eigene Adresse** (`#/einstellungen?bereich=darstellung`), und deshalb ist die Leiste
 * eine `<nav>` mit Verweisen und keine ARIA-Registerkarte: Registerkarten sind
 * Bereiche derselben Seite ohne eigenen Verlauf. Hier gibt es Zurück, Neuladen
 * an Ort und Stelle und einen Verweis, den man weitergeben kann. Wo man ist,
 * sagt `aria-current="page"` — dieselbe Bauweise wie bei den drei Bereichen des
 * Exports (`ExportTabs` in `parts.tsx`).
 *
 * Ein unbekannter Wert in `bereich` führt nicht auf eine Fehlerseite, sondern
 * auf den ersten Bereich. Eine verschriebene Adresse ist kein Zustand, den man
 * dem Benutzer erklären müsste.
 */

const NOTICE_LABEL: Readonly<Record<SecurityNoticeKind, string>> = {
  auth_failure_burst: "Gehäufte Anmeldeversuche ohne gültigen Nachweis",
  token_in_url: "Ein Nachweis stand in einer Adresszeile und wurde abgewiesen",
  origin_rejected: "Eine Anfrage kam von einer fremden Herkunft",
  host_rejected: "Eine Anfrage nannte einen fremden Hostnamen",
  file_permissions_wide: "Eine Datei im Datenordner hat zu weite Rechte",
};

/* Die Bereiche                                                         */

const AREAS = ["darstellung", "timer", "export", "daten", "tags", "regeln", "status", "prioritaeten", "addin", "arbeitsplatz"] as const;

type SettingsArea = (typeof AREAS)[number];

interface AreaDescriptor {
  readonly area: SettingsArea;
  readonly label: string;
  readonly icon: IconName;
  /** Ein Satz, der sagt, was in diesem Bereich zu finden ist. */
  readonly hint: string;
}

/**
 * Die Reihenfolge auf dem Bildschirm.
 *
 * „Darstellung“ steht vorn, weil der Auftraggeber sie ausdrücklich als eigenen
 * Bereich verlangt hat und weil sie der einzige Bereich ist, der sofort wirkt.
 * Danach kommt, was Geld betrifft (Export), dann was jedes neue Todo betrifft
 * (Standard-Tags und Status), dann die Nachbarsysteme (Add-in), zuletzt die
 * Auskünfte über diesen Arbeitsplatz, die man nachsieht statt einzustellen.
 *
 * „Status“ steht neben den Standard-Tags, weil beide dieselbe Frage
 * beantworten: Was bekommt ein neu angelegtes Todo mit? Seit E-054 ist der
 * Status keine Kanban-Spalte mehr, sondern eine Stammgröße wie sie — deshalb
 * ist er aus dem Board hierher gezogen und nicht ersatzlos entfallen (A-5.4).
 */
/*
  Der Zusatz unterscheidet sechs Geschwister, er traegt keine Auskunft
  (T-181, ST-04; `docs/design/textabbau-gestalt.md` 1.3). Er ist unter
  60 rem ausgeblendet (`app.css`, `.settings-rail__hint`) — was in einem
  schmalen Fenster verschwindet, darf nirgends die einzige Fassung sein.
  Deshalb hoechstens fuenf Woerter, und die Verneinung zum Status steht
  nicht hier, sondern in der Karte (`StatusSettings`, Auflage Z-01).
*/
const AREA_LIST = [
  { area: "darstellung", label: "Darstellung", icon: "sun", hint: "Themes, Farbmodus und Zeilendichte" },
  { area: "timer", label: "Timer", icon: "clock", hint: "Leistung beim Stoppen" },
  { area: "export", label: "Export", icon: "download", hint: "Zielordner, Vorlage, Rundung" },
  { area: "daten", label: "Daten", icon: "folder-open", hint: "Sichern, wiederherstellen, umziehen" },
  {
    area: "tags",
    label: "Tags",
    icon: "tag",
    hint: "Tags, Ordner und Standard-Tags",
  },
  { area: "regeln", label: "Regeln", icon: "filter", hint: "Pools und Kanban-Spalten" },
  { area: "prioritaeten", label: "Prioritäten", icon: "arrow-up", hint: "Prioritäten und ihre Gewichtung" },
  { area: "status", label: "Status", icon: "inbox", hint: "Statuswerte eines Todos" },
  { area: "addin", label: "Outlook-Add-in", icon: "shield", hint: "Zugang des Add-ins" },
  {
    area: "arbeitsplatz",
    label: "Arbeitsplatz",
    icon: "monitor",
    hint: "Abrechnungsname, Ablageort, Meldungen",
  },
  /*
    `as const satisfies` und nicht `: readonly AreaDescriptor[]` (T-334): Die
    Liste ist seit der Streichung von `PANEL_LABEL` **die** Quelle des
    Bereichsnamens, und `panelLabel` braucht dafuer ein erstes Element, das der
    Typpruefer kennt. Gepruft wird trotzdem gegen `AreaDescriptor` — ein
    falscher Schluessel oder ein unbekanntes Zeichen bricht hier ab.
  */
] as const satisfies readonly AreaDescriptor[];

function readArea(query: Readonly<Record<string, string>>): SettingsArea {
  const value = query["bereich"] === "standardtags" ? "tags" : query["bereich"];
  return AREAS.find((area) => area === value) ?? AREAS[0];
}

export interface SettingsScreenProps {
  /** Der Bereich steht in der Adresse (`?bereich=…`). */
  readonly query: Readonly<Record<string, string>>;
}

/**
 * Der zugängliche Name des Laufbereichs — **ein vorhandener Text** (T-322 4.11).
 *
 * Er kommt aus {@link AREA_LIST} und damit aus **derselben** Liste, die die
 * Schiene beschriftet: Der Name des Bereichs ist genau der Text, den der
 * Benutzer angeklickt hat, um hierherzukommen.
 *
 * Bis T-334 stand daneben eine zweite vollständige Abbildung über
 * `SettingsArea`, und sie war bereits auseinandergelaufen: „Outlook-Add-in" und
 * „Arbeitsplatz" hießen dort „Einstellungen" — derselbe zugängliche Name wie
 * der Rahmen darum, also zwei ineinanderliegende Gebiete gleichen Namens
 * (T-331, AK-15). Zwei Listen, die dasselbe bezeichnen, laufen auseinander;
 * eine kann es nicht. Kein neuer Oberflächentext: Beide Werte stehen sichtbar
 * in der Schiene.
 */
function panelLabel(area: SettingsArea): string {
  return AREA_LIST.find((item) => item.area === area)?.label ?? AREA_LIST[0].label;
}

export function SettingsScreen({ query }: SettingsScreenProps) {
  const structure = useStructure();
  const active = readArea(query);

  return (
    <section className="screen">
      {/*
        Der Kopf trägt den Nachladehinweis für den Aufbau (W-12): Fast jeder
        Bereich der Einstellungen liest aus der Struktur, und die wird beim
        erneuten Ansteuern und beim Fensterwechsel erneuert.
      */}
      {/*
        Kein `lead` mehr (T-181, ST-04). Er stand unter der Ueberschrift
        „Einstellungen“, sprach aber vom **gewaehlten Bereich** — ein
        Rangfehler, und dazu derselbe Satz wie in der Kartenbeschreibung
        darunter. Der Bereich ist danach dreifach benannt: Schiene mit
        `aria-current`, Kartentitel und Adresse (`?bereich=…`).
      */}
      <ScreenHeader
        title="Einstellungen"
        refreshing={structure.state.status === "ready" && structure.state.refreshing}
      />

      {/*
        Ein Laufbereich neben einer **festen** Spalte (T-322 4.11). Die
        Bereichsschiene hat eine im Quelltext festgelegte Zahl von Einträgen und
        steht deshalb; der Bereichsinhalt läuft — „Daten", „Outlook-Add-in" und
        „Darstellung" sind die längsten Flächen der Anwendung. Das ist keine
        Ausnahme von R-1, sondern R-1 auf zwei Achsen: Die Schiene steuert die
        Auswahl, der Bereich ist die Auswahl.

        Die Schiene hat dafür ihr `position: sticky` verloren (`app.css`): Eine
        feste Spalte braucht keine Klebung, und eine Klebung, die nichts mehr
        bewirkt, ist eine tote Zusage (T-322 Abschnitt 9 Nr. 1).
      */}
      {/*
        Ohne `label` und damit ohne Halt, ohne Rolle, ohne Namen und ohne die
        Sprungmarke (T-344 8.5). Der Rahmen laeuft in keiner getragenen Form;
        ein Halt an ihm war eine Station, hinter der **acht** Verweise der
        Bereichsschiene lagen — neun Tabulatorschritte bis zum Inhalt statt
        null. Die Marke sitzt jetzt an der `RunArea` darunter, und die
        Sprungmarke fuehrt damit an der Schiene vorbei: Das ist ihr Zweck.
      */}
      <ScreenFrame>
        <div className="settings-layout">
          <nav className="settings-rail" aria-label="Bereiche der Einstellungen">
            <ul className="settings-rail__list">
              {AREA_LIST.map((item) => (
                <li key={item.area} className={["export", "tags", "addin"].includes(item.area) ? "settings-rail__section-start" : undefined}>
                  <a
                    className={cx(
                      "settings-rail__item",
                      item.area === active && "settings-rail__item--current",
                    )}
                    href={href("settings", undefined, { bereich: item.area })}
                    aria-current={item.area === active ? "page" : undefined}
                  >
                    <span className="settings-rail__icon">
                      <Icon name={item.icon} size={16} />
                    </span>
                    <span className="settings-rail__text">
                      <span className="settings-rail__label">{item.label}</span>
                      <span className="settings-rail__hint">{item.hint}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <RunArea label={panelLabel(active)} className="settings-panel" anchor>
            <AsyncBoundary
              state={structure.state}
              label="Einstellungen werden geladen"
              rows={4}
              onRetry={structure.reload}
            >
              {() => <SettingsAreaPanel area={active} />}
            </AsyncBoundary>
          </RunArea>
        </div>
      </ScreenFrame>
    </section>
  );
}

/** Der Inhalt eines Bereichs. Jeder Zweig ist eine Karte oder eine Reihe. */
function SettingsAreaPanel({ area }: { readonly area: SettingsArea }) {
  const structure = useStructure();
  switch (area) {
    case "darstellung":
      return <DisplaySettings />;
    case "timer":
      return <TimerSettings />;
    case "export":
      return <ExportSettings />;
    case "daten":
      return <DataTransferSettings />;
    case "tags":
      return structure.state.status === "ready" ? <>
        <DefaultTagSettings />
        <TagAdministration tree={structure.state.value.tagTree} />
      </> : null;
    case "regeln":
      return structure.state.status === "ready"
        ? <PoolAdministration rules={structure.state.value.rules} /> : null;
    case "prioritaeten":
      return <PrioritySettings />;
    case "status":
      return <StatusSettings />;
    case "addin":
      return <><OutlookSetup /><AddinSettings /></>;
    case "arbeitsplatz":
      return (
        <>
          <WorkstationFacts />
          <SecurityNotices />
        </>
      );
  }
}

/* Darstellung                                                          */

const DENSITY_LABEL: Readonly<Record<Density, string>> = {
  comfortable: "Normal — mehr Luft zwischen den Zeilen",
  compact: "Kompakt — mehr Zeilen auf dem Bildschirm",
};

/** Sofortige, dauerhaft gespeicherte Darstellungseinstellungen (A-21.4). */
function TimerSettings() {
  const { promptOnTimerStop, setPromptOnTimerStop, saving, idleDetectionEnabled, idleKeepTimerRunning, setIdleKeepTimerRunning, idleThresholdMinutes, setIdleDetectionEnabled, setIdleThresholdMinutes } = usePreferences();
  const activity = useAsync(readIdleActivity, []);
  useEffect(() => {
    const interval = window.setInterval(activity.reload, 5000);
    return () => window.clearInterval(interval);
  }, [activity.reload]);
  return (
    <Card title="Timer" description="Bestimmen Sie, wann Sie Ihre Leistung eintragen möchten.">
      <label className="choice__option">
        <input
          type="checkbox"
          checked={promptOnTimerStop}
          disabled={saving}
          onChange={(event) => setPromptOnTimerStop(event.target.checked)}
          aria-describedby="timer-prompt-hint"
        />
        <span>Leistung beim Stoppen abfragen</span>
      </label>
      <p className="field__hint" id="timer-prompt-hint">
        Ausgeschaltet wird die Zeit sofort gebucht, auch beim Wechsel zu einem anderen Timer.
        Vorhandene Leistung bleibt erhalten;
        fehlenden Text können Sie später in der Buchungsübersicht ergänzen.
      </p>
      <label className="choice__option"><input type="checkbox" checked={idleDetectionEnabled} disabled={saving} onChange={event => setIdleDetectionEnabled(event.target.checked)} aria-describedby="idle-detection-hint" /><span>Inaktive Zeit erkennen</span></label>
      <p className="field__hint" id="idle-detection-hint">Bei Ihrer Rückkehr können Sie die inaktive Zeit als Pause auslassen, einer Aufgabe zuordnen oder aufteilen. Offene Zuordnungen bleiben beim Ausschalten dieser Einstellung erhalten.</p>
      <Select label="Timer bei Inaktivität" value={idleKeepTimerRunning ? 'continue' : 'pause'} onChange={value => setIdleKeepTimerRunning(value === 'continue')} disabled={saving || !idleDetectionEnabled}
        options={[{ value: 'continue', label: 'Weiterlaufen lassen' }, { value: 'pause', label: 'Bis zur Zuordnung pausieren' }]} />
      <Select label="Inaktivität erkennen nach" value={String(idleThresholdMinutes)} onChange={value => setIdleThresholdMinutes(Number(value))} disabled={saving || !idleDetectionEnabled}
        options={Array.from(new Set([1, 2, 5, 10, 15, 30, 60, 120, idleThresholdMinutes])).sort((a, b) => a - b).map(value => ({ value: String(value), label: `${value} ${value === 1 ? 'Minute' : 'Minuten'}` }))} />
      <p role="status">{activity.state.status === 'loading' ? 'Inaktivitätserkennung wird geprüft …' : activity.state.status === 'ready' && activity.state.value?.supported ? 'Systemweite Erkennung verfügbar — auch Eingaben in anderen Programmen zählen als Aktivität.' : 'Systemweite Erkennung ist hier nicht verfügbar. Sie benötigt die Desktop-App und eine unterstützte Systemschnittstelle.'}</p>
      <p className="field__hint">Es werden nur Zeitpunkte gelesen, keine Tasten, Texte oder Programminhalte aufgezeichnet.</p>
    </Card>
  );
}

function DisplaySettings() {
  const { theme, setTheme, designTheme, setDesignTheme, saving, density, setDensity } = usePreferences();

  const preset = themePreset(designTheme);

  return (
    <Card
      title="Darstellung"
      description="Theme, Farbmodus und Zeilendichte wirken sofort und bleiben beim nächsten Start erhalten."
    >
      <RadioRow
        className="appearance-mode"
        label="Farbmodus"
        value={preset.mode === "auto" ? theme : preset.mode}
        onChange={setTheme}
        disabled={saving || preset.mode !== "auto"}
        options={[
          { value: "system", label: "System", icon: "monitor", hint: "Folgt dem Farbmodus des Betriebssystems." },
          { value: "dark", label: "Dunkel", icon: "moon" },
          { value: "light", label: "Hell", icon: "sun" },
        ]}
      />
      {preset.mode === "auto" ? null : (
        <p className="field__hint">Dieses Theme verwendet feste {preset.mode === "dark" ? "dunkle" : "helle"} Farben. Die freie Farbwahl steht bei Klassisch und den anpassbaren Themes zur Verfügung.</p>
      )}
      <Select
        className="settings-field-section"
        label="Theme auswählen"
        value={preset.value}
        onChange={setDesignTheme}
        disabled={saving}
        options={THEME_PRESETS.map(item => ({
          value: item.value,
          label: item.label,
          hint: `${item.mode === "dark" ? "Dunkel · " : item.mode === "light" ? "Hell · " : "Hell & Dunkel · "}${item.hint}`,
        }))}
        hint="Alle Themes verwenden das klassische Layout. Klassisch ist der Standard."
      />

      <Select
        className="settings-field-section"
        label="Zeilendichte"
        value={density}
        onChange={setDensity}
        disabled={saving}
        options={(["comfortable", "compact"] as const).map((value) => ({
          value,
          label: DENSITY_LABEL[value],
        }))}
        hint="Bestimmt die Abstände in Tabellen und Listen, unabhängig vom gewählten Theme."
      />
    </Card>
  );
}

/* Arbeitsplatz — Benutzername und Ablageort (C-20, E-042, R-13)        */

/**
 * Zwei Auskünfte des Dienstes, beide unveränderlich.
 *
 * Eine eigene Karte und keine Zeilen in „Export und Darstellung": Dort steht,
 * was man einstellt, und alles darauf hat einen Speichern-Knopf. Diese beiden
 * Werte haben keinen — sie mit den Einstellungen zu mischen hieße, ein
 * Speichern anzubieten, das sie nicht betrifft.
 */
function WorkstationFacts() {
  const structure = useStructure();
  const value = structure.state.status === "ready" ? structure.state.value : null;

  return (
    /*
      „Arbeitsplatz" statt „Dieser Arbeitsplatz" (T-181, Auflage Z-12 aus
      T-177). Nach ST-04 ist der Kartentitel die **Bereichsueberschrift** —
      ein Deiktikum in einer Ueberschrift ist im Kopf des Lesers ein zweiter
      Gegenstand. Solange darueber ein `AREA_LEAD` stand, der von etwas
      anderem sprach, hatte „Dieser" eine Aufgabe; jetzt hat es keine mehr.
      Die Schiene heisst ebenfalls „Arbeitsplatz" und traegt `aria-current`;
      zwei Namen fuer eine Sache sind bereits in das Handbuch gelaufen.

      Was „Dieser" trug, geht nicht verloren: Dass es um **diesen** Rechner
      geht, sagen die Beschreibung und die beiden Werte selbst.

      **Berührt einen zugaenglichen Namen** (`Card.title`, E-076 Punkt 3).
      Gemessen haengt heute kein Pruefall daran — genau deshalb hat der
      Pruefer ihn benannt.
    */
    <Card title="Arbeitsplatz" description="Meldet der Dienst. Hier nicht änderbar.">
      {value === null ? (
        <p className="muted">Die Auskünfte werden geladen.</p>
      ) : (
        <div className="workstation">
          <BillingUserFact user={value.windowsUser} />
          <DatabaseLocationFact path={value.databasePath} />
        </div>
      )}
    </Card>
  );
}

/* Sicherheitsmeldungen                                                 */

function SecurityNotices() {
  const notices = useAsync(() => listSecurityNotices(), []);

  return (
    <Card
      title="Sicherheitsmeldungen"
      description="Zählwerte und Zeitpunkte, keine Inhalte."
      actions={
        <Button size="sm" variant="ghost" iconStart="rotate-ccw" onClick={notices.reload}>
          Aktualisieren
        </Button>
      }
    >
      <AsyncBoundary state={notices.state} label="Meldungen werden geladen" rows={2} onRetry={notices.reload}>
        {(value) =>
          value.notices.length === 0 ? (
            <p className="muted">
              <Icon name="check-circle" size={14} /> Nichts aufgefallen. Die Liste ist beim nächsten
              Start wieder leer — sie liegt im Arbeitsspeicher und nicht in einer Datei neben
              Kundendaten.
            </p>
          ) : (
            <ul className="notice-list">
              {value.notices.map((notice) => (
                <li key={notice.kind} className="notice-row">
                  <Icon name="alert-triangle" size={14} />
                  <span className="grow">{NOTICE_LABEL[notice.kind]}</span>
                  <span className="notice-row__count">{plural(notice.count, "Mal", "Mal")}</span>
                  <span className="notice-row__time">zuletzt {formatDateTime(notice.lastAt)}</span>
                </li>
              ))}
            </ul>
          )
        }
      </AsyncBoundary>
    </Card>
  );
}
