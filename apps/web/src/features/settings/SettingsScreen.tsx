import { TagAdministration } from "../tags/TagAdministration";
import { PoolAdministration } from "../tags/PoolAdministration";
import { PrioritySettings } from "./PrioritySettings";
import { THEME_PRESETS, themePreset } from "./themePresets";
import { useEffect } from "react";
import { listSecurityNotices } from "./api";
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
import { AsyncBoundary } from "../../shared/ui/AsyncBoundary";
import { RunArea, ScreenFrame } from "../../shared/ui/ScreenBody";
import { ScreenHeader } from "../../shared/ui/ScreenHeader";
import { AddinSettings } from "./AddinSettings";
import { DataTransferSettings } from "./DataTransferSettings";
import { DefaultTagSettings } from "./DefaultTagSettings";
import { ExportSettings } from "./ExportSettings";
import { StatusSettings } from "./StatusSettings";
import { readIdleActivity } from "../../app/connection";
import { type Language } from "../../lib/language";
import { settingsTexts, themeText } from "./texts";

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


/* Die Bereiche                                                         */

const AREAS = ["darstellung", "timer", "export", "daten", "tags", "regeln", "status", "prioritaeten", "addin", "arbeitsplatz"] as const;

type SettingsArea = (typeof AREAS)[number];

interface AreaDescriptor {
  readonly area: SettingsArea;
  readonly icon: IconName;
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
  { area: "darstellung", icon: "sun" },
  { area: "timer", icon: "clock" },
  { area: "export", icon: "download" },
  { area: "daten", icon: "folder-open" },
  { area: "tags", icon: "tag" },
  { area: "regeln", icon: "filter" },
  { area: "prioritaeten", icon: "arrow-up" },
  { area: "status", icon: "inbox" },
  { area: "addin", icon: "shield" },
  { area: "arbeitsplatz", icon: "monitor" },
  /*
    Label and hint of each area live in `settingsTexts().areas` (A-28.2); the
    list keeps order and icon. `satisfies` checks each entry against
    `AreaDescriptor`, so a wrong key breaks here.
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
  return settingsTexts().areas[area].label;
}

export function SettingsScreen({ query }: SettingsScreenProps) {
  const structure = useStructure();
  const active = readArea(query);
  const text = settingsTexts();

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
        title={text.settingsTitle}
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
          <nav className="settings-rail" aria-label={text.areasNav}>
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
                      <span className="settings-rail__label">{text.areas[item.area].label}</span>
                      <span className="settings-rail__hint">{text.areas[item.area].hint}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <RunArea label={panelLabel(active)} className="settings-panel" anchor>
            <AsyncBoundary
              state={structure.state}
              label={text.settingsLoading}
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
          <VersionCheckSettings />
          <SecurityNotices />
        </>
      );
  }
}

/* Darstellung                                                          */


/** Sofortige, dauerhaft gespeicherte Darstellungseinstellungen (A-21.4). */
function TimerSettings() {
  const { promptOnTimerStop, setPromptOnTimerStop, saving, idleDetectionEnabled, idleThresholdMinutes, setIdleDetectionEnabled, setIdleThresholdMinutes } = usePreferences();
  const activity = useAsync(readIdleActivity, []);
  useEffect(() => {
    const interval = window.setInterval(activity.reload, 5000);
    return () => window.clearInterval(interval);
  }, [activity.reload]);
  const text = settingsTexts();
  return (
    <Card title={text.timerTitle} description={text.timerLead}>
      <label className="choice__option">
        <input
          type="checkbox"
          checked={promptOnTimerStop}
          disabled={saving}
          onChange={(event) => setPromptOnTimerStop(event.target.checked)}
          aria-describedby="timer-prompt-hint"
        />
        <span>{text.promptOnStop}</span>
      </label>
      <p className="field__hint" id="timer-prompt-hint">
        {text.promptOnStopHint}
      </p>
      <label className="choice__option"><input type="checkbox" checked={idleDetectionEnabled} disabled={saving} onChange={event => setIdleDetectionEnabled(event.target.checked)} aria-describedby="idle-detection-hint" /><span>{text.detectIdle}</span></label>
      <p className="field__hint" id="idle-detection-hint">{text.detectIdleHint}</p>
      <Select label={text.detectIdleAfter} value={String(idleThresholdMinutes)} onChange={value => setIdleThresholdMinutes(Number(value))} disabled={saving || !idleDetectionEnabled}
        options={Array.from(new Set([1, 2, 5, 10, 15, 30, 60, 120, idleThresholdMinutes])).sort((a, b) => a - b).map(value => ({ value: String(value), label: text.minutes(value) }))} />
      <p role="status">{activity.state.status === 'loading' ? text.idleChecking : activity.state.status === 'ready' && activity.state.value?.supported ? text.idleSupported : text.idleUnsupported}</p>
      <p className="field__hint">{text.idlePrivacy}</p>
    </Card>
  );
}

function DisplaySettings() {
  const { theme, setTheme, designTheme, setDesignTheme, saving, density, setDensity, motionIntensity, setMotionIntensity, uiLanguage, setUiLanguage } = usePreferences();

  const preset = themePreset(designTheme);
  const text = settingsTexts();

  return (
    <Card title={text.displayTitle} description={text.displayLead}>
      {/*
        First in the card (welle-18.md 2.1): the language decides how the rest
        reads. Each option is written in its own language with its `lang`, so a
        user who switched by mistake finds the way back (WCAG 3.1.2). The value
        is stored in the Bestand (A-28.2).
      */}
      <RadioRow<Language>
        className="appearance-language"
        label={text.language}
        value={uiLanguage}
        onChange={setUiLanguage}
        options={[
          { value: "de", label: "Deutsch", lang: "de" },
          { value: "en", label: "English", lang: "en" },
        ]}
      />
      <p className="field__hint">{text.languageHint}</p>
      <RadioRow
        className="appearance-mode"
        label={text.colorMode}
        value={preset.mode === "auto" ? theme : preset.mode}
        onChange={setTheme}
        disabled={saving || preset.mode !== "auto"}
        options={[
          { value: "system", label: text.modeSystem, icon: "monitor", hint: text.modeSystemHint },
          { value: "dark", label: text.modeDark, icon: "moon" },
          { value: "light", label: text.modeLight, icon: "sun" },
        ]}
      />
      {preset.mode === "auto" ? null : (
        <p className="field__hint">{text.fixedColors(preset.mode === "dark")}</p>
      )}
      <Select
        className="settings-field-section"
        label={text.chooseTheme}
        value={preset.value}
        onChange={setDesignTheme}
        disabled={saving}
        options={THEME_PRESETS.map(item => ({
          value: item.value,
          label: themeText(item).label,
          hint: `${text.themeMode[item.mode]}${themeText(item).hint}`,
        }))}
        hint={text.themeHint}
      />

      <Select
        className="settings-field-section"
        label={text.rowDensity}
        value={density}
        onChange={setDensity}
        disabled={saving}
        options={(["comfortable", "compact"] as const).map((value) => ({
          value,
          label: text.density[value],
        }))}
        hint={text.rowDensityHint}
      />
      <Select
        className="settings-field-section"
        label={text.motionIntensity}
        value={motionIntensity}
        onChange={setMotionIntensity}
        disabled={saving}
        options={(['reduced', 'subtle', 'expressive'] as const).map((value) => ({ value, label: text.motion[value] }))}
        hint={text.motionIntensityHint}
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
    <Card title={settingsTexts().workstation} description={settingsTexts().workstationLead}>
      {value === null ? (
        <p className="muted">{settingsTexts().factsLoading}</p>
      ) : (
        <div className="workstation">
          <BillingUserFact user={value.windowsUser} />
          <DatabaseLocationFact path={value.databasePath} filesTooPermissive={value.databaseFilesTooPermissive} />
        </div>
      )}
    </Card>
  );
}

/* Versionsprüfung (A-28.1)                                             */

/** The one outward connection of the product can be switched off (A-28.1, E-064). */
function VersionCheckSettings() {
  // Not `disabled` while saving: that would drop focus to <body> (welle-18-fluss.md 1.4);
  // the preferences context ignores a second change while one is in flight.
  const { versionCheckEnabled, setVersionCheckEnabled } = usePreferences();
  const text = settingsTexts();
  return (
    <Card title={text.versionCheckTitle}>
      <label className="choice__option">
        <input
          type="checkbox"
          checked={versionCheckEnabled}
          onChange={(event) => setVersionCheckEnabled(event.target.checked)}
          aria-describedby="version-check-hint"
        />
        <span>{text.versionCheckLabel}</span>
      </label>
      <p className="field__hint" id="version-check-hint">
        {text.versionCheckHint}
      </p>
    </Card>
  );
}

/* Sicherheitsmeldungen                                                 */

function SecurityNotices() {
  const notices = useAsync(() => listSecurityNotices(), []);
  const text = settingsTexts();

  return (
    <Card
      title={text.securityNotices}
      description={text.securityNoticesLead}
      actions={
        <Button size="sm" variant="ghost" iconStart="rotate-ccw" onClick={notices.reload}>
          {text.refresh}
        </Button>
      }
    >
      <AsyncBoundary state={notices.state} label={text.noticesLoading} rows={2} onRetry={notices.reload}>
        {(value) => {
          // The permission finding is shown at the data location instead (A-28.8, welle-18-fluss.md 6.1).
          const notices = value.notices.filter((notice) => notice.kind !== "file_permissions_wide");
          return notices.length === 0 ? (
            <p className="muted">
              <Icon name="check-circle" size={14} /> {text.nothingNoticed}
            </p>
          ) : (
            <ul className="notice-list">
              {notices.map((notice) => (
                <li key={notice.kind} className="notice-row">
                  <Icon name="alert-triangle" size={14} />
                  <span className="grow">{text.noticeLabel[notice.kind]}</span>
                  <span className="notice-row__count">{plural(notice.count, text.times, text.timesPlural)}</span>
                  <span className="notice-row__time">{text.lastAt(formatDateTime(notice.lastAt))}</span>
                </li>
              ))}
            </ul>
          );
        }}
      </AsyncBoundary>
    </Card>
  );
}
