/**
 * Takt — Anwendungsfälle rund um Anhänge (A-19.8 bis A-19.15, A-19.18,
 * E-071, E-072, A-A-13 bis A-A-18).
 *
 * ===========================================================================
 * Was diese Datei **nicht** tut, und warum das die halbe Aufgabe ist
 * ===========================================================================
 *
 * Sie öffnet nichts (A-19.18). Kein `open`, keine Shell, kein Betrachter, kein
 * Vorabholen. Ein Anhang wird auf ausdrückliche Handlung des Benutzers
 * geöffnet, und das geschieht in der Hülle — hinter einer Formprüfung, die
 * **bei jedem Aufruf** neu läuft (E-072 Punkt 2). Diese Datei legt an, liest
 * und entfernt.
 *
 * Und sie reicht nichts in einen Export (A-19.17). Der Exportmotor bekommt
 * `ExportGroup`-Werte und keine Ports; `ExportSourcePath` bleibt bei zwölf
 * Werten (A-A-20). Es gibt keine Leitung von hier dorthin — nicht eine, die
 * abgeschaltet ist, sondern keine.
 *
 * ===========================================================================
 * Die Reihenfolge beim Anlegen eines Bildes ist Inhalt
 * ===========================================================================
 *
 * Erst wird die Datei gelesen, geprüft und kopiert; **danach** entsteht die
 * Zeile. Umgekehrt gäbe es einen Anhang, dessen Bild nie ankam.
 *
 * Der umgekehrte Fehlschlag bleibt und wird benannt: Scheitert das Schreiben
 * der Zeile, liegt eine Kopie ohne Eigentümer im Bildverzeichnis. Sie wird
 * deshalb im selben Zug wieder entfernt — siehe {@link addAttachment}. Ein
 * Zwei-Phasen-Verfahren über Dateisystem und Datenbank hinweg gibt es nicht
 * und soll es nicht geben; was es gibt, ist eine Aufräumung an der einen
 * Stelle, an der sie nötig ist.
 */

import type {
  Attachment,
  AttachmentCreate,
  AttachmentId,
  AttachmentKind,
  AttachmentOrigin,
  ImageMediaType,
  PathRejection,
  TodoId,
} from '@takt/domain';
import {
  MAX_ATTACHMENT_IMAGE_BYTES,
  attachmentTargetFileName,
  checkAttachmentPath,
  err,
  normalizeAttachmentLink,
  ok,
  taktError,
} from '@takt/domain';
import type { ImageBlobFailure } from '@takt/storage';

import { type AppContext, type UseCaseResult, now } from '../../context.ts';
import { errorKindValue } from '../../logger.ts';

/**
 * Was hereinkommt, um einen Anhang anzulegen.
 *
 * Eine Vereinigung über die Art und **kein** Objekt mit drei freiwilligen
 * Feldern. Der Unterschied ist derselbe, den A-A-1 für die Öffnen-Befehle der
 * Hülle verlangt: Ein gemeinsamer Eingang mit einem Typkennzeichen wäre der
 * Weg, eine Adresse durch die Pfadprüfung zu schicken. Hier wie dort trägt der
 * **Typ** die Trennung, nicht eine Verzweigung.
 */
export type AddAttachmentInput =
  | { readonly kind: 'link'; readonly title: string | null; readonly url: string }
  | { readonly kind: 'file'; readonly title: string | null; readonly path: string }
  | { readonly kind: 'image'; readonly title: string | null; readonly sourcePath: string };

/**
 * Ein Anhang, wie ihn eine Antwort führt.
 *
 * ---------------------------------------------------------------------------
 * Die Regel dieser Fläche: **gespeichert wird geliefert, abgeleitet wird
 * gerechnet**
 * ---------------------------------------------------------------------------
 *
 * Deshalb steht hier `title` und `target` und **kein** `label`. Die
 * Ersatzbeschriftung aus A-19.12 — die Adresse ohne ihr `https://`, der
 * Dateiname mit seinem Ordner dahinter — ist eine reine Ableitung, sie liegt
 * als `attachmentLabel` in `@takt/domain`, und **jede** Fläche ruft sie dort.
 *
 * Dasselbe Muster wie beim Fristzustand (siehe `features/todos/todos.ts`): Ein
 * abgeleiteter Wert in einer Antwort ist ein zweiter Wert über dieselbe Sache,
 * und der eine altert. Beim Zustand altert er über Nacht; beim Etikett altert
 * er, sobald jemand den Titel ändert und die Liste noch nicht neu geladen ist.
 *
 * Was hier ebenfalls **nicht** steht: der Quellpfad eines Bildes. Er wurde nie
 * gespeichert (Migration 0015) — er verriete, wo der Benutzer seine Dateien
 * hält, und niemand braucht ihn nach dem Kopieren.
 *
 * `position` steht dagegen sehr wohl da: Sie ist **gespeichert** und nicht
 * abgeleitet (A-19.8, stabile Reihenfolge).
 */
export interface AttachmentView {
  readonly id: AttachmentId;
  readonly todoId: TodoId;
  readonly kind: AttachmentKind;
  readonly title: string | null;
  readonly target: string;
  readonly position: number;
  readonly createdAt: string;
  /**
   * Woher der Anhang stammt (A-A-84). Er steht in der Antwort, weil die
   * Rückfrage vor dem Öffnen ihn braucht (A-A-85) und weil die Anhangsliste an
   * ihm entscheidet, welche Regeln für den angezeigten Namen gelten
   * (A-19.23b, A-A-93).
   *
   * **Gespeichert wird geliefert.** Das ist kein abgeleiteter Wert, der sich
   * aus dem Pfad raten ließe — genau das verbietet A-A-84.
   */
  readonly origin: AttachmentOrigin;
  /** Der Absender, **fremder Text** (A-A-85). `null` heißt „gibt es nicht". */
  readonly originSender: string | null;
  /**
   * Der Name aus fremder Hand (A-19.23a), **fremder Text**. `null` bei jedem
   * Anhang, den der Benutzer selbst eingetragen hat.
   *
   * Getrennt von `title`, damit die anzeigende Fläche weiß, welche Regeln
   * gelten: Bei diesem Wert ist die Endung stets sichtbar und am Ende wird nie
   * gekürzt.
   */
  readonly displayName: string | null;
  /** Nachbau statt ursprünglicher Nachricht (A-19.22b, A-A-97). */
  readonly rebuilt: boolean;
}

export function toAttachmentView(attachment: Attachment): AttachmentView {
  return {
    id: attachment.id,
    todoId: attachment.todoId,
    kind: attachment.kind,
    title: attachment.title,
    target: attachment.target,
    position: attachment.position,
    createdAt: attachment.createdAt,
    origin: attachment.origin,
    originSender: attachment.originSender,
    displayName: attachment.displayName,
    rebuilt: attachment.rebuilt,
  };
}

/** Die Anhänge eines Todos (A-19.11). Liest, öffnet nichts. */
export async function listAttachments(
  context: AppContext,
  todoId: TodoId,
): Promise<UseCaseResult<readonly AttachmentView[]>> {
  return context.transactions.inTransaction(async (unit) => {
    const todo = await unit.todos.load(todoId);
    if (todo === null) return err(taktError('not_found', 'Dieses Todo gibt es nicht.'));
    const list = await unit.attachments.list(todoId);
    return ok(list.map(toAttachmentView));
  });
}

/** Deutsche Sätze zu den Fehlschlägen des Bildports. Ein Satz je Schlüssel, keiner davon nennt einen Wert. */
const IMAGE_FAILURE_MESSAGE: Readonly<Record<ImageBlobFailure, string>> = Object.freeze({
  unreadable: 'Diese Datei lässt sich nicht lesen.',
  too_large: `Dieses Bild ist zu groß. Erlaubt sind bis zu ${String(
    Math.floor(MAX_ATTACHMENT_IMAGE_BYTES / (1024 * 1024)),
  )} MiB.`,
  empty: 'Diese Datei ist leer.',
  not_an_image: 'Diese Datei ist kein Bild. Erlaubt sind PNG, JPEG, GIF und WebP.',
  bad_name: 'Dieses Vorschaubild gehört nicht zu diesem Bestand.',
  write_failed: 'Das Bild konnte nicht abgelegt werden.',
});

/** Deutsche Sätze zu den Fehlschlägen der Adressprüfung. Der abgewiesene Wert steht in keinem davon (A-A-8). */
const LINK_MESSAGE = 'Als Verweis sind ausschließlich http- und https-Adressen zulässig.';
const PATH_MESSAGE =
  'Als Datei ist ein vorhandener absoluter Pfad zulässig. Netzwerkpfade sind es nicht.';
const INDIRECT_MESSAGE =
  'Verknüpfungen (.lnk, .url, .pif, .scf, .desktop) sind als Anhang nicht zulässig: Sie zeigen auf etwas anderes, als ihr Name sagt.';

/**
 * A-A-28. Ein eigener Satz und nicht {@link PATH_MESSAGE}, weil dieser Satz die
 * einzige Auskunft ist, die der Benutzer über eine Absage bekommt, die er unter
 * Linux und macOS **nicht erwartet**: `Besprechung 10:30.pdf` ist dort ein
 * gewöhnlicher Name (Bedrohungsmodell 22.1.1, „Der Preis, ausgeschrieben").
 * „Netzwerkpfade sind es nicht" wäre für ihn keine Auskunft, sondern eine
 * falsche Fährte.
 *
 * Genannt wird der Grund — der Doppelpunkt — und die Folge; keine Belehrung
 * (E-078). Ohne Anrede, weil der Satz ohne auskommt (E-080 Punkt 4).
 */
const STREAM_SEPARATOR_MESSAGE =
  'Ein Doppelpunkt im Dateinamen ist als Anhang nicht zulässig: Unter Windows benennt er einen zweiten Datenstrom derselben Datei, und SuperTakt öffnet solche Pfade nicht.';

/** Der Satz zu einem abgewiesenen Pfad. Ein Grund, ein Satz — und keiner nennt den Wert (A-A-8). */
function pathMessage(reason: PathRejection): string {
  if (reason === 'path_stream_separator') return STREAM_SEPARATOR_MESSAGE;
  if (reason === 'path_indirect_extension') return INDIRECT_MESSAGE;
  return PATH_MESSAGE;
}

/**
 * Einen Anhang hinzufügen (A-19.10, A-19.11).
 *
 * ---------------------------------------------------------------------------
 * Drei Arten, drei Prüfungen, und keine davon steht hier
 * ---------------------------------------------------------------------------
 *
 * Die Regeln liegen in `packages/domain/src/attachment.ts`; diese Datei ruft
 * sie und übersetzt ihr Ergebnis. Das ist der Unterschied zwischen einem
 * Anwendungsfall und einer Fachregel — und der Grund, warum die Normalisierung
 * der Adresse an genau **einer** Stelle steht (A-A-13).
 *
 * ---------------------------------------------------------------------------
 * Diese Tür ist der **zweite** Riegel und nicht der einzige
 * ---------------------------------------------------------------------------
 *
 * Die tragende Kontrolle sitzt in `check_link` und `check_file`
 * (`apps/desktop/src-tauri/src/attachment.rs`) und läuft **bei jedem Aufruf**
 * unmittelbar vor dem Öffnen. Zwischen dieser Tür und jenem Öffnen liegt der
 * **Bestand**, und in den Bestand kommt man an dieser Tür vorbei: über die
 * Routen des Dienstes mit dem Sitzungsgeheimnis (VG-1) und über ein `UPDATE`
 * mit `sqlite3` auf die Bestandsdatei (VG-3). Was hier geprüft wird, ist also
 * nur, was **hier** hereinkommt.
 *
 * Umgekehrt ist diese Prüfung nicht entbehrlich, weil es die andere gibt: Sie
 * hält den unzulässigen Wert aus dem Bestand heraus, solange er über die Tür
 * kommt, und sie nennt dem Benutzer den Grund im Augenblick der Eingabe statt
 * nach einem Klick auf einen Anhang, den er schon angelegt hat. **Keine der
 * beiden ist die Verdopplung der anderen.** Wer eine davon streicht, weil sie
 * doppelt aussieht, streicht entweder die Kontrolle oder die Auskunft.
 *
 * ---------------------------------------------------------------------------
 * Das Bild wird kopiert, bevor die Zeile entsteht
 * ---------------------------------------------------------------------------
 *
 * Und wenn danach die Zeile nicht entsteht, wird die Kopie wieder entfernt.
 * Eine verwaiste Kopie ist Kundenmaterial ohne Eigentümer (A-A-18) — und der
 * einzige Fall, in dem eine entstehen könnte, ist genau dieser.
 */
export async function addAttachment(
  context: AppContext,
  todoId: TodoId,
  input: AddAttachmentInput,
): Promise<UseCaseResult<AttachmentView>> {
  const timestamp = now(context);
  const title = input.title === null || input.title.trim() === '' ? null : input.title.trim();

  // Rein, und deshalb vor jeder Transaktion und vor jedem Dateizugriff: Eine
  // unzulässige Eingabe soll weder eine Klammer öffnen noch eine Datei lesen.
  if (input.kind === 'link') {
    const checked = normalizeAttachmentLink(input.url);
    if (!checked.ok) return err(taktError('validation_error', LINK_MESSAGE));
    return insert(context, { todoId, kind: 'link', title, target: checked.url, now: timestamp });
  }

  if (input.kind === 'file') {
    const checked = checkAttachmentPath(input.path);
    if (!checked.ok) {
      return err(taktError('validation_error', pathMessage(checked.reason)));
    }
    return insert(context, { todoId, kind: 'file', title, target: checked.path, now: timestamp });
  }

  const copied = await context.attachmentBlobs.copyImage(input.sourcePath);
  if (!copied.ok) {
    return err(taktError('validation_error', IMAGE_FAILURE_MESSAGE[copied.reason]));
  }

  const stored = await insert(context, {
    todoId,
    kind: 'image',
    title,
    target: copied.name,
    now: timestamp,
  });
  if (!stored.ok) {
    // Die Zeile ist nicht entstanden. Die Kopie geht mit — sonst läge sie
    // ohne Eigentümer im Bildverzeichnis (A-A-18).
    //
    // **Ohne Eigentümerfrage, und das ist begründet** (T-320, R-29): Der Name
    // kommt gerade eben aus `randomUUID()`, die Datei ist Sekunden alt, und die
    // einzige Zeile, die sie je nennen sollte, ist nicht entstanden. Die Regel
    // und ihre Grenze stehen in {@link releaseUnclaimedBlobs}.
    //
    // Gelingt auch das nicht, bleibt es beim Fehlschlag des INSERT als
    // Antwort: Der Benutzer hat keinen Anhang bekommen, und das ist die
    // Auskunft, die ihn angeht. Die liegengebliebene Kopie steht seit T-159
    // im Protokoll und verschwindet nicht mehr unbemerkt.
    await context.attachmentBlobs.removeImage(copied.name);
  }
  return stored;
}

/** Der gemeinsame Schreibvorgang. Prüft, daß es das Todo gibt, und legt an. */
async function insert(
  context: AppContext,
  input: AttachmentCreate,
): Promise<UseCaseResult<AttachmentView>> {
  return context.transactions.inTransaction(async (unit) => {
    const todo = await unit.todos.load(input.todoId);
    if (todo === null) return err(taktError('not_found', 'Dieses Todo gibt es nicht.'));

    const created = await unit.attachments.create(input);
    if (!created.ok) return err(created.error);
    return ok(toAttachmentView(created.value));
  });
}

/**
 * Eine Datei, die mit einer gelöschten Zeile fallen **soll** — und der Wert,
 * mit dem der Blob-Port sie entfernt.
 *
 * `target` ist Zeichen für Zeichen der gespeicherte Wert: beim Bild der bloße
 * erzeugte Name, bei der übernommenen E-Mail-Datei der volle Pfad (A-19.26).
 * Die Form prüft der Blob-Port noch einmal an dem Wert, den er benutzt — hier
 * wird nichts umgeschrieben.
 */
export interface ReleasableBlob {
  readonly kind: 'image' | 'emailFile';
  readonly target: string;
}

/**
 * **Entfernt die Dateien, die danach niemandem mehr gehören — und nur diese**
 * (A-A-98, A-A-18, A-19.23, R-29, T-320).
 *
 * ===========================================================================
 * Die Regel, und sie gilt über diese Funktion hinaus
 * ===========================================================================
 *
 * **Wer eine Datei entfernt, muß fragen, ob sie noch jemandem gehört — mit der
 * weitesten Frage, nicht mit der nächstliegenden.**
 *
 * Die weiteste Frage ist `attachmentsNamingFiles`: über **Namen** statt über
 * Zeilen, **ohne** `kind`, **ohne** `origin`, **ohne** Todo, ASCII-gefaltet und
 * ohne Rücksicht auf die Schreibweise des Pfades davor. Die Regel selbst liegt
 * in `@takt/domain` (`attachmentTargetNamesFile`) und an keiner zweiten Stelle;
 * genau dieselbe Frage stellen die beiden Aufräumläufe beim Start
 * (`orphan-sweep.ts`).
 *
 * Die **nächstliegende** Frage wäre „welche Art hatte die Zeile, die ich gerade
 * gelöscht habe" — und genau die stand bis T-320 in {@link removeAttachment}
 * und in `removeTodo`. Sie beantwortete „wem gehört diese Datei" ein zweites
 * Mal und enger, und ihre Antwort entschied eine Löschung. Der Preis war
 * gemessen und brauchte weder einen Angriff noch einen Aufräumlauf noch einen
 * Neustart (T-314 vierter Weg, T-318):
 *
 *   Todo A trägt eine Bildkopie `<hex>.png`. Todo B trägt einen **Dateianhang**
 *   auf denselben vollen Pfad — absolut, vorhanden, `.png`, kein UNC, keine
 *   Umleitungsendung, also durch `checkAttachmentPath` hindurch und ein
 *   gewöhnlicher Bedienweg. Wer nun A löscht, nimmt B sein Bild mit.
 *
 * ===========================================================================
 * Warum das **hinter** dem `COMMIT` steht und nicht davor
 * ===========================================================================
 *
 * Weil die gelöschte Zeile dann bereits fort ist. Eine nicht leere Antwort
 * heißt deshalb eindeutig „gehört noch **jemand anderem**" — vor dem `COMMIT`
 * fände die Frage die eigene Zeile und keine Datei fiele je.
 *
 * ===========================================================================
 * Was **nicht** durch diese Funktion geht, und warum das kein Versäumnis ist
 * ===========================================================================
 *
 * Drei Stellen entfernen Dateien ohne diese Frage, und alle drei teilen eine
 * Eigenschaft, die sie von einer Löschung unterscheidet: **Die Datei ist in
 * demselben Aufruf entstanden, trägt einen frisch erzeugten Namen aus
 * `randomUUID()` und hat nie eine Zeile bekommen** —
 * {@link addAttachment} nach einem gescheiterten `INSERT` und die beiden
 * Aufräumzweige in `email-attachments.ts` (A-A-83). Ein anderer Eigentümer
 * müßte 128 Zufallsbits erraten haben, bevor sie geschrieben wurde.
 *
 * Dort wäre die Frage sogar schädlich: Sie braucht den Bestand, und jene beiden
 * Zweige laufen gerade deshalb, **weil** der Bestand sich verweigert hat. Eine
 * unbeantwortbare Frage ließe dort Kundenmaterial aus einer fremden E-Mail ohne
 * Eigentümer liegen — der Zustand, gegen den A-A-83 geschrieben ist.
 *
 * ===========================================================================
 * Der Fehlschlag
 * ===========================================================================
 *
 * Läßt sich die Frage nicht beantworten, fällt **nichts**. Das ist der billige
 * Fehler (eine Datei zuviel im Anwendungsdatenverzeichnis) gegen den teuren
 * (Kundenmaterial mit Eigentümer, ohne Rückfrage und ohne Papierkorb). Der Wurf
 * wird **nicht** weitergereicht: Der Anhang beziehungsweise das Todo ist
 * gelöscht, und eine Antwort, die den Aufrufer zum Wiederholen bringt, wäre
 * derselbe Fehler wie vor E-111.
 *
 * Still ist der Fehlschlag nicht — er bekommt eine Zeile mit der **Art** des
 * Wurfs und einer Zahl. Kein Pfad, kein Name, kein Wert aus dem Bestand
 * (B-2.4).
 */
export async function releaseUnclaimedBlobs(
  context: AppContext,
  blobs: readonly ReleasableBlob[],
): Promise<void> {
  /*
   * Gefragt wird mit dem **Namen**, nicht mit dem gespeicherten Wert: Beim Bild
   * sind beide gleich, bei der übernommenen Datei ist der Wert ein Pfad, und
   * ein Pfad fände eine zweite Zeile mit anderer Schreibweise nicht. Dieselbe
   * Faltung, in der die Antwort kommt (`attachmentTargetFileName`).
   *
   * Ein Wert ohne beurteilbaren Namen fällt heraus und kommt in keiner Richtung
   * wieder vor — er wird weder gefragt noch entfernt. Im Zweifel liegen lassen.
   */
  const names = new Set<string>();
  for (const blob of blobs) {
    const name = attachmentTargetFileName(blob.target);
    if (name !== '') names.add(name);
  }
  if (names.size === 0) return;

  let owners: ReadonlySet<string>;
  try {
    owners = await context.transactions.inTransaction((unit) =>
      unit.attachments.attachmentsNamingFiles([...names]),
    );
  } catch (error) {
    context.logger?.lifecycle(
      'warn',
      'Es ließ sich nicht feststellen, ob die Dateien des gelöschten Eintrags noch anderswo gebraucht werden. Sie bleiben deshalb im Anwendungsdatenverzeichnis liegen.',
      `attachment_release_unavailable files=${String(names.size)} reason=${errorKindValue(error)}`,
    );
    return;
  }

  let kept = 0;
  for (const blob of blobs) {
    const name = attachmentTargetFileName(blob.target);
    if (name === '') continue;
    if (owners.has(name)) {
      // **Der ganze Punkt dieser Funktion.** Eine andere Zeile nennt diese
      // Datei noch; sie bleibt liegen, und der Benutzer merkt nichts — außer
      // daß sein anderer Anhang sich weiter öffnen läßt.
      kept += 1;
      continue;
    }
    /*
     * Der Aufrufer bekommt `ok`, auch wenn eine Datei liegen bleibt — der
     * **Eintrag** ist entfernt, und das stimmt. Aus einem Fehlschlag hier einen
     * Fehler zu machen, hieße einen Vorgang zurückzumelden, der stattgefunden
     * hat, und eine Zeile, die es nicht mehr gibt, ließe sich ohnehin nicht
     * wiederherstellen. Der Fehlschlag steht seit T-159 im Protokoll (A-A-18).
     */
    if (blob.kind === 'image') await context.attachmentBlobs.removeImage(blob.target);
    else await context.attachmentBlobs.removeEmailFile(blob.target);
  }

  if (kept > 0) {
    context.logger?.lifecycle(
      'info',
      `${String(kept)} Datei(en) des gelöschten Eintrags bleiben liegen, weil ein anderer Anhang sie noch nennt.`,
      `attachment_release_claimed files=${String(kept)}`,
    );
  }
}

/**
 * Welche Datei mit einem gelöschten Anhang **überhaupt in Frage kommt** — und
 * `null`, wenn keine.
 *
 * Diese Frage ist eng, und hier ist die Enge richtig: Sie sagt nicht, wem eine
 * Datei gehört, sondern welchen Ordner SuperTakt für diese Zeile selbst
 * beschrieben hat. Ein vom Benutzer eingetragener Pfad (`origin = 'user'`)
 * steht deshalb nicht darin — die Datei dahinter gehört ihm, Takt hat sie nie
 * kopiert, und das Löschen eines Anhangs darf sie nicht mitnehmen (Migration
 * 0015, A-19.23).
 *
 * Wem sie gehört, entscheidet danach {@link releaseUnclaimedBlobs} — und zwar
 * weit.
 */
export function releasableBlobOf(attachment: Attachment): ReleasableBlob | null {
  if (attachment.kind === 'image') return { kind: 'image', target: attachment.target };
  if (attachment.kind === 'file' && attachment.origin === 'email') {
    return { kind: 'emailFile', target: attachment.target };
  }
  return null;
}

/**
 * Einen Anhang entfernen (A-19.11).
 *
 * Bei einem Bild geht die Kopie **mit** (A-A-18) — **wenn sie danach niemandem
 * mehr gehört** (T-320, {@link releaseUnclaimedBlobs}). Die Reihenfolge ist
 * Inhalt: erst die Zeile, dann die Datei. Umgekehrt bliebe bei einem Abbruch
 * dazwischen ein Anhang ohne Bild zurück — und das ist der schlechtere von
 * beiden Endzuständen, weil der Benutzer ihn sieht und nicht versteht. Bleibt
 * die Datei liegen, sieht er nichts und der nächste Löschvorgang holt sie nicht
 * mehr ein; deshalb steht sie unmittelbar hinter dem `COMMIT` und nicht
 * irgendwann später.
 */
export async function removeAttachment(
  context: AppContext,
  todoId: TodoId,
  attachmentId: AttachmentId,
): Promise<UseCaseResult<void>> {
  const outcome = await context.transactions.inTransaction(async (unit) => {
    const existing = await unit.attachments.load(attachmentId);
    if (existing === null || existing.todoId !== todoId) {
      // Ein Anhang, der zu einem anderen Todo gehört, ist unter dieser Adresse
      // **nicht vorhanden** und nicht „verboten": Die Antwort soll nicht
      // verraten, daß es ihn anderswo gibt (B-2.4).
      return err(taktError('not_found', 'Diesen Anhang gibt es nicht.'));
    }
    const removed = await unit.attachments.remove(attachmentId);
    if (!removed.ok) return err(removed.error);
    return ok(removed.value);
  });

  if (!outcome.ok) return err(outcome.error);
  /*
   * **Zwei Fragen, und sie sind nicht dieselbe** (T-320).
   *
   *  1. {@link releasableBlobOf} — eng: Hat SuperTakt für diese Zeile selbst
   *     eine Datei geschrieben? Eine **übernommene** E-Mail-Datei kommt in
   *     Frage (A-19.23, A-A-83), ein vom Benutzer eingetragener Pfad
   *     ausdrücklich nicht. Die Unterscheidung hängt an `origin` und an nichts
   *     sonst — nicht am Ordner, nicht an der Form des Pfads.
   *  2. {@link releaseUnclaimedBlobs} — weit: Nennt sie noch **eine andere**
   *     Zeile? Bis T-320 fehlte diese zweite Frage, und die erste entschied
   *     allein. Sie ist die falsche Frage dafür: Sie beschreibt die gelöschte
   *     Zeile und nicht die Datei.
   */
  const blob = releasableBlobOf(outcome.value);
  if (blob !== null) await releaseUnclaimedBlobs(context, [blob]);
  return ok(undefined);
}

/**
 * Die Bytes eines Bildanhangs (E-071 Punkt 3).
 *
 * Die Oberfläche baut daraus eine `data:`-Adresse. **Die CSP wird dafür nicht
 * geöffnet** (A-A-12): `img-src` bleibt `'self' data:`.
 *
 * Warum nicht ein `<img src="http://127.0.0.1:17843/…">` und ein Eintrag mehr
 * in `img-src`? Weil ein `<img src>` **kein** `X-Takt-Token` trägt — der
 * Browser setzt bei einem Bildabruf keine eigenen Kopfzeilen. Diese Route
 * bräuchte dann entweder gar keinen Nachweis (Kundenmaterial für jeden lokalen
 * Prozeß, VG-1) oder ein Geheimnis in der Adresse (B-2.4). Base64 kostet ein
 * Drittel mehr Arbeitsspeicher; das ist der günstigere Preis (Bedrohungsmodell
 * 20.5, T-145-9).
 *
 * **Es öffnet sich dabei nichts** (A-19.18). Bytes zu lesen und auszuliefern
 * ist kein Öffnen-Befehl; der Zähler der Öffnen-Befehle bleibt bei null.
 */
export interface AttachmentImage {
  readonly mediaType: ImageMediaType | string;
  /** Base64 der Bilddaten. Die Oberfläche setzt `data:<mediaType>;base64,<data>`. */
  readonly base64: string;
}

export async function readAttachmentImage(
  context: AppContext,
  todoId: TodoId,
  attachmentId: AttachmentId,
): Promise<UseCaseResult<AttachmentImage>> {
  const found = await context.transactions.inTransaction(async (unit) => {
    const existing = await unit.attachments.load(attachmentId);
    if (existing === null || existing.todoId !== todoId || existing.kind !== 'image') {
      return err(taktError('not_found', 'Zu diesem Anhang gibt es kein Vorschaubild.'));
    }
    return ok(existing);
  });
  if (!found.ok) return err(found.error);

  const read = await context.attachmentBlobs.readImage(found.value.target);
  if (!read.ok) {
    /*
     * A-19.15 wörtlich: „Ein Anhang, der sich nicht öffnen lässt […] sagt das
     * an Ort und Stelle. Er verschwindet nicht und er wirft nicht."
     *
     * Deshalb `not_found` mit einem lesbaren Satz und kein `500`: Der Anhang
     * bleibt in der Liste, das Vorschaubild fehlt, und die Oberfläche kann das
     * an der Stelle sagen, an der es passiert ist.
     */
    return err(taktError('not_found', IMAGE_FAILURE_MESSAGE[read.reason]));
  }

  return ok({
    mediaType: read.mediaType,
    base64: Buffer.from(read.data).toString('base64'),
  });
}
