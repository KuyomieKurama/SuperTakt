/**
 * Takt — `apps/web/src/app/undoDone.ts` (T-118, B-6/B-7 aus T-116, E-059,
 * Auftrag T-121 Punkt 2).
 *
 * `undoDoneAction` ist eine reine Funktion: Sie baut ein `ToastAction`-Objekt
 * und ruft dabei zwei Attrappen auf (`clearTodoDone`, `toasts`) — kein Baum,
 * kein Ereignis, keine Uhr (E-062). `doneMovementSentence`/`withMovement` aus
 * `lib/movement.ts` laufen dagegen ECHT mit, wie in `test/lib/movement.test.ts`:
 * kein hartkodierter Satz, sondern derselbe Weg wie im Produktivcode — sonst
 * bewiese ein zufällig richtiger Text nichts über die Verdrahtung.
 *
 * ---------------------------------------------------------------------------
 * Was vorher fehlte (B-6, T-118-Bericht Abschnitt 4)
 * ---------------------------------------------------------------------------
 *
 * `TodoListScreen.tsx:218` war `void clearTodoDone(todo.id).then(bump)`: kein
 * `catch`. Ein Fehlschlag war vollständig stumm. Der wichtigste Fall hier ist
 * deshalb nicht der Erfolg, sondern der Fehlschlag: `toasts.failure(...)` läuft,
 * und `afterwards()` läuft NICHT — sonst würde die Liste neu geladen, obwohl
 * das Zurücknehmen gar nicht stattgefunden hat.
 *
 * ---------------------------------------------------------------------------
 * Der zweite Fall, der wehtut: der Anlass
 * ---------------------------------------------------------------------------
 *
 * `undoDoneAction` ruft `doneMovementSentence(undone.poolMovement, true)` —
 * also IMMER den Anlass `'reopen'`, nie `'booking'`. Bei derselben Bewegung
 * ergeben die beiden Anlässe unterschiedliche Sätze (siehe `movement.test.ts`);
 * eine Verwechslung wäre still, weil beide Sätze wohlgeformt sind. Der Test
 * unten prüft deshalb nicht nur "irgendein Satz steht da", sondern dass es
 * GENAU der Satz von `'reopen'` ist, nicht der von `'booking'`.
 *
 * Keine echten Call-Nummern, Kundennamen oder Zugangsdaten: "Ost"/"West" sind
 * dieselben erfundenen Poolnamen wie in `movement.test.ts`, "Kesselwartung"
 * ist ein erfundener Todo-Titel.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/api/endpoints.ts", () => ({
  clearTodoDone: vi.fn(),
}));

import { clearTodoDone } from "../../src/api/endpoints.ts";
import { undoDoneAction } from "../../src/app/undoDone.ts";
import type { ToastApi, ToastInput } from "../../src/app/ToastContext.ts";
import type { PoolMovement, TodoDoneResult } from "../../src/api/types.ts";
import { doneMovementSentence } from "../../src/lib/movement.ts";

const clearTodoDoneMock = vi.mocked(clearTodoDone);

const movement = (partial: Partial<PoolMovement>): PoolMovement => ({
  appears: [],
  enters: [],
  leaves: [],
  ...partial,
});

/** Eine Bewegung, die für 'reopen' UND 'booking' einen unterschiedlichen, nicht-null Satz ergibt (wie REAL_MOVEMENT in movement.test.ts). */
const REAL_MOVEMENT = movement({ appears: ["Ost"], enters: ["Ost"], leaves: ["West"] });

const todoDoneResult = (poolMovement: PoolMovement | null): TodoDoneResult => ({
  id: "todo-1",
  title: "Kesselwartung",
  callNumber: null,
  statusId: "status-1",
  completedAt: null,
  tagIds: [],
  createdAt: "2026-09-04T08:00:00Z",
  updatedAt: "2026-09-04T08:00:00Z",
  poolMovement,
});

function fakeToasts(): { api: ToastApi; show: ReturnType<typeof vi.fn>; failure: ReturnType<typeof vi.fn> } {
  const show = vi.fn();
  const failure = vi.fn();
  const api: ToastApi = {
    show: (toast: ToastInput) => show(toast),
    success: vi.fn(),
    failure: (title: string, body?: string) => failure(title, body),
  };
  return { api, show, failure };
}

/** Mehrere Mikroaufgaben-Umläufe abwarten, bis `.then(...).catch(...)` durchgelaufen ist. */
async function flush(): Promise<void> {
  for (let step = 0; step < 8; step += 1) await Promise.resolve();
}

describe("undoDoneAction — die Beschriftung", () => {
  it('trägt die Beschriftung "Rückgängig" (ein Wortlaut für alle drei Flächen)', () => {
    const { api } = fakeToasts();
    const action = undoDoneAction("todo-1", "Kesselwartung", api, vi.fn());
    expect(action.label).toBe("Rückgängig");
  });
});

describe("undoDoneAction — Erfolg: afterwards() läuft, die Meldung trägt den Anlass 'reopen'", () => {
  beforeEach(() => {
    clearTodoDoneMock.mockReset();
  });

  it("ruft clearTodoDone mit der Todo-Kennung auf und lädt danach über afterwards() neu", async () => {
    clearTodoDoneMock.mockResolvedValue(todoDoneResult(null));
    const { api } = fakeToasts();
    const afterwards = vi.fn();

    undoDoneAction("todo-1", "Kesselwartung", api, afterwards).onSelect();
    await flush();

    expect(clearTodoDoneMock).toHaveBeenCalledExactlyOnceWith("todo-1");
    expect(afterwards).toHaveBeenCalledTimes(1);
  });

  it('die Meldung ist "info", trägt den Titel „Kesselwartung" ist wieder offen. und geht NICHT an toasts.failure', async () => {
    clearTodoDoneMock.mockResolvedValue(todoDoneResult(null));
    const { api, show, failure } = fakeToasts();

    undoDoneAction("todo-1", "Kesselwartung", api, vi.fn()).onSelect();
    await flush();

    expect(show).toHaveBeenCalledTimes(1);
    expect(failure).not.toHaveBeenCalled();
    const toast = show.mock.calls[0]?.[0] as ToastInput;
    expect(toast.tone).toBe("info");
    expect(toast.title).toBe("„Kesselwartung“ ist wieder offen.");
  });

  it("ohne Bewegung (poolMovement: null) bleibt der Rumpf ohne angehängten Satz", async () => {
    clearTodoDoneMock.mockResolvedValue(todoDoneResult(null));
    const { api, show } = fakeToasts();

    undoDoneAction("todo-1", "Kesselwartung", api, vi.fn()).onSelect();
    await flush();

    const toast = show.mock.calls[0]?.[0] as ToastInput;
    expect(toast.body).toBe("Das Abhaken ist zurückgenommen. Tags und Status ändern sich dadurch nicht.");
  });

  it("mit einer Bewegung hängt der Rumpf GENAU den Satz des Anlasses 'reopen' an — nicht den von 'booking'", async () => {
    clearTodoDoneMock.mockResolvedValue(todoDoneResult(REAL_MOVEMENT));
    const { api, show } = fakeToasts();

    undoDoneAction("todo-1", "Kesselwartung", api, vi.fn()).onSelect();
    await flush();

    const reopenSentence = doneMovementSentence(REAL_MOVEMENT, true);
    const bookingSentence = doneMovementSentence(REAL_MOVEMENT, false);
    // Gegenprobe: Für dieselbe Bewegung unterscheiden sich die beiden Sätze -
    // sonst bewiese eine zufällig richtige Fassung nichts über die Zuordnung.
    expect(reopenSentence).not.toBe(bookingSentence);
    expect(reopenSentence).not.toBeNull();

    const toast = show.mock.calls[0]?.[0] as ToastInput;
    expect(toast.body).toBe(
      `Das Abhaken ist zurückgenommen. Tags und Status ändern sich dadurch nicht. ${reopenSentence}`,
    );
  });
});

describe("undoDoneAction — Fehlschlag (B-6: der vorher fehlende catch)", () => {
  beforeEach(() => {
    clearTodoDoneMock.mockReset();
  });

  it("scheitert clearTodoDone, läuft afterwards() NICHT und die Liste bleibt unberührt", async () => {
    clearTodoDoneMock.mockRejectedValue(new Error("Dienst nicht erreichbar"));
    const { api, failure } = fakeToasts();
    const afterwards = vi.fn();

    undoDoneAction("todo-1", "Kesselwartung", api, afterwards).onSelect();
    await flush();

    expect(afterwards).not.toHaveBeenCalled();
    expect(failure).toHaveBeenCalledExactlyOnceWith(
      "Das Zurücknehmen hat nicht geklappt",
      "Dienst nicht erreichbar",
    );
  });

  it("bei einem Fehlschlag OHNE Meldungstext (Error ohne message) steht der feste Auffangtext, kein leerer Rumpf", async () => {
    clearTodoDoneMock.mockRejectedValue(new Error());
    const { api, failure } = fakeToasts();

    undoDoneAction("todo-1", "Kesselwartung", api, vi.fn()).onSelect();
    await flush();

    expect(failure).toHaveBeenCalledExactlyOnceWith(
      "Das Zurücknehmen hat nicht geklappt",
      "Unbekannter Fehler. Bitte versuchen Sie es erneut.",
    );
  });

  it("ein Fehlschlag geht NICHT an toasts.show — nur an toasts.failure", async () => {
    clearTodoDoneMock.mockRejectedValue(new Error("Dienst nicht erreichbar"));
    const { api, show } = fakeToasts();

    undoDoneAction("todo-1", "Kesselwartung", api, vi.fn()).onSelect();
    await flush();

    expect(show).not.toHaveBeenCalled();
  });
});
