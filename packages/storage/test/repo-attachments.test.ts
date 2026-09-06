/**
 * Takt — T-148, Anhänge am Todo, der SQLite-Adapter (A-19.8 bis A-19.15,
 * A-19.17, E-071, A-A-18).
 *
 * ===========================================================================
 * ROT ZUERST
 * ===========================================================================
 *
 * `packages/storage/src/sqlite/repo-attachments.ts` entstand mit T-146 und
 * lag laut Auftrag T-148 (Messung des Orchestrators nach Welle T) bei
 * **6,38 %** Abdeckung — vor dieser Datei existierte kein `grep -rn
 * "attachments" packages/storage/test/` außerhalb der allgemeinen
 * `ports.ts`-Typen.
 *
 * ===========================================================================
 * Was hier gemessen wird
 * ===========================================================================
 *
 * 1. **Anlegen.** `position` bestimmt der Adapter (nächste freie Stelle,
 *    gelesen in derselben Transaktion) — nicht der Aufrufer.
 * 2. **Lesen.** `load` (einzeln), `list` (ein Todo, nach Position sortiert),
 *    `listMany` (mehrere Todos in einer Abfrage, auch für Todos ohne
 *    Anhänge).
 * 3. **Löschen.** `remove` gibt den gelöschten Datensatz zurück (nicht nur
 *    „erledigt") und meldet `not_found`, wenn es den Anhang nicht gibt.
 * 4. **Reihenfolge.** Stabil über mehrere Ladevorgänge, in der Reihenfolge
 *    des Hinzufügens (A-19.8).
 * 5. **Verhalten am Todo als Unterressource:**
 *    - Ein Anhang an einem nicht existierenden Todo scheitert am
 *      Fremdschlüssel — `create` gibt einen fachlichen Fehler zurück, wirft
 *      nicht roh durch.
 *    - Wird das **Todo** gelöscht, verschwinden seine Anhänge mit
 *      (`ON DELETE CASCADE`, Migration 0015) — ohne dass der Adapter dafür
 *      etwas Eigenes tun muss.
 *    - `imageTargets` liefert **nur** die Bildziele eines Todos, in
 *      Vorbereitung auf A-A-18 (die Dateien müssen mitgehen, bevor die Zeile
 *      verschwindet).
 * 6. **Eine Art, die die Domäne nicht kennt, wird beim Lesen übergangen, nicht
 *    geworfen** — der Fall aus dem Kopfkommentar der Produktivdatei
 *    ("Zeilen, deren Art die Domäne nicht kennt, werden übergangen"). Die
 *    Zeile bleibt dabei liegen: „übergangen" heißt nicht „gelöscht".
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { AttachmentId, TodoId } from '@takt/domain';

import { NOW, createTodo, openTestDatabase, ts, type TestDatabase } from './support/setup.ts';

describe('createAttachmentPort.create — Position bestimmt der Adapter (A-19.8)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('der erste Anhang eines Todos bekommt Position 0', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);

    const result = await db.unit.attachments.create({
      todoId: todo.id,
      kind: 'link',
      title: null,
      target: 'http://example.org/',
      now: NOW,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.position).toBe(0);
    expect(result.value.todoId).toBe(todo.id);
    expect(result.value.kind).toBe('link');
    expect(result.value.target).toBe('http://example.org/');
    expect(result.value.title).toBeNull();
    expect(result.value.createdAt).toBe(NOW);
    expect(result.value.id).toBeTruthy();
  });

  it('drei Anhänge desselben Todos bekommen aufsteigende, lückenlose Positionen — der Aufrufer gibt keine an', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);

    const erster = await db.unit.attachments.create({
      todoId: todo.id,
      kind: 'link',
      title: null,
      target: 'http://example.org/eins',
      now: NOW,
    });
    const zweiter = await db.unit.attachments.create({
      todoId: todo.id,
      kind: 'file',
      title: 'Zweitens',
      target: '/home/nutzer/bericht.pdf',
      now: NOW,
    });
    const dritter = await db.unit.attachments.create({
      todoId: todo.id,
      kind: 'image',
      title: null,
      target: 'erzeugter-name.png',
      now: NOW,
    });

    expect(erster.ok && zweiter.ok && dritter.ok).toBe(true);
    if (!erster.ok || !zweiter.ok || !dritter.ok) return;
    expect(erster.value.position).toBe(0);
    expect(zweiter.value.position).toBe(1);
    expect(dritter.value.position).toBe(2);
  });

  it('zwei verschiedene Todos zählen ihre Positionen unabhängig voneinander, jedes ab 0', async () => {
    db = openTestDatabase();
    const todoA = await createTodo(db, { title: 'Todo A' });
    const todoB = await createTodo(db, { title: 'Todo B' });

    const aEins = await db.unit.attachments.create({
      todoId: todoA.id,
      kind: 'link',
      title: null,
      target: 'http://example.org/a',
      now: NOW,
    });
    const bEins = await db.unit.attachments.create({
      todoId: todoB.id,
      kind: 'link',
      title: null,
      target: 'http://example.org/b',
      now: NOW,
    });

    expect(aEins.ok && bEins.ok).toBe(true);
    if (!aEins.ok || !bEins.ok) return;
    expect(aEins.value.position).toBe(0);
    expect(bEins.value.position).toBe(0);
  });

  it('ein Titel mit Umlauten und Emoji wird byteweise unverändert gespeichert', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    const titel = 'Übergabe für Straße 😀';

    const result = await db.unit.attachments.create({
      todoId: todo.id,
      kind: 'file',
      title: titel,
      target: '/home/nutzer/Übergabeprotokoll.pdf',
      now: NOW,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.title).toBe(titel);
    expect(result.value.target).toBe('/home/nutzer/Übergabeprotokoll.pdf');
  });

  it('ein Anhang an einem nicht existierenden Todo scheitert am Fremdschlüssel — kein roher Wurf', async () => {
    db = openTestDatabase();

    const result = await db.unit.attachments.create({
      todoId: 'kein-solches-todo' as TodoId,
      kind: 'link',
      title: null,
      target: 'http://example.org/',
      now: NOW,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    // Die genaue Übersetzung liegt in errors.ts (FOREIGN KEY -> validation_error);
    // hier zählt, dass überhaupt ein fachlicher Wert zurückkommt und nichts wirft.
    expect(result.error.code).toBeTruthy();
    expect(result.error.message).toBeTruthy();
  });
});

describe('createAttachmentPort.list / load — Reihenfolge und Einzelzugriff (A-19.8)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('list liefert die Anhänge eines Todos in der Reihenfolge ihrer Position', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);

    await db.unit.attachments.create({ todoId: todo.id, kind: 'link', title: null, target: 'http://example.org/1', now: NOW });
    await db.unit.attachments.create({ todoId: todo.id, kind: 'link', title: null, target: 'http://example.org/2', now: NOW });
    await db.unit.attachments.create({ todoId: todo.id, kind: 'link', title: null, target: 'http://example.org/3', now: NOW });

    const liste = await db.unit.attachments.list(todo.id);
    expect(liste.map((a) => a.target)).toEqual([
      'http://example.org/1',
      'http://example.org/2',
      'http://example.org/3',
    ]);
    expect(liste.map((a) => a.position)).toEqual([0, 1, 2]);
  });

  it('list eines Todos ohne Anhänge ist eine leere Liste, kein Fehler', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    expect(await db.unit.attachments.list(todo.id)).toEqual([]);
  });

  it('load findet einen einzelnen Anhang über seine Kennung', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    const created = await db.unit.attachments.create({
      todoId: todo.id,
      kind: 'file',
      title: null,
      target: '/home/nutzer/bericht.pdf',
      now: NOW,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const geladen = await db.unit.attachments.load(created.value.id);
    expect(geladen).toEqual(created.value);
  });

  it('load einer unbekannten Kennung ist null, kein Fehler', async () => {
    db = openTestDatabase();
    expect(await db.unit.attachments.load('unbekannt' as AttachmentId)).toBeNull();
  });
});

describe('createAttachmentPort.listMany — mehrere Todos in einer Abfrage', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('eine leere Liste von Kennungen ergibt eine leere Zuordnung, ohne die Datenbank zu fragen', async () => {
    db = openTestDatabase();
    const map = await db.unit.attachments.listMany([]);
    expect(map.size).toBe(0);
  });

  it('jedes angefragte Todo erscheint in der Zuordnung, auch ohne eigene Anhänge', async () => {
    db = openTestDatabase();
    const mitAnhang = await createTodo(db, { title: 'Mit Anhang' });
    const ohneAnhang = await createTodo(db, { title: 'Ohne Anhang' });

    await db.unit.attachments.create({
      todoId: mitAnhang.id,
      kind: 'link',
      title: null,
      target: 'http://example.org/',
      now: NOW,
    });

    const map = await db.unit.attachments.listMany([mitAnhang.id, ohneAnhang.id]);
    expect(map.size).toBe(2);
    expect(map.get(mitAnhang.id)?.length).toBe(1);
    expect(map.get(ohneAnhang.id)).toEqual([]);
  });

  it('die Anhänge mehrerer Todos werden nicht vermischt und bleiben je Todo sortiert', async () => {
    db = openTestDatabase();
    const todoA = await createTodo(db, { title: 'A' });
    const todoB = await createTodo(db, { title: 'B' });

    await db.unit.attachments.create({ todoId: todoA.id, kind: 'link', title: null, target: 'http://a.example/1', now: NOW });
    await db.unit.attachments.create({ todoId: todoB.id, kind: 'link', title: null, target: 'http://b.example/1', now: NOW });
    await db.unit.attachments.create({ todoId: todoA.id, kind: 'link', title: null, target: 'http://a.example/2', now: NOW });

    const map = await db.unit.attachments.listMany([todoA.id, todoB.id]);
    expect(map.get(todoA.id)?.map((a) => a.target)).toEqual(['http://a.example/1', 'http://a.example/2']);
    expect(map.get(todoB.id)?.map((a) => a.target)).toEqual(['http://b.example/1']);
  });
});

describe('createAttachmentPort.remove — meldet, was entfernt wurde (A-A-18)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('entfernt einen bestehenden Anhang und gibt genau den entfernten Datensatz zurück', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    const created = await db.unit.attachments.create({
      todoId: todo.id,
      kind: 'image',
      title: null,
      target: 'erzeugter-name.png',
      now: NOW,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const removed = await db.unit.attachments.remove(created.value.id);
    expect(removed.ok).toBe(true);
    if (!removed.ok) return;
    // Der Aufrufer braucht bei einem Bild genau diesen erzeugten Namen, um die
    // Kopie mitzunehmen — nach dem Löschen der Zeile könnte er ihn nicht mehr lesen.
    expect(removed.value.target).toBe('erzeugter-name.png');
    expect(removed.value.id).toBe(created.value.id);

    expect(await db.unit.attachments.load(created.value.id)).toBeNull();
    expect(await db.unit.attachments.list(todo.id)).toEqual([]);
  });

  it('das Entfernen eines nicht vorhandenen Anhangs ist not_found', async () => {
    db = openTestDatabase();
    const removed = await db.unit.attachments.remove('unbekannt' as AttachmentId);
    expect(removed.ok).toBe(false);
    if (removed.ok) return;
    expect(removed.error.code).toBe('not_found');
  });

  it('entfernt einen von mehreren Anhängen — die übrigen bleiben unangetastet, mit ihren ursprünglichen Positionen', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    const eins = await db.unit.attachments.create({ todoId: todo.id, kind: 'link', title: null, target: 'http://example.org/1', now: NOW });
    const zwei = await db.unit.attachments.create({ todoId: todo.id, kind: 'link', title: null, target: 'http://example.org/2', now: NOW });
    expect(eins.ok && zwei.ok).toBe(true);
    if (!eins.ok || !zwei.ok) return;

    await db.unit.attachments.remove(eins.value.id);

    const liste = await db.unit.attachments.list(todo.id);
    expect(liste.map((a) => a.target)).toEqual(['http://example.org/2']);
    expect(liste[0]?.position).toBe(1);
  });
});

describe('createAttachmentPort.imageTargets — nur die Bildziele, in Vorbereitung auf A-A-18', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('liefert ausschließlich die Ziele der Art "image", keine Verweise und keine Dateien', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);

    await db.unit.attachments.create({ todoId: todo.id, kind: 'link', title: null, target: 'http://example.org/', now: NOW });
    await db.unit.attachments.create({ todoId: todo.id, kind: 'file', title: null, target: '/home/nutzer/bericht.pdf', now: NOW });
    await db.unit.attachments.create({ todoId: todo.id, kind: 'image', title: null, target: 'bild-eins.png', now: NOW });
    await db.unit.attachments.create({ todoId: todo.id, kind: 'image', title: null, target: 'bild-zwei.jpg', now: NOW });

    const ziele = await db.unit.attachments.imageTargets(todo.id);
    expect([...ziele].sort()).toEqual(['bild-eins.png', 'bild-zwei.jpg'].sort());
  });

  it('ein Todo ohne Bildanhänge ergibt eine leere Liste', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    await db.unit.attachments.create({ todoId: todo.id, kind: 'link', title: null, target: 'http://example.org/', now: NOW });

    expect(await db.unit.attachments.imageTargets(todo.id)).toEqual([]);
  });

  it('ein fremdes oder gelöschtes Todo ergibt ebenfalls eine leere Liste, keinen Fehler', async () => {
    db = openTestDatabase();
    expect(await db.unit.attachments.imageTargets('kein-solches-todo' as TodoId)).toEqual([]);
  });
});

// -----------------------------------------------------------------------
// T-174 (unit-tester), O-DE — `knownImageTargets`, einer der drei Riegel des
// Aufräumens beim Start (A-A-18). Gefragt wird über
// `ix_todo_attachment_image` (Migration 0015), nach genau den Namen, die im
// Bildverzeichnis gefunden wurden — nicht nach allen Bildzielen des Bestands.
// -----------------------------------------------------------------------
describe('createAttachmentPort.knownImageTargets — der Bestands-Riegel des Aufräumens (A-A-18)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('eine leere Namensliste ergibt eine leere Menge, ohne die Datenbank zu fragen', async () => {
    db = openTestDatabase();
    expect(await db.unit.attachments.knownImageTargets([])).toEqual(new Set());
  });

  it('nennt nur Namen, die als Bildanhang bekannt sind — unbekannte Namen fehlen in der Antwort', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    await db.unit.attachments.create({
      todoId: todo.id,
      kind: 'image',
      title: null,
      target: 'bild-eins.png',
      now: NOW,
    });

    const bekannt = await db.unit.attachments.knownImageTargets([
      'bild-eins.png',
      'bild-nie-angelegt.png',
    ]);

    expect(bekannt.has('bild-eins.png')).toBe(true);
    expect(bekannt.has('bild-nie-angelegt.png')).toBe(false);
    expect(bekannt.size).toBe(1);
  });

  it('ein Verweis- oder Dateianhang mit demselben Namenswert zählt NICHT als bekanntes Bildziel', async () => {
    // Der Riegel fragt ausdrücklich "kind = 'image'" (Migration 0015). Ein
    // Verweis oder eine Datei, deren Ziel zufällig wie ein erzeugter
    // Bildname aussieht, darf eine wirklich verwaiste Bildkopie nicht
    // verschonen.
    db = openTestDatabase();
    const todo = await createTodo(db);
    const wieEinBildname = '0123456789abcdef0123456789abcdef.png';
    await db.unit.attachments.create({
      todoId: todo.id,
      kind: 'file',
      title: null,
      target: wieEinBildname,
      now: NOW,
    });

    const bekannt = await db.unit.attachments.knownImageTargets([wieEinBildname]);
    expect(bekannt.has(wieEinBildname)).toBe(false);
    expect(bekannt.size).toBe(0);
  });

  it('ein entfernter Bildanhang verschwindet aus der Antwort — der Bestand wächst und schrumpft, der Riegel folgt', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    const angelegt = await db.unit.attachments.create({
      todoId: todo.id,
      kind: 'image',
      title: null,
      target: 'bild-zwei.jpg',
      now: NOW,
    });
    expect(angelegt.ok).toBe(true);
    if (!angelegt.ok) return;

    expect((await db.unit.attachments.knownImageTargets(['bild-zwei.jpg'])).has('bild-zwei.jpg')).toBe(
      true,
    );

    await db.unit.attachments.remove(angelegt.value.id);

    expect(
      (await db.unit.attachments.knownImageTargets(['bild-zwei.jpg'])).has('bild-zwei.jpg'),
    ).toBe(false);
  });
});

// -----------------------------------------------------------------------
// T-174 (unit-tester), Nachtrag zur Deckungsschwelle: `knownKinds` und
// `imageCount` sind während dieser Welle (T-178, A-A-36 / T-179 B-1) in
// dieser Datei entstanden und hatten bis hierher keinen Prüffall — der
// Grund, warum `packages/storage/src/**` unter 80 % Zweigdeckung fiel.
// -----------------------------------------------------------------------
describe('createAttachmentPort.knownKinds — die Nachschlagetabelle (A-A-36)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('liefert genau die drei aus Migration 0015 eingetragenen Arten', async () => {
    db = openTestDatabase();
    expect([...(await db.unit.attachments.knownKinds())].sort()).toEqual(['file', 'image', 'link']);
  });

  it('ändert sich NICHT durch das Anlegen oder Entfernen von Anhängen — sie liest die Nachschlagetabelle, nicht die Nutzung', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    await db.unit.attachments.create({
      todoId: todo.id,
      kind: 'image',
      title: null,
      target: 'bild.png',
      now: NOW,
    });

    expect([...(await db.unit.attachments.knownKinds())].sort()).toEqual(['file', 'image', 'link']);
  });

  it('eine vierte, von außen eingetragene Art erscheint sofort — die Menge darf wachsen (A-A-36)', async () => {
    // Migration 0015 macht die Arten bewußt zu DATEN und keiner Schemaklausel
    // (Kopfkommentar der Migration). Simuliert wird hier genau der Fall, den
    // A-A-36 überhaupt erst nötig macht: ein Bestand mit einer Art mehr, als
    // dieses Erzeugnis kennt.
    db = openTestDatabase();
    db.conn.exec("INSERT INTO todo_attachment_kind (kind) VALUES ('screenshot')");

    expect([...(await db.unit.attachments.knownKinds())].sort()).toEqual([
      'file',
      'image',
      'link',
      'screenshot',
    ]);
  });
});

describe('createAttachmentPort.imageCount — Gesamtzahl der Bildanhänge, für die Widerspruchsprüfung (T-179 B-1)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('ohne jeden Anhang: 0', async () => {
    db = openTestDatabase();
    expect(await db.unit.attachments.imageCount()).toBe(0);
  });

  it('zählt ausschließlich Anhänge der Art "image" — keine Verweise, keine Dateien', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    await db.unit.attachments.create({ todoId: todo.id, kind: 'link', title: null, target: 'http://example.org/', now: NOW });
    await db.unit.attachments.create({ todoId: todo.id, kind: 'file', title: null, target: '/home/nutzer/bericht.pdf', now: NOW });
    await db.unit.attachments.create({ todoId: todo.id, kind: 'image', title: null, target: 'bild-eins.png', now: NOW });
    await db.unit.attachments.create({ todoId: todo.id, kind: 'image', title: null, target: 'bild-zwei.jpg', now: NOW });

    expect(await db.unit.attachments.imageCount()).toBe(2);
  });

  it('zählt über mehrere Todos hinweg, nicht nur innerhalb eines einzelnen', async () => {
    db = openTestDatabase();
    const todoA = await createTodo(db);
    const todoB = await createTodo(db);
    await db.unit.attachments.create({ todoId: todoA.id, kind: 'image', title: null, target: 'a.png', now: NOW });
    await db.unit.attachments.create({ todoId: todoB.id, kind: 'image', title: null, target: 'b.png', now: NOW });

    expect(await db.unit.attachments.imageCount()).toBe(2);
  });

  it('sinkt wieder, sobald ein Bildanhang entfernt wird', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    const angelegt = await db.unit.attachments.create({
      todoId: todo.id,
      kind: 'image',
      title: null,
      target: 'c.png',
      now: NOW,
    });
    expect(angelegt.ok).toBe(true);
    if (!angelegt.ok) return;

    expect(await db.unit.attachments.imageCount()).toBe(1);

    await db.unit.attachments.remove(angelegt.value.id);

    expect(await db.unit.attachments.imageCount()).toBe(0);
  });
});

describe('Anhänge als Unterressource des Todos — ON DELETE CASCADE (Migration 0015)', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  it('wird das Todo gelöscht, verschwinden seine Anhänge mit — der Adapter tut dafür nichts Eigenes', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    await db.unit.attachments.create({ todoId: todo.id, kind: 'link', title: null, target: 'http://example.org/', now: NOW });
    await db.unit.attachments.create({ todoId: todo.id, kind: 'image', title: null, target: 'bild.png', now: NOW });

    expect(await db.unit.attachments.list(todo.id)).toHaveLength(2);

    const removed = await db.unit.todos.remove(todo.id);
    expect(removed.ok).toBe(true);

    expect(await db.unit.attachments.list(todo.id)).toEqual([]);
  });

  it('das Löschen eines Todos mit einer Zeitbuchung ist blockiert — und lässt seine Anhänge deshalb unangetastet', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    await db.unit.attachments.create({ todoId: todo.id, kind: 'link', title: null, target: 'http://example.org/', now: NOW });
    const started = await db.unit.timer.start(todo.id, false, ts('2026-08-31T08:00:00Z'));
    expect(started.ok).toBe(true);

    const removed = await db.unit.todos.remove(todo.id);
    expect(removed.ok).toBe(false);

    // Die Blockade griff vor jedem Löschen — der Anhang ist unversehrt da.
    expect(await db.unit.attachments.list(todo.id)).toHaveLength(1);
  });
});

describe('Eine Art, die die Domäne nicht kennt, wird beim Lesen übergangen — nicht geworfen, nicht gelöscht', () => {
  let db: TestDatabase;

  afterEach(() => {
    db.close();
  });

  /**
   * Simuliert VG-3 (Schreiben an der Tür vorbei) bzw. einen Bestand aus einer
   * neueren Fassung: Die kleine Nachschlagetabelle `todo_attachment_kind`
   * bekommt eine vierte, der heutigen Domäne unbekannte Art, und eine Zeile
   * benutzt sie. `list`/`load` dürfen dabei nicht werfen — sie lassen die
   * Zeile aus (`toAttachments` filtert über `isAttachmentKind`).
   */
  it('list überspringt eine unbekannte Art stillschweigend, ohne zu werfen', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);
    const bekannt = await db.unit.attachments.create({
      todoId: todo.id,
      kind: 'link',
      title: null,
      target: 'http://example.org/',
      now: NOW,
    });
    expect(bekannt.ok).toBe(true);
    if (!bekannt.ok) return;

    db.conn.exec("INSERT INTO todo_attachment_kind (kind) VALUES ('video')");
    db.conn
      .prepare(
        `INSERT INTO todo_attachment (id, todo_id, kind, title, target, position, created_at)
         VALUES (?, ?, 'video', NULL, 'ein-video.mp4', 1, ?)`,
      )
      .run('unbekannte-art-001', todo.id, NOW);

    const liste = await db.unit.attachments.list(todo.id);
    expect(liste.map((a) => a.target)).toEqual(['http://example.org/']);

    // Übergangen heißt NICHT gelöscht: Die Zeile ist noch physisch da.
    const zeilenImBestand = db.conn
      .prepare('SELECT COUNT(*) AS n FROM todo_attachment WHERE todo_id = ?')
      .get(todo.id) as { n: number } | undefined;
    expect(zeilenImBestand?.n).toBe(2);
  });

  it('load einer Zeile mit unbekannter Art ist null, obwohl die Zeile existiert', async () => {
    db = openTestDatabase();
    const todo = await createTodo(db);

    db.conn.exec("INSERT INTO todo_attachment_kind (kind) VALUES ('video')");
    db.conn
      .prepare(
        `INSERT INTO todo_attachment (id, todo_id, kind, title, target, position, created_at)
         VALUES (?, ?, 'video', NULL, 'ein-video.mp4', 0, ?)`,
      )
      .run('unbekannte-art-002', todo.id, NOW);

    expect(await db.unit.attachments.load('unbekannte-art-002' as AttachmentId)).toBeNull();
  });
});
