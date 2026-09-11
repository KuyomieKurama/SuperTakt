import { useCallback, useEffect, useMemo, useState } from "react";
import { errorMessage } from "../../api/client";
import {
  listExportTemplates,
  previewExport,
} from "../../api/endpoints";
import {
  getExportSources,
  listExportRuns,
  runExport,
  type ExportRunResult,
} from "./api";
import {
  listTodos,
} from "../todos/api";
import type {
  ExportDirectoryState,
  ExportPreview,
  ExportRow,
  Id,
  TimeEntry,
  Todo,
} from "../../api/types";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import {
  Base64Notice,
  ExportDirectoryConcernList,
  ExportDirectoryTraitList,
} from "./ExportDirectoryField";
import {
  ExportGroupList,
  type ExportGroupData,
  type ExportGroupViewModel,
} from "./ExportGroups";
import { Select } from "../../shared/ui/Select";
import { InfoHint } from "./InfoHint";
import { Icon } from "../../shared/ui/Icon";
import { Button, Card, EmptyState, InlineMessage, Spinner } from "../../shared/ui/Primitives";
import { useRefresh } from "../../app/RefreshContext";
import { navigate } from "../../app/router";
import { useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { useAsync } from "../../app/useAsync";
import { adviseExportDirectory, isPathInsideDirectory } from "./exportDirectoryAdvice";
import {
  parseTemplateDefinition,
  readSourceCatalog,
  type SourceCatalog,
} from "./exportTemplateModel";
import { ROUNDING_MODE_LABEL } from "../../lib/labels";
import {
  formatDayLabel,
  formatDuration,
  formatQuarters,
  formatTimeRange,
  plural,
} from "../../lib/format";
import { AsyncBoundary } from "../../shared/ui/AsyncBoundary";
import { ScreenHeader } from "../../shared/ui/ScreenHeader";
import { ExportTabs } from "./ExportTabs";
import { GroupRowDetail, type TemplateFieldsResult } from "./GroupRowDetail";
import { ExportRunList } from "./ExportRunList";
import { RunResult } from "./RunResult";
import {
  ALL_EXCLUDED,
  collectOpenEntries,
  groupKeyOf,
  PAGE_SIZE,
  previewNote,
  reasonText,
  toLayout,
  type GroupInsight,
  type GroupLayout,
} from "./exportGroupLayout";
import { BookingFormDialog } from "../bookings/BookingDialogs";
import { foreignText } from "../../lib/foreign";

/**
 * Takt — S-07, die Export-Ansicht.
 *
 * ## Gegliedert wird nach Tagesgruppen (E-031, Befund B-22)
 *
 * Die Datei enthält **eine Zeile je Todo und Kalendertag**, nicht je Buchung
 * (E-020). Eine Auswahlliste, die nach Buchungen gliedert, zeigt deshalb etwas
 * anderes als die Datei: Der Benutzer hakt sieben Buchungen an und bekommt
 * drei Zeilen — und die wichtigste Umformung des ganzen Vorgangs, die
 * Rundung, findet zwischen Auswahl und Datei statt, wo sie niemand sieht.
 *
 * Deshalb: Auswahl auf Gruppenebene, aufklappbar auf die einzelnen Buchungen
 * mit ihrer **ungerundeten** Dauer. Wird eine Buchung ausgeschlossen, wird die
 * Gruppe **neu gerechnet** — vom Dienst, nicht hier — und der veränderte Wert
 * erscheint sofort. Bei 10, 20 und 5 Minuten fällt die Gruppe von 0,75 auf
 * 0,50, wenn man die mittlere herausnimmt. Das versteht man in einer Sekunde
 * und in keinem Handbuch.
 *
 * ## Jede Zahl kommt aus der Domäne
 *
 * Für jede Gruppe wird `POST /export/preview` mit genau ihren Buchungen
 * gerufen. Die Vorschau benutzt denselben Plan wie der Lauf (R-17), also
 * dieselbe Rundung (E-008 über die Tagessumme), dieselbe Zusammenführung der
 * Leistungstexte (E-026) und dieselbe Prüfung auf fehlende Leistung (E-034).
 * Die Oberfläche rundet nichts und gruppiert nur zur Anzeige nach derselben
 * Regel, nach der der Dienst gruppiert: Kalendertag des Timer**starts**
 * (E-025).
 *
 * ## Was geschrieben wird, steht vorher da (A-8.4, A-8.9, Befund C-02)
 *
 * S-14 prüft eine Vorlage, S-07 schreibt die Datei. Ein Bruch der
 * Notiz-Trennung (A-7.2, R-08) fiele hier zuerst auf.
 *
 * Jede aufgeklappte Gruppe zeigt deshalb denselben zweispaltigen Block wie
 * S-14 — „So steht es in der Datei" gegen „Feld für Feld", mit dem Satz zu
 * Base64 und dem Klartext der Leistung darunter. Es ist derselbe Baustein
 * (`ExportRowPanes`), nicht eine zweite Fassung: Zwei Fassungen wären genau
 * der Fehler, gegen den R-17 die Vorschau schützt.
 *
 * ## Eine Null, die „nicht gefragt" bedeutet, gibt es nicht mehr (A-8.6)
 *
 * `TotalsState` unterscheidet die vier Fälle, „Export ausführen" ist nur bei
 * `ready` freigegeben, und der Fehlschlag steht als Meldung mit einem Weg
 * zurück in der Ansicht. Das ist dieselbe Regel wie überall sonst in diesem
 * Screen: Eine geratene Zahl ist schlimmer als keine.
 *
 * ## Was ausgelassen wurde, steht danach da (E-034)
 *
 * `POST /export/runs` liefert im Erfolgsfall **auch** die ausgelassenen
 * Gruppen. Sie gehören in die Anzeige — sonst verschwindet Arbeitszeit
 * lautlos, weil eine Leistung fehlte.
 *
 * Vorgeschichte: `docs/decisions/export.md`.
 */

/** Was der geprüfte Ordnerzustand für den Benutzer bedeutet (R-11). */
const DIRECTORY_PROBLEM: Readonly<
  Record<Exclude<ExportDirectoryState, "ok">, { title: string; body: string }>
> = {
  not_set: {
    title: "Es ist kein Exportordner eingestellt",
    body: "Ohne Exportordner schreibt SuperTakt keine Datei. Wählen Sie ihn in den Einstellungen.",
  },
  missing: {
    title: "Der eingestellte Exportordner ist nicht da",
    body: "Er wurde verschoben, umbenannt oder liegt auf einem Laufwerk, das gerade nicht verbunden ist. SuperTakt legt ihn nicht von sich aus wieder an.",
  },
  not_writable: {
    title: "In den Exportordner lässt sich nicht schreiben",
    body: "Der Ordner ist da, aber die Rechte fehlen. Ein Lauf würde mitten im Vorgang scheitern — deshalb hält SuperTakt hier an.",
  },
  not_a_directory: {
    title: "Der eingestellte Pfad ist kein Ordner",
    body: "Er zeigt auf eine Datei. SuperTakt schreibt Exporte nur in einen Ordner.",
  },
  /*
   * T-039: „antwortet nicht" ist nicht „gibt es nicht". Der Dienst wartet drei
   * Sekunden; was danach kommt, ist **nicht als abwesend belegt**. Der
   * Unterschied führt zu verschiedenen Handgriffen — einen anderen Ordner
   * wählen oder das Laufwerk neu verbinden —, und deshalb steht er als
   * eigener Fall da und nicht unter `missing`.
   */
  unreachable: {
    title: "Der Exportordner antwortet nicht",
    body: "Die Prüfung hat drei Sekunden gewartet und keine Antwort bekommen. Das heißt nicht, dass es den Ordner nicht gibt — bei einem Netzlaufwerk heißt es meistens, dass die Verbindung fehlt. Verbinden Sie das Laufwerk neu, statt einen neuen Pfad einzutragen.",
  },
};

/**
 * Die Gesamtvorschau des Laufs — und ob es sie gibt (A-8.6, Befund aus T-044).
 *
 * Eine Null, die „ich konnte nicht fragen" bedeutet, ist keine Auskunft
 * darüber, welche Zeiten exportiert werden, sondern eine Behauptung über
 * etwas, das die Anwendung nicht weiß. A-8.6 verlangt das Gegenteil.
 * Vorgeschichte: `docs/decisions/export.md`.
 *
 * Vier Ausgänge, und die Ansicht beantwortet sie verschieden:
 *
 *   `idle`    — nichts ausgewählt. Die Null stimmt.
 *   `pending` — die Anfrage läuft. Es steht noch keine Zahl fest.
 *   `ready`   — die Zahlen kommen aus derselben Rechnung wie die Datei (R-17).
 *   `failed`  — es gibt keine Zahlen. Dann wird auch nicht geschrieben.
 *
 * Ausgelöst wird nur bei `ready`. Das ist die eigentliche Maßnahme: Wer die
 * Anzahl nicht kennt, darf sie auch nicht in eine Datei schreiben, in der
 * Arbeitszeit zu Geld wird.
 */
type TotalsState =
  | { readonly kind: "idle" }
  | { readonly kind: "pending" }
  | { readonly kind: "ready"; readonly value: ExportPreview }
  | { readonly kind: "failed"; readonly message: string };

export function ExportScreen() {
  const structure = useStructure();
  const toasts = useToasts();
  const { version, bump } = useRefresh();

  const [templateId, setTemplateId] = useState<string>("");
  const [excluded, setExcluded] = useState<ReadonlySet<Id>>(() => new Set());
  const [deselected, setDeselected] = useState<ReadonlySet<string>>(() => new Set());
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [layout, setLayout] = useState<readonly GroupLayout[]>([]);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [insights, setInsights] = useState<ReadonlyMap<string, GroupInsight>>(() => new Map());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ExportRunResult | null>(null);
  /**
   * Die Zahl der geschriebenen Zeilen, festgehalten aus der Vorschau, mit der
   * dieser Lauf ausgelöst wurde. Der Lauf selbst liefert sie nicht mit.
   */
  const [resultRows, setResultRows] = useState(0);
  const [runError, setRunError] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [totalsState, setTotalsState] = useState<TotalsState>({ kind: "idle" });
  /** Zählt Wiederholungsversuche der Gesamtvorschau. Nur dafür da. */
  const [totalsAttempt, setTotalsAttempt] = useState(0);

  /**
   * Die Vorschau, wenn es eine gibt — sonst `null`.
   *
   * Sie steht hier einmal, damit die Ansicht unten nicht an sechs Stellen
   * `totalsState.kind === "ready"` schreibt. Wer eine **Zahl** zeigen will,
   * nimmt sie; wer über den **Zustand** entscheidet, nimmt `totalsState`.
   */
  const totals = totalsState.kind === "ready" ? totalsState.value : null;

  const structureValue = structure.state.status === "ready" ? structure.state.value : null;
  const settings = structureValue?.settings ?? null;
  const directoryState = structureValue?.exportDirectoryState ?? null;
  /* T-039 — was am Ordner belegt ist, an der Stelle, an der geschrieben wird. */
  const directoryTraits = structureValue?.exportDirectoryTraits ?? [];
  /*
   * C-20 — der Name, der gleich in jede Zeile der Datei geht (E-010, E-042).
   *
   * Er steht hier und nicht nur in S-09, weil das hier der Augenblick ist, in
   * dem es darauf ankommt: Ein Name, den man erst hinterher prüfen kann,
   * prüft niemand. Vorgeschichte: `docs/decisions/export.md`.
   */
  const billingUser = structureValue?.windowsUser.trim() ?? "";

  const data = useAsync(async () => {
    const [entries, todos, runs] = await Promise.all([
      collectOpenEntries(),
      listTodos({}, { limit: PAGE_SIZE }),
      listExportRuns({ limit: 5 }),
    ]);
    const titles = new Map<Id, Todo>();
    for (const todo of todos.items) titles.set(todo.id, todo);
    const byId = new Map<Id, TimeEntry>();
    for (const entry of entries) byId.set(entry.id, entry);
    return { entries, byId, titles, runs: runs.items };
  }, [], [version]);

  /*
   * Kennungen als Zeichenkette in den Abhängigkeiten und nicht als Feld: Ein
   * neues Feld mit demselben Inhalt löste sonst bei jeder eintreffenden Antwort
   * eine weitere Anfrage aus.
   */
  const allKey = useMemo(
    () =>
      data.state.status === "ready" ? data.state.value.entries.map((entry) => entry.id).join(",") : "",
    [data.state],
  );

  const activeTemplateId = templateId.length > 0 ? templateId : (settings?.activeExportTemplateId ?? null);

  /**
   * **Ein** Aufruf für die Gliederung. Er liefert, welche Tagesgruppen es gibt
   * und welche Buchungen in jeder stecken — beides aus der Domäne, nicht aus
   * einer Rechnung hier.
   *
   * Die Gliederung entsteht über **alle** geladenen Buchungen, ohne
   * Berücksichtigung der Ausschlüsse. Sonst verschwände eine Gruppe aus der
   * Liste, sobald man ihre letzte Buchung abwählt — und mit ihr der Weg zurück.
   */
  useEffect(() => {
    if (allKey.length === 0) {
      setLayout([]);
      setLayoutError(null);
      return;
    }
    let live = true;
    void previewExport(activeTemplateId, allKey.split(","))
      .then((preview) => {
        if (!live) return;
        setLayout(toLayout(preview));
        setLayoutError(null);
      })
      .catch((cause: unknown) => {
        if (!live) return;
        setLayout([]);
        setLayoutError(errorMessage(cause));
      });
    return () => {
      live = false;
    };
  }, [allKey, activeTemplateId]);

  const includedKey = useMemo(
    () =>
      allKey.length === 0
        ? ""
        : allKey
            .split(",")
            .filter((id) => !excluded.has(id))
            .join(","),
    [allKey, excluded],
  );

  /**
   * **Ein** Aufruf für die Werte. Er rechnet dieselbe Gliederung noch einmal,
   * diesmal ohne die ausgeschlossenen Buchungen — und genau daran wird die
   * Rundung sichtbar (E-031): Bei 10, 20 und 5 Minuten fällt die Gruppe von
   * 0,75 auf 0,50, sobald die mittlere herausfällt.
   */
  useEffect(() => {
    if (layout.length === 0) {
      setInsights(new Map());
      return;
    }
    if (includedKey.length === 0) {
      setInsights(new Map(layout.map((group) => [group.key, ALL_EXCLUDED])));
      return;
    }
    let live = true;
    void previewExport(activeTemplateId, includedKey.split(","))
      .then((preview) => {
        if (!live) return;
        const next = new Map<string, GroupInsight>();
        for (const group of preview.groups) {
          next.set(groupKeyOf(group.todoId, group.day), {
            quarters: group.quarters,
            blockedReason: null,
          });
        }
        for (const skipped of preview.skipped) {
          next.set(groupKeyOf(skipped.group.todoId, skipped.group.day), {
            quarters: null,
            blockedReason: reasonText(skipped.reason),
          });
        }
        // Eine Gruppe, deren Buchungen alle abgewählt sind, kommt gar nicht
        // zurück — sie steht trotzdem in der Liste und braucht ihren Grund.
        for (const group of layout) {
          if (!next.has(group.key)) next.set(group.key, ALL_EXCLUDED);
        }
        setInsights(next);
      })
      .catch((cause: unknown) => {
        if (!live) return;
        const message = errorMessage(cause);
        setInsights(
          new Map(layout.map((group) => [group.key, { quarters: null, blockedReason: message }])),
        );
      });
    return () => {
      live = false;
    };
  }, [layout, includedKey, activeTemplateId]);

  /** Die Buchungen, die tatsächlich in den Lauf gehen. */
  const selectedIds = useMemo<readonly Id[]>(() => {
    const out: Id[] = [];
    for (const group of layout) {
      if (deselected.has(group.key)) continue;
      const insight = insights.get(group.key);
      if (insight !== undefined && insight.blockedReason !== null) continue;
      out.push(...group.entryIds.filter((id) => !excluded.has(id)));
    }
    return out;
  }, [layout, deselected, insights, excluded]);

  /*
   * Die Auswahl steht als Zeichenkette in den Abhaengigkeiten und nicht als
   * Feld: Ein neues Feld mit demselben Inhalt loeste sonst bei jeder
   * eintreffenden Gruppenvorschau eine weitere Gesamtvorschau aus.
   */
  const selectedKey = useMemo(() => selectedIds.join(","), [selectedIds]);

  useEffect(() => {
    const ids = selectedKey.length === 0 ? [] : selectedKey.split(",");
    if (ids.length === 0) {
      setTotalsState({ kind: "idle" });
      return;
    }
    let live = true;
    setTotalsState({ kind: "pending" });
    void previewExport(activeTemplateId, ids)
      .then((preview) => {
        if (live) setTotalsState({ kind: "ready", value: preview });
      })
      .catch((cause: unknown) => {
        if (live) setTotalsState({ kind: "failed", message: errorMessage(cause) });
      });
    return () => {
      live = false;
    };
  }, [selectedKey, activeTemplateId, totalsAttempt]);

  /*
   * Verlässt die Vorschau den Zustand „ready", verschwindet die Rückfrage —
   * und zwar wirklich, nicht nur vom Bildschirm. Bliebe `confirmOpen` stehen,
   * käme der Dialog nach dem nächsten geglückten Abruf von selbst wieder,
   * ohne dass jemand ihn erneut angefordert hätte.
   */
  useEffect(() => {
    if (totalsState.kind !== "ready") setConfirmOpen(false);
  }, [totalsState.kind]);

  const templates = useAsync(() => listExportTemplates(), [], [version]);

  /*
   * Die Auswahlliste des Dienstes (E-049). Sie beschriftet Quelle und
   * Umformung in der Spalte „Feld für Feld" — dieselbe Liste, die auch S-14
   * benutzt, damit dasselbe Feld hier und dort denselben Namen trägt.
   *
   * Sie hängt nicht an `version`: Die Liste des Dienstes ändert sich nicht,
   * wenn der Benutzer eine Buchung bearbeitet.
   */
  const sources = useAsync(async () => readSourceCatalog(await getExportSources()), []);

  const catalog: SourceCatalog | null =
    sources.state.status === "ready" ? sources.state.value : null;

  /**
   * Die Felder der **gespeicherten** Vorlage, mit der dieser Lauf rechnet.
   *
   * Gelesen wird streng (`parseTemplateDefinition`): Eine Vorlage, die sich
   * hier nicht lesen lässt, würde der Motor beim Lauf ebenfalls abweisen.
   * Halb angezeigt wäre sie eine Vorlage, die es so nicht gibt.
   */
  const templateFields = useMemo<TemplateFieldsResult>(() => {
    // Ohne die Auswahlliste des Dienstes ist die Vorlage nicht lesbar, und das
    // ist ein Fehlschlag und kein Warten. Ein Ladeanzeiger, der nie endet,
    // wäre an dieser Stelle eine Falschauskunft.
    if (sources.state.status === "error") {
      return {
        kind: "failed",
        message: `Die Auswahlliste der Quellen ließ sich nicht laden: ${sources.state.message}`,
      };
    }
    if (templates.state.status === "error") {
      return {
        kind: "failed",
        message: `Die Exportvorlagen ließen sich nicht laden: ${templates.state.message}`,
      };
    }
    if (catalog === null) return { kind: "pending" };
    if (templates.state.status !== "ready") return { kind: "pending" };
    const template = templates.state.value.find(
      (candidate) => candidate.id === activeTemplateId,
    );
    if (template === undefined) return { kind: "unknown" };
    const parsed = parseTemplateDefinition(template.definition, catalog);
    return parsed.ok
      ? { kind: "ready", fields: parsed.value.fields }
      : { kind: "failed", message: parsed.message };
  }, [catalog, sources.state, templates.state, activeTemplateId]);

  /**
   * Die Zeile je Tagesgruppe: `totals.groups[i]` gehört zu `totals.rows[i]`.
   *
   * Die Zuordnung kommt aus derselben Antwort und wird hier nicht gebildet —
   * welcher Kalendertag zu einer Buchung gehört, entscheidet E-025 und nicht
   * diese Ansicht.
   */
  const rowByGroup = useMemo<ReadonlyMap<string, ExportRow>>(() => {
    const out = new Map<string, ExportRow>();
    if (totals === null) return out;
    for (const [index, group] of totals.groups.entries()) {
      const row = totals.rows[index];
      if (row !== undefined) out.set(groupKeyOf(group.todoId, group.day), row);
    }
    return out;
  }, [totals]);

  /*
   * Der Ordner wird vom Dienst **jetzt** geprüft und nicht beim Einstellen
   * (R-11): Er ist Benutzereingabe und kann zwischen zwei Läufen verschwinden
   * oder schreibgeschützt werden. Deshalb steht hier der gemeldete Zustand und
   * nicht die Frage, ob ein Pfad gesetzt ist.
   */
  const directoryProblem =
    directoryState === null || directoryState === "ok" ? null : DIRECTORY_PROBLEM[directoryState];

  /*
   * Dieselbe Beurteilung wie in S-09, an der Stelle, an der die Datei
   * entsteht. Eine Warnung, die nur in den Einstellungen steht, sieht beim
   * Exportieren niemand — und B-5.2 Punkt 2 verlangt sie fuer genau diesen
   * Moment. Sie sperrt hier nichts: Der Ordner ist bereits gespeichert und
   * bestaetigt; hier steht sie als Gedaechtnis.
   */
  const directoryAdvice = useMemo(
    () => adviseExportDirectory(settings?.exportDirectory ?? ""),
    [settings?.exportDirectory],
  );

  /**
   * Ist dies der erste Lauf in genau diesen Ordner? (B-6.1 Punkt 2)
   *
   * Beantwortet aus den zuletzt geladenen Läufen — das sind fünf, nicht alle.
   * Die Frage ist damit **großzügig zugunsten der Rückfrage** beantwortet: Wer
   * lange nicht in diesen Ordner exportiert hat, bekommt sie noch einmal. Das
   * ist der richtige Fehler von beiden; die Gegenrichtung wäre eine
   * Bestätigung, die ausbleibt, weil eine Liste zu kurz war.
   *
   * `null` heißt: noch nicht entscheidbar (Läufe laden, kein Ordner gesetzt).
   * Dann wird nicht gefragt, weil eine Rückfrage auf Verdacht keine ist.
   */
  const firstRunIntoDirectory = useMemo<boolean | null>(() => {
    const target = settings?.exportDirectory ?? null;
    if (target === null || target.trim().length === 0) return null;
    if (data.state.status !== "ready") return null;
    return !data.state.value.runs.some((run) => isPathInsideDirectory(run.filePath, target));
  }, [data.state, settings?.exportDirectory]);

  const doExport = useCallback(() => {
    /*
      Ohne bekannte Zeilenzahl wird nicht geschrieben. Die Schaltfläche ist in
      diesem Fall gesperrt und der Dialog gar nicht offen; der Riegel steht
      hier trotzdem noch einmal, weil er die Bedingung ist, unter der der
      folgende Aufruf überhaupt eine ehrliche Rückmeldung geben kann.
    */
    if (totalsState.kind !== "ready") return;
    const plannedRows = totalsState.value.rows.length;
    setRunning(true);
    setRunError(null);
    void runExport(activeTemplateId, selectedIds)
      .then((outcome) => {
        setResult(outcome);
        setResultRows(plannedRows);
        setConfirmOpen(false);
        bump();
        if (outcome.skipped.length === 0) {
          toasts.success(
            "Export geschrieben.",
            `${plural(outcome.run.entryCount, "Buchung", "Buchungen")} in ${plural(plannedRows, "Exportzeile", "Exportzeilen")} · ${formatQuarters(outcome.run.totalQuarters)} Stunden.`,
          );
        } else {
          toasts.show({
            tone: "warning",
            title: "Export geschrieben — mit ausgelassenen Gruppen.",
            body: `${plural(outcome.skipped.length, "Tagesgruppe blieb", "Tagesgruppen blieben")} stehen, weil die Leistung fehlt. Sie sind weiterhin offen und erscheinen beim nächsten Mal wieder.`,
          });
        }
      })
      .catch((cause: unknown) => setRunError(errorMessage(cause)))
      .finally(() => setRunning(false));
  }, [activeTemplateId, bump, selectedIds, toasts, totalsState]);

  return (
    <section className="screen">
      <ScreenHeader
        title="Export"
        lead="Eine Zeile je Todo und Kalendertag. Was hier steht, steht auch in der Datei."
        refreshing={data.state.status === "ready" && data.state.refreshing}
        /*
          Gesperrt, solange nicht feststeht, was geschrieben würde (A-8.6). Bis
          T-045 blieb der Lauf auslösbar, wenn die Gesamtvorschau fehlschlug —
          mit „0 Exportzeilen" im Bestätigungsdialog.
        */
        actions={
          <Button
            variant="primary"
            iconStart="download"
            disabled={
              selectedIds.length === 0 ||
              directoryProblem !== null ||
              totalsState.kind !== "ready"
            }
            title={
              totalsState.kind === "failed"
                ? "Solange die Gesamtvorschau fehlt, steht nicht fest, was geschrieben würde."
                : totalsState.kind === "pending"
                  ? "Die Gesamtvorschau wird gerade gerechnet."
                  : undefined
            }
            onClick={() => {
              setRunError(null);
              setConfirmOpen(true);
            }}
          >
            Export ausführen
          </Button>
        }
      >
        <ExportTabs active="export" />
      </ScreenHeader>

      {directoryProblem === null ? null : (
        <InlineMessage
          tone="warning"
          title={directoryProblem.title}
          className="message--inline-action"
          action={
            <Button size="sm" variant="secondary" onClick={() => navigate("settings", undefined, { bereich: "export" })}>
              In den Einstellungen prüfen
            </Button>
          }
        >
          {directoryProblem.body}
        </InlineMessage>
      )}

      {result === null ? null : (
        <RunResult result={result} rowCount={resultRows} onDismiss={() => setResult(null)} />
      )}

      <Card
        title="Vorlage und Rundung"
        description="Beides bestimmt, was in der Datei steht — und wie viel abgerechnet wird."
        actions={
          <Button
            size="sm"
            variant="secondary"
            iconStart="pencil"
            onClick={() => navigate("templates", activeTemplateId ?? undefined)}
          >
            Vorlagen bearbeiten
          </Button>
        }
      >
        <div className="export-settings">
          {/*
            Diese Ansicht rechnet und schreibt mit der **gespeicherten**
            Vorlage, weil der Lauf sie nimmt. Wer im Vorlageneditor gerade an
            einem ungespeicherten Entwurf arbeitet, sieht dort etwas anderes
            als hier — und der Satz steht an der Auswahl, die es betrifft.
            Vorgeschichte: `docs/decisions/export.md`.
          */}
          <div className="export-settings__fact">
            <div className="export-settings__label"><span>Exportvorlage</span><InfoHint label="Hinweis zur Exportvorlage">
              Gezeigt und geschrieben wird der <strong>gespeicherte</strong> Stand dieser Vorlage.
              Ein Entwurf, der im Vorlageneditor noch nicht gespeichert ist, wirkt hier nicht mit.
            </InfoHint></div>
            <Select
              hideLabel
              label="Exportvorlage"
              value={activeTemplateId ?? ""}
              onChange={setTemplateId}
              options={
                templates.state.status === "ready"
                  ? templates.state.value.map((template) => ({
                      value: template.id,
                      label: template.isBuiltin
                    ? `${foreignText(template.name)} (mitgeliefert)`
                    : foreignText(template.name),
                    }))
                  : [{ value: "", label: "wird geladen …" }]
              }
            />
          </div>
          <div className="export-settings__fact">
            <span className="export-settings__label"><span className="overline">Rundung</span><InfoHint label="Hinweis: Rundung">
              Auf die nächste Viertelstunde, mindestens 0,25 — angewandt auf die Summe der
              Tagesgruppe, nicht auf die einzelne Buchung.
            </InfoHint></span>
            <strong>
              {settings === null ? "—" : ROUNDING_MODE_LABEL[settings.roundingMode]}
            </strong>
          </div>
          <div className="export-settings__fact">
            <span className="export-settings__label"><span className="overline">Exportordner</span><InfoHint label="Hinweis: Exportordner">
              {directoryState === "ok"
                ? "Vorhanden und beschreibbar — soeben geprüft."
                : (directoryProblem?.title ?? "Zustand unbekannt.")}
            </InfoHint></span>
            <strong className="mono truncate" title={settings?.exportDirectory ?? undefined}>
              {settings?.exportDirectory ?? "nicht gewählt"}
            </strong>
            <Button
              size="sm"
              variant="primary"
              iconStart="folder-open"
              onClick={() => navigate("settings", undefined, { bereich: "export" })}
            >
              Ordner ändern
            </Button>
          </div>
          <div className="export-settings__fact">
            <span className="export-settings__label"><span className="overline">Abgerechnet unter</span><InfoHint label="Hinweis: Abgerechnet unter">
              {billingUser.length === 0
                ? "Der Dienst nennt keinen Benutzernamen. In der Datei steht trotzdem einer — welcher, zeigt danach das Exportprotokoll."
                : "Dieser Name steht in jeder Zeile der Datei. SuperTakt bekommt ihn vom Betriebssystem; über keine Einstellung lässt er sich ändern."}
            </InfoHint></span>
            <strong className="mono truncate" title={billingUser.length === 0 ? undefined : billingUser}>
              {billingUser.length === 0 ? "kein Name gemeldet" : billingUser}
            </strong>
          </div>
        </div>

        {/*
          B-6.1 Punkt 1 verlangt diesen Satz ausdrücklich „nicht in einem
          Hilfetext, sondern in der Ansicht" — und zwar neben dem Exportziel.
          Hier ist die Ansicht, in der die Datei entsteht.
        */}
        <Base64Notice className="export-settings__base64" />

        <ExportDirectoryConcernList concerns={directoryAdvice.concerns} />

        {/*
          T-039: Was das Betriebssystem über den Ordner sagt — und was es
          nicht sagt. Dieselbe Auskunft wie in S-09, an der Stelle, an der die
          Datei entsteht. Eine Warnung, die nur in den Einstellungen steht,
          sieht beim Exportieren niemand.
        */}
        <ExportDirectoryTraitList traits={directoryTraits} state={directoryState} />
      </Card>

      <AsyncBoundary
        state={data.state}
        label="Offene Buchungen werden geladen"
        rows={6}
        onRetry={data.reload}
      >
        {(value) => {
          if (layoutError !== null) {
            return (
              <InlineMessage
                tone="danger"
                title="Die Gliederung ließ sich nicht abrufen"
                action={
                  <Button size="sm" variant="secondary" iconStart="rotate-ccw" onClick={data.reload}>
                    Erneut versuchen
                  </Button>
                }
              >
                {layoutError} Solange die Gliederung fehlt, wird nichts zur Auswahl gestellt — eine
                geratene Zeilenzahl wäre schlimmer als keine.
              </InlineMessage>
            );
          }

          if (layout.length === 0) {
            return (
              <EmptyState
                icon="check-circle"
                title="Nichts zu exportieren"
                description="Alle erfassten Zeiten sind bereits exportiert. Neue Buchungen erscheinen hier von selbst."
                action={
                  <Button variant="secondary" iconStart="clock" onClick={() => navigate("time")}>
                    Zur Zeiterfassung
                  </Button>
                }
              />
            );
          }

          const models = layout.map<ExportGroupViewModel>((group) => {
            const todo = value.titles.get(group.todoId);
            const insight = insights.get(group.key);
            const entries = group.entryIds
              .map((id) => value.byId.get(id))
              .filter((entry): entry is TimeEntry => entry !== undefined)
              .sort((left, right) => left.startedAt.localeCompare(right.startedAt));
            const included = entries.filter((entry) => !excluded.has(entry.id));

            const groupData: ExportGroupData = {
              id: group.key,
              todoId: group.todoId,
              todoTitle: todo?.title ?? "Unbekanntes Todo",
              callNumber: todo?.callNumber ?? null,
              day: formatDayLabel(group.day),
              entries: entries.map((entry) => ({
                id: entry.id,
                period: formatTimeRange(entry.startedAt, entry.endedAt),
                duration: formatDuration(entry.durationSeconds),
                source: entry.source,
                note: entry.note,
                exportCount: entry.exportCount,
              })),
            };

            return {
              group: groupData,
              excludedEntryIds: new Set(
                entries.filter((entry) => excluded.has(entry.id)).map((entry) => entry.id),
              ),
              // Beim Nachrechnen bleibt der bisherige Wert stehen. Ein Feld,
              // das bei jedem Klick auf „…" springt, laesst den Vergleich
              // vorher/nachher nicht zu — und genau der ist der Sinn (E-031).
              quarters:
                insight === undefined
                  ? "…"
                  : insight.quarters !== null
                    ? formatQuarters(insight.quarters)
                    : "—",
              mergedNote: previewNote(included),
              blockedReason: insight?.blockedReason ?? null,
            };
          });

          const selectedGroupIds = new Set(
            layout.map((group) => group.key).filter((key) => !deselected.has(key)),
          );

          const rowCount = totals?.rows.length ?? 0;
          const blockedCount = models.filter((model) => model.blockedReason !== null).length;

          return (
            <>
              {/*
                Der Fehlschlag der Gesamtvorschau steht als Meldung da, mit
                einem Weg zurück — nicht als Null in der Zusammenfassung
                (A-8.6). Sie ist zugleich die sichtbare Begründung dafür, dass
                „Export ausführen" gesperrt ist: Eine gesperrte Schaltfläche
                ohne Grund daneben ist eine Sackgasse.
              */}
              {totalsState.kind === "failed" ? (
                <InlineMessage
                  tone="danger"
                  title="Die Gesamtvorschau ließ sich nicht abrufen"
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      iconStart="rotate-ccw"
                      onClick={() => setTotalsAttempt((attempt) => attempt + 1)}
                    >
                      Erneut versuchen
                    </Button>
                  }
                >
                  {totalsState.message} Solange sie fehlt, weiß SuperTakt nicht, wie viele Zeilen
                  und wie viele Stunden dieser Lauf schreiben würde — deshalb ist „Export
                  ausführen" gesperrt. Eine Null an dieser Stelle wäre keine Auskunft, sondern
                  eine Behauptung. Die Auswahl darunter bleibt erhalten.
                </InlineMessage>
              ) : null}

              <div className="export-summary" role="status" aria-live="polite">
                <span className="export-summary__count">
                  {plural(selectedIds.length, "Buchung", "Buchungen")}
                  {totalsState.kind === "ready"
                    ? ` in ${plural(rowCount, "Exportzeile", "Exportzeilen")}`
                    : null}
                </span>
                {totalsState.kind === "pending" ? (
                  <span className="export-summary__pending">
                    <Spinner size={13} label="Zeilen und Stunden werden gerechnet" />
                    <span>Zeilen und Stunden werden gerechnet …</span>
                  </span>
                ) : null}
                {totalsState.kind === "failed" ? (
                  <span className="export-summary__danger">
                    <Icon name="alert-triangle" size={14} />
                    Zeilen und Stunden unbekannt — die Vorschau hat nicht geantwortet
                  </span>
                ) : null}
                <span className="export-summary__total tabular">
                  {totals === null ? "—" : formatQuarters(totals.totalQuarters)}
                  <span className="export-summary__unit"> h</span>
                </span>
                {totals !== null && totals.previouslyExportedCount > 0 ? (
                  <span className="export-summary__warn">
                    <Icon name="rotate-ccw" size={14} />
                    {plural(
                      totals.previouslyExportedCount,
                      "Zeile enthält eine schon einmal exportierte Buchung",
                      "Zeilen enthalten schon einmal exportierte Buchungen",
                    )}
                  </span>
                ) : null}
                {blockedCount > 0 ? (
                  <span className="export-summary__warn">
                    <Icon name="alert-triangle" size={14} />
                    {plural(blockedCount, "Gruppe bleibt stehen", "Gruppen bleiben stehen")} —
                    ohne Leistung kein Export
                  </span>
                ) : null}
              </div>

              {blockedCount > 0 ? (
                <details className="export-legend">
                  <summary><Icon name="info" size={14} /><span>Legende</span><Icon name="chevron-down" size={12} /></summary>
                  <p><strong>Leistung fehlt:</strong> Leistungstext in einer Buchung ergänzen.</p>
                  <p><strong>Alle Buchungen ausgeschlossen:</strong> Mindestens eine Buchung auswählen.</p>
                  <p>Betroffene Gruppen bleiben offen; der übrige Export läuft weiter.</p>
                </details>
              ) : null}

              <ExportGroupList
                models={models}
                selectedGroupIds={selectedGroupIds}
                expandedGroupIds={expanded}
                onToggleGroup={(groupId) =>
                  setDeselected((previous) => {
                    const next = new Set(previous);
                    if (next.has(groupId)) next.delete(groupId);
                    else next.add(groupId);
                    return next;
                  })
                }
                onToggleExpanded={(groupId) =>
                  setExpanded((previous) => {
                    const next = new Set(previous);
                    if (next.has(groupId)) next.delete(groupId);
                    else next.add(groupId);
                    return next;
                  })
                }
                onToggleEntry={(_groupId, entryId) =>
                  setExcluded((previous) => {
                    const next = new Set(previous);
                    if (next.has(entryId)) next.delete(entryId);
                    else next.add(entryId);
                    return next;
                  })
                }
                onEditEntry={(_groupId, entryId) => {
                  const entry = value.entries.find((candidate) => candidate.id === entryId);
                  if (entry !== undefined) setEditEntry(entry);
                }}
                renderRowDetail={(groupId) => (
                  <GroupRowDetail
                    row={rowByGroup.get(groupId) ?? null}
                    deselected={deselected.has(groupId)}
                    blocked={(insights.get(groupId)?.blockedReason ?? null) !== null}
                    template={templateFields}
                    catalog={catalog}
                  />
                )}
              />

              <ExportRunList runs={value.runs} />
            </>
          );
        }}
      </AsyncBoundary>

      {/*
        Der einmalige Hinweis beim ersten Lauf in einen neu gewählten Ordner
        (B-6.1 Punkt 2) hängt am Kontrollkästchen und nicht an einem zweiten
        Dialog: Zwei Rückfragen hintereinander werden zu einer Handbewegung,
        und die zweite hat dann niemand gelesen.
      */}
      {/*
        Der Dialog entsteht erst, wenn die Zahlen feststehen. Er zieht sie
        deshalb aus `totalsState.value` und nicht aus einem `?? 0` — genau
        dieses `?? 0` war der Satz „0 Exportzeilen — Stunden", der behauptete,
        es gebe nichts zu exportieren, während die Anwendung es nicht wusste
        (A-8.6). Kein Rückfall mehr, sondern eine Bedingung.
      */}
      {totalsState.kind === "ready" ? (
        <ConfirmDialog
          open={confirmOpen}
          title="Export ausführen?"
          description={`${plural(selectedIds.length, "Buchung wird", "Buchungen werden")} in ${plural(totalsState.value.rows.length, "Exportzeile", "Exportzeilen")} geschrieben — zusammen ${formatQuarters(totalsState.value.totalQuarters)} Stunden.`}
          consequence={
            runError ??
            "Die Datei wird geschrieben und jede enthaltene Buchung als exportiert markiert — beides zusammen oder gar nichts. Danach sind diese Buchungen gesperrt; ändern lassen sie sich erst nach dem ausdrücklichen Zurücksetzen des Exportstatus."
          }
          {...(firstRunIntoDirectory === true
            ? {
                acknowledgeLabel: `Mir ist bewusst: Die Datei landet in ${settings?.exportDirectory ?? "diesem Ordner"} und enthält lesbare Kundennotizen. Base64 ist eine Kodierung, keine Verschlüsselung.`,
              }
            : {})}
          confirmLabel="Exportieren"
          busy={running}
          onConfirm={doExport}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}

      {editEntry === null ? null : (
        <BookingFormDialog
          open
          entry={editEntry}
          todoId={editEntry.todoId}
          todoTitle={
            data.state.status === "ready"
              ? (data.state.value.titles.get(editEntry.todoId)?.title ?? "diesem Todo")
              : "diesem Todo"
          }
          onClose={() => setEditEntry(null)}
        />
      )}

      {templates.state.status === "loading" ? <Spinner size={14} label="Vorlagen werden geladen" /> : null}
    </section>
  );
}
