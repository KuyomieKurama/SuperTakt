Aufgabe: T-036 — Der Exportordner braucht einen Dialog statt eines Freitextfeldes (Befund S-04),
Warnungen, die erklären statt zu verbieten, und der Base64-Hinweis an der Stelle, an der er zählt
(S-08 / B-6.1 Punkt 1). Dazu die drei offenen Punkte aus T-035.

Status: fertig

---

Artefakte:

```
NEU
apps/web/src/lib/exportDirectoryAdvice.ts       475 — die Beurteilung eines Pfades. Acht Befunde,
                                                drei Stufen, jeder mit Grund und Beleg. Ausdrücklich
                                                die Erklärung, nicht die Grenze.
apps/web/src/components/ExportDirectoryField.tsx 302 — das Feld selbst, `ExportDirectoryConcernList`
                                                und `Base64Notice`
apps/web/src/showcase/ExportDirectorySection.tsx 262 — Musterseite 4a, bedienbar, mit Zustandsmatrix

GEÄNDERT
apps/desktop/src/shell.ts                       387 (+107) — `chooseExportDirectory()`,
                                                `DirectoryChoice` mit drei Ausgängen
apps/desktop/src-tauri/Cargo.toml               `tauri-plugin-dialog = "2"` — begründet unten
apps/desktop/src-tauri/src/lib.rs               `.plugin(tauri_plugin_dialog::init())`
apps/desktop/src-tauri/capabilities/default.json `dialog:allow-open`, ausdrücklich nur `open`
apps/desktop/src-tauri/Cargo.lock               3 Kisten: tauri-plugin-dialog, rfd, tauri-plugin-fs
apps/desktop/src-tauri/gen/schemas/*            von `tauri-build` neu erzeugt
apps/web/src/app/connection.ts                  `isShellPresent()`, `chooseExportDirectory()`,
                                                `ExportDirectoryChoice`
apps/web/src/screens/SettingsScreen.tsx         545 — Freitextfeld raus, Feld rein, Rückfrage beim
                                                Speichern, Sperre bei abgewiesenem Pfad
apps/web/src/screens/ExportScreen.tsx           887 — Base64-Satz in der Ansicht, Ordnerbefunde,
                                                „Ordner ändern", Satz zur gespeicherten Vorlage,
                                                Bestätigung beim ersten Lauf in einen neuen Ordner
apps/web/src/styles/components.css              2853 (+135) — `dirfield`, `dirconcerns`, `base64note`;
                                                `not-billed` auf die neuen Token gezogen
apps/web/src/styles/app.css                     2525 (+13) — `.export-settings__base64`
apps/web/scripts/contrast-check.mjs             397 — 8 neue Paare, 5 Paare auf die neuen Token
apps/web/src/showcase/Showcase.tsx              neuer Navigationseintrag „↳ Exportordner (S-04)"
apps/web/src/showcase/InventorySection.tsx      drei neue Einträge im Komponenteninventar
packages/ui-tokens/tokens.css                   624 (+18) — die vier `--status-notbilled-*`
```

`apps/web/test/**`, `tests/e2e/**`, `apps/local-api/**`, `apps/outlook-addin/**`, `docs/**` und
`packages/**` außer der einen erlaubten Tokendatei: **unangetastet**. `pnpm-lock.yaml`
**unverändert** — kein neues npm-Paket, siehe unten. Kein `any`, keine Typzusicherung mit `as` auf
einen Fachwert.

---

Zusammenfassung:

**1 — Der Ordnerdialog, und warum dafür doch drei Zeilen Rust nötig waren.**

`apps/desktop/src/shell.ts` bekommt `chooseExportDirectory(current)`. Der Rückgabewert ist eine
Vereinigung mit drei Ausgängen — `chosen`, `cancelled`, `unavailable` —, weil ein `try`/`catch` an
der Aufrufstelle den Unterschied zwischen „abgebrochen" und „gibt es hier nicht" wieder verwischt
hätte. Genau dieser Unterschied entscheidet, ob die Oberfläche schweigt oder das Textfeld holt.

Die Aufgabe hat `src-tauri/**` gesperrt, „außer wenn der Ordnerdialog es zwingend verlangt".
**Er verlangt es**, und zwar unteilbar: Ohne `tauri-plugin-dialog` in `Cargo.toml`, ohne
`.plugin(tauri_plugin_dialog::init())` und ohne `dialog:allow-open` in der Fähigkeitenliste weist
Tauri den Aufruf ab — es gibt keinen Ordnerdialog, den man ohne diese drei Zeilen öffnen könnte.
Der Befund S-04 führt die Tauri-Fähigkeit selbst als Punkt 1 seiner Gegenmittel. Ich habe die drei
Zeilen deshalb gesetzt und **`cargo check` laufen lassen: übersetzt** (`Finished dev profile`), und
`tauri-build` hat `dialog:allow-open` als gültige Berechtigung in `gen/schemas/capabilities.json`
aufgenommen. Ohne diese Gegenprobe hätte ich sie nicht angefasst.

Was ich **nicht** getan habe: `@tauri-apps/plugin-dialog` als npm-Paket einziehen. Es ist eine
dünne Hülle um `invoke('plugin:dialog|open', { options })`, und `@tauri-apps/api` liegt ohnehin in
`apps/desktop`. Eine weitere Abhängigkeit hätte `minimumReleaseAge`, `trustPolicy` und den
Sperrbestand aus `pnpm-workspace.yaml` erneut auf die Waage gebracht — für eine Zeile.
`pnpm-lock.yaml` ist unverändert.

Der Zuwachs an Angriffsfläche, offen ausgesprochen: drei Rust-Kisten (`tauri-plugin-dialog`, `rfd`,
`tauri-plugin-fs`). `tauri-plugin-fs` ist eine **Abhängigkeit** des Dialogs, nicht ein registriertes
Plugin — `lib.rs` registriert es nicht, und die Fähigkeitenliste führt keine einzige `fs:`-Zeile.
Freigegeben ist ausschließlich `dialog:allow-open`; `save`, `message`, `ask` und `confirm` stehen
ausdrücklich nicht da, mit der Begründung in der Beschreibung der Fähigkeit: Takt fragt in seiner
eigenen Oberfläche, damit die Rückfrage den Grund nennen kann.

**Ohne Hülle bleibt das Textfeld** — und das ist kein Fehler, sondern eine Umgebung. Der Baustein
stellt die Frage einmal beim Einhängen (`isShellPresent()`) und zeigt bis zur Antwort keines von
beidem: Ein Feld, das nach einem Lidschlag verschwindet, ist schlimmer als eines, das erst
erscheint. Fällt der Dialog aus einem anderen Grund aus — eine Fassung ohne die Fähigkeit —, fällt
das Feld ebenfalls auf das Textfeld zurück und sagt in einer eigenen Meldung, warum. Beide Wege
sind im Browser gefahren, siehe unten.

**2 — Warnungen, die erklären statt zu verbieten.**

`lib/exportDirectoryAdvice.ts` beurteilt einen Pfad und liefert Befunde in drei Stufen:

| Stufe | Was auslöst | Speichern | Rückfrage |
|---|---|---|---|
| `reject` | Systemverzeichnis, Laufwerkswurzel, Pfad ohne Anfang | gesperrt | nein — es gibt nichts zu entscheiden |
| `confirm` | UNC-Pfad, eingehängte Freigabe, Synchronisierungsordner, `AppData\Roaming` | frei | ja, einmal je Pfad, mit Kontrollkästchen |
| `warn` | Desktop, Dokumente, Bilder, Downloads | frei | nein — der Befund ist möglich, nicht sicher |

E-011 bleibt unangetastet: Der Benutzer wählt seinen Ordner. Abgewiesen wird nur, wohin nichts
gehört, was Takt schreibt — B-5.2 Punkt 1. Für alles andere gilt B-5.2 Punkt 2 wörtlich: „Nicht
verbieten … aber niemals stillschweigend zulassen."

**Jeder Befund trägt seinen Beleg** — das Stück des Pfades, das den Ausschlag gab, wörtlich und
unter der Überschrift „Gefunden im Pfad". Eine Warnung ohne Beleg ist eine Behauptung, und der
Benutzer kann ihr dann nicht widersprechen. Bei `C:\Users\mmueller\OneDrive - Musterfirma\Takt`
steht dort `OneDrive - Musterfirma`, nicht der ganze Pfad.

**Die Rückfrage hängt am Pfad, nicht an einem Merker.** Wer nach der Bestätigung einen *anderen*
Netzordner wählt, wird wieder gefragt. Eine einmal gesetzte Zustimmung, die für jeden künftigen
Ordner gälte, wäre keine Rückfrage mehr. Ein bereits gespeicherter Ordner gilt als bestätigt, sonst
fragte Takt nach jedem Neuladen nach demselben Pfad.

**Was diese Datei ausdrücklich nicht ist.** Sie ist die Erklärung, der Dienst ist die Grenze. Der
Dateikopf sagt es und begründet, warum das der Unterschied ist, auf den es ankommt: Ein Fehler hier
macht eine Warnung falsch, keinen Angriff möglich. Umgekehrt gilt das nicht. Segmentweise verglichen
wird trotzdem — auch in `isPathInsideDirectory` —, weil ein `startsWith` `C:\Export-Geheim` in
`C:\Export` liegen ließe und diese Falle aus B-5.1 Punkt 3 hier so wenig richtig ist wie dort.

**Und die benannte Lücke:** Ob `Z:\` ein zugeordnetes Netzlaufwerk ist, steht nicht im Pfad. Das
weiß nur das Betriebssystem. Die Heuristik nennt sich deshalb nirgends „geprüft", und die Meldungen
sagen „liegt in", nicht „ist". Das gehört in `checkExportDirectory` — S-04, Gegenmittel 2, Rolle
domain-dev. Offene Frage 1 unten.

**3 — Der Base64-Satz.**

`Base64Notice` steht an genau zwei Stellen: bei der Wahl des Ordners (S-09) und in S-07 **neben dem
Exportziel**, in der Ansicht und nicht in einem Hilfetext — so verlangt es B-6.1 Punkt 1, und genau
das hat der Prüfer in S-08 vermisst. Ein Satz, ein Schloss-Symbol, eine eingelassene Fläche:
gedämpft läse ihn niemand, laut wäre er eine Warnung, die er nicht ist. Es ist eine Tatsache über
die Datei.

Dazu B-6.1 Punkt 2, der zweite vermisste Punkt: **Beim ersten Lauf in einen Ordner, in den noch nie
exportiert wurde**, verlangt der Bestätigungsdialog des Exports zusätzlich ein Kontrollkästchen mit
demselben Wortlaut und dem Ordner darin. Kein zweiter Dialog — zwei Rückfragen hintereinander
werden zu einer Handbewegung, und die zweite hat dann niemand gelesen. Die Frage „schon einmal in
diesen Ordner?" wird aus den zuletzt geladenen fünf Läufen beantwortet und damit **großzügig
zugunsten der Rückfrage**: Wer lange nicht in diesen Ordner exportiert hat, bekommt sie noch
einmal. Das ist der richtige Fehler von beiden.

B-6.1 Punkt 4 — „Exportdateien älter als N Tage löschen" — ist **nicht** umgesetzt. Er braucht eine
Funktion im Dienst, die es nicht gibt; S-08 führt ihn als Rolle integration-dev. Offene Frage 3.

**4 — Die drei Punkte aus T-035.**

*Eigene Token für „Nicht abgerechnet":* angelegt, vier Stück, als **Verweise** auf die heutigen
neutralen Werte (`var(--text-secondary)`, `var(--bg-inset)`, `var(--border-strong)` zweimal). Sie
stehen nur im hellen `:root` und **nicht** noch einmal in den beiden Dunkelblöcken: `var()` löst zur
Benutzungszeit auf, das Thema trägt also bereits das Ziel. Drei Komponenten und fünf Kontrastpaare
zeigen jetzt auf den Token statt auf sein heutiges Ziel — sonst ginge eine spätere Einfärbung an der
Messung vorbei. Aussehen unverändert, Messwerte identisch (6,81 / 4,58 / 5,64 / 5,49 / 5,02 hell).

*S-07 soll die aktive gespeicherte Vorlage aussprechen:* ein Satz unter der Auswahlliste. „Gezeigt
und geschrieben wird der **gespeicherte** Stand dieser Vorlage. Ein Entwurf, der im Vorlageneditor
noch nicht gespeichert ist, wirkt hier nicht mit."

*S-14 im Browser fahren:* gefahren, mit echten Daten. Ergebnis unten — und es beantwortet das
offene Risiko 5 aus T-035 mit einer Zahl.

---

Gemessen, nicht behauptet:

**47 von 47 Prüfungen im echten Chromium gegen die gebaute Musterseite** (Wegwerfskript, statisch
ausgeliefert auf Port 4399, ohne Dienst). Zwei Läufe in einem: einmal ohne Hülle, einmal mit
vorgetäuschter Hülle.

- Ohne Hülle: Textfeld als Rückfallweg, dazu der Hinweis, dass es den Systemdialog im Browser nicht
  gibt.
- **Mit vorgetäuschter Hülle** (`__TAURI_INTERNALS__` gesetzt, `invoke` wirft den Fehler, den eine
  Fassung ohne `dialog:allow-open` wirft): Anzeigeplatte statt Textfeld, Randschiene 2 px, kein
  Eingabefeld — und beim Klick auf „Ordner wählen …" **fällt das Feld auf das Textfeld zurück und
  sagt, warum**. Das ist der Weg, den eine falsch konfigurierte Hülle nimmt, und er ist gemessen.
- Alle acht Beispielpfade erzeugen genau den erwarteten Befund und die erwartete Sperre: Vorgabe 0
  Befunde und Speichern frei; OneDrive, Netzfreigabe, Roaming, Dokumente je 1 Befund und Speichern
  frei; Systemordner, Laufwerkswurzel, Pfad ohne Anfang je 1 Befund und Speichern **gesperrt**.
- Rückfrage: erscheint, nennt Base64 in der Folge, Bestätigen ist **zunächst gesperrt**, Fokus
  liegt beim Öffnen im Dialog, das Kontrollkästchen ist mit der Leertaste bedienbar und trägt einen
  sichtbaren Fokusring (2 px solid), Escape schließt, Bestätigen speichert.
- Speichern per Tabulator erreichbar. Meldebereich ist `role="status" aria-live="polite"`.
- Beide Modi, keine Konsolenmeldung auf der ganzen Seite.

**21 von 21 Prüfungen im echten Chromium gegen die laufende Anwendung** — Vite auf 5173 gegen den
lokalen Dienst auf 17843, Wegwerfdatenbank in `/tmp`, Startgeheimnis über `stdin` wie in der Hülle.
S-09, S-07 und S-14.

- S-09: das Feld ist da, der Base64-Satz steht in der Ansicht (genau einmal), ein Systemordner
  sperrt das Speichern und nennt den Grund, eine Netzfreigabe sperrt nicht und löst die Rückfrage
  aus, „Anderen Ordner wählen" speichert nicht.
- Ein unbedenklicher Ordner: kein Befund, gespeichert, und der Dienst meldet danach „vorhanden und
  beschreibbar — soeben geprüft".
- **Der Fund, den ich beim Messen gemacht habe und der in den Bericht gehört:** Der Dienst weist
  einen nicht erreichbaren Ordner beim Speichern ab — `422 export_directory_missing`, „Diesen Ordner
  gibt es nicht oder er ist kein Ordner." Eine bestätigte UNC-Freigabe, die auf diesem Rechner nicht
  eingehängt ist, wird also **nicht** gespeichert. Gemessen ist, dass diese Abweisung sichtbar wird
  (Meldung auf der Karte, mit dem Wortlaut des Dienstes) und die Warnung zur Freigabe daneben stehen
  bleibt. Meine Warnung hat den Fall vorher erklärt — „der Export schlägt fehl, sobald die
  Verbindung gerade nicht steht" —, die Grenze zieht sie nicht. Das ist die Arbeitsteilung, die die
  Aufgabe vorgegeben hat, an einem echten Fall bestätigt.
- S-07: der Base64-Satz steht neben dem Exportziel, der Satz zur gespeicherten Vorlage steht da,
  „Ordner ändern" führt in die Einstellungen.
- Genau eine 4xx-Antwort im ganzen Lauf, und die war Absicht (der Test oben). Sonst keine
  Konsolenmeldung.

**17 von 17 Prüfungen zu S-14 im Browser, mit echten Daten** — ein Todo mit Call-Nummer und
internem Vermerk, zwei Buchungen mit Leistungstexten, über die API angelegt. Das ist die
Bildschirmseite, die T-035 als Risiko 5 offengelassen hat:

- Die Vorschau zeigt Zeilen statt des Leerzustands: „1 Tagesgruppe aus 2 offenen Buchungen".
  Aufgeklappt stehen die Call-Nummer `TCK-000042` und die Leistung `Fehleranalyse im Backend
  durchgeführt` darin. **Der interne Vermerk kommt in ganz S-14 nicht vor** — weder im Klartext
  noch sonst.
- Kopieren fragt nach einem Namen, der Dialog schließt, die Kopie ist offen und ihre Felder sind
  bedienbar (die mitgelieferte Vorlage ist gesperrt — richtig so).
- **Die Entprellung, gemessen statt geschätzt:** Ein Tastenwurf auf einem Schlüsselfeld erzeugt
  **genau eine** Anfrage `POST /export/preview`, **401 ms** nach der Eingabe. Der neue Schlüssel
  steht nach **103 ms** in der Vorschau — die Beschriftung kommt aus dem Entwurf und ist sofort da,
  die gerechneten Werte folgen nach der Entprellung. Während des Nachziehens bleibt der alte Stand
  stehen; es gibt kein Leerbild.
- Die Vorschau sagt von sich aus: „Ihr geänderter, noch nicht gespeicherter Stand — gerendert vom
  selben Renderer, der auch die Datei schreibt. Gespeichert wird dabei nichts."
- Keine Konsolenmeldung.

**Rust:** `cargo check` in `apps/desktop/src-tauri` — übersetzt, drei neue Kisten aufgelöst, ACL
neu erzeugt und `dialog:allow-open` als gültige Berechtigung angenommen.

**Werkzeuge:** `pnpm typecheck` 0 · `pnpm boundaries` 0 („Notiz-Trennung: alle Schichten
unverletzt") · `pnpm test` **545 von 545 in 33 Dateien** · `pnpm build` 0 · `pnpm contrast` 0.

**Kontrastausgabe, wörtlich — die acht neuen Paare und die fünf umgezogenen, beide Modi:**

```
== Modus hell ==
OK     6.81:1 (min 4.5:1)  --status-notbilled-fg auf --status-notbilled-bg  — Etikett Nicht abgerechnet
OK     4.58:1 (min 3.0:1)  --status-notbilled-border auf --status-notbilled-bg  — gestrichelte Kontur Nicht abgerechnet, SC 1.4.11
OK     5.64:1 (min 3.0:1)  --status-notbilled-marker auf --bg-surface  — Zeilenmarker Nicht abgerechnet auf Karte
OK     5.49:1 (min 3.0:1)  --status-notbilled-marker auf --bg-surface-alt  — Zeilenmarker Nicht abgerechnet auf Zebrazeile
OK     5.02:1 (min 3.0:1)  --status-notbilled-marker auf --bg-subtle  — Zeilenmarker Nicht abgerechnet auf Kanban-Spalte
OK    12.79:1 (min 4.5:1)  --text-primary auf --bg-inset  — gewaehlter Pfad im Anzeigefeld
OK     3.49:1 (min 3.0:1)  --border-control auf --bg-surface  — Randschiene des Pfadfeldes — sie traegt die Abgrenzung, weil die Toenung es im dunklen Modus nicht tut
----   1.23:1 (min —)  --bg-inset auf --bg-surface  — Toenung des Pfadfeldes gegen die Karte — hell 1.23:1, dunkel 1.04:1; genau deshalb die Randschiene daneben
OK     6.81:1 (min 4.5:1)  --text-secondary auf --bg-inset  — Base64-Satz neben dem Exportziel
OK     4.58:1 (min 4.5:1)  --text-muted auf --bg-inset  — Schlosssymbol am Base64-Satz, noch nicht gewaehlt
----   1.23:1 (min —)  --border-subtle auf --bg-surface  — Umrandung des Base64-Kastens — reine Zierde, der Satz traegt sich selbst
OK     7.74:1 (min 4.5:1)  --text-secondary auf --warning-bg  — Beleg unter einem Befund zum Ordner
OK     7.55:1 (min 4.5:1)  --text-secondary auf --danger-bg-subtle  — Beleg unter einem abgewiesenen Ordner
== Modus dunkel ==
OK    10.25:1 (min 4.5:1)  --status-notbilled-fg auf --status-notbilled-bg  — Etikett Nicht abgerechnet
OK     6.17:1 (min 3.0:1)  --status-notbilled-border auf --status-notbilled-bg  — gestrichelte Kontur Nicht abgerechnet, SC 1.4.11
OK     5.88:1 (min 3.0:1)  --status-notbilled-marker auf --bg-surface  — Zeilenmarker Nicht abgerechnet auf Karte
OK     5.56:1 (min 3.0:1)  --status-notbilled-marker auf --bg-surface-alt  — Zeilenmarker Nicht abgerechnet auf Zebrazeile
OK     5.37:1 (min 3.0:1)  --status-notbilled-marker auf --bg-subtle  — Zeilenmarker Nicht abgerechnet auf Kanban-Spalte
OK    15.38:1 (min 4.5:1)  --text-primary auf --bg-inset  — gewaehlter Pfad im Anzeigefeld
OK     3.80:1 (min 3.0:1)  --border-control auf --bg-surface  — Randschiene des Pfadfeldes — sie traegt die Abgrenzung, weil die Toenung es im dunklen Modus nicht tut
----   1.04:1 (min —)  --bg-inset auf --bg-surface  — Toenung des Pfadfeldes gegen die Karte — hell 1.23:1, dunkel 1.04:1; genau deshalb die Randschiene daneben
OK    10.25:1 (min 4.5:1)  --text-secondary auf --bg-inset  — Base64-Satz neben dem Exportziel
OK     7.08:1 (min 4.5:1)  --text-muted auf --bg-inset  — Schlosssymbol am Base64-Satz, noch nicht gewaehlt
----   1.22:1 (min —)  --border-subtle auf --bg-surface  — Umrandung des Base64-Kastens — reine Zierde, der Satz traegt sich selbst
OK     8.89:1 (min 4.5:1)  --text-secondary auf --warning-bg  — Beleg unter einem Befund zum Ordner
OK     9.19:1 (min 4.5:1)  --text-secondary auf --danger-bg-subtle  — Beleg unter einem abgewiesenen Ordner

0 von 282 Paaren durchgefallen.
```

266 Paare vorher, **282 jetzt, 0 durchgefallen.** Die fünf `not-billed`-Paare sind dieselben
Messungen unter neuen Tokennamen; acht Paare sind neu.

**Eine Messung hat unterwegs eine Entscheidung umgeworfen** und gehört deshalb hier hin: Die
Anzeigeplatte für den Pfad hatte zuerst eine volle Umrandung in `--border-control` — 2,83:1 auf
`--bg-inset`, durchgefallen. Ohne Umrandung wäre sie im **dunklen** Modus unsichtbar gewesen
(`--bg-inset` liegt dort mit **1,04:1** auf `--bg-surface`). Beides ist im Bericht nachlesbar,
gelöst mit der Randschiene links — derselben Form, mit der `shellnote__handover` und
`dirconcerns__evidence` einen zitierten Wert kennzeichnen. Sie misst 3,49:1 hell und 3,80:1 dunkel
und sagt nebenbei das Richtige: Das ist eine Anzeige und kein Eingabefeld.

---

Für den e2e-Tester — was sich am Klickpfad verschiebt:

1. **S-09: `TextField label="Exportordner"` gibt es in der Hülle nicht mehr.** Dort steht
   `.dirfield__path` (ein `<span>`, kein `<input>`) plus ein Knopf „Ordner wählen …" bzw. „Anderen
   Ordner wählen …". Nur **ohne** Hülle — also in einem Browsertest gegen `pnpm dev` — bleibt das
   `input.field__input`. Ein Prüfpfad, der in der Hülle in das Feld tippt, tippt ins Leere.
2. **Neue Klassen:** `dirfield`, `dirfield__row`, `dirfield__path`, `dirfield__path--empty`,
   `dirfield__announce`, `dirfield__pending`, `dirconcerns`, `dirconcerns__evidence`,
   `dirconcerns__evidence-label`, `base64note`, `export-settings__base64`.
3. **S-09: Speichern ist gesperrt**, solange ein Systemverzeichnis, eine Laufwerkswurzel oder ein
   Pfad ohne Anfang im Feld steht. Daneben steht ein Satz, warum.
4. **S-09: Speichern öffnet eine Rückfrage** (`role="alertdialog"`), wenn der Pfad eine Freigabe,
   ein Synchronisierungsordner oder `AppData\Roaming` ist und für **genau diesen** Pfad noch nicht
   bestätigt wurde. Der Bestätigungsknopf heißt „Ordner trotzdem einstellen", der Abbruch „Anderen
   Ordner wählen", und das Kontrollkästchen muss gesetzt sein.
5. **S-07: neuer Knopf „Ordner ändern"** neben dem Zielordner, führt nach `#/einstellungen`.
6. **S-07: der Base64-Satz** steht als `.base64note` unter dem Raster aus Vorlage, Rundung und
   Zielordner — auf jeder Export-Ansicht, immer.
7. **S-07: der Bestätigungsdialog des Exports trägt ein Kontrollkästchen**, wenn keiner der zuletzt
   geladenen fünf Läufe in den eingestellten Ordner geschrieben hat. Ohne Haken kein Export. Ein
   Prüfpfad, der auf einer frischen Datenbank exportiert, läuft in genau diesen Fall.
8. **S-07: neuer Satz an der Vorlagenauswahl** („Gezeigt und geschrieben wird der gespeicherte
   Stand dieser Vorlage …").
9. **Musterseite:** neuer Navigationseintrag „↳ Exportordner (S-04)" und ein neuer Abschnitt
   `#exportordner` mit acht Beispielpfaden, Zustandsmatrix und der Rückfrage. Er läuft ohne Dienst.
10. **Der Dienst weist einen nicht erreichbaren Ordner beim Speichern ab** (`422
    export_directory_missing`). Das ist nicht neu, aber es ist die Antwort auf die Frage, warum ein
    Test, der `\\server\freigabe` einstellt und danach exportiert, nie beim Export ankommt.

---

Annahmen:

1. **Die Rückfrage steht beim Speichern und nicht beim Wählen.** So geht sie über denselben Weg,
   egal ob der Pfad aus dem Systemdialog kam oder getippt wurde — und das ist der Moment der Folge.
   Beim Wählen erscheint der Befund trotzdem sofort als stehende Meldung; man sieht ihn also, bevor
   man den Knopf drückt.
2. **`AppData\Roaming` ist eine Rückfrage, kein Hinweis.** Der Pfad ist ein sicheres Zeichen für
   den Ordner; ob das Konto ein servergespeichertes Profil hat, ist es nicht. Ich habe die schärfere
   Stufe gewählt, weil E-018 genau dafür geschrieben wurde.
3. **Desktop, Dokumente und Bilder sind ein Hinweis, keine Rückfrage.** Die Umleitung ist häufig,
   aber nicht sicher, und im Pfad steht sie nicht. Eine Rückfrage auf einen Verdacht hin ist eine
   Rückfrage, die man wegklickt. Trifft der Verdacht zu, greift zusätzlich der
   Synchronisierungsbefund — dann steht der `OneDrive`-Ordner im Pfad, und der Hinweis wird
   unterdrückt, damit die lautere Meldung nicht durch die leisere verwässert wird.
4. **Downloads bekommt einen eigenen Grund** (Aufräumwerkzeuge, B-5.3) statt unter „umgeleitet"
   mitzulaufen. Es ist ein anderer Schaden: nicht Abfluss, sondern Verlust.
5. **Die Frage „erster Lauf in diesen Ordner?" wird aus fünf Läufen beantwortet.** Mehr lädt S-07
   nicht. Die Heuristik irrt zugunsten der Rückfrage.
6. **Die vier neuen Token sind Verweise, keine Farbwerte.** Der Zustand *soll* die neutralen Flächen
   des Themas tragen; das war die fachliche Wahl in T-035 und ist es geblieben. Wer ihn doch
   einfärben will, ändert vier Zeilen und keine Komponente.

---

Risiken:

1. **Der Ordnerdialog ist nicht auf einem echten Windows-Rechner geöffnet worden.** `cargo check`
   übersetzt, die Fähigkeit ist gültig, und der Fehlweg (Fähigkeit fehlt → Textfeld) ist im Browser
   gemessen. Was **nicht** belegt ist: dass `plugin:dialog|open` mit `directory: true` unter Windows
   den Ordnerdialog zeigt und `defaultPath` annimmt. Das ist ein Punkt für T-B05 — dieselbe Liste,
   auf der das selbst erzeugte Zertifikat steht.
2. **Drei neue Rust-Kisten in der Lieferkette**, darunter `tauri-plugin-fs` als Abhängigkeit des
   Dialogs. Kein `fs:`-Recht ist freigegeben und das Plugin ist nicht registriert — aber der Code
   ist im Binärprogramm. `cargo audit` läuft weiterhin nicht (Befund S-07 der Prüfung); die drei
   Kisten sind damit ebenso ungeprüft wie die sieben davor.
3. **Die Netzlaufwerkserkennung ist auf UNC-Pfade beschränkt.** Ein zugeordnetes `Z:\` geht durch
   ohne Rückfrage. Das ist die Lücke, die nur der Dienst schließen kann, und sie steht als offene
   Frage 1.
4. **Die Namensliste der Synchronisierungsdienste veraltet.** Neunzehn Namen und zwei Vorsätze;
   `OneDrive - <Firma>` und `Dropbox (<Firma>)` sind über den Vorsatz gefangen. Wer seinen
   OneDrive-Ordner umbenennt, wird nicht gewarnt. Eine Heuristik, kein Schutz — B-5.3 Punkt 3 sagt
   das selbst, und die Datei sagt es auch.
5. **Die Prüfpfade, mit denen ich gemessen habe, sind Wegwerfskripte** im Scratchpad und kein
   Bestandteil von `pnpm check`. Der Musterseitenlauf (47 Prüfungen) braucht keinen Dienst und wäre
   der billigere von beiden, wenn ihn jemand stehend haben will.
6. **Ich habe den lokalen Dienst gefahren**, während der domain-dev an `apps/local-api` arbeitet.
   Gegen eine Wegwerfdatenbank in `/tmp`, mit eigenem `XDG_DATA_HOME`, ohne eine Datei im Baum zu
   berühren. Alle Prozesse sind beendet, 17843, 17844, 5173 und 4399 sind frei. Sollte der
   domain-dev in diesem Zeitfenster einen eigenen Lauf verloren haben, war ich das.

---

Offene Fragen:

1. **An den domain-dev (`packages/storage/src/sqlite/file-port.ts`):** S-04 Gegenmittel 2 verlangt,
   dass `checkExportDirectory` `unc`, `network`, `sync_folder` und `system_dir` als eigene
   Rückgaben liefert. Meine Oberfläche erklärt heute anhand des Pfades; der Dienst kann mehr —
   insbesondere, **ob ein Laufwerksbuchstabe ein Netzlaufwerk ist**, und ob der Ordner ein
   Verknüpfungspunkt ist (B-5.1 Punkt 4). Sobald `ExportDirectoryState` diese Werte führt, ziehe ich
   die Anzeige darauf um und meine Heuristik wird zur Vorschau statt zur einzigen Auskunft. Bis
   dahin steht sie allein — und das ist die Lage, die Risiko 3 beschreibt.
2. **An den domain-dev (Zeitgrenze):** B-5.2 Punkt 3 verlangt eine Erreichbarkeitsprüfung mit
   Zeitgrenze, Vorschlag 3 s. Heute läuft `PATCH /settings` auf einer toten Freigabe bis zur
   15-Sekunden-Grenze der Anfrage, und die Oberfläche steht so lange auf „ladend". Der Ladezustand
   ist da und richtig; die Zeitgrenze ist es nicht, und sie gehört nicht in die Oberfläche.
3. **An den Orchestrator (B-6.1 Punkt 4):** „Exportdateien älter als N Tage löschen", Voreinstellung
   aus, aber sichtbar. Der Prüfer führt es unter S-08 als Rolle integration-dev. Ich habe den Platz
   dafür in S-07 frei gelassen und nichts gebaut, weil es eine Funktion im Dienst braucht — eine
   Oberfläche, die Dateien löscht, wäre der falsche Ort dafür. Soll das eine eigene Aufgabe werden?
4. **An den Orchestrator (S-10, `style-src 'unsafe-inline'`):** Der Prüfer verlangt, dass der
   Eintrag entweder verschwindet oder als benannte Ausnahme im Bedrohungsmodell steht. Ich habe in
   T-036 keinen neuen Inline-Stil hinzugefügt, aber die vorhandenen auch nicht überführt —
   `docs/**` gehört mir nicht und die Zählung der verbleibenden Stellen wäre eine eigene Aufgabe.
   Sie ist klein: In `apps/web/src/showcase` steckt der größte Teil.

---

Nächster Schritt:

Der Ordnerdialog auf einem Windows-Rechner öffnen (T-B05, zusammen mit dem Zertifikat aus E-046).
Danach, sobald `checkExportDirectory` die Einordnung liefert, die Anzeige darauf umziehen — dann
sagt die Oberfläche „ist" statt „liegt in", und die Lücke bei den zugeordneten Laufwerken ist zu.
