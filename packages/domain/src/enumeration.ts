/**
 * Takt — die deutsche Aufzählung: „A“, „A und B“, „A, B und C“
 * (E-058 Punkt 4, T-093, B-11, O-AG).
 *
 * ---------------------------------------------------------------------------
 * Warum diese fünf Zeilen eine eigene Datei sind
 * ---------------------------------------------------------------------------
 *
 * Weil es bis T-122 vier davon gab.
 *
 * Die Form entstand in `pool-movement.ts` als `listPools` — privat, also nicht
 * abrufbar. Wer sie brauchte, schrieb sie ab: `joinGerman`
 * (`apps/web/src/lib/format.ts`), `enumerateGerman`
 * (`apps/web/src/lib/errorText.ts`) und `quoteList`
 * (`apps/web/src/screens/TodoFormDialog.tsx`). Eine vierte war bereits
 * dagewesen und hatte bei drei Namen „A und B und C“ ergeben (Befund C-24 aus
 * T-045). frontend-dev und spec-ux-reviewer haben unabhängig voneinander
 * gefragt, ob die Funktion nicht ausgeführt werden könne, statt sie ein drittes
 * Mal nachzubauen.
 *
 * Das ist dieselbe Lehre wie bei der Zeichenklasse eine Datei weiter
 * (`characters.ts`): Zeichengleichheit über Paketgrenzen zu **verabreden** ist
 * die schwächere Fassung von „es gibt nur eine Stelle“.
 *
 * ---------------------------------------------------------------------------
 * Warum in der Domäne und nicht in einer gemeinsamen Oberflächenbibliothek
 * ---------------------------------------------------------------------------
 *
 * Weil der Aufgabenbereich des Add-ins dieselbe Aufzählung liest wie die
 * Hauptanwendung und beide bereits `@takt/domain` einbinden — das Add-in darf
 * `@takt/local-api` nicht führen und `apps/web` nicht. Und weil die Form nicht
 * frei ist: Sie steht wortgleich in den vierzehn Sätzen aus T-093, gegen die
 * die Tests zeichengenau messen. Eine zweite Fassung wäre eine zweite
 * Gelegenheit, sie zu ändern.
 *
 * Rein: Zeichenketten herein, eine Zeichenkette heraus. Diese Datei importiert
 * nichts.
 */

/**
 * Zählt Textstücke deutsch auf: `A`, `A und B`, `A, B und C`.
 *
 * Ohne Anführungszeichen und ohne Gattungswort — beides bringen die Einträge
 * mit oder der Satz drumherum. Bei einer leeren Liste kommt die leere
 * Zeichenkette zurück; die Aufrufstelle fragt vorher, ob es überhaupt etwas
 * aufzuzählen gibt.
 *
 * Das Komma vor „und“ fehlt absichtlich: Es ist im Deutschen nicht üblich, und
 * die Sätze aus T-093 sind so abgenommen.
 */
export function enumerateGerman(parts: readonly string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} und ${parts[parts.length - 1] ?? ''}`;
}

/**
 * Ein **Name** in deutschen Anführungszeichen.
 *
 * Sie stehen hier und nicht am Aufrufer, damit nicht die eine Fläche „Ost“ und
 * die andere "Ost" schreibt. Ohne sie läse sich „Betroffen sind die Regeln Ost,
 * Nord und Abrechnung.“, und ein Name mit einem Leerzeichen darin wäre nicht
 * mehr abgegrenzt.
 */
export function quoteName(name: string): string {
  return `„${name}“`;
}

/**
 * Zählt **Namen** auf: jeder in Anführungszeichen, dann deutsch verbunden.
 *
 * „Ost“ — „Ost“ und „Nord“ — „Ost“, „Nord“ und „Abrechnung“.
 *
 * ---------------------------------------------------------------------------
 * Zwei Entscheidungen stecken darin
 * ---------------------------------------------------------------------------
 *
 * **Namen statt Zahl.** Keine Zusammenfassung wie „in 3 Pools“: Der Benutzer
 * soll die Namen lesen, die er gleich in der Hauptanwendung wiederfindet. Eine
 * Zahl wäre schneller geschrieben und ließe die Frage offen, die sie
 * beantworten soll.
 *
 * **Kein Gattungswort davor** (E-058 Punkt 4). Bis T-093 gab es einen zweiten
 * Baustein, der „dem Pool „X““ oder „den Pools „X“ und „Y““ daraus machte. Er
 * war falsch, seit E-054 eine Kanban-Spalte dieselbe Entität ist wie ein Pool:
 * Die Listen tragen Namen, aber keine Fläche. Ob „Ost“ ein Pool ist, eine
 * Spalte oder — bei `placement: 'both'` — beides, steht hier nicht und darf
 * auch nicht geraten werden. Ein Satz, der „der Pool „Ost““ sagt, wo eine reine
 * Board-Spalte gemeint ist, schickt den Benutzer in die Pool-Liste, in der sie
 * nicht steht.
 *
 * Der Nebengewinn: Die Zahl der Namen ändert nur die Aufzählung, nicht den
 * Artikel. Es gibt keinen Singular-Plural-Fall mehr, in dem der Satz stolpern
 * könnte.
 *
 * Hieß bis T-122 `listPools` und lag privat in `pool-movement.ts`. Der neue
 * Name sagt, was die Funktion tut: Sie zählt Namen auf. Pools kennt sie nicht —
 * und im lokalen Dienst heißt bereits ein Anwendungsfall `listPools`, der
 * tatsächlich Pools auflistet.
 */
export function enumerateNames(names: readonly string[]): string {
  return enumerateGerman(names.map(quoteName));
}
