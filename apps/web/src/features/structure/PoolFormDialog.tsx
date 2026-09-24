import { countPoolRuleConditions, MAX_NAME_LENGTH } from "@takt/domain";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  updatePool,
  createPool,
} from "./api";
import type {
  Id,
  Pool,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolMatchMode,
  PoolPlacement,
  PoolRuleTerm,
} from "../../api/types";
import { FormDialog, TextField } from "../../shared/ui/FormDialog";
import { InlineMessage } from "../../shared/ui/Primitives";
import { RadioRow } from "../../shared/ui/RadioRow";
import { RuleSummary } from "./RuleSummary";
import {
  FolderPicker,
  StatusPicker,
  type FolderOption,
  type PickerSource,
  type StatusOption,
} from "./RulePickers";
import { Select } from "../../shared/ui/Select";
import { TagInput } from "../tags/TagInput";
import { useRefresh } from "../../app/RefreshContext";
import { useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { useMutation } from "../../app/useAsync";
import { flatFolders } from "../../lib/folderPaths";
import { plural } from "../../lib/format";
import { labels } from "../../lib/labels";
import { useLanguage } from "../../lib/language";
import { structureTexts } from "./texts";
import {
  axesOf,
  describeRule,
  describeRuleReach,
  emptyFolderNames,
  ruleSpoken,
  type RuleAxes,
  type RuleReach,
} from "../../lib/poolRule";
import { quotedName } from "../../lib/foreign";
import { folderIdsOf, sameTerms, tagIdsOf, toggleFolder, withTagIds } from "./ruleTerms";

/**
 * Takt — eine Regel anlegen und ändern (S-11, I-13, E-054, E-055, T-076, T-079).
 *
 * ## Das Vorbild und was daraus folgt
 *
 * Der Auftraggeber hat die Board-Konfiguration von Super Productivity als
 * Vorbild geschickt. Ihr Aufbau ist der Grund, warum dieses Formular ohne einen
 * Und/Oder-Schalter auskommt:
 *
 * ```
 * Erforderliche Tags        [+ Tag]
 * Ausgeschlossene Tags      [in-progress ⊗]  [+ Tag]
 * Aufgabenstatus erledigt   ( ) Alle  ( ) Erledigt  (•) Unerledigt
 * ```
 *
 * **Die Verknüpfung folgt aus dem Feldnamen** (E-055): „erforderlich" heißt
 * und, „ausgeschlossen" heißt nicht. Wer eine Spalte einrichtet, liest keine
 * Aussagenlogik, sondern eine Liste von Bedingungen — jede engt weiter ein.
 *
 * Takt hat eine sechste Zeile, die im Vorbild fehlt: den **Exportstatus**. Er
 * ist hier die Unterscheidung, um die sich alles dreht, und beantwortet als
 * Spalte die Frage „was habe ich noch nicht abgerechnet".
 *
 * ## Vier Dinge, die dieses Formular nicht stillschweigend tun darf
 *
 * **1. Den Modus umdeuten.** Jede Regel, die es heute gibt, bedeutet
 * „mindestens eines davon" — `pool.match_mode` hält das seit Migration 0001
 * je Regel einzeln fest, und die Vorgabe war an allen vier Stellen `any`
 * (T-076, Abschnitt 1). Die Vorgabe für neue Regeln bleibt deshalb `any`, und
 * wer den Modus einer **vorhandenen** Regel umstellt, bekommt vor dem Speichern
 * zu lesen, dass sie danach anders trifft.
 *
 * **2. Die leere Regel wegdefinieren.** Eine Regel ohne Bedingung trifft
 * nichts — nicht alles (A-3.4). Bis T-079 sperrte dieses Formular deshalb den
 * Speicherknopf. Das war eine Sperre am falschen Ort: „Keine Bedingung" ist der
 * Zustand unmittelbar nach dem Anlegen, kein Fehler des Benutzers. Seit T-079
 * lässt sich die Regel anlegen, und **drei** Flächen sagen, was daraus folgt —
 * die Warnung hier, die Zusammenfassung unter dem Spaltenkopf und der
 * Leerzustand in der Spalte selbst. Eine gesperrte Schaltfläche hätte an keiner
 * dieser Stellen etwas erklärt.
 *
 * **3. „Alle" wie „trifft alles" aussehen lassen.** Der Neutralwert schränkt
 * nicht ein; er wählt nichts aus. Deshalb trägt er in jeder Optionszeile den
 * Zusatz „schränkt nicht ein", und die Vorschau zählt die neutralen Achsen
 * ausdrücklich auf, statt sie wegzulassen.
 *
 * **4. Den Exportstatus überdehnen.** `exported` heißt „hat **mindestens eine**
 * exportierte Buchung" und nicht „vollständig abgerechnet" — der Exportstatus
 * gehört der Buchung, nicht dem Todo (E-032). Das steht an der Stelle, an der
 * gewählt wird, und nicht in einer Fußnote.
 *
 * ## Ein Formular für zwei Flächen
 *
 * Seit E-054 ist eine Kanban-Spalte dieselbe Entität wie ein Pool. Der einzige
 * Unterschied ist `placement` — wo die Regel erscheint. Deshalb steht hier
 * **ein** Formular und nicht zwei, die dasselbe Feld für Feld wiederholen und
 * dann auseinanderlaufen.
 */

/**
 * Wie lange die Live-Region der Vorschau wartet, bevor sie spricht (S-8).
 *
 * Lang genug, dass ein Durchqueren mit den Pfeiltasten nicht angesagt wird,
 * kurz genug, dass die Ansage noch zur Handlung gehört. Der sichtbare Kasten
 * wartet nicht.
 */
const SPEAK_DELAY_MS = 500;


/* Bausteine des Formulars                                              */

/**
 * Ein benannter Abschnitt im Formular.
 *
 * Neun Felder untereinander sind eine Liste, keine Ordnung. Die Überschriften
 * teilen sie in das, was ein Benutzer sucht: was dazugehören muss, was nicht
 * dazugehören darf, und woran das Todo sonst noch erkennbar ist.
 *
 * **Ausgeführt und trotzdem hier** (T-256). Sie hat genau ein Merkmal als
 * Leser — dieses — und gehört deshalb **nicht** zu den geteilten Bausteinen;
 * die Regel dort verlangt mehr als ein Merkmal. Ausgeführt wird sie für die
 * Musterseite: `showcase/RuleSection.tsx` baute dieselben drei Zeilen Markup
 * von Hand nach, und zwei Abschriften derselben Klassenfamilie sind zwei
 * Gelegenheiten, bei der nächsten Änderung eine zu vergessen. Die Musterseite
 * greift ohnehin bereits nach `RulePickers` und `RuleSummary` in diesem
 * Ordner.
 */
export function FormSection({
  title,
  lead,
  children,
}: {
  readonly title: string;
  readonly lead?: string;
  readonly children: ReactNode;
}) {
  return (
    <section className="form-section">
      <h3 className="form-section__title">{title}</h3>
      {lead === undefined ? null : <p className="form-section__lead">{lead}</p>}
      {children}
    </section>
  );
}

/**
 * Ordner- und Statusauswahl stehen seit T-091 in
 * `features/structure/RulePickers.tsx`.
 *
 * Nicht wegen der Länge, sondern wegen ihrer **Zustände**: Beide hängen an
 * derselben Quelle wie das `TagInput` daneben und müssen dieselben drei
 * Ausgänge haben — lädt, Fehler, bereit (B-5 aus R-2, Abschnitt 15). Als
 * eigener Baustein nehmen sie ihre Daten entgegen, statt sie zu holen, und
 * lassen sich damit auf der Musterseite in allen vier Zuständen nebeneinander
 * zeigen statt nur in dem einen guten.
 */

/* Der Dialog                                                           */

export interface PoolFormDialogProps {
  readonly open: boolean;
  /** Vorhandene Regel — dann wird geändert, sonst angelegt. */
  readonly pool?: Pool;
  /** Vorbelegter Anzeigeort beim Anlegen. */
  readonly defaultPlacement?: PoolPlacement;
  readonly onClose: () => void;
  readonly onSaved?: (pool: Pool) => void;
}

export function PoolFormDialog({
  open,
  pool,
  defaultPlacement = "pool",
  onClose,
  onSaved,
}: PoolFormDialogProps) {
  const structure = useStructure();
  const toasts = useToasts();
  const { bump } = useRefresh();
  const mutation = useMutation();

  const ready = structure.state.status === "ready" ? structure.state.value : null;
  const tree = ready?.tagTree ?? null;
  const folders = useMemo(() => (tree === null ? [] : flatFolders(tree)), [tree]);
  const statuses = ready?.statuses ?? [];

  /*
   * Die drei Zustände der Quelle, einmal gebildet und an beide Auswahlen
   * gegeben (B-5 aus R-2).
   *
   * `ready === null` heißt **zweierlei** — es lädt noch, oder es ist
   * fehlgeschlagen —, und bis T-091 wurde beides als „es gibt keinen Ordner"
   * ausgegeben. Das ist eine Behauptung über den Bestand, und sie war genau
   * dann unbelegt, wenn sie erschien: Der Dienst war weg, der Benutzer hatte
   * seine Ordner, und das Formular sagte ihm das Gegenteil.
   *
   * Die Fehlermeldung trägt den Satz des Dienstes und einen
   * Wiederholungsknopf, der dieselbe Quelle neu lädt wie `TagInput` — eine
   * Fehlermeldung ohne Rückweg ist eine Sackgasse (Abschnitt 15).
   */
  const folderSource = useMemo<PickerSource<FolderOption>>(() => {
    if (structure.state.status === "loading") return { status: "loading" };
    if (structure.state.status === "error") {
      return { status: "error", message: structure.state.message };
    }
    return { status: "ready", items: folders };
  }, [structure.state, folders]);

  const statusSource = useMemo<PickerSource<StatusOption>>(() => {
    if (structure.state.status === "loading") return { status: "loading" };
    if (structure.state.status === "error") {
      return { status: "error", message: structure.state.message };
    }
    return { status: "ready", items: statuses };
  }, [structure.state, statuses]);

  const [name, setName] = useState("");
  const [placement, setPlacement] = useState<PoolPlacement>(defaultPlacement);
  const [matchMode, setMatchMode] = useState<PoolMatchMode>("any");
  const [includeSubfolders, setIncludeSubfolders] = useState(true);
  const [rule, setRule] = useState<readonly PoolRuleTerm[]>([]);
  const [excludedTags, setExcludedTags] = useState<readonly PoolRuleTerm[]>([]);
  const [statusIds, setStatusIds] = useState<readonly Id[]>([]);
  const [completion, setCompletion] = useState<PoolCompletionFilter>("any");
  const [exportState, setExportState] = useState<PoolExportFilter>("any");
  /**
   * Wurde das Namensfeld schon einmal verlassen? (Befund O-DZ, T-167.)
   *
   * Bei leerem Namen ist „Anlegen“ gesperrt — `onSubmit` läuft also nie, und
   * eine dort entstehende Meldung sähe niemand. Sie entsteht deshalb beim
   * Verlassen des Feldes und nicht beim Tippen (SC 3.3.1). Seit E-084 ist sie
   * die einzige, die es hier gibt: `noValidate` nimmt dem Formular Chromiums
   * eigene, englische Sprechblase.
   */
  const [nameTouched, setNameTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(pool?.name ?? "");
    setNameTouched(false);
    setPlacement(pool?.placement ?? defaultPlacement);
    // Die Vorgabe ist `any` und bleibt es — Punkt 1 im Kopf dieser Datei.
    setMatchMode(pool?.matchMode ?? "any");
    setIncludeSubfolders(pool?.includeSubfolders ?? true);
    setRule(pool?.requiredTags ?? []);
    setExcludedTags(pool?.excludedTags ?? []);
    setStatusIds(pool?.statusIds ?? []);
    setCompletion(pool?.completion ?? "any");
    setExportState(pool?.exportState ?? "any");
  }, [open, pool, defaultPlacement]);

  const trimmed = name.trim();
  /* Grundform aus T-177 P-3, erstes Wort ist die Feldbeschriftung (P-2). */
  const nameError = nameTouched && trimmed.length === 0 ? labels().nameMissing : undefined;

  const isBoardColumn = placement !== "pool";
  const language = useLanguage();
  const text = structureTexts();
  const shared = labels();

  const axes = useMemo<RuleAxes>(
    () => ({ matchMode, includeSubfolders, rule, excludedTags, statusIds, completion, exportState }),
    [matchMode, includeSubfolders, rule, excludedTags, statusIds, completion, exportState],
  );

  /*
   * Welche Ordner in welcher Liste stehen — als Menge, weil die Auswahl sie
   * je Chip abfragt. Die Termliste bleibt die Wahrheit; das hier ist nur ihr
   * Nachschlagewerk.
   */
  const requiredFolderIds = useMemo(() => folderIdsOf(rule), [rule]);
  const excludedFolderIds = useMemo(() => folderIdsOf(excludedTags), [excludedTags]);

  const description = useMemo(
    () =>
      describeRule(axes, {
        tag: (id) => {
          const info = structure.tagInfo(id);
          return info === undefined ? undefined : { name: info.tag.name, path: info.path };
        },
        folder: (id) => folders.find((entry) => entry.id === id)?.path,
        status: (id) => statuses.find((entry) => entry.id === id)?.name,
      }),
    // `language`: the description carries words of the UI language.
    [axes, folders, statuses, structure, language],
  );

  const conditions = countPoolRuleConditions(axes);

  /**
   * Der leere Ordner — aber nur, solange der Entwurf ihn noch nennt (E-057).
   *
   * Wie viele Tags in einem Ordner liegen, weiß allein der Dienst, und er hat
   * es zum **gespeicherten** Stand gesagt (`pool.resolved`). Sobald jemand die
   * erforderlichen Terme oder die Ordnertiefe ändert, bezieht sich diese
   * Auskunft auf eine andere Regel als die im Formular — dann steht sie hier
   * nicht mehr. Eine veraltete Warnung wäre schlimmer als keine: Sie zeigte auf
   * einen Ordner, den der Benutzer gerade herausgenommen hat.
   *
   * Nachgerechnet wird nichts. Der Ordnerbaum liegt der Oberfläche zwar vor,
   * aber die Auflösung eines Ordnerterms — samt Unterordnern, beliebig tief —
   * ist die Rechnung des Dienstes, und eine zweite Fassung davon wäre genau die
   * Doppelung, die T-080 beseitigt hat.
   *
   * **Warum genau diese beiden Bedingungen und keine weitere.** Ob ein
   * erforderlicher Ordner leer ist, hängt allein an den Termen der Liste `rule`
   * und an `includeSubfolders` — nicht am Status, nicht an „Erledigt", nicht am
   * Exportstatus. Wer die Statusachse umstellt, ändert am leeren Ordner nichts,
   * und die Warnung darf deshalb stehen bleiben. Die zweite Hälfte der Auskunft
   * — „nennt diese Regel überhaupt eine Bedingung" — hängt dagegen an allen
   * fünf Achsen und kommt darum nicht aus `pool.resolved`, sondern aus
   * `description.isEmpty`, das dem Entwurf folgt.
   */
  const savedReach = useMemo<RuleReach | null>(() => {
    if (pool === undefined) return null;
    if (includeSubfolders !== pool.includeSubfolders) return null;
    if (!sameTerms(rule, pool.requiredTags)) return null;
    return describeRuleReach(description, pool.resolved);
  }, [pool, rule, includeSubfolders, description]);

  /**
   * Ein **ausgeschlossener** Ordner ohne Tag — ein Hinweis, keine Warnung
   * (E-057, T-087).
   *
   * „Keiner davon" über nichts schließt nichts aus: Der Ausschluss lässt in
   * Ruhe, statt einzuengen, die Regel trifft genau dasselbe wie ohne ihn. Das
   * ist **kein Einrichtungsfehler**, und eine Warnfarbe darüber wäre eine
   * Warnung ohne Folge — die nächste echte glaubte dann niemand mehr.
   *
   * Gesagt wird es trotzdem, und nur hier: Ein Ausschluss, den man hingeschrieben
   * hat und der nichts tut, ist genau an der Fläche eine Auskunft wert, an der
   * er geschrieben wird. Auf Board und Pool-Liste wäre er Rauschen.
   *
   * **Ohne Namen.** Der Dienst nennt die leeren ausgeschlossenen Ordner
   * bewusst nicht (T-082): Aus ihnen folgt keine Handlung. Der Hinweis bleibt
   * deshalb allgemein, statt einen Ordner zu erfinden.
   */
  const excludedWithoutEffect =
    pool !== undefined &&
    includeSubfolders === pool.includeSubfolders &&
    sameTerms(excludedTags, pool.excludedTags) &&
    pool.resolved.unresolvedExcluded;

  /**
   * Der Modus wurde umgestellt — und die Regel hat mehr als einen Tag.
   *
   * Bei null oder einem Tag ist der Unterschied keiner: „mindestens eines von
   * einem" und „alle von einem" treffen dasselbe. Eine Warnung dort wäre eine
   * Warnung ohne Folge, und die nächste echte glaubte dann niemand mehr.
   */
  const modeMatters = rule.length > 1 || rule.some((term) => term.kind === "folder");
  const modeChanged = pool !== undefined && pool.matchMode !== matchMode && modeMatters;

  /**
   * Der Satz für die Live-Region unter der Vorschau (S-8 aus R-2).
   *
   * Er hinkt der Anzeige um {@link SPEAK_DELAY_MS} hinterher, und das mit
   * Absicht: Pfeiltasten in einer Optionszeile wechseln den Wert bei jedem
   * Anschlag. Ohne die Bremse spräche die Vorlesehilfe drei Regeln aus, die
   * der Benutzer nur durchquert hat, bevor sie zu der kommt, die er meint.
   * Die **sichtbare** Vorschau wartet nicht — sie steht sofort richtig da.
   */
  const [spoken, setSpoken] = useState("");

  useEffect(() => {
    if (!open) {
      setSpoken("");
      return;
    }
    const sentence = ruleSpoken(description, savedReach);
    const handle = setTimeout(() => setSpoken(sentence), SPEAK_DELAY_MS);
    return () => clearTimeout(handle);
  }, [open, description, savedReach]);

  return (
    <FormDialog
      open={open}
      title={
        pool === undefined
          ? defaultPlacement === "pool"
            ? text.newPool
            : text.newColumn
          : text.editTitle(quotedName(pool.name))
      }
      description={text.formLead}
      submitLabel={pool === undefined ? text.create : text.save}
      submitDisabled={trimmed.length === 0}
      busy={mutation.busy}
      error={mutation.error}
      errorFromService={mutation.errorFromService}
      onSubmit={() => {
        void mutation.run(async () => {
          const body = {
            name: trimmed,
            matchMode,
            includeSubfolders,
            placement,
            requiredTags: rule,
            excludedTags,
            statusIds,
            completion,
            exportState,
          };
          const saved = pool === undefined ? await createPool(body) : await updatePool(pool.id, body);
          structure.reload();
          bump();
          /*
            Der Toast sagt, was der **gespeicherte** Stand trifft — nicht bloß,
            wie viele Bedingungen er nennt (S-9 aus R-2).

            Bis T-091 unterschied er „0 Bedingungen" von „n Bedingungen". Eine
            Regel mit zwei Bedingungen, von denen eine auf einen leeren Ordner
            zeigt, trifft nichts — und wurde als Erfolg gemeldet: Der Dialog
            schloss zufrieden, die Spalte blieb fuer immer leer, und der Grund
            stand nur noch dort, wohin der Benutzer gerade nicht mehr schaute.
            Eine Warnung, die im Formular steht und beim Speichern verschwindet,
            liest sich wie eine behobene Warnung.

            Die Auskunft lag die ganze Zeit vor: `POST`/`PATCH` liefern
            `resolved` in der Antwort. Beschrieben wird der **gespeicherte**
            Stand und nicht der Entwurf — die beiden sind in diesem Augenblick
            zwar gleich, aber der Dienst hat die Ordner aufgeloest und die
            Oberflaeche nicht.
          */
          const savedFault = describeRuleReach(
            describeRule(axesOf(saved), {
              tag: (id) => {
                const info = structure.tagInfo(id);
                return info === undefined ? undefined : { name: info.tag.name, path: info.path };
              },
              folder: (id) => folders.find((entry) => entry.id === id)?.path,
              status: (id) => statuses.find((entry) => entry.id === id)?.name,
            }),
            saved.resolved,
          );
          const words = structureTexts();
          const title =
            pool === undefined
              ? isBoardColumn
                ? words.columnCreated
                : words.poolCreated
              : words.ruleChanged;

          if (savedFault.kind === "empty-folder") {
            toasts.show({
              tone: "warning",
              title,
              body: words.savedEmptyFolder(quotedName(saved.name), emptyFolderNames(savedFault.folders), isBoardColumn),
            });
          } else {
            toasts.show({
              tone: conditions === 0 ? "warning" : "success",
              title,
              body:
                conditions === 0
                  ? words.savedNoCondition(quotedName(saved.name))
                  : words.savedSummary(
                      quotedName(saved.name),
                      plural(conditions, words.condition, words.conditions),
                      labels().poolPlacement[saved.placement],
                    ),
            });
          }
          onSaved?.(saved);
          onClose();
        });
      }}
      onCancel={onClose}
    >
      <TextField
        label={text.name}
        value={name}
        onChange={setName}
        onTouched={() => setNameTouched(true)}
        required
        maxLength={MAX_NAME_LENGTH}
        placeholder={isBoardColumn ? text.columnPlaceholder : text.poolPlaceholder}
        {...(nameError === undefined ? {} : { error: nameError })}
      />

      <Select
        label={text.placement}
        value={placement}
        onChange={(next) => setPlacement(next as PoolPlacement)}
        options={[
          { value: "pool", label: shared.poolPlacement.pool },
          { value: "board", label: shared.poolPlacement.board },
          { value: "both", label: shared.poolPlacement.both },
        ]}
        hint={text.placementHint[placement]}
      />

      <FormSection
        title={text.requiredTags}
        lead={text.requiredTagsLead}
      >
        {/*
          Vier Bedienelemente, vier Namen (S-7 aus R-2, SC 1.3.1). Bis T-091
          hiessen zwei davon „Tags" und zwei „Ordner"; unterschieden waren sie
          allein durch die Abschnittsueberschrift darueber — die eine
          Vorlesehilfe beim Tabulator nicht mitliest. Ein ausgeschlossener
          Ordner statt eines erforderlichen kehrt die Regel um.
          Die Ueberschrift bleibt: Sie ist die Gliederung fuer Sehende.
        */}
        <TagInput
          label={text.requiredTags}
          hideLabel
          value={tagIdsOf(rule)}
          onChange={(next) => setRule((current) => withTagIds(current, next))}
          placeholder={text.requiredTagsPlaceholder}
          hint={text.requiredTagsHint}
        />

        <RadioRow
          label={text.howMany}
          value={matchMode}
          onChange={setMatchMode}
          options={[
            { value: "any", label: shared.poolMatchMode.any, hint: shared.poolMatchModeHint.any },
            { value: "all", label: shared.poolMatchMode.all, hint: shared.poolMatchModeHint.all },
          ]}
        />

        {modeChanged ? (
          <InlineMessage tone="warning" title={text.modeChangedTitle}>
            {pool?.matchMode === "any" ? text.modeChangedToAll : text.modeChangedToAny}
          </InlineMessage>
        ) : null}

        <FolderPicker
          label={text.requiredFolders}
          hint={text.requiredFoldersHint}
          source={folderSource}
          onRetry={structure.reload}
          selected={requiredFolderIds}
          onToggle={(folderId) => setRule((current) => toggleFolder(current, folderId))}
        />
      </FormSection>

      <FormSection
        title={text.excludedTags}
        lead={text.excludedTagsLead}
      >
        <TagInput
          label={text.excludedTags}
          hideLabel
          value={tagIdsOf(excludedTags)}
          onChange={(next) => setExcludedTags((current) => withTagIds(current, next))}
          placeholder={text.excludedTagsPlaceholder}
          hint={text.excludedTagsHint}
        />

        <FolderPicker
          label={text.excludedFolders}
          hint={text.excludedFoldersHint}
          source={folderSource}
          onRetry={structure.reload}
          selected={excludedFolderIds}
          onToggle={(folderId) => setExcludedTags((current) => toggleFolder(current, folderId))}
        />
      </FormSection>

      {/*
        Ein eigener Abschnitt fuer ein einziges Ankreuzfeld — weil
        `includeSubfolders` **eine** Einstellung fuer **beide** Taglisten ist.
        Am Ende der ausgeschlossenen Tags gelesen (dort stand es bis T-079,
        als es nur eine Liste gab), sieht es aus, als gaelte es nur fuer sie;
        der Satz „gilt fuer beide Listen" daneben ist dann eine Berichtigung
        und keine Erklaerung.
      */}
      <FormSection
        title={text.folderDepth}
        lead={text.folderDepthLead}
      >
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={includeSubfolders}
            onChange={(event) => setIncludeSubfolders(event.target.checked)}
          />
          <span>
            {text.includeSubfolders}
            <span className="checkbox-row__hint">{text.includeSubfoldersHint}</span>
          </span>
        </label>
      </FormSection>

      <FormSection
        title={text.moreConditions}
        lead={text.moreConditionsLead}
      >
        <StatusPicker
          source={statusSource}
          onRetry={structure.reload}
          value={statusIds}
          onChange={setStatusIds}
          hint={
            statusIds.length === 0
              ? text.statusNothing(shared.poolStatus.any, shared.poolAxisNeutralHint.toLowerCase())
              : text.statusChosenTail(plural(statusIds.length, text.statusChosen, text.statusChosen))
          }
        />

        <RadioRow
          label={text.completion}
          value={completion}
          onChange={setCompletion}
          neutralNote={shared.poolAxisNeutralHint.toLowerCase()}
          options={[
            {
              value: "any",
              label: shared.poolCompletion.any,
              neutral: true,
              hint: text.completionAny,
            },
            {
              value: "done",
              label: shared.poolCompletion.done,
              hint: text.completionDone,
            },
            {
              value: "open",
              label: shared.poolCompletion.open,
              hint: text.completionOpen,
            },
          ]}
        />

        <RadioRow
          label={text.exportState}
          value={exportState}
          onChange={setExportState}
          neutralNote={shared.poolAxisNeutralHint.toLowerCase()}
          options={[
            {
              value: "any",
              label: shared.poolExport.any,
              neutral: true,
              hint: text.exportAny,
            },
            {
              value: "open",
              label: shared.poolExport.open,
              hint: text.exportOpen,
            },
            {
              value: "exported",
              label: shared.poolExport.exported,
              // Punkt 4 im Kopf dieser Datei, an der Stelle, an der gewaehlt
              // wird: Der Exportstatus haengt an der Buchung, nicht am Todo.
              hint: text.exportExported(shared.poolExportNotBilledHint),
            },
          ]}
        />
      </FormSection>

      {/*
        Die Warnbaender stehen **vor** der Vorschau (R-2, Abschnitt 9).

        Bis T-091 kamen sie danach — also hinter der Stelle, auf die sie sich
        beziehen. Fuer eine Vorlesehilfe ist das die falsche Richtung: Sie liest
        erst das Ergebnis und danach die Diagnose, die es erklaert. Jetzt steht
        die Diagnose vor dem Ergebnis, und die Live-Region unter der Vorschau
        traegt beides in einem Satz.
      */}
      {savedReach?.kind === "empty-folder" ? (
        <InlineMessage
          tone="warning"
          title={
            savedReach.folders.length === 1 ? text.emptyFolderTitleOne : text.emptyFolderTitleMany
          }
        >
          {text.emptyFolderBefore(emptyFolderNames(savedReach.folders))}
          <strong>{text.emptyFolderStrong}</strong>
          {text.emptyFolderAfter(savedReach.folders.length === 1)}
        </InlineMessage>
      ) : null}

      {excludedWithoutEffect ? (
        <InlineMessage tone="info" title={text.exclusionNoEffectTitle}>
          {text.exclusionNoEffectBefore}
          <strong>{text.exclusionNoEffectStrong}</strong>
          {text.exclusionNoEffectAfter}
        </InlineMessage>
      ) : null}

      <FormSection title={text.ruleMatches} lead={text.ruleMatchesLead}>
        <RuleSummary
          description={description}
          showNeutral
          /*
            Der Hilfssatz an der Exportachse (W-7) bleibt hier weg: Seine
            ausfuehrliche Fassung steht drei Zeilen darueber am Optionsknopf
            „Abgerechnet" ({@link POOL_EXPORT_NOT_BILLED_HINT}). Zweimal
            dasselbe in zwei Wortlauten auf einem Formular ist genau der
            Fehler, den E-059 abgeschafft hat.
          */
          showAxisNotes={false}
          size="md"
          {...(savedReach === null ? {} : { reach: savedReach })}
          emptyText={text.noConditionPreview(isBoardColumn)}
        />

        {/*
          Die Vorschau, vorgelesen (S-8 aus R-2, SC 4.1.3).

          Sie ist die einzige Flaeche, an der die fuenf Achsen zu **einer**
          Aussage zusammenkommen, und sie aendert sich bei jeder Wahl — fuer
          eine Vorlesehilfe war sie damit unsichtbar.

          Vorgelesen wird der **Satz**, nicht der Kasten: Eine Chipwolke als
          Live-Region saegt bei jedem Tastendruck alles noch einmal herunter,
          und dann schaltet der Benutzer die Vorlesehilfe ab statt der Region.
          Aus demselben Grund wartet der Satz eine halbe Sekunde: Wer mit den
          Pfeiltasten durch eine Optionszeile geht, beruehrt drei Werte auf dem
          Weg zum vierten, und angesagt gehoert nur der vierte.
        */}
        <p className="visually-hidden" role="status" aria-live="polite">
          {spoken}
        </p>
      </FormSection>

      {conditions === 0 ? (
        <InlineMessage
          tone="warning"
          title={isBoardColumn ? text.columnStaysEmpty : text.poolStaysEmpty}
        >
          {text.noConditionBefore}
          <strong>{text.noConditionStrong}</strong>
          {text.noConditionAfter}
        </InlineMessage>
      ) : null}

      {/*
        Der Kasten „Nichts wird gespeichert ausser der Regel" ist mit T-181
        (ST-05) entfallen — vier Saetze, dauerhaft, unabhaengig vom Zustand.
        Was er sagte, steht am Board in `RULE_WHAT_MOVES_A_CARD` und in
        diesem Formular als **Reihenfolge**: Der Abschnitt „Diese Regel
        trifft" ist damit das letzte Element vor der Fusszeile. Er sagte in
        vier Saetzen, dass nichts gespeichert wird ausser der Regel — die
        Vorschau **zeigt** die Regel und zeigt sonst nichts.

        Damit ist dieses Formular durchgehend zustandsgebunden: Jede
        verbleibende Flaeche darin erscheint nur bei ihrem Befund.
      */}
    </FormDialog>
  );
}
