-- Takt — Migration 0023 "attachment_origin", Vorwärtsrichtung
-- Deckt: A-19.22a, A-19.22b, A-19.23a, A-19.23b, A-19.26, A-19.29, A-20.4,
--        E-108, E-109, A-A-78, A-A-83, A-A-84, A-A-85, A-A-93, A-A-97, R-27, R-28
-- Der Migrationsläufer setzt PRAGMA foreign_keys vor BEGIN und öffnet die Transaktion selbst.
--
-- ===========================================================================
-- Wozu
-- ===========================================================================
--
-- Mit E-108 entstehen Anhänge beim Anlegen eines Todos aus einer E-Mail: die
-- Nachricht selbst als Datei (A-19.22) und sämtliche ihrer Dateianhänge
-- (A-19.23). Vier Tatsachen über einen solchen Anhang müssen den Neustart, die
-- Anzeige von übermorgen und den Round-Trip der Datensicherung (A-20.4)
-- überleben. Bis heute gibt es für keine davon eine Spalte:
--
--   1. **Woher er stammt** (A-A-84). Bis A-19.23 war jeder Dateianhang von
--      Hand eingetragen; der Benutzer kannte seine Herkunft, weil er sie selbst
--      gewählt hatte. Ab jetzt ist der häufigste Dateianhang einer, den ein
--      Fremder geschickt hat, und der Benutzer sieht ihn Tage später zwischen
--      seinen eigenen.
--   2. **Von wem** (A-A-85). Die Rückfrage vor dem Öffnen sagt heute, *was*
--      geschieht. Sie sagt nicht, *woher diese Datei kommt*.
--   3. **Wie er heißt** (A-19.23a). Der Name auf der Platte ist erzeugt
--      (A-A-78). Der Name, den ein Mensch liest, kommt aus der E-Mail und
--      steht nirgends sonst.
--   4. **Ob er echt ist** (A-19.22b, A-A-97). Wo Outlook die Nachricht nicht
--      hergibt, wird die `.eml` aus Office.js-Feldern **nachgebaut**. Eine
--      Datei, die für die ursprüngliche Nachricht gehalten werden kann, ohne
--      es zu sein, ist in einem Vorgang, aus dem eine Rechnung wird, eine
--      falsche Auskunft über ein Beweisstück.
--
-- Punkt 4 ist der Grund, warum diese Migration überhaupt existiert und nicht
-- ein Hinweis beim Anlegen genügt: **Die Kennzeichnung hängt an der Datei,
-- nicht am Augenblick** (A-19.22b wörtlich). Ein Hinweis, der nur beim Anlegen
-- erscheint, ist drei Wochen später nirgends.
--
-- ===========================================================================
-- Warum vier Spalten und nicht eine
-- ===========================================================================
--
-- Ein einzelnes Feld `source` mit den Werten `user`, `email` und
-- `email_rebuilt` wäre kürzer und falsch: Herkunft und Nachbau sind zwei
-- unabhängige Tatsachen. Der Nachbau ist heute nur bei der `.eml` möglich —
-- aber „heute nur dort" ist eine Aussage über den Code und keine über die
-- Sache. Zwei Tatsachen in einem Feld heißt, daß jede neue Kombination das
-- Feld umbaut, und daß jede Abfrage über eine der beiden Tatsachen die andere
-- mitlesen muß.
--
-- `display_name` steht **neben** `title` und nicht darin. `title` ist, was der
-- **Benutzer** gewählt hat (A-19.10); `display_name` ist, was der **Absender**
-- die Datei genannt hat. Der Unterschied ist keine Ordnungsliebe, sondern die
-- Bedingung dafür, daß die anzeigende Fläche weiß, welche Regeln gelten: Für
-- fremden Text ist die Endung stets sichtbar, und am Ende wird nie gekürzt
-- (A-19.23b, A-A-93, R-27). Für den eigenen Titel gilt beides nicht.
--
-- ===========================================================================
-- Warum CHECK und keine Nachschlagetabelle wie bei `kind`
-- ===========================================================================
--
-- Migration 0015 hat die **Arten** bewußt zu Daten gemacht, weil dort eine
-- Auflage stand: „Eine vierte Art darf keine Migration mit Tabellenumbau
-- verlangen." Für die **Herkunft** gibt es diese Auflage nicht, und es gibt
-- auch keinen Kandidaten für einen dritten Wert: Ein Anhang ist von Hand
-- eingetragen oder aus einer E-Mail entstanden. Der Fremdimport nach A-20.7
-- erzeugt Anhänge aus einer Datei, die der **Benutzer** mitbringt — das ist
-- `user` und kein dritter Fall.
--
-- Dazu kommt eine Schranke von SQLite, und sie entscheidet die Frage ohnehin:
-- `ALTER TABLE ... ADD COLUMN` läßt eine `REFERENCES`-Klausel nur zu, wenn der
-- Vorgabewert NULL ist. Eine Nachschlagetabelle wäre hier also entweder eine
-- Spalte ohne NOT NULL — mit NULL als drittem, unbenanntem Zustand — oder ein
-- vollständiger Tabellenumbau samt Kopieren aller Zeilen. Beides ist teurer
-- als der CHECK, und das erste ist genau die Mehrdeutigkeit, die A-A-84
-- ausschließt.
--
-- **Der Preis gehört benannt:** Ein dritter Herkunftswert kostet später einen
-- Tabellenumbau. Das ist derselbe Preis, den 0021 und 0022 zahlen, und er ist
-- hier bewußt in Kauf genommen.
--
-- ===========================================================================
-- Warum jede Spalte einen Vorgabewert hat, der die Vergangenheit richtig macht
-- ===========================================================================
--
-- `origin = 'user'` und `rebuilt = 0` für jede bestehende Zeile: Jeder Anhang,
-- den es vor dieser Fassung gibt, ist vom Benutzer eingetragen worden, und
-- keiner davon ist ein Nachbau. Der Vorgabewert ist damit keine Notlösung,
-- sondern die Wahrheit über den Altbestand.
--
-- `origin_sender` und `display_name` bleiben NULL, und NULL heißt hier „gibt
-- es nicht" — nicht „unbekannt". Bei `origin = 'user'` ist das der einzig
-- richtige Wert: Einen Absender hat dieser Anhang nie gehabt.
--
-- ===========================================================================
-- Was hier NICHT steht
-- ===========================================================================
--
-- **Keine Bytes.** Eine übernommene E-Mail-Datei liegt als Datei im
-- Anwendungsdatenverzeichnis, in einem eigenen Ordner mit 0700/0600 — dieselbe
-- Begründung wie bei den Bildkopien in 0015, nur schwerer wiegend: Eine
-- E-Mail-Anlage von 25 MB in einer BLOB-Spalte bläst die WAL bei jedem
-- Schreibvorgang auf.
--
-- **Keine Verbindung zum Export.** Wie 0015: Es gibt keine Sicht und keinen
-- Trigger, der diese Tabelle mit `v_export_candidate` oder `export_run_entry`
-- verbindet (A-19.17). Der Schutz ist der **Typ** und keine Filterliste.
--
-- **Keine Kopfzeilen, kein MIME, kein Betreff.** Was in der `.eml` steht,
-- steht in der `.eml`. Dieser Bestand zerlegt sie nicht und zeigt sie nicht an
-- (A-A-88); er kennt von ihr den Anzeigenamen und die Tatsache, ob sie ein
-- Nachbau ist.

-- ---------------------------------------------------------------------------
-- Die Herkunft (A-A-84)
-- ---------------------------------------------------------------------------
ALTER TABLE todo_attachment ADD COLUMN origin TEXT NOT NULL DEFAULT 'user'
  CHECK (origin IN ('user', 'email'));

-- ---------------------------------------------------------------------------
-- Der Absender (A-A-85) — fremder Text, und er wird als solcher behandelt
-- ---------------------------------------------------------------------------
--
-- 320 Zeichen ist die Länge einer E-Mail-Adresse nach RFC 5321 (64 + 1 + 255).
-- Ein Anzeigename kommt dazu, deshalb steht hier großzügig das Doppelte; der
-- CHECK ist ein Deckel gegen einen Roman im Feld und keine zweite Meinung über
-- die Form. Geprüft wird, wo geschrieben wird.
--
-- Er steht **nur** bei `origin = 'email'`. Ein Absender an einem Anhang, den
-- der Benutzer selbst eingetragen hat, wäre eine Behauptung, die niemand
-- gemacht hat — und die Rückfrage vor dem Öffnen würde sie vorlesen.
ALTER TABLE todo_attachment ADD COLUMN origin_sender TEXT
  CHECK (
    origin_sender IS NULL
    OR (length(trim(origin_sender)) > 0 AND length(origin_sender) <= 640 AND origin = 'email')
  );

-- ---------------------------------------------------------------------------
-- Der Anzeigename aus fremder Hand (A-19.23a)
-- ---------------------------------------------------------------------------
--
-- 255 Zeichen: die Zahl, an der jedes hier in Frage kommende Dateisystem
-- seinen Namen beendet. Was länger ankommt, wird **in der Mitte** gekürzt und
-- die Kürzung ist sichtbar (`shortenEmailDisplayName` in
-- `packages/domain/src/email-attachment.ts`). Am Ende zu kürzen ist verboten:
-- Es nähme der Anzeige die Endung, ohne ein einziges Zeichen zu verändern
-- (A-19.23b, A-A-93, R-27).
--
-- Er steht **nie** auf der Platte (A-A-78). Dort steht ein erzeugter Name.
ALTER TABLE todo_attachment ADD COLUMN display_name TEXT
  CHECK (
    display_name IS NULL
    OR (length(trim(display_name)) > 0 AND length(display_name) <= 255)
  );

-- ---------------------------------------------------------------------------
-- Der Nachbau (A-19.22b, A-A-97)
-- ---------------------------------------------------------------------------
--
-- Zweiwertig, nie leer, nie mehrdeutig. Der zweite CHECK bindet ihn an die
-- Herkunft: Ein Nachbau ohne E-Mail gibt es nicht — nachgebaut wird eine
-- Nachricht, und eine Nachricht kommt aus einer E-Mail. Ohne diese Bedingung
-- könnte an einem vom Benutzer eingetragenen Pfad „nachgebaut" stehen, und die
-- Rückfrage vor dem Öffnen sagte einen Satz über eine Datei, die niemand
-- gebaut hat.
ALTER TABLE todo_attachment ADD COLUMN rebuilt INTEGER NOT NULL DEFAULT 0
  CHECK (rebuilt IN (0, 1) AND (rebuilt = 0 OR origin = 'email'));

-- ---------------------------------------------------------------------------
-- Die übernommenen Dateien eines Bestands, ohne Tabellendurchlauf
-- ---------------------------------------------------------------------------
--
-- Dieselbe Rolle wie `ix_todo_attachment_image` aus 0015 und aus demselben
-- Grund: Beim Löschen eines Todos und beim Aufräumen ist die Frage „welche
-- Datei im Ordner hat keinen Eigentümer mehr?" — und sie darf nicht die ganze
-- Tabelle in den Speicher laden.
--
-- `origin = 'email'` allein und nicht zusätzlich `kind = 'file'`: Ein
-- Cloud-Anhang (A-19.25) hat dieselbe Herkunft und ist ein `link`; er steht
-- damit im Index, kostet dort eine Zeile und schadet nicht. Eine Bedingung
-- über zwei Spalten machte den Index enger und die Abfrage nicht schneller.
CREATE INDEX ix_todo_attachment_email ON todo_attachment (target) WHERE origin = 'email';
