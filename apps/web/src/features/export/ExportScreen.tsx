
import { FilterBar, FilterToggle, SearchField, type ActiveFilter } from "../../shared/ui/FilterBar";
import { DateField } from "../../shared/ui/DateField";
import { todayCalendarDay, shiftCalendarDay } from "../../lib/format";
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";
import { errorMessage, isServiceError } from "../../api/client";
import {
  listExportTemplates,
  previewExport,
  getExportSources,
  listExportRuns,
  runExport,
  type ExportRunResult,
} from "./api";
import {
  listTodos,
} from "../todos/api";
import type {
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
import { InfoHint } from "../../shared/ui/InfoHint";
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
import { labels } from "../../lib/labels";
import { useLanguage } from "../../lib/language";
import { ServiceText } from "../../shared/ui/ServiceText";
import { exportTexts } from "./texts";
import {
  formatDayLabel,
  formatDuration,
  formatQuarters,
  formatTimeRange,
  plural,
} from "../../lib/format";
import { AsyncBoundary } from "../../shared/ui/AsyncBoundary";
import { ScreenBody } from "../../shared/ui/ScreenBody";
import { ScreenHeader } from "../../shared/ui/ScreenHeader";
import { ExportTabs } from "./ExportTabs";
import { GroupRowDetail, type TemplateFieldsResult } from "./GroupRowDetail";
import { ExportRunList } from "./ExportRunList";
import { RunResult } from "./RunResult";
import {
  allExcluded,
  collectExportEntries,
  groupKeyOf,
  PAGE_SIZE,
  previewNote,
  reasonText,
  toLayout,
  toExportedLayout,
  type GroupInsight,
  type GroupLayout,
} from "./exportGroupLayout";
import { useBookingRowActions } from "../bookings/BookingRowActions";
import { bookingTexts } from "../bookings/texts";
import { foreignText } from "../../lib/foreign";
import { Menu } from "../../shared/ui/Menu";

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
  | { readonly kind: "ready"; readonly value: ExportPreview; readonly selection: string; readonly templateId: string | null }
  | { readonly kind: "failed"; readonly message: string; readonly fromService: boolean };

export function ExportScreen({ query = {} }: { readonly query?: Readonly<Record<string, string>> }) {
  const structure = useStructure();
  const toasts = useToasts();
  const { version, bump } = useRefresh();
  const language = useLanguage();
  const text = exportTexts();

  const [status, setStatus] = useState(query["status"] ?? "open");
  const [expandedTodoGroups, setExpandedTodoGroups] = useState<ReadonlySet<string>>(() => new Set());
  const [todoId, setTodoId] = useState(query["todo"] ?? "");
  const [fromDay, setFromDay] = useState(() => query["von"] ?? shiftCalendarDay(todayCalendarDay(), -6));
  const [toDay, setToDay] = useState(() => query["bis"] ?? todayCalendarDay());
  const [onlyPrevious, setOnlyPrevious] = useState(query["vorher"] === "1");
  const [todoSearch, setTodoSearch] = useState(query["suche"] ?? "");
  // C-14: tag, pool and "has Leistung", filtered in the service before paging (E-124 point 5).
  const [tagFilter, setTagFilter] = useState(query["tag"] ?? "");
  const [poolFilter, setPoolFilter] = useState(query["pool"] ?? "");
  const [noteFilter, setNoteFilter] = useState<"" | "vorhanden" | "fehlt">(
    query["leistung"] === "vorhanden" || query["leistung"] === "fehlt" ? query["leistung"] : "",
  );
  const filterKey = JSON.stringify([status, todoId, fromDay, toDay, onlyPrevious, todoSearch.trim(), tagFilter, poolFilter, noteFilter]);
  const activeFilters: ActiveFilter[] = [];
  if (todoId) activeFilters.push({ id: "todo", field: text.filterTodo, value: text.restricted, onRemove: () => setTodoId("") });
  if (fromDay) activeFilters.push({ id: "from", field: text.filterFrom, value: fromDay, onRemove: () => setFromDay("") });
  if (toDay) activeFilters.push({ id: "to", field: text.filterTo, value: toDay, onRemove: () => setToDay("") });
  if (onlyPrevious) activeFilters.push({ id: "previous", field: text.narrowing, value: text.exportedBefore, onRemove: () => setOnlyPrevious(false) });
  if (todoSearch.trim()) activeFilters.push({ id: "search", field: text.filterTodo, value: todoSearch.trim(), onRemove: () => setTodoSearch("") });
  const tagOptions = structure.allTags.map((info) => ({
    value: info.tag.id,
    // Each name treated on its own (O-AT): a joined row of foreign text would lose its origin.
    label: [...info.path, info.tag.name].map(foreignText).join(" › "),
  }));
  const poolOptions = structure.state.status === "ready" ? structure.state.value.pools : [];
  // A link may name a deleted tag or pool: the chip says so instead of dropping it (8.2).
  if (tagFilter) activeFilters.push({ id: "tag", field: text.filterTag, value: tagOptions.find((option) => option.value === tagFilter)?.label ?? text.filterGone, onRemove: () => setTagFilter("") });
  if (poolFilter) activeFilters.push({ id: "pool", field: text.filterPool, value: poolOptions.find((pool) => pool.id === poolFilter)?.name ?? text.filterGone, onRemove: () => setPoolFilter("") });
  if (noteFilter) activeFilters.push({ id: "note", field: text.filterNote, value: noteFilter === "fehlt" ? text.noteAbsent : text.notePresent, onRemove: () => setNoteFilter("") });
  const resetFilters = () => { setStatus(""); setTodoId(""); setFromDay(""); setToDay(""); setOnlyPrevious(false); setTodoSearch(""); setTagFilter(""); setPoolFilter(""); setNoteFilter(""); };

  // `null` follows the saved setting; "" is an explicit choice of the built-in template.
  const [templateChoice, setTemplateChoice] = useState<string | null>(null);
  const [bookingSelection, setBookingSelection] = useState<ReadonlySet<Id> | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [layout, setLayout] = useState<readonly GroupLayout[]>([]);
  const [layoutError, setLayoutError] = useState<{ readonly message: string; readonly fromService: boolean } | null>(null);
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
      collectExportEntries({
        ...(status === "open" || status === "exported" ? { exportStatus: status } : {}),
        ...(todoId ? { todoId } : {}),
        ...(fromDay ? { fromDay } : {}),
        ...(toDay ? { toDay } : {}),
        ...(onlyPrevious ? { onlyPreviouslyExported: true } : {}),
        ...(tagFilter ? { tagIds: [tagFilter] } : {}),
        ...(poolFilter ? { poolIds: [poolFilter] } : {}),
        ...(noteFilter ? { hasNote: noteFilter === "vorhanden" } : {}),
      }),
      listTodos(todoSearch.trim() ? { search: todoSearch.trim() } : {}, { limit: PAGE_SIZE }),
      listExportRuns({ limit: 5 }),
    ]);
    const titles = new Map<Id, Todo>();
    for (const todo of todos.items) titles.set(todo.id, todo);
    const byId = new Map<Id, TimeEntry>();
    for (const entry of entries) byId.set(entry.id, entry);
    const search = todoSearch.trim().toLocaleLowerCase();
    const matchingEntries = search === "" ? entries : entries.filter(entry => {
      const todo = titles.get(entry.todoId);
      return (todo?.title.toLocaleLowerCase().includes(search) ?? false)
        || (todo?.callNumber?.toLocaleLowerCase().includes(search) ?? false);
    });
    return { entries: matchingEntries, byId, titles, runs: runs.items, filterKey };
  }, [filterKey], [version]);
  const rowActions = useBookingRowActions((entry) =>
    data.state.status === "ready"
      ? (data.state.value.titles.get(entry.todoId)?.title ?? text.thisTodo)
      : text.thisTodo,
  );
  const filterReady = data.state.status === "ready" && data.state.value.filterKey === filterKey;
  const exportedLayout = useMemo(
    () => data.state.status === "ready" && filterReady && status !== "open"
      ? toExportedLayout(data.state.value.entries.filter((entry) => entry.exportStatus === "exported"))
      : [],
    [data.state, filterReady, status],
  );
  const displayLayout = useMemo(
    () => status === "exported" ? exportedLayout : [...layout, ...exportedLayout],
    [layout, exportedLayout, status],
  );

  /*
   * Kennungen als Zeichenkette in den Abhängigkeiten und nicht als Feld: Ein
   * neues Feld mit demselben Inhalt löste sonst bei jeder eintreffenden Antwort
   * eine weitere Anfrage aus.
   */
  const allKey = useMemo(
    () =>
      data.state.status === "ready" && filterReady ? data.state.value.entries.filter(entry => entry.exportStatus === "open").map((entry) => entry.id).join(",") : "",
    [data.state, filterReady],
  );

  const bookingIds = useMemo(() => {
    if (bookingSelection === null) return new Set(allKey ? allKey.split(",") : []);
    const visible = new Set(data.state.status === "ready" ? data.state.value.entries.map(entry => entry.id) : []);
    return new Set([...bookingSelection].filter(id => visible.has(id)));
  }, [bookingSelection, allKey, data.state]);
  const setBookingIds = useCallback((next: SetStateAction<ReadonlySet<Id>>) => {
    setBookingSelection(previous => typeof next === "function" ? next(previous ?? bookingIds) : next);
  }, [bookingIds]);
  const excluded = useMemo(() => new Set(allKey.split(",").filter(id => !bookingIds.has(id))), [allKey, bookingIds]);
  const deselected = useMemo(() => new Set(layout.filter(group => group.entryIds.every(id => !bookingIds.has(id))).map(group => group.key)), [layout, bookingIds]);

  let activeTemplateId: string | null;
  if (templateChoice === null) activeTemplateId = settings?.activeExportTemplateId ?? null;
  else if (templateChoice === "") activeTemplateId = null;
  else activeTemplateId = templateChoice;

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
        setLayoutError({ message: errorMessage(cause), fromService: isServiceError(cause) });
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
      setInsights(new Map(layout.map((group) => [group.key, allExcluded()])));
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
          if (!next.has(group.key)) next.set(group.key, allExcluded());
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
    const visibleIds = new Set(allKey.split(","));
    for (const group of layout) {
      if (deselected.has(group.key)) continue;
      const insight = insights.get(group.key);
      if (insight !== undefined && insight.blockedReason !== null) continue;
      out.push(...group.entryIds.filter((id) => visibleIds.has(id) && !excluded.has(id)));
    }
    return out;
  }, [layout, deselected, insights, excluded, allKey]);

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
        if (live) setTotalsState({ kind: "ready", value: preview, selection: selectedKey, templateId: activeTemplateId });
      })
      .catch((cause: unknown) => {
        if (live) setTotalsState({ kind: "failed", message: errorMessage(cause), fromService: isServiceError(cause) });
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
        message: exportTexts().sourcesFailed(sources.state.message),
      };
    }
    if (templates.state.status === "error") {
      return {
        kind: "failed",
        message: exportTexts().templatesFailed(templates.state.message),
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
    // `language`: the failure messages and the parser's messages are UI text.
  }, [catalog, sources.state, templates.state, activeTemplateId, language]);

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
    directoryState === null || directoryState === "ok" ? null : text.directoryProblem[directoryState];

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

  const rowCount = totals?.rows.length ?? 0;
  const groupNeedsEvidence = (group: GroupLayout): boolean => {
    const readyData = data.state.status === "ready" ? data.state.value : null;
    if (readyData === null) return true;
    const entries = group.entryIds
      .map((id) => readyData.byId.get(id))
      .filter((entry): entry is TimeEntry => entry !== undefined);
    return entries.length === 0 || entries.some((entry) => !entry.todoNoEvidence);
  };
  const groupIsBlocked = (group: GroupLayout): boolean => {
    const reason = insights.get(group.key)?.blockedReason;
    return reason !== null && reason !== undefined && (reason !== text.noteMissing || groupNeedsEvidence(group));
  };
  const groupIdIsBlocked = (groupId: string): boolean => {
    const group = layout.find((candidate) => candidate.key === groupId);
    return group === undefined || groupIsBlocked(group);
  };
  const blockedCount = layout.filter(groupIsBlocked).length;

  const previewCurrent = filterReady && totalsState.kind === "ready" && totalsState.selection === selectedKey && totalsState.templateId === activeTemplateId;

  const doExport = useCallback(() => {
    /*
      Ohne bekannte Zeilenzahl wird nicht geschrieben. Die Schaltfläche ist in
      diesem Fall gesperrt und der Dialog gar nicht offen; der Riegel steht
      hier trotzdem noch einmal, weil er die Bedingung ist, unter der der
      folgende Aufruf überhaupt eine ehrliche Rückmeldung geben kann.
    */
    if (!previewCurrent || totalsState.kind !== "ready") return;
    const plannedRows = totalsState.value.rows.length;
    setRunning(true);
    setRunError(null);
    void runExport(activeTemplateId, selectedIds)
      .then((outcome) => {
        setResult(outcome);
        setResultRows(plannedRows);
        setConfirmOpen(false);
        bump();
        const words = exportTexts();
        if (outcome.skipped.length === 0) {
          toasts.success(
            words.exportWritten,
            words.exportWrittenBody(
              plural(outcome.run.entryCount, words.booking, words.bookings),
              plural(plannedRows, words.exportRow, words.exportRows),
              formatQuarters(outcome.run.totalQuarters),
            ),
          );
        } else {
          toasts.show({
            tone: "warning",
            title: words.exportWrittenSkipped,
            body: words.exportWrittenSkippedBody(plural(outcome.skipped.length, words.groupStayed, words.groupsStayed)),
          });
        }
      })
      .catch((cause: unknown) => setRunError(errorMessage(cause)))
      .finally(() => setRunning(false));
  }, [previewCurrent, activeTemplateId, bump, selectedIds, toasts, totalsState]);

  return (
    <section className="screen">
      <ScreenHeader
        title={text.screenTitle}
        lead={text.screenLead}
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
              !previewCurrent || selectedIds.length === 0 ||
              directoryProblem !== null ||
              totalsState.kind !== "ready"
            }
            title={
              totalsState.kind === "failed"
                ? text.runBlockedFailed
                : totalsState.kind === "pending"
                  ? text.runBlockedPending
                  : undefined
            }
            onClick={() => {
              setRunError(null);
              setConfirmOpen(true);
            }}
          >
            {text.runExport}
          </Button>
        }
      >
        <ExportTabs active="export" />

      </ScreenHeader>

      {/*
        Die Ordnerwarnung **steht** (T-322 4.7), und sie ist die einzige der drei
        Fehlermeldungen dieser Ansicht, die das darf: Sie ist der Grund, warum
        „Export ausführen" gesperrt ist, und eine gesperrte Schaltfläche ohne
        Grund daneben ist eine Sackgasse. Knopf und Begründung dürfen nicht auf
        zwei Bildlaufstellen fallen. Sie steht außerdem **oberhalb** von allem
        Laufenden und kann deshalb fest werden, ohne die Reihenfolge zu ändern.
      */}
      {directoryProblem === null ? null : (
        <div className="screen__bar">
          <InlineMessage
            tone="warning"
            title={directoryProblem.title}
            className="message--inline-action"
            action={
              <Button size="sm" variant="secondary" onClick={() => navigate("settings", undefined, { bereich: "export" })}>
                {text.checkSettings}
              </Button>
            }
          >
            {directoryProblem.body}
          </InlineMessage>
        </div>
      )}

      {/*
        Ein Laufbereich, Name „Export" (T-322 4.7). Fest sind Kopf mit „Export
        ausführen" — die teuerste Aktion der Anwendung, bisher nach dreißig
        Tagesgruppen nicht mehr zu sehen — und die Bereichsreiter.

        Die Zusammenfassungszeile (`.export-summary`) bleibt **im** Laufbereich,
        obwohl sie sachlich in den festen Teil gehörte: Sie steht heute *unter*
        der Karte „Vorlage und Rundung", und sie festzumachen hieße, sie über
        diese Karte zu heben — eine Änderung der Reihenfolge und damit des
        Designs (T-322 4.7, OF-2).
      */}
      <ScreenBody label={text.screenTitle}>
        {result === null ? null : (
          <RunResult result={result} rowCount={resultRows} onDismiss={() => setResult(null)} />
        )}

        <Card
          title={text.templateAndRounding}
          description={text.templateAndRoundingLead}
          actions={
            <Button
              size="sm"
              variant="secondary"
              iconStart="pencil"
              onClick={() => navigate("templates", activeTemplateId ?? undefined)}
            >
              {text.editTemplates}
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
              <div className="export-settings__label"><span>{text.exportTemplate}</span><InfoHint label={text.exportTemplateHint}>
                {text.savedStateBefore}
                <strong>{text.savedStateStrong}</strong>
                {text.savedStateAfter}
              </InfoHint></div>
              <Select
                hideLabel
                label={text.exportTemplate}
                value={activeTemplateId ?? ""}
                onChange={setTemplateChoice}
                options={
                  templates.state.status === "ready"
                    ? [
                        { value: "", label: labels().builtinTemplateOption },
                        ...templates.state.value.map((template) => ({
                          value: template.id,
                          label: template.isBuiltin
                            ? text.builtIn(foreignText(template.name))
                            : foreignText(template.name),
                        })),
                      ]
                    : [{ value: activeTemplateId ?? "", label: text.loadingShort }]
                }
              />
            </div>
            <div className="export-settings__fact">
              <span className="export-settings__label"><span className="overline">{text.rounding}</span><InfoHint label={text.roundingHint}>
                {text.roundingRule}
              </InfoHint></span>
              <strong>
                {settings === null ? "—" : labels().roundingMode[settings.roundingMode]}
              </strong>
            </div>
            <div className="export-settings__fact">
              <span className="export-settings__label"><span className="overline">{text.exportFolder}</span><InfoHint label={text.folderHint}>
                {directoryState === "ok"
                  ? text.folderCheckedOk
                  : (directoryProblem?.title ?? text.folderUnknown)}
              </InfoHint></span>
              <strong className="mono truncate" title={settings?.exportDirectory ?? undefined}>
                {settings?.exportDirectory ?? text.folderNotChosen}
              </strong>
              <Button
                size="sm"
                variant="primary"
                iconStart="folder-open"
                onClick={() => navigate("settings", undefined, { bereich: "export" })}
              >
                {text.changeFolder}
              </Button>
            </div>
            <div className="export-settings__fact">
              <span className="export-settings__label"><span className="overline">{text.billedAs}</span><InfoHint label={text.billedAsHint}>
                {billingUser.length === 0 ? text.billedAsNoName : text.billedAsName}
              </InfoHint></span>
              <strong className="mono truncate" title={billingUser.length === 0 ? undefined : billingUser}>
                {billingUser.length === 0 ? text.noNameReported : billingUser}
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

        {layout.length > 0 && filterReady ? <>
                <div className="export-summary" role="status" aria-live="polite">
                  <span className="export-summary__count">
                    {plural(selectedIds.length, text.booking, text.bookings)}
                    {totalsState.kind === "ready"
                      ? text.inRows(plural(rowCount, text.exportRow, text.exportRows))
                      : null}
                  </span>
                  {totalsState.kind === "pending" ? (
                    <span className="export-summary__pending">
                      <Spinner size={13} label={text.computingTotals} />
                      <span>{text.computingTotalsDots}</span>
                    </span>
                  ) : null}
                  {totalsState.kind === "failed" ? (
                    <span className="export-summary__danger">
                      <Icon name="alert-triangle" size={14} />
                      {text.totalsUnknown}
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
                        text.rowWithExported,
                        text.rowsWithExported,
                      )}
                    </span>
                  ) : null}
                  {blockedCount > 0 ? (
                    <span className="export-summary__warn">
                      <Icon name="alert-triangle" size={14} />
                      {text.noNoteNoExport(plural(blockedCount, text.groupStays, text.groupsStay))}
                    </span>
                  ) : null}
                </div>

                {blockedCount > 0 ? (
                  <details className="export-legend">
                    <summary><Icon name="info" size={14} /><span>{text.legend}</span><Icon name="chevron-down" size={12} /></summary>
                    <p><strong>{text.legendNoteMissing}</strong>{text.legendNoteMissingText}</p>
                    <p><strong>{text.legendAllExcluded}</strong>{text.legendAllExcludedText}</p>
                    <p>{text.legendGroupsStayOpen}</p>
                  </details>
                ) : null}

        </> : null}

        <FilterBar label={text.filterLabel}
          resultLabel={filterReady && data.state.status === "ready" ? plural(data.state.value.entries.length, text.booking, text.bookings) : text.loadingShort}
          activeFilters={activeFilters} onResetAll={resetFilters}
          controls={<>
            <Select label={text.exportStatus} value={status} options={[{ value: "", label: text.all }, { value: "open", label: text.open }, { value: "exported", label: text.exported }]}
              onChange={setStatus} />
            <FilterToggle label={text.onlyExportedBefore} pressed={onlyPrevious} onChange={setOnlyPrevious} />
            <DateField label={text.fromDay} value={fromDay} onChange={setFromDay} />
            <DateField label={text.toDay} value={toDay} onChange={setToDay} />
            <Button size="sm" variant="ghost" onClick={() => { const today = todayCalendarDay(); setFromDay(shiftCalendarDay(today, -6)); setToDay(today); }}>{text.lastSevenDays}</Button>
            <SearchField label={text.restrictTodo} value={todoSearch} onChange={setTodoSearch} placeholder={text.searchTodoOrCall} />
            <Select label={text.filterTag} value={tagFilter} onChange={setTagFilter}
              options={[{ value: "", label: text.allTags }, ...tagOptions]} />
            {/* Pools in their shared order (A-28.3); `pools` comes sorted by position. */}
            <Select label={text.filterPool} value={poolFilter} onChange={setPoolFilter}
              options={[{ value: "", label: text.allPoolsOption }, ...poolOptions.map((pool) => ({ value: pool.id, label: pool.name }))]} />
            <Select<"" | "vorhanden" | "fehlt"> label={text.filterNote} value={noteFilter} onChange={setNoteFilter}
              options={[{ value: "", label: text.noteAny }, { value: "vorhanden", label: text.notePresent }, { value: "fehlt", label: text.noteAbsent }]} />
          </>} />

        <AsyncBoundary
          state={data.state}
          label={text.openBookingsLoading}
          rows={6}
          onRetry={data.reload}
        >
          {(value) => {
            if (layoutError !== null) {
              return (
                <InlineMessage
                  tone="danger"
                  title={text.layoutFailed}
                  action={
                    <Button size="sm" variant="secondary" iconStart="rotate-ccw" onClick={data.reload}>
                      {labels().retry}
                    </Button>
                  }
                >
                  <ServiceText text={layoutError.message} fromService={layoutError.fromService} />{" "}
                  {text.layoutFailedTail}
                </InlineMessage>
              );
            }

            if (displayLayout.length === 0) {
              return (
                <EmptyState
                  icon="check-circle"
                  title={text.nothingToExport}
                  description={activeFilters.length > 0 ? text.noOpenMatch : text.noOpenBookings}
                  action={activeFilters.length > 0 ? <Button variant="secondary" onClick={resetFilters}>{text.resetFilters}</Button> :
                    <Button variant="secondary" iconStart="clock" onClick={() => navigate("time")}>
                      {text.toTimeTracking}
                    </Button>
                  }
                />
              );
            }

            const models = displayLayout.map<ExportGroupViewModel>((group) => {
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
                todoTitle: todo?.title ?? text.unknownTodo,
                callNumber: todo?.callNumber ?? null,
                day: formatDayLabel(group.day),
                exportStatus: group.exportStatus,
                durationSeconds: entries.reduce((sum, entry) => sum + entry.durationSeconds, 0),
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
                quarterCount: insight?.quarters ?? null,
                mergedNote: previewNote(included),
                blockedReason: groupIsBlocked(group) ? insight?.blockedReason ?? null : null,
              };
            });

            const selectedGroupIds = new Set(
              layout.map((group) => group.key).filter((key) => !deselected.has(key)),
            );


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
                    title={text.totalsFailed}
                    action={
                      <Button
                        size="sm"
                        variant="secondary"
                        iconStart="rotate-ccw"
                        onClick={() => setTotalsAttempt((attempt) => attempt + 1)}
                      >
                        {labels().retry}
                      </Button>
                    }
                  >
                    <ServiceText text={totalsState.message} fromService={totalsState.fromService} />{" "}
                    {text.totalsFailedTail}
                  </InlineMessage>
                ) : null}

                <ExportGroupList
                  models={models}
                  selectedGroupIds={selectedGroupIds}
                  expandedGroupIds={expanded}
                  expandedTodoGroupIds={expandedTodoGroups}
                  onToggleGroup={groupId => setBookingIds(previous => {
                    const ids = layout.find(group => group.key === groupId)?.entryIds ?? [];
                    const next = new Set(previous);
                    const remove = ids.every(id => next.has(id));
                    for (const id of ids) { if (remove) next.delete(id); else next.add(id); }
                    return next;
                  })}
                  onToggleExpanded={(groupId) =>
                    setExpanded((previous) => {
                      const next = new Set(previous);
                      if (next.has(groupId)) next.delete(groupId);
                      else next.add(groupId);
                      return next;
                    })
                  }
                  onToggleTodoExpanded={(groupId) =>
                    setExpandedTodoGroups((previous) => {
                      const next = new Set(previous);
                      if (next.has(groupId)) next.delete(groupId);
                      else next.add(groupId);
                      return next;
                    })
                  }
                  onToggleEntry={(_groupId, entryId) => setBookingIds(previous => {
                    const next = new Set(previous);
                    if (next.has(entryId)) next.delete(entryId); else next.add(entryId);
                    return next;
                  })}
                  onEditEntry={(_groupId, entryId) => {
                    const entry = value.byId.get(entryId);
                    if (entry !== undefined) rowActions.openEditor(entry);
                  }}
                  renderEntryAction={(entryId) => {
                    const entry = value.byId.get(entryId);
                    if (entry === undefined) return null;
                    const todoTitle = value.titles.get(entry.todoId)?.title ?? text.thisTodo;
                    return <Menu
                      trigger={<Icon name="more-horizontal" size={16} />}
                      triggerLabel={bookingTexts().rowActions(foreignText(todoTitle))}
                      triggerClassName="table__row-menu"
                      align="end"
                      entries={rowActions.menuEntries(entry)}
                    />;
                  }}
                  renderRowDetail={(groupId) => (
                    <GroupRowDetail
                      row={rowByGroup.get(groupId) ?? null}
                      deselected={deselected.has(groupId)}
                      blocked={groupIdIsBlocked(groupId)}
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

        {templates.state.status === "loading" ? <Spinner size={14} label={text.templatesLoading} /> : null}
      </ScreenBody>

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
          open={confirmOpen && previewCurrent}
          title={text.confirmTitle}
          description={text.confirmLead(
            plural(selectedIds.length, text.bookingWill, text.bookingsWill),
            plural(totalsState.value.rows.length, text.exportRow, text.exportRows),
            formatQuarters(totalsState.value.totalQuarters),
          )}
          consequence={runError ?? text.confirmConsequence}
          {...(firstRunIntoDirectory === true
            ? {
                acknowledgeLabel: text.firstRunAcknowledge(settings?.exportDirectory ?? text.thisFolder),
              }
            : {})}
          confirmLabel={text.confirmExport}
          busy={running}
          onConfirm={doExport}
          onCancel={() => setConfirmOpen(false)}
        />
      ) : null}

      {rowActions.dialogs}
    </section>
  );
}
