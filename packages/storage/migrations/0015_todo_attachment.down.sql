-- Takt — Migration 0015 "todo_attachment", Rückwärtsrichtung
--
-- Reihenfolge wie in 0001: von den Blättern zur Wurzel. `todo_attachment`
-- verweist auf `todo_attachment_kind`, also fällt es zuerst.
--
-- ===========================================================================
-- Was dabei verloren geht — benannt und nicht verschwiegen
-- ===========================================================================
--
-- **Jeder Anhang.** Verweise und Dateipfade sind danach weg; sie waren
-- Zeichenketten, und es gibt keinen zweiten Ort, an dem sie stünden.
--
-- **Und die Bildkopien bleiben liegen.** Das ist der Teil, der genannt gehört:
-- Die Dateien im Bildverzeichnis des Anwendungsdatenverzeichnisses verschwinden
-- durch diesen Rückweg **nicht**. SQL kennt kein Dateisystem, und ein Rückweg,
-- der Dateien löschte, täte etwas, das man ihm nicht ansieht.
--
-- Damit bleibt nach diesem Rückweg Kundenmaterial ohne Eigentümer liegen —
-- genau der Zustand, den A-A-18 im laufenden Betrieb ausschließt. Wer diesen
-- Rückweg fährt, räumt das Bildverzeichnis von Hand; es liegt neben `takt.db`
-- und heißt `attachments`. Der Satz steht hier, weil er sonst niemandem
-- auffiele, bis jemand die Datenmenge erklären soll.
--
-- ===========================================================================
-- Was NICHT betroffen ist
-- ===========================================================================
--
-- `todo` selbst, seine Tags, seine Buchungen, sein Vermerk, sein Exportstatus.
-- Keine Sicht, kein Trigger und kein CHECK außerhalb dieser beiden Tabellen
-- nennt sie — insbesondere `v_export_candidate` nicht, und das ist keine
-- Fügung, sondern A-19.17.

DROP INDEX IF EXISTS ix_todo_attachment_image;
DROP INDEX IF EXISTS ix_todo_attachment_todo;

DROP TABLE IF EXISTS todo_attachment;
DROP TABLE IF EXISTS todo_attachment_kind;
