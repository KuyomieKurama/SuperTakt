# T-304 — die Naht zwischen Aufgabenbereich und Anlegetür

Aufgabe: T-304 — Anhänge aus der E-Mail fahren im Anlegeruf mit (A-19.22 bis A-19.33, E-108)
Rolle: integration-dev · Stand des Berichts: 2026-09-12 · **nachgereicht**

> **Warum dieser Bericht zwei Aufgaben zu spät kommt.** Der Lauf von T-304 brach an einem
> Ausgabenlimit ab, nachdem die Arbeit im Baum stand, aber bevor der Bericht geschrieben war.
> Der code-reviewer mußte die schwerste Einzeländerung der Welle aus Quelltextkommentaren
> erschließen (T-307 Befund 15). Was unten steht, ist **am Quelltext gelesen und neu gemessen**,
> nicht aus der Erinnerung geschrieben; wo ich einen Stand von damals nicht mehr belegen kann,
> steht das dabei.

## Artefakte

| Datei | Was daran T-304 ist |
|---|---|
| `apps/local-api/src/routes/addin/schema.ts` | `emailAttachmentItemSchema`, `emailAttachmentsSchema` und das Feld `attachments` in `createTodoSchema`; die vier Transportdeckel (`ADDIN_ATTACHMENTS_MAX`, `…_NAME_MAX_LENGTH`, `…_BASE64_MAX_LENGTH`, `…_SENDER_MAX_LENGTH`), jeder **aus** der Fachgrenze gerechnet |
| `apps/local-api/src/routes/addin/service.ts` | `AddinDeps.emailAttachments`, `toEmailIntake`, die Verschachtelung von `createTodo` um `createTodoOnly`, `AddinCreatedAttachments` |
| `apps/local-api/src/routes/addin/index.ts` | die Route reicht `parsed.data.attachments` durch, ohne Zusicherung und ohne Todo-Kennung |
| `apps/outlook-addin/src/api/client.ts` | `CreateTodoRequest.attachments`, `ATTACHMENTS_TRAVEL_WITH_CREATE = true` |
| `apps/outlook-addin/src/api/types.ts` | `AddinContextDto.emailAttachments.accepted`, `CreatedAttachmentsDto` |
| `apps/outlook-addin/src/attachments/model.ts` | `TAKEOVER_LIMITS` aus `@takt/domain`, `WireSkipReason` = Liste der Domäne |
| `apps/outlook-addin/src/attachments/reasons.ts` | Sätze in Kleinschreibung hinter dem Gedankenstrich, Kurzformen nennen die gerissene Grenze |
| `apps/outlook-addin/src/ui/TaskPane.tsx` | der Grund einer Abweisung kommt vom Dienst statt festem `rejected`; die Vorschau hängt an beiden Bedingungen |
| `apps/outlook-addin/scripts/proof-addin.mjs` | Abschnitt 18/18d von **Namen** auf **Wirkung** umgebaut, echter Anhangsspeicher im zusammengesetzten Dienst |

## Zusammenfassung

Die Anhänge fahren im **Rumpf des Anlegerufs** mit und nicht über eine eigene Tür. Der
Aufgabenbereich sammelt vollständig lokal, schickt genau einmal, und der Dienst legt die
Anhänge **um** den Anlegevorgang herum an: `createTodo` ruft `deps.emailAttachments(intake,
create)` und reicht als `create` genau die Funktion hinein, die das Todo anlegt. Die Fähigkeit
bekommt damit **keine Todo-Kennung**, sondern die Funktion, die eine erzeugt — sie sieht die
Kennung erst, nachdem sie das Anlegen selbst ausgelöst hat. Das ist die Umsetzung von
A-A-21′ (b)/(c) und der Grund, warum A-19.19 unangetastet bleibt: Es gibt unter `/addin`
keinen Weg, der eine fremde Kennung entgegennimmt und eine Datei ablegt.

Die zweite Hälfte ist die **Naht**. `createTodoSchema` ist ein `z.object`, und ein `z.object`
streicht unbekannte Felder **still**. Ein Add-in, das Anhänge schickt, gegen eine Tür, die das
Feld nicht liest, verlöre sie lautlos, während auf dem Bildschirm „3 Anhänge hängen daran"
stünde — der stille Ausfall aus A-19.31 in seiner unangenehmsten Form. `ATTACHMENTS_TRAVEL_WITH_CREATE`
ist deshalb keine Voreinstellung, sondern die Stelle, an der dieser Zusammenhang **gemessen**
wird: `proof:addin` Abschnitt 22 hält die Konstante und das Feld im Quelltext der Tür
gegeneinander, in beide Richtungen.

Dazu drei kleinere Verschiebungen, alle in dieselbe Richtung: **Grenzen und Gründe kommen aus
`packages/domain`**, nicht aus der Antwort des Dienstes und nicht aus einer zweiten Liste im
Add-in. Über die Leitung kommt vom Dienst nur noch, **daß** er Anhänge annimmt
(`emailAttachments.accepted`) — das kann kein Paket wissen, weil Add-in und Dienst getrennt
installiert werden.

## Annahmen, die ich ohne Rückfrage getroffen habe

1. **`emailAttachments.accepted` als zweite Bedingung vor jeder Fläche.** Ohne sie sammelte ein
   neues Add-in gegen einen alten Dienst dreißig Sekunden lang ins Leere. Ein Text, der eine
   Handlung nennt, die es nicht gibt, ist derselbe Fehler wie ein fehlender Satz (E-100 Punkt 3).
2. **Die Transportdeckel liegen über den Fachgrenzen, nicht auf ihnen.** Läge der Deckel des
   Schemas auf 25 MB, bekäme der Benutzer ein `422` über die ganze Anfrage statt eines Todos mit
   einer namentlich gemeldeten Datei — A-19.29 verlangt das Gegenteil.
3. **Die zweite `message` im Umschlag wird eine gewöhnliche Datei** (`toEmailIntake`). Sie fallen
   zu lassen wäre der stille Ausfall; sie als Nachricht zu behandeln hieße, `rebuilt` an zwei
   Dateien zu schreiben.
4. **`failed` reist nicht mit** (`toEmailIntake` setzt es leer). Was der Aufgabenbereich selbst
   nicht übernehmen konnte, zeigt er selbst — und er hatte damals dafür feinere Gründe als der
   Dienst. *(Dieser Grund ist mit T-309/T-310 entfallen: Die Gründe sind jetzt dieselben. Die
   Entscheidung trägt trotzdem weiter, denn ein Fehlschlag, der nie beim Dienst ankam, hat dort
   nichts zu suchen.)*

## Risiken, die ich damals gesehen habe — und was aus ihnen geworden ist

| Damals benannt | Stand heute |
|---|---|
| Die Rumpfgrenze der Route (64 MB) steht in der Kette **vor** `authGuard` | offen, gehört dem security-checker (auch T-307 nennt es) |
| Der Abgleich der Antwort über den **Anzeigenamen** | **war ein Fehler** — T-307 Befund 2, behoben in T-310 (`attachments/reconcile.ts`) |
| `stored` aus der Antwort wird nicht gelesen | **war ein Fehler** — T-307 Befund 3, behoben in T-310 |
| Zwei Zählweisen für dieselbe Zahl (Vorschau zählt nur Dateien, Tür alles) | offen, T-308 F-5 |

## Was ich **nicht** gemessen habe

- Den Weg von Office.js in die Nutzlast. Daß `getAsFileAsync` wirklich EML liefert und
  `isSetSupported('Mailbox','1.14')` auf einem echten Wirt das Erwartete sagt, ist ungeprüft; es
  braucht einen Windows-Rechner mit Outlook.
- Die Anzeige der übernommenen Anhänge in `apps/web`. Sie liegt außerhalb meiner Hoheit; T-302
  hat sie von Hand gesehen, ein Wächter dafür fehlte (T-308 Abschnitt 2, inzwischen in Arbeit
  beim e2e-tester).

## Offene Fragen an den Orchestrator

1. Die Abweisung der fünf Umleitungsendungen (`.lnk .url .pif .scf .desktop`) war in T-299
   gesetzt und in T-304 nicht angetastet. Sie ist seit dem 2026-09-12 als **A-19.23c** gedeckt —
   damit erledigt.
2. Die Summen- und Anzahlgrenze sind seit dem 2026-09-12 als **A-19.30a** gedeckt — damit
   erledigt.

## Nächster Schritt

Keiner mehr aus T-304 selbst. Die drei Befunde, die aus dieser Aufgabe stammen, sind in T-310
geschlossen (Abgleich, `stored`, Ansage); die beiden offenen Punkte oben liegen bei
security-checker und e2e-tester.
