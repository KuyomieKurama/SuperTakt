import { INDIRECT_EXTENSIONS, attachmentLabel as domainAttachmentLabel } from "@takt/domain";
import type { Attachment, AttachmentKind, ForeignText } from "../api/types";

/**
 * Takt — die Bezeichnung eines Anhangs und die Wörter der Rückfrage
 * (A-19.12, E-072 Punkt 3).
 *
 * ---------------------------------------------------------------------------
 * A-19.12 ist wörtlich zu nehmen: **nie eine leere Zeile**
 * ---------------------------------------------------------------------------
 *
 * „Bei Verweis und Datei steht der Titel als Bezeichnung; fehlt er, steht dort
 * etwas Lesbares aus Adresse beziehungsweise Pfad und nie eine leere Zeile."
 * Jede Funktion hier endet deshalb im Zweifel beim **vollen Wert** und nie bei
 * einer leeren Zeichenkette.
 *
 * ---------------------------------------------------------------------------
 * Die Beschriftung selbst steht **nicht** hier (T-157, Befund O-CR)
 * ---------------------------------------------------------------------------
 *
 * Bis T-156 stand {@link attachmentLabel} zweimal im Baum: einmal hier, einmal
 * in `packages/domain/src/attachment.ts` — und die beiden **antworteten
 * verschieden**. Ohne Titel lieferte die Domäne den Wirtsnamen
 * (`beispiel.example`), diese Datei alles hinter dem Schema
 * (`beispiel.example/Seite`); bei leerem Ziel sagte die eine
 * `Verweis`/`Datei`/`Bild`, die andere `Ohne Bezeichnung`. Die maßgebliche
 * Fassung war dabei die tote: Sie hatte keinen Aufrufer außer ihrem eigenen
 * Prüffall.
 *
 * Seither ruft die Oberfläche die Domäne. Was hier bleibt, ist der **Übergang**
 * — die Zeichenketten dieser Oberfläche hinein, `ForeignText` heraus —, genau
 * die Bauart, die `lib/deadline.ts` für `dueState` schon vormacht. Wer die
 * Beschriftung ändern will, ändert sie **dort**; eine zweite Fassung hier wäre
 * derselbe Fund noch einmal.
 *
 * ---------------------------------------------------------------------------
 * Warum die Wörter der Rückfrage trotzdem hier zerlegen
 * ---------------------------------------------------------------------------
 *
 * {@link fileNameOf}, {@link extensionOf} und {@link runsWhenOpened} sind keine
 * Beschriftung, sondern die **Wortwahl der Rückfrage vor einem Programmstart**.
 * Sie bleiben deshalb in der Oberfläche — und sie treffen ausdrücklich keine
 * Aussage darüber, ob der Wert eine gültige Adresse oder ein gültiger Pfad ist.
 * Die trifft die Hülle, beim Öffnen, bei jedem Aufruf.
 *
 * ---------------------------------------------------------------------------
 * Und was hier **keine** Grenze ist — bitte vor dem Aufräumen lesen
 * ---------------------------------------------------------------------------
 *
 * {@link runsWhenOpened} ist eine Liste von Endungen. Sie ist **keine
 * Sicherheitsprüfung** und darf nicht als eine gelesen werden: `PATHEXT` ist
 * unter Windows benutzerbestimmt, die Menge startbarer Endungen damit nicht
 * fest, und eine Liste, die blockiert, lehrt das Umbenennen (Bedrohungsmodell
 * 20.1). Sie entscheidet ausschließlich über **Wörter**: ob die Rückfrage
 * „Öffnen" oder „Ausführen" sagt und welchen Folgesatz sie trägt. Ein fester
 * Satz ist der, den man nach dem dritten Mal nicht mehr liest; ein wechselnder
 * wird gelesen, weil er sich ändert.
 *
 * **Daraus folgt eine Sache, die schon einmal fast passiert wäre** (Befund
 * O-CA): Wer diese Liste für die Grenze hält, hält die harte Abweisung in
 * `apps/desktop/src-tauri/src/attachment.rs` für eine Verdopplung und entfernt
 * sie. Das wäre der Ausbau der **einzigen** Kontrolle zwischen einer
 * Zeichenkette aus dem Bestand und `ShellExecuteW`. Die Liste hier ändert
 * Wörter; jene Datei ändert, ob überhaupt etwas geöffnet wird. Sie sind nicht
 * dasselbe, sie sind nicht austauschbar, und keine der beiden ersetzt die
 * andere. Wandert diese Datei eines Tages in ein anderes Paket, wandert dieser
 * Absatz mit.
 *
 * Die **fünf Umleitungen** (`.lnk`, `.url`, `.pif`, `.scf`, `.desktop`) stehen
 * hier bewusst **nicht**: Sie werden in `src-tauri/src/attachment.rs` hart
 * abgewiesen und erreichen diese Rückfrage nie (Auflage A-A-5). Über sie könnte
 * sie ohnehin nicht die Wahrheit sagen — der genannte Pfad zeigt nicht auf das,
 * was startet.
 *
 * ---------------------------------------------------------------------------
 * Der nachgestellte Punkt (A-A-5′, T-156-1)
 * ---------------------------------------------------------------------------
 *
 * `…exe.` und `…exe ` galten hier bis T-157 als **endungslos**, und die
 * Rückfrage sagte dafür „wird geöffnet" statt „wird ausgeführt". Windows
 * schneidet nachgestellte Punkte und Leerzeichen ab, bevor es die Datei
 * auflöst — die Rückfrage nannte also den richtigen Pfad und log über die
 * Wirkung. Genau das nimmt ihr den Wert (R-21, Nachtrag vom 2026-09-05):
 * Eine Rückfrage ist so viel wert wie ihre Auskunft darüber, **was** beim
 * Bestätigen geschieht.
 *
 * {@link effectiveFileNameOf} schneidet diese Zeichen ab, und
 * {@link extensionOf} ruft sie — dieselbe Rechnung wie `effective_file_name` in
 * `attachment.rs`, und aus demselben Grund. Der **angezeigte** Dateiname bleibt
 * davon unberührt: Dort steht weiterhin der gespeicherte Wert, ungekürzt, denn
 * die Rückfrage soll zeigen, was im Bestand steht, und sagen, was es tut.
 *
 * Seit X-05 zeigt die Rückfrage den aufgelösten Namen zusätzlich an, wenn er
 * vom angezeigten abweicht. Sie rechnet ihn **nicht selbst** aus, sondern ruft
 * {@link effectiveFileNameOf} — eine zweite Abschneideregel im Dialog wäre eine
 * dritte Wahrheit über denselben Namen.
 *
 * ---------------------------------------------------------------------------
 * Der Doppelpunkt (A-A-28, T-164)
 * ---------------------------------------------------------------------------
 *
 * Unter Windows trennt ein Doppelpunkt im Dateinamen einen **alternativen
 * Datenstrom** ab: `rechnung.lnk::$DATA` löst NTFS auf `rechnung.lnk` auf.
 * Ein Name mit Doppelpunkt hat damit keine Endung mehr, über die sich sinnvoll
 * urteilen ließe — {@link extensionOf} liefert für ihn ausdrücklich nichts, und
 * {@link foreseeableRefusalOf} sagt der Rückfrage, dass Takt ihn gar nicht
 * öffnet. Die **Abweisung** steht wie immer in `attachment.rs`
 * (`has_stream_separator`), nicht hier.
 */

/**
 * Endungen, bei denen „mit der Standardanwendung öffnen" eine **Ausführung**
 * ist. Kleingeschrieben; verglichen wird ohne Rücksicht auf Groß- und
 * Kleinschreibung.
 *
 * Die Liste ist bewusst kurz und nennt die Fälle, bei denen der Unterschied
 * zwischen „öffnen" und „starten" für einen Benutzer erkennbar zählt.
 * Vollständig ist sie nicht und kann sie nicht sein — siehe oben.
 */
const RUNS_WHEN_OPENED: readonly string[] = [
  "bat",
  "cmd",
  "com",
  "exe",
  "hta",
  "jar",
  "js",
  "jse",
  "msc",
  "msi",
  "ps1",
  "reg",
  "scr",
  "vbe",
  "vbs",
  "wsf",
];

/**
 * Der letzte Pfadtrenner in beiden Schreibweisen, ohne Deutung des Rests.
 *
 * `ForeignText` hinein und eine **Zahl** heraus: Das ist keine Behandlung im
 * Sinn von E-063, sondern eine Frage über den Wert. `proof:foreign` unterscheidet
 * die beiden an der Signatur — was fremden Text annimmt, sagt es; was
 * gewöhnlichen Text **zurückgibt**, behauptet damit, ihn behandelt zu haben.
 * Keine der Funktionen hier tut das: Sie geben fremden Text zurück.
 */
function lastSeparator(value: ForeignText): number {
  return Math.max(value.lastIndexOf("/"), value.lastIndexOf("\\"));
}

/**
 * Der Dateiname eines Pfades — alles hinter dem letzten Trenner.
 *
 * Endet der Pfad auf einem Trenner oder enthält er keinen, kommt der **volle
 * Wert** zurück. Eine leere Zeichenkette gibt diese Funktion nie zurück,
 * solange sie eine bekommt (A-19.12).
 */
export function fileNameOf(path: ForeignText): ForeignText {
  const cut = lastSeparator(path);
  const tail = cut === -1 ? path : path.slice(cut + 1);
  return tail.length === 0 ? path : tail;
}

/**
 * Die Zeichen, die Windows am Ende eines Dateinamens **wegwirft**, bevor es die
 * Datei auflöst (A-A-5′). Siehe den Kopf dieser Datei.
 */
const TRAILING_IGNORED = /[. ]+$/u;

/**
 * Der Dateiname, **wie Windows ihn beim Öffnen auflöst** (A-A-5′).
 *
 * `rechnung.exe.` und `rechnung.exe ` öffnen beide `rechnung.exe`; wer den
 * gespeicherten Namen prüft, prüft eine Zeichenkette, die nie eine Datei war.
 * Abgeschnitten wird nur am **Ende** und nur diese beiden Zeichen — dieselbe
 * Rechnung wie `effective_file_name` in `apps/desktop/src-tauri/src/attachment.rs`.
 *
 * **Exportiert seit X-05**, damit die Rückfrage den aufgelösten Namen zeigen
 * kann, ohne ihn selbst zu ermitteln. Sie ist der eine Ort dieser Regel in der
 * Oberfläche; {@link extensionOf} ruft sie ebenfalls.
 *
 * Bleibt nach dem Abschneiden nichts übrig — ein Name aus lauter Punkten —,
 * kommt der volle Name zurück. A-19.12 wörtlich: nie eine leere Zeile.
 */
export function effectiveFileNameOf(path: ForeignText): ForeignText {
  const name = fileNameOf(path);
  const trimmed = name.replace(TRAILING_IGNORED, "");
  return trimmed.length === 0 ? name : trimmed;
}

/**
 * Trägt der Dateiname einen Doppelpunkt? (A-A-28.)
 *
 * Gefragt wird nur der **Dateiname**, damit der Laufwerksbuchstabe (`C:`) nicht
 * mitfällt. Dieselbe Frage stellt `has_stream_separator` in `attachment.rs` —
 * dort als Abweisung, hier nur als Wortwahl.
 */
function hasStreamSeparator(path: ForeignText): boolean {
  return fileNameOf(path).includes(":");
}

/**
 * Die Endung eines Pfades, kleingeschrieben und ohne Punkt. Leer, wenn es
 * keine gibt — `readme` hat keine.
 *
 * Gemessen wird am Namen, den **Windows auflöst**: `rechnung.exe.` und
 * `rechnung.exe ` liefern beide `exe` (A-A-5′, T-156-1). Und ein führender
 * Punkt zählt mit — `.lnk` ist unter Windows eine Verknüpfung und keine
 * versteckte Datei; `.gitignore` bekommt dadurch die Endung `gitignore`, die
 * auf keiner Liste steht und deshalb nichts ändert.
 *
 * **Ein Name mit Doppelpunkt hat hier gar keine Endung** (A-A-28): Was hinter
 * dem Doppelpunkt steht, ist unter Windows der Name eines Datenstroms und keine
 * Endung, und was davor steht, ist die Datei, die wirklich aufgeht. Über einen
 * solchen Namen trifft diese Funktion deshalb keine Aussage.
 */
export function extensionOf(path: ForeignText): ForeignText {
  const name = effectiveFileNameOf(path);
  if (hasStreamSeparator(path)) return "";
  const dot = name.lastIndexOf(".");
  if (dot === -1 || dot === name.length - 1) return "";
  /*
    **Bleibt fremd.** Die Endung ist ein Stück des Dateinamens, und der kommt
    aus dem Bestand; sie steht in der Rückfrage vor einem Programmstart auf dem
    Bildschirm. Wer sie als gewöhnlichen `string` zurückgäbe, hätte die Herkunft
    an dieser Stelle verloren — und `proof:foreign` sähe die Anzeige nicht mehr.
  */
  return name.slice(dot + 1).toLowerCase();
}

/**
 * Wird diese Datei beim Öffnen **ausgeführt**? Siehe die Warnung im Kopf.
 *
 * Der Rückgabewert ist ein `boolean` und kein Text — hier wird über einen
 * fremden Wert **geurteilt**, nicht aus ihm zitiert.
 */
export function runsWhenOpened(path: ForeignText): boolean {
  return RUNS_WHEN_OPENED.includes(extensionOf(path));
}

/**
 * Die technischen Schlüssel der Hülle, die sich **vor** dem Klick vorhersagen
 * lassen. Wortgleich mit `Rejection::key()` in `attachment.rs`.
 */
export type ForeseeableRefusal = "path_stream_separator" | "path_indirect_extension";

/**
 * Weist die Hülle diesen Pfad ab, bevor irgendetwas aufgeht? (V-07, A-A-28.)
 *
 * **Das ist keine Grenze**, sondern die Reihenfolge der Auskunft. Bis T-167
 * zeigte die Rückfrage für eine `rechnung.lnk` die milde Fassung „Diese Datei
 * wird geöffnet", und der Benutzer erfuhr erst **nach** dem Bestätigen, dass
 * Takt sie gar nicht öffnet — genau bei der Dateiart, für die dieselbe
 * Rückfrage laut Bedrohungsmodell „aktiv irreführend" wäre. Die Absage stand
 * schon immer richtig; sie stand nur an der falschen Stelle.
 *
 * Die **Kontrolle** bleibt `check_file` in
 * `apps/desktop/src-tauri/src/attachment.rs`, und sie läuft bei jedem Aufruf
 * neu. Wer diese Funktion für die Grenze hält, baut die Grenze aus — derselbe
 * Absatz wie über {@link runsWhenOpened}, und aus demselben Grund.
 *
 * Die fünf Umleitungsendungen werden hier **nicht abgeschrieben**, sondern aus
 * `@takt/domain` geholt (`INDIRECT_EXTENSIONS`). Eine zweite Liste wäre eine
 * zweite Wahrheit, und die erste, die veraltet, ist immer die abgeschriebene.
 *
 * Die Reihenfolge ist dieselbe wie in `check_file`: erst der Doppelpunkt, dann
 * die Endung. Ein Name mit Doppelpunkt hat keine beurteilbare Endung mehr.
 */
export function foreseeableRefusalOf(path: ForeignText): ForeseeableRefusal | null {
  if (hasStreamSeparator(path)) return "path_stream_separator";
  if (INDIRECT_EXTENSIONS.includes(extensionOf(path))) return "path_indirect_extension";
  return null;
}

/**
 * Die Bezeichnung eines Anhangs in der Liste (A-19.12) — **weitergereicht**,
 * nicht nachgebaut.
 *
 * Die Regel steht in `packages/domain/src/attachment.ts` und ist dieselbe, die
 * der Aufgabenbereich des Add-ins lesen würde. Reihenfolge dort: der **Titel**,
 * wenn einer gesetzt ist; sonst etwas Lesbares aus Adresse beziehungsweise
 * Pfad; sonst ein deutsches Wort. Nie eine leere Zeile.
 *
 * Diese Hülle gibt es aus demselben Grund wie `deadlineState` neben `dueState`:
 * Sie nimmt den Anhang, wie ihn diese Oberfläche führt, und setzt den Übergang
 * auf die Typen der Domäne an **eine** Stelle statt an jede Aufrufstelle.
 *
 * **Der Rückgabewert ist fremder Text** und bleibt es: Er stammt aus einer
 * Benutzereingabe und im Fall des Pfades zusätzlich aus dem Dateisystem. Er
 * gehört durch `<Foreign>` beziehungsweise `foreignText`, sonst dreht ein
 * `U+202E` im Dateinamen die Zeile um, deren Klick ein Programm startet
 * (E-063, Auflage A-A-6 Punkt 2). Die Domäne maskiert nichts und sagt das im
 * eigenen Kopfkommentar — die Behandlung bleibt Sache der Anzeige.
 */
export function attachmentLabel(attachment: Attachment): ForeignText {
  return domainAttachmentLabel(attachment.kind, attachment.title, attachment.target);
}

/** „Verweis", „Bild", „Datei" — die Wörter aus A-19.9, an einer Stelle. */
export const ATTACHMENT_KIND_LABEL: Readonly<Record<AttachmentKind, string>> = {
  link: "Verweis",
  image: "Bild",
  file: "Datei",
};

/**
 * Die Beschriftung des Pflichtfeldes je Art (A-19.10, wörtlich).
 *
 * Verweis → **Adresse**, Bild → **Bild**, Datei → **Dateipfad**. Nicht „URL",
 * nicht „Link", nicht „Pfad", nicht „Speicherort".
 */
export const ATTACHMENT_VALUE_LABEL: Readonly<Record<AttachmentKind, string>> = {
  link: "Adresse",
  image: "Bild",
  file: "Dateipfad",
};
