Aufgabe: T-414 — Gegenprobe Spezifikation/UX zu T-398c (Add-in-Nacharbeit, Welle 18)
Status: fertig
Artefakte: nur dieser Bericht (nichts geändert, nichts committet)
Zusammenfassung: Die neuen Sätze passen zu A-10.11, A-10.12, A-10.13 und A-10.16. Jeder ist an den
Zweig gebunden, für den er stimmt. Nach E-078 Punkt 3 stimme ich der Ersetzung von SP-A-27/28
und der alten Fehlschlag- und Knopfsätze zu. Offen sind vier nicht blockierende Punkte:
Prüf-Prosa zu SP-A-27/28, die noch den T-247-Zweig beschreibt, doppelte Wiederholungssätze im
Fall „möglicherweise gespeichert“, ungleiche Nennung der Call-Nummer im Statussatz und
verstreute Texte an berührten Stellen.
Prüfung: Gelesen wurden `texts.ts`, `DuplicateOffer.tsx`, `create-gate.ts`, `TaskPane.tsx`
(Zustände, Knopf, `Failure`, Abbruch), `api/client.ts:215-230`, `proof-addin.mjs` 5b und 20,
spec A-10.11 bis A-10.17 sowie E-133 und E-134. Nichts wurde ausgeführt: kein Rendern und kein
proof-Lauf. Die Zustände habe ich am Quelltext nachvollzogen.

## Zustände, am Code nachvollzogen

| Zustand | target | Knopf | Sperrgrund | Hinweis |
|---|---|---|---|---|
| kein Treffer | auto | Neues Todo anlegen | – | Formular sichtbar |
| genau ein Treffer | {todoId} automatisch (TaskPane:265) | E-Mail an Todo anhängen | – | A-10.11 „ergänzt die vorhandene“ erfüllt |
| mehrere, keine Wahl | auto | E-Mail an Todo anhängen, gesperrt | „Mehrere Todos passen. Bitte eines auswählen.“ | A-10.11 „verlangen Auswahl“ erfüllt |
| mehrere, gewählt | {todoId} | E-Mail an Todo anhängen | – | |
| „Stattdessen neues Todo anlegen“ | new | Neues Todo anlegen | – | Formular sichtbar, Anhangssatz ausgeblendet, Rückweg über Radiowahl bleibt (A-10.16) |

## Urteile je Satz (E-078 Punkt 3)

S-1  `failureNothingCreated` „Es ist kein Todo entstanden.“ — **freigegeben.** SP-A-32 bleibt
     zeichengleich und steht nur noch im sicheren Anlegen-Zweig. Der Widerspruch zu „kann
     bereits gespeichert sein“ ist damit beseitigt.

S-2  `failureNothingAppended` „Die E-Mail wurde nicht angehängt.“ — **freigegeben.** Erfüllt
     E-133.4 und A-10.16. Gebunden an `submittedAppending`, also an den Zweig, der tatsächlich
     abgeschickt wurde, und nicht an einen später geänderten Stand.

S-3  `failureCreateUnknown` und `failureAppendUnknown` („Ob … lässt sich hier nicht feststellen.
     Ein erneuter Versuch … nicht doppelt …“) — **freigegeben.** Die Zusage stützt sich auf
     A-10.13 (persistente Anfragekennung). `requestId` bleibt über den Fehlschlag hinweg
     bestehen und wird nur bei Mailwechsel und „Noch einmal“ neu gesetzt. Damit stimmt die
     Zusage. Die Fälle unreachable, request_timeout, transfer_interrupted und catch decken sich
     mit denen, in denen der Client „kann bereits gespeichert sein“ sagt.

S-4  `cancelledCreate` und `cancelledAppend` — **freigegeben.** Abbrechen ist nur während des
     Sammelns möglich, also vor `saveMail`. „nicht angehängt“ und „kein Todo entstanden“ sind
     deshalb sicher wahr.

S-5  Knopf „E-Mail an Todo anhängen“ bei mehreren Treffern und Sperrgrund `target_choice` —
     **freigegeben.** Der Knopf verspricht keine Neuanlage mehr, die er nicht ausführen würde.
     Der Grund kommt aus derselben Rechnung wie die Sperre. Die Reihenfolge Call-Nummer →
     Auswahl → Titel folgt der Lesereihenfolge. Die Nebenbedingung, der Knopf ohne Grund, ist
     entfallen.

S-6  Statussätze `offerFoundOne` und `offerFoundMany` — **freigegeben**, mit Y-3. Die
     Live-Region ist im Trefferfall nicht mehr stumm. Sie steht dauerhaft im Baum (Y-04 aus
     T-247 bleibt erfüllt).

S-7  SP-A-27/28, neu: „Das Ergänzen erfasst keine Zeit“ / „und lässt erledigte Todos
     erledigt.“ hinter „Die E-Mail wird als Anhang am ausgewählten Todo gespeichert.“ —
     **freigegeben, Zustimmung zur Ersetzung erteilt.** Begründung: Nach A-10.11 und A-10.16
     gibt es den Anhänge-Zweig wieder. Der Satz steht nur dort (`target !== 'new'`) und sagt
     genau, was A-10.12 zusichert: keine Änderung an Erledigt, Timer oder Zeitbuchungen. Die
     Bedingung aus T-247 Y-02 bleibt erfüllt: Die Aussage ist an den Zweig gebunden, für den
     sie stimmt. Das T-247-Problem („vorhandenes Todo in SuperTakt bearbeiten“ neben „keine
     Zeit“) tritt nicht wieder auf. Der Leitbegriff „Todo“ entspricht E-133.2.

## Befunde

Y-1  A-10.16/SP-A-27/28  `proof-addin.mjs`  **nicht blockierend, Nacharbeit
     integration-dev.** Die Prüf-Prosa beschreibt noch den T-247-Zweig. `GESPERRTE_TEXTE[SP-A-27].grund`
     (Z. 7513-7515: „das **neue** Todo erfasst keine Zeit auf dem vorhandenen“),
     `[SP-A-28].grund` (Z. 7523-7524: „durch das Anlegen des neuen“), der Kopf von Abschnitt 20
     (Z. 7459-7477: „bindet sie an … das **neue** Todo“) und 5b Y-02 (Z. 1481-1488) begründen
     die Sperre mit dem Gegenteil dessen, was der Satz heute sagt. Die Verletzungsproben „Ein
     neues Todo steht daneben“ und „ändert daran nichts.“ sind keine plausible Kürzung des
     neuen Wortlauts mehr. Der Kopf von 5b nennt noch A-10.9.
     Vorschlag: Grund auf A-10.12 umstellen („Ergänzen ändert Erledigt, Timer und Buchungen
     nicht“). Verletzungsproben wählen, in die der neue Satz tatsächlich abrutschen würde,
     etwa „Das Ergänzen erfasst keine Zeit.“ ohne SP-A-28 oder „und öffnet erledigte Todos
     wieder.“. Kopf 5b auf A-10.11 und A-10.16 umstellen.

Y-2  A-10.13  TaskPane `Failure` (Fall „möglicherweise gespeichert“)  **nicht blockierend.**
     Drei Sätze sagen hintereinander fast dasselbe. Der Titel aus dem Client oder dem catch
     lautet „… kann bereits gespeichert sein; bitte mit denselben Eingaben erneut versuchen“
     bzw. „… erneutes Senden verwendet dieselbe Kennung“. Darauf folgt `failure*Unknown`
     („… Ein erneuter Versuch … nicht doppelt …“) und dann „Die Eingaben bleiben stehen. Ein
     neuer Versuch ist möglich.“. Das widerspricht sich nicht, ist aber redundant.
     Vorschlag: Bei `maybeSaved` den Zusatz über erneutes Senden aus dem Titel nehmen, damit
     `failure*Unknown` allein trägt.

Y-3  A-10.11  `DuplicateOffer.tsx:17-18`  **nicht blockierend.** Ohne Treffer nennt der Satz
     die Nummer („Zu Call <X> gibt es noch kein Todo.“), mit Treffer nur „Zu dieser
     Call-Nummer …“. `duplicateNotice` liefert bei einem Treffer `callNumber`, und 5b sichert
     zu: „bei einem Treffer nennt die Überschrift die Nummer“. Die Oberfläche nutzt diesen Wert
     nicht. Wer nur die Live-Region hört, erfährt nicht, für welche Nummer der Treffer gilt.
     Vorschlag: Bei einem Treffer die Nummer nennen, etwa als Bündelschlüssel mit Platzhalter
     oder mit `<Foreign>`, gleich wie im Fall ohne Treffer.

Y-4  E-118  verstreute Texte an Stellen, die T-398c berührt hat  **nicht blockierend.**
     `DuplicateOffer.tsx:17` („Zu Call … gibt es noch kein Todo.“), `:28` („ · Erledigt“,
     „Call“) und `TaskPane.tsx:436` (catch-Meldung) stehen außerhalb von `TEXTS`. Diese Stellen
     hat der Auftrag geändert, deshalb gilt die Ausnahme für den Altbestand hier nicht.
     Vorschlag: In `TEXTS` übernehmen.

Y-5  A-10.11 ↔ A-10.17  `docs/spec.md:571-572`  **Widerspruch in der Spezifikation, nicht
     blockierend für T-398c.** A-10.11 nennt noch einen Funktionsbefehl „Schnell in Inbox“.
     A-10.17 ersetzt den Schnellbefehl, und E-134.2 hat ihn gestrichen. Der Code folgt A-10.17
     und E-134.
     Vorschlag: Orchestrator bzw. documenter ziehen A-10.11 nach (siehe T-398c, offene Frage 5).

Y-6  Terminologie  **Beobachtung.** Für dieselbe Handlung stehen „anhängen“ (Knopf, Abschnitt)
     und „ergänzen“ (Option, SP-A-27, Ansagesatz) nebeneinander. Beide Wörter stehen auch in
     der Spezifikation (A-10.11 „ergänzt“, A-10.16 „hängt … an“). Das ist tragbar; eine
     Vereinheitlichung ist Sache des Textbestands.

Y-7  `docs/design/textbestand-aufgabenbereich.md:21-22`  **Board Y-09, bereits offen.** Dort
     stehen SP-A-27/28 noch im Wortlaut aus PR #15. Nach dieser Ersetzung weichen sie doppelt
     ab. Nacharbeit durch ux-designer.

## Urteil

**freigegeben** (T-398c, Spezifikations- und UX-Teil). Kein Befund blockiert. Zustimmung nach
E-078 Punkt 3 zur Ersetzung von SP-A-27/28 und der alten Fehlschlag-, Abbruch- und Knopfsätze:
**erteilt**. Y-1 sollte in derselben Folgewelle behoben werden wie die e2e-Namen, weil sonst die
Begründung einer Sperre ihrem eigenen Satz widerspricht.

Annahmen: Das Verhalten des Dienstes bei der Anfragekennung entspricht A-10.13. Ob eine
Wiederholung mit geändertem Ziel (target) dieselbe Antwort wiedergibt, habe ich nicht am Dienst
geprüft.
Risiken: keine neuen. Mit dem Schnellbefehl ist der Weg ohne Auswahl entfallen (E-134.2).
Offene Fragen: keine.
Nächster Schritt: Y-1 bis Y-4 als kleine Folgeaufgabe für integration-dev. Y-5 an den
Orchestrator bzw. documenter, Y-7 an den ux-designer.
