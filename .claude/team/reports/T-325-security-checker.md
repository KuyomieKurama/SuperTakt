# T-325 — Sicherheitsfreigabe über T-320 und T-321

Aufgabe: T-325 — Sicherheitsfreigabe über T-320 und T-321
Gegenstand: Zweig `feature/outlook-anhaenge-und-versionspruefung`, Spitze `311b26e` gegen `4a52edc`
Status: **fertig**

**Urteil: freigegeben** — mit vier Befunden, von denen **keiner** blockiert, und vier Auflagen
(A-A-102 bis A-A-105), die in die nächste Welle gehören. Die Begründung je Strang steht in 6.

---

## 1 — Läufe, einzeln benannt

**Gefahren:**

| Lauf | Ergebnis |
|---|---|
| `pnpm run typecheck` | grün, Exit 0 |
| `pnpm run boundaries` | grün, „Notiz-Trennung: alle Schichten unverletzt", Exit 0 |
| `node apps/local-api/scripts/proof-release-safety.mjs` | **76 bestanden, 0 fehlgeschlagen** |
| `node apps/local-api/scripts/proof-layers.mjs` | 36 bestanden, 0 fehlgeschlagen |
| `node apps/local-api/scripts/proof-callers.mjs` | 74 bestanden, 0 fehlgeschlagen |
| `node apps/local-api/scripts/proof-route-policy.mjs` | 48 bestanden, 0 fehlgeschlagen |
| `npx vitest run packages/{domain,storage,export}/test apps/local-api/test` | 75 Dateien, **1 618 grün**, 2 übersprungen, Exit 0 |
| `pnpm audit` | „No known vulnerabilities found", Exit 0 |
| eigene Messung M-1: 27 Namensgestalten gegen `attachmentTargetNamesFile` | 0 Abweichungen, **4 offene Gestalten** (3.2) |
| eigene Messung M-2: 10 Gestalten SQL-Vorauswahl gegen Entscheidung, echte `node:sqlite`, echter Port | **3 Asymmetrien** (B-1) |
| eigene Messung M-3: 10 Lagen `releaseUnclaimedBlobs`, echter Bestand, Attrappen-Blobport, plus Gegenprobe | 0 Abweichungen (3.1) |
| eigene Messung M-4: stiller Ausschalter der Versionsprüfung in einer Meßkopie | **vier Wächter bleiben grün** (B-2) |

**Nicht gefahren** (nicht gestartet, nichts abgebrochen): `pnpm check` als Ganzes, `test:coverage`,
`test:rust`, `build`, `verify:bundle`, `contrast`, `test:e2e`, `proof:engines`, und die
Nachweisläufe ohne Bezug zum Änderungsumfang: `proof:surface`, `clamp`, `foreign`, `locked`,
`shell-surface`, `addin`, `addin-wiring`, `taskpane`, `openapi`, `export`, `export-api`, `tags`,
`conflicts`, `codepoints`, `migrations`, `template-fields`, `db-permissions`.

**`proof:access`: nicht gefahren, umgebungsbedingt.** Auf diesem Rechner lauscht ein echter
`takt-local-api` auf `127.0.0.1:17843` **und** `:17844` (`ss -ltnp`, pid 900502); der Lauf verlangt
beide Ports für sich und bricht mit „Auf 127.0.0.1:17843 lauscht bereits etwas" ab. Das ist kein
Befund am Code — es gehört trotzdem in den Bericht, weil ein an einem belegten Port gescheiterter
Prüflauf in der nächsten Runde als „grün" erinnert wird.

**Semgrep (SAST, Geheimnisse, Lieferkette): nicht gefahren.** Der Guardian-Dienst antwortet
„Not logged into Semgrep Guardian". Eine Anmeldung nehme ich nicht von mir aus vor.

**42Crunch-Audit gegen `apps/local-api/openapi/takt-local-api.yaml`: nicht gefahren.** Der
Änderungsumfang berührt keine Route, kein Schema und keine Beschreibung; `proof:openapi` ist von
T-320 unberührt. **42Crunch-Scan: nicht gefahren** — kein eigens gestarteter Dienst, und den
laufenden Dienst des Benutzers fasse ich nicht an.

**Meßkopien lagen im Kratzverzeichnis** (`git archive 311b26e`, `node_modules` verlinkt).
`git status` im Vorhaben zeigt ausschließlich meine beiden eigenen Dateien.

---

## 2 — Befunde

```
packages/storage/src/sqlite/repo-attachments.ts:404   niedrig  B-1  Die SQL-Vorauswahl ist seit T-320 ENGER als die Entscheidung — die
                                                                    Ungleichung, die drei Zeilen darüber als tragend ausgeschrieben steht,
                                                                    ist gekippt. Latent, heute unerreichbar. Gegenmittel A-A-103.
apps/local-api/scripts/proof-release-safety.mjs:1223  mittel   B-2  Die Bauart aus T-287 ist als KLASSE nicht zu: ein Leser von app_setting
                                                                    außerhalb des Prüferordners, über eine andere Spalte, der über die
                                                                    Optionen des Prüfers wirkt, ist gemessen und bleibt grün.
                                                                    Gegenmittel A-A-105. Keine Behebung nötig — heute gibt es ihn nicht.
packages/domain/src/attachment.ts:1034                niedrig  B-3  „Die weiteste Frage" ist die weiteste NAMENSBASIERTE Frage. Vier
                                                                    Gestalten sagen „kein Eigentümer", wo eine Datei gemeint ist; alle vier
                                                                    sind auf der Namensseite unerreichbar, auf der Gegenseite nicht.
                                                                    Der Satz darüber fehlt. Gegenmittel A-A-104.
apps/local-api/src/features/todos/attachments.ts:392  niedrig  B-4  Kein Wächter bemerkt eine NEUNTE löschende Stelle. T-320 hat einen
                                                                    solchen Lauf bewußt nicht gebaut; die Begründung (E-099 Punkt 3) trägt
                                                                    hier nicht. Gegenmittel A-A-102.
```

### B-1 — `packages/storage/src/sqlite/repo-attachments.ts:404` · niedrig · latent

`attachmentsNamingFiles` sagt über seinen eigenen `LIKE` (Zeile 386 ff.): *„Die Vorauswahl hier ist
absichtlich weiter als die Entscheidung. … Eine Vorauswahl, die enger wäre als die Entscheidung,
hielte Zeilen zurück, die der Entscheider als Eigentümer erkannt hätte — und jede zurückgehaltene
Zeile ist eine gelöschte Datei. Wer diese Anweisung ändert, prüft zuerst diesen Satz."*

T-318 hat den Satz für die damalige Entscheidung nachgerechnet und bestätigt. **T-320 hat danach die
Entscheidung geändert, nicht die Anweisung** (`packages/domain/src/attachment.ts:1034`, dritter
Zweig über `trimResolvedTail` auf den **gesuchten** Namen) — und damit die Ungleichung gekippt: Der
neue Zweig verlangt nicht mehr, daß der Name wie übergeben eine Teilzeichenkette des `target` ist,
das Muster `%escapeLike(name)%` verlangt es weiterhin.

Gemessen (M-2, echte `node:sqlite`, echter `createAttachmentPort`, eine Zeile, ein Name):

| gesuchter Name | `target` der Zeile | reine Entscheidung | Vorauswahl + Entscheidung |
|---|---|---|---|
| `<hex>.png.` | `/x/<hex>.png` | **wahr** | **falsch** |
| `<hex>.png` + Leerzeichen | `/x/<hex>.png` | **wahr** | **falsch** |
| `<hex>.png..` | `/x/<hex>.png` | **wahr** | **falsch** |

**Auswirkung heute: keine, und das ist gemessen.** Beide Aufrufer geben einen Namen herein, der die
Kürzung schon hinter sich hat (`attachmentTargetFileName` in `releaseUnclaimedBlobs`,
`attachments.ts:424`) oder die Form bestanden hat (`handleOf` → `imageNameOf` → `pathOf`
beziehungsweise `emailFilePathOf` im Aufräumlauf). Es fällt keine Datei.

**Warum es trotzdem ein Befund ist:** Die Eigenschaft ist im Quelltext als tragend ausgeschrieben
und wird von niemandem mehr geprüft; der nächste Aufrufer, der einen ungekürzten Namen hereingibt,
verliert eine Datei mit Eigentümer — die eine Richtung, die dieser Bestand nicht zurücknehmen kann.

**Gegenmittel (A-A-103), eine Zeile plus eine Ausfuhr:** Gesucht wird mit der Teilzeichenkette, die
die Entscheidung **mindestens** verlangt — dem um nachgestellte Punkte und Leerzeichen gekürzten
Namen. `@takt/domain` stellt sie als ausgewiesene Funktion bereit (`trimResolvedTail` ist heute
modulprivat), damit die Regel an **einer** Stelle bleibt. Wer statt dessen die Vorbedingung zusagt
(„es kommen nur gekürzte oder formgeprüfte Namen herein"), schreibt sie an `attachmentsNamingFiles`
und **mißt** sie. Zuständig: domain-dev.

### B-2 — `apps/local-api/scripts/proof-release-safety.mjs:1223` (`checkNoStoreReadback`) · mittel · Wächterlücke, keine Schwachstelle

**Punkt 2 des Auftrags, und die Antwort ist zweigeteilt.**

Was T-320 zugesagt hat, **trägt**: `test`/`tests`/`__tests__` sind aus `SKIP_DIRECTORIES` fort, der
Baum wird zusätzlich beim Übersetzungsprogramm erfragt, die Gegenprobe ZZ-F′ steht mit eigenem
`erwartet` daneben, und der Lauf zeigt 76/0 (nachgefahren, nicht übernommen). Die fünfte Umgehung
ist zu.

Was **nicht** zu ist, ist die **Bauart**. Die Bauart heißt: *Weil die Datensicherung `app_setting`
als fremden Text vollständig ersetzt, ist jeder Leser dieser Tabelle, dessen Wert über die
ausgehende Anfrage entscheidet, ein stiller Ausschalter der Versionsprüfung über ein präpariertes
Archiv.* Die fünf Gestalten messen davon: den Bezeichner `lastCheckAt`, den Spaltennamen
`last_version_check_at`, den unmittelbaren Datenbankgriff **im Ordner des Prüfers**, die Importmenge
**dieses Ordners**, die Gestalt des Ports.

**Gemessen (M-4).** Meßkopie des Zweigs, Ausschalter in `apps/local-api/src/composition.ts` — also
außerhalb des Prüferordners —, der eine **andere** Spalte liest (`SELECT locale FROM app_setting`)
und daraus `startDelayMs` und `intervalMs` auf rund 24 Tage setzt; defensiv geschrieben, damit kein
Prüflauf an einem Wurf statt an einer Messung scheitert:

| Lauf über die Meßkopie **mit** dem Ausschalter | Ergebnis |
|---|---|
| `tsc -p apps/local-api/tsconfig.json --noEmit` | **Exit 0** |
| `proof:release-safety` | **76 bestanden, 0 fehlgeschlagen** |
| `proof:route-policy` | 48 bestanden, 0 fehlgeschlagen |
| `proof:layers` | 36 bestanden, 0 fehlgeschlagen |

(Die erste, **eifrige** Fassung desselben Ausschalters ließ `proof:route-policy` mit
`no such table: app_setting` abstürzen. Das ist **keine** Erkennung, sondern ein Zufall der
Reihenfolge; die defensive Fassung fällt nicht auf.)

**Das ist keine zu weite Zusage von T-320.** Die Lückenliste bei `checkNoStoreReadback` sagt selbst,
ein Prüffall am Verhalten trage „nur so weit, wie die Nähte verdrahtet sind", und eine neue optionale
Option bliebe ungesetzt und grün. Der Wächter verspricht nicht mehr, als er mißt.

**Es ist heute auch keine Schwachstelle.** Gemessen am Stand: `createVersionChecker`
(`composition.ts:250`) bekommt `logger`, die Uhr, die Abholfunktion aus den Optionen des Zusammenbaus
und einen **schreibenden** Verschluß mit einer einzigen Methode; `versionCheck.start()`
(`main.ts:619`) steht unbedingt im Rumpf von `main()`; keine der fünf Datenbankmarken kommt in
`composition.ts` oder `main.ts` vor (gezählt: 0 von 5 in beiden Dateien).

**Gegenmittel (A-A-105) — eine sechste Gestalt an der Verdrahtung, nicht ein sechster Name:**

1. **(a, tragend)** Das Aufrufobjekt von `createVersionChecker` trägt ausschließlich die
   festgenagelten Schlüssel, jeder mit einer festgenagelten Wertform.
2. **(b, tragend)** `versionCheck.start()` kommt genau einmal vor und **nicht** in einer Bedingung.
3. **(c, billig, allein nicht tragend)** Keine der fünf Datenbankmarken in einer Datei, die
   `createVersionChecker` oder `versionCheck` nennt. Allein trägt (c) nicht: Der Weg über
   `unit.settings.load()` trägt keine der Marken.

Alle drei sind mit dem Übersetzungsprogramm meßbar, das der Lauf seit T-320 ohnehin auflöst, und
alle drei sind an der **Anforderung** aufgespannt („nichts aus dem Bestand entscheidet, ob die
Anfrage hinausgeht") und nicht an einer Datei. Zuständig: domain-dev.

**Ein Nebenbefund derselben Fläche, geprüft und entwarnt:** `app_setting.skipped_version` **wird**
gelesen (`apps/web/src/features/settings/useUpdateNotice.ts:162`) und käme aus demselben Archiv. Er
ist kein Ausschalter: `packages/domain/src/version.ts:379` vergleicht mit
`comparePrecedence(...) === 0`, also auf **Gleichheit** der Fassung. Ein präpariertes Archiv
unterdrückt damit höchstens genau die Fassung, die es errät, und nicht die Prüfung.

### B-3 — `packages/domain/src/attachment.ts:1034` · niedrig · Zusage weiter als Messung

Der Vergleich ist die weiteste **namensbasierte** Frage; er ist kein Orakel für Dateigleichheit.
Gemessen (M-1, 27 Gestalten, Achsen aus T-319 und Angriffsnamen aus T-297; Steuer- und
Richtungszeichen über ihre Kennung und nicht als Zeichen):

**Trägt:** bloßer Name; voller POSIX- und Windows-Pfad; Groß-/Kleinschreibung auf **beiden** Seiten;
nachgestellter Punkt und nachgestelltes Leerzeichen auf **beiden** Seiten (die Symmetrie aus T-320,
gemessen und nicht geglaubt); `%` und `_` samt Lockvogelzeile; Pfadtrenner im gesuchten Namen
(buchstäblich am Ende; anderer Ordner trifft nicht); 400 Zeichen; `U+202E` im `target`; `..` im
`target`; `CON.png`; `k.png.exe` gegen `k.png` trifft **nicht** und soll nicht.

**Sagt „kein Eigentümer", wo eine Datei gemeint sein könnte:** `U+00A0`, `U+200B` und `U+0000` am
Ende des `target`; NFC gegen NFD in beide Richtungen.

**Alle vier sind auf der Namensseite unerreichbar**, und der Boden dafür ist nicht der Vergleich,
sondern der Adapter: `GENERATED_NAME_SHAPE` (`apps/local-api/src/access/attachment-store.ts:169`)
und `GENERATED_FILE_NAME_SHAPE` (`:204`) geben für jeden nicht erzeugten Namen `unknown_name`
zurück, und es fällt nichts. Nachgegangen für beide Wege, auf denen fremder Text in
`todo_attachment.target` kommt (Archiveinspielung, `sqlite3` nach VG-3): ein Bildeintrag mit
`target = '/anderswo/<hex>.png'` läuft in `unknown_name`; ein E-Mail-Eintrag mit bloßem Namen
ebenfalls, weil `emailPathFromTarget` (`:343`) den neu gebildeten Pfad **zeichengleich** gegen den
übergebenen hält.

Offen bleibt die **Gegenseite**: Windows-Kurznamensform, sinnbildlicher und harter Verweis,
Verbindungspunkt, zweiter Laufwerksbuchstabe. Jeder davon braucht eine Zeile, deren `target` der
Benutzer selbst eingetragen hat, und kostet dann eine Datei, deren Zeile stehenbleibt.
`attachmentNamesUnder` nennt die Kurznamensform ausdrücklich als hingenommen — dort kostet sie eine
**Bremse**; bei `attachmentTargetNamesFile`, wo sie eine **Datei** kostet, steht der Satz nirgends.

**Gegenmittel (A-A-104): ein Satz, keine weitere Frage.** Eine Frage, die das Dateisystem einbezöge,
gehörte nicht in `@takt/domain`. Zuständig: domain-dev.

### B-4 — `apps/local-api/src/features/todos/attachments.ts:392` · niedrig · fehlender Wächter

Das Inventar der löschenden Stellen ist an der Platte gemessen (3.1) und heute vollständig
behandelt. Es gibt aber **keinen Lauf**, der eine neunte Stelle bemerkte. T-320 hat einen solchen
Lauf bewußt nicht gebaut, mit der Begründung, seine Menge wäre „an der Route aufgespannt"
(E-099 Punkt 3).

**Die Begründung trägt hier nicht.** Die Menge „jeder Aufruf von `removeImage`/`removeEmailFile`
außerhalb des Adapters" ist an der **Anforderung** aufgespannt, denn das Inventar zeigt gemessen,
daß es in diesem Erzeugnis keinen zweiten Weg zum Aufheben einer Blob-Datei gibt: In
`apps/desktop/src-tauri/src` kommt **keine** Entfernungsmarke vor, auch nicht in `attachment.rs`,
und in den Merkmalen gibt es außerhalb der drei Adapter kein `fs.rm`, kein `unlink`, kein `rmSync`.

**Gegenmittel (A-A-102), beide Richtungen:** (1) keine Entfernungsmarke außerhalb von
`access/attachment-store.ts`, `access/token-store.ts` und `sqlite/file-port.ts`; (2) jeder Aufruf
von `removeImage`/`removeEmailFile` außerhalb des Adapters liegt in einer benannten Liste, und **eine
Liste, die ins Leere zeigt, ist ein Befund** — dieselbe Bauart wie `LAST_CHECK_COLUMN_FILES`.
Zuständig: domain-dev.

---

## 3 — Die drei Fragen des Auftrags, einzeln beantwortet

### 3.1 Ist die **Klasse** zu? — ja an ihren Stellen, nein als Wächter

Gesucht über `removeImage|removeEmailFile|unlink|rmdir|removeFile|fs\.rm|remove_file|std::fs::remove`
in `apps/local-api/src`, `packages/{storage,domain,export}/src`, `apps/{web,outlook-addin}/src`,
`apps/desktop/src-tauri/src`. Acht Stellen, dieselben acht wie im Inventar von T-320 — **unabhängig
gefunden, nicht übernommen** —, dazu die Feststellung, daß die Hülle gar keine Datei aufhebt.

Die drei löschenden Stellen fragen dieselbe Frage; die drei ohne Frage sind über eine **Eigenschaft**
begründet (Name aus `randomUUID()` im selben Aufruf, nie eine Zeile); die beiden Adapterstellen
räumen ihre eigene, gerade angelegte Datei ab.

`releaseUnclaimedBlobs` selbst ist am echten Bestand gemessen (M-3, `node:sqlite`, echter
`createAttachmentPort`, Attrappen-Blobport), nicht am Kommentar:

| Lage | entfernt |
|---|---|
| Bildkopie ohne Beansprucher | **fällt** |
| Zeile B nennt sie mit vollem Pfad (vierter Weg aus T-314) | bleibt, `info attachment_release_claimed files=1` |
| Zeile B nennt sie in anderer Schreibweise | bleibt |
| Zeile B nennt sie mit nachgestelltem Punkt | bleibt |
| Zeile B ist `kind = 'link'` und trägt den Namen | bleibt (weiter als nötig — richtige Richtung) |
| Zeile B nennt einen anderen Namen | fällt |
| Stapel aus zwei Dateien, eine beansprucht | genau die unbeanspruchte fällt |
| `target` ohne beurteilbaren Namen (Ordner) | weder gefragt noch entfernt |
| die Frage wirft | **nichts** fällt, kein Wurf weitergereicht, `warn attachment_release_unavailable files=1 reason=typeerror` |
| **Gegenprobe:** Eigentümerantwort blind leer | die Datei fällt wieder — die Messung hängt an der Frage |

`releasableBlobOf` gemessen: `image/app` → Bild, `file/email` → E-Mail-Datei, `file/user` → `null`,
`link/user` → `null`. Ein vom Benutzer eingetragener Pfad kommt nicht in Frage.

**Der Einspielweg entfernt keine Datei.** `importDataArchive` ersetzt `todo_attachment` vollständig
und läßt die Dateien liegen; was danach niemand nennt, fällt erst im Aufräumlauf, also unter der
weitesten Frage. Das ist die sichere Richtung und die einzige Stelle im Bestand, an der fremder Text
Zeilen **verschwinden** läßt.

**Welche Gestalt ich nicht gefahren habe:** kein Lauf gegen ein echtes Dateisystem unter Windows —
also keine Messung an Kurznamensform, Verbindungspunkten, nachgestellten Punkten **auf der Platte**
und an `EBUSY` bei geöffnetem Betrachter. Der Läufer ist Linux; A-A-4 und A-A-10 gelten. Kein
End-zu-End-Lauf über die Route (`DELETE /todos/{id}`) mit laufendem Dienst — gemessen ist der
Anwendungsfall, nicht die Tür davor. Und keine Messung mit zwei gleichzeitigen Anfragen (das Fenster
in 4).

### 3.2 Der Namensvergleich als Sicherheitsgrenze

Siehe B-3. 27 Gestalten, 0 Abweichungen gegen die Erwartung, 4 offene Gestalten, alle vier auf der
Namensseite durch die Formprüfung des Adapters unerreichbar, auf der Gegenseite nicht.

### 3.3 `attachmentNamesOfKind(kind)` — alle Zeilen oder nur eine Art?

**Nur eine Art** (`WHERE a.kind = ?`, `repo-attachments.ts:455`). Für eine Löschentscheidung wäre
das derselbe Fehler wie gar keine Frage — sie entscheidet aber keine: genau **ein** Aufrufer
(`main.ts:383`), dort mit `attachmentNamesUnder` zu `expected` vereinigt, und `expected` speist
ausschließlich `missing` (`orphan-sweep.ts:406`), also eine **Bremse** (`refused: 'contradiction'`,
`:427`). Eine zu kleine Antwort kostet dort eine Bremse, nie eine Datei.

Die Enge ist damit richtig, und die einzige Gefahr daran ist der **Name** der Methode: Er klingt wie
ein Inventar. Die Portbeschreibung sagt bereits, was sie nicht ist; ein Aufrufer, der sie je als
Eigentümerantwort liest, hat den Satz gelesen und verworfen. Kein Befund.

**Nebenbefund, nicht neu:** Ein präpariertes Archiv kann mit **einer** Bildzeile, deren `target` auf
einen Ordner außerhalb zeigt, den Bildaufräumlauf dauerhaft bremsen. Über `claimed > owned` war das
schon vorher so; die Vereinigung fügt keine neue Klasse hinzu, und die Richtung ist die sichere.

---

## 4 — Was hingenommen bleibt, ohne Auflage

**Zwischen der Frage und dem Aufheben liegt ein Augenblick.** `releaseUnclaimedBlobs` fragt nach dem
`COMMIT` und entfernt danach. Eine Zeile, die in diesem Fenster entsteht und dieselbe Datei nennt,
verliert sie. Der Aufräumlauf kehrt dieselbe Reihenfolge um („erst das Verzeichnis, dann der
Bestand") und überlebt sein Fenster; hier läßt sich das nicht spiegeln, weil die Datei bereits liegt.
Das Fenster ist Millisekunden breit, verlangt eine Zeile, die genau auf Takts eigene Kopie zeigt —
und **vor T-320 fiel die Datei in jedem dieser Fälle**. Die Richtung ist besser geworden; benannt,
keine Nummer.

---

## 5 — Repository-Hygiene

Der Unterschied `4a52edc..311b26e` wurde gegen Zugangsdaten, Kundendaten und echte Call-Nummern
gelesen: keine Ziffernfolge der Gestalt `\b[0-9]{5,6}\b` in einer hinzugefügten Zeile, keine
E-Mail-Adresse, keine Marke aus `password|passwort|secret|api[_-]?key|token *=|bearer |BEGIN (RSA|EC|
OPENSSH|PRIVATE)|xoxb-|ghp_|AKIA`. Die Prüfdaten in den geänderten Prüfdateien sind erfunden
(`TCK-0000…`, `example.invalid`). `pnpm audit`: keine bekannten Schwachstellen.

---

## 6 — Urteil

**Strang T-320 Punkt 1 (die Löschpfade): freigegeben.** Die Frage ist an jeder der drei löschenden
Stellen dieselbe und die weiteste, die eine namensbasierte Regel stellen kann; die drei Stellen ohne
Frage sind über eine Eigenschaft begründet und nicht über Bequemlichkeit; der Fehlschlag der Frage
läßt nichts fallen und ist nicht still; die Gegenprobe zur Messung dreht auf rot. B-1, B-3 und B-4
blockieren nicht: B-1 ist heute unerreichbar, B-3 ist ein fehlender Satz über einen Boden, der hält,
B-4 ist ein fehlender Wächter über einen heute vollständig behandelten Bestand.

**Strang T-320 Punkt 2 (der Versionswächter): freigegeben.** Die fünfte Umgehung ist geschlossen und
nachgefahren (76/0). B-2 ist eine Lücke der Klasse, nicht des gebauten Standes, und der Wächter sagt
sie selbst an — es gibt heute nichts zu beheben, nur etwas zu messen.

**Strang T-321: freigegeben.** Die vier Zeichenketten sind nicht nachgezogen, sondern gegen die
Gestalt aus `REASON_SHAPE` gehalten und ausdrücklich gegen `unclassified` abgegrenzt; die Reparatur
in `note-boundary-property.test.ts` schärft eine Gegenprobe, die den wichtigsten Einzeltest dieses
Projekts (R-18) absichern soll und es für den Base64-Zweig nicht tat. Das ist eine
Sicherheitsverbesserung, keine Verhaltensänderung. Aus Sicherheitssicht ohne Befund.

**Die Zusage, und sie ist nicht weiter als die Messung:** Freigegeben ist der Stand `311b26e` gegen
die acht heute vorhandenen löschenden Stellen, gemessen auf **Linux**, ohne End-zu-End-Lauf über die
Route und ohne gleichzeitige Anfragen.

---

## 7 — Vorschlag für `risks.md`, wörtlich (der Orchestrator trägt ein, nicht ich)

**Anzuhängen an R-29**, das damit weiterhin **offen** bleibt:

> **Nachgetragen am 2026-09-12 (T-325), und der Eintrag bleibt trotzdem offen.** Die beiden in T-318
> gefundenen Stellen sind zu: `removeAttachment` und `removeTodo` stellen seit T-320 dieselbe weite
> Frage wie die Aufräumläufe, und sie ist am echten Bestand gemessen — einschließlich der Gegenprobe,
> die die Datei wieder fallen läßt, sobald die Antwort blind leer ist. Das Inventar der löschenden
> Stellen ist unabhängig nachgezählt: acht, davon drei mit Frage, drei mit einer begründeten
> Eigenschaft statt einer Frage, zwei in Adaptern, die ihre eigene gerade angelegte Datei abräumen.
> Die Hülle hebt keine Datei auf.
>
> **Offen bleibt die Klasse als Wächter.** Kein Lauf dieses Bestands bemerkt eine neunte Stelle.
> T-320 hat einen solchen Lauf abgelehnt, weil seine Menge „an der Route aufgespannt" wäre — die
> Begründung trägt hier nicht: Die Menge „jeder Aufruf von `removeImage`/`removeEmailFile` außerhalb
> des Adapters" ist an der Anforderung aufgespannt, denn es ist gemessen, daß es keinen zweiten Weg
> zum Aufheben einer Blob-Datei gibt. Gegenmittel A-A-102 (Bedrohungsmodell 41.8).
>
> **Und ein zweiter offener Punkt, an derselben Frage, aus der anderen Richtung** (Bedrohungsmodell
> 41.4): Die SQL-Vorauswahl in `attachmentsNamingFiles` ist seit T-320 **enger** als die
> Entscheidung, weil der neue dritte Zweig des Vergleichs nicht mehr verlangt, daß der Name wie
> übergeben eine Teilzeichenkette des `target` ist. Gemessen an drei Gestalten; heute unerreichbar,
> weil beide Aufrufer gekürzte oder formgeprüfte Namen hereingeben. Der Kommentar über der Anweisung
> nennt genau diese Ungleichung als tragend — sie ist es nicht mehr. Gegenmittel A-A-103.
>
> Dieser Eintrag bleibt offen, bis A-A-102 und A-A-103 gebaut sind.

**Neuer Eintrag**, vorgeschlagen als **R-30**:

> ## R-30 — Der Ausschalter, den kein Wächter an der Verdrahtung sucht
>
> **Schwere:** mittel. **Betrifft:** security-checker, domain-dev. Neu am 2026-09-12 (T-325,
> Bedrohungsmodell 41.6).
>
> Die Bauart aus T-287 heißt: Weil die Datensicherung `app_setting` als fremden Text vollständig
> ersetzt, ist **jeder** Leser dieser Tabelle, dessen Wert über die ausgehende Anfrage entscheidet,
> ein stiller Ausschalter der Versionsprüfung über ein präpariertes Archiv — still im Sinn von
> A-18.11. Bei unsignierten Erzeugnissen ist die Aktualisierungsmeldung der einzige Weg, auf dem
> eine Sicherheitsbehebung den Benutzer überhaupt erreicht.
>
> `proof:release-safety` mißt diese Bauart an fünf Gestalten, und alle fünf hängen an einem
> **Bezeichner** oder an einem **Ordner**: `lastCheckAt`, `last_version_check_at`, der
> Datenbankgriff im Ordner des Prüfers, die Importmenge dieses Ordners, die Gestalt des Ports.
> Gemessen am 2026-09-12: Ein Ausschalter in `composition.ts` — außerhalb des Ordners, über die
> Spalte `locale`, wirksam über `startDelayMs`/`intervalMs` — übersetzt mit Exit 0 und läßt
> `proof:release-safety` (76/0), `proof:route-policy` (48/0) und `proof:layers` (36/0) grün.
>
> **Es gibt heute nichts zu beheben** — die Verdrahtung ist sauber, und der Wächter sagt diese Lücke
> in seiner eigenen Liste an. Offen ist der Wächter darüber: Gegenmittel A-A-105, eine sechste
> Gestalt an der **Verdrahtung** statt ein sechster Name. Dieser Eintrag bleibt offen, bis sie
> steht.

---

## Kurzfassung

Aufgabe: T-325 — Sicherheitsfreigabe über T-320 und T-321
Status: fertig
Artefakte: `.claude/team/reports/T-325-security-checker.md`, `docs/bedrohungsmodell.md` (neuer
Abschnitt 41 mit den Auflagen A-A-102 bis A-A-105)
Zusammenfassung: Die Löschklasse aus R-29 ist an ihren acht Stellen gemessen zu — Inventar unabhängig
nachgezählt, `releaseUnclaimedBlobs` in zehn Lagen am echten Bestand gefahren, Gegenprobe dreht auf
rot. Der Namensvergleich trägt in 27 Gestalten; die vier, die er nicht trägt, sind auf der Namensseite
durch die Formprüfung des Blob-Adapters unerreichbar. Zwei Befunde sind neu: die SQL-Vorauswahl ist
seit T-320 **enger** als die Entscheidung (latent, drei Gestalten gemessen), und die Bauart des
stillen Ausschalters der Versionsprüfung ist als Klasse nicht zu (ein übersetzender Ausschalter
außerhalb des Prüferordners läßt vier Wächter grün). `attachmentNamesOfKind` ist absichtlich eng und
entscheidet keine Löschung — sie speist nur eine Bremse.
Annahmen: (1) Die Formprüfung des Blob-Adapters gilt mir als der tragende Boden unter dem
Namensvergleich — deshalb bewerte ich die vier offenen Vergleichsgestalten als unerreichbar statt als
Befund. (2) Ein latenter Bruch einer im Quelltext als tragend ausgeschriebenen Eigenschaft ist ein
Befund, auch wenn heute keine Datei fällt. (3) Ein Wächter, dessen Lücke er selbst ansagt, ist keine
zu weite Zusage — deshalb blockiert B-2 nicht.
Risiken: B-1 (niedrig, latent, Datenverlustrichtung), B-2 (mittel, Wächterlücke), B-3 (niedrig,
fehlender Satz), B-4 (niedrig, fehlender Wächter). Dazu ein hingenommenes Zeitfenster zwischen Frage
und Aufhebung (4). Nicht gefahren und deshalb nicht zugesagt: Windows-Dateisystem, End-zu-End über die
Route, gleichzeitige Anfragen, Semgrep, 42Crunch.
Offene Fragen: (1) Gehen A-A-102 bis A-A-105 als **ein** Auftrag an domain-dev oder werden A-A-103
(eine Zeile, Datenverlustrichtung) und der Rest getrennt? (2) Soll `proof:access` auf einem Rechner
ohne laufenden Dienst nachgefahren werden, bevor die Welle schließt? (3) Soll die Semgrep-Anmeldung
eingerichtet werden — ohne sie fehlt der Lieferketten- und Geheimnislauf dauerhaft.
Nächster Schritt: R-29 um den Absatz aus 7 ergänzen und **offen** lassen, R-30 anlegen, danach
A-A-103 und A-A-102 als Auftrag an domain-dev; A-A-105 darf in die Welle danach.
