# T-308 — Freigabeprüfung der Anhangsfläche gegen Spezifikation und Bedienung

**Aufgabe:** T-308 · **Rolle:** spec-ux-reviewer · **Stand:** 2026-09-12
**Grundlage:** `docs/spec.md` 19.5 (A-19.22 bis A-19.34), A-19.19 in der Fassung von E-108,
A-10.9; `.claude/team/decisions.md` E-108, E-109, E-100; `docs/design/addin-anhangsuebernahme-fluss.md`
(zweite Fassung, T-303); Berichte T-297 bis T-306; Board Welle 2 und 3.

**Status: Nacharbeit.** Blockierend: **A-19.29**, **A-19.19**, **A-19.23**, **A-19.30**
(Überdeckung), **A-19.31/A-19.29 in der Ansage**.

---

## 0. Wie ich gemessen habe

Node/pnpm/Cargo stehen in dieser Sitzung nicht zur Verfügung; ich habe **keinen** Lauf gefahren.
Jede Deckung unten hängt deshalb an einer von vier Quellen, und ich schreibe je Anforderung
dazu, an welcher:

| Quelle | Was sie trägt |
|---|---|
| **P** | ein Nachweislauf im Bestand, dessen Zusicherung ich gelesen habe (`proof:addin`, `proof:clamp`, `proof:locked`) |
| **T** | ein Prüffall im Bestand, dessen Zusicherung ich gelesen habe |
| **Q** | Quelltext — die Regel steht da und ist an ihrer Wirkstelle lesbar |
| **B** | nur ein Bericht sagt es |

**B allein ist keine Deckung.** Wo unten nur B steht, ist das ein Befund und keine Freigabe.

---

## 1. Anforderung für Anforderung

| ID | Deckung | Woran gemessen |
|---|---|---|
| A-19.22 | **P + Q** | `apps/outlook-addin/src/attachments/eml.ts:259-296` setzt genau die fünf Angaben (`From`, `To`, `Cc`, `Subject`, `Date`, Rumpf) und einen lesbaren Vorspann mit denselben fünf auf deutsch. `proof-addin.mjs:6247-6312` legt über **echtes HTTP gegen den zusammengesetzten Dienst** an und liest die Zeile `Nachricht.eml` aus `todo_attachment`. Der Originalweg (`getAsFileAsync`) ist **nur Q** — er ist hier nicht fahrbar (T-300 sagt das ausdrücklich). |
| A-19.22a | **Q** | `collect.ts:307` — fehlt 1.14 **oder** schlägt der Abruf fehl, wird nachgebaut; `plan.ts:127` `expectRebuild: !capabilities.canReadMessageFile`. |
| A-19.22b | **Q + T** | **alle drei Orte, siehe Abschnitt 3.** |
| A-19.22c | **Q** | einteiliges `text/plain`, kein `multipart`, jede Kopfzeile RFC-2047-kodiert, `PRINTABLE_ASCII_LINE` als Wache über den **erzeugten** Zeilen, Rückgabe `{ok:false}` → `rebuild_rejected`. **Die Oberfläche dazu ist unvollständig — Befund F-3.** |
| A-19.23 | **P** | `proof-addin.mjs:6282` zählt drei Zeilen. **Eingeschränkt: fünf Endungen werden abgewiesen — Befund F-4.** |
| A-19.23a | **P + Q** | `nameEmailFile`; `proof-addin.mjs:6327-6340` liest den **Ordner** und prüft jeden Namen gegen `^[0-9a-f]{32}(\.[a-z0-9]{1,16})?$` und auf Abwesenheit jeder Namensspur. |
| A-19.23b | **P + Q** | `proof:clamp` rechnet 34 deckelnde Klassen gegen 20 Anzeigestellen mit `UncappedText` und prüft den Schnitt auf leer; im Aufgabenbereich geht jeder Name durch `Foreign` (`Attachments.tsx:109,203,258,294`), `shortenEmailDisplayName` kürzt in der **Mitte**. Der e2e-Fall über die **gerenderte** Breite fehlt weiterhin (T-302 Risiko 2). |
| A-19.24 | **Q** | `plan.ts:131` `facts.filter((fact) => !fact.isInline)` — kein Eintrag, keine Zahl. R-a (nicht gesetztes `isInline`) bleibt und ist benannt. |
| A-19.25 | **Q** | `plan.ts:139-146`, Verweis erst nach `normalizeAttachmentLink` am **zerlegten** Schema; in SuperTakt trägt die Zeile `(als Verweis)` und die Herkunftszeile. |
| A-19.26 | **Q** | `kind: 'file'`, `AttachmentOpenDialog` mit vollem Pfad, abgesetzter Endung und Urteil. |
| A-19.27 | **P + Q** | Die Nachricht steht immer im Plan (`plan.ts:123-129`); `expectedLine` und `attachedLine` haben je einen Einzahlsatz. `proof-addin.mjs:8889` misst `plan.expected === 3` für zwei Dateianhänge. |
| A-19.28 | **P** | `proof-addin.mjs:6268-6272` prüft, daß die **Frist** mit den Anhängen zusammen durchgeht und nicht untergeht. Tags, Pool und Vermerk fahren im selben Rumpf und sind unverändert. |
| A-19.29 | **Q, lückenhaft** | Zehn Sätze in `reasons.ts` über acht Kennungen der Leitung. **Drei Befunde — F-1, F-2, F-3.** |
| A-19.30 | **Q + P** | Vor dem Klick in `plan.ts:153`, an der Tür in `admitEmailAttachment`. **Überdeckt — Befund F-5.** |
| A-19.31 | **Q** | `outlook_too_old` vor dem Klick **und** im Ergebnis, dazu `OUTLOOK_REQUIREMENT_HINT` eine Zeile tiefer. **Für eine Vorlesehilfe ist der Ausfall trotzdem still — Befund F-6.** |
| A-19.32 | **P** | `proof:addin` 22 misst `<Permissions>ReadItem</Permissions>` zeichengleich, die Abwesenheit von `ReadWriteMailbox` im ganzen Baum und **genau eine** Aufrufstelle von `getAsFileAsync`. |
| A-19.33 | **P, mit zwei ungemessenen Nähten** | **siehe Abschnitt 2.** |
| A-19.34 | **T** | Archivfassung 6, `data.files` mit Bytes, Pfadumschreibung beim Einspielen; `apps/local-api/test/usecases/data-transfer.test.ts` fährt den Rundlauf über **zwei echte Anwendungsdatenverzeichnisse** mit Byte-Vergleich und prüft beide Richtungen der Verlustwarnung. **Die Spezifikation hinkt zwei Fassungen nach — Befund F-9.** |

---

## 2. A-19.33 — die Abnahme des Auftraggebers

**Sie ist nicht stückweise, sondern in ihrem tragenden Stück wirklich von Ende zu Ende
gemessen.** `apps/outlook-addin/scripts/proof-addin.mjs:6210-6340` fährt gegen **echtes SQLite und
ein echtes Anwendungsdatenverzeichnis**: ein Todo, das vorher schon dasteht; ein `POST` mit einem
Umschlag aus Nachricht plus zwei Dateien und vier verschiedenen Schreibweisen einer fremden
Todo-Kennung im selben Rumpf; danach

- `SELECT COUNT(*) … WHERE todo_id = neu` ist **3**,
- `body.data.attachments.stored` ist **3** (Antwort und Bestand müssen übereinstimmen),
- das **vorhandene** Todo steht weiterhin bei **0**,
- `ORDER BY position` ergibt `['Nachricht.eml','Angebot.pdf','Skizze.png']`,
- im Ordner liegen drei Dateien, jede mit erzeugtem Namen, keine mit einer Namensspur.

Das ist die beste Messung dieser ganzen Welle und mehr, als die Anforderung verlangt.

**Zwei Nähte bleiben trotzdem ungemessen, und die zweite ist die, die ich melde:**

1. **Office.js → Nutzlast.** Daß `getAsFileAsync` wirklich EML liefert, daß
   `isSetSupported('Mailbox','1.14')` auf einem echten Wirt das Erwartete sagt, daß
   `ItemChanged` an einem angehefteten Bereich auslöst — ungeprüft, und T-300 sagt das selbst.
   Das ist **hinnehmbar und benannt**: Es braucht einen Windows-Rechner mit Outlook.
2. **Bestand → Hauptfenster.** Es gibt **keinen** Prüffall, der ein Todo mit drei übernommenen
   Anhängen in `apps/web` aufschlägt und drei Zeilen zählt. T-302 hat das **von Hand** gemessen
   und schreibt selbst dazu, eine Messung von Hand sei ein Stand und kein Wächter. Das
   Erfolgskriterium des Entwurfs lautet „auf dem Bildschirm ablesbar, nicht nur in der
   Datenbank" — für den Aufgabenbereich ist es gemessen, für SuperTakt nicht.

**Und an dieser zweiten Naht steht heute ein Prüffall, der das Gegenteil zusichert** — siehe
Befund F-2. Das ist der schwerere Teil der Antwort auf diese Frage.

---

## 3. A-19.22b — die Kennzeichnung an drei Orten, und die Auflage AK-27

| Ort | Befund |
|---|---|
| **am Anhang** | `apps/web/src/features/todos/AttachmentRow.tsx:195-204` — `(nachgebaut)` in einem **eigenen** Element neben dem Anzeigenamen, mit Zeichen daneben (`aria-hidden`), und **im zugänglichen Namen des Öffnen-Knopfes** (`:255-257`). Die Trennung ist richtig und nicht bloß sauber: ein Absender, der seine Datei `Nachtrag.eml (nachgebaut)` nennt, kann die Kennzeichnung so nicht erfinden. |
| **in der Rückfrage** | `AttachmentOpenDialog.tsx:427-437`, eigener Absatz im Warnton; `Attachments.tsx:341` reicht `rebuilt` aus dem Bestand hinein. |
| **Datensicherung** | Spalte `rebuilt` (Migration 0023), Archivfassung 6, und der Rundlauf über zwei Verzeichnisse ist **als Prüffall** vorhanden (T-305 Punkt 5): `displayName`, `rebuilt`, `originSender` kommen unverändert zurück. |

**Die Auflage AK-27 ist eingehalten.** Der Satz „Die Datei ist in SuperTakt dauerhaft als
Nachbau gekennzeichnet." steht in `TaskPane.tsx:938` — und er steht erst da, seit alle drei Orte
gebaut sind; der Kommentar darüber führt die drei Orte einzeln mit Datei und Zeile auf, statt sie
zu behaupten. Das ist die Form, in der eine Auflage eingelöst gehört. **Keine Nacharbeit.**

Eine Abweichung ohne Gewicht: In der Rückfrage beginnt der Satz mit „Diese Datei ist ein
Nachbau:", im Aufgabenbereich mit „Die E-Mail ist ein Nachbau:". F-06 verlangt die Wortgleichheit
für **„Nachbau"**, nicht für den ganzen Satz; sie ist gegeben.

---

## 4. Befunde

### F-1 — blockierend

`A-19.29`  **Aufgabenbereich, Ergebnisliste (Z4)**
**Abweichung:** Die Tür meldet einen gerissenen **Summengrenzwert** als `too_large`
(`packages/domain/src/email-attachment.ts:386-389` — dieselbe Kennung für „über 25 MB je Datei"
und für „bytesBefore + bytes > 48 MB"). Der Aufgabenbereich schreibt daraus den Satz
`zu groß (2,0 MB). Die Grenze liegt bei 25,0 MB je Datei.` (`reasons.ts:62-65`, `bytes` ist
gesetzt). Für eine 2-MB-Datei, die an der Summe hängengeblieben ist, steht damit ein Satz auf dem
Bildschirm, der sich **selbst widerspricht** und einen Grund nennt, den es nicht gab. A-19.29
verlangt den **Grund**, nicht irgendeinen. Der Entwurf hat den Fall vorhergesehen und
`total_too_large` genau deshalb behalten — aber nur für die **Vorschau**; über die Leitung gibt es
ihn nicht, und die Vorschau kennt die Größe der Nachricht nicht, also kann die Summe erst an der
Tür reißen.
**Vorschlag:** `EmailAttachmentFailureReason` um `total_too_large` ergänzen (die Liste hat in
derselben Welle schon einmal einen Wert aufgenommen und einen verloren) und
`admitEmailAttachment` die beiden Zweige unterscheiden lassen. Der Satz steht in `reasons.ts`
bereits. Ersatzweise — billiger, aber schlechter — `bytes` bei diesem Zweig auf `null` setzen und
den Satz ohne Zahl schreiben; dann ist er nur noch ungenau statt falsch.

### F-2 — blockierend

`A-19.19`  **Qualitätstor / e2e**
**Abweichung:** `tests/e2e/attachment-export-and-addin-exclusion.spec.ts:157-172` heißt
„TP-ANH-13 — über das Add-in entstehen **keine** Anhänge (Spotcheck, A-19.19)" und sichert zu:
`expect(attachments).toHaveLength(0)`, mit dem Kommentar „die Route hat dafür keinen Zweig
(A-A-21)". `docs/testplan.md:3974` und `:4102` sagen dasselbe („Add-in-Route baut, ohne ein
Anhangsfeld zu kennen"). Beides ist seit E-108 und T-304 **das Gegenteil des Bestands**. Der
Rumpf, den der Prüffall schickt (`attachments: [ … ]`, eine nackte Liste), paßt zudem nicht mehr
auf `emailAttachmentsSchema` (`{ sender, items }`) — er fällt heute entweder mit 422 durch oder
grün aus dem falschen Grund. Das ist genau die Klasse vom 2026-09-10: ein Wächter, der eine
Abwesenheit mißt, die es nicht mehr gibt. `pnpm test:e2e` ist damit nicht freigabefähig.
**Vorschlag:** In **einem** Auftrag an e2e-tester: TP-ANH-13 auf die Wirkung umschreiben — „über
die Add-in-Tür entsteht kein Anhang an einem Todo, das vorher schon da war" —, den Satz in
`docs/testplan.md` mitziehen und den fehlenden Fall aus Abschnitt 2 Punkt 2 dazu aufnehmen: ein
Todo aus einer E-Mail mit zwei Dateien, in SuperTakt aufgeschlagen, **drei** Zeilen in der
Anhangsliste, eine davon mit `(nachgebaut)`. Damit ist A-19.33 auch an der zweiten Naht gemessen.

### F-3 — blockierend

`A-19.22c` / `A-19.29`  **Aufgabenbereich, Z4 Sonderfall 2 (`rebuild_rejected`)**
**Abweichung:** Von dem Zustand, den der Entwurf als „den heikelsten des ganzen Entwurfs"
bezeichnet, ist **nur der Halbsatz** „sie ließ sich nicht als Datei nachbauen." gebaut. Es fehlen
vollständig: die Überschrift „Todo angelegt — die E-Mail fehlt" (`doneTitle` kennt nur „1 Anhang
fehlt" / „N Anhänge fehlen"), der Erklärabsatz aus 6.4 Fall 2 und mit ihm **SP-A-35** („Das liegt
an dieser Nachricht, nicht an Ihren Eingaben, und ein zweiter Versuch ändert daran nichts."). Der
Wortlaut steht nirgends im Baum — gesucht über den Wortlaut, `tests/**` und `apps/*/src`
eingeschlossen. AK-28 verlangt ihn ausdrücklich. Ohne ihn entsteht genau die Schleife, gegen die
er geschrieben ist: löschen, neu anlegen, dasselbe Ergebnis. Dazu nennt `CATCH_UP_NOTE`
(`TaskPane.tsx:956`) in diesem Fall „die **Datei** in Outlook speichern", wo der Entwurf „die
**Nachricht**" sagt — hier ist keine Datei fehlgeschlagen, sondern die E-Mail.
**Vorschlag:** integration-dev baut den Absatz und die Überschriftsvariante nach 6.4 Fall 2 und
gibt `CATCH_UP_NOTE` eine zweite Fassung für den Nachrichtenfall. Ein zweiter Randfall in
derselben Zeile: `attachedLine` liefert bei null übernommenen Anhängen „… Kein Anhang aus dieser
E-Mail hängt daran**:**" — ein Doppelpunkt vor einer Liste, die dann nicht gerendert wird.

### F-4 — blockierend

`A-19.23`  **Dienst, Aufnahme**
**Abweichung:** Dateien mit den Endungen `.lnk .url .pif .scf .desktop` werden **abgewiesen**
(T-299 Annahme 2, Grund `rejected`). A-19.23 lautet „**Sämtliche** Dateianhänge derselben E-Mail
werden zusätzlich als je ein eigener Anhang an dasselbe Todo gehängt. Inhalt und Dateiformat
bleiben unverändert." Die Einschränkung ist gut begründet — ein Anhang, den der Öffnen-Befehl der
Hülle nie öffnet, wäre von der ersten Sekunde an tot — aber sie ist **weder in der Spezifikation
noch in einer Entscheidung gedeckt**, und domain-dev hat sie selbst als prüfbedürftig gemeldet.
Sie ist außerdem für den Benutzer nicht erklärt: er liest „SuperTakt hat die Datei nicht
angenommen." und erfährt nicht, daß es an der Endung lag.
**Vorschlag:** Entscheidung des Auftraggebers oder des Orchestrators, in `decisions.md`, mit
einem Satz in A-19.23 als Ausnahme. Fällt sie **für** die Abweisung, gehört ein eigener Grund
dazu (`redirect_extension`) mit einem Satz, der die Endung nennt — sonst bleibt eine
Systementscheidung hinter einem Satz verborgen, der nach einem Formfehler klingt.

### F-5 — blockierend

`A-19.30`  **Dienst und Vorschau, drei Grenzen statt einer**
**Abweichung:** Gebaut sind **drei** Grenzen: 25 MB je Datei, **48 MB in der Summe**, **25 Dateien
je E-Mail**. A-19.30 kennt nur die erste und sagt ausdrücklich „Die Grenze gilt **je Datei**".
E-108 Punkt 3 genehmigt „eine eigene Größengrenze **je Datei** (Vorschlag 25 MB)" — Summe und
Anzahl stehen dort **nicht**. Sie sind in T-299 Annahme 3 ohne Rückfrage gesetzt worden und haben
seither zwei eigene Sätze in der Oberfläche („Zusammen dürfen die Dateien einer E-Mail 48,0 MB
nicht überschreiten.", „Je E-Mail werden höchstens 25 Dateien übernommen."). **Das ist die Stelle,
an der die Umsetzung mehr tut, als verlangt ist**, und sie tut es sichtbar.
Dazu eine zweite Abweichung an derselben Zahl: Die **Vorschau** zählt nur Dateien gegen
`maxCount` (`plan.ts:157`, Cloud-Verweise und die Nachricht fahren vorher per `continue` heraus),
die **Tür** zählt Nachricht, Dateien und Verweise gemeinsam (`email-attachments.ts:369,446`). Eine
E-Mail mit 25 Dateien und einem Cloud-Verweis kündigt 27 Anhänge an und liefert 25 — die Vorschau
irrt damit in die **unsichere** Richtung, und genau das schließt der Entwurf aus („Sie darf sich
in die sichere Richtung irren").
**Vorschlag:** Beide Grenzen durch eine Entscheidung decken (E-110) und A-19.30 um einen Satz
ergänzen; im selben Auftrag die Zählweise angleichen — entweder zählt die Vorschau alles mit oder
die Tür zählt nur Dateien. Zwei Zählweisen für eine Zahl sind die Bauart, aus der falsche
Versprechen entstehen.

### F-6 — blockierend

`A-19.29` / `A-19.31`  **Aufgabenbereich, Zugänglichkeit**
**Abweichung:** Drei Sachen, die zusammen einen Weg ergeben:
1. **Das Ergebnis wird nicht angesagt.** `TaskPane.tsx:367` ersetzt den ganzen Baum durch
   `DoneView`; darin gibt es **kein** `role="status"`, **kein** `aria-live` und **keine**
   Fokuszuweisung. Z3, Z3a und Z4 erreichen eine Vorlesehilfe nicht. AK-26 („Der Screenreader
   hört … Die E-Mail ist ein Nachbau.") ist damit **nicht** erfüllt, und für einen blinden
   Benutzer ist ein Todo, dem ein Anhang fehlt, still — genau das, was A-19.29 ausschließt.
2. **Es gibt keinen Fokusfluß.** Abschnitt 10.1 des Entwurfs schreibt sechs Übergänge vor; im
   ganzen `apps/outlook-addin/src` steht kein `tabIndex`, kein `autoFocus` und kein `.focus()`.
   Beim Übergang Z0 → Z1 verschwindet der Knopf unter dem Fokus, und der Fokus fällt auf `<body>`.
3. **Die beiden Live-Bereiche in Z1 entstehen zusammen mit ihrem Inhalt.**
   `Attachments.tsx:185` und `:217` tragen den Kommentar „steht **immer** da und wechselt nur
   seinen Inhalt (Y-04)" — das stimmt innerhalb von `AttachmentProgress`, aber der ganze Baustein
   wird erst beim Klick gerendert (`TaskPane.tsx:482`). Nach der hauseigenen Regel Y-04 werden
   beide deshalb unzuverlässig vorgelesen; betroffen ist auch die Ansage **jedes** Fehlschlags,
   also der Punkt, den der ux-designer für den wichtigsten hält.
**Vorschlag:** Ein Auftrag an integration-dev: die Statuszeile und den Nur-Vorlese-Bereich auf
die oberste Ebene des Aufgabenbereichs heben, damit sie über alle Zustände hinweg stehen; die
Ergebnisüberschrift mit `tabindex="-1"` versehen und beim Übergang anspringen; den Ergebnissatz
einschließlich „Die E-Mail ist ein Nachbau." in den Nur-Vorlese-Bereich schreiben. Das ist die
zweite Hälfte von AK-21 und AK-26.

**Zur Frage, ob die Entscheidung des ux-designers richtig war:** ja. Die Liste **nicht** live zu
schalten ist bei siebzehn Anhängen die einzige benutzbare Wahl, und die Auswahl „Beginn, jeder
Fehlschlag, das Ergebnis" folgt der richtigen Regel — angesagt wird, was man nicht verpassen
darf. Der Nachbau als Ausnahme ist ebenfalls richtig begründet: ohne ihn bekäme der nicht sehende
Benutzer **weniger** als der sehende, an genau der Stelle, an der es auf den Unterschied ankommt.
Der Entwurf ist hier besser als die Umsetzung. Und weil es auch hier kein Vorleseprogramm gibt,
ist alles oben eine Ableitung aus Baum und Quelltext — sie trägt für die **Abwesenheit** eines
Live-Bereichs und einer Fokuszuweisung, nicht für die Frage, wie eine bestimmte Hilfe den
vorhandenen Bereich vorliest.

### F-7 — nicht blockierend

`A-19.29`  **Aufgabenbereich, Gründeliste**
**Abweichung:** Zehn Sätze stehen zehn Kennungen gegenüber, und der `switch` mit `never`-Wache
garantiert, daß **keine Kennung ohne Satz** bleibt. In der Gegenrichtung gibt es eine Lücke:
`connection` („Die Verbindung zu SuperTakt ist abgerissen.") wird von **niemandem** erzeugt. Die
Domäne schreibt sie dem Aufgabenbereich zu; der sammelt aber vollständig lokal und schickt genau
einmal — reißt dieser Ruf, gibt es kein Todo und der Fall ist Z5, nicht Z4. Ein Satz ohne
erreichbaren Fall ist dasselbe wie `mailbox_closed`, das in derselben Welle aus genau diesem Grund
gestrichen wurde.
**Vorschlag:** `connection` streichen, in `EmailAttachmentFailureReason` und in `reasons.ts`, mit
demselben Satz in der Datei, mit dem `mailbox_closed` gestrichen wurde. Oder — falls ein
teilweiser Rumpfverlust vorstellbar bleibt — die Stelle benennen, die ihn erzeugt.

### F-8 — nicht blockierend

`A-19.19`  **Sperrliste**
**Abweichung:** Von den sechs Sperrlistenkandidaten aus Abschnitt 11 des Entwurfs (SP-A-29, -30,
-32, -33, -34, -35) steht **keiner** in `docs/design/textbestand-aufgabenbereich.md`; die Namen
kommen im ganzen Bestand nur im Entwurf und im Bericht T-303 vor. `proof:locked` führt 22 Einträge
und keinen davon. Betroffen sind unter anderem „Über diesen Aufgabenbereich entsteht an einem
vorhandenen Todo kein Anhang." (die Abwesenheitszusage zu A-19.19) und „Die Datei ist in SuperTakt
dauerhaft als Nachbau gekennzeichnet." (A-19.22b). Dasselbe gilt für die beiden neuen Sätze in
`apps/web` (T-302 Offene Frage 2). F-05 des Entwurfs ist unbeantwortet. Beim nächsten
Textdurchgang sind alle acht Streichkandidaten.
**Vorschlag:** Der Orchestrator beantwortet F-05 und weist die Einträge zu — die sechs dem Halter
von `textbestand-aufgabenbereich.md`, die zwei dem ui-designer in `textbestand.md`. SP-A-34 darf
jetzt eingetragen werden: die Bedingung aus AK-27 ist erfüllt (Abschnitt 3).
**Randbefund derselben Datei:** Die Kopfnotiz dort führt SP-A-27 und SP-A-28 weiterhin als
„die neuen geschützten Aussagen … stehen in `DuplicateOffer.tsx`". Beide Sätze stehen dort seit
T-247 nicht mehr.

### F-9 — nicht blockierend

`A-19.34` / `A-24.7`  **Spezifikation gegen Bestand**
**Abweichung:** `DATA_ARCHIVE_VERSION` steht auf **6** und liest 1 bis 6; A-24.7 nennt die
Fassung **4**. Der Abstand war vor dieser Welle eine Fassung und ist jetzt zwei. `CLAUDE.md` nennt
zusätzlich noch die 5 und die eine gelockerte Rumpfgrenze, wo es inzwischen drei sind
(256 MiB Archiv, 64 MB Fremdimport, 64 MB Add-in-Anlegen).
**Vorschlag:** domain-devs Vorschlag übernehmen — A-24.7 nennt keine Zahl mehr, sondern verweist
auf `docs/datenmodell.md` Abschnitt 10. Eine Zahl an zwei Orten ist die Bauart, aus der dieser
Abstand entstanden ist.

### F-10 — nicht blockierend

`A-19.29`  **Aufgabenbereich, Z6 während Z2**
**Abweichung:** Der Entwurf 6.6 sagt: Wechselt Outlook die Nachricht, während bereits angelegt
wird, bleibt die Ergebnisfläche stehen, „ihr Knopf heißt in diesem Fall **„Schließen"** statt
„Noch etwas aus dieser E-Mail", weil „diese E-Mail" nicht mehr die offene ist." `DoneView`
(`TaskPane.tsx:1017-1021`) beschriftet den Knopf immer gleich. Der Benutzer liest dann eine
Handlung, deren Bezug nicht mehr existiert — dieselbe Klasse wie am 2026-09-10, nur klein.
**Vorschlag:** Ein Feld an `Done`, das den Fall trägt, und zwei Beschriftungen.

---

## 5. Die zwei ausdrücklichen Fragen

**Am schwächsten gedeckt ist A-19.29 — „Kein Fehlschlag ist still."** Nicht, weil wenig gebaut
wäre: Die Sätze sind sorgfältig geschrieben, geschlossen aufgezählt und gegen fremden Text
gesichert. Sondern weil an ihr allein **vier** Befunde hängen, und zwei davon sind Sätze, die
etwas Unwahres sagen (F-1) oder gar nicht erst gesagt werden (F-3, F-6). Eine Anforderung, deren
Erfüllung darin besteht, daß nichts still ist, ist genau so gut wie ihr **schwächster** Kanal —
und für einen Benutzer mit Vorlesehilfe ist heute das ganze Ergebnis still. Zweitschwächste ist
A-19.23, weil ihr Wort „sämtliche" im Bestand fünf Ausnahmen hat, die niemand entschieden hat.

**Die Umsetzung tut an zwei Stellen mehr, als verlangt ist:**

1. **Die Summengrenze von 48 MB und die Anzahlgrenze von 25 Dateien** (F-5). Sie sind weder in
   A-19.30 noch in E-108 Punkt 3 gedeckt, sie sind sichtbar — zwei Sätze in der Vorschau — und sie
   verwerfen Material des Benutzers. Das ist der Befund, den ich für den wichtigeren halte.
2. **Die Herkunftszeile in der Anhangsliste und der zweite Satz in der Rückfrage** („Ihren Namen
   und ihren Inhalt hat der Absender bestimmt, nicht Sie.", T-302 Annahme). Sie sind über die
   Auflagen A-A-84/A-A-85 des security-checkers gedeckt und gut begründet — ich melde sie nur, weil
   sie über 19.5 hinausgehen, und lasse sie stehen.

Nicht als Befund, sondern als Anerkennung: `proof:addin` 18d, `proof:clamp` und der
Archivrundlauf über zwei Verzeichnisse sind drei Messungen, die **die Wirkung** prüfen und nicht
den Namen. In einem Bestand, dessen schwerste Fehler bisher aus gemessenen Namen entstanden sind,
ist das die richtige Richtung.

---

## 6. Urteil

**Nacharbeit.** Blockierend: **F-1 (A-19.29)**, **F-2 (A-19.19)**, **F-3 (A-19.22c/A-19.29)**,
**F-4 (A-19.23)**, **F-5 (A-19.30)**, **F-6 (A-19.29/A-19.31)**.
Nicht blockierend, aber vor dem Dokumentierer zu erledigen: F-7 bis F-10.
