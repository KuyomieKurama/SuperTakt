-- Takt — Migration 0011 "pool_rule_axes", Vorwärtsrichtung
-- takt: foreign_keys=off
-- Deckt: A-3.*, A-5.3, A-5.4, E-023, E-032, E-054, T-076
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- ===========================================================================
-- Wogegen
-- ===========================================================================
--
-- Der Auftraggeber: „ich würde gerne im Kanban Board auch den Status als Regel
-- mit aufnehmen." Und, mit einem Vorbild aus Super Productivity vor Augen:
-- „Nimm dir ein Beispiel daran. Das regelt das."
--
-- Bis hierher war eine Regel **eine Liste gleichartiger Terme**: `pool_rule`
-- mit `tag_id` oder `folder_id`, und `pool.match_mode` sagte, ob eines oder
-- alle zutreffen müssen. Diese Form kann drei Dinge nicht:
--
--   1. **„nicht"**. Eine Liste gleichartiger Terme hat keinen Platz für ein
--      ausgeschlossenes Tag. Man müsste das Vorzeichen an den Term hängen und
--      hätte danach zwei Sorten Term in einer Liste — genau die Bauform, deren
--      Verknüpfung man erklären muss, statt sie zu lesen.
--   2. **Größen, die keine Tagmenge sind.** `tag` und `folder` lösen sich
--      beide zur selben Größe auf: Tagkennungen an `todo_tag`. Der Status tut
--      das nicht — er steht als `todo.status_id` an der Zeile, genau einer je
--      Todo. Ebenso „Erledigt" (`todo.completed_at`) und der Exportstatus, der
--      an den **Buchungen** hängt und nicht am Todo.
--   3. **Einen Neutralwert je Bedingung.** In einer Liste ist „diese Bedingung
--      ist nicht gesetzt" dasselbe wie „die Liste ist leer" — und damit war die
--      leere Regel ein Sonderfall, den jede Auswertung eigens abfangen musste.
--
-- Seit dieser Migration hat **jede Bedingung ihr eigenes Feld mit einem
-- Neutralwert**, und die Verknüpfung folgt aus der Feldstruktur:
--
--   erforderliche Tags   pool_rule, role='required'   + pool.match_mode
--   ausgeschlossene Tags pool_rule, role='excluded'   („keines davon")
--   Status               pool_rule, role='status'     („einer von diesen")
--   Erledigt             pool.completion              any | done | open
--   Exportstatus         pool.export_state            any | open | exported
--
-- Die Felder sind mit „und" verbunden. Jedes engt weiter ein; keines kann das
-- Ergebnis vergrößern.
--
-- ===========================================================================
-- Was mit dem Bestand geschieht — und warum hier nichts geraten wird
-- ===========================================================================
--
-- Die Frage, an der eine solche Umstellung scheitert, lautet: Wird eine
-- vorhandene Tagliste zu „alle davon" oder zu „mindestens eines davon"?
--
-- Sie muss hier **nicht beantwortet** werden, weil die Antwort schon dasteht.
-- `pool.match_mode` hält sie seit Migration 0001, je Regel einzeln:
--
--   'any' — mindestens eines. Die Vorgabe der Spalte, die Vorgabe der Route
--           und die Vorgabe der Oberfläche („Mindestens eines von").
--   'all' — alle. Nur, wo jemand es ausdrücklich gewählt hat.
--
-- Jede vorhandene Zeile wird deshalb wörtlich zu „erforderliche Tags" mit
-- **unverändertem** `match_mode`, und `completion`/`export_state` stehen
-- neutral. **Jede bestehende Regel trifft nach dieser Migration genau dieselben
-- Todos wie davor.** Keine Umdeutung, keine Vermutung, kein Bestand, den
-- jemand nachträglich aufräumen muss.
--
-- ===========================================================================
-- Warum ein Tabellenumbau
-- ===========================================================================
--
-- SQLite kennt kein ALTER TABLE für einen CHECK, und der CHECK aus 0001 —
-- `(tag_id IS NULL) <> (folder_id IS NULL)` — ist genau die Bedingung, die eine
-- Zeile mit `status_id` verböte. Der Umbau folgt dem vorgeschriebenen Weg:
-- neue Tabelle, Inhalt kopieren, alte weg, umbenennen, Indizes wieder anlegen.
-- Dieselbe Bauart wie in 0006, samt der beiden PRAGMA-Zeilen und ihrer
-- Begründung.
--
-- `pool_rule` hat keine Kindtabelle und kein Trigger hängt daran; der Umbau
-- ist deshalb einfacher als der in 0006. Die Marke in Zeile 2 wird trotzdem
-- gebraucht: Ohne sie zöge das RENAME die REFERENCES-Klauseln um, und das DROP
-- liefe gegen die eingeschaltete Prüfung.

-- Siehe die Begründung im Kopf von 0006: `PRAGMA foreign_keys` ist innerhalb
-- einer offenen Transaktion wirkungslos und deshalb hier nur für den Fall
-- wirksam, dass diese Datei ohne den Läufer eingespielt wird — so machen es die
-- Prüfpfade, die das Schema selbst untersuchen.
PRAGMA foreign_keys = OFF;
PRAGMA legacy_alter_table = ON;

-- ---------------------------------------------------------------------------
-- 1. Die beiden Achsen, die an der Regel selbst hängen
-- ---------------------------------------------------------------------------
--
-- Einwertig, dreiwertig, nie leer — dieselbe Bauform wie `placement` (0009) und
-- aus demselben Grund wie beim Exportstatus (E-032). Zwei Wahrheitswerte
-- nebeneinander hätten vier Zustände, und einer davon wäre unsinnig.
--
-- `DEFAULT 'any'` ist zweierlei zugleich: der Wert für jede vorhandene Zeile
-- (SQLite füllt ihn beim ALTER ein) und die Vorgabe für jede künftige. Beides
-- ist gewollt und dasselbe: Wer eine Achse nicht nennt, lässt sie offen.
--
-- Der CHECK ist an dieser Stelle zulässig, anders als PRIMARY KEY und UNIQUE.
ALTER TABLE pool ADD COLUMN completion TEXT NOT NULL DEFAULT 'any'
  CHECK (completion IN ('any', 'done', 'open'));

-- `export_state` fragt nach dem **Vorhandensein** einer Buchung, nicht nach
-- einem Zustand des Todos: 'open' heißt „hat mindestens eine abgeschlossene,
-- offene Buchung", 'exported' heißt „hat mindestens eine exportierte". Ein Todo
-- kann beides zugleich erfüllen und steht dann in beiden Spalten — derselbe
-- Fall, den E-054 zum Normalfall gemacht hat.
ALTER TABLE pool ADD COLUMN export_state TEXT NOT NULL DEFAULT 'any'
  CHECK (export_state IN ('any', 'open', 'exported'));

-- ---------------------------------------------------------------------------
-- 2. `pool_rule` — drei Rollen statt einer Liste
-- ---------------------------------------------------------------------------
--
-- `role` ist der eine Unterscheider, und der CHECK ist erschöpfend: Zu jeder
-- Rolle gehört genau eine gefüllte Spalte, alles andere ist NULL. Damit gibt es
-- keine Zeile, deren Bedeutung von der Lesart des Auswerters abhängt.
--
-- Ein ausgeschlossener **Status** ist ausdrücklich nicht vorgesehen. Er wäre
-- eine vierte Rolle für eine Bedingung, die sich ohne sie ausdrücken lässt:
-- Wer „alles außer Erledigt" meint, wählt die übrigen Status. Bei Tags ist das
-- anders — dort sind es Tausende, und „alle außer diesem einen" ließe sich
-- nicht aufzählen. Genau deshalb gibt es die Ausschlussliste für Tags und nicht
-- für Status.
CREATE TABLE pool_rule_neu (
  pool_id   TEXT NOT NULL REFERENCES pool        (id) ON DELETE CASCADE,
  role      TEXT NOT NULL DEFAULT 'required' CHECK (role IN ('required', 'excluded', 'status')),
  tag_id    TEXT          REFERENCES tag         (id) ON DELETE CASCADE,
  folder_id TEXT          REFERENCES tag_folder  (id) ON DELETE CASCADE,
  -- ON DELETE RESTRICT, nicht CASCADE: Ein gelöschter Status, der eine Regel
  -- stillschweigend entkernt, hinterließe eine Spalte, die aus einem Grund
  -- leer ist, den niemand mehr sehen kann. `todo.status_id` steht aus
  -- demselben Grund auf RESTRICT, und `TodoStatusPort.remove` nennt den
  -- fachlichen Grund, bevor die Datenbank ihn nennen muss.
  status_id TEXT          REFERENCES todo_status (id) ON DELETE RESTRICT,
  CHECK (
       (role IN ('required', 'excluded')
        AND status_id IS NULL
        AND ((tag_id IS NULL) <> (folder_id IS NULL)))    -- genau eine Quelle je Tagterm
    OR (role = 'status'
        AND status_id IS NOT NULL
        AND tag_id    IS NULL
        AND folder_id IS NULL)
  )
);

-- Jede vorhandene Zeile wird eine **erforderliche**. Siehe Kopf, Abschnitt
-- „Was mit dem Bestand geschieht": Die Verknüpfung steht unverändert in
-- `pool.match_mode` und wird hier nicht angefasst.
INSERT INTO pool_rule_neu (pool_id, role, tag_id, folder_id, status_id)
SELECT pool_id, 'required', tag_id, folder_id, NULL FROM pool_rule;

DROP TABLE pool_rule;

ALTER TABLE pool_rule_neu RENAME TO pool_rule;

-- ---------------------------------------------------------------------------
-- 3. Die Indizes
-- ---------------------------------------------------------------------------
--
-- `ux_pool_rule` trägt jetzt zusätzlich `role` und `status_id`, und beides ist
-- notwendig, nicht schmückend:
--
--   * ohne `status_id` kollidierten zwei **verschiedene** Statusterme derselben
--     Regel miteinander — beide hätten COALESCE(tag_id,'') = COALESCE(folder_id,'') = '';
--   * ohne `role` ließe sich dasselbe Tag nicht zugleich erfordern und
--     ausschließen. Das ist zwar eine unsinnige Regel — sie trifft nichts —,
--     aber sie ist eine Eingabe des Benutzers und kein Datenbankfehler. Die
--     Antwort darauf gehört in die Oberfläche, nicht in einen 409.
--
-- Der Name bleibt derselbe, weil es derselbe Zugriffspfad und dieselbe
-- Zusicherung ist: „derselbe Regelteil steht nicht zweimal in derselben Regel".
-- `errors.ts` übersetzt ihn unter diesem Namen, und `proof:conflicts` misst das.
CREATE UNIQUE INDEX ux_pool_rule ON pool_rule
  (pool_id, role, COALESCE(tag_id, ''), COALESCE(folder_id, ''), COALESCE(status_id, ''));

-- Die drei Rückwärtsrichtungen: „welche Regeln hängen an diesem Tag / diesem
-- Ordner / diesem Status?". Die ersten beiden gab es seit 0001, der dritte ist
-- neu und trägt dieselbe Frage für `TodoStatusPort.remove`.
CREATE INDEX ix_pool_rule_tag    ON pool_rule (tag_id)    WHERE tag_id    IS NOT NULL;
CREATE INDEX ix_pool_rule_folder ON pool_rule (folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX ix_pool_rule_status ON pool_rule (status_id) WHERE status_id IS NOT NULL;

PRAGMA legacy_alter_table = OFF;
PRAGMA foreign_keys = ON;
