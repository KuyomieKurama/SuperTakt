-- Takt — Migration 0023 "attachment_origin", Rückwärtsrichtung
--
-- ===========================================================================
-- Die Reihenfolge ist Inhalt: erst der Index, dann die Spalten
-- ===========================================================================
--
-- `ix_todo_attachment_email` steht auf `target` mit `WHERE origin = 'email'`.
-- Solange er existiert, weist SQLite ein `DROP COLUMN origin` ab — eine Spalte,
-- die in einem Index vorkommt, läßt sich nicht fallen lassen. Das ist keine
-- Unbequemlichkeit, sondern die Schranke, die den Rückweg überhaupt ohne
-- Tabellenumbau möglich macht: Fällt der Index zuerst, ist jede der vier
-- Spalten danach in keinem Index, keiner Sicht, keinem Trigger und keinem
-- anderen CHECK — und genau das ist die Bedingung, unter der `DROP COLUMN`
-- zugelassen ist.
--
-- ===========================================================================
-- Was dabei verloren geht — benannt und nicht verschwiegen
-- ===========================================================================
--
-- **Die Herkunft jedes Anhangs.** Nach diesem Rückweg ist ein Anhang aus einer
-- fremden E-Mail von einem, den der Benutzer selbst eingetragen hat, nicht mehr
-- zu unterscheiden. Die Rückfrage vor dem Öffnen verliert damit den Satz aus
-- A-A-85 („Diese Datei stammt aus einer E-Mail von …") — sie behauptet nichts
-- Falsches, aber sie sagt weniger, als sie wissen könnte.
--
-- **Die Kennzeichnung „nachgebaut".** Das ist der unangenehmere Verlust, und er
-- gehört an diese Stelle und nicht in einen Bericht: Eine `.eml`, die aus
-- Office.js-Feldern zusammengesetzt wurde, sieht nach diesem Rückweg aus wie
-- die ursprüngliche Nachricht. Sie trägt keine Kopfzeilen, kein DKIM, kein
-- S/MIME und keine Empfangsstempel — und niemand sieht ihr das an. Genau
-- diesen Zustand schließt A-19.22b aus, und der Rückweg stellt ihn wieder her.
--
-- **Der Anzeigename.** Danach heißen die übernommenen Dateien so, wie sie auf
-- der Platte heißen: `<32 Hexziffern>.<endung>`. Der Name aus der E-Mail steht
-- an keiner zweiten Stelle, und die Anhangsliste ist eine Liste von
-- Hexziffern. Die Dateien selbst bleiben vollständig und öffnen sich weiter.
--
-- **Die Dateien bleiben liegen.** Wie beim Rückweg von 0015: SQL kennt kein
-- Dateisystem. Ohne die Spalte `origin` kann danach niemand mehr sagen, welche
-- Datei im Anwendungsdatenverzeichnis SuperTakt selbst geschrieben hat und
-- welche dem Benutzer gehört — das Aufräumen verliert seine Bedingung, bevor es
-- die Dateien verliert. Wer diesen Rückweg fährt, räumt den Ordner von Hand;
-- er liegt neben `takt.db` und heißt `email-attachments`.
--
-- ===========================================================================
-- Was NICHT betroffen ist
-- ===========================================================================
--
-- Jeder Anhang bleibt stehen: Kennung, Art, Titel, Ziel, Stelle, Zeitpunkt.
-- `todo_attachment_kind`, `ix_todo_attachment_todo` und
-- `ix_todo_attachment_image` bleiben unberührt, ebenso `todo` selbst und alles,
-- was daran hängt. Keine Sicht und kein Trigger außerhalb dieser Tabelle nennt
-- eine der vier Spalten — insbesondere `v_export_candidate` nicht, und das ist
-- keine Fügung, sondern A-19.17.

DROP INDEX IF EXISTS ix_todo_attachment_email;

ALTER TABLE todo_attachment DROP COLUMN rebuilt;
ALTER TABLE todo_attachment DROP COLUMN display_name;
ALTER TABLE todo_attachment DROP COLUMN origin_sender;
ALTER TABLE todo_attachment DROP COLUMN origin;
