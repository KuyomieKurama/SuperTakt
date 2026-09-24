# T-155 — Code-Review über T-146, T-147, T-149 und T-152

Aufgabe: T-155 — Code-Review über T-146, T-147, T-149 und T-152, dazu O-CD
Status: fertig
Artefakte: dieser Bericht. **Kein Produktivcode angefasst.**

## Prüfumfang und Meßgrundlage

`git status` gegen `HEAD` (d5440b2): 55 geänderte, 24 neue Produktivdateien. Gelesen wurden
vollständig `packages/domain/src/{attachment,due-date}.ts`,
`packages/storage/src/sqlite/repo-attachments.ts` und der Fristteil von `repo-todos.ts`,
`packages/storage/migrations/0014*`/`0015*`, `apps/local-api/src/{usecases/attachments.ts,
access/attachment-store.ts, http/input.ts, routes/todos.ts, routes/addin/*}`,
`apps/desktop/src-tauri/src/attachment.rs`, `apps/desktop/src/shell.ts`,
`apps/web/src/components/{DialogSurface,FormDialog,ConfirmDialog,InfoDialog,UpdateDialog,
AttachmentOpenDialog,Attachments,DeadlineFlag}.tsx`, `apps/web/src/lib/{deadline,attachmentLabel,
format}.ts`, `apps/web/src/app/{useToday,connection}.ts`,
`apps/outlook-addin/src/duedate/entry.ts` und der Fristteil von `TaskPane.tsx`.

Selbst gefahren: `pnpm typecheck` — Exitcode 0 (alle acht Pakete, `typecheck:test`,
`typecheck:e2e`). Kein Playwright, kein Entwicklungsserver (T-153 und T-156 laufen).

Zwei Aussagen über das Verhalten von Ark UI habe ich **nicht** geglaubt, sondern im
Bibliotheksquelltext nachgelesen:
`@zag-js/dismissable/dist/dismissable-layer.mjs:52` (`onEscapeKeyDown` →
`if (!layerStack.isTopMost(node)) return;`) und
`@zag-js/focus-trap/dist/focus-trap.mjs:177-184` (der Mutationsbeobachter). Das Ergebnis der
zweiten Lesung ist der Befund B-2. Beide sind am Quelltext gemessen, **nicht** im Browser — das
ist die Grenze dieses Reviews und der Grund, warum B-2 an T-153 geht.

## Urteil je Aufgabe

| Aufgabe | Urteil |
|---|---|
| **T-146** (Frist und Anhänge in Domäne, Speicherung, Dienst) | **Nacharbeit** — blockierend: **B-1**. Sonst sauber; die vier Torbefunde sind belegt behoben. |
| **T-147** (Oberfläche und Hülle) | **Nacharbeit** — blockierend: **B-1** (die zweite Fassung liegt auf dieser Seite). Der Öffnen-Befehl selbst ist **freigegeben**: `attachment.rs` ist die beste Datei dieser Welle. |
| **T-149** (Frist an der Add-in-Tür) | **freigegeben.** Nichts Blockierendes, nichts unter „sollte". Nachgeprüft, nicht geglaubt — siehe Frage 4. |
| **T-152** (vier Dialoge auf `@ark-ui/react/dialog`) | **freigegeben mit Auflage.** Nichts Blockierendes. Die Auflage ist **B-2**: Der Satz in `FormDialog.tsx:29-33` behauptet mehr, als die Fokusfalle leistet; T-153 muß den Fall messen, bevor Stufe 2 beginnt. |

**Gesamturteil: Nacharbeit.** Es blockiert **genau ein** Befund: **B-1**.

## Befunde

### blockierend

```
apps/web/src/lib/attachmentLabel.ts:162   blockierend  Zweite Fassung von `attachmentLabel` neben `packages/domain/src/attachment.ts:662` — und sie weicht ab: ohne Titel liefert die Domäne den **Wirtsnamen** (`beispiel.example`, Zeile 677-678), die Oberfläche alles hinter dem Schema (`beispiel.example/Seite`, Zeile 171); bei leerem Ziel sagt die Domäne `Verweis`/`Datei`/`Bild` (680, 685, 688), die Oberfläche `Ohne Bezeichnung` (167). Die Domänenfassung hat **keinen einzigen Produktivaufrufer** — sie wird ausschließlich von `packages/domain/test/attachment.test.ts:512-557` gemessen, während ihr eigener Kopfkommentar begründet, warum sie dort liegt: „eine zweite Fassung wäre eine zweite Gelegenheit, den leeren Fall zu vergessen". Genau die Klasse, die T-080 („es waren drei Fassungen"), T-119 und T-128 aufgeräumt haben. Fix, eine der beiden Richtungen und keine dritte: (a) `lib/attachmentLabel.ts` ruft `attachmentLabel(kind, title, target)` aus `@takt/domain` und setzt nur den Übergang auf `ForeignText` — wörtlich die Bauart, die `lib/deadline.ts:100-105` für `dueState` schon vormacht; wenn die Anzeige den Pfad hinter dem Wirt behalten soll, wird das **in der Domäne** entschieden und dort geändert. Oder (b) die Domänenfunktion samt ihrem `describe`-Block wird gelöscht und in `decisions.md` steht, daß die Beschriftung reine Anzeige ist und in der Oberfläche liegt. Was nicht bleiben darf, ist der heutige Zustand: zwei Fassungen, von denen die maßgebliche tot ist.
```

### sollte

```
apps/web/src/components/FormDialog.tsx:29     sollte  Der Satz „Die Fokusfalle beobachtet ihren Inhalt und setzt den Fokus in genau diesem Fall selbst zurück" trifft den **gemessenen** Fall aus T-072 nicht. `@zag-js/focus-trap` prüft `mutations.some(m => Array.from(m.removedNodes).some(n => n === state.mostRecentlyFocusedNode))` (focus-trap.mjs:177-184) — also **Identität** mit einem unmittelbar entfernten Knoten. Im Anlaßfall (`BoardScreen.tsx:1183-1193`, „Als Spalte aufnehmen") entfernt React das umschließende `<li className="rule-row">`; der fokussierte Knopf ist dessen **Nachfahre** und steht nicht in `removedNodes`. Der Fokus fällt weiter auf `body`. Was den Befund entschärft und weshalb er nicht blockiert: Escape läuft jetzt über `document` in der Erfassungsphase (dismissable-layer.mjs:69) und Tabulator über `document` in der Erfassungsphase (focus-trap.mjs:564) mit Rücksprung auf das erste tabulierbare Element, wenn das Ziel außerhalb liegt (findNextNavNode, Zweig `containerIndex < 0`) — die Sackgasse aus T-072 (SC 2.1.1) ist damit tatsächlich zu, die verlorene Fokusstelle (SC 2.4.3) nicht. Fix: entweder T-153 mißt den Fall (Dialog „Spalten des Boards" öffnen, „Als Spalte aufnehmen" klicken, `document.activeElement` lesen) und der Kommentar wird auf das Gemessene berichtigt — oder der kleine `onBlur`-Griff kommt als benannte Ausnahme zurück, so wie er in `UpdateDialog.tsx:105-111` für den gesperrten Knopf ohnehin steht. Ein Satz, der mehr zusagt als die Bibliothek hält, ist die teurere von beiden Möglichkeiten.
apps/local-api/src/access/attachment-store.ts:320  sollte  `removeImage` gibt `void` zurück und verschluckt jeden Fehlschlag (`rm(...).catch(() => undefined)`, Zeile 325). Alle drei Aufrufer — `usecases/attachments.ts:212` (Aufräumen nach mißlungenem INSERT), `:263` (Anhang entfernt) und `usecases/todos.ts:362` (Todo gelöscht) — können deshalb nicht unterscheiden, ob die Kopie weg ist oder liegt, und melden dem Benutzer in jedem Fall Erfolg. Unter Windows ist ein von einem Betrachter gehaltenes Bild (`EBUSY`) kein Sonderfall. Ergebnis: Kundenmaterial ohne Eigentümer im Anwendungsdatenverzeichnis, genau der Zustand, den A-A-18 ausschließt, und **keine Zeile im Protokoll**. Fix: `removeImage` liefert `Promise<boolean>` oder ein `Result` mit geschlossenem Schlüsselvorrat, und die drei Aufrufstellen protokollieren den Fehlschlag mit dem **erzeugten** Namen (nie mit dem Quellpfad) — dieselbe Bauart wie `report(options.logger, reason)` in `version/checker.ts:305`. Der Benutzer bekommt weiterhin `ok`: Der Anhang ist entfernt, und das stimmt.
apps/local-api/src/access/attachment-store.ts:161  sollte  `ensureDirectory` fängt jeden Fehler von `mkdir`/`chmod` und gibt `null` zurück; `copyImage:188` macht daraus `unreadable` → „Diese Datei lässt sich nicht lesen." Der Benutzer bekommt eine Aussage über **seine** Datei, während in Wahrheit Takt sein eigenes Bildverzeichnis nicht anlegen konnte. Das ist ein Fehler, der als anderer Fehler erscheint — dieselbe Sorte wie O-BQ (`0` statt `null`), nur eine Ebene höher. Fix: für den Fall „kein Zielverzeichnis" `write_failed` zurückgeben (der Schlüssel und der deutsche Satz „Das Bild konnte nicht abgelegt werden." bestehen bereits, `usecases/attachments.ts:138`), und den Grund protokollieren.
apps/web/src/components/AttachmentOpenDialog.tsx:148  sollte  Die Rückfrage behandelt Escape mit einem React-Handler auf `.scrim` (Blasenphase); jeder Ark-Dialog behandelt Escape auf `document` in der **Erfassungsphase** und nur für die oberste Ebene. Solange nie zwei zugleich stehen, ist das folgenlos — und heute stellen das allein die drei getrennten Zustände in `Attachments.tsx` (`formOpen`, `pendingOpen`, `pendingRemove`) sicher, nichts sonst. Öffnet eine spätere Fläche die Dateifrage aus einem `FormDialog` heraus (Anhänge im Todo-Formular wären der naheliegende Fall), schließt ein Escape den **Formulardialog darunter**, und die Abfrage `event.defaultPrevented` in Zeile 147 sorgt dafür, daß die Rückfrage selbst stehen bleibt: der alte T-059-Befund, spiegelverkehrt. Fix: `AttachmentOpenDialog` in Stufe 2 auf `DialogSurface` ziehen — O-CH nennt ihn bereits — und bis dahin diese Bedingung im Dateikopf als solche benennen, nicht als Zufall stehen lassen.
```

### Geschmack

```
apps/web/src/app/useToday.ts:72              Geschmack  Der Vorgabewert `now = () => new Date()` ist bei jedem Zeichnen eine neue Funktion; die Abhängigkeitsliste in Zeile 104 enthält `now`, also läuft der Effekt bei **jedem** Neuzeichnen der Ansicht ab, verwirft den Mitternachtszeitgeber und stellt ihn neu. Funktional folgenlos (`setToday` mit gleichem Wert zeichnet nicht neu), aber der Zeitgeber, dessen ganzer Zweck seine Genauigkeit ist, wird dabei fortlaufend zurückgesetzt. Fix: die Vorgabefunktion einmal auf Modulebene anlegen (`const systemNow = () => new Date();`) und als Vorgabewert einsetzen.
apps/web/src/components/Attachments.tsx:330  Geschmack  `const trimmed = value.trim();` wird auch für **Pfade** gesendet (Zeile 371-376). `attachmentPathSchema` verzichtet ausdrücklich auf `.trim()`, mit der Begründung, geprüft und gespeichert gehöre genau der Wert, den der Auswahldialog geliefert hat (`http/input.ts`, Abschnitt „Kein `.trim()`"). Die Oberfläche unterläuft die Zusage: Ein Pfad mit Leerzeichen am Rand — unter Linux zulässig — wird stillschweigend zu einem anderen Pfad. Fix: trimmen, wo es gilt (Adresse, Titel), und den Pfad ungeschnitten senden; der leere Fall wird über `value.trim().length === 0` weiter erkannt, ohne den gesendeten Wert zu ändern.
apps/web/src/components/Attachments.tsx:106   Geschmack  `REFUSAL_TEXT` führt die fünfzehn Schlüssel aus `attachment.rs:141-157` ein zweites Mal, und **nichts mißt den Gleichlauf**. Ein umbenannter Schlüssel fällt still in den Sammelsatz aus Zeile 137 („der Grund lässt sich hier nicht genauer benennen") — die Unterscheidung Beobachtung/Regel, für die dieser Vorrat gebaut wurde, ist dann weg. Fix: zehn Zeilen in `proof-shell-surface.mjs`, das ohnehin den Rust-Quelltext liest — jede `Rejection::…  => "…"`-Zeile muß als Schlüssel in `REFUSAL_TEXT` vorkommen, mit Gegenprobe.
apps/desktop/src-tauri/src/attachment.rs:282  Geschmack  `char::is_control` (nur Cc) ist enger als `FORBIDDEN_NAME_CHARACTERS` an der Tür (Richtungszeichen inbegriffen). Bei einem **Verweis** schließt der Festpunkt (Zeile 207) die Lücke; bei einem **Pfad** gibt es keinen Festpunkt, ein `U+202E` aus einem an der Tür vorbei geschriebenen Bestand (VG-3) besteht die Prüfung der Hülle also. Kein Verstoß — A-A-4 verlangt wörtlich `char::is_control()`, und die Anzeige behandelt den Pfad nach A-A-6 Punkt 2, der Benutzer wird also nicht getäuscht. Es gehört trotzdem in den Dateikopf, damit die Ungleichheit der zwei Türen eine **Entscheidung** bleibt und nicht als Versehen gelesen wird.
packages/domain/src/attachment.ts:414         Geschmack  Die Begründung zu `link_host_missing` nennt `https:///pfad` als den Fall, den sie fängt. Gemessen (Node 22, WHATWG): `new URL('https:///pfad').hostname === 'pfad'` — der Zweig greift dort gerade **nicht**, und ein leerer Wirt ist für `http`/`https` überhaupt nicht erreichbar (`https://` wirft). Fix: den Satz durch den wahren ersetzen — der Zweig ist der Boden für den Tag, an dem `ALLOWED_SCHEMES` ein nicht-spezielles Schema aufnimmt; siehe O-CD unten.
```

## O-CD — die fünf unerreichbaren Verzweigungen, je Stelle beantwortet

Die Frage war: kann der Zweig etwas, das niemand gemessen hat, oder ist er ein Kommentar in
Codeform? Antwort je Stelle, und sie fällt dreimal so und zweimal anders aus.

| Stelle | Was es ist | Was damit geschehen soll |
|---|---|---|
| `packages/domain/src/attachment.ts:289` (`codePointAt(0) ?? -1`) | **Kommentar in Codeform.** `for...of` liefert nie eine leere Zeichenkette, `codePointAt(0)` ist nie `undefined`; der Zweig existiert allein, weil die Signatur `number \| undefined` sagt. Die Richtung ist die harmlose: `-1` liegt in keinem Bereich. | Stehen lassen, aber wie im Haus üblich benennen. `packages/export/src/base64.ts:48` hat den Satz dafür schon: „der Zweig steht für den Übersetzer, nicht für die Laufzeit". |
| `packages/domain/src/attachment.ts:320` (`codePointAt(0) ?? 0`) | **Kommentar in Codeform**, dieselbe Sache — mit einem Unterschied, der genannt gehört: Der Ersatzwert `0` zählt **ein** Byte, ist also die nachgiebige Richtung an einer Längengrenze. Unerreichbar, folglich folgenlos; aber zwei verschiedene Ersatzwerte für dieselbe unmögliche Lage an zwei Stellen derselben Datei laden zum Nachdenken ein, wo nichts zu denken ist. | Gleichziehen mit `:289` und denselben Übersetzersatz danebensetzen. Wer den Wert ändern will, nimmt `4` (die größte Breite) — nie `0`. |
| `packages/domain/src/attachment.ts:419` (`url.hostname === ''`) | **Kein Kommentar, sondern ein Boden — für einen Zustand, den es heute nicht gibt.** Gemessen: Für `http`/`https` (WHATWG „special schemes") lehnt der Zerleger einen leeren Wirt ab, der Zweig ist unter der heutigen Positivliste unerreichbar. Erreichbar wird er in dem Augenblick, in dem `ALLOWED_SCHEMES` (Zeile 271) ein nicht-spezielles Schema aufnimmt — dann trägt er allein. | Stehen lassen. Die **Begründung** berichtigen (siehe Geschmacksbefund oben) und im Kommentar an `ALLOWED_SCHEMES` vermerken, daß diese Zeile der Preis einer Erweiterung ist. |
| `packages/domain/src/attachment.ts:678` (`if (host !== '')`) | **Kommentar in Codeform**, und zwar eine Wiederholung: `normalizeAttachmentLink` hat bei `parsed.ok` bereits an `:419` zugesichert, daß der Wirt nicht leer ist. Der Zweig prüft eine Zusage, die drei Zeilen vorher gegeben wurde. | `return new PlatformUrl(parsed.url).hostname;` — oder die Bedingung behalten und den bereits daneben stehenden Kommentar um einen Halbsatz erweitern („`:419` hat das schon zugesichert"). Fällt ohnehin weg, wenn **B-1** in Richtung (b) gelöst wird. |
| `packages/storage/src/sqlite/repo-attachments.ts:157` | **Ein echter Wächter**, und der beste der fünf. Er verwandelt einen unmöglichen Zustand — Zeile geschrieben, aber `toAttachments` übergeht sie — in einen **lauten** Fehler statt in eine leere Antwort. Erreichbar wird er, sobald eine Migration `todo_attachment_kind` um eine vierte Art erweitert, bevor `AttachmentKind` sie kennt; das ist keine Erfindung, sondern der in `:54-64` beschriebene Fall aus der Leserichtung. | Unverändert lassen. Wenn der unit-tester ihn messen will: eine Attrappe, deren `isAttachmentKind` `false` sagt — nicht die Datenbank verbiegen. |

Zusammengefaßt: zwei der fünf tragen (`:419`, `repo-attachments.ts:157`), drei sind Prosa in
Codeform und sollen als solche kenntlich sein. Umgangen wurde keiner — das war richtig.

## Die vier Fragen des Auftrags

**1. `DialogSurface` und die vier Dialoge — sind die Notbehelfe wirklich gegenstandslos?**

`event.defaultPrevented`: **ja, ersatzlos.** Nachgelesen, nicht angenommen —
`dismissable-layer.mjs:52` beginnt mit `if (!layerStack.isTopMost(node)) return;`. Eine offene
Ark-Liste (`Select`, `TagInput`, `Menu`) steht als eigene Ebene über dem Dialog; ihr Escape
erreicht den Dialog gar nicht mehr, statt ihn zu erreichen und dort abgefangen zu werden. Das
ist die bessere Bauart und keine Verschiebung. Nebenwirkung, ebenfalls geprüft: `closeOnEscape={!busy}`
in `FormDialog.tsx:118` landet als `event.preventDefault()` im Maschinenzweig
(`dialog.machine.mjs`, `onEscapeKeyDown`), die Ebene bleibt also stehen — „während der Dialog
arbeitet, bricht Escape nichts ab" gilt weiter.

`recoverFocus`: **nein, nur unbeobachtet.** Siehe B-2. Der Anlaß aus T-072 existiert unverändert;
was verschwunden ist, ist seine **schlimmste Folge**, weil Escape und Tabulator nicht mehr an
einer React-Fläche hängen, die der Fokus verlassen hat, sondern an `document`. Bemerkenswert:
`UpdateDialog.tsx:99-103` benennt für den gesperrten Knopf genau die Grenze der Fokusfalle
richtig („Sie beobachtet Elemente, die aus dem Baum verschwinden") — dieselbe Grenze ist eine
Stufe feiner, als die Datei annimmt: beobachtet wird nur der **unmittelbar** entfernte Knoten.

`keepTabInside` / `lib/focus.ts`: **saubere Trennung, keine halbe.** Alle drei Ausfuhren haben
noch Träger (`ShellStatus.tsx:745,751`, `AttachmentOpenDialog.tsx:166,171`), also greift E-076
Punkt 5 wörtlich, und die Sperrfläche der Hülle ist nach Punkt 2 ausdrücklich nicht Gegenstand
der Migration. Der Vorbehalt betrifft nicht die Trennung, sondern ihre Nachbarschaft: siehe den
„sollte"-Befund zu `AttachmentOpenDialog`.

**2. `modal={false}` mit `trapFocus`, `closeOnInteractOutside={false}` und handgesetztem
`aria-modal` (E-076 Punkt 6).**

Die Begründung trägt, und zwar genau so, wie sie geschrieben steht. Nachgeprüft im Quelltext:
`dialog.machine.mjs` schaltet `hideContentBelow` allein an `prop('modal')`
(`if (!prop("modal")) return;`), und `ariaHidden` läuft **einmal** beim Öffnen — eine zu diesem
Zeitpunkt geschlossene Portalliste bekäme `aria-hidden="true"` und behielte es. Die vier Schalter,
die `modal` sonst mitnimmt, sind einzeln nachgezogen: `trapFocus` ausdrücklich,
`closeOnInteractOutside` ausdrücklich aus, `aria-modal` von Hand am Kasten (und es **greift**:
`dialog-content.js` mergt in der Reihenfolge `getContentProps() → presence → props`, die eigene
Angabe gewinnt über das `aria-modal: false` der Maschine).

Was `modal={false}` zusätzlich abschaltet und was der Kommentar **nicht** nennt: `preventScroll`
und `pointerBlocking` (`dialog.machine.mjs`, `props()`). Beides ist hier folgenlos und ich mache
keinen Befund daraus — die Anwendung selbst steht auf `overflow: hidden`
(`app.css:90`), es gibt keinen Seitenbildlauf zu sperren, und `.scrim` fängt die Zeiger als
eigenes Element. Wer diese Zeile später anfaßt, sollte es aber wissen; ein Halbsatz im
Dateikopf wäre gut angelegt.

Ein Nebenbefund ohne Gewicht, damit er niemanden überrascht: `getContentProps()` setzt bei
`modal: false` einen Inline-Stil `pointer-events: auto` auf `.dialog`. Der Kopf von
`DialogSurface.tsx:73` sagt „kein Inline-Stil" über `.scrim` — das stimmt; über den Kasten sagt
er nichts, und der trägt jetzt einen.

**3. `attachment.ts` und `repo-attachments.ts` (O-CD).** Siehe die Tabelle oben, fünf von fünf
beantwortet.

**4. Die zwei Türen für dieselbe Sache — nachgeprüft, nicht geglaubt.**

Nachgemessen: `grep` über `apps/outlook-addin/src` findet **keine** zweite Fassung der Tagesform.
Der einzige Treffer auf `\d{4}` im Add-in-Baum ist ein Kommentar
(`duedate/entry.ts:26`, der die Abschrift ausdrücklich ablehnt) und der Call-Nummern-Ausdruck
(`callnumber/catalog.ts:48`), der eine andere Sache prüft. Die Kette ist durchgehend eine:
`TaskPane.tsx:274` → `readDueDate` → `isCalendarDay` aus `@takt/domain`; an der Tür
`routes/addin/schema.ts` → `dueDateSchema` aus `http/input.ts` → dasselbe `isCalendarDay`. Die
Haupttür (`routes/todos.ts:99,116`) liest dieselbe Bindung.

Wichtiger als der fehlende Doppelgänger ist, was zwischen den beiden Hälften passiert:
`dueDateForRequest` (`duedate/entry.ts:117`) macht aus einer **unbrauchbaren** Eingabe `null` —
für sich genommen ein stilles Verwerfen und die Sorte Rückfall, die einen Fehler in einen
scheinbaren Erfolg verwandelt. Der Kommentar beruft sich auf einen Riegel; den habe ich gesucht
und gefunden: `TaskPane.tsx:585-590`, `dueEntry.kind === 'invalid'` steht in der
`disabled`-Bedingung des einzigen Knopfes, der `submitCreate` auslöst, und es gibt in
`TaskPane.tsx` kein `<form>` und damit keinen zweiten Weg über die Eingabetaste. Der Riegel
trägt. Kein Befund — aber es ist der eine Ort in T-149, an dem eine gelöschte Zeile still Daten
kosten würde; ein E2E-Fall, der ihn festhält, wäre gut angelegt (an e2e-tester, nicht
blockierend).

## Geprüft und ausdrücklich kein Befund

- **Transaktionsgrenzen der Anhänge.** `addAttachment` kopiert vor der Zeile und räumt die Kopie
  bei mißlungenem INSERT ab (`usecases/attachments.ts:197-214`); `removeAttachment` löscht die
  Zeile **in** der Transaktion und die Datei erst nach dem `COMMIT` (`:248-265`); `removeTodo`
  liest die Bildziele **vor** dem `DELETE` in derselben Klammer (`usecases/todos.ts:353-363`) —
  `ON DELETE CASCADE` aus Migration 0015 hätte sie sonst mitgenommen, bevor jemand ihre Namen
  kennt. Alle drei Reihenfolgen sind richtig und begründet. Der einzige Mangel daran ist die
  Stummheit des letzten Schritts, und die steht als eigener Befund.
- **Zweite Base64-Kodierung?** `Buffer.from(read.data).toString('base64')`
  (`usecases/attachments.ts:320`) ist **keine** zweite Fassung von `packages/export/src/base64.ts`:
  Die dortige nimmt **Text** und kodiert ihn nach UTF-8, weil sie in der Oberfläche laufen muß, wo
  es `Buffer` nicht gibt (R-17); hier liegen schon **Bytes** vor, und der Code läuft nur in Node.
  Verschiedene Eingaben, verschiedene Laufzeiten, keine geteilte Regel.
- **Zweite Fassung der Fristsortierung?** `DUE_SORT_SENTINEL` (`repo-todos.ts:112`) ist als
  zweite Ausdrucksform von `compareByDueDate` **benannt** und in der Blätterung und im `ORDER BY`
  derselbe Ausdruck (`:520-535`); die Parameterreihenfolge in `.all(...)` (`:561`) paßt zu den
  Fragezeichen. Der Filter wird nicht im SQL erfunden, sondern über `dueComparison` aus der
  Domäne geholt und in einem geschlossenen `switch` übersetzt (`:341-358`). Sauber.
- **Rundung, Exportstatus, Notiztrennung** sind von dieser Welle nicht berührt;
  `ExportSourcePath` bleibt bei zwölf Werten, `todo_attachment` hat keine Verbindung zu
  `v_export_candidate`.
- **Dateihoheit:** keine Überschreitung gefunden. `apps/desktop/src-tauri/src/attachment.rs`
  trägt keinen `#[cfg(test)]`-Block (die Prüffälle liegen dort, wo T-148 sie hinlegt);
  `packages/domain`, `packages/storage` und `apps/local-api` außerhalb `routes/addin/` stammen von
  domain-dev, `apps/web`/`apps/desktop` von frontend-dev, `routes/addin/` und
  `apps/outlook-addin` von integration-dev. Die drei roten Testdateien aus O-CB sind grün.
- **Typsicherheit:** `pnpm typecheck` Exitcode 0. Kein `any` in den neuen Dateien. Die einzige
  Zusicherung in `packages/domain/src/attachment.ts:371` (`PlatformUrl`) ist an einer Stelle
  gebündelt und mit dem Wurf als Rückfall abgesichert; `routes/addin/index.ts:348`
  (`as CalendarDay | null`) steht **nach** `isCalendarDay` und trägt ein Ergebnis in den Typ,
  statt eine Annahme zu verstecken. Beide vertretbar.
- **Deutsch und Englisch:** Oberflächentexte durchgehend deutsch, Bezeichner englisch,
  Fehlerschlüssel englisch und ohne den abgewiesenen Wert (A-A-8) — auch in
  `Rejection::key()` und in `IMAGE_FAILURE_MESSAGE`.

## Zusammenfassung

Vier Aufgaben geprüft, ein blockierender Befund: Die Beschriftung eines Anhangs existiert in zwei
Fassungen — eine in `packages/domain`, deren Kopf begründet, warum es nur eine geben darf, und die
kein Produktivcode aufruft, und eine in `apps/web`, die anders antwortet. Alles Übrige an T-146
und T-147 hält, was die Berichte sagen; `attachment.rs` prüft an der letzten Stelle, in der
richtigen Reihenfolge, mit dem Festpunkt als Kern. T-149 ist ohne Auflage frei: Die Add-in-Tür
führt tatsächlich keine zweite Fassung der Tagesform, und der Riegel, der eine unbrauchbare
Frist nicht stillschweigend verschwinden läßt, ist da. T-152 ist frei mit einer Auflage: Der
Escape-Notbehelf ist zu Recht gefallen, der Fokus-Notbehelf nicht — sein Anlaß ist nicht
verschwunden, sondern unbeobachtet, und der Kommentar sagt das Gegenteil.

Annahmen: Ich habe „blockierend" für die doppelte Fachlogik gesetzt, weil dieses Vorhaben
dieselbe Klasse seit T-080 als Befund führt und die beiden Fassungen **bereits** auseinanderlaufen;
wer sie als reine Anzeige einstuft, kann sie mit einer Entscheidung statt mit Code auflösen —
dann ist es der Orchestrator, der freigibt, nicht der Review.

Risiken: B-2 ist am Bibliotheksquelltext gemessen und nicht im Browser; falls T-153 den Fall
anders mißt, gilt die Messung und nicht dieser Bericht. Sicherheitsrelevantes gehört zu T-156;
die zwei Stellen, die dort noch einmal hinsehen sollten, sind der verschluckte `rm`
(Kundenmaterial ohne Eigentümer) und die ungleiche Zeichenklasse von Tür und Hülle beim Pfad.

Offene Fragen an den Orchestrator: (1) B-1 in Richtung (a) oder (b)? (2) Soll der
Schlüsselgleichlauf Rust ↔ `REFUSAL_TEXT` als Nachweis nachgezogen werden oder als O-Punkt in
die nächste Welle?

Nächster Schritt: B-1 an frontend-dev **und** domain-dev als **eine** Aufgabe (die Fassung fällt
auf einer Seite, die andere Seite ruft) — sie berührt zwei Hoheiten und darf deshalb nicht in
zwei parallele Aufgaben zerfallen. B-2 als Auflage an T-153. Die drei „sollte"-Befunde am Dienst
(`removeImage`, `ensureDirectory`) an domain-dev in derselben Welle; sie hängen an keiner anderen
Aufgabe.
