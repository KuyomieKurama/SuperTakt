import { useCallback, useMemo, useState } from "react";
import { errorMessage } from "../api/client";
import {
  createTag,
  createTagFolder,
  deletePool,
  deleteTag,
  deleteTagFolder,
  moveTagFolder,
  renameTagFolder,
  updatePool,
  updateTag,
} from "../api/endpoints";
import type { Id, Pool, PoolPlacement, TagFolderNode, TagTree as TagTreeData } from "../api/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Select } from "../components/Select";
import { FormDialog, TextField } from "../components/FormDialog";
import { Icon } from "../components/Icon";
import { Button, Card, EmptyState, InlineMessage } from "../components/Primitives";
import { RuleSummary } from "../components/RuleSummary";
import { TagPath } from "../components/Tag";
import { TagTree, type TagTreeNode } from "../components/TagTree";
import { useRefresh } from "../app/RefreshContext";
import { navigate } from "../app/router";
import { useRuleLookup, useStructure } from "../app/StructureContext";
import { useToasts } from "../app/ToastContext";
import { useMutation } from "../app/useAsync";
import { errorMessageWithRules } from "../lib/errorText";
import { flatFolders } from "../lib/folderPaths";
import { POOL_PLACEMENT_LABEL, POOL_PLACEMENT_SHORT } from "../lib/labels";
import { axesOf, describeRule, describeRuleReach } from "../lib/poolRule";
import { AsyncBoundary, ScreenHeader } from "./parts";
import { PoolFormDialog } from "./PoolFormDialog";

/**
 * Takt — S-08 (Tags und Ordner) und S-11 (Pools).
 *
 * ## Tiefe Bäume bleiben navigierbar (A-4.3, A-13.3)
 *
 * Der Baum ist beliebig tief. Er wird in **einem** Aufruf geladen und als
 * `tree`/`treeitem` ausgezeichnet: aufklappen mit Pfeil rechts, zuklappen mit
 * Pfeil links, wandern mit Pfeil hoch und runter — die übliche Bedienung, die
 * ein Bildschirmleser ansagt („Ebene 3 von 5“). Wo ein Tag außerhalb des
 * Baums steht, steht sein voller Pfad daneben, gekürzt in der Mitte statt am
 * Ende: Ein Pfad, der mit „Kunden / …“ abbricht, sagt nichts.
 *
 * ## Pools sind Regeln, keine Zuordnungen (A-3.4)
 *
 * Ein Pool speichert nie, welche Todos in ihm liegen. Er speichert eine Regel
 * über Tags und Ordner, und die Zugehörigkeit wird bei jeder Abfrage neu
 * bestimmt. Genau deshalb funktioniert A-2.5 ohne Zusatzschritt: Ein Todo
 * kehrt in seine Pools zurück, weil es das nie verlassen hat — es war nur
 * ausgeblendet.
 */

export function TagsScreen() {
  const structure = useStructure();

  return (
    <section className="screen">
      <ScreenHeader
        title="Tags"
        lead="Tags, Ordner und die Regeln darüber. Dieselbe Regel kann ein Pool sein, eine Spalte des Kanban-Boards oder beides (E-054)."
      />

      <AsyncBoundary
        state={structure.state}
        label="Tags werden geladen"
        rows={5}
        onRetry={structure.reload}
      >
        {(value) => (
          <div className="tags-layout">
            <TagAdministration tree={value.tagTree} />
            <PoolAdministration rules={value.rules} />
          </div>
        )}
      </AsyncBoundary>
    </section>
  );
}

/* ==================================================================== */
/* Tags und Ordner                                                      */
/* ==================================================================== */

type Selection =
  | { readonly kind: "folder"; readonly id: Id; readonly name: string; readonly parentId: Id | null }
  | { readonly kind: "tag"; readonly id: Id; readonly name: string; readonly folderId: Id | null }
  | null;

function TagAdministration({ tree }: { readonly tree: TagTreeData }) {
  const structure = useStructure();
  const toasts = useToasts();
  const { bump } = useRefresh();
  const mutation = useMutation();

  const [selected, setSelected] = useState<Selection>(null);
  const [tagDialog, setTagDialog] = useState(false);
  const [folderDialog, setFolderDialog] = useState(false);
  const [renameDialog, setRenameDialog] = useState(false);
  const [moveDialog, setMoveDialog] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Selection>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [targetFolder, setTargetFolder] = useState<string>("");
  /*
   * Eigener Vorgang neben `mutation`: Der Dialog zeigt seinen Fehler im
   * Dialog, das Ziehen hat keinen Dialog, in dem er stehen koennte. Beides
   * ueber denselben Zustand laufen zu lassen hiesse, dass ein misslungenes
   * Ziehen den naechsten Dialog mit einer alten Meldung oeffnet.
   */
  const dragMove = useMutation();

  const nodes = useMemo(() => toTreeNodes(tree), [tree]);
  const folders = useMemo(() => flatFolders(tree), [tree]);

  const after = useCallback(() => {
    structure.reload();
    bump();
  }, [bump, structure]);

  const currentFolderId =
    selected === null ? null : selected.kind === "folder" ? selected.id : selected.folderId;

  return (
    <>
      <Card
        title="Tags und Ordner"
        description="Beliebig tief verschachtelbar. Ein Tag liegt in genau einem Ordner oder auf der Wurzelebene."
        actions={
          <>
            <Button
              size="sm"
              variant="secondary"
              iconStart="folder"
              onClick={() => {
                setName("");
                setFolderDialog(true);
              }}
            >
              Ordner
            </Button>
            <Button
              size="sm"
              variant="primary"
              iconStart="plus"
              onClick={() => {
                setName("");
                setTagDialog(true);
              }}
            >
              Tag
            </Button>
          </>
        }
      >
        {nodes.length === 0 ? (
          <EmptyState
            icon="tag"
            title="Noch kein Tag"
            description="Tags ordnen Todos, und die meisten Regeln fragen nach ihnen. Ohne ein einziges Tag bleibt von einer Regel nur, was sie über Status, „Erledigt“ und den Exportstatus sagt."
            action={
              <Button
                variant="primary"
                iconStart="plus"
                onClick={() => {
                  setName("");
                  setTagDialog(true);
                }}
              >
                Ersten Tag anlegen
              </Button>
            }
          />
        ) : (
          <div className="tags-split">
            {/*
              Ein misslungenes Ziehen hat keinen Dialog, in dem der Grund
              stehen koennte — zum Beispiel `tag_folder_cycle`, wenn der
              Bestand zwischenzeitlich ein anderer war als der angezeigte.
              Die Meldung steht deshalb ueber dem Baum und bleibt, bis sie
              gelesen ist.
            */}
            {dragMove.error === null ? null : (
              <InlineMessage
                className="tags-split__error"
                tone="danger"
                title="Das Verschieben hat nicht geklappt"
                onDismiss={dragMove.clearError}
              >
                {dragMove.error}
              </InlineMessage>
            )}
            <TagTree
              nodes={nodes}
              label="Tags und Ordner"
              selectedId={selected?.id ?? null}
              moveBusy={dragMove.busy}
              onSelect={(node) => {
                const found = findSelection(tree, node.id);
                setSelected(found);
              }}
              onMove={(node, targetFolderId) => {
                void dragMove.run(async () => {
                  /*
                   * Zwei Wege, ein Ziel — die beiden Routen sind aber nicht
                   * dieselbe (I-07, I-08): Ein Tag zieht um, indem sein
                   * `folderId` neu gesetzt wird; ein Ordner hat dafuer eine
                   * eigene Route, weil dort die Zyklusprüfung sitzt (A-4.6).
                   * Der Schluessel heisst `newParentId` — er hiess hier bis
                   * T-050 anders und legte das Verschieben lahm.
                   */
                  if (node.kind === "tag") await updateTag(node.id, { folderId: targetFolderId });
                  else await moveTagFolder(node.id, targetFolderId);
                  after();
                  const place =
                    targetFolderId === null
                      ? "auf der Wurzelebene"
                      : `in „${folderName(tree, targetFolderId)}“`;
                  toasts.success(`„${node.label}“ liegt jetzt ${place}.`);
                });
              }}
            />

            <div className="tags-detail">
              {selected === null ? (
                <p className="muted">
                  Wählen Sie links einen Eintrag. Dann erscheinen hier seine Aktionen.
                </p>
              ) : (
                <>
                  <p className="tags-detail__kind overline">
                    {selected.kind === "folder" ? "Ordner" : "Tag"}
                  </p>
                  <h4 className="tags-detail__name">{selected.name}</h4>
                  <p className="tags-detail__path">
                    <TagPath segments={pathOf(tree, selected.id)} />
                  </p>

                  <div className="tags-detail__actions">
                    <Button
                      size="sm"
                      variant="secondary"
                      iconStart="pencil"
                      onClick={() => {
                        setName(selected.name);
                        setRenameDialog(true);
                      }}
                    >
                      Umbenennen
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      iconStart="folder-open"
                      onClick={() => {
                        setTargetFolder(
                          (selected.kind === "tag" ? selected.folderId : selected.parentId) ?? "",
                        );
                        setMoveDialog(true);
                      }}
                    >
                      Verschieben
                    </Button>
                    {selected.kind === "tag" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        iconStart="filter"
                        onClick={() => navigate("todos", undefined, { tag: selected.id })}
                      >
                        Todos mit diesem Tag
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="danger"
                      iconStart="trash"
                      onClick={() => {
                        setDeleteError(null);
                        setPendingDelete(selected);
                      }}
                    >
                      Löschen
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Neuer Tag */}
      <FormDialog
        open={tagDialog}
        title="Neuen Tag anlegen"
        description={
          currentFolderId === null
            ? "Er landet auf der Wurzelebene. Über die Ordnerwahl geht es auch tiefer."
            : "Er landet im gerade gewählten Ordner."
        }
        submitLabel="Anlegen"
        submitDisabled={name.trim().length === 0}
        busy={mutation.busy}
        error={mutation.error}
        onSubmit={() => {
          void mutation.run(async () => {
            await createTag({ name: name.trim(), folderId: currentFolderId, color: null });
            setTagDialog(false);
            after();
            toasts.success("Tag angelegt.");
          });
        }}
        onCancel={() => setTagDialog(false)}
      >
        <TextField label="Name" value={name} onChange={setName} required maxLength={128} />
      </FormDialog>

      {/* Neuer Ordner */}
      <FormDialog
        open={folderDialog}
        title="Neuen Ordner anlegen"
        description="Ordner können beliebig tief ineinander liegen."
        submitLabel="Anlegen"
        submitDisabled={name.trim().length === 0}
        busy={mutation.busy}
        error={mutation.error}
        onSubmit={() => {
          void mutation.run(async () => {
            await createTagFolder({ name: name.trim(), parentId: currentFolderId });
            setFolderDialog(false);
            after();
            toasts.success("Ordner angelegt.");
          });
        }}
        onCancel={() => setFolderDialog(false)}
      >
        <TextField label="Name" value={name} onChange={setName} required maxLength={128} />
      </FormDialog>

      {/* Umbenennen */}
      <FormDialog
        open={renameDialog}
        title="Umbenennen"
        submitLabel="Speichern"
        submitDisabled={name.trim().length === 0}
        busy={mutation.busy}
        error={mutation.error}
        onSubmit={() => {
          const target = selected;
          if (target === null) return;
          void mutation.run(async () => {
            if (target.kind === "tag") await updateTag(target.id, { name: name.trim() });
            else await renameTagFolder(target.id, name.trim());
            setRenameDialog(false);
            setSelected({ ...target, name: name.trim() });
            after();
            toasts.success("Umbenannt.");
          });
        }}
        onCancel={() => setRenameDialog(false)}
      >
        <TextField label="Name" value={name} onChange={setName} required maxLength={128} />
      </FormDialog>

      {/* Verschieben — I-07 und I-08 */}
      <FormDialog
        open={moveDialog}
        title={selected?.kind === "tag" ? "Tag verschieben" : "Ordner verschachteln"}
        description={
          selected?.kind === "tag"
            ? "Ein Tag liegt in genau einem Ordner. Die Todos, die ihn tragen, bleiben unberührt."
            : "Ein Ordner kann nicht unter einen seiner eigenen Unterordner. Takt lehnt das ab, statt einen Zyklus anzulegen."
        }
        submitLabel="Verschieben"
        busy={mutation.busy}
        error={mutation.error}
        onSubmit={() => {
          const target = selected;
          if (target === null) return;
          const parentId = targetFolder.length === 0 ? null : targetFolder;
          void mutation.run(async () => {
            if (target.kind === "tag") await updateTag(target.id, { folderId: parentId });
            else await moveTagFolder(target.id, parentId);
            setMoveDialog(false);
            after();
            toasts.success("Verschoben.");
          });
        }}
        onCancel={() => setMoveDialog(false)}
      >
        {/*
          Nicht „Zielordner" (Befund C-18): So heißt in S-07 und S-09 der
          Ordner, in den die Exportdatei geschrieben wird, und der hat mit
          einem Tag-Ordner nichts zu tun. Ein Wort für zwei Sachen ist genau
          die Verwechslung, die man in einer Ordnerauswahl nicht brauchen kann.
        */}
        <Select
          label={selected?.kind === "tag" ? "Ordner für dieses Tag" : "Neuer übergeordneter Ordner"}
          value={targetFolder}
          onChange={setTargetFolder}
          options={[
            { value: "", label: "Wurzelebene" },
            ...folders
              .filter((folder) => selected === null || folder.id !== selected.id)
              .map((folder) => ({ value: folder.id, label: folder.path.join(" / ") })),
          ]}
        />
      </FormDialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        tone="danger"
        title={pendingDelete?.kind === "folder" ? "Ordner löschen?" : "Tag löschen?"}
        description={pendingDelete === null ? "" : `„${pendingDelete.name}“ wird entfernt.`}
        /*
          Nach einer Absage steht hier die Meldung des Dienstes — mit den
          Regeln beim Namen, wenn er welche genannt hat (T-097). Vorher steht
          da, woran das Löschen scheitern kann, und seit T-089 sind das je zwei
          Gründe: der Inhalt und die Regel. Der zweite fehlte hier, obwohl er
          derselbe ist, den der Dienst gleich nennt.
        */
        consequence={
          deleteError ??
          (pendingDelete?.kind === "folder"
            ? "Ein Ordner, in dem noch etwas liegt, wird nicht gelöscht — und ein Ordner, den eine Regel nennt, ebenso wenig. Räumen Sie ihn vorher aus oder nehmen Sie ihn aus der Regel heraus."
            : "Ein Tag, der noch an einem Todo hängt, wird nicht gelöscht — und ein Tag, den eine Regel nennt, ebenso wenig. Die Regel verlöre sonst still ihre Bedeutung.")
        }
        confirmLabel="Löschen"
        onConfirm={() => {
          const target = pendingDelete;
          if (target === null) return;
          void (target.kind === "tag" ? deleteTag(target.id) : deleteTagFolder(target.id))
            .then(() => {
              setPendingDelete(null);
              setSelected(null);
              after();
              toasts.success("Gelöscht.");
            })
            .catch((cause: unknown) => {
              /*
                Mit den Regeln beim Namen (T-097). Der Dienst weist ein Tag und
                einen Ordner mit demselben Schlüssel ab (`tag_in_use`) und legt
                seit T-089 in `details` ab, **welche** Regeln ihn verwenden.
                Bis T-097 stand hier nur `cause.message`, und die Namen fielen
                unter den Tisch — bei zwanzig Regeln ist das der Unterschied
                zwischen einer Auskunft und einer Suche.
              */
              setDeleteError(errorMessageWithRules(cause));
            });
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

/* ==================================================================== */
/* Pools (S-11, I-13)                                                   */
/* ==================================================================== */

function PoolAdministration({ rules }: { readonly rules: readonly Pool[] }) {
  const structure = useStructure();
  const toasts = useToasts();
  const { bump } = useRefresh();

  const [form, setForm] = useState<{ readonly pool?: Pool } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Pool | null>(null);

  const lookup = useRuleLookup();

  /**
   * Den Anzeigeort einer Regel ändern — mit demselben Rückweg wie auf dem
   * Board (S-5 aus R-2).
   *
   * Bis T-091 war „Vom Board nehmen" hier eine Sofortaktion ohne Rückweg und
   * auf dem Board dieselbe Handlung hinter einem Bestätigungsdialog. Zwei
   * Schutzniveaus für dieselbe Handlung lehren, dass eines davon bedeutungslos
   * ist. Jetzt haben beide Flächen denselben: ein Toast, der sagt, dass nichts
   * verlorengeht, und einen Knopf, mit dem man es ausprobieren kann.
   */
  const setPlacement = (pool: Pool, placement: PoolPlacement, undoable = true): void => {
    const previous = pool.placement;
    void updatePool(pool.id, { placement })
      .then(() => {
        structure.reload();
        bump();
        toasts.show({
          tone: "success",
          title: "Anzeigeort geändert.",
          body: `„${pool.name}“ — Anzeigeort: ${POOL_PLACEMENT_LABEL[placement]}. Die Regel bleibt vollständig erhalten; gelöscht wird nichts, und an den Todos ändert sich nichts.`,
          ...(undoable && previous !== placement
            ? {
                action: {
                  label: "Rückgängig",
                  onSelect: () => setPlacement({ ...pool, placement }, previous, false),
                },
              }
            : {}),
        });
      })
      .catch((cause: unknown) =>
        toasts.failure("Der Anzeigeort ließ sich nicht ändern", errorMessage(cause)),
      );
  };

  return (
    <>
      <Card
        title="Regeln"
        description="Eine Regel bündelt Todos — über Tags, Status, „Erledigt“ und den Exportstatus. Wo sie erscheint, sagt der Anzeigeort: im Pool-Bereich, als Spalte des Kanban-Boards oder an beiden Stellen (E-054)."
        actions={
          <Button size="sm" variant="primary" iconStart="plus" onClick={() => setForm({})}>
            Neue Regel
          </Button>
        }
      >
        {rules.length === 0 ? (
          <EmptyState
            compact
            icon="filter"
            title="Noch keine Regel"
            description="Eine Regel bündelt Todos — etwa alles unter dem Ordner „Kunden“ oder alles Erledigte, das noch nicht abgerechnet ist. Dieselbe Regel kann als Pool und als Kanban-Spalte dienen."
            action={
              <Button variant="primary" iconStart="plus" onClick={() => setForm({})}>
                Erste Regel anlegen
              </Button>
            }
          />
        ) : (
          <ul className="pool-list">
            {rules.map((pool) => {
              const poolDescription = describeRule(axesOf(pool), lookup);

              return (
              <li key={pool.id} className="pool-row">
                <div className="grow">
                  <p className="pool-row__name">
                    {pool.name}
                    <span className={`placement-badge placement-badge--${pool.placement}`}>
                      <Icon name={pool.placement === "pool" ? "filter" : "square"} size={11} />
                      {POOL_PLACEMENT_SHORT[pool.placement]}
                    </span>
                  </p>
                  {/*
                    Dieselbe Zusammenfassung wie unter jedem Spaltenkopf des
                    Boards (T-079). Bis dahin stand hier eine zweite Fassung,
                    die nur die Tagliste kannte — seit die Regel fuenf Achsen
                    hat, haette sie eine Regel behauptet, die es nicht gibt.

                    Und derselbe Befund: Ein erforderlicher Ordner ohne Tag ist
                    ein Einrichtungsfehler und keine Regel ohne Treffer
                    (E-057, T-083). Er gehoert auf jede Flaeche, die eine Regel
                    zeigt, nicht nur auf das Board. `reach` kommt aus derselben
                    Beschreibung, die die Chips zeichnet — der Ordner, den die
                    Warnung nennt, ist der markierte Chip darueber.
                  */}
                  <RuleSummary
                    className="pool-row__rule"
                    description={poolDescription}
                    reach={describeRuleReach(poolDescription, pool.resolved)}
                    emptyText="Ohne Bedingung — dieser Pool bleibt leer."
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  iconStart="filter"
                  onClick={() => navigate("todos", undefined, { pool: pool.id })}
                >
                  Todos ansehen
                </Button>
                {/*
                  Der Anzeigeort ist der einzige Unterschied zwischen Pool und
                  Spalte (E-054) — deshalb steht er als ein Griff hier und
                  nicht nur im Formular. „Nur auf dem Board" bleibt dem Dialog
                  vorbehalten: Wer eine Regel aus seinen Pools nehmen will,
                  soll dabei lesen, was das bedeutet.
                */}
                <Button
                  size="sm"
                  variant="ghost"
                  iconStart={pool.placement === "pool" ? "plus" : "x"}
                  onClick={() => setPlacement(pool, pool.placement === "pool" ? "both" : "pool")}
                >
                  {pool.placement === "pool" ? "Auf das Board" : "Vom Board nehmen"}
                </Button>
                <Button size="sm" variant="secondary" iconStart="pencil" onClick={() => setForm({ pool })}>
                  Bearbeiten
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  iconStart="trash"
                  onClick={() => setPendingDelete(pool)}
                >
                  Löschen
                </Button>
              </li>
              );
            })}
          </ul>
        )}
      </Card>

      <PoolFormDialog
        open={form !== null}
        {...(form?.pool === undefined ? {} : { pool: form.pool })}
        defaultPlacement="pool"
        onClose={() => setForm(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        tone="danger"
        title="Regel löschen?"
        description={pendingDelete === null ? "" : `Die Regel „${pendingDelete.name}“ wird entfernt.`}
        consequence={
          pendingDelete !== null && pendingDelete.placement !== "pool"
            ? "An den Todos ändert sich nichts — die Zugehörigkeit war nie gespeichert. Auf dem Board verschwindet die Spalte; ihre Karten stehen weiter in der Todo-Liste."
            : "An den Todos ändert sich nichts. Die Zugehörigkeit war nie gespeichert."
        }
        confirmLabel="Löschen"
        onConfirm={() => {
          const pool = pendingDelete;
          if (pool === null) return;
          void deletePool(pool.id)
            .then(() => {
              setPendingDelete(null);
              structure.reload();
              bump();
              toasts.success("Regel gelöscht.");
            })
            .catch((cause: unknown) =>
              toasts.failure("Die Regel ließ sich nicht löschen", errorMessage(cause)),
            );
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

/* ==================================================================== */
/* Baumumwandlung                                                       */
/* ==================================================================== */

function toTreeNodes(tree: TagTreeData): readonly TagTreeNode[] {
  const folderNode = (node: TagFolderNode): TagTreeNode => ({
    id: node.folder.id,
    label: node.folder.name,
    kind: "folder",
    tagCount: countTags(node),
    children: [
      ...node.subfolders.map(folderNode),
      ...node.tags.map<TagTreeNode>((tag) => ({ id: tag.id, label: tag.name, kind: "tag" })),
    ],
  });

  return [
    ...tree.rootFolders.map(folderNode),
    ...tree.rootTags.map<TagTreeNode>((tag) => ({ id: tag.id, label: tag.name, kind: "tag" })),
  ];
}

function countTags(node: TagFolderNode): number {
  return node.tags.length + node.subfolders.reduce((sum, child) => sum + countTags(child), 0);
}

function findSelection(tree: TagTreeData, id: Id): Selection {
  for (const tag of tree.rootTags) {
    if (tag.id === id) return { kind: "tag", id, name: tag.name, folderId: null };
  }
  const walk = (nodes: readonly TagFolderNode[], parentId: Id | null): Selection => {
    for (const node of nodes) {
      if (node.folder.id === id) {
        return { kind: "folder", id, name: node.folder.name, parentId };
      }
      for (const tag of node.tags) {
        if (tag.id === id) {
          return { kind: "tag", id, name: tag.name, folderId: node.folder.id };
        }
      }
      const deeper = walk(node.subfolders, node.folder.id);
      if (deeper !== null) return deeper;
    }
    return null;
  };
  return walk(tree.rootFolders, null);
}

/**
 * Voller Pfad eines Ordners als ein Stueck Text, fuer die Rueckmeldung nach
 * einem Ziehvorgang. „Wartung" allein sagt nicht, welche Wartung gemeint ist,
 * wenn zwei Kunden je eine haben.
 */
function folderName(tree: TagTreeData, id: Id): string {
  const path = pathOf(tree, id);
  return path.length === 0 ? "diesem Ordner" : path.join(" / ");
}

function pathOf(tree: TagTreeData, id: Id): readonly string[] {
  const walk = (nodes: readonly TagFolderNode[], prefix: readonly string[]): readonly string[] | null => {
    for (const node of nodes) {
      const path = [...prefix, node.folder.name];
      if (node.folder.id === id) return path;
      for (const tag of node.tags) if (tag.id === id) return [...path, tag.name];
      const deeper = walk(node.subfolders, path);
      if (deeper !== null) return deeper;
    }
    return null;
  };
  const rootTag = tree.rootTags.find((tag) => tag.id === id);
  if (rootTag !== undefined) return [rootTag.name];
  return walk(tree.rootFolders, []) ?? [];
}
