Aufgabe: T-049 — `windowsUser` und `databasePath` in `SettingsView` aufnehmen und in S-09 anzeigen.
Die Anzeige so gestalten, dass sie das trägt, wozu sie da ist: Der Name geht in jede Exportzeile
und ist über einen abgesicherten Kanal beschafft (E-042) — eine Absicherung, die niemand nachsehen
kann, wirkt nur, solange nichts schiefgeht. Der Pfad ist die Antwort auf R-13. Dazu die
Ordnerwarnungen aus T-036, soweit sie zutreffen, mit der Einschränkung aus T-039.

Status: fertig

---

Artefakte:

```
NEU
apps/web/src/lib/pathInspection.ts            193 — die Mechanik der Pfadauslegung, aus
                                              exportDirectoryAdvice.ts herausgezogen: Zerlegung,
                                              die Namen der Synchronisierungsdienste, die Belege
                                              für Freigabe und Roaming-Profil
apps/web/src/lib/databaseLocationAdvice.ts    188 — `adviseDatabaseLocation`. Vier Befunde, keine
                                              Stufen, jeder mit Grund, Beleg und Handgriff
apps/web/src/components/WorkstationFacts.tsx  277 — `BillingUserFact`, `DatabaseLocationFact`
apps/web/src/showcase/WorkstationSection.tsx  239 — Musterseite 4b, bedienbar, mit Zustandsmatrix

GEÄNDERT
apps/web/src/api/types.ts                     696 — `SettingsView.windowsUser`,
                                              `SettingsView.databasePath`
apps/web/src/app/StructureContext.tsx         194 — beide Werte in `Structure`
apps/web/src/screens/SettingsScreen.tsx       592 — neue Karte „Dieser Arbeitsplatz"
apps/web/src/screens/ExportScreen.tsx        1303 — vierte Kachel „Abgerechnet unter" in
                                              „Vorlage und Rundung"
apps/web/src/lib/exportDirectoryAdvice.ts     345 (−130) — die Mechanik zieht aus
                                              `pathInspection.ts`; die Bewertung bleibt hier
apps/web/src/styles/components.css           3123 (+190) — `workstation`, `dbconcerns`
apps/web/scripts/contrast-check.mjs           449 (+21) — Gruppe „Arbeitsplatz", 7 Paare
apps/web/src/showcase/Showcase.tsx            152 — Navigationseintrag „↳ Arbeitsplatz (C-20)"
apps/web/src/showcase/InventorySection.tsx    415 — zwei neue Einträge im Komponenteninventar
```

`apps/local-api/**`, `packages/**`, `apps/outlook-addin/**`, `tests/e2e/**`, `docs/**` und
`apps/web/test/**` (existiert nicht): **unangetastet**. `apps/desktop/src/**` brauchte nichts —
beide Werte kommen über `GET /settings`, nicht über die Hülle. Kein `any`, keine Typzusicherung mit
`as`, kein neues Paket, `pnpm-lock.yaml` unverändert.

---

Zusammenfassung:

**1 — Die zwei Zeilen.**

`SettingsView` in `apps/web/src/api/types.ts` führt jetzt `windowsUser: string` und
`databasePath: string | null`, beide mit dem Grund, aus dem sie neben `settings` stehen und nicht
darin: Sie sind keine Einstellungen. Der Weg durch die Oberfläche geht über `StructureContext` —
und nicht über einen zweiten `getSettings()`-Aufruf in der Ansicht, weil zwei Ansichten den Namen
brauchen und zwei Abrufe zwei Wahrheiten über dieselbe Zeichenkette wären.

Im Provider steht `view.windowsUser ?? ""` und `view.databasePath ?? null`. Das ist kein
Misstrauen gegen die Typen, sondern der Rückfall gegen einen älteren Dienststand: Fehlt das Feld,
soll `undefined` nicht in einer Zeichenkette landen. Was daraus folgt, sagt die Ansicht dann selbst
— „der Dienst nennt keinen Namen" ist ein eigener, ausformulierter Zustand.

**2 — Warum es mehr als eine Anzeige ist, und wo man das sieht.**

Der **Benutzername** steht an zwei Stellen, und die zweite ist die wichtigere:

*S-09, Karte „Dieser Arbeitsplatz"* — der Name, darunter der Satz „Dieser Name steht in **jeder
Zeile jeder Exportdatei**", darunter die Herkunft: „Takt bekommt ihn beim Start vom Betriebssystem,
nicht aus einer Umgebungsvariablen: `set USERNAME=…` ändert ihn nicht, und über keine Route lässt
er sich setzen." Die Herkunftszeile ist der Teil, um dessentwillen die Anzeige existiert; sie steht
deshalb in Lesegröße und nicht als Fußnote.

*S-07, Kachel „Abgerechnet unter"* neben Vorlage, Rundung und Exportordner. Das ist der Ort, den
die Aufgabe meint: **vor** dem ersten Export, nicht danach im Protokoll. Wer die Datei gleich
schreiben lässt, sieht in derselben Karte, welcher Name hineingeht.

Der **Ablageort** steht in S-09 mit Pfad, Kopierknopf und dem Satz, was in der Datei steht („alle
Todos, Buchungen und Vermerke — im Klartext"). Dazu der Weg zur Sicherung: Takt beenden, den
**ganzen Ordner** kopieren, weil SQLite neben `takt.db` die Nachbardateien `-wal` und `-shm` führt
(`PRAGMA journal_mode = WAL` in `packages/storage/src/sqlite/database.ts`) — die Datei allein kann
unvollständig sein. Ein Sicherungshinweis, der nur `takt.db` nennt, wäre schlimmer als keiner.

**3 — Die Ordnerwarnungen, soweit sie zutreffen: vier von acht, und keine Stufen.**

`adviseDatabaseLocation` findet `sync_folder`, `network_share`, `roaming_profile` und
`temporary_folder`. Was **nicht** übernommen ist und warum:

| Befund aus T-036 | hier | Grund |
|---|---|---|
| `not_absolute` | nein | Der Pfad kommt vom Dienst, nicht aus einem Feld |
| `drive_root`, `system_directory` | nein | Er folgt dem Anwendungsdatenverzeichnis; beides wäre kein Befund, sondern ein Defekt — und keiner, den ein Kasten in S-09 behebt |
| `redirected_folder` | nein | Desktop/Dokumente können `AppData\Local` nicht enthalten |
| `volatile_folder` (Downloads) | ersetzt | Für eine Datenbankdatei zählt `Temp`/`tmp`, nicht Downloads |

Der wichtigere Unterschied ist der Zuschnitt: **Es gibt hier keine Stufen.** Beim Exportordner
ergibt „abgewiesen" einen Sinn, weil es einen Knopf zu sperren gibt, und „Rückfrage", weil es
etwas zu entscheiden gibt. Der Ablageort ist über keine Route und kein Startargument einstellbar
(B-1.6 Punkt 1) — eine Sperre hätte nichts zu sperren. Stattdessen führt **jeder Befund einen
Handgriff mit** (`remedy`, Pflichtfeld im Typ): den Ordner im Synchronisierungsclient von der
Übertragung ausnehmen, die Verwaltung des Rechners fragen, Takt über seine Verknüpfung starten.
Eine Warnung ohne Ausweg wäre an dieser Stelle nur ein Vorwurf.

Zweiter Zuschnitt: Jeder Befund nennt, **worauf** er zielt (`impacts`) — Vertraulichkeit, Bestand
oder beides. Ein Synchronisierungsordner ist beides, und das aus zwei Gründen: Die Kundendaten
gehen zum Anbieter, **und** eine Datenbankdatei, die während des Schreibens kopiert wird, kommt
dort regelmäßig unbrauchbar an.

**4 — Die Einschränkung aus T-039 gilt hier verschärft, und die Ansicht sagt es.**

Zum Exportordner belegt der Dienst Merkmale beim Betriebssystem (`exportDirectoryTraits`). Zu
dieser Datei tut er das **nicht** — `GET /settings` liefert den Pfad und sonst nichts. Damit ist
nicht nur das zugeordnete Netzlaufwerk unsichtbar (die Lücke aus T-039), sondern jede Auskunft, die
nicht in der Zeichenkette steht: auch ein Ordner, den ein Synchronisierungsclient nach einer
Umbenennung weiter überwacht.

Der Grenzsatz steht deshalb **immer** unter dem Pfad, auch und gerade ohne Befund, und er beginnt
in diesem Fall mit „Am Pfad ist nichts aufgefallen — das ist keine Entwarnung, sondern eine
Nichtaussage". Neutral gefärbt, gestrichelte Umrandung, kein Häkchen: „nichts gefunden" darf
nirgends wie „in Ordnung" aussehen.

**5 — Warum `pathInspection.ts` entstanden ist.**

Die Alternative wäre eine zweite Liste von Synchronisierungsordnernamen gewesen. Zwei solche
Listen laufen auseinander, und die eine davon fällt erst auf, wenn eine Warnung ausbleibt, auf die
es ankam. Herausgezogen ist ausschließlich Mechanik — Zerlegung, Namen, Belege. Die **Bewertung**
bleibt getrennt: `exportDirectoryAdvice.ts` behält Stufen und Sperrtexte,
`databaseLocationAdvice.ts` hat Handgriffe und keine Stufen. Systemverzeichnisse und umgeleitete
bekannte Ordner sind in `exportDirectoryAdvice.ts` geblieben, weil nur sie dort gebraucht werden.

**6 — Zustände (Abschnitt 15), nicht nur der Normalfall.**

| Auskunft | Zustand | Was die Ansicht zeigt |
|---|---|---|
| Name | gemeldet | Name, Wirkung auf die Exportzeile, Herkunft aus dem abgesicherten Kanal |
| Name | leer | Warnung mit Folge („im Export steht trotzdem einer") und Handgriff, kein leeres Feld |
| Name | lädt | „Die Auskünfte werden geladen." — die Karte bleibt, der Inhalt nicht erfunden |
| Ablageort | Pfad, kein Befund | Pfad, Kopierknopf, Sicherungshinweis, Grenzsatz |
| Ablageort | vier Befunde | Grund, Beleg aus dem Pfad, Handgriff, Wirkungsangabe |
| Ablageort | `null` | „Diese Fassung führt keine Datei" — eigener Satz, kein Befund |
| Kopieren | idle / kopiert / fehlgeschlagen | `role="status"`, immer im Baum; bei Fehlschlag der Weg von Hand |

Die Rückmeldung zum Kopieren merkt sich **den kopierten Pfad**, nicht ein „kopiert". Ändert sich
der Pfad, gehört die Rückmeldung nicht mehr dazu und verschwindet — ohne `useEffect`, der denselben
Zustand einen Bildaufbau später zurückgesetzt hätte.

**7 — Bedienbarkeit.**

Beide Auskünfte sind `role="group"` mit `aria-labelledby` auf ihre Überschrift: Eine Vorlesehilfe
im Sprungmodus liest sonst einen Benutzernamen ohne die Zeile „Abgerechnet wird unter", und das ist
genau die Auskunft nicht. Der Kopierknopf trägt `aria-describedby` auf den Pfad, damit er ansagt,
**welchen** Pfad er kopiert. Der Wert ist `user-select: all` — ein Klick markiert ihn ganz. Alles
Bedienbare sind native Knöpfe; der sichtbare Fokus kommt aus dem Grundgerüst.

**8 — Musterseite.**

Abschnitt 4b „Arbeitsplatz: Name und Ablageort", bedienbar: sechs Beispielpfade und zwei
Namenszustände setzen die echten Bausteine, die Befunde entstehen aus `adviseDatabaseLocation` und
nicht aus einer nachgestellten Liste. Wer die Auslegung ändert, sieht die Änderung dort. Dazu die
Zustandsmatrix und die beiden Absätze, die begründen, warum es keine Stufen gibt und warum kein
Befund keine Entwarnung ist.

---

Annahmen:

1. **`windowsUser` ist Pflicht, `databasePath` darf `null` sein.** So steht es in
   `openapi/takt-local-api.yaml` (beide unter `required`, `databasePath` als
   `oneOf: [string, null]`) und so baut es `loadSettings`. Getippt ist es genauso; der Rückfall im
   Provider fängt nur einen älteren Dienststand ab.
2. **Ein leerer Benutzername kommt in der Praxis nicht vor** — `isPlausibleUserName` in
   `access/session-secret.ts` lässt den Dienst sonst nicht starten. Der Zustand ist trotzdem
   ausformuliert: Ein leeres Feld an dieser Stelle wäre die schlechteste aller Auskünfte.
3. **Der Dienst liefert zum Datenbankpfad keine Merkmale.** Nachgesehen in `SettingsView`
   (`usecases/structure.ts`), in der Beschreibung und im Port `DirectoryInsightPort` — der kennt
   nur `describeExportDirectory`. Die Auslegung in der Oberfläche ist deshalb alles, was es gibt,
   und sie sagt das.
4. **Der Pfad in einer erfragten Auskunft ist kein Verstoß gegen B-2.4.** Die Begründung steht
   ausbuchstabiert in der Beschreibung und ist übernommen: Dort geht es um Pfade in
   *Fehlermeldungen*; hier ist es eine Auskunft hinter dem Sitzungsgeheimnis, und derselbe Rumpf
   führt mit `settings.exportDirectory` bereits einen Pfad desselben Rechners.

---

Risiken:

1. **Die Auslegung des Datenbankpfades ist eine Auslegung.** Sie erkennt, was im Pfad steht, und
   sonst nichts. Ein Fehler darin macht eine Auskunft falsch — er macht keinen Angriff möglich und
   verhindert keinen. Das steht im Kopf beider Dateien und in der Ansicht.
2. **`temporary_folder` kann falsch auslösen**, wenn jemand einen Windows-Benutzer `tmp` hat.
   Verglichen wird das ganze Segment, `Template` löst nicht aus; `cache` steht bewusst nicht in der
   Liste. Der Preis eines Fehlalarms ist ein Kasten zu viel, der Preis eines fehlenden Befundes ein
   verlorener Bestand.
3. **Der Sicherungshinweis nennt WAL.** Er stimmt für die heutige Fassung
   (`PRAGMA journal_mode = WAL`). Wer das Journal umstellt, muss diesen Satz mitziehen; er steht an
   genau einer Stelle (`WorkstationFacts.tsx`).
4. **`pathInspection.ts` ist jetzt gemeinsame Grundlage zweier Ansichten.** Eine Änderung an den
   Namenslisten wirkt auf den Exportordner **und** auf den Ablageort. Das ist der Zweck, aber wer
   dort etwas hinzufügt, ändert zwei Ansichten.

---

Offene Fragen:

1. **Soll `GET /settings` Merkmale zum Datenbankpfad belegen — analog zu
   `exportDirectoryTraits`?** Das läge beim Dienst und beim domain-dev, nicht hier. Heute ist die
   Aussage über die Datei mit den Kundendaten schwächer als die über den Exportordner, und der
   Unterschied ist nicht sachlich begründet, sondern historisch: Der Ordner ist einstellbar und
   wurde deshalb zuerst geprüft. Ein `describeDatabaseLocation` über denselben Port wäre wenig
   Arbeit und schlösse die Lücke, die die Ansicht derzeit benennen muss.
2. **Gehört der Benutzername auch in den Bestätigungsdialog vor dem Exportlauf?** Er steht jetzt in
   der Karte darüber. Im Dialog stünde er im letzten Augenblick, in dem man abbrechen kann — dann
   aber neben dem Base64-Satz und der Ordnerbestätigung, und ein Dialog, der alles sagt, sagt
   nichts. Ich habe ihn draußen gelassen; die Entscheidung gehört dem spec-ux-reviewer.
3. **Soll der Kopierknopf den Ordner statt der Datei kopieren?** Der Sicherungshinweis nennt den
   Ordner, der Knopf gibt den Dateipfad. Beides ist richtig für seinen Zweck (Explorer-Adresszeile
   gegen Sicherung), aber es ist eine Kante.

---

Nächster Schritt:

Wenn der Dienst nach offener Frage 1 Merkmale zum Ablageort liefert, ist die Ansicht dafür schon
gebaut: `DatabaseLocationFact` müsste nur eine zweite Liste neben den Pfadbefunden führen — so wie
`ExportDirectoryTraitList` es neben `ExportDirectoryConcernList` tut —, und der Grenzsatz verlöre
seinen verschärften Teil.

---

## Nachweis

```
pnpm typecheck    alle 8 Pakete: Done, 0 Fehler
pnpm contrast     0 von 332 Paaren durchgefallen
pnpm build        alle Pakete: Done
pnpm boundaries   Notiz-Trennung: alle Schichten unverletzt
pnpm test         34 Dateien, 556 Tests, alle grün
```

Zur Kontrastausgabe: **332 statt 318**, weil sieben Paare dazugekommen sind (Gruppe „Arbeitsplatz",
je Modus) und keines durchgefallen ist. Die vierzehn neuen Zeilen lauten wörtlich:

```
== Modus hell ==
OK    12.79:1 (min 4.5:1)  --text-primary auf --bg-inset  — Benutzername und Datenbankpfad im Anzeigefeld
OK     4.58:1 (min 3.0:1)  --border-strong auf --bg-inset  — Randschiene des Anzeigefeldes und gestrichelte Umrandung des Grenzsatzes, SC 1.4.11
OK     8.39:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Erlaeuterung und Herkunft des Wertes
OK     5.64:1 (min 4.5:1)  --text-muted auf --bg-surface  — Symbol an der Herkunftszeile
OK     6.81:1 (min 4.5:1)  --text-secondary auf --bg-inset  — Grenze der Auslegung: was Takt am Ablageort nicht sehen kann
OK     7.74:1 (min 4.5:1)  --text-secondary auf --warning-bg  — Handgriff und Beleg unter einem Befund zum Ablageort
OK     5.20:1 (min 4.5:1)  --text-muted auf --warning-bg  — worauf ein Befund zielt: Vertraulichkeit, Bestand oder beides

== Modus dunkel ==
OK    15.38:1 (min 4.5:1)  --text-primary auf --bg-inset  — Benutzername und Datenbankpfad im Anzeigefeld
OK     6.17:1 (min 3.0:1)  --border-strong auf --bg-inset  — Randschiene des Anzeigefeldes und gestrichelte Umrandung des Grenzsatzes, SC 1.4.11
OK     9.76:1 (min 4.5:1)  --text-secondary auf --bg-surface  — Erlaeuterung und Herkunft des Wertes
OK     6.74:1 (min 4.5:1)  --text-muted auf --bg-surface  — Symbol an der Herkunftszeile
OK    10.25:1 (min 4.5:1)  --text-secondary auf --bg-inset  — Grenze der Auslegung: was Takt am Ablageort nicht sehen kann
OK     8.89:1 (min 4.5:1)  --text-secondary auf --warning-bg  — Handgriff und Beleg unter einem Befund zum Ablageort
OK     6.14:1 (min 4.5:1)  --text-muted auf --warning-bg  — worauf ein Befund zielt: Vertraulichkeit, Bestand oder beides
```

`--border-strong` auf `--bg-inset` ist mit 4.58:1 im hellen Modus der knappste der neuen Werte und
liegt über den 3:1 aus SC 1.4.11. Er trägt die Abgrenzung des Anzeigefeldes allein: Die Tönung
`--bg-inset` gegen `--bg-surface` misst hell 1.23:1 und dunkel 1.04:1 — deshalb dieselbe
Randschiene wie beim Pfadfeld des Exportordners, dort aber `--border-strong` statt
`--border-control`, weil `--border-control` auf der eingelassenen Fläche im dunklen Modus die 3:1
verfehlt.

---

## Was wo steht — für den Abgleich

| Gegenstand | Ort auf dem Bildschirm | Datei |
|---|---|---|
| `windowsUser`, `databasePath` im Typ | — | `api/types.ts` |
| beide Werte in der Oberfläche verfügbar | — | `app/StructureContext.tsx` |
| Name und Ablageort, vollständig | S-09 → Karte „Dieser Arbeitsplatz" | `screens/SettingsScreen.tsx`, `components/WorkstationFacts.tsx` |
| Name vor dem Lauf | S-07 → „Vorlage und Rundung" → Kachel „Abgerechnet unter" | `screens/ExportScreen.tsx` |
| Befunde zum Ablageort | S-09 → unter dem Pfad | `lib/databaseLocationAdvice.ts` |
| Grenzsatz „keine Entwarnung" | S-09 → unter den Befunden, auch ohne Befund | `components/WorkstationFacts.tsx` |
| gemeinsame Pfadmechanik | — | `lib/pathInspection.ts` |
| Musterseite, bedienbar | Designsystem → „↳ Arbeitsplatz (C-20)" | `showcase/WorkstationSection.tsx` |
| Komponenteninventar | Designsystem → Abschnitt 11 | `showcase/InventorySection.tsx` |
| gemessene Farbpaare | — | `scripts/contrast-check.mjs`, Gruppe „Arbeitsplatz" |
