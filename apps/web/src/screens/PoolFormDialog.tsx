import { useEffect, useMemo, useState } from "react";
import { createPool, updatePool } from "../api/endpoints";
import type { Pool, PoolPlacement, PoolRuleTerm } from "../api/types";
import { FormDialog, TextField } from "../components/FormDialog";
import { Icon } from "../components/Icon";
import { InlineMessage } from "../components/Primitives";
import { Select } from "../components/Select";
import { TagInput } from "../components/TagInput";
import { useRefresh } from "../app/RefreshContext";
import { useStructure } from "../app/StructureContext";
import { useToasts } from "../app/ToastContext";
import { useMutation } from "../app/useAsync";
import { flatFolders } from "../lib/folderPaths";
import { plural } from "../lib/format";
import { POOL_PLACEMENT_LABEL } from "../lib/labels";

/**
 * Takt — eine Regel anlegen und ändern (S-11, I-13, E-054).
 *
 * ## Ein Formular für zwei Flächen
 *
 * Seit E-054 ist eine Kanban-Spalte dieselbe Entität wie ein Pool: derselbe
 * Name, dieselbe Regel, dieselbe Auflösung über Ordner. Der einzige
 * Unterschied ist `placement` — wo die Regel erscheint. Deshalb steht hier
 * **ein** Formular und nicht zwei, die dasselbe Feld für Feld wiederholen und
 * dann auseinanderlaufen.
 *
 * Der Anzeigeort ist ein eigenes Feld und keine stille Voreinstellung: Wer
 * eine Spalte für das Board anlegt, will sie oft **nicht** zusätzlich in seiner
 * Pool-Liste sehen — und umgekehrt. Beides ist gleich gültig, also wird
 * gefragt. Der dritte Wert `both` steht bereit, weil dieselbe Regel an zwei
 * Stellen nützlich sein kann; einen vierten Zustand „nirgends" gibt es nicht.
 *
 * ## Ohne Regel bleibt die Fläche leer
 *
 * Eine leere Regel trifft nichts — nicht alles (A-3.4, T-009). Der Knopf
 * bleibt deshalb gesperrt, solange keine Bedingung gewählt ist, und das Feld
 * sagt warum, statt den Benutzer eine leere Spalte anlegen zu lassen und ihn
 * anschließend rätseln zu lassen.
 */

const PLACEMENT_HINT: Readonly<Record<PoolPlacement, string>> = {
  pool: "Die Regel steht im Pool-Bereich und in den Filtern. Auf dem Board erscheint sie nicht.",
  board:
    "Die Regel ist eine Spalte des Kanban-Boards. In der Pool-Liste und in den Filtern erscheint sie nicht.",
  both: "Dieselbe Regel an zwei Stellen: als Pool und als Spalte des Boards.",
};

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

  const tree = structure.state.status === "ready" ? structure.state.value.tagTree : null;
  const folders = useMemo(() => (tree === null ? [] : flatFolders(tree)), [tree]);

  const [name, setName] = useState("");
  const [placement, setPlacement] = useState<PoolPlacement>(defaultPlacement);
  const [matchMode, setMatchMode] = useState<"any" | "all">("any");
  const [includeSubfolders, setIncludeSubfolders] = useState(true);
  const [rule, setRule] = useState<readonly PoolRuleTerm[]>([]);

  useEffect(() => {
    if (!open) return;
    setName(pool?.name ?? "");
    setPlacement(pool?.placement ?? defaultPlacement);
    setMatchMode(pool?.matchMode ?? "any");
    setIncludeSubfolders(pool?.includeSubfolders ?? true);
    setRule(pool?.rule ?? []);
  }, [open, pool, defaultPlacement]);

  const trimmed = name.trim();
  const isBoardColumn = placement !== "pool";

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
      description="Eine Regel nennt Tags und Ordner. Ein Ordner steht für alles, was in ihm liegt. Wo die Regel erscheint, entscheidet der Anzeigeort — die Regel selbst ist dieselbe."
      submitLabel={pool === undefined ? "Anlegen" : "Speichern"}
      submitDisabled={trimmed.length === 0 || rule.length === 0}
      busy={mutation.busy}
      error={mutation.error}
      onSubmit={() => {
        void mutation.run(async () => {
          const body = { name: trimmed, matchMode, includeSubfolders, placement, rule };
          const saved = pool === undefined ? await createPool(body) : await updatePool(pool.id, body);
          structure.reload();
          bump();
          toasts.success(
            pool === undefined
              ? isBoardColumn
                ? "Spalte angelegt."
                : "Pool angelegt."
              : "Regel geändert.",
            `„${saved.name}“ — Anzeigeort: ${POOL_PLACEMENT_LABEL[saved.placement]}.`,
          );
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

      <Select
        label="Wie viele Regel-Tags müssen zutreffen?"
        value={matchMode}
        onChange={(next) => setMatchMode(next as "any" | "all")}
        options={[
          { value: "any", label: "Mindestens einer" },
          { value: "all", label: "Alle" },
        ]}
      />

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={includeSubfolders}
          onChange={(event) => setIncludeSubfolders(event.target.checked)}
        />
        <span>
          Unterordner einschließen
          <span className="checkbox-row__hint">
            Ein genannter Ordner steht dann auch für alles, was tiefer liegt.
          </span>
        </span>
      </label>

      <TagInput
        label="Regel — Tags"
        value={rule.flatMap((term) => (term.kind === "tag" ? [term.tagId] : []))}
        onChange={(next) =>
          setRule([
            ...next.map((tagId) => ({ kind: "tag", tagId }) as const),
            ...rule.filter((term) => term.kind === "folder"),
          ])
        }
        hint="Ein genanntes Tag trifft jedes Todo, das es trägt."
      />

      <div className="field">
        <span className="field__label">Regel — Ordner</span>
        <div className="tag-picker">
          {folders.length === 0 ? (
            <p className="field__hint">Es gibt noch keinen Ordner.</p>
          ) : (
            folders.map((folder) => {
              const active = rule.some(
                (term) => term.kind === "folder" && term.folderId === folder.id,
              );
              return (
                <button
                  key={folder.id}
                  type="button"
                  className={`folder-chip${active ? " folder-chip--on" : ""}`}
                  aria-pressed={active}
                  onClick={() =>
                    setRule((previous) =>
                      active
                        ? previous.filter(
                            (term) => !(term.kind === "folder" && term.folderId === folder.id),
                          )
                        : [...previous, { kind: "folder", folderId: folder.id }],
                    )
                  }
                >
                  <Icon name="folder" size={12} />
                  {folder.path.join(" / ")}
                </button>
              );
            })
          )}
        </div>
        {rule.length === 0 ? (
          <p className="field__error">
            {isBoardColumn
              ? "Ohne Regel bliebe die Spalte immer leer. Wählen Sie mindestens einen Tag oder Ordner."
              : "Ohne Regel bliebe der Pool immer leer. Wählen Sie mindestens einen Tag oder Ordner."}
          </p>
        ) : (
          <p className="field__hint">{plural(rule.length, "Bedingung", "Bedingungen")} gewählt.</p>
        )}
      </div>

      <InlineMessage tone="info" title="Nichts wird gespeichert außer der Regel">
        Eine Regel merkt sich keine Todos. Ändern sich die Tags eines Todos, ändert sich seine
        Zugehörigkeit von selbst — und ein erledigtes Todo kehrt beim Timerstart ohne Zutun
        zurück. Auf dem Board heißt das: Karten wandern, wenn Tags sich ändern, nicht wenn man
        sie schiebt.
      </InlineMessage>
    </FormDialog>
  );
}
