import { dropHiddenCharacters, MAX_NAME_LENGTH } from "@takt/domain";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { errorMessage } from "../api/client";
import {
  createExportTemplate,
  deleteExportTemplate,
  getExportSources,
  listExportTemplates,
  updateExportTemplate,
  updateSettings,
} from "../api/endpoints";
import type { DraftText, ExportTemplate, ForeignText, Id } from "../api/types";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { FormDialog, TextField } from "../components/FormDialog";
import { Icon } from "../components/Icon";
import { Button, Card, IconButton, InlineMessage } from "../components/Primitives";
import { useRefresh } from "../app/RefreshContext";
import { href, navigate, parseRoute } from "../app/router";
import { useStructure } from "../app/StructureContext";
import { useToasts } from "../app/ToastContext";
import { useAsync, useMutation } from "../app/useAsync";
import { cx } from "../lib/cx";
import {
  describeDeviations,
  duplicateFieldNames,
  noteSourceIsAbsent,
  parseTemplateDefinition,
  readSourceCatalog,
  toDefinitionBody,
  type ExportFieldDefinition,
  type TemplateDeviation,
} from "../lib/exportTemplateModel";
import { formatDateTime } from "../lib/format";
import { AsyncBoundary, ExportTabs, ScreenHeader } from "./parts";
import {
  TemplateFields,
  TemplateSaveError,
  fieldIndexOfMessage,
  messageWithoutFieldPrefix,
  type DraftField,
} from "./TemplateFields";
import { TemplatePreviewCard } from "./TemplatePreview";
import { quotedName } from "../lib/foreign";
import { Foreign } from "../components/Foreign";

/**
 * Takt — S-14, der Editor für Exportvorlagen (A-8.7, E-005, E-017, I-15).
 *
 * ## Wozu dieser Bildschirm da ist
 *
 * Er ist die Stelle, an der der Benutzer entscheidet, was in seine Rechnungen
 * geht. Bis E-005 war das Exportformat fest; seitdem ist es eine geordnete
 * Liste von Feldern, und diese Liste braucht einen Ort.
 *
 * Drei Bereiche, von links nach rechts, in der Reihenfolge der Arbeit:
 * die Vorlagen, die Felder der gewählten Vorlage, das Ergebnis an echten
 * offenen Buchungen.
 *
 * ## Die Standardvorlage ist keine Vorlage wie jede andere
 *
 * Sie bildet die Struktur ab, die das Abrechnungstool erwartet (A-8.2 bis
 * A-8.5). Sie lässt sich weder ändern noch löschen — der Dienst weist beides
 * mit `builtin_template_immutable` ab —, aber sie lässt sich kopieren, und
 * eine Kopie ist eine ganz gewöhnliche Vorlage.
 *
 * Damit niemand versehentlich von der erwarteten Struktur abweicht, vergleicht
 * jede andere Vorlage sich mit ihr und zeigt die Unterschiede in Worten. Der
 * **Maßstab kommt aus dem Dienst**, nicht aus dieser Datei: Es ist die
 * gelieferte Vorlage mit `isBuiltin`. Es gibt also keine zweite Wahrheit
 * darüber, was das Abrechnungstool erwartet.
 *
 * ## Gerechnet wird hier nichts
 *
 * Keine Rundung, keine Base64-Kodierung, keine Zusammenführung von Texten.
 * Was eine Vorlage erzeugt, sagt `POST /export/preview` — derselbe Renderer,
 * der auch die Datei schreibt (R-17). Seit E-051 nimmt er auch den
 * **ungespeicherten** Entwurf entgegen, geprüft mit derselben Funktion wie das
 * Speichern; die Vorschau zeigt deshalb den Stand im Editor und nicht mehr den
 * zuletzt gespeicherten.
 *
 * ## Und gewusst wird hier auch nichts
 *
 * Welche Feldquellen es gibt, wie sie heißen, was sie liefern, welche
 * Transformationen und Vergleiche es gibt und warum der Vermerk nicht auf der
 * Liste steht — das alles kommt seit E-049 aus `GET /export/sources`. Dieser
 * Bildschirm lädt die Liste zusammen mit den Vorlagen und reicht sie durch.
 */

/** Kennung des noch nicht gespeicherten Entwurfs in der Adresse. */
const NEW_TEMPLATE_ID = "neu";

interface Draft {
  readonly name: DraftText;
  readonly fields: readonly DraftField[];
}

let fieldKeySequence = 0;
const nextFieldKey = (): string => `f${String(++fieldKeySequence)}`;

const toDraftFields = (fields: readonly ExportFieldDefinition[]): readonly DraftField[] =>
  fields.map((field) => ({ key: nextFieldKey(), field }));

export interface TemplatesScreenProps {
  /** Kennung aus der Adresse. `null` heißt: die erste Vorlage zeigen. */
  readonly templateId: string | null;
}

export function TemplatesScreen({ templateId }: TemplatesScreenProps) {
  const { version, bump } = useRefresh();
  const toasts = useToasts();
  const structure = useStructure();
  const mutation = useMutation();

  /*
   * Vorlagen und Auswahlliste in **einem** Ladezustand.
   *
   * Ohne die Liste lässt sich keine Vorlage lesen — `parseTemplateDefinition`
   * prüft gegen sie — und keine Auswahl anbieten. Zwei getrennte Zustände
   * ergäben einen Zwischenschritt, in dem der Editor steht, aber jede Vorlage
   * unlesbar aussieht. Das wäre eine Fehlermeldung für einen Vorgang, der
   * gerade läuft.
   */
  const editor = useAsync(async () => {
    const [templates, sources] = await Promise.all([listExportTemplates(), getExportSources()]);
    return { templates, catalog: readSourceCatalog(sources) };
  }, [], [version]);

  const loaded = editor.state.status === "ready" ? editor.state.value : null;
  const list = loaded?.templates ?? [];
  const catalog = loaded?.catalog ?? null;
  const builtin = list.find((template) => template.isBuiltin) ?? null;

  const creating = templateId === NEW_TEMPLATE_ID;
  const selected = creating ? null : (list.find((template) => template.id === templateId) ?? null);

  /*
   * Ohne Auswahl in der Adresse zeigt der Bildschirm die Standardvorlage —
   * gezeigt, nicht umgeleitet. Eine Umleitung schriebe bei jedem Aufruf einen
   * zweiten Eintrag in den Verlauf, und „Zurück" liefe dann in eine Schleife.
   */
  const shown = creating ? null : (selected ?? builtin ?? list[0] ?? null);

  /* ---------------------------------------------------------------- */
  /* Entwurf                                                          */
  /* ---------------------------------------------------------------- */

  const [draft, setDraft] = useState<Draft | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ExportTemplate | null>(null);
  const [copyDialog, setCopyDialog] = useState<ExportTemplate | null>(null);
  const [copyName, setCopyName] = useState("");

  /**
   * Der Entwurf wird neu aufgesetzt, sobald eine andere Vorlage gewählt wird
   * oder die gezeigte sich beim Dienst geändert hat. `updatedAt` steht in der
   * Signatur, damit ein Nachladen ohne Änderung den Entwurf **nicht**
   * verwirft — sonst verlöre ein Timerschlag die halb getippte Vorlage.
   */
  const signature = creating ? "neu" : shown === null ? null : `${shown.id}|${shown.updatedAt}`;
  const loadedSignature = useRef<string | null>(null);

  useEffect(() => {
    // Ohne Auswahlliste laesst sich keine Vorlage lesen (E-049). Der Entwurf
    // wartet dann, statt leer aufzusetzen und die Felder zu verlieren.
    if (catalog === null) return;
    if (signature === null || signature === loadedSignature.current) return;
    loadedSignature.current = signature;
    setSaveError(null);

    if (creating) {
      setDraft({ name: "Neue Vorlage", fields: [] });
      return;
    }
    if (shown === null) return;
    const parsed = parseTemplateDefinition(shown.definition, catalog);
    setDraft(
      parsed.ok
        ? { name: shown.name, fields: toDraftFields(parsed.value.fields) }
        : { name: shown.name, fields: [] },
    );
  }, [signature, creating, shown, catalog]);

  const parsedShown = useMemo(
    () =>
      shown === null || catalog === null ? null : parseTemplateDefinition(shown.definition, catalog),
    [shown, catalog],
  );
  const unreadable = parsedShown !== null && !parsedShown.ok ? parsedShown.message : null;

  const builtinFields = useMemo<readonly ExportFieldDefinition[]>(() => {
    if (builtin === null || catalog === null) return [];
    const parsed = parseTemplateDefinition(builtin.definition, catalog);
    return parsed.ok ? parsed.value.fields : [];
  }, [builtin, catalog]);

  const readOnly = shown !== null && shown.isBuiltin;

  const draftFields = useMemo<readonly ExportFieldDefinition[]>(
    () => (draft === null ? [] : draft.fields.map((entry) => entry.field)),
    [draft],
  );

  /*
   * Der gespeicherte Stand als Zeichenkette. Der Vergleich läuft über die
   * Gestalt, die auch über die Leitung ginge — so zählt eine Änderung genau
   * dann als Änderung, wenn sie im Rumpf der Anfrage ankäme.
   */
  const savedBody =
    creating || shown === null || parsedShown === null || !parsedShown.ok
      ? null
      : JSON.stringify({
          name: shown.name,
          definition: toDefinitionBody(parsedShown.value.fields),
        });

  const draftBody =
    draft === null ? null : JSON.stringify({ name: draft.name, definition: toDefinitionBody(draftFields) });

  const dirty = creating
    ? draft !== null && (draft.fields.length > 0 || draft.name !== "Neue Vorlage")
    : savedBody !== null && draftBody !== null && savedBody !== draftBody;

  const duplicates = useMemo(() => duplicateFieldNames(draftFields), [draftFields]);
  const emptyNames = draftFields.some((field) => field.name.trim().length === 0);

  const deviations = useMemo<readonly TemplateDeviation[]>(
    () =>
      readOnly || builtinFields.length === 0 || catalog === null
        ? []
        : describeDeviations(draftFields, builtinFields, catalog),
    [readOnly, builtinFields, draftFields, catalog],
  );

  /* ---------------------------------------------------------------- */
  /* Verlassen mit ungespeicherten Änderungen                          */
  /* ---------------------------------------------------------------- */

  const [pendingHref, setPendingHref] = useState<string | null>(null);
  useLeaveGuard(dirty, setPendingHref);

  /* ---------------------------------------------------------------- */
  /* Vorgänge                                                          */
  /* ---------------------------------------------------------------- */

  const updateField = useCallback((key: string, next: ExportFieldDefinition) => {
    setDraft((previous) =>
      previous === null
        ? previous
        : {
            ...previous,
            fields: previous.fields.map((entry) =>
              entry.key === key ? { key: entry.key, field: next } : entry,
            ),
          },
    );
  }, []);

  const removeField = useCallback((key: string) => {
    setDraft((previous) =>
      previous === null
        ? previous
        : { ...previous, fields: previous.fields.filter((entry) => entry.key !== key) },
    );
  }, []);

  const duplicateField = useCallback((key: string) => {
    setDraft((previous) => {
      if (previous === null) return previous;
      const index = previous.fields.findIndex((entry) => entry.key === key);
      const source = previous.fields[index];
      if (source === undefined) return previous;
      const copy: DraftField = {
        key: nextFieldKey(),
        /*
          `dropHiddenCharacters` und nicht `visibleText` (E-063 Punkt 3): Der
          Name landet in einem **Eingabefeld** und geht von dort an die Tür.
          Eine Marke (`U+FFFD`) darin wäre ein Vorschlag, den `nameSchema`
          annimmt und der dauerhaft ein Ersatzzeichen trüge; das Zeichen
          stehenzulassen wäre ein Vorschlag, den die Tür abweist — die
          Sackgasse aus T-114. Ein Vorschlag ist keine Eingabe des Benutzers
          und darf deshalb bereinigt werden.
        */
        field: { ...source.field, name: `${dropHiddenCharacters(source.field.name)} 2` },
      };
      const fields = [...previous.fields];
      fields.splice(index + 1, 0, copy);
      return { ...previous, fields };
    });
  }, []);

  const moveField = useCallback((key: string, delta: number) => {
    setDraft((previous) => {
      if (previous === null) return previous;
      const index = previous.fields.findIndex((entry) => entry.key === key);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= previous.fields.length) return previous;
      const fields = [...previous.fields];
      const [moved] = fields.splice(index, 1);
      if (moved === undefined) return previous;
      fields.splice(target, 0, moved);
      return { ...previous, fields };
    });
  }, []);

  const dropField = useCallback((fromIndex: number, toIndex: number) => {
    setDraft((previous) => {
      if (previous === null) return previous;
      const fields = [...previous.fields];
      const [moved] = fields.splice(fromIndex, 1);
      if (moved === undefined) return previous;
      fields.splice(toIndex, 0, moved);
      return { ...previous, fields };
    });
  }, []);

  /*
   * Ein neues Feld startet mit der **ersten Quelle und der ersten
   * Transformation der gelieferten Liste** — nicht mit hier getippten Werten.
   * „todo.callNumber" und „raw" an dieser Stelle waeren der letzte Rest der
   * Auswahlliste in der Oberflaeche gewesen, und genau den beseitigt E-049.
   */
  const addField = useCallback(() => {
    if (catalog === null) return;
    const source = catalog.firstSource;
    const transformation = catalog.firstTransformation;
    if (source === null || transformation === null) return;
    setDraft((previous) =>
      previous === null
        ? previous
        : {
            ...previous,
            fields: [
              ...previous.fields,
              { key: nextFieldKey(), field: { name: "", source, transformation } },
            ],
          },
    );
  }, [catalog]);

  /*
   * Speichern läuft mit eigenem Zustand und nicht über `useMutation`: Der
   * Fehlertext wird hier gebraucht, um ihn an die betroffene Feldzeile zu
   * hängen, und ein aus dem Zustand gelesener Text wäre in dem Augenblick
   * noch der von vorhin.
   */
  const [saving, setSaving] = useState(false);

  const save = (): void => {
    if (draft === null) return;
    setSaveError(null);
    setSaving(true);
    const definition = toDefinitionBody(draftFields);
    const name = draft.name.trim();

    const task = creating
      ? createExportTemplate(name, definition).then((created) => {
          loadedSignature.current = null;
          if (catalog !== null) editor.replace({ templates: [...list, created], catalog });
          bump();
          toasts.success(
            "Vorlage angelegt.",
            `${quotedName(created.name)} steht jetzt in der Export-Ansicht zur Wahl.`,
          );
          navigate("templates", created.id);
        })
      : shown === null
        ? Promise.resolve()
        : updateExportTemplate(shown.id, { name, definition }).then((updated) => {
            loadedSignature.current = null;
            bump();
            toasts.success(
              "Vorlage gespeichert.",
              `Bereits geschriebene Exportdateien ändern sich dadurch nicht — ${quotedName(updated.name)} gilt ab dem nächsten Lauf.`,
            );
          });

    void task
      .catch((cause: unknown) => setSaveError(errorMessage(cause)))
      .finally(() => setSaving(false));
  };

  const discard = (): void => {
    loadedSignature.current = null;
    setSaveError(null);
    if (creating) {
      navigate("templates", builtin?.id);
      return;
    }
    if (shown === null || catalog === null) return;
    const parsed = parseTemplateDefinition(shown.definition, catalog);
    setDraft(
      parsed.ok
        ? { name: shown.name, fields: toDraftFields(parsed.value.fields) }
        : { name: shown.name, fields: [] },
    );
    loadedSignature.current = `${shown.id}|${shown.updatedAt}`;
    toasts.show({ tone: "info", title: "Änderungen verworfen." });
  };

  /*
   * Anlegen und Löschen setzen die Liste **sofort** neu, statt nur ein
   * Nachladen anzustoßen.
   *
   * Der Grund ist kein Tempo, sondern die Vorschau: Sie fragt den Dienst nach
   * der gezeigten Vorlage. Steht dort für einen Augenblick noch die eben
   * gelöschte, beantwortet der Dienst das mit 404 — richtig, aber der Benutzer
   * sieht eine Fehlermeldung für einen Vorgang, der geklappt hat. Das
   * Nachladen läuft trotzdem; es bestätigt nur, was hier schon steht.
   */
  const copy = (template: ExportTemplate): void => {
    void mutation.run(async () => {
      const created = await createExportTemplate(copyName.trim(), template.definition);
      setCopyDialog(null);
      if (catalog !== null) editor.replace({ templates: [...list, created], catalog });
      navigate("templates", created.id);
      bump();
      toasts.success(
        "Kopie angelegt.",
        `${quotedName(created.name)} ist eine ganz gewöhnliche Vorlage: änderbar und löschbar.`,
      );
    });
  };

  const remove = (template: ExportTemplate): void => {
    void mutation.run(async () => {
      await deleteExportTemplate(template.id);
      setConfirmDelete(null);
      loadedSignature.current = null;
      if (catalog !== null) {
        editor.replace({
          templates: list.filter((candidate) => candidate.id !== template.id),
          catalog,
        });
      }
      navigate("templates", builtin?.id);
      structure.reload();
      bump();
      toasts.success(
        "Vorlage gelöscht.",
        "Bereits geschriebene Exportdateien bleiben, wie sie sind.",
      );
    });
  };

  const activate = (template: ExportTemplate): void => {
    void mutation.run(async () => {
      await updateSettings({ activeExportTemplateId: template.id });
      structure.reload();
      bump();
      toasts.success(
        "Vorlage aktiviert.",
        `Der nächste Export benutzt ${quotedName(template.name)}.`,
      );
    });
  };

  const activeTemplateId =
    structure.state.status === "ready" ? structure.state.value.settings.activeExportTemplateId : null;

  const saveBlocked = draft === null || draft.name.trim().length === 0 || emptyNames;
  const errorIndex = saveError === null ? null : fieldIndexOfMessage(saveError);

  return (
    <section className="screen">
      <ScreenHeader
        title="Exportvorlagen"
        lead="Eine Vorlage bestimmt, welche Felder in die Datei gehen, in welcher Reihenfolge und unter welchem Namen."
        refreshing={editor.state.status === "ready" && editor.state.refreshing}
        actions={
          <Button
            variant="primary"
            iconStart="plus"
            onClick={() => navigate("templates", NEW_TEMPLATE_ID)}
          >
            Neue Vorlage
          </Button>
        }
      >
        <ExportTabs active="templates" />
      </ScreenHeader>

      <AsyncBoundary
        state={editor.state}
        label="Exportvorlagen werden geladen"
        rows={4}
        onRetry={editor.reload}
      >
        {(value) => (
          <div className="tpl-layout">
            <TemplateList
              templates={list}
              selectedId={creating ? NEW_TEMPLATE_ID : (shown?.id ?? null)}
              activeTemplateId={activeTemplateId}
              onCopy={(template) => {
                // Vorschlag für ein Eingabefeld, siehe `copyField` oben.
                setCopyName(`Kopie von ${dropHiddenCharacters(template.name)}`);
                setCopyDialog(template);
              }}
              onDelete={setConfirmDelete}
            />

            <div className="tpl-editor">
              {/*
                Die Notiz-Grenze wird an der **Antwort** noch einmal gezogen
                (A-7.2, R-06). Der Dienst haelt sie an seinem eigenen
                Uebersetzer fest; steht hier trotzdem etwas, ist das kein
                Schoenheitsfehler, sondern ein Befund — und er gehoert
                ausgesprochen, nicht stillschweigend weggefiltert.
              */}
              {noteSourceIsAbsent(value.catalog) ? null : (
                <InlineMessage
                  tone="danger"
                  title="Der Dienst hat Feldquellen geliefert, die nicht wählbar sein dürfen"
                >
                  Takt bietet sie nicht an:{" "}
                  {value.catalog.rejectedNoteSources.map((path) => `„${path}“`).join(", ")}. Der
                  interne Vermerk eines Todos geht in keinen Export (A-7.2). Melden Sie das bitte —
                  an der Auswahlliste dieses Editors ändert es nichts, aber es gehört geprüft.
                </InlineMessage>
              )}

              {draft === null ? null : (
                <>
                  <Card
                    title={readOnly ? "Standardvorlage" : creating ? "Neue Vorlage" : "Vorlage"}
                    description={
                      readOnly
                        ? "Die Struktur, die das Abrechnungstool erwartet. Sie lässt sich nicht ändern — aber kopieren."
                        : "Name und Felder. Die Reihenfolge der Felder ist die Reihenfolge der Schlüssel in der Datei."
                    }
                    actions={
                      readOnly ? (
                        <Button
                          variant="primary"
                          iconStart="copy"
                          onClick={() => {
                            if (shown === null) return;
                            setCopyName(`Kopie von ${dropHiddenCharacters(shown.name)}`);
                            setCopyDialog(shown);
                          }}
                        >
                          Kopie anlegen
                        </Button>
                      ) : (
                        <div className="tpl-editor__actions">
                          {dirty ? (
                            <Button variant="ghost" onClick={discard}>
                              Verwerfen
                            </Button>
                          ) : null}
                          <Button
                            variant="primary"
                            iconStart="check"
                            loading={saving}
                            disabled={saveBlocked || (!dirty && !creating)}
                            onClick={save}
                          >
                            Speichern
                          </Button>
                        </div>
                      )
                    }
                  >
                    {readOnly ? (
                      <BuiltinNotice fields={builtinFields} />
                    ) : (
                      <TextField
                        label="Name der Vorlage"
                        value={draft.name}
                        onChange={(next) =>
                          setDraft((previous) =>
                            previous === null ? previous : { ...previous, name: next },
                          )
                        }
                        required
                        maxLength={MAX_NAME_LENGTH}
                        hint="Nur für Sie. In der Datei steht dieser Name nicht."
                        {...(draft.name.trim().length === 0
                          ? { error: "Ohne Namen lässt sich die Vorlage nicht wiederfinden." }
                          : {})}
                      />
                    )}

                    {dirty ? (
                      <p className="tpl-dirty" role="status">
                        <Icon name="pencil" size={13} />
                        <span>
                          Ungespeicherte Änderungen. Die Vorschau rechts zeigt sie bereits — auf
                          den <strong>Export</strong> wirken sie sich erst nach dem Speichern aus.
                        </span>
                      </p>
                    ) : null}

                    {unreadable === null ? null : (
                      <InlineMessage tone="danger" title="Diese Vorlage lässt sich nicht anzeigen">
                        {unreadable} Solange das so ist, wird sie hier nicht bearbeitet — eine
                        halb gelesene Vorlage zu speichern hieße, Felder stillschweigend zu
                        verlieren.
                      </InlineMessage>
                    )}

                    {saveError !== null && errorIndex === null ? (
                      <TemplateSaveError message={saveError} />
                    ) : null}

                    <TemplateFields
                      fields={draft.fields}
                      catalog={value.catalog}
                      builtinFields={builtinFields}
                      duplicates={duplicates}
                      errorIndex={errorIndex}
                      errorMessage={saveError === null ? null : messageWithoutFieldPrefix(saveError)}
                      readOnly={readOnly}
                      onChange={updateField}
                      onRemove={removeField}
                      onDuplicate={duplicateField}
                      onMove={moveField}
                      onDrop={dropField}
                      onAdd={addField}
                    />
                  </Card>

                  {readOnly || creating ? null : (
                    <DeviationPanel
                      deviations={deviations}
                      builtinName={builtin?.name ?? "Standardvorlage"}
                    />
                  )}

                  {shown === null || shown.isBuiltin || activeTemplateId === shown.id ? null : (
                    <Card
                      title="Diese Vorlage benutzen"
                      description="Der Export nimmt die Vorlage, die in den Einstellungen aktiv ist."
                    >
                      <div className="tpl-activate">
                        <p className="tpl-activate__text">
                          Aktiv ist derzeit{" "}
                          <strong>
                            <Foreign
                              value={
                                list.find((template) => template.id === activeTemplateId)?.name ??
                                builtin?.name ??
                                "die Standardvorlage"
                              }
                            />
                          </strong>
                          . Änderungen an dieser Vorlage wirken sich erst auf einen Export aus,
                          wenn sie aktiv ist.
                        </p>
                        <Button
                          variant="secondary"
                          iconStart="check"
                          loading={mutation.busy}
                          onClick={() => activate(shown)}
                        >
                          Für den Export verwenden
                        </Button>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>

            <div className="tpl-preview">
              {/*
                Gezeigt wird **immer** der Stand im Editor (E-051). `stale` und
                `unsaved` sagen nur noch, ob dieser Stand schon gespeichert
                ist; sie entscheiden nicht mehr darueber, was gerendert wird.
              */}
              <TemplatePreviewCard
                catalog={value.catalog}
                stale={dirty}
                unsaved={creating}
                fields={draftFields}
              />
            </div>
          </div>
        )}
      </AsyncBoundary>

      <ConfirmDialog
        open={confirmDelete !== null}
        title={`Vorlage ${quotedName(confirmDelete?.name ?? "")} löschen?`}
        description="Die Vorlage verschwindet aus der Auswahl in der Export-Ansicht und in den Einstellungen."
        consequence={
          confirmDelete !== null && confirmDelete.id === activeTemplateId
            ? "Diese Vorlage ist gerade die aktive. Nach dem Löschen greift wieder die mitgelieferte Standardvorlage. Bereits geschriebene Exportdateien bleiben unverändert."
            : "Bereits geschriebene Exportdateien bleiben unverändert. Rückgängig machen lässt sich das Löschen nicht."
        }
        confirmLabel="Vorlage löschen"
        tone="danger"
        busy={mutation.busy}
        onConfirm={() => {
          if (confirmDelete !== null) remove(confirmDelete);
        }}
        onCancel={() => setConfirmDelete(null)}
      />

      <FormDialog
        open={copyDialog !== null}
        title="Vorlage kopieren"
        description={
          copyDialog?.isBuiltin === true
            ? "Die Kopie enthält dieselben Felder wie die Standardvorlage und ist von da an eine ganz gewöhnliche Vorlage: änderbar und löschbar."
            : "Die Kopie enthält dieselben Felder und lässt sich unabhängig weiterbearbeiten."
        }
        submitLabel="Kopie anlegen"
        busy={mutation.busy}
        submitDisabled={copyName.trim().length === 0}
        error={mutation.error}
        onSubmit={() => {
          if (copyDialog !== null) copy(copyDialog);
        }}
        onCancel={() => setCopyDialog(null)}
      >
        <TextField
          label="Name der Kopie"
          value={copyName}
          onChange={setCopyName}
          required
          maxLength={MAX_NAME_LENGTH}
        />
      </FormDialog>

      <ConfirmDialog
        open={pendingHref !== null}
        title="Diese Vorlage hat ungespeicherte Änderungen"
        description="Wenn Sie jetzt wechseln, gehen die Änderungen an dieser Vorlage verloren."
        consequence="Die gespeicherte Fassung bleibt unverändert; Export und Vorschau benutzen weiterhin sie."
        confirmLabel="Änderungen verwerfen und wechseln"
        cancelLabel="Hierbleiben"
        tone="danger"
        onConfirm={() => {
          const target = pendingHref;
          setPendingHref(null);
          loadedSignature.current = null;
          if (target !== null) window.location.hash = target;
        }}
        onCancel={() => setPendingHref(null)}
      />
    </section>
  );
}

/* ==================================================================== */
/* Die Vorlagenliste                                                    */
/* ==================================================================== */

interface TemplateListProps {
  readonly templates: readonly ExportTemplate[];
  readonly selectedId: string | null;
  readonly activeTemplateId: Id | null;
  readonly onCopy: (template: ExportTemplate) => void;
  readonly onDelete: (template: ExportTemplate) => void;
}

function TemplateList({
  templates,
  selectedId,
  activeTemplateId,
  onCopy,
  onDelete,
}: TemplateListProps) {
  const others = templates.filter((template) => !template.isBuiltin);

  return (
    <nav className="tpl-list" aria-label="Exportvorlagen">
      <ul className="tpl-list__items">
        {templates.map((template) => {
          const current = template.id === selectedId;
          return (
            <li key={template.id}>
              <div className={cx("tpl-item", current && "tpl-item--current")}>
                <a
                  className="tpl-item__link"
                  href={href("templates", template.id)}
                  aria-current={current ? "page" : undefined}
                >
                  <span className="tpl-item__name">
                    {template.isBuiltin ? (
                      <span className="tpl-item__lock" aria-hidden>
                        <Icon name="lock" size={13} />
                      </span>
                    ) : null}
                    <Foreign value={template.name} />
                  </span>
                  <span className="tpl-item__badges">
                    {template.isBuiltin ? (
                      <span className="tpl-badge tpl-badge--builtin">mitgeliefert</span>
                    ) : null}
                    {template.id === activeTemplateId ? (
                      <span className="tpl-badge tpl-badge--active">aktiv</span>
                    ) : null}
                  </span>
                  <span className="tpl-item__meta">
                    Zuletzt geändert {formatDateTime(template.updatedAt)}
                  </span>
                </a>
                <div className="tpl-item__tools">
                  <IconButton
                    label={`Vorlage ${quotedName(template.name)} kopieren`}
                    icon="copy"
                    size="sm"
                    onClick={() => onCopy(template)}
                  />
                  <IconButton
                    label={
                      template.isBuiltin
                        ? "Die Standardvorlage lässt sich nicht löschen"
                        : `Vorlage ${quotedName(template.name)} löschen`
                    }
                    icon="trash"
                    size="sm"
                    disabled={template.isBuiltin}
                    onClick={() => onDelete(template)}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {others.length === 0 ? (
        <p className="tpl-list__empty">
          Es gibt bisher nur die Standardvorlage. Sie lässt sich nicht ändern, aber kopieren — und
          die Kopie können Sie beliebig umbauen.
        </p>
      ) : null}
    </nav>
  );
}

/* ==================================================================== */
/* Die Standardvorlage erklären                                         */
/* ==================================================================== */

function BuiltinNotice({ fields }: { readonly fields: readonly ExportFieldDefinition[] }) {
  return (
    <div className="tpl-builtin">
      <p className="tpl-builtin__lead">
        <span className="tpl-builtin__icon" aria-hidden>
          <Icon name="shield" size={16} />
        </span>
        <span>
          Diese Vorlage bildet die Struktur ab, die das Abrechnungstool erwartet:{" "}
          {fields.length === 0
            ? "die mitgelieferten Felder"
            : fields.map((field) => `${quotedName(field.name)}`).join(", ")}
          . Sie ist mitgeliefert und lässt sich weder ändern noch löschen — genau deshalb ist sie
          der Stand, auf den Sie jederzeit zurückkommen können.
        </span>
      </p>
      <p className="tpl-builtin__text">
        Wollen Sie etwas anderes exportieren, legen Sie eine Kopie an. Die Kopie ist eine
        gewöhnliche Vorlage, und Takt zeigt Ihnen dort laufend, worin sie von dieser hier abweicht.
      </p>
    </div>
  );
}

/* ==================================================================== */
/* Abweichungen von der Standardvorlage                                 */
/* ==================================================================== */

function DeviationPanel({
  deviations,
  builtinName,
}: {
  readonly deviations: readonly TemplateDeviation[];
  readonly builtinName: ForeignText;
}) {
  const warnings = deviations.filter((entry) => entry.tone === "warning");

  return (
    <Card
      title={`Abgleich mit ${quotedName(builtinName)}`}
      description="Was das Abrechnungstool erwartet, steht in der mitgelieferten Vorlage. Hier steht, worin diese davon abweicht."
    >
      {deviations.length === 0 ? (
        <p className="tpl-deviation tpl-deviation--ok">
          <Icon name="check-circle" size={15} />
          <span>
            Diese Vorlage entspricht der Struktur der Standardvorlage — gleiche Felder, gleiche
            Quellen, gleiche Transformationen.
          </span>
        </p>
      ) : (
        <>
          <p className="tpl-deviation__lead">
            {warnings.length === 0
              ? "Die erwartete Struktur ist vollständig enthalten; darüber hinaus gibt es Ergänzungen."
              : "Abweichungen sind erlaubt — sie sollen nur nicht versehentlich entstehen. Prüfen Sie, ob das Abrechnungstool damit umgehen kann."}
          </p>
          <ul className="tpl-deviation-list">
            {deviations.map((entry) => (
              <li
                key={entry.id}
                className={cx("tpl-deviation", `tpl-deviation--${entry.tone}`)}
              >
                <Icon name={entry.tone === "warning" ? "alert-triangle" : "info"} size={14} />
                <span>{entry.text}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}

/* ==================================================================== */
/* Hilfen                                                               */
/* ==================================================================== */

/**
 * Hält den Benutzer auf, bevor ungespeicherte Änderungen verloren gehen (§15).
 *
 * Abgefangen wird der **Klick** auf einen Verweis und nicht der Wechsel der
 * Adresse. Der Grund ist handfest: Die Ansicht hängt an der Route; wechselt
 * die Adresse erst und wird danach zurückgestellt, ist der Editor in der
 * Zwischenzeit abgebaut worden und der Entwurf weg. Ein abgefangener Klick
 * findet vor dem Wechsel statt und lässt den Entwurf stehen.
 *
 * Der Rest, was diese Kontrolle **nicht** erreicht, steht im Bericht: ein
 * Sprung, den die Anwendung selbst auslöst (globale Suche, Knopf in einer
 * Rückmeldung), wechselt ohne Rückfrage.
 */
function useLeaveGuard(dirty: boolean, onBlocked: (target: string) => void): void {
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;
  const blockedRef = useRef(onBlocked);
  blockedRef.current = onBlocked;

  useEffect(() => {
    const onClick = (event: MouseEvent): void => {
      if (!dirtyRef.current) return;
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a");
      if (anchor === null) return;
      const raw = anchor.getAttribute("href");
      // Nur Routen. `#inhalt` ist die Sprungmarke zum Inhalt (SC 2.4.1) und
      // verlaesst diese Ansicht nicht — sie darf nicht aufgehalten werden.
      if (raw === null || !raw.startsWith("#/")) return;
      const next = parseRoute(raw);
      const here = parseRoute(window.location.hash);
      if (next.name === here.name && next.id === here.id) return;
      event.preventDefault();
      blockedRef.current(raw);
    };
    // Erfassungsphase: der Klick wird abgefangen, bevor irgendetwas anderes
    // ihn sieht und bevor der Browser die Adresse wechselt.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
}
