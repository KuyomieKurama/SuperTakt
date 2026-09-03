import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { createPool, updatePool } from "../api/endpoints";
import type {
  Id,
  Pool,
  PoolCompletionFilter,
  PoolExportFilter,
  PoolMatchMode,
  PoolPlacement,
  PoolRuleTerm,
} from "../api/types";
import { FormDialog, TextField } from "../components/FormDialog";
import { Icon } from "../components/Icon";
import { InlineMessage } from "../components/Primitives";
import { RadioRow } from "../components/RadioRow";
import { RuleSummary } from "../components/RuleSummary";
import { Select } from "../components/Select";
import { TagInput } from "../components/TagInput";
import { useRefresh } from "../app/RefreshContext";
import { useStructure } from "../app/StructureContext";
import { useToasts } from "../app/ToastContext";
import { useMutation } from "../app/useAsync";
import { flatFolders } from "../lib/folderPaths";
import { plural } from "../lib/format";
import {
  POOL_AXIS_NEUTRAL_HINT,
  POOL_COMPLETION_LABEL,
  POOL_EXPORT_LABEL,
  POOL_MATCH_MODE_HINT,
  POOL_MATCH_MODE_LABEL,
  POOL_PLACEMENT_LABEL,
} from "../lib/labels";
import { countConditions, describeRule, type RuleAxes } from "../lib/poolRule";

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

const PLACEMENT_HINT: Readonly<Record<PoolPlacement, string>> = {
  pool: "Die Regel steht im Pool-Bereich und in den Filtern. Auf dem Board erscheint sie nicht.",
  board:
    "Die Regel ist eine Spalte des Kanban-Boards. In der Pool-Liste und in den Filtern erscheint sie nicht.",
  both: "Dieselbe Regel an zwei Stellen: als Pool und als Spalte des Boards.",
};

/* ==================================================================== */
/* Terme: Tags und Ordner in einer Liste                                */
/* ==================================================================== */

/**
 * Die Tags einer Termliste. Ordnerterme bleiben, wo sie sind.
 *
 * Zwei Bedienelemente teilen sich eine Liste — die Tag-Eingabe und die
 * Ordnerauswahl —, weil der Dienst eine Liste erwartet. Die Aufteilung findet
 * hier statt und nirgends sonst.
 */
function tagIdsOf(terms: readonly PoolRuleTerm[]): readonly Id[] {
  return terms.flatMap((term) => (term.kind === "tag" ? [term.tagId] : []));
}

function withTagIds(terms: readonly PoolRuleTerm[], next: readonly Id[]): readonly PoolRuleTerm[] {
  return [
    ...next.map((tagId) => ({ kind: "tag", tagId }) as const),
    ...terms.filter((term) => term.kind === "folder"),
  ];
}

function hasFolder(terms: readonly PoolRuleTerm[], folderId: Id): boolean {
  return terms.some((term) => term.kind === "folder" && term.folderId === folderId);
}

function toggleFolder(terms: readonly PoolRuleTerm[], folderId: Id): readonly PoolRuleTerm[] {
  return hasFolder(terms, folderId)
    ? terms.filter((term) => !(term.kind === "folder" && term.folderId === folderId))
    : [...terms, { kind: "folder", folderId } as const];
}

/* ==================================================================== */
/* Bausteine des Formulars                                              */
/* ==================================================================== */

/**
 * Ein benannter Abschnitt im Formular.
 *
 * Neun Felder untereinander sind eine Liste, keine Ordnung. Die Überschriften
 * teilen sie in das, was ein Benutzer sucht: was dazugehören muss, was nicht
 * dazugehören darf, und woran das Todo sonst noch erkennbar ist.
 */
function FormSection({
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

/** Die Ordner einer Termliste — dieselbe Bauform für beide Listen. */
function FolderPicker({
  label,
  hint,
  folders,
  terms,
  onToggle,
}: {
  readonly label: string;
  readonly hint: string;
  readonly folders: ReadonlyArray<{ readonly id: Id; readonly path: readonly string[] }>;
  readonly terms: readonly PoolRuleTerm[];
  readonly onToggle: (folderId: Id) => void;
}) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <div className="tag-picker">
        {folders.length === 0 ? (
          <p className="field__hint">Es gibt noch keinen Ordner.</p>
        ) : (
          folders.map((folder) => {
            const active = hasFolder(terms, folder.id);
            return (
              <button
                key={folder.id}
                type="button"
                className={`folder-chip${active ? " folder-chip--on" : ""}`}
                aria-pressed={active}
                onClick={() => onToggle(folder.id)}
              >
                <Icon name="folder" size={12} />
                {folder.path.join(" / ")}
              </button>
            );
          })
        )}
      </div>
      <p className="field__hint">{hint}</p>
    </div>
  );
}

/**
 * Die Status einer Regel — mehrere möglich, nichts gewählt heißt „Alle".
 *
 * Keine Optionszeile wie bei Erledigt und Exportstatus: Dort gibt es drei feste
 * Werte und genau einen davon, hier eine Menge, die der Benutzer selbst
 * verwaltet. Und keine Mehrfachauswahlliste: Bei einer Handvoll Status ist eine
 * aufklappbare Liste ein zusätzlicher Klick vor einer Antwort, die ohnehin
 * hinpasst.
 *
 * Umschaltknöpfe mit `aria-pressed` und nicht Ankreuzfelder, weil sie dieselbe
 * Bauform wie die Ordnerauswahl darüber haben — dieselbe Frage soll nicht
 * zweimal anders aussehen.
 */
function StatusPicker({
  statuses,
  value,
  onChange,
}: {
  readonly statuses: ReadonlyArray<{ readonly id: Id; readonly name: string }>;
  readonly value: readonly Id[];
  readonly onChange: (next: readonly Id[]) => void;
}) {
  const labelId = useId();
  return (
    <div className="field">
      <span className="field__label" id={labelId}>
        Status
      </span>
      <div className="tag-picker" role="group" aria-labelledby={labelId}>
        {statuses.length === 0 ? (
          <p className="field__hint">Es gibt noch keinen Statuswert.</p>
        ) : (
          statuses.map((status) => {
            const active = value.includes(status.id);
            return (
              <button
                key={status.id}
                type="button"
                className={`folder-chip${active ? " folder-chip--on" : ""}`}
                aria-pressed={active}
                onClick={() =>
                  onChange(
                    active ? value.filter((id) => id !== status.id) : [...value, status.id],
                  )
                }
              >
                <Icon name="square" size={12} />
                {status.name}
              </button>
            );
          })
        )}
      </div>
      <p className="field__hint">
        {value.length === 0
          ? `Nichts gewählt heißt „${POOL_COMPLETION_LABEL.any}“ — ${POOL_AXIS_NEUTRAL_HINT.toLowerCase()}.`
          : `${plural(value.length, "Status gewählt", "Status gewählt")} — ein Todo genügt mit einem davon; es trägt immer genau einen.`}
      </p>
    </div>
  );
}

/* ==================================================================== */
/* Der Dialog                                                           */
/* ==================================================================== */

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

  const [name, setName] = useState("");
  const [placement, setPlacement] = useState<PoolPlacement>(defaultPlacement);
  const [matchMode, setMatchMode] = useState<PoolMatchMode>("any");
  const [includeSubfolders, setIncludeSubfolders] = useState(true);
  const [rule, setRule] = useState<readonly PoolRuleTerm[]>([]);
  const [excludedTags, setExcludedTags] = useState<readonly PoolRuleTerm[]>([]);
  const [statusIds, setStatusIds] = useState<readonly Id[]>([]);
  const [completion, setCompletion] = useState<PoolCompletionFilter>("any");
  const [exportState, setExportState] = useState<PoolExportFilter>("any");

  useEffect(() => {
    if (!open) return;
    setName(pool?.name ?? "");
    setPlacement(pool?.placement ?? defaultPlacement);
    // Die Vorgabe ist `any` und bleibt es — Punkt 1 im Kopf dieser Datei.
    setMatchMode(pool?.matchMode ?? "any");
    setIncludeSubfolders(pool?.includeSubfolders ?? true);
    setRule(pool?.rule ?? []);
    setExcludedTags(pool?.excludedTags ?? []);
    setStatusIds(pool?.statusIds ?? []);
    setCompletion(pool?.completion ?? "any");
    setExportState(pool?.exportState ?? "any");
  }, [open, pool, defaultPlacement]);

  const trimmed = name.trim();
  const isBoardColumn = placement !== "pool";
  const surface = isBoardColumn ? "Spalte" : "Pool";

  const axes = useMemo<RuleAxes>(
    () => ({ matchMode, includeSubfolders, rule, excludedTags, statusIds, completion, exportState }),
    [matchMode, includeSubfolders, rule, excludedTags, statusIds, completion, exportState],
  );

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
    [axes, folders, statuses, structure],
  );

  const conditions = countConditions(axes);

  /**
   * Der Modus wurde umgestellt — und die Regel hat mehr als einen Tag.
   *
   * Bei null oder einem Tag ist der Unterschied keiner: „mindestens eines von
   * einem" und „alle von einem" treffen dasselbe. Eine Warnung dort wäre eine
   * Warnung ohne Folge, und die nächste echte glaubte dann niemand mehr.
   */
  const modeMatters = rule.length > 1 || rule.some((term) => term.kind === "folder");
  const modeChanged = pool !== undefined && pool.matchMode !== matchMode && modeMatters;

  return (
    <FormDialog
      open={open}
      title={
        pool === undefined
          ? defaultPlacement === "pool"
            ? "Neuen Pool anlegen"
            : "Neue Board-Spalte anlegen"
          : `„${pool.name}“ bearbeiten`
      }
      description="Eine Regel nennt Bedingungen. Jede engt weiter ein: Erforderliche Tags müssen da sein, ausgeschlossene dürfen es nicht, und Status, Erledigt und Exportstatus grenzen weiter ab. Was auf „Alle“ steht, schränkt nicht ein."
      submitLabel={pool === undefined ? "Anlegen" : "Speichern"}
      submitDisabled={trimmed.length === 0}
      busy={mutation.busy}
      error={mutation.error}
      onSubmit={() => {
        void mutation.run(async () => {
          const body = {
            name: trimmed,
            matchMode,
            includeSubfolders,
            placement,
            rule,
            excludedTags,
            statusIds,
            completion,
            exportState,
          };
          const saved = pool === undefined ? await createPool(body) : await updatePool(pool.id, body);
          structure.reload();
          bump();
          toasts.show({
            tone: conditions === 0 ? "warning" : "success",
            title:
              pool === undefined
                ? isBoardColumn
                  ? "Spalte angelegt."
                  : "Pool angelegt."
                : "Regel geändert.",
            body:
              conditions === 0
                ? `„${saved.name}“ nennt noch keine Bedingung und bleibt deshalb leer. Ergänzen Sie eine, dann füllt sie sich von selbst.`
                : `„${saved.name}“ — ${plural(conditions, "Bedingung", "Bedingungen")}, Anzeigeort: ${POOL_PLACEMENT_LABEL[saved.placement]}.`,
          });
          onSaved?.(saved);
          onClose();
        });
      }}
      onCancel={onClose}
    >
      <TextField
        label="Name"
        value={name}
        onChange={setName}
        required
        maxLength={128}
        placeholder={isBoardColumn ? "z. B. Wartet auf Rückmeldung" : "z. B. Kunden Nord"}
      />

      <Select
        label="Anzeigeort"
        value={placement}
        onChange={(next) => setPlacement(next as PoolPlacement)}
        options={[
          { value: "pool", label: POOL_PLACEMENT_LABEL.pool },
          { value: "board", label: POOL_PLACEMENT_LABEL.board },
          { value: "both", label: POOL_PLACEMENT_LABEL.both },
        ]}
        hint={PLACEMENT_HINT[placement]}
      />

      <FormSection
        title="Erforderliche Tags"
        lead="Was ein Todo tragen muss, damit es dazugehört. Ein genannter Ordner steht für die Tags, die in ihm liegen."
      >
        <TagInput
          label="Tags"
          hideLabel
          value={tagIdsOf(rule)}
          onChange={(next) => setRule((current) => withTagIds(current, next))}
          placeholder="Tag suchen und hinzufügen"
          hint="Ein genanntes Tag trifft jedes Todo, das es trägt."
        />

        <RadioRow
          label="Wie viele davon müssen zutreffen?"
          value={matchMode}
          onChange={setMatchMode}
          options={[
            { value: "any", label: POOL_MATCH_MODE_LABEL.any, hint: POOL_MATCH_MODE_HINT.any },
            { value: "all", label: POOL_MATCH_MODE_LABEL.all, hint: POOL_MATCH_MODE_HINT.all },
          ]}
        />

        {modeChanged ? (
          <InlineMessage tone="warning" title="Diese Regel trifft danach andere Todos">
            {pool?.matchMode === "any"
              ? "Bisher genügte eines der genannten Tags. Mit „Alle davon“ muss ein Todo ab dem Speichern jeden davon tragen — die Regel trifft dann weniger."
              : "Bisher mussten alle genannten Tags zutreffen. Mit „Mindestens eines davon“ genügt ab dem Speichern eines — die Regel trifft dann mehr."}
          </InlineMessage>
        ) : null}

        <FolderPicker
          label="Ordner"
          hint="Ein Ordner steht für alles, was in ihm liegt."
          folders={folders}
          terms={rule}
          onToggle={(folderId) => setRule((current) => toggleFolder(current, folderId))}
        />
      </FormSection>

      <FormSection
        title="Ausgeschlossene Tags"
        lead="Was ein Todo nicht tragen darf. Keines davon — dafür gibt es keine Einstellung, „ausgeschlossen“ heißt immer „keines davon“."
      >
        <TagInput
          label="Tags"
          hideLabel
          value={tagIdsOf(excludedTags)}
          onChange={(next) => setExcludedTags((current) => withTagIds(current, next))}
          placeholder="Tag suchen und ausschließen"
          hint="Trägt ein Todo eines dieser Tags, gehört es nicht dazu — auch wenn alles andere passt."
        />

        <FolderPicker
          label="Ordner"
          hint="Ein ausgeschlossener Ordner schließt jedes Tag darin aus."
          folders={folders}
          terms={excludedTags}
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
        title="Ordnertiefe"
        lead="Eine Einstellung für beide Listen — erforderliche wie ausgeschlossene Ordner."
      >
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={includeSubfolders}
            onChange={(event) => setIncludeSubfolders(event.target.checked)}
          />
          <span>
            Unterordner einschließen
            <span className="checkbox-row__hint">
              Ein genannter Ordner steht dann auch für alles, was tiefer liegt — beliebig tief.
              Ohne Haken zählen nur die Tags unmittelbar im Ordner.
            </span>
          </span>
        </label>
      </FormSection>

      <FormSection
        title="Weitere Bedingungen"
        lead="Drei Achsen, die keine Tags brauchen. Jede steht auf „Alle“, solange sie nicht einschränken soll."
      >
        <StatusPicker statuses={statuses} value={statusIds} onChange={setStatusIds} />

        <RadioRow
          label="Erledigt"
          value={completion}
          onChange={setCompletion}
          neutralNote={POOL_AXIS_NEUTRAL_HINT.toLowerCase()}
          options={[
            {
              value: "any",
              label: POOL_COMPLETION_LABEL.any,
              neutral: true,
              hint: "Erledigt entscheidet nicht über die Zugehörigkeit. Ob erledigte Karten zu sehen sind, sagt dann wie bisher der Schalter „Erledigte einblenden“.",
            },
            {
              value: "done",
              label: POOL_COMPLETION_LABEL.done,
              hint: "Nur erledigte Todos. Diese Regel hat das letzte Wort — die Karten erscheinen auch dann, wenn erledigte sonst ausgeblendet sind. Hebt ein Timerstart das Kennzeichen auf, verlässt die Karte diese Spalte und steht wieder in ihrem Pool.",
            },
            {
              value: "open",
              label: POOL_COMPLETION_LABEL.open,
              hint: "Nur unerledigte Todos. Hebt ein Timerstart das Kennzeichen auf, kehrt das Todo ohne Zutun hierher zurück.",
            },
          ]}
        />

        <RadioRow
          label="Exportstatus"
          value={exportState}
          onChange={setExportState}
          neutralNote={POOL_AXIS_NEUTRAL_HINT.toLowerCase()}
          options={[
            {
              value: "any",
              label: POOL_EXPORT_LABEL.any,
              neutral: true,
              hint: "Der Exportstatus entscheidet nicht über die Zugehörigkeit.",
            },
            {
              value: "open",
              label: POOL_EXPORT_LABEL.open,
              hint: "Todos mit mindestens einer abgeschlossenen, offenen Buchung — die Antwort auf „was habe ich noch nicht abgerechnet“.",
            },
            {
              value: "exported",
              label: POOL_EXPORT_LABEL.exported,
              // Punkt 4 im Kopf dieser Datei, an der Stelle, an der gewaehlt
              // wird: Der Exportstatus haengt an der Buchung, nicht am Todo.
              hint: "Todos mit mindestens einer exportierten Buchung. Nicht „vollständig abgerechnet“: Ein Todo mit einer offenen und einer exportierten Buchung erfüllt beide Bedingungen und steht in beiden Spalten.",
            },
          ]}
        />
      </FormSection>

      <FormSection title="Diese Regel trifft" lead="So liest sie sich, sobald sie gespeichert ist.">
        <RuleSummary
          description={description}
          showNeutral
          size="md"
          emptyText={`Keine Bedingung — diese Regel trifft nichts. ${surface === "Spalte" ? "Die Spalte" : "Der Pool"} bleibt leer, bis eine Bedingung dazukommt.`}
        />
      </FormSection>

      {conditions === 0 ? (
        <InlineMessage
          tone="warning"
          title={isBoardColumn ? "Diese Spalte bleibt leer" : "Dieser Pool bleibt leer"}
        >
          Es ist noch keine Bedingung gewählt. Eine Regel ohne Bedingung trifft <strong>nichts</strong>{" "}
          — nicht alles. Anlegen lässt sie sich trotzdem: Sie bleibt leer, bis Sie eine Bedingung
          ergänzen, und füllt sich dann von selbst.
        </InlineMessage>
      ) : null}

      <InlineMessage tone="info" title="Nichts wird gespeichert außer der Regel">
        Eine Regel merkt sich keine Todos. Ändern sich die Tags, der Status oder die Buchungen eines
        Todos, ändert sich seine Zugehörigkeit von selbst — und ein erledigtes Todo kehrt beim
        Timerstart ohne Zutun zurück. Auf dem Board heißt das: Karten wandern, wenn sich etwas an
        ihnen ändert, nicht wenn man sie schiebt.
      </InlineMessage>
    </FormDialog>
  );
}
