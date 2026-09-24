/**
 * Takt — Eingabeprüfung der Add-in-Routen (T-019).
 *
 * Jede Zeichenkette, die hier hereinkommt, hat mindestens eine fremde Quelle
 * berührt: den Betreff, den Text oder einen Anhangnamen einer E-Mail, die
 * jemand geschickt hat (Akteur A-06). Ein Typ am Rand ist eine Behauptung,
 * keine Prüfung — deshalb `unknown` hinein und ein geprüfter Wert heraus.
 *
 * Die Obergrenzen sind dieselben wie in
 * `apps/local-api/openapi/takt-local-api.yaml`; wo dort `maxLength` steht,
 * steht hier `.max(...)`.
 */

import { z } from 'zod';

/*
 * Die **geprüften Eingabeformen der Hauptanwendung** (T-114, Befund T-112-1
 * aus der Sicherheitsprüfung; seit T-149 auch die Frist).
 *
 * Bis T-114 stand hier für Titel und Tagname je eine eigene Abschrift
 * (`z.string().trim().min(1).max(…)`), und ein Kommentar sagte zu, sie sei
 * zeichengleich der aus `features/todos/routes.ts`. Seit T-101 stimmte das
 * nicht mehr: Dort kam die Prüfung auf Steuer- und Richtungszeichen hinzu,
 * hier nicht.
 * Zwei Abschriften derselben Regel sind zwei Gelegenheiten, sie verschieden zu
 * ändern — und genau das ist geschehen.
 *
 * Deshalb jetzt **dieselben Werte** und keine zweite Fassung. Der Bezug über
 * die Modulgrenze ist derselbe wie der auf `http/problem.ts` in `index.ts`:
 * Er holt eine Regel, die es genau einmal geben soll, und keinen Text.
 *
 * `dueDateSchema` kam mit T-149 dazu (A-19.21, E-074 Punkt 4) und ist
 * derselbe Handgriff ein drittes Mal — diesmal **vor** dem Auseinanderlaufen
 * statt danach. Die Regel selbst liegt noch eine Ebene tiefer: `isCalendarDay`
 * und `DUE_DATE_MESSAGE` stehen in `packages/domain/src/due-date.ts` (T-146),
 * `http/input.ts` bindet sie an zod, und diese Tür liest die Bindung. Eine
 * eigene `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` hier wäre die vierte
 * Abschrift der Klasse, die T-122, T-128 und T-134 dreimal aufgeräumt haben —
 * und sie wäre obendrein falsch: Sie nähme `2026-02-30` an.
 */
import {
  FORBIDDEN_NAME_CHARACTER_MESSAGE,
  hasForbiddenNameCharacter,
  MAIL_EXCERPT_MAX_LENGTH,
  MAIL_IDENTITY_MAX_LENGTH,
  MAIL_MESSAGE_ID_MAX_LENGTH,
  MAIL_NOTE_MAX_LENGTH,
  MAIL_SENDER_MAX_LENGTH,
  MAIL_SUBJECT_MAX_LENGTH,
  MAX_EMAIL_ATTACHMENT_COUNT,
  MAX_EMAIL_ATTACHMENT_TOTAL_BYTES,
  MAX_EMAIL_DISPLAY_NAME_CHARACTERS,
  TODO_TAG_IDS_MAX,
  TODO_TAG_NAMES_MAX,
} from '@takt/domain';

import {
  attachmentUrlSchema,
  dueDateSchema,
  nameSchema,
  titleSchema,
} from '../../http/input.ts';

/** UUID Fassung 7, wie `Id` in der OpenAPI-Beschreibung. */
const id = z.string().uuid();


/**
 * Transportdeckel für die Call-Nummer — **nicht** die Fachregel (T-041, T-046).
 *
 * Die Fachregel ist `checkCallNumber` aus `@takt/domain` (E-045, B-4.3): 3 bis
 * 64 Zeichen aus einem geschlossenen Vorrat. Sie wird in `index.ts` angewandt,
 * und zwar seit T-046 auch beim **Anlegen** und nicht nur bei der
 * Duplikatsuche.
 *
 * Der Deckel liegt bewusst **über** der Fachregel und nicht auf ihr. Wer 70
 * Zeichen einträgt, soll den Satz der Domäne lesen („höchstens 64 Zeichen") und
 * nicht eine englische Schemameldung; nur unbegrenzte Eingabe wird hier
 * abgefangen, bevor sie überhaupt in die Prüfung läuft.
 *
 * Bis T-046 war dieser Deckel die einzige Grenze. Damit ging ein Todo mit einer
 * 70-stelligen Call-Nummer durch, das die Duplikatsuche nie wieder fand — und
 * beim nächsten Mal wurde dieselbe Nummer erneut angelegt. Zwei Todos, ein
 * Kundenvorgang, zwei Zeilen in der Abrechnungsdatei (R-15).
 */
export const ADDIN_CALL_NUMBER_MAX_LENGTH = 128;


// Die Anhänge aus der E-Mail (A-19.22 bis A-19.33, E-108) — T-304

/*
 * ===========================================================================
 * Warum diese Deckel **über** den Fachgrenzen liegen und nicht auf ihnen
 * ===========================================================================
 *
 * Dieselbe Überlegung wie bei {@link ADDIN_CALL_NUMBER_MAX_LENGTH}, und hier
 * wiegt sie schwerer: A-19.29 und A-19.30 verlangen, daß eine nicht übernommene
 * Datei **namentlich** gemeldet wird, mit Grund. Läge der Transportdeckel auf
 * der Fachgrenze, bekäme der Benutzer statt dessen ein `422` über die ganze
 * Anfrage — kein Todo, keine Namen, kein Grund je Datei, und das für einen
 * Anhang, den nicht er ausgewählt hat, sondern ein Absender.
 *
 * Die Fachgrenzen stehen in `@takt/domain` (`MAX_EMAIL_ATTACHMENT_BYTES`,
 * `…_TOTAL_BYTES`, `…_COUNT`, `MAX_EMAIL_DISPLAY_NAME_CHARACTERS`) und werden
 * von `attachEmailToNewTodo` durchgesetzt. Was hier steht, ist ausschließlich
 * die Abwehr unbegrenzter Eingabe (B-1.7) — und jede dieser Zahlen ist **aus
 * der Fachgrenze gerechnet** und nicht daneben gesetzt, damit sie mitzieht,
 * wenn jemand die Fachgrenze verschiebt.
 */

/**
 * Wie viele Anhänge eine Anfrage höchstens **nennen** darf.
 *
 * Das Vierfache der Fachgrenze. Die 26. Datei wird nach A-19.29 benannt
 * abgewiesen (`rejected`), die 101. gar nicht erst gelesen — dann ist die
 * Anfrage kein Postfachinhalt mehr, sondern ein Skript.
 */
export const ADDIN_ATTACHMENTS_MAX = MAX_EMAIL_ATTACHMENT_COUNT * 4;

/**
 * Wie lang ein **Anzeigename** über die Leitung sein darf.
 *
 * Das Vierfache der Fachgrenze. Ein längerer Name wird von
 * `shortenEmailDisplayName` **in der Mitte gekürzt**, nicht abgewiesen
 * (A-19.23b, A-A-93) — ein Deckel auf 255 machte daraus eine Abweisung und
 * nähme dem Benutzer die Datei statt der überzähligen Zeichen.
 */
export const ADDIN_ATTACHMENT_NAME_MAX_LENGTH = MAX_EMAIL_DISPLAY_NAME_CHARACTERS * 4;

/**
 * Wie lang eine **Base64-Zeichenkette** sein darf.
 *
 * Gerechnet aus der Summengrenze: `48 MB · 4/3 = 64 MiB`, also genau das, was
 * die Rumpfgrenze dieser einen Route (`ADDIN_ATTACHMENT_MAX_BODY_BYTES`)
 * ohnehin trägt. Die Zahl ist damit in der Praxis **nie** die bindende Grenze:
 * Eine Datei über der Einzelgrenze (25 MB) kommt durch dieses Schema und wird
 * von der Domäne mit `too_large` und ihrer **gemessenen** Größe gemeldet — so,
 * wie A-19.30 es verlangt. Erst was auch den Rumpf sprengte, fällt hier.
 *
 * Sie steht trotzdem da, weil ein Feld ohne Deckel ein Feld ohne Deckel ist.
 */
export const ADDIN_ATTACHMENT_BASE64_MAX_LENGTH = (MAX_EMAIL_ATTACHMENT_TOTAL_BYTES / 3) * 4;

/**
 * Der **Absender** der E-Mail, fremder Text (A-A-84, A-A-85).
 *
 * Er geht als Eigenschaft an jeden Anhang dieses Laufs und steht Wochen später
 * in der Rückfrage vor dem Öffnen. Die Domäne kürzt ihn auf 640 Zeichen; der
 * Deckel hier liegt darüber, aus demselben Grund wie beim Anzeigenamen.
 */
export const ADDIN_ATTACHMENT_SENDER_MAX_LENGTH = 2048;

/**
 * Ein einzelner Anhang im Rumpf — **drei Gestalten, unterschieden am `kind`**.
 *
 * Eine unterschiedene Vereinigung und kein Objekt mit lauter freiwilligen
 * Feldern: `{ kind: 'link', contentBase64: '…' }` soll abgewiesen und nicht
 * ausgelegt werden. Dieselbe Bauart wie `attachmentInput` an der Haupttür, und
 * aus demselben Grund (Befund um `{ kind: 'file', url: … }`).
 *
 * **`rebuilt` trägt nur die Nachricht** (A-A-97). Ein gewöhnlicher Dateianhang
 * kann strukturell nicht als Nachbau gekennzeichnet werden, weil seine Gestalt
 * kein Feld dafür hat — nachgebaut wird eine **Nachricht**, alles andere kommt,
 * wie es ist.
 *
 * **Und es gibt keine Größenangabe** (A-A-15, A-A-81). `detail.size` aus
 * Office.js ist eine Behauptung des Absenders; was nicht da ist, kann nicht
 * geglaubt werden. Gezählt wird an der Zeichenkette und danach am dekodierten
 * Puffer, beides in der Domäne.
 */
/**
 * Der **Anzeigename** eines Anhangs — dieselbe Zeichenklasse wie jeder Name
 * (E-137 Punkt 3, A-20.4, A-A-14).
 *
 * Getrimmt und ohne Steuer- oder Richtungszeichen, weil die eigene
 * Datensicherung genau diese Regel auf `todo_attachment.display_name` anwendet
 * (`features/data-transfer/data-transfer.ts`, `ARCHIVED_NAME_COLUMNS`). Ohne
 * sie nähme diese Tür einen Namen an, den das Einspielen des daraus erzeugten
 * Archivs wieder abwiese — ein Bestand, der sich nicht zurückholen läßt.
 *
 * **Das widerspricht A-19.23b nicht.** Der Aufgabenbereich ersetzt ein
 * Richtungszeichen vorher durch die sichtbare Marke (`planTakeover`,
 * `visibleText`); was hier mit einem rohen Richtungszeichen ankommt, hat diesen
 * Weg nicht genommen.
 *
 * Die **Länge** bleibt großzügig: Ein zu langer Name wird von
 * `shortenEmailDisplayName` in der Mitte gekürzt und nicht abgewiesen
 * (A-19.23b, siehe {@link ADDIN_ATTACHMENT_NAME_MAX_LENGTH}).
 */
const attachmentDisplayName = z
  .string()
  .trim()
  .min(1)
  .max(ADDIN_ATTACHMENT_NAME_MAX_LENGTH)
  .refine((value) => !hasForbiddenNameCharacter(value), {
    message: FORBIDDEN_NAME_CHARACTER_MESSAGE,
  });
const attachmentBase64 = z.string().min(1).max(ADDIN_ATTACHMENT_BASE64_MAX_LENGTH);

const emailAttachmentItemSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('message'),
    displayName: attachmentDisplayName,
    contentBase64: attachmentBase64,
    rebuilt: z.boolean(),
  }),
  z.object({
    kind: z.literal('file'),
    displayName: attachmentDisplayName,
    contentBase64: attachmentBase64,
  }),
  z.object({
    kind: z.literal('link'),
    displayName: attachmentDisplayName,
    url: attachmentUrlSchema,
  }),
]);

/**
 * Der Umschlag: **eine** E-Mail, ihr Absender und ihre Anhänge.
 *
 * Warum ein Umschlag und nicht eine nackte Liste: Der Absender gehört der
 * **Nachricht** und nicht einem einzelnen Anhang. Ihn an jeden Eintrag zu
 * schreiben hieße zuzulassen, daß zwei Anhänge derselben Anfrage zwei
 * verschiedene Herkünfte behaupten — und die Rückfrage vor dem Öffnen läse eine
 * davon vor.
 *
 * **Keine Todo-Kennung im Rumpf.** Nicht hier und nicht im Eintrag. Welches
 * Todo die Anhänge bekommt, bestimmt allein die Route, die diesen Umschlag
 * liest: `POST /addin/todos` das Todo, das dieselbe Anfrage anlegt;
 * `POST /addin/todos/{todoId}/mails` das Todo aus dem **Pfad**, und auch das
 * nur bei gleicher gültiger Call-Nummer (A-10.11 bis A-10.13, E-134 Punkt 3).
 */
export const emailAttachmentsSchema = z.object({
  sender: z.string().max(ADDIN_ATTACHMENT_SENDER_MAX_LENGTH).nullable().default(null),
  items: z.array(emailAttachmentItemSchema).max(ADDIN_ATTACHMENTS_MAX).default([]),
});

// Every cap here and on `note`, `tagIds`, `tagNames` is a domain name, never a number: the archive
// import and the task pane read the same values (T-398b, measured by `proof:addin`).
export const mailMetadataSchema = z.object({
  identity: z.string().min(1).max(MAIL_IDENTITY_MAX_LENGTH),
  subject: z.string().max(MAIL_SUBJECT_MAX_LENGTH),
  sender: z.string().max(MAIL_SENDER_MAX_LENGTH),
  receivedAt: z.string().datetime({ offset: true }).nullable(),
  internetMessageId: z.string().max(MAIL_MESSAGE_ID_MAX_LENGTH).nullable(),
  outlookLink: attachmentUrlSchema.nullable(),
  excerpt: z.string().max(MAIL_EXCERPT_MAX_LENGTH).nullable(),
}).strict();

export const appendMailSchema = z.object({
  requestId: id,
  callNumber: z.string().min(1).max(ADDIN_CALL_NUMBER_MAX_LENGTH),
  mail: mailMetadataSchema,
  note: z.string().max(MAIL_NOTE_MAX_LENGTH).default(''),
  attachments: emailAttachmentsSchema.nullable().default(null),
}).strict();

export const createTodoSchema = z.object({
  /**
   * Der Titel — **dasselbe Schema wie `POST /todos`** (T-114, Befund T-112-1).
   *
   * ---------------------------------------------------------------------------
   * Was hier fehlte
   * ---------------------------------------------------------------------------
   *
   * Bis T-114 stand hier `z.string().trim().min(1).max(512)`. Das sagt nichts
   * über Steuerzeichen und nichts über die bidirektionalen
   * Formatierungszeichen.
   *
   * **Welche Zeichen das sind, steht hier nicht** — sie stehen seit T-122 als
   * `FORBIDDEN_NAME_CHARACTERS` in `packages/domain/src/characters.ts`, und
   * `titleSchema` liest sie dort. Diese Zeilen haben sie bis T-123 aufgezählt
   * und dabei genau den Fehler wiederholt, gegen den sie geschrieben sind: Als
   * T-117 die Klasse um drei Richtungsmarken erweiterte, blieb die Aufzählung
   * stehen und beschrieb die Tür zwei Wellen lang falsch (T-119 R1, E-063
   * Punkt 4). Eine Beschreibung, die eine Regel nachzeichnet, ist eine
   * Abschrift wie jede andere; sie kann nur nicht rot werden.
   *
   * **Die Fachregel schließt die Lücke nicht.** `checkName` in `@takt/domain`
   * normalisiert nach NFC und zieht Leerraum zusammen — seine Menge
   * `WHITESPACE` ist eine andere und für einen anderen Zweck gedacht: Sie sagt,
   * was als Trennung zwischen zwei Wörtern gilt, und nicht, was in einem Namen
   * nichts zu suchen hat. Beide überschneiden sich (der Leerraum aus C0), und
   * keine ist in der anderen enthalten. Wer sich auf `checkName` verlässt,
   * verlässt sich auf eine Prüfung, die eine andere Frage beantwortet.
   *
   * ---------------------------------------------------------------------------
   * Warum es ausgerechnet an dieser Tür zählt
   * ---------------------------------------------------------------------------
   *
   * An der Hauptfläche gilt „nur wer das Sitzungsgeheimnis hat, tippt einen
   * Titel". Hier gilt der Satz nicht: Der Titel ist im Aufgabenbereich mit dem
   * **Betreff der E-Mail** vorbelegt (`TaskPane.tsx`, `suggestTitle`) und
   * stammt damit von Akteur A-06. Eine Handlung des Benutzers genügt, und der
   * Weg endet nicht in der Anzeige — `todo.title` ist eine zulässige
   * Feldquelle einer Exportvorlage (`packages/export/src/sources.ts`).
   *
   * ---------------------------------------------------------------------------
   * Der Deckel sinkt dabei von 512 auf 500, und das ist kein Beiwerk
   * ---------------------------------------------------------------------------
   *
   * `titleSchema` trägt 500, `POST /todos` und `PATCH /todos/{todoId}` tragen
   * dieselbe Zahl. Ein hier mit 512 Zeichen angelegtes Todo war in der
   * Hauptanwendung **nicht mehr speicherbar**: Der Änderungsdialog schickt den
   * Titel mit, und `titleSchema.optional()` weist ihn ab. Der Benutzer sah
   * seinen eigenen, unveränderten Titel als unzulässige Eingabe — dieselbe
   * Sackgasse aus derselben Ursache wie oben, nur über die Länge statt über
   * ein Zeichen. Zwölf Zeichen kosten das nicht wert; ein Betreff, der sie
   * braucht, ist kein Titel mehr.
   *
   * Das Add-in kürzt seinen Vorschlag auf denselben Wert (`suggestTitle`),
   * und der Nachweispfad hält beide Zahlen gegeneinander.
   */
  title: titleSchema,
  requestId: id.optional(),
  mail: mailMetadataSchema.optional(),
  /**
   * Diese Tür legt an — **mehr kennt sie nicht** (E-134 Punkt 2, T-409b-2).
   *
   * Bis T-398c stand hier `['auto', 'new']`. `auto` suchte im Dienst selbst
   * nach einem Todo mit derselben Call-Nummer und hängte die E-Mail samt ihren
   * Dateien dort an — **ohne Auswahl des Benutzers**, an einer Aufgabe, deren
   * Nummer bloß im Text einer fremden Mail stand. Sein einziger Aufrufer war
   * der abgelöste Schnellbefehl (A-10.17). Wer eine vorhandene Aufgabe meint,
   * benennt sie im Pfad von `POST /addin/todos/{todoId}/mails`, nachdem er sie
   * gesehen hat (A-10.11, A-10.16).
   *
   * Das Feld bleibt mit einem einzigen Wert stehen, weil die Beschreibung es
   * führt und ein Aufrufer es weiterhin mitschicken darf.
   */
  mode: z.enum(['new']).default('new'),
  dueTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/).nullable().default(null),
  estimateMinutes: z.number().int().min(1).max(525600).nullable().default(null),
  callNumber: z.string().max(ADDIN_CALL_NUMBER_MAX_LENGTH).nullable().default(null),
  statusId: id.nullable().default(null),
  tagIds: z.array(id).max(TODO_TAG_IDS_MAX).default([]),
  /**
   * Tags über ihren **Namen** statt über eine Kennung (T-058, T-061).
   *
   * ---------------------------------------------------------------------------
   * Es ist **dasselbe** Schema, nicht ein zeichengleiches (T-114)
   * ---------------------------------------------------------------------------
   *
   * Hier stand bis T-114 `z.string().trim().min(1).max(MAX_TAG_NAME_LENGTH)`
   * und darüber der Satz, dieser Wortlaut sei zeichengleich dem `nameSchema`
   * aus `features/todos/routes.ts`, „damit die Hauptanwendung und das Add-in
   * dieselbe Eingabe annehmen und dieselbe abweisen".
   *
   * **Seit T-101 war dieser Satz falsch.** `nameSchema` weist seither Steuer-
   * und Richtungszeichen ab, diese Abschrift nicht — und der Kommentar sagte
   * dem nächsten Leser ausdrücklich, er brauche nicht nachzusehen. Genau das
   * ist der teure Teil einer Zusicherung, die nicht mehr stimmt.
   *
   * Der Wortlaut kann jetzt nicht mehr auseinanderlaufen, weil es keinen
   * zweiten gibt. Was `nameSchema` heute und morgen abweist, weist diese Route
   * mit ab.
   *
   * `MAX_TAG_NAME_LENGTH` aus der Domäne steht damit nicht mehr in dieser
   * Datei; die Zahl kommt aus `nameSchema` wie an der Hauptfläche auch. Dass
   * beide Zahlen dieselbe sind, prüft der Nachweispfad
   * (`apps/outlook-addin/scripts/proof-addin.mjs`, Abschnitt 16) — eine
   * Ungleichheit soll rot werden und nicht in einem Kommentar behauptet
   * bleiben.
   *
   * **Das Schema ist der Transportdeckel, nicht die Fachregel.** Wann ein Name
   * zulässig ist und wann zwei Namen derselbe sind, sagt `checkTagNames` in
   * `@takt/domain`; es läuft in `service.ts`, nachdem dieses Schema gegriffen
   * hat. Der Unterschied ist derselbe wie bei `callNumber` weiter oben und aus
   * demselben Grund ausgeschrieben — und die Aufgabenteilung ist der Grund,
   * warum die Zeichenprüfung **hier** stehen muss: `checkTagNames` prüft die
   * Gleichheit von Namen, nicht ihre Unbedenklichkeit in einer Anzeige.
   */
  tagNames: z.array(nameSchema).max(TODO_TAG_NAMES_MAX).default([]),
  /**
   * Der interne Vermerk — **bewusst ohne die Zeichenprüfung von oben**
   * (T-114 Punkt 4).
   *
   * Das ist keine vergessene Zeile, sondern dieselbe Grenze, die
   * `http/input.ts` zwischen `nameSchema` und `textSchema` zieht, und sie
   * verläuft entlang des Zwecks:
   *
   *  - Ein **Name** wird in fremde Sätze eingesetzt — in eine Aufzählung, in
   *    eine Überschrift, in eine Zeile neben anderen Namen. Dort entscheidet
   *    ein einzelnes Richtungszeichen darüber, was der Leser sieht.
   *  - Ein **Vermerk** wird als eigener Absatz gezeigt. Er ist Text des
   *    Benutzers beziehungsweise übernommener Text einer E-Mail, und ein Feld,
   *    aus dem Zeichen entfernt oder wegen derer die Eingabe abgewiesen würde,
   *    änderte oder verhinderte genau das, wofür es da ist.
   *
   * Der Vermerk verlässt den Dienst außerdem **nicht** über den Export: Er ist
   * die interne Notiz (A-7.2) und in `packages/export/src/sources.ts` keine
   * zulässige Feldquelle. Der Titel ist eine — das ist der Unterschied, der
   * die Prüfung dort nötig macht und hier nicht.
   */
  note: z.string().max(MAIL_NOTE_MAX_LENGTH).default(''),
  /**
   * Die **Frist** (A-19.21, E-074 Punkt 3 und 4, T-149).
   *
   * ---------------------------------------------------------------------------
   * Sie wird eingetragen, nicht erkannt
   * ---------------------------------------------------------------------------
   *
   * Das ist der Unterschied zur `callNumber` eine Bildschirmhöhe weiter oben,
   * und er ist der Kern von E-074 Punkt 4. Die Call-Nummer kommt aus einem
   * regulären Ausdruck über dem **Text der E-Mail** und damit von Akteur A-06;
   * die Frist kommt aus einem Feld, das der Benutzer im Aufgabenbereich
   * ausfüllt. Es gibt kein Muster, das sie aus einem Betreff liest, und es
   * soll keines geben: „bis Freitag" in einer fremden E-Mail ist eine
   * Behauptung des Absenders über den Kalender des Empfängers.
   *
   * Geprüft wird sie trotzdem wie jedes andere Feld dieser Tür. Ein Feld im
   * Aufgabenbereich ist keine Zusicherung über das, was hier ankommt — der
   * Aufgabenbereich ist ein Browsersteuerelement, und diese Route hört auf
   * `127.0.0.1`.
   *
   * ---------------------------------------------------------------------------
   * Warum `.default(null)` und nicht `.optional()`
   * ---------------------------------------------------------------------------
   *
   * An der Haupttür stehen zwei Schemata nebeneinander: `createSchema` faßt
   * „fehlt" und `null` zusammen, `updateSchema` hält sie auseinander, weil
   * `null` dort **entfernen** heißt (A-19.3). Diese Tür kennt das Ändern
   * nicht — sie legt an, mehr nicht. Es gibt hier also nur zwei
   * Zustände, und `.default(null)` schreibt das einmal hin, statt es an der
   * Aufrufstelle mit `?? null` nachzuholen. Derselbe Handgriff wie bei
   * `callNumber` und `statusId` darüber.
   *
   * Der **Wert** der Prüfung steht in `dueDateSchema` und nicht hier: Form
   * `JJJJ-MM-TT`, Jahr zwischen 1970 und 2999 und ein Tag, den es wirklich
   * gibt. `2026-02-30` besteht die Form und wird abgewiesen; eine Uhrzeit und
   * ein Zeitzonenanhang ebenso.
   *
   * ---------------------------------------------------------------------------
   * Was neben ihr steht — und was daran **nicht** möglich ist
   * ---------------------------------------------------------------------------
   *
   * Seit E-108 steht neben ihr {@link createTodoSchema.attachments}. Der
   * Unterschied zwischen beiden bleibt trotzdem der aus E-074 Punkt 3: Eine
   * Frist ist ein Tag, den die Anwendung **anzeigt**; ein Anhang ist eine
   * Adresse, die sie auf Klick **öffnet** (R-21, R-22). Deshalb ist die Frist
   * ein Feld mit einer Formprüfung, und der Anhang ist eine ganze Datei mit
   * eigener Herkunft, eigenem Deckel und eigener Rückfrage.
   *
   * **Und was mit ihm an dieser Tür nicht möglich ist: ein vorhandenes Todo
   * treffen.** Sie führt kein Feld, das eines benennt; das Ergänzen läuft über
   * `POST /addin/todos/{todoId}/mails` und dort über den Pfad (A-10.11).
   */
  dueDate: dueDateSchema.default(null),
  /**
   * Die **Anhänge aus der geöffneten E-Mail** (A-19.22 bis A-19.33, E-108).
   *
   * ---------------------------------------------------------------------------
   * Warum sie im Rumpf des Anlegens fahren und nicht in einer zweiten Anfrage
   * ---------------------------------------------------------------------------
   *
   * Weil das Anlegen eines Todos und die Übernahme seiner Anhänge **eine**
   * Handlung sind: Scheitert eines von beidem, steht nichts halb da. Eine
   * zweite Anfrage nach dem Anlegen könnte ausbleiben, und der Benutzer stünde
   * vor einem Todo ohne die Dateien, die er gerade eingesammelt hat.
   *
   * An ein **vorhandenes** Todo hängt diese Tür nichts; dafür gibt es die eine
   * enge Zuordnung `POST /addin/todos/{todoId}/mails` (A-10.11, A-10.12).
   *
   * Ein `null` und eine leere Liste sind hier dasselbe wie „ohne Anhänge"; der
   * Anlegevorgang selbst ändert sich dadurch in keiner Weise.
   *
   * ---------------------------------------------------------------------------
   * Das Feld wird **gelesen**, und das ist der Unterschied zu gestern
   * ---------------------------------------------------------------------------
   *
   * Bis T-304 stand hier der Satz, ein mitgeschicktes `attachments` falle in
   * zod still weg. Das stimmte — `z.object` streicht unbekannte Schlüssel —,
   * und genau deshalb hat der Aufgabenbereich bis dahin **nichts** mitgeschickt
   * (`ATTACHMENTS_TRAVEL_WITH_CREATE`). Ein Feld, das gesendet und stillschweigend
   * gestrichen wird, ist der Ausfall, den A-19.31 ausschließt: Der
   * Aufgabenbereich hätte „3 Anhänge hängen daran" gemeldet, und es hinge
   * keiner daran.
   *
   * Die Reihenfolge war deshalb: erst die Tür liest das Feld, dann fährt es
   * mit. `proof:addin` Abschnitt 22 hält beides gegeneinander und wird rot, wer
   * es andersherum tut.
   *
   * Die Rumpfgrenze dieser einen Route liegt bei 64 MB
   * (`ADDIN_ATTACHMENT_MAX_BODY_BYTES`, `config.ts`); jede andere Route des
   * Dienstes bleibt bei 1 MB.
   */
  attachments: emailAttachmentsSchema.nullable().default(null),
});

// The add-in booking door (`bookSchema`) fell with E-120: A-10.12 and A-10.16 leave no time booking in the add-in.

export type CreateTodoBody = z.infer<typeof createTodoSchema>;

/**
 * Die Rumpfschemata dieser Tür, nach `operationId` der OpenAPI-Beschreibung
 * (O-BB, T-149).
 *
 * ---------------------------------------------------------------------------
 * Warum die Zuordnung hier steht und nicht im Nachweispfad
 * ---------------------------------------------------------------------------
 *
 * `scripts/proof-openapi.mjs` hält jedes Rumpfschema des Dienstes gegen das,
 * was die Beschreibung über denselben Rumpf behauptet — Feldnamen,
 * Pflichtfelder, Obergrenzen. Die vier Türen der Hauptfläche
 * (`features/todos/routes.ts`, `features/structure/routes.ts`,
 * `features/timer/routes.ts`, `features/export/routes.ts`) führen dafür je
 * eine Aufstellung `REQUEST_SCHEMAS` **neben ihren Routen**. Der Grund steht
 * dort ausgeschrieben: Wer eine Route mit Rumpf hinzufügt, sieht die Zuordnung
 * neben seiner Arbeit und nicht in einem Skript, von dem er nichts weiß.
 *
 * Diese Tür war bis T-149 die Ausnahme. Ihre beiden Schemata standen als zwei
 * einzelne Importe im Nachweispfad selbst, mit dem Vermerk „liegt in fremder
 * Hoheit und führt kein `REQUEST_SCHEMAS`" — die Hoheitsgrenze aus E-053 war
 * zur Begründung einer Sonderform geworden. Das ist genau die Stelle, an der
 * eine neue Add-in-Route mit Rumpf unbemerkt bliebe: Sie entstünde in **dieser**
 * Datei, und der Eintrag, der sie messbar macht, läge in einer, die ihr
 * Verfasser nicht anfaßt.
 *
 * Die Aufstellung ist deshalb weder eine Bequemlichkeit noch eine Doppelung —
 * sie ist die Wache. Ein Schlüssel ohne Gegenstück in der Beschreibung und
 * eine beschriebene Route ohne Schlüssel machen den Lauf rot.
 *
 * **Wer sie liest.** `apps/outlook-addin/scripts/proof-addin.mjs` Abschnitt 18
 * hält diese Aufstellung gegen den Add-in-Abschnitt der Beschreibung, in
 * beiden Richtungen, und prüft dabei ausdrücklich, dass die Einträge
 * **dieselben** Objekte sind, die die Route benutzt.
 *
 * `apps/local-api/scripts/proof-openapi.mjs` führte daneben eine Weile zwei
 * Einzelimporte derselben beiden Schemata, mit einem Vermerk („liegen in
 * fremder Hoheit und führen kein `REQUEST_SCHEMAS`"), der seit T-149 nicht
 * mehr stimmte. `scripts/` gehört domain-dev (E-053); der Austausch war als
 * Abweichung gemeldet (O-CE) und ist mit T-159 geschehen — dort steht jetzt
 * `...ADDIN_SCHEMAS` aus **dieser** Datei. Beide Nachweispfade lesen damit
 * dieselbe Aufstellung, und die Wache oben hängt trotzdem an keiner fremden
 * Datei: Sie wäre auch dann rot, wenn `proof:openapi` seine Einzelimporte
 * behalten hätte. (Nachgemessen in T-239.)
 */
export const REQUEST_SCHEMAS = Object.freeze({
  createAddinTodo: createTodoSchema,
  appendAddinMail: appendMailSchema,
});

export interface FieldIssue {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

/**
 * Übersetzt Zod-Befunde in die `details` der Fehlerhülle.
 *
 * Der Text der Bibliothek ist englisch; die Meldung, die der Benutzer liest,
 * kommt aus der Oberfläche. Was hier hinausgeht, ist der technische Schlüssel
 * und der Feldname (`code`, `field`) — die einzigen beiden Größen, gegen die
 * ein Aufrufer verzweigen darf.
 */
export const toFieldIssues = (error: z.ZodError): readonly FieldIssue[] =>
  error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
    code: issue.code,
  }));