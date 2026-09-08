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
 * zeichengleich der aus `routes/todos.ts`. Seit T-101 stimmte das nicht mehr:
 * Dort kam die Prüfung auf Steuer- und Richtungszeichen hinzu, hier nicht.
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
import { dueDateSchema, nameSchema, titleSchema } from '../../http/input.ts';

/** UUID Fassung 7, wie `Id` in der OpenAPI-Beschreibung. */
const id = z.string().uuid();

/** `YYYY-MM-DDTHH:MM:SSZ`, wie `Timestamp` in der Domäne. */
const timestamp = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

/**
 * Der interne Vermerk aus der E-Mail (A-7.1, B-12.3 Punkt 3).
 *
 * Enger als an der Tür der Hauptanwendung, wo `textSchema` gilt. Der Vorschlag
 * stammt aus B-12.3 Punkt 3: Was aus einer E-Mail übernommen wird, soll der
 * Kontext sein und nicht ein ganzer Zitatverlauf. Wer mehr braucht, schreibt es
 * in der Hauptanwendung dazu.
 *
 * **Die Gegenzahl steht bis heute im Add-in** als `MAX_TAKEOVER_CHARACTERS`
 * (`apps/outlook-addin/src/office/mail.ts`), und sie muss dieselbe sein: Der
 * Knopf „Inhalt der E-Mail übernehmen" füllt das Feld, bevor der Benutzer es
 * gelesen hat. Kürzte das Add-in großzügiger, als diese Zeile annimmt, bekäme
 * er ein 422 für einen Text, den nicht er geschrieben hat — dieselbe Sackgasse
 * wie bei der Titellänge vor T-114. Auflösen lässt sich das nur in
 * `@takt/domain`, weil ein Browserbündel `@takt/local-api` nicht einbinden darf;
 * T-134 meldet es, statt es halb zu tun. Bis dahin hält
 * `apps/outlook-addin/scripts/proof-addin.mjs` Abschnitt 16 beide Seiten
 * gegeneinander — ein Vergleich, der den Schaden bewacht und nicht die Ursache
 * (E-063 Punkt 5), aber einer, der rot wird.
 *
 * **Der Wortlaut hier nannte bis T-134 „65536" als Zahl der Hauptanwendung.**
 * Sie war seit langem falsch — `textSchema` nimmt weniger —, und sie war es
 * unbemerkt, weil eine Beschreibung, die eine fremde Zahl abschreibt, dieselbe
 * Abschrift ist wie eine im Quelltext, nur ohne die Möglichkeit, rot zu werden
 * (E-063 Punkt 5). Sie zeigt jetzt auf den Namen statt auf einen Wert.
 */
export const ADDIN_NOTE_MAX_LENGTH = 4000;

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

/**
 * Wie viele **Kennungen** eine Anfrage höchstens mitgeben darf (T-058, T-134).
 *
 * Bis T-134 stand die Zahl als `.max(200)` mitten im Schema, ohne Namen und
 * ohne Grund — und ohne einen Hinweis darauf, dass sie nicht allein steht.
 *
 * **Sie steht an zwei Türen.** `routes/todos.ts` führt dieselbe Zahl an
 * `createSchema` und an `updateSchema`; es ist dieselbe Wahrheit („wie viele
 * Tags darf ein Todo in einer Anfrage bekommen") und nicht bloß derselbe Wert.
 * Aufgelöst ist sie damit **nicht**: Der andere Weg liegt außerhalb dieser Datei
 * (E-053), und eine halb umgestellte Zahl ist schlechter als eine ganz
 * doppelte — sie sieht aus wie erledigt. T-134 gibt ihr deshalb hier einen
 * Namen, meldet die zweite Tür und lässt sie messen
 * (`apps/outlook-addin/scripts/proof-addin.mjs` Abschnitt 16): Laufen die beiden
 * Türen auseinander, wird der Lauf rot, statt dass ein Kommentar es hofft.
 *
 * Warum überhaupt eine Grenze: Ohne sie nimmt die Tür eine Liste beliebiger
 * Länge entgegen und legt sie in eine Transaktion. Warum 200 und nicht 50 wie
 * bei den Namen, steht eine Zeile weiter unten.
 */
export const ADDIN_TAG_IDS_MAX = 200;

/**
 * Wie viele **Namen** eine Anfrage höchstens benennen darf (T-058, T-061).
 *
 * Dieselbe Zahl wie in `routes/todos.ts`, und aus demselben Grund: Kennungen
 * kommen aus einer Auswahl, Namen aus einem Eingabefeld. Fünfzig neue Tags in
 * einer Anfrage sind kein Arbeitsablauf, sondern ein Skript. Zwei verschiedene
 * Zahlen an den beiden Wegen wären die Art Unterschied, die niemand bemerkt,
 * bis eine Anfrage über den einen Weg durchgeht und über den anderen nicht.
 *
 * Dieser Satz war bis T-134 eine Zusicherung, die niemand ausführt — genau die
 * Bauart, an der T-114 gescheitert ist. Seither hält Abschnitt 16 des
 * Add-in-Nachweises beide Türen gegeneinander, für `tagIds` wie für `tagNames`.
 */
export const ADDIN_TAG_NAMES_MAX = 50;

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
  callNumber: z.string().max(ADDIN_CALL_NUMBER_MAX_LENGTH).nullable().default(null),
  statusId: id.nullable().default(null),
  tagIds: z.array(id).max(ADDIN_TAG_IDS_MAX).default([]),
  /**
   * Tags über ihren **Namen** statt über eine Kennung (T-058, T-061).
   *
   * ---------------------------------------------------------------------------
   * Es ist **dasselbe** Schema, nicht ein zeichengleiches (T-114)
   * ---------------------------------------------------------------------------
   *
   * Hier stand bis T-114 `z.string().trim().min(1).max(MAX_TAG_NAME_LENGTH)`
   * und darüber der Satz, dieser Wortlaut sei zeichengleich dem `nameSchema`
   * aus `routes/todos.ts`, „damit die Hauptanwendung und das Add-in dieselbe
   * Eingabe annehmen und dieselbe abweisen".
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
  tagNames: z.array(nameSchema).max(ADDIN_TAG_NAMES_MAX).default([]),
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
  note: z.string().max(ADDIN_NOTE_MAX_LENGTH).default(''),
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
   * nicht — sie legt an und bucht, mehr nicht. Es gibt hier also nur zwei
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
   * Was an dieser Stelle **nicht** dazukommt
   * ---------------------------------------------------------------------------
   *
   * Ein Anhang. A-19.19 bleibt unangetastet, und zwar strukturell: Diese Tür
   * hat kein Anhangsfeld, und Anhänge hängen als Unterressource unter
   * `/api/v1/todos/{todoId}/attachments` — außerhalb von `/addin` und für das
   * Add-in-Token unerreichbar (A-A-21). Der Unterschied ist Art und nicht
   * Vorsicht (E-074 Punkt 3): Eine Frist ist ein Tag, den die Anwendung
   * **anzeigt**; ein Anhang ist eine Adresse, die sie auf Klick **öffnet**
   * (R-21, R-22). Ein `attachments` im Rumpf dieser Anfrage fällt in zod
   * still weg — gemessen wird das trotzdem, und zwar an der Wirkung
   * (`proof:addin` Abschnitt 18: null Zeilen in `todo_attachment`).
   */
  dueDate: dueDateSchema.default(null),
});

/**
 * Die **Leistung** einer Buchung aus dem Aufgabenbereich (A-7.3, A-7.4).
 *
 * ---------------------------------------------------------------------------
 * Gleiche Zahl, andere Bedeutung — und deshalb ein eigener Name (T-134)
 * ---------------------------------------------------------------------------
 *
 * Bis T-134 stand hier `z.string().max(4000)` als nackte Zahl, zwei Bildschirme
 * unter `ADDIN_NOTE_MAX_LENGTH`, das denselben Wert trägt. Von außen sah das aus
 * wie eine Doppelung innerhalb einer Datei; nachgesehen ist es **keine**:
 *
 * | | `ADDIN_NOTE_MAX_LENGTH` | diese Zahl |
 * |---|---|---|
 * | Feld | der interne Vermerk des Todos (A-7.1) | die Leistung der Buchung (A-7.3) |
 * | Herkunft des Textes | vorbelegt aus der E-Mail (B-12.3) | getippt im Aufgabenbereich |
 * | Weg nach draußen | keiner — nie im Export (A-7.2) | **in die Abrechnungsdatei** (A-7.4) |
 * | Grund für die Grenze | B-12.3 Punkt 3: kein Zitatverlauf | keiner, der aufgeschrieben wäre |
 *
 * Die beiden Zahlen zusammenzulegen hieße zu behaupten, ein übernommener
 * E-Mail-Kontext und eine abgerechnete Leistung seien dieselbe Sache und
 * änderten sich gemeinsam. Sie sind es nicht: Fiele die Grenze des Vermerks
 * morgen aus B-12.3-Gründen auf 2000, hätte das mit der Leistung nichts zu tun.
 * Gleiche Zahl ist nicht gleiche Bedeutung — deshalb steht sie hier mit eigenem
 * Namen und eigenem Grund, statt in einer gemeinsamen Konstante zu verschwinden.
 *
 * ---------------------------------------------------------------------------
 * Ihr wirklicher Namensvetter ist ein anderer — und er sagt etwas anderes
 * ---------------------------------------------------------------------------
 *
 * Dieselbe Spalte wird über die Hauptanwendung mit `textSchema` gefüllt
 * (`POST /time-entries`, `PATCH /time-entries/{id}`, der Stopp des Timers), und
 * `textSchema` nimmt **mehr** an als diese Zeile. Dieselbe Leistung geht also
 * über den einen Weg durch und über den anderen nicht — dieselbe Bauart wie der
 * Befund C-03, nur an einem Freitextfeld statt an einem Titel.
 *
 * Eine Sackgasse ist es heute nicht: Der Aufgabenbereich belegt dieses Feld
 * nicht vor (anders als den Vermerk), und er bearbeitet keine bestehende
 * Buchung — abgewiesen würde nur ein Text, den der Benutzer selbst getippt hat,
 * und das ist der zulässige Fall (B-4.3). Die Entscheidung, ob die Add-in-Tür
 * enger bleiben **soll** als die der Hauptanwendung, ist trotzdem eine
 * Entscheidung und keine Aufräumarbeit: Sie ändert eine Zusage der Schnittstelle
 * und gehört deshalb nach `decisions.md` und nicht in diese Zeile. T-134 meldet
 * sie als offene Frage und lässt den engeren Deckel bis dahin stehen — mit
 * diesem Grund an Ort und Stelle statt ohne einen.
 */
export const ADDIN_BOOKING_NOTE_MAX_LENGTH = 4000;

export const bookSchema = z.object({
  startedAt: timestamp,
  endedAt: timestamp,
  /**
   * Die Leistung. Sie geht in die Abrechnung (A-7.4) und ist deshalb hier —
   * anders als der Vermerk — nicht das Feld, in das E-Mail-Text vorbelegt wird.
   *
   * Auch sie trägt die Zeichenprüfung der Namen **nicht**, und aus demselben
   * Grund wie der Vermerk: Sie ist Freitext des Benutzers, kein Name. Sie
   * stammt zudem als einziges Feld dieser Tür ausschließlich aus dem
   * Eingabefeld des Aufgabenbereichs und nicht aus der E-Mail (T-114 Punkt 4).
   *
   * Warum ihr Deckel {@link ADDIN_BOOKING_NOTE_MAX_LENGTH} heißt und nicht
   * {@link ADDIN_NOTE_MAX_LENGTH}, obwohl beide heute dieselbe Zahl tragen,
   * steht an der Konstante.
   */
  note: z.string().max(ADDIN_BOOKING_NOTE_MAX_LENGTH).default(''),
});

/*
 * Hier stand bis T-038 `reopenIfDone: z.boolean().default(false)`.
 *
 * Seit T-038 hebt eine Buchung „Erledigt" automatisch auf (A-2.5); es gibt
 * nichts mehr zu wählen. Das Feld ist deshalb **ersatzlos** weg und steht
 * bewusst nicht als „wird ignoriert" im Schema: Ein Feld, das man schicken
 * darf und das nichts tut, ist eine Zusage, die niemand einlöst.
 *
 * Ein Aufrufer, der es weiterhin mitschickt, bekommt **kein** 422. Zod wirft
 * unbekannte Schlüssel still weg, und das ist hier die richtige Reihenfolge:
 * Ein `reopenIfDone: false` von einem älteren Aufrufer soll die Aufhebung
 * nicht verhindern — es kann sie nicht verhindern —, und ein 422 an dieser
 * Stelle würde eine Buchung scheitern lassen, die fachlich vollständig ist.
 * Was wirklich geschehen ist, sagt die Antwort (`doneCleared`, `poolMovement`)
 * und nicht die Anfrage.
 */

export type CreateTodoBody = z.infer<typeof createTodoSchema>;
export type BookBody = z.infer<typeof bookSchema>;

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
 * (`routes/todos.ts`, `structure.ts`, `time.ts`, `export.ts`) führen dafür je
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
  createAddinTimeEntry: bookSchema,
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
