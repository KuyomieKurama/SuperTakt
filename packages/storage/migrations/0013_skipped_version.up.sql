-- Takt — Migration 0013 "skipped_version", Vorwärtsrichtung
-- Deckt: A-18.10, R-20, E-064 Punkt 5, T-136-4
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- ===========================================================================
-- Wozu
-- ===========================================================================
--
-- A-18.10: „Wählt der Benutzer ‚Überspringen', wird genau diese Fassung
-- übersprungen. Für sie erscheint der Hinweis nicht wieder; eine spätere,
-- neuere Fassung wird wieder gemeldet."
--
-- Der Wert muss den Neustart überleben, sonst ist er wertlos: R-20 beschreibt
-- genau den Fall, dass ein nur für die Sitzung gemerktes Überspringen den
-- Hinweis beim nächsten Start wiederbringt — und ein Hinweis, den man nicht
-- loswird, wird ungelesen weggeklickt. Danach übersieht der Benutzer auch die
-- Meldung, die zählt.
--
-- Er steht deshalb **im Bestand** und nicht im Arbeitsspeicher des Dienstes und
-- nicht im Browserspeicher der Oberfläche. Und er steht in `app_setting`, weil
-- er eine Einstellung ist wie jede andere: eine Zeile, feste Felder, jede
-- Einstellung mit einem Typ und einer Migration (E-011). Ein eigener
-- Schlüssel-Wert-Beutel wäre eine zweite Art, Einstellungen zu führen.
--
-- ===========================================================================
-- Warum ein CHECK, obwohl die Tür ohnehin prüft
-- ===========================================================================
--
-- Der Wert ist **Benutzereingabe** (T-136-4, VG-6): Jeder Prozess mit dem
-- Sitzungsgeheimnis kann ihn über `PATCH /settings` setzen. Geprüft wird er
-- deshalb an seiner Tür — beim Schreiben gegen die Form aus A-V-8 und beim
-- **Lesen** noch einmal, weil ein Bestand aus einer fremden Quelle stammen
-- kann. Ein ungültiger gespeicherter Wert heißt „nichts übersprungen" und
-- führt zu keinem Wurf.
--
-- Der CHECK hier ist die zweite Wache und nicht die erste, dieselbe Rolle wie
-- die RESTRICT-Klauseln aus 0011 und 0012: Er nimmt der Datenbank die
-- Möglichkeit, still zu gehorchen, wenn eines Tages jemand an der Prüfung
-- vorbeischreibt.
--
-- Er ist bewusst **enger als nichts und weiter als die Domäne**: SQLite kennt
-- ohne Erweiterung kein REGEXP, GLOB kann die Form nicht vollständig
-- ausdrücken. Was er trägt, ist der Teil, auf den es hier ankommt — der
-- **Zeichenvorrat** und die **Länge**:
--
--   * Länge zwischen 5 (`0.0.0`) und 94 (9+1+9+1+9+1+64, A-V-8).
--   * Beginnt mit einer Ziffer, und es kommen mindestens zwei Punkte darin vor.
--   * Kein Zeichen außerhalb von `0-9`, `A-Z`, `a-z`, `.` und `-`. Damit sind
--     `/`, `\`, `?`, `#`, `:`, `@`, `%`, Leerzeichen und Zeilenumbruch
--     ausgeschlossen (B-18.2), und ein Punktsegment kann nicht entstehen, weil
--     das erste Zeichen eine Ziffer ist.
--
-- Was er **nicht** leistet: `1.2.3.4.5.6` besteht ihn. Die vollständige Form
-- steht in `packages/domain/src/version.ts` und wird an beiden Türen gefahren;
-- diese Spalte soll keine zweite, abweichende Meinung darüber führen, was eine
-- Fassung ist.
--
-- ===========================================================================
-- Warum ALTER TABLE ADD COLUMN und kein Tabellenumbau
-- ===========================================================================
--
-- Es ändert sich keine bestehende Spalte, keine REFERENCES-Klausel und kein
-- bestehender CHECK. `app_setting` hat weder Trigger noch Sicht, die auf ihr
-- stünden; die einzige Fremdschlüsselbeziehung (`active_export_template_id`)
-- bleibt unberührt. Ein Umbau wie in 0011/0012 wäre hier mehr Bewegung als
-- Änderung — und jede kopierte Zeile ist eine Gelegenheit, etwas zu verlieren.
--
-- Der Vorgabewert ist NULL: „nichts übersprungen". Das ist der Zustand, in dem
-- jeder bestehende Bestand nach dieser Migration steht, und er ist richtig.

ALTER TABLE app_setting ADD COLUMN skipped_version TEXT
  CHECK (
    skipped_version IS NULL
    OR (
      length(skipped_version) BETWEEN 5 AND 94
      AND skipped_version GLOB '[0-9]*.[0-9]*.[0-9]*'
      AND skipped_version NOT GLOB '*[^0-9A-Za-z.-]*'
    )
  );
