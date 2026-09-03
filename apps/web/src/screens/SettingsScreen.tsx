import { useEffect, useMemo, useState } from "react";
import { errorMessage } from "../api/client";
import {
  getTokenStatus,
  listDefaultTags,
  listExportTemplates,
  listSecurityNotices,
  rotateToken,
  setDefaultTags,
  updateSettings,
} from "../api/endpoints";
import type { Id, RoundingMode, SecurityNoticeKind } from "../api/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ExportDirectoryField } from "../components/ExportDirectoryField";
import { BillingUserFact, DatabaseLocationFact } from "../components/WorkstationFacts";
import { Select } from "../components/Select";
import { Icon, type IconName } from "../components/Icon";
import { Button, Card, EmptyState, InlineMessage } from "../components/Primitives";
import { TagInput } from "../components/TagInput";
import { usePreferences } from "../app/PreferencesContext";
import { useRefresh } from "../app/RefreshContext";
import { href, navigate } from "../app/router";
import { useStructure } from "../app/StructureContext";
import { useToasts } from "../app/ToastContext";
import { useAsync, useMutation } from "../app/useAsync";
import { cx } from "../lib/cx";
import { adviseExportDirectory } from "../lib/exportDirectoryAdvice";
import { ROUNDING_MODE_LABEL, THEME_LABEL } from "../lib/labels";
import { formatDateTime, plural } from "../lib/format";
import type { Density } from "../lib/theme";
import { AsyncBoundary, ScreenHeader } from "./parts";
import { StatusSettings } from "./StatusSettings";

/**
 * Takt — S-09 (Einstellungen), S-10 (Standard-Tags) und S-13 (Add-in).
 *
 * ## Das Add-in-Token steht genau einmal auf dem Bildschirm
 *
 * Es ist **nicht** Teil der Einstellungen (E-009): Es liegt in einer eigenen
 * Datei und hat eine eigene Route, die nur mit dem Sitzungsgeheimnis
 * erreichbar ist. Der Klartext existiert nach der Antwort nicht mehr — auch
 * nicht für diese Oberfläche. Er wird deshalb angezeigt, nicht gespeichert:
 * kein `localStorage`, kein zweiter Abruf, keine Adresszeile.
 *
 * Ein neues Token macht das alte **sofort** ungültig. Es gibt genau einen
 * gültigen Abdruck, keine Nachfrist. Der Bestätigungsdialog sagt das, bevor
 * geklickt wird — danach funktioniert das Add-in erst wieder, wenn das neue
 * Token dort eingetragen ist.
 *
 * ## Der Exportordner wird gewählt, nicht getippt (Befund S-04)
 *
 * Bis T-036 stand hier ein Freitextfeld mit dem Platzhalter `C:\Takt\Export`.
 * Der Traversierungsschutz im Dienst hielt und hält — es ging nie um einen
 * Angriff, sondern darum, dass ein Eingabefeld dazu einlädt, die Exportdateien
 * an eine ungeeignete Stelle zu legen. Diese Dateien enthalten Kundennotizen
 * in einer Kodierung, die wie Schutz aussieht und keiner ist (A-8.9, R-05).
 *
 * Das Feld liegt jetzt in `components/ExportDirectoryField.tsx` und wählt über
 * den Systemdialog. Die Beurteilung des Pfades steht in
 * `lib/exportDirectoryAdvice.ts` und ist **die Erklärung, nicht die Grenze** —
 * die zieht der Dienst, und er zieht sie noch einmal, wenn hier alles gut
 * aussieht.
 *
 * ## Zwei Auskünfte, die keine Einstellungen sind (C-20)
 *
 * `GET /settings` führt neben den Einstellungen den **Benutzernamen**, unter
 * dem abgerechnet wird, und den **Ablageort des Bestandes**. Beide sind hier
 * nicht änderbar; sie stehen auf einer eigenen Karte, damit man sie nachsehen
 * kann, bevor es darauf ankommt — der Name vor dem ersten Export (E-042), der
 * Pfad, bevor jemand nach der Datei mit den Kundendaten sucht (R-13). Der
 * Inhalt liegt in `components/WorkstationFacts.tsx`.
 *
 * ## Bereiche statt einer langen Liste (T-057, Punkt 2)
 *
 * Bis T-057 standen hier fünf Karten untereinander — Export (mit Ordner,
 * Vorlage, Rundung und Farbmodus in einem), Arbeitsplatz, Standard-Tags,
 * Add-in und Sicherheitsmeldungen. Gemessen 2379 Pixel in einem 820 Pixel
 * hohen Fenster: Wer den Farbmodus suchte, scrollte an allem vorbei, was er
 * nicht suchte.
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

/* ==================================================================== */
/* Die Bereiche                                                         */
/* ==================================================================== */

const AREAS = ["darstellung", "export", "standardtags", "status", "addin", "arbeitsplatz"] as const;

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
const AREA_LIST: readonly AreaDescriptor[] = [
  {
    area: "darstellung",
    label: "Darstellung",
    icon: "sun",
    hint: "Farbmodus und Zeilendichte der Oberfläche",
  },
  {
    area: "export",
    label: "Export",
    icon: "download",
    hint: "Zielordner, aktive Vorlage und Rundung",
  },
  {
    area: "standardtags",
    label: "Standard-Tags",
    icon: "tag",
    hint: "Tags, die an jedes neue Todo kommen",
  },
  {
    area: "status",
    label: "Status",
    icon: "inbox",
    hint: "Die Statuswerte eines Todos — nicht die Spalten des Boards",
  },
  {
    area: "addin",
    label: "Outlook-Add-in",
    icon: "shield",
    hint: "Der Zugang, mit dem sich das Add-in ausweist",
  },
  {
    area: "arbeitsplatz",
    label: "Arbeitsplatz",
    icon: "monitor",
    hint: "Abrechnungsname, Ablageort und Sicherheitsmeldungen",
  },
];

const AREA_LEAD: Readonly<Record<SettingsArea, string>> = {
  darstellung: "Wie Takt aussieht. Änderungen wirken sofort, ohne Speichern.",
  export: "Wohin die Exportdatei geht, welche Vorlage sie füllt und wie gerundet wird.",
  standardtags: "Welche Tags jedes neu angelegte Todo mitbekommt — auf jedem Weg.",
  status: "Welche Statuswerte es gibt, in welcher Reihenfolge und welcher an ein neues Todo kommt.",
  addin: "Das Token, mit dem sich das Outlook-Add-in beim lokalen Dienst ausweist.",
  arbeitsplatz: "Was der Dienst über diesen Arbeitsplatz meldet. Hier nicht änderbar.",
};

function readArea(query: Readonly<Record<string, string>>): SettingsArea {
  const value = query["bereich"];
  return AREAS.find((area) => area === value) ?? AREAS[0];
}

export interface SettingsScreenProps {
  /** Der Bereich steht in der Adresse (`?bereich=…`). */
  readonly query: Readonly<Record<string, string>>;
}

export function SettingsScreen({ query }: SettingsScreenProps) {
  const structure = useStructure();
  const active = readArea(query);

  return (
    <section className="screen">
      <ScreenHeader title="Einstellungen" lead={AREA_LEAD[active]} />

      <div className="settings-layout">
        <nav className="settings-rail" aria-label="Bereiche der Einstellungen">
          <ul className="settings-rail__list">
            {AREA_LIST.map((item) => (
              <li key={item.area}>
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

        <div className="settings-panel">
          <AsyncBoundary
            state={structure.state}
            label="Einstellungen werden geladen"
            rows={4}
            onRetry={structure.reload}
          >
            {() => <SettingsAreaPanel area={active} />}
          </AsyncBoundary>
        </div>
      </div>
    </section>
  );
}

/** Der Inhalt eines Bereichs. Jeder Zweig ist eine Karte oder eine Reihe. */
function SettingsAreaPanel({ area }: { readonly area: SettingsArea }) {
  switch (area) {
    case "darstellung":
      return <DisplaySettings />;
    case "export":
      return <ExportSettings />;
    case "standardtags":
      return <DefaultTagSettings />;
    case "status":
      return <StatusSettings />;
    case "addin":
      return <AddinSettings />;
    case "arbeitsplatz":
      return (
        <>
          <WorkstationFacts />
          <SecurityNotices />
        </>
      );
  }
}

/* ==================================================================== */
/* Darstellung                                                          */
/* ==================================================================== */

const DENSITY_LABEL: Readonly<Record<Density, string>> = {
  comfortable: "Normal — mehr Luft zwischen den Zeilen",
  compact: "Kompakt — mehr Zeilen auf dem Bildschirm",
};

/**
 * Farbmodus und Zeilendichte.
 *
 * **Ohne Speichern-Knopf, und das ist die Absicht.** Beide Werte wirken sofort
 * und sichtbar; ein Knopf, der bestätigt, was man schon sieht, stellt eine
 * Frage, die nicht mehr offen ist. Der Farbmodus geht dabei über
 * `PreferencesContext` in `app_setting.theme` (E-041) und ist damit dauerhaft.
 *
 * Seit T-065 ist dies der **einzige** Ort, an dem der Farbmodus eingestellt
 * wird. Bis dahin stand dasselbe Auswahlfeld ein zweites Mal oben rechts in
 * der Kopfleiste. Es bediente seit T-057 zwar dieselbe Einstellung, blieb aber
 * ein zweiter Bedienweg für etwas, das man einmal einstellt — der
 * Auftraggeber hat ihn gestrichen. Was blieb: `PreferencesContext`. Er ist
 * nicht Zubehör dieses Feldes, sondern die Stelle, die die gespeicherte Wahl
 * beim Start anwendet.
 *
 * Die Zeilendichte ist bis zum Beenden von Takt gültig. Das Datenmodell führt
 * keine Spalte dafür, und diese Oberfläche legt nichts im Browser ab. Der
 * Hinweis unter dem Feld sagt es, statt es den Benutzer beim nächsten Start
 * herausfinden zu lassen.
 */
function DisplaySettings() {
  const { theme, setTheme, themeSaving, density, setDensity } = usePreferences();

  return (
    <Card
      title="Darstellung"
      description="Farbmodus und Zeilendichte. Beides wirkt sofort — es gibt hier nichts zu speichern."
    >
      <Select
        label="Farbmodus"
        value={theme}
        onChange={setTheme}
        disabled={themeSaving}
        options={(["system", "light", "dark"] as const).map((value) => ({
          value,
          label: THEME_LABEL[value],
        }))}
        hint="„Systemvorgabe“ folgt der Einstellung von Windows. Die Wahl gilt sofort und bleibt beim nächsten Start erhalten."
      />

      <Select
        label="Zeilendichte"
        value={density}
        onChange={setDensity}
        options={(["comfortable", "compact"] as const).map((value) => ({
          value,
          label: DENSITY_LABEL[value],
        }))}
        hint="Betrifft Tabellen und Listen. Diese Wahl gilt bis zum Beenden von Takt — sie hat noch keinen Platz in den gespeicherten Einstellungen."
      />
    </Card>
  );
}

/* ==================================================================== */
/* Export — Ordner, Vorlage, Rundung                                    */
/* ==================================================================== */

function ExportSettings() {
  const structure = useStructure();
  const toasts = useToasts();
  const { bump } = useRefresh();
  const mutation = useMutation();

  const structureValue = structure.state.status === "ready" ? structure.state.value : null;
  const settings = structureValue?.settings ?? null;
  const directoryState = structureValue?.exportDirectoryState ?? null;
  /* T-039 — was am Ordner belegt ist. Leer heißt „nichts belegt". */
  const directoryTraits = structureValue?.exportDirectoryTraits ?? [];

  const [directory, setDirectory] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [rounding, setRounding] = useState<RoundingMode>("up");
  /**
   * Der Pfad, für den der Benutzer die Rückfrage bereits beantwortet hat.
   *
   * Der ganze Pfad und kein Merker: Wer nach der Bestätigung einen **anderen**
   * Netzordner wählt, wird wieder gefragt. Eine einmal gesetzte Zustimmung,
   * die für jeden künftigen Ordner gilt, wäre keine Rückfrage mehr.
   */
  const [acknowledgedDirectory, setAcknowledgedDirectory] = useState<string | null>(null);
  const [confirmDirectoryOpen, setConfirmDirectoryOpen] = useState(false);

  useEffect(() => {
    if (settings === null) return;
    setDirectory(settings.exportDirectory ?? "");
    setTemplateId(settings.activeExportTemplateId ?? "");
    setRounding(settings.roundingMode);
    // Ein gespeicherter Ordner ist ein bestätigter Ordner: Er kam entweder
    // durch diese Rückfrage oder er stand schon vor T-036 da. Sonst fragte
    // Takt nach jedem Neuladen erneut nach demselben Pfad.
    setAcknowledgedDirectory(settings.exportDirectory);
  }, [settings]);

  const templates = useAsync(() => listExportTemplates(), []);

  const trimmedDirectory = directory.trim();
  const advice = useMemo(() => adviseExportDirectory(directory), [directory]);
  const directoryUnsaved = trimmedDirectory !== (settings?.exportDirectory ?? "");

  /*
   * Der Dienst prüft den Pfad ohnehin noch einmal (`checkExportDirectory`).
   * Diese Sperre ist nicht seine Vertretung, sondern die Antwort auf die
   * Frage, warum der Knopf nicht geht — ein Speichern, das der Dienst mit
   * einer Fehlermeldung beantwortet, erklärt nichts.
   */
  const blocked = advice.verdict === "reject";
  const needsConfirmation = advice.verdict === "confirm" && trimmedDirectory !== acknowledgedDirectory;

  const persist = (): void => {
    void mutation.run(async () => {
      await updateSettings({
        exportDirectory: trimmedDirectory.length === 0 ? null : trimmedDirectory,
        activeExportTemplateId: templateId.length === 0 ? null : templateId,
        roundingMode: rounding,
      });
      setAcknowledgedDirectory(trimmedDirectory.length === 0 ? null : trimmedDirectory);
      structure.reload();
      bump();
      toasts.success("Einstellungen gespeichert.");
    });
  };

  const save = (): void => {
    if (blocked) return;
    if (needsConfirmation) {
      setConfirmDirectoryOpen(true);
      return;
    }
    persist();
  };

  /* Der schwerste Befund trägt den Text der Rückfrage. */
  const leadingConcern = advice.concerns[0] ?? null;

  return (
    <Card
      title="Export"
      description="Der Exportordner wird vor jedem Lauf erneut geprüft: vorhanden, ein Ordner, beschreibbar."
      actions={
        <Button
          variant="primary"
          loading={mutation.busy}
          disabled={blocked}
          onClick={save}
        >
          Speichern
        </Button>
      }
    >
      <ExportDirectoryField
        value={directory}
        onChange={setDirectory}
        advice={advice}
        serviceState={directoryState}
        serviceTraits={directoryTraits}
        unsaved={directoryUnsaved}
        disabled={mutation.busy}
      />

      {blocked ? (
        <p className="field__error" role="status">
          Solange dieser Ordner eingetragen ist, lässt sich nichts speichern. Wählen Sie einen
          anderen — die übrigen Einstellungen auf dieser Karte gehen dabei nicht verloren.
        </p>
      ) : null}

      <Select
        label="Aktive Exportvorlage"
        value={templateId}
        onChange={setTemplateId}
        options={[
          { value: "", label: "Mitgelieferte Standardvorlage" },
          ...(templates.state.status === "ready"
            ? templates.state.value.map((template) => ({
                value: template.id,
                label: template.isBuiltin ? `${template.name} (mitgeliefert)` : template.name,
              }))
            : []),
        ]}
      />

      {/*
        Der Vorlageneditor liegt beim Export und nicht hier (T-005,
        Abschnitt 7): Er braucht die Vorschau auf tatsaechlich offenen
        Buchungen, und das sind die Daten von S-07. Ein Verweis steht
        trotzdem hier, damit auch findet, wer in den Einstellungen sucht.
      */}
      <p className="field__hint">
        Welche Felder eine Vorlage enthaelt, legen Sie im Vorlageneditor fest.{" "}
        <Button
          size="sm"
          variant="ghost"
          iconStart="pencil"
          onClick={() => navigate("templates", templateId.length === 0 ? undefined : templateId)}
        >
          Vorlagen bearbeiten
        </Button>
      </p>

      <Select
        label="Rundung vor dem Export"
        value={rounding}
        onChange={(next) => setRounding(next as RoundingMode)}
        options={[
          { value: "up", label: `${ROUNDING_MODE_LABEL.up} — immer auf die nächste Viertelstunde` },
          { value: "nearest", label: `${ROUNDING_MODE_LABEL.nearest} — zur nächstgelegenen` },
        ]}
      />

      <InlineMessage tone="info" title="Gerundet wird die Tagesgruppe, nicht die einzelne Buchung">
        Alle noch offenen Buchungen desselben Todos an einem Kalendertag werden addiert, erst dann
        wird die Summe gerundet — mindestens 0,25. Zehn, zwanzig und fünf Minuten ergeben 0,75 und
        nicht dreimal 0,25.
      </InlineMessage>

      {/*
        Der Farbmodus stand bis T-057 auf dieser Karte und wurde mit demselben
        Knopf gespeichert wie Exportordner, Vorlage und Rundung. Er hat mit
        keinem der drei etwas zu tun und liegt jetzt im Bereich „Darstellung" —
        dort ohne Speichern-Knopf, weil man sein Ergebnis sofort sieht.
      */}

      {mutation.error === null ? null : (
        <InlineMessage tone="danger" title="Die Einstellungen wurden nicht gespeichert">
          {mutation.error}
        </InlineMessage>
      )}

      {/*
        B-5.2 Punkt 2, wörtlich: „Nicht verbieten … aber niemals stillschweigend
        zulassen." Die Rückfrage sperrt nichts — sie sagt, was der Ordner
        bedeutet, und lässt den Benutzer entscheiden (E-011).
      */}
      <ConfirmDialog
        open={confirmDirectoryOpen && leadingConcern !== null}
        tone="danger"
        title={leadingConcern?.title ?? "Diesen Ordner einstellen?"}
        description={leadingConcern?.body ?? ""}
        consequence="Die Exportdatei enthält lesbare Kundennotizen. Base64 ist eine Kodierung, keine Verschlüsselung — wer die Datei öffnen kann, kann sie lesen."
        confirmLabel="Ordner trotzdem einstellen"
        cancelLabel="Anderen Ordner wählen"
        acknowledgeLabel="Ich weiß, dass die Kundennotizen dorthin gelangen, und will es so."
        busy={mutation.busy}
        onConfirm={() => {
          setAcknowledgedDirectory(trimmedDirectory);
          setConfirmDirectoryOpen(false);
          persist();
        }}
        onCancel={() => setConfirmDirectoryOpen(false)}
      />
    </Card>
  );
}

/* ==================================================================== */
/* Arbeitsplatz — Benutzername und Ablageort (C-20, E-042, R-13)        */
/* ==================================================================== */

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
    <Card
      title="Dieser Arbeitsplatz"
      description="Unter welchem Namen abgerechnet wird und wo Takt seine Daten führt. Beides meldet der Dienst; ändern lässt es sich hier nicht."
    >
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

/* ==================================================================== */
/* Standard-Tags (S-10, I-12)                                           */
/* ==================================================================== */

function DefaultTagSettings() {
  const structure = useStructure();
  const toasts = useToasts();
  const mutation = useMutation();
  const [selected, setSelected] = useState<readonly Id[] | null>(null);

  const current = useAsync(() => listDefaultTags(), []);
  const value = selected ?? (current.state.status === "ready" ? current.state.value.map((tag) => tag.tagId) : []);

  return (
    <Card
      title="Standard-Tags"
      description="Sie kommen an jedes neu angelegte Todo — auf jedem Weg, auch aus dem Add-in."
      actions={
        <Button
          variant="primary"
          disabled={selected === null}
          loading={mutation.busy}
          onClick={() => {
            void mutation.run(async () => {
              await setDefaultTags(value);
              setSelected(null);
              current.reload();
              toasts.success("Standard-Tags gespeichert.");
            });
          }}
        >
          Speichern
        </Button>
      }
    >
      {structure.allTags.length === 0 ? (
        <EmptyState
          compact
          icon="tag"
          title="Noch kein Tag"
          description="Legen Sie zuerst Tags an — erst dann lässt sich einer als Standard setzen."
          action={
            <Button iconStart="tag" onClick={() => navigate("tags")}>
              Zur Tag-Verwaltung
            </Button>
          }
        />
      ) : (
        <TagInput
          label="Standard-Tags"
          hideLabel
          value={value}
          onChange={setSelected}
          placeholder="Tag suchen …"
          hint={
            value.length === 0
              ? "Kein Standard-Tag gesetzt. Neue Todos entstehen ohne Tags — Regeln, die Tags verlangen, treffen sie damit zunächst nicht."
              : `${plural(value.length, "Tag wird", "Tags werden")} an jedes neue Todo gehängt.`
          }
        />
      )}

      {mutation.error === null ? null : (
        <InlineMessage tone="danger" title="Die Standard-Tags wurden nicht gespeichert">
          {mutation.error}
        </InlineMessage>
      )}
    </Card>
  );
}

/* ==================================================================== */
/* Outlook-Add-in (S-13)                                                */
/* ==================================================================== */

function AddinSettings() {
  const toasts = useToasts();
  const status = useAsync(() => getTokenStatus(), []);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "done" | "failed">("idle");

  return (
    <Card
      title="Outlook-Add-in"
      description="Das Add-in weist sich mit einem eigenen Token aus — getrennt vom Zugang dieser Oberfläche."
    >
      <AsyncBoundary state={status.state} label="Tokenzustand wird geladen" rows={2} onRetry={status.reload}>
        {(value) => (
          <>
            {value.unreadable ? (
              <InlineMessage tone="danger" title="Die Tokendatei ist nicht lesbar">
                Takt erzeugt von sich aus kein neues Token — das würde ein eingerichtetes Add-in
                ohne Vorwarnung aussperren. Erzeugen Sie eines von Hand, wenn Sie das Add-in
                neu einrichten wollen.
              </InlineMessage>
            ) : null}

            <dl className="facts">
              <dt>Eingerichtet</dt>
              <dd>{value.configured ? "Ja" : "Nein — das Add-in kann sich noch nicht ausweisen."}</dd>
              <dt>Ausgestellt</dt>
              <dd>{value.issuedAt === null ? "—" : formatDateTime(value.issuedAt)}</dd>
              <dt>Zuletzt benutzt</dt>
              <dd>
                {value.lastUsedAt === null
                  ? "Noch nie. Wenn das Add-in eingerichtet ist, spricht bisher niemand damit."
                  : formatDateTime(value.lastUsedAt)}
              </dd>
              <dt>Nummer</dt>
              <dd>{value.generation === 0 ? "—" : `${String(value.generation)}. Token`}</dd>
            </dl>

            {issued === null ? null : (
              <InlineMessage tone="warning" title="Dieses Token steht genau jetzt hier — und nie wieder">
                <p>
                  Tragen Sie es in den Add-in-Einstellungen in Outlook ein. Danach ist der Klartext
                  weg; er wird nirgends gespeichert, auch nicht von dieser Seite.
                </p>
                <p className="token-value mono" data-testid="addin-token">
                  {issued}
                </p>
                <div className="token-actions">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      void navigator.clipboard
                        .writeText(issued)
                        .then(() => setCopyState("done"))
                        .catch(() => setCopyState("failed"));
                    }}
                  >
                    In die Zwischenablage
                  </Button>
                  <span className="token-actions__hint" role="status">
                    {copyState === "done"
                      ? "Kopiert."
                      : copyState === "failed"
                        ? "Das Kopieren hat nicht geklappt — markieren Sie den Wert von Hand."
                        : ""}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setIssued(null)}>
                    Ausblenden
                  </Button>
                </div>
              </InlineMessage>
            )}

            <div className="card__actions">
              <Button variant="secondary" iconStart="shield" onClick={() => setConfirmOpen(true)}>
                {value.configured ? "Neues Token erzeugen" : "Token erzeugen"}
              </Button>
            </div>
          </>
        )}
      </AsyncBoundary>

      <ConfirmDialog
        open={confirmOpen}
        tone="danger"
        title="Neues Add-in-Token erzeugen?"
        description="Es entsteht genau ein gültiger Abdruck. Das bisherige Token wird im selben Augenblick ungültig."
        consequence="Das Add-in funktioniert erst wieder, wenn Sie das neue Token dort eingetragen haben. Eine Nachfrist gibt es nicht."
        confirmLabel="Token erzeugen"
        acknowledgeLabel="Ich habe Outlook zur Hand und trage das neue Token gleich ein."
        busy={busy}
        onConfirm={() => {
          setBusy(true);
          void rotateToken()
            .then((result) => {
              setIssued(result.token);
              setCopyState("idle");
              setConfirmOpen(false);
              status.reload();
              toasts.show({
                tone: "warning",
                title: "Neues Token erzeugt.",
                body: "Das alte ist ab sofort ungültig. Der Klartext steht nur jetzt auf dem Bildschirm.",
              });
            })
            .catch((cause: unknown) => toasts.failure("Das Token wurde nicht erzeugt", errorMessage(cause)))
            .finally(() => setBusy(false));
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </Card>
  );
}

/* ==================================================================== */
/* Sicherheitsmeldungen                                                 */
/* ==================================================================== */

function SecurityNotices() {
  const notices = useAsync(() => listSecurityNotices(), []);

  return (
    <Card
      title="Sicherheitsmeldungen"
      description="Was der lokale Dienst seit dem Start abgewiesen hat. Zählwerte und Zeitpunkte, keine Inhalte aus fremden Anfragen."
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
