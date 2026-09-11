import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { errorCode } from "../../api/client";
import {
  deleteTodoStatus,
  reorderTodoStatuses,
  updateTodoStatus,
} from "./api";
import {
  listTodos,
} from "../todos/api";
import type { Id, TodoStatus } from "../../api/types";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Button, Card, EmptyState, InlineMessage } from "../../shared/ui/Primitives";
import { useRefresh } from "../../app/RefreshContext";
import { useStructure } from "../../app/StructureContext";
import { useToasts } from "../../app/ToastContext";
import { useAsync, useMutation } from "../../app/useAsync";
import { errorMessageWithRules, ruleReferences } from "../../lib/errorText";
import { quotedName } from "../../lib/foreign";
import { StatusFormDialog } from "./StatusFormDialog";
import { StatusRow } from "./StatusRow";

/**
 * Takt — die Statusstruktur verwalten (A-5.4), Bereich „Status“ in S-09.
 *
 * ## Warum das hier steht und nicht auf dem Board
 *
 * Bis E-054 war der Status die Kanban-Spalte, und die Spalten wurden dort
 * verwaltet, wo man sie sah. Seit E-054 ist eine Spalte des Boards eine
 * **Regel**, und seit E-055 hat eine Regel fuenf Bedingungen — der Status ist
 * eine davon. Er blieb damit, was er immer auch war: eine Eigenschaft des
 * Todos, die eine Spalte abfragen **kann**, aber nicht mehr **ist**. Ein
 * Zuhause auf dem Board hat er deshalb nicht mehr; er ist eine Stammgroesse
 * wie die Standard-Tags, und Stammgroessen stehen in den Einstellungen.
 *
 * Dieser Bereich sagt das in seinem ersten Absatz — damit findet, wer
 * „Statusspalten“ auf dem Board sucht. Vorgeschichte:
 * `docs/decisions/settings.md`.
 *
 * ## Zwei Zusagen des Dienstes, die der Benutzer vorher lesen muss
 *
 *  1. **Genau ein Status ist der Standard** (`ux_todo_status_default`). Jedes
 *     neu angelegte Todo bekommt ihn, gleich auf welchem Weg — auch aus dem
 *     Add-in. Deshalb ist die Wahl hier eine **Optionsgruppe** und keine Reihe
 *     einzelner Schalter: Ein Auswahlknopf lässt sich nicht abwählen, nur
 *     weitergeben, und genau so verhält sich der Dienst.
 *  2. **Ein Status mit Todos wird nicht gelöscht.** Der Dienst antwortet
 *     `409 status_in_use` und hängt **nichts** automatisch um. Diese Ansicht
 *     sagt es vorher: Sie zählt je Status die Todos, sperrt das Löschen mit
 *     sichtbarem Grund und bietet den Weg an, der bleibt — die Todos in der
 *     Liste öffnen und dort umstellen.
 *
 * Der Sonderfall des Standard-Status ist die Verbindung beider Zusagen. Der
 * Dienst ließe ihn löschen, sobald er leer ist; `defaultStatus()` fiele danach
 * still auf den ersten nach Position zurück. Diese Ansicht verlangt vorher die
 * ausdrückliche Übergabe der Rolle. Das ist keine zweite Fachregel, sondern die
 * Weigerung, eine Rolle stillschweigend weiterzureichen, die der Benutzer nie
 * vergeben hat.
 *
 * ## Warum die Reihenfolge hier funktioniert und bei den Spalten nicht
 *
 * `pool.position` trägt einen eindeutigen Index, und ein Tausch zweier
 * Positionen bräuchte einen dritten Schritt über einen freien Wert — deshalb
 * ist die Spaltenreihenfolge in T-072 geschnitten worden. Für den Status gibt
 * es `PUT /todo-statuses/order`: Die Route nimmt die **vollständige** Folge
 * entgegen und schreibt sie in zwei Durchläufen über negative Zwischenwerte
 * (`repo-statuses.ts`, `takt_status_reorder`). Ein Teilstück weist sie mit
 * `validation_error` ab. Diese Ansicht schickt deshalb immer alle Kennungen,
 * nie zwei.
 *
 * ## Was hier nicht gerechnet wird
 *
 * Die Zahl der Todos je Status ist `total` aus `GET /todos?statusId=…&limit=1`
 * — dieselbe Zählung, die der Dienst vor dem Löschen anstellt. Sie wird nicht
 * aus einer geladenen Liste geschätzt und nicht aus dem Board abgeleitet.
 */

/** Kennung eines Bedienelements zum Verschieben, für die Fokusrückgabe. */
export type MoveHandleKey = `${Id}:up` | `${Id}:down`;

function moveHandleKey(id: Id, direction: -1 | 1): MoveHandleKey {
  return direction === -1 ? `${id}:up` : `${id}:down`;
}

export function StatusSettings() {
  const structure = useStructure();
  const toasts = useToasts();
  const { version } = useRefresh();
  const mutation = useMutation();

  const statuses = useMemo<readonly TodoStatus[]>(
    () => (structure.state.status === "ready" ? structure.state.value.statuses : []),
    [structure.state],
  );

  /**
   * Kennungen in ihrer Reihenfolge, als eine Zeichenkette.
   *
   * Sie ist der Abhängigkeitswert für das Zählen **und** für die Fokusrückgabe:
   * Sie ändert sich, wenn ein Status hinzukommt, wegfällt oder die Stelle
   * wechselt — und sie ändert sich **nicht**, wenn nur ein Name anders lautet.
   * Genau diese Unterscheidung ist gewollt: Umbenennen kostet keine Zählung.
   */
  const orderKey = statuses.map((status) => status.id).join(",");

  const [form, setForm] = useState<{ readonly status?: TodoStatus } | null>(null);
  const [removing, setRemoving] = useState<TodoStatus | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  /**
   * Hat der Dienst Regeln beim Namen genannt? (T-097)
   *
   * Es ist nicht dasselbe wie „`removeError` ist gesetzt". `status_in_use` hat
   * seit T-076 **zwei** Gründe: Todos tragen den Status noch, oder eine Regel
   * nennt ihn. Nur der erste ist der Fall, in dem „zwischen dem Zählen und dem
   * Löschen ist ein Todo dazugekommen" stimmt; beim zweiten ist derselbe Satz
   * schlicht falsch, und der Dialog schickte den Benutzer zum Nachzählen einer
   * Zahl, die stimmt. Die Liste unterscheidet die beiden.
   */
  const [removeRules, setRemoveRules] = useState<readonly string[]>([]);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  /**
   * Wie viele Todos in jedem Status stehen — je Status ein Aufruf mit `limit=1`.
   *
   * Es gibt keine Route, die das in einem Zug beantwortet; `total` der
   * Listenroute ist dieselbe Zählung wie die Sperre vor dem Löschen
   * (`SELECT COUNT(*) FROM todo WHERE status_id = ?`), einschließlich der
   * erledigten Todos. Eine eigene Zählung in der Oberfläche wäre eine zweite
   * Wahrheit über dieselbe Frage — und die eine davon fiele erst auf, wenn ein
   * Löschversuch entgegen der Anzeige abgewiesen wird.
   */
  const counts = useAsync(async () => {
    const ids = orderKey.length === 0 ? [] : orderKey.split(",");
    const entries = await Promise.all(
      ids.map(async (id) => {
        const page = await listTodos({ statusIds: [id] }, { limit: 1 });
        return [id, page.total] as const;
      }),
    );
    return new Map<Id, number>(entries);
  }, [orderKey], [version]);

  /**
   * Die Zahl der Todos in einem Status — oder warum sie fehlt.
   *
   * „Wird gerade gezählt" und „ließ sich nicht zählen" sind zwei Zustände und
   * keiner: Der eine geht vorbei, der andere bleibt, bis jemand etwas tut. Eine
   * Zeile, die nach einem Fehlschlag weiter „Todos werden gezählt …" behauptet,
   * lässt den Benutzer auf etwas warten, das nicht mehr kommt.
   */
  const countOf = useCallback(
    (id: Id): number | "loading" | "unknown" => {
      if (counts.state.status === "loading") return "loading";
      if (counts.state.status === "error") return "unknown";
      return counts.state.value.get(id) ?? "unknown";
    },
    [counts.state],
  );

  /* Fokusrückgabe nach dem Verschieben — siehe `useEffect` weiter unten. */
  const handles = useRef(new Map<MoveHandleKey, HTMLButtonElement>());
  const pendingFocus = useRef<{ readonly id: Id; readonly direction: -1 | 1 } | null>(null);

  const registerHandle = useCallback((key: MoveHandleKey, node: HTMLButtonElement | null) => {
    if (node === null) handles.current.delete(key);
    else handles.current.set(key, node);
  }, []);

  /**
   * Nach dem Verschieben steht der Fokus wieder auf demselben Knopf.
   *
   * Ohne diese Rückgabe fällt er auf den Dokumentkörper, sobald der Knopf durch
   * das Verschieben gesperrt wird — genau am oberen und unteren Ende der Liste,
   * also nach dem letzten Schritt jeder Verschiebung. Wer den Status mit der
   * Tastatur an die Spitze setzt, stünde danach am Anfang der Seite (SC 2.4.3).
   * Ist der eigene Knopf gesperrt, übernimmt der Knopf der Gegenrichtung.
   */
  useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    pendingFocus.current = null;
    const own = handles.current.get(moveHandleKey(target.id, target.direction));
    if (own !== undefined && !own.disabled) {
      own.focus();
      return;
    }
    handles.current.get(moveHandleKey(target.id, target.direction === -1 ? 1 : -1))?.focus();
  }, [orderKey]);

  const move = useCallback(
    (status: TodoStatus, index: number, direction: -1 | 1) => {
      const order = statuses.map((entry) => entry.id);
      const current = order[index];
      const neighbour = order[index + direction];
      if (current === undefined || neighbour === undefined) return;
      order[index] = neighbour;
      order[index + direction] = current;

      pendingFocus.current = { id: status.id, direction };
      void mutation.run(async () => {
        // Die **ganze** Folge, nicht das Paar: `PUT /todo-statuses/order` weist
        // ein Teilstück mit `validation_error` ab, weil der eindeutige Index auf
        // die Position sonst mitten in der Umsortierung bräche.
        await reorderTodoStatuses(order);
        structure.reload();
        setAnnouncement(
          `${quotedName(status.name)} steht jetzt an ${String(index + direction + 1)}. Stelle von ${String(order.length)}.`,
        );
      });
    },
    [mutation, statuses, structure],
  );

  const makeDefault = useCallback(
    (status: TodoStatus) => {
      void mutation.run(async () => {
        await updateTodoStatus(status.id, { isDefault: true });
        structure.reload();
        // Keine zweite Ansage in der Höflichkeitszone: Der Auswahlknopf sagt
        // seinen Zustand selbst, und der Toast sagt die Folge. Beides zugleich
        // in dieselbe `aria-live`-Warteschlange zu geben hieße, denselben Satz
        // zweimal vorlesen zu lassen.
        toasts.success(
          "Standard geändert.",
          `Neue Todos bekommen ab sofort ${quotedName(status.name)}. Vorhandene Todos ändern sich dadurch nicht.`,
        );
      });
    },
    [mutation, structure, toasts],
  );

  const remove = useCallback(
    (status: TodoStatus) => {
      setRemoveBusy(true);
      setRemoveError(null);
      setRemoveRules([]);
      void deleteTodoStatus(status.id)
        .then(() => {
          setRemoving(null);
          structure.reload();
          toasts.success("Status gelöscht.", `${quotedName(status.name)} steht nicht mehr zur Auswahl.`);
        })
        .catch((cause: unknown) => {
          /*
           * Der Text kommt unverändert vom Dienst. Er ist der einzige, der den
           * Grund kennt — und `status_in_use` heißt hier nicht „unerwarteter
           * Fehler", sondern „zwischen dem Zählen und dem Löschen ist ein Todo
           * dazugekommen". Deshalb wird zusätzlich neu gezählt.
           *
           * Seit T-097 mit den Regeln beim Namen, wenn der Dienst welche in
           * `details` genannt hat (T-089). Neu gezählt wird trotzdem: Die
           * Zählung ist auch dann nicht teuer, und der Bestand kann sich aus
           * beiden Gründen geändert haben.
           */
          setRemoveError(errorMessageWithRules(cause));
          setRemoveRules(ruleReferences(cause));
          if (errorCode(cause) === "status_in_use") counts.reload();
        })
        .finally(() => setRemoveBusy(false));
    },
    [counts, structure, toasts],
  );

  const isOnlyStatus = statuses.length <= 1;

  return (
    <>
      {/*
        Die Beschreibung entfaellt **nicht** ersatzlos (T-181, ST-04 mit
        Auflage Z-01 aus T-177): Sie schrumpft auf die Verneinung. „Status“
        ist das einzige Wort dieser Anwendung, das mit einem Begriff
        kollidiert, den derselbe Benutzer im selben Kopf traegt — wer die
        Statusspalten des Boards sucht, sucht sie hier. Eine **Abwesenheit**
        sieht man nicht; ohne diese dreissig Zeichen waere ST-05 in den
        Einstellungen eine Streichung ohne Ausgleich (E-081 Punkt 4).

        Sie steht in der Karte und nicht in der Schiene, weil der
        Schienenzusatz unter 60 rem ausgeblendet ist. Eine Verneinung, die
        vom Fensterformat abhaengt, ist keine.

        Der Erklaerkasten „Der Status ist nicht die Kanban-Spalte“ ist mit
        ST-05 entfallen — zwei Absaetze und zwei Navigationsknoepfe in eine
        andere Ansicht. Regel S-11: Ein Erklaerkasten enthaelt keine
        Navigationsknoepfe; ein Bedienweg gehoert an die Bedienstelle, und
        das Board ist ein Punkt der Hauptnavigation. Kein Ersatzkasten,
        auch kein kleinerer (UM-03, Auflage Z-07 Punkt 2).
      */}
      <Card
        title="Status"
        description="Nicht die Spalten des Boards."
        actions={
          <Button variant="primary" iconStart="plus" onClick={() => setForm({})}>
            Status anlegen
          </Button>
        }
      >
        <p className="visually-hidden" role="status" aria-live="polite">
          {announcement}
        </p>

        {counts.state.status === "error" ? (
          <InlineMessage
            tone="warning"
            title="Wie viele Todos in einem Status stehen, ist gerade nicht bekannt"
            action={
              <Button size="sm" variant="secondary" iconStart="rotate-ccw" onClick={counts.reload}>
                Erneut zählen
              </Button>
            }
          >
            {counts.state.message} Anlegen, Umbenennen und Verschieben geht trotzdem. Beim Löschen
            entscheidet dann der Dienst — er weist einen belegten Status ab, ohne etwas umzuhängen.
          </InlineMessage>
        ) : null}

        {statuses.length === 0 ? (
          <EmptyState
            compact
            icon="inbox"
            title="Es gibt keinen einzigen Status"
            description="Ohne Status lässt sich kein Todo anlegen — jedes neue Todo bekommt einen. Legen Sie mindestens einen an."
            action={
              <Button variant="primary" iconStart="plus" onClick={() => setForm({})}>
                Status anlegen
              </Button>
            }
          />
        ) : (
          <ul
            className="status-admin"
            aria-label="Statuswerte in ihrer Reihenfolge"
            aria-busy={mutation.busy || undefined}
          >
            {statuses.map((status, index) => (
              <StatusRow
                key={status.id}
                status={status}
                index={index}
                last={index === statuses.length - 1}
                count={countOf(status.id)}
                busy={mutation.busy}
                isOnlyStatus={isOnlyStatus}
                registerHandle={registerHandle}
                onMove={(direction) => move(status, index, direction)}
                onRename={() => setForm({ status })}
                onMakeDefault={() => makeDefault(status)}
                onRemove={() => {
                  setRemoveError(null);
                  setRemoving(status);
                }}
              />
            ))}
          </ul>
        )}

        {mutation.error === null ? null : (
          <InlineMessage tone="danger" title="Die Änderung wurde nicht übernommen">
            {mutation.error}
          </InlineMessage>
        )}

        <InlineMessage tone="info" title="Zwei Dinge, bevor Sie etwas ändern">
          <ul className="status-admin__rules">
            <li>
              <strong>Genau ein Status ist der Standard.</strong> Jedes neue Todo bekommt ihn — aus
              der Liste, aus dem Board und aus dem Outlook-Add-in. Ein anderer wird Standard, indem
              Sie ihn dazu bestimmen; abwählen lässt sich der Standard nicht, nur weitergeben.
            </li>
            <li>
              <strong>Ein Status mit Todos wird nicht gelöscht.</strong> SuperTakt hängt dabei nichts
              automatisch um — es gäbe keinen ehrlichen Zielwert. Stellen Sie die Todos zuerst auf
              einen anderen Status um; danach lässt sich der leere Status löschen.
            </li>
          </ul>
        </InlineMessage>
      </Card>

      <StatusFormDialog
        open={form !== null}
        {...(form?.status === undefined ? {} : { status: form.status })}
        existing={statuses}
        onClose={() => setForm(null)}
      />

      {/*
        Nach einer Absage des Dienstes ist das hier kein Bestätigungsdialog
        mehr, sondern eine Auskunft — und er sagt das auch.

        Ein Dialog, der weiter „Status löschen?" fragt und darunter meldet,
        dass es nicht ging, stellt eine Frage, die schon beantwortet ist. Titel,
        Beschreibung und Knopf wechseln deshalb mit: „Der Status wurde nicht
        gelöscht", „steht weiterhin zur Auswahl", „Erneut versuchen".
      */}
      <ConfirmDialog
        open={removing !== null}
        tone="danger"
        title={removeError === null ? "Status löschen?" : "Der Status wurde nicht gelöscht"}
        description={
          removing === null
            ? ""
            : removeError === null
              ? `${quotedName(removing.name)} steht danach nicht mehr zur Auswahl — weder in der Liste noch in einem Formular.`
              : `${quotedName(removing.name)} steht weiterhin zur Auswahl. Der Dienst hat das Löschen abgelehnt und dabei nichts verändert.`
        }
        /*
          Drei Fassungen statt zweier (T-097). Der Zusatz „Zwischen dem Zählen
          und dem Löschen ist offenbar ein Todo dazugekommen" gilt für den
          Grund, für den er geschrieben wurde — Todos tragen den Status noch.
          Hat der Dienst dagegen **Regeln** genannt, ist er falsch: Es ist kein
          Todo dazugekommen, die Zeile wird auch nach dem Nachzählen null
          nennen, und der Weg hinaus führt in die Regel und nicht in die Liste.
          Dort steht deshalb nur die Meldung des Dienstes — sie nennt seit
          T-097 die Regeln beim Namen und sagt selbst, was zu tun ist.
        */
        consequence="Der Status ist leer: Kein Todo trägt ihn. Vorhandene Todos ändern sich durch das Löschen nicht, weil keines betroffen ist."
        {...(removeError === null
          ? {}
          : {
              /*
                Die Absage geht seit T-118 in `refusal` und nicht mehr in
                `consequence` (B-5 aus T-116, SC 4.1.3): Dort lag sie in
                `aria-describedby` und wurde einer Vorlesehilfe nie angesagt.
                Die drei Fassungen bleiben, sie stehen nur eine Eigenschaft
                weiter.
              */
              refusal:
                removeRules.length > 0 ? (
                  removeError
                ) : (
                  <>
                    {removeError} Zwischen dem Zählen und dem Löschen ist offenbar ein Todo
                    dazugekommen. Schließen Sie diesen Dialog: Die Zeile nennt jetzt, wie viele es
                    sind, und führt zu ihnen.
                  </>
                ),
            })}
        confirmLabel={removeError === null ? "Status löschen" : "Erneut versuchen"}
        cancelLabel={removeError === null ? "Abbrechen" : "Schließen"}
        busy={removeBusy}
        onConfirm={() => {
          if (removing !== null) remove(removing);
        }}
        onCancel={() => {
          setRemoving(null);
          setRemoveError(null);
          setRemoveRules([]);
        }}
      />
    </>
  );
}
