# T-192 — e2e-tester

**Aufgabe:** T-192 — Welle AC: ein Torwächter, der nicht gemessen ist (O-GZ), und ein Wortlaut,
der zwei Hoheiten blockiert (O-GE); dazu, wenn Zeit bleibt, der Fall zur Bauart der Live-Region.

**Status:** fertig

---

## Artefakte

| Datei | Was daran geändert wurde |
|---|---|
| `tests/e2e/export-audit-and-locks.spec.ts` | Neuer Fall O-GZ: Klick auf den gesperrten `aria-disabled`-Bestätigungsknopf beim Zurücksetzen — Meldung erscheint, Gegenprobe (Handlung läuft nicht), dann der Weg mit Begründung (Handlung läuft) |
| `tests/e2e/outlook-addin-build.spec.ts` | O-GE: Vergleich für den `no_item`-Zustand von der wörtlichen Du-Form gelöst, trägt jetzt beide Fassungen (heutig und gesiezt) über einen anredefreien Teilstring |
| `tests/e2e/timer-stop-announcement.spec.ts` | Zusatz zu O-GZ: neuer Fall zur **Bauart** der Meldefläche im Leistungsfeld (`.note__live`) beim Timer-Stopp — erste Hälfte des T-186-Bauplans an einer dritten realen Stelle, mit dokumentierter Grenze |
| `docs/testplan.md` | Neuer Abschnitt 28 (Nachtrag T-192): `TP-EXPST-15`, die O-GE-Auflösung mit erwartetem Wortlaut für integration-dev, und der Bauart-Zusatz — inklusive der Playwright-`force:true`-Falle als dokumentierte Regel, nicht nur als Fallkommentar |

Keine Fixtures nötig — alle Testdaten entstehen wie im übrigen Bestand über `createTodo`/
`createTimeEntry` mit `Date.now()`-Titeln, keine echten Kundendaten.

---

## Zusammenfassung

O-GZ ist jetzt in zwei Hälften gemessen: Der Klick auf den `aria-disabled`-Bestätigungsknopf des
Zurücksetzen-Dialogs (dem Dialog hinter einer möglichen Doppelabrechnung, E-012/R-10) zeigt die
deutsche Meldung „Begründung für das Protokoll fehlt." an **demselben, markierten** Live-Region-
Knoten (Bauplan aus T-186), UND die Gegenprobe belegt, daß der Exportstatus dabei unverändert
bleibt — vorher gab es nur eine Meldung ohne die Kontrolle, daß nichts passiert. Der Klick brauchte
tatsächlich `{ force: true }`, exakt wie von T-186 vorhergesagt; das ist jetzt in Testplan und
Fallkommentar festgehalten, nicht nur erlebt. Für O-GE trägt der Prüffall jetzt beide Anredeformen
über einen von „Öffne"/„Öffnen Sie" unabhängigen Teilstring, und der Bericht nennt den erwarteten
Wortlaut für integration-dev. Als dritten Punkt habe ich versucht, den von T-186 vorgeschlagenen
vollen Bauplan-Fall am Timer-Stopp zu bauen, und dabei einen echten Befund gemacht statt ihn zu
verschweigen: Die Leistung ist dort strukturell nie fehlerhaft befüllbar; gemessen wird deshalb nur
die erste Bauplan-Hälfte, mit klar benannter Grenze. Alle drei Punkte sind gebaut und grün;
`pnpm test:e2e` steht bei 106/106 (99 Hauptreihe, 5 Versionsprüfung, 2 Neustart), keine roten Fälle,
nichts Fremdes zu kennzeichnen.

---

## 1. O-GZ — der Torwächter ist jetzt gemessen

**Datei:** `tests/e2e/export-audit-and-locks.spec.ts`, neuer Fall direkt nach den vier
bestehenden Fällen.

Ablauf: Buchung exportieren → „Exportstatus zurücksetzen" öffnen, Begründung **und**
Kontrollkästchen leer lassen → auf den gesperrten Knopf klicken (`{ force: true }`) → prüfen, daß
(a) derselbe markierte `.field__live`-Knoten jetzt „Begründung für das Protokoll fehlt." trägt und
(b) der Dialog offen bleibt und `exportStatus`/`exportCount` der Buchung **unverändert** sind → erst
danach Begründung eintragen, Kontrollkästchen setzen, ohne `force` klicken → Dialog schließt,
Status wird „offen".

**Playwright-Falle, gemessen und dokumentiert.** Ein normaler `.click()` auf den
`aria-disabled="true"`-Knopf schlägt tatsächlich fehl (Playwright hält ihn für nicht bedienbar);
`{ force: true }` behebt das, ohne die Aussage zu verwässern — es überspringt nur Playwrights
Erreichbarkeitsprüfung, das Klickereignis selbst bleibt echt und durchläuft dieselbe Pipeline wie
ein normaler Klick. Diese Falle steht jetzt in `docs/testplan.md` Abschnitt 28 **und** im
Fallkommentar, wie im Auftrag verlangt.

**Nebenfund beim Bau.** Ein erster Entwurf löschte die zurückgesetzte Buchung am Ende (Aufräumen).
Das schlug mit `422 validation_error` fehl: Eine Buchung mit Exportprotokoll läßt sich über die API
nicht mehr löschen, weil das Protokoll auf sie verweist — dieselbe Regel, aus der `TP-SEC-13` ihre
exportierte Buchung ebenfalls unbereinigt im gemeinsamen Bestand läßt. Ich habe die Löschung
entfernt und die Begründung als Kommentar hinterlassen, statt sie stillschweigend zu übergehen.

**Bauplan aus T-186 gleich mitgemessen.** `toHaveCount(1)` und `toBeEmpty()` auf `.field__live`
unter `.dialog__reason`, bevor geklickt wird; Marke am Knoten; derselbe markierte Knoten trägt
danach den Text. Das ist eine zweite, real erreichbare Stelle dieser Bauart neben der Titelmeldung
des „Neues Todo"-Dialogs aus `field-live-region-announcement.spec.ts`.

---

## 2. O-GE — der Fall trägt jetzt beide Anredeformen

**Datei:** `tests/e2e/outlook-addin-build.spec.ts:65` (jetzt an anderer Zeile durch die
Kommentarerweiterung, Selektor unverändert an der Stelle).

**Was geändert wurde.** `noEmailOpen` sucht nicht mehr nach dem vollen Satz „Öffne eine E-Mail, um
daraus ein Todo anzulegen.", sondern nach dem Teilstring „eine E-Mail, um daraus ein Todo
anzulegen." — der ist in der heutigen Du-Form **und** in der vorgesehenen, gesiezten Fassung
wörtlich identisch enthalten. Der Fall hängt damit an keiner Anrede mehr, dieselbe Bauart wie O-GJ
aus T-187 (Teilzeichenkettenvergleich statt vollem Satz, dort mit einer internen Kennung statt
einer Anrede).

**Der erwartete Wortlaut für integration-dev, ohne Rückfrage:**

> **„Öffnen Sie eine E-Mail, um daraus ein Todo anzulegen."**

Das ist die minimale Änderung (`Öffne` → `Öffnen Sie`), erhält die Aussage vollständig und bleibt
unter dem hier geänderten Prüffall grün. Ich habe bewußt **nicht** die von integration-dev in
T-190 (Offene Frage 1) als Alternative genannte, vollständig umformulierte Fassung ohne Anrede
(„Für ein Todo aus einer E-Mail muß eine E-Mail geöffnet sein.") empfohlen: Der Auftrag zu dieser
Aufgabe spricht ausdrücklich von „die heutige und die gesiezte" Fassung, also der direkten
Sie-Form desselben Satzes, nicht von einer dritten, neuen Formulierung. Sollte der Orchestrator die
anredefreie Alternative bevorzugen, trägt mein Fall auch sie *nicht* automatisch (der Teilstring
„eine E-Mail, um daraus ein Todo anzulegen." kommt darin nicht mehr vor) — das wäre dann eine
erneute, bewußte Entscheidung mit eigener Fallanpassung, keine, die sich aus dieser Aufgabe von
selbst ergibt.

**Reihenfolge, wie von integration-dev in T-190 verlangt:** Mit dieser Änderung ist der erste
Schritt („Wortlaut im Prüffall lösen") erledigt. Der zweite (`App.tsx` umstellen) und dritte
(`IMPERATIV_AUSNAHME` in `proof-addin.mjs` löschen) liegen bei integration-dev in der nächsten
Welle. Zur Kontrolle: Mit dem erwarteten Wortlaut „Öffnen Sie …" träfe `ANREDE_IMPERATIV` (Verbstamm
+ optionales `-e`) nicht mehr — „Öffnen" endet auf `-en`, nicht auf `-e` — die Ausnahme würde
dadurch beim Selbstauflösungs-Prüffall aus T-190 rot, wie vorgesehen.

---

## 3. Zusatz zu O-GZ — die Bauart der Live-Region an einer dritten Stelle, mit einer ehrlichen Grenze

**Datei:** `tests/e2e/timer-stop-announcement.spec.ts`, neue `describe`-Gruppe am Dateiende.

T-186 hatte für die Meldefläche des Leistungsfeldes (`NoteField`, `.note__live`) genau diesen
Bauplan verlangt und den Timer-Stopp als natürlichen Ort benannt. Beim Bau habe ich vor dem Schreiben
des Falls nachgesehen (E-087), ob der Übergang „leer → befüllt" dort überhaupt real auslösbar ist,
und einen echten Befund gemacht: **Nein.** `NoteField.error` wird im gesamten Produkt nirgends an
ein `NoteField` mit `scope="billing"` gereicht — weder am Timer-Stopp (`TimerContext.tsx`, die
Leistung ist dort ausdrücklich frei, `BILLING_NOTE_MAY_BE_EMPTY`) noch bei „Zeit von Hand erfassen"
(`BookingDialogs.tsx`). Einzig die Musterseite (`showcase/NotesSection.tsx:135`) zeigt den
Fehlerzustand — dort aber fest verdrahtet beim Rendern, ohne Übergang, also für den Bauplan
ungeeignet.

**Entscheidung, im Fall und im Testplan benannt.** Statt den vollen Bauplan über einen erfundenen
Fehlerweg zu erzwingen (das würde einen Vorgang prüfen, den es im Produkt nicht gibt), mißt der neue
Fall nur die **erste** Hälfte: `.note__live[role="alert"]` existiert mit `toHaveCount(1)` und ist
`toBeEmpty()`, sobald der Stopp-Dialog erscheint — bevor er überhaupt etwas zu melden hätte. Das
schließt den Defekt „Live-Region entsteht mit ihrem Inhalt" an dieser dritten, real erreichbaren
Stelle strukturell aus, ohne den — hier nicht vorhandenen — Übergang zeigen zu können. Die Marke
bleibt am Knoten stehen (mit Kommentar), falls ein späterer Auftrag `NoteField.error` dort einmal
wirklich verdrahtet.

Diese Grenze ist ein Befund für den Orchestrator/frontend-dev, keine Behebung meinerseits
(`apps/web/**` ist nicht meine Dateihoheit): Wenn die Leistung beim Timer-Stopp tatsächlich nie eine
eigene Feldmeldung zeigen kann, ist die ausführliche Live-Region-Bauart dort zwar korrekt gebaut,
aber ohne praktischen Nutzen an dieser Stelle — das könnte ein Hinweis sein, daß entweder (a) ein
Validierungsfall fehlt, den es geben sollte, oder (b) T-186s Ortsvorschlag für den vollen Bauplan
besser auf eine andere, tatsächlich validierte `NoteField`-Instanz zeigen sollte.

---

## Nachweis

| Lauf | vorher (laut Auftrag) | nachher |
|---|---|---|
| `pnpm run typecheck:e2e` | (nicht genannt) | **0 Fehler** |
| `pnpm test:e2e` (Hauptreihe) | 97 | **99** (+2: O-GZ, Bauart-Zusatz) |
| `pnpm test:e2e` (Versionsprüfung) | 5 | **5** (unverändert) |
| `pnpm test:e2e` (Neustart) | 2 | **2** (unverändert) |
| `pnpm test:e2e` gesamt | 104/104 | **106/106**, 0 rot |
| `playwright.outlook-build.config.ts` (separat, nicht Teil von `pnpm test:e2e`) | 2/2 | **2/2**, unverändert grün gegen den heutigen Wortlaut |

Vollständiger Lauf von `pnpm test:e2e` (frisch gestartet, alle drei Teilläufe):

```
Running 99 tests using 1 worker
… 99 passed (2.4m)

Running 5 tests using 1 worker
… 5 passed (48.5s)

Running 2 tests using 1 worker
… 2 passed (2.9s)
```

`grep -c "✓"` über den vollständigen Lauf: **106**. `grep -c "✘"`: **0**. Keine roten Fälle — nichts
aus der laufenden Arbeit von frontend-dev war in diesem Lauf zu kennzeichnen; der komplette Bestand
war zum Zeitpunkt dieses Laufs grün.

Isoliert zusätzlich gefahren (zur Eingrenzung während des Baus, nicht als Ersatz für den
Gesamtlauf): `export-audit-and-locks.spec.ts` 5/5, `timer-stop-announcement.spec.ts` 6/6,
`outlook-addin-build.spec.ts` 2/2 — alle drei danach im Gesamtlauf erneut bestätigt.

`pnpm test` und `pnpm typecheck` (gesamt) habe ich nicht erneut gefahren: Diese Aufgabe hat keine
Zeile Produktivcode berührt, nur Prüffälle und Dokumentation, und `typecheck:e2e` allein deckt die
einzige Schicht ab, die ich verändert habe.

---

## Annahmen

1. **Der erwartete Wortlaut für O-GE ist die direkte Sie-Form, keine Neuformulierung.** Begründet
   im Auftragstext („die heutige und die gesiezte" Fassung) — siehe Abschnitt 2 oben. Falls der
   Orchestrator stattdessen die anredefreie Alternative aus T-190 (Offene Frage 1) will, ist das
   eine neue Entscheidung, die meinen Fall nicht automatisch mitträgt.
2. **Beim O-GZ-Fall wird gleichzeitig Begründung und Kontrollkästchen leer gelassen**, statt gezielt
   nur eines der beiden. Das ist bewußt einfacher: `confirmOrExplain` setzt `reasonTouched` in
   jedem gesperrten Fall, unabhängig davon, welche der beiden Bedingungen den Torwächter auslöst
   (siehe Quelltextkommentar in `ConfirmDialog.tsx`) — welche Bedingung genau greift, ist für „die
   Meldung erscheint, die Handlung läuft nicht" nicht von Bedeutung.
3. **Keine Bereinigung der zurückgesetzten Buchung im O-GZ-Fall.** Eine Buchung mit Exportprotokoll
   läßt sich strukturell nicht mehr löschen (gemessen, `422 validation_error`) — dieselbe Grenze wie
   bei `TP-SEC-13`, kein Testfehler.
4. **Der Bauart-Zusatz mißt nur die erste Bauplan-Hälfte am Timer-Stopp**, weil die zweite (Übergang
   zu einem Fehlertext) dort im echten Produkt strukturell nicht auslösbar ist — vor dem Schreiben
   des Falls im Quelltext nachgesehen (E-087), nicht angenommen.

---

## Risiken

- **Klein, O-GE.** Sollte integration-dev einen anderen als den hier genannten Wortlaut wählen (z. B.
  die anredefreie Neuformulierung), bleibt der Prüffall zwar grün, solange „eine E-Mail, um daraus
  ein Todo anzulegen." im Satz vorkommt — bei einer vollständig anderen Formulierung müßte der Fall
  in derselben Welle erneut angepaßt werden. Das ist im Bericht benannt, damit es niemanden
  überrascht.
- **Klein, Bauart-Zusatz.** Der neue Fall in `timer-stop-announcement.spec.ts` zeigt keinen echten
  Fehlerübergang und ist insofern schwächer als sein Vorbild in
  `field-live-region-announcement.spec.ts`. Das ist im Fall, im Testplan und in diesem Bericht
  dreifach benannt, nicht verborgen.
- Keine Sicherheitsrisiken durch diese Aufgabe — reine Testdateien und Dokumentation, keine
  Zugangsdaten, keine echten Kundendaten (alle Titel `E2E-…-${Date.now()}`, erfundene Notiztexte).

---

## Offene Fragen

1. **An den Orchestrator (O-GE):** Gilt der empfohlene Wortlaut „Öffnen Sie eine E-Mail, um daraus
   ein Todo anzulegen." als Zusage für integration-dev, oder soll stattdessen die anredefreie
   Neuformulierung aus T-190 geprüft werden? Mein Fall trägt nur Ersteres ohne weitere Änderung.
2. **An frontend-dev/Orchestrator (Bauart-Zusatz):** Ist es eine bewußte Lücke, daß
   `NoteField.error` für `scope="billing"` im gesamten Produkt nirgends real gesetzt wird (weder
   Timer-Stopp noch „Zeit von Hand erfassen")? Falls nicht, wäre das ein eigener Auftrag, nach dem
   sich dann auch der volle Bauplan-Fall an dieser Stelle nachrüsten ließe.

---

## Nächster Schritt

Für integration-dev: `apps/outlook-addin/src/ui/App.tsx` auf „Öffnen Sie eine E-Mail, um daraus ein
Todo anzulegen." umstellen, danach `IMPERATIV_AUSNAHME` in `apps/outlook-addin/scripts/proof-addin.mjs`
löschen (wird beim vorherigen Wortlaut sonst rot, wie in T-190 beschrieben) — `tests/e2e/
outlook-addin-build.spec.ts` bleibt dabei unverändert grün. Für den Orchestrator: die zwei offenen
Fragen oben einordnen, insbesondere ob die Bauart-Lücke am Timer-Stopp einen eigenen Auftrag an
frontend-dev braucht.
