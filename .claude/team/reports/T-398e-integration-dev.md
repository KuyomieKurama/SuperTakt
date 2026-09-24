Aufgabe: T-398e — kleine Nachträge aus T-414 (Y-1 bis Y-4)
Status: braucht Review
Artefakte:
- apps/outlook-addin/scripts/proof-addin.mjs (5b Kopf und Notiz, Abschnitt 20 Kopf, SP-A-27/28 `grund` und `verletzung`)
- apps/outlook-addin/src/ui/texts.ts (neue Schlüssel)
- apps/outlook-addin/src/ui/DuplicateOffer.tsx
- apps/outlook-addin/src/ui/TaskPane.tsx

Zusammenfassung: Die Texte zur Prüfung von SP-A-27/28 begründen die Sperre jetzt mit A-10.12. Die Sätze stehen nur bei `target !== 'new'`. Der Kopf von 5b nennt A-10.11 und A-10.16 statt A-10.9. Der Statussatz bei einem Treffer nennt die Call-Nummer. Die verstreuten Texte aus DuplicateOffer und aus dem catch-Zweig stehen jetzt im Bündel. Im Fall „möglicherweise gespeichert“ entfällt die doppelte Aufforderung zum erneuten Versuch.

Einzelpunkte:
- Y-1: Der neue `grund` stützt sich auf A-10.12. Neue Verletzungsproben: SP-A-27 → „Das Ergänzen bucht nichts“, SP-A-28 → „und ändert sonst nichts.“. Das sind mögliche Kürzungen des heutigen Satzes. Die Gegenprobe in Abschnitt 20 findet beide einzeln. Die neu geschriebene Kommentarprosa ist englisch. Die Meldungstexte der Prüfung bleiben wie im übrigen Bestand deutsch.
- Y-2: Der dritte Satz lautet bei `maybeSaved` nur noch „Die Eingaben bleiben stehen.“ (`failureInputsKept`). Sonst bleibt er unverändert: „… Ein neuer Versuch ist möglich.“ (`failureInputsKeptRetry`). Der Titel im catch-Zweig lautet nur noch „Die Übernahme ist fehlgeschlagen.“ (`failureUnexpected`). Alle drei Zusagen aus S-3 bleiben erhalten: „kann gespeichert sein“ (Titel bzw. `failure*Unknown`), „kein Duplikat bei Wiederholung“ (`failure*Unknown`) und „die Eingaben bleiben stehen“.
- Y-3: Bei einem Treffer lautet der Statussatz jetzt „Zu dieser Call-Nummer (<Nummer>) gibt es ein passendes Todo.“. Die Nummer steht wie im Fall ohne Treffer in `<Foreign>`. Die Schlüssel `offerFoundOneBefore`/`After` ersetzen `offerFoundOne`.
- Y-4: `offerNoneBefore`/`After`, `offerOptionCall` und `offerOptionDone` sind neu im Bündel, dazu `failureUnexpected` für den catch-Zweig.

Prüfung:
- E-087-Suche über `git grep` sowie `apps/*/src`, `packages/*/src`, `tests/`, `apps/*/test` und `apps/*/scripts` nach allen geänderten Wortlauten. In `tests/` und in den Prüfskripten gibt es keinen Treffer. Die Suche nach dem vollen Satz hat allerdings `apps/outlook-addin/test/api/client.test.ts:26,57` übersehen. Dort wird der Teilstring „bereits gespeichert“ geprüft. Erst vitest hat das aufgedeckt, siehe Annahmen.
- `pnpm --filter @takt/outlook-addin run typecheck`: fehlerfrei.
- `pnpm run proof:addin`: 283 bestanden, 0 fehlgeschlagen.
- `vitest run apps/outlook-addin`: 5 Dateien, 43 Tests grün.
- Nicht geprüft: `pnpm test:e2e` und `pnpm check` insgesamt.

Annahmen:
- Y-2 ist nur teilweise nach dem Vorschlag des Reviewers umgesetzt. Den Hinweis auf erneutes Senden im Titel des Clients (`retryNote` in `client.ts`) habe ich zuerst entfernt und dann wieder eingesetzt. `client.test.ts` (unit-tester) hält ihn ausdrücklich fest („preserves the warning about a possibly completed write“). Die Redundanz ist geringer, aber nicht ganz beseitigt: Titel und `failure*Unknown` sprechen beide vom erneuten Versuch.
- Der Fall mit mehreren Treffern nennt die Nummer weiterhin nicht. `duplicateNotice` liefert dort `null`, so wie 5b es zusichert.

Risiken: keine neuen. Keine echten Call-Nummern verwendet.

Offene Fragen:
1. Orchestrator/unit-tester: Soll `retryNote` aus dem Client fallen, damit bei `maybeSaved` allein `failure*Unknown` trägt? Das ist der Vorschlag aus Y-2. Dann müssen `client.test.ts:26,57` angepasst werden.
2. `apps/outlook-addin/src/duplicate/notice.ts` beschreibt im Dateikopf noch die Lage nach A-10.9 („kein Knopf, keine Vorauswahl“). Der Kommentar ist nicht Teil von Y-1. Soll ich ihn in einer Folgeaufgabe nachziehen?

Nächster Schritt: Freigabe durch den spec-ux-reviewer für die neuen Bündelsätze (Y-2, Y-3) und die neuen Verletzungsproben. Danach offene Frage 1 entscheiden.
