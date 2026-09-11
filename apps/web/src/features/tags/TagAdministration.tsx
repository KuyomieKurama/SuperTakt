import { MAX_NAME_LENGTH } from "@takt/domain";
import { useCallback, useMemo, useState } from "react";
import {
  createTag,
  createTagFolder,
  deleteTag,
  deleteTagFolder,
  moveTagFolder,
  renameTagFolder,
  updateTag,
} from "./api";
import type { ForeignText, TagTree as TagTreeData } from "../../api/types";
import { useRefresh } from "../../app/RefreshContext";
import { navigate } from "../../app/router";
import { useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { useMutation } from "../../app/useAsync";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Foreign } from "../../shared/ui/Foreign";
import { FormDialog, TextField } from "../../shared/ui/FormDialog";
import { Button, Card, EmptyState, InlineMessage } from "../../shared/ui/Primitives";
import { Select } from "../../shared/ui/Select";
import { errorMessageWithRules } from "../../lib/errorText";
import { flatFolders } from "../../lib/folderPaths";
import { quotedName } from "../../lib/foreign";
import { TagPath } from "../../shared/ui/Tag";
import { TagTree } from "./TagTree";
import { findSelection, folderName, pathOf, toTreeNodes, type Selection } from "./treeData";

/**
 * Tags und Ordner — S-08.
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
 * Vorgeschichte: `docs/decisions/tags.md`.
 */
export function TagAdministration({ tree }: { readonly tree: TagTreeData }) {
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
  /**
   * Wurde das Namensfeld schon einmal verlassen? (Befund O-DZ, T-167.)
   *
   * Drei Dialoge teilen sich `name`, und in allen dreien ist die Schaltfläche
   * bei leerem Feld gesperrt — `onSubmit` läuft also nie, und eine Meldung, die
   * dort entstünde, sähe niemand. Sie entsteht deshalb beim **Verlassen** des
   * Feldes, nicht beim Tippen (SC 3.3.1). Seit E-084 ist sie zugleich die
   * einzige, die es hier noch gibt: `noValidate` nimmt dem Formular Chromiums
   * eigene, englische Sprechblase.
   */
  const [nameTouched, setNameTouched] = useState(false);
  const [targetFolder, setTargetFolder] = useState<string>("");
  /*
   * Eigener Vorgang neben `mutation`: Der Dialog zeigt seinen Fehler im
   * Dialog, das Ziehen hat keinen Dialog, in dem er stehen koennte. Beides
   * ueber denselben Zustand laufen zu lassen hiesse, dass ein misslungenes
   * Ziehen den naechsten Dialog mit einer alten Meldung oeffnet.
   */
  const dragMove = useMutation();

  /**
   * Ein Namensdialog beginnt — Wert setzen und die Meldung zurücknehmen.
   *
   * Die vier Einstiege (Ordner, Tag, erster Tag, Umbenennen) laufen über diesen
   * einen Weg, damit kein fünfter entsteht, der das Zurücksetzen vergisst: Eine
   * stehengebliebene Meldung begrüßte den nächsten Dialog mit dem Tadel des
   * vorigen.
   *
   * `ForeignText` und nicht `string`: Beim Umbenennen kommt der Vorschlag aus
   * dem Bestand, also von außen (E-063). Wer die Herkunft am Parameter fallen
   * ließe, verlöre sie für jede Prüfung dahinter — `proof:foreign` misst genau
   * das.
   */
  const beginNaming = (initial: ForeignText): void => {
    setName(initial);
    setNameTouched(false);
  };

  /*
    Grundform aus T-177 P-3, erstes Wort ist die Feldbeschriftung (P-2). Drei
    Dialoge, dieselbe Beschriftung, derselbe Fall — also dreimal derselbe Satz.
  */
  const nameError = nameTouched && name.trim().length === 0 ? "Name fehlt." : undefined;


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
                beginNaming("");
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
                beginNaming("");
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
                  beginNaming("");
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
                      : `in ${quotedName(folderName(tree, targetFolderId))}`;
                  toasts.success(`${quotedName(node.label)} liegt jetzt ${place}.`);
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
                  <h4 className="tags-detail__name">
                    <Foreign value={selected.name} />
                  </h4>
                  <p className="tags-detail__path">
                    <TagPath segments={pathOf(tree, selected.id)} />
                  </p>

                  <div className="tags-detail__actions">
                    <Button
                      size="sm"
                      variant="secondary"
                      iconStart="pencil"
                      onClick={() => {
                        beginNaming(selected.name);
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
        <TextField
          label="Name"
          value={name}
          onChange={setName}
          onTouched={() => setNameTouched(true)}
          required
          maxLength={MAX_NAME_LENGTH}
          {...(nameError === undefined ? {} : { error: nameError })}
        />
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
        <TextField
          label="Name"
          value={name}
          onChange={setName}
          onTouched={() => setNameTouched(true)}
          required
          maxLength={MAX_NAME_LENGTH}
          {...(nameError === undefined ? {} : { error: nameError })}
        />
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
        <TextField
          label="Name"
          value={name}
          onChange={setName}
          onTouched={() => setNameTouched(true)}
          required
          maxLength={MAX_NAME_LENGTH}
          {...(nameError === undefined ? {} : { error: nameError })}
        />
      </FormDialog>

      {/* Verschieben — I-07 und I-08 */}
      <FormDialog
        open={moveDialog}
        title={selected?.kind === "tag" ? "Tag verschieben" : "Ordner verschachteln"}
        description={
          selected?.kind === "tag"
            ? "Ein Tag liegt in genau einem Ordner. Die Todos, die ihn tragen, bleiben unberührt."
            : "Ein Ordner kann nicht unter einen seiner eigenen Unterordner. SuperTakt lehnt das ab, statt einen Zyklus anzulegen."
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

      {/*
        Nach einer Absage des Dienstes ist das hier kein Bestätigungsdialog
        mehr, sondern eine Auskunft — und er sagt das auch (T-097 Frage 1,
        R-2a Abschnitt 5.2).

        Ein Titel, der weiter „Ordner löschen?" fragt, stellt eine Frage, die
        schon beantwortet ist — und die Hauptaktion darunter wäre genau die
        Handlung, die eben gescheitert ist. `StatusSettings` macht es an
        derselben Stelle genauso; zwei Muster für denselben Vorgang lehren,
        daß eines davon keine Bedeutung hat.

        Für Vorlesehilfen ist der Wechsel der **einzige** Weg, von der Absage
        zu erfahren (SC 4.1.3): Der Hinweistext liegt in `aria-describedby` und
        ist keine Statusmeldung; der Knopf dagegen trägt den Fokus, und ein
        Namenswechsel unter dem Fokus wird angesagt.
      */}
      <ConfirmDialog
        open={pendingDelete !== null}
        tone="danger"
        title={
          deleteError !== null
            ? pendingDelete?.kind === "folder"
              ? "Der Ordner wurde nicht gelöscht"
              : "Das Tag wurde nicht gelöscht"
            : pendingDelete?.kind === "folder"
              ? "Ordner löschen?"
              : "Tag löschen?"
        }
        description={
          pendingDelete === null
            ? ""
            : deleteError === null
              ? `${quotedName(pendingDelete.name)} wird entfernt.`
              : `${quotedName(pendingDelete.name)} gibt es weiterhin. Der Dienst hat das Löschen abgelehnt und dabei nichts verändert.`
        }
        /*
          Vorwarnung und Absage sind seit T-118 zwei Eigenschaften (B-5 aus
          T-116, SC 4.1.3).

          Bis dahin trugen beide dieselbe: `deleteError ?? Vorwarnung`. Das ist
          sichtbar richtig und für eine Vorlesehilfe stumm — die Absage lag in
          `aria-describedby`, und eine Beschreibung wird nicht erneut
          vorgelesen, wenn sie sich ändert. Gehört hat sie nur den neuen
          Knopfnamen „Erneut versuchen" und kein Wort davon, **warum**, obwohl
          genau dieser Satz seit T-097 die Regeln beim Namen nennt.

          Die Vorwarnung sagt, woran das Löschen scheitern kann; seit T-089 sind
          das je zwei Gründe, der Inhalt und die Regel.
        */
        consequence={
          pendingDelete?.kind === "folder"
            ? "Ein Ordner, in dem noch etwas liegt, wird nicht gelöscht — und ein Ordner, den eine Regel nennt, ebenso wenig. Räumen Sie ihn vorher aus oder nehmen Sie ihn aus der Regel heraus."
            : "Ein Tag, der noch an einem Todo hängt, wird nicht gelöscht — und ein Tag, den eine Regel nennt, ebenso wenig. Die Regel verlöre sonst still ihre Bedeutung."
        }
        {...(deleteError === null ? {} : { refusal: deleteError })}
        confirmLabel={deleteError === null ? "Löschen" : "Erneut versuchen"}
        cancelLabel={deleteError === null ? "Abbrechen" : "Schließen"}
        onConfirm={() => {
          const target = pendingDelete;
          if (target === null) return;
          /*
            „Erneut versuchen" beginnt von vorn: Bliebe die alte Meldung
            stehen, zeigte der Dialog beim zweiten Fehlschlag nicht, daß
            überhaupt etwas geschehen ist.
          */
          setDeleteError(null);
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
        onCancel={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
      />
    </>
  );
}
