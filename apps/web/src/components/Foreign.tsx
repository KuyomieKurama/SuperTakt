import { visibleText } from "@takt/domain";

/**
 * Takt — fremder Text in der Anzeige (E-063, O-AH, T-124).
 *
 * ---------------------------------------------------------------------------
 * Was „fremd" hier heißt
 * ---------------------------------------------------------------------------
 *
 * Nicht „von einem Angreifer", sondern **nicht von dieser Oberfläche
 * geschrieben**: der Titel eines Todos, der Vermerk, die Leistung einer
 * Buchung, ein Tagname, ein Ordnername, der Name eines Pools, eines Status
 * oder einer Exportvorlage. Alles davon kann aus dem Outlook-Add-in kommen,
 * und dort steht es wörtlich so, wie es im Betreff oder im Textkörper einer
 * E-Mail stand (`prepareNote` in `apps/outlook-addin/src/office/mail.ts`).
 *
 * Der Vermerk ist der Fall, der diesen Baustein ausgelöst hat: `textSchema`
 * prüft ihn **bewusst nicht** auf Steuer- und Richtungszeichen (T-122 Annahme
 * 6), weil ein Vermerk ein Fließtext ist und kein Name. Er geht damit
 * ungeprüft durch die Tür und wird hier angezeigt — E-063 eine Fläche weiter
 * als T-119.
 *
 * ---------------------------------------------------------------------------
 * Zwei Dinge auf einmal, und beide sind nötig
 * ---------------------------------------------------------------------------
 *
 *  1. **`<bdi>`** isoliert den Text von seiner Umgebung. Ohne diese Klammer
 *     ordnet ein von rechts nach links geschriebener Titel den deutschen Satz
 *     um, in dem er steht — „Timer für „…" starten" ist die Stelle, an der das
 *     am meisten wiegt, weil der Name dort mitten im Satz sitzt.
 *  2. **`visibleText`** nimmt dem Inhalt die Zeichen, die ihn umordnen, ohne
 *     sichtbar zu sein, und setzt an ihre Stelle eine sichtbare Marke
 *     (`U+FFFD`). Die Isolierung allein tut das **nicht**: Innerhalb eines
 *     isolierten Blocks wirkt ein `U+202E` weiter (UBA X2–X5). Das ist die
 *     Berichtigung aus T-119, und sie ist der Grund, warum hier ein Baustein
 *     steht und keine CSS-Klasse.
 *
 * **Markieren, nicht streichen** (E-063 Punkt 2): Ein ersatzlos entferntes
 * Zeichen ergäbe eine Anzeige, die verschweigt, dass etwas da war. Die Länge
 * bleibt erhalten, weil jedes Zeichen genau ein Zeichen wird.
 *
 * **Rechtsläufige Schrift bleibt unangetastet.** Arabisch und Hebräisch sind
 * Text und kein Angriff; dass sie den deutschen Satz daneben nicht umordnen,
 * besorgt die Isolierung.
 *
 * ---------------------------------------------------------------------------
 * Geteilt ist die Regel, nicht der Quelltext
 * ---------------------------------------------------------------------------
 *
 * `visibleText` kommt aus `packages/domain/src/characters.ts` — dieselbe
 * Funktion, die der Aufgabenbereich des Add-ins benutzt und gegen die der
 * lokale Dienst seine Tür prüft (T-122). Die **Zeichenklasse** steht damit
 * einmal im Baum, und das ist der Teil, der auseinanderlaufen konnte (T-119,
 * E-063 Punkt 4).
 *
 * Was **nicht** geteilt ist, sind diese drei Zeilen JSX. Ein gemeinsamer
 * React-Baustein bräuchte ein Paket, das React führt; `@takt/ui-tokens` ist
 * heute reines CSS, und seine Abhängigkeitsliste zu ändern ist eine
 * Entscheidung des Orchestrators. Der Tausch ist bewusst: Eine geteilte
 * Zeichenklasse mit zwei winzigen Hüllen darum ist besser als zwei
 * Zeichenklassen — die Hülle kann nicht falsch werden, ohne dass der
 * Übersetzer es merkt, die Klasse konnte es.
 *
 * ---------------------------------------------------------------------------
 * Wo dieser Baustein **nicht** steht
 * ---------------------------------------------------------------------------
 *
 * In keinem Eingabefeld (E-063 Punkt 1). Was in einem `input` oder `textarea`
 * steht, ist der Stand der Bearbeitung; ihn anzuzeigen, wie er geschrieben
 * wurde, ist die Voraussetzung dafür, ihn ändern zu können — und ein
 * verändertes Feld ginge beim Speichern verändert zurück in die Datenbank.
 *
 * Wo nur eine Zeichenkette möglich ist — in einem `aria-label`, einem `title`,
 * einem Satz, der als Zeichenkette entsteht —, steht `visibleText` allein
 * (oder {@link quotedName}). Dann fehlt die Isolierung, und das ist
 * ausgesprochen: Der Inhalt kann nichts mehr umdrehen, aber ein hebräischer
 * Titel steht in einem deutschen Satz weiterhin dort, wohin ihn der
 * Bidi-Algorithmus setzt.
 */
export function Foreign({
  value,
  className,
}: {
  readonly value: string;
  readonly className?: string;
}) {
  return <bdi className={className}>{visibleText(value)}</bdi>;
}
