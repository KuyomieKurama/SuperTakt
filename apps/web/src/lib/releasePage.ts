/**
 * Takt — die Adresse der Release-Seite, **zum Lesen** (A-18.6, Auflage A-V-18).
 *
 * ---------------------------------------------------------------------------
 * Warum die Adresse hier ein zweites Mal steht
 * ---------------------------------------------------------------------------
 *
 * A-18.6 verlangt, dass der Hinweis den **Verweis** auf die Release-Seite
 * dieser Fassung nennt — nicht bloß einen Knopf, hinter dem irgendetwas liegt.
 * Der Benutzer soll vor dem Klick sehen, wohin er geschickt wird; das ist der
 * ganze Unterschied zwischen einem Verweis und einer Zusicherung.
 *
 * Öffnen kann die Oberfläche ihn nicht: Der Öffnen-Weg läuft über die Hülle,
 * und die nimmt **keine Adresse** entgegen (E-064 Punkt 4). Was hier entsteht,
 * ist deshalb ausdrücklich nur Text. A-V-18 sagt das so: „Die Adresse darf als
 * Text danebenstehen; sie ist lokal gebaut."
 *
 * Damit steht dieselbe Zeichenkette an zwei Orten — hier und als
 * `RELEASE_TAG_PREFIX` in `apps/desktop/src-tauri/src/release.rs`. Nach der
 * Regel aus E-065 ist das erlaubt, sobald der **Gleichlauf gemessen** wird und
 * nicht bloß zugesagt ist: `apps/desktop/scripts/proof-shell-surface.mjs`
 * Prüfung 4 hält beide Zeichenketten zeichengleich gegeneinander und wird rot,
 * sobald eine von beiden sich bewegt. Ohne diese Messung wäre der Text hier
 * eine Adresse, die von der geöffneten abweichen kann — und ein angezeigter
 * Verweis, der woandershin führt als der Knopf daneben, ist schlimmer als gar
 * keiner.
 *
 * ---------------------------------------------------------------------------
 * Was diese Datei **nicht** tut
 * ---------------------------------------------------------------------------
 *
 * Sie prüft nichts. Die Formprüfung der Fassungsbezeichnung liegt in der Hülle
 * (Auflage A-V-16), und ob eine Fassung überhaupt angezeigt wird, entscheidet
 * `decideUpdateNotice` in `@takt/domain`. Hierher kommt nur, was beides
 * bereits bestanden hat.
 */

/**
 * Die Adresse ohne die Fassungsbezeichnung. Zeichengleich mit
 * `RELEASE_TAG_PREFIX` in `apps/desktop/src-tauri/src/release.rs`, gemessen von
 * `proof:shell-surface`.
 */
export const RELEASE_TAG_PREFIX = "https://github.com/KuyomieKurama/SuperTakt/releases/tag/v";

/**
 * Die Release-Seite dieser Fassung, als lesbarer Text.
 *
 * @param version Die Fassung **ohne** führendes `v`, wie sie
 *   `decideUpdateNotice` herausgibt. Ein anderer Wert hat hier nichts zu
 *   suchen; er würde zwar eine Zeichenkette ergeben, aber keine, die dem
 *   entspricht, was der Öffnen-Befehl der Hülle daraus machen würde.
 */
export function releasePageUrl(version: string): string {
  return `${RELEASE_TAG_PREFIX}${version}`;
}
