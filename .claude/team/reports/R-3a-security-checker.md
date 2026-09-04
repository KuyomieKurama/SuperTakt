# R-3a — Wiedervorlage Sicherheitsprüfung, Branch `status-als-regelterm`

Aufgabe: R-3a — Wiedervorlage Sicherheitsprüfung (Qualitätstor, zweite Runde)
Prüfumfang: `git diff 3240dcc..HEAD` — Wellen A, B, C und der eingemergte Zweig
`fix/windows-sidecar-bundle-check`; 113 geänderte Dateien, davon 85 übersetzbare Quelldateien und
zwei neue Migrationsdateien. Stand `aca53df`.
Datum: 2026-09-04. Verantwortlich: security-checker.
Urteil: **freigegeben.**

---

## 0. Was tatsächlich gelaufen ist

Damit niemand ein Prüfergebnis annimmt, das es nicht gibt.

| Werkzeug | Lief | Ergebnis |
|---|---|---|
| Semgrep CLI 1.166.0, `p/secrets p/security-audit p/typescript p/owasp-top-ten` über die 85 geänderten Quelldateien | **ja** | 156 Regeln, 85 Ziele, **4 Befunde** — alle vier in `apps/desktop/scripts/verify-sidecar.mjs`, alle vier Fehlalarme (Abschnitt 4). Aus `p/secrets` null Treffer. |
| Semgrep Guardian — SAST, Geheimnisse, Lieferkette | **nein** | `Not logged into Semgrep Guardian.` Zum **fünften** Mal, seit T-003 unverändert. Es liegt kein Plattformbefund vor, weder positiv noch negativ. |
| 42Crunch-Audit, 42Crunch-Scan | **nein** | `42c-ast` nicht auffindbar, `~/.42crunch` existiert nicht. Die OpenAPI-Beschreibung liegt vor (224 KB); das Hindernis ist ausschließlich das Werkzeug. Offene Frage 8 bleibt offen. |
| `pnpm run typecheck` | **ja** | grün über neun Konfigurationen einschließlich `typecheck:test`. |
| `pnpm run boundaries` | **ja** | grün, mit belastbaren Zahlen: 8 Quelldateien in `packages/export`, 312 außerhalb der Domäne. |
| `pnpm --filter @takt/storage migrations:embed:check` | **ja** | „aktuell, 24 Datei(en)". |
| Eigener Vergleich `migrations.embedded.ts` gegen `packages/storage/migrations/*.sql` | **ja** | 24 zu 24, **null** inhaltliche Unterschiede, Schlüssel aufsteigend sortiert. |
| Eigene Messungen an der Git-Historie (Vorfahrschaft, größte Blobs, Erreichbarkeit über Refs) | **ja** | Abschnitt 1, Befund A-1. |
| `pnpm check`, `proof:*`, `pnpm test:e2e` | **nein** | Untersagt: Port 17843 gehörte in diesem Zeitraum dem e2e-tester. Der Stand ist die Messung des Orchestrators zu `aca53df` (13 Nachweispfade 848/0, 648 Einheitentests, e2e 37/37) und **nicht** meine eigene. Wo ich mich unten auf einen Nachweispfad berufe, steht dazu, dass es eine fremde Messung ist. |

Die Definition of Done ist an einem Punkt erfüllt („Semgrep ohne offene Befunde hoher Schwere")
und an einem unverändert **nicht erfüllbar** („42Crunch über der Schwelle"). Das ist eine
Beschaffungsentscheidung und kein Befund dieses Branches; sie steht seit T-023.

---

## 1. Jeder Befund aus R-3 gegen den Stand

### Auflage A-1 — 186 MB Bauergebnisse in der Historie: **erledigt, mit einem Rest**

Der Orchestrator hat die Historie umgeschrieben (`git filter-branch`, im Board vor Welle A
vermerkt). Nachgemessen, nicht angenommen:

- `git merge-base --is-ancestor 3240dcc HEAD` → **Exitcode 1**. Der alte Zweigkopf ist kein Vorfahr
  mehr; es sind andere Commits.
- Der größte Blob in der Historie von `HEAD` ist `apps/local-api/openapi/takt-local-api.yaml` mit
  **224 426 Bytes**. Die beiden Bündel kommen darin nicht vor.
- `git check-ignore apps/desktop/release/foo.AppImage` trifft jetzt: `apps/desktop/.gitignore:40`,
  Regel `release/`, mit ausgeschriebener Begründung wie bei allen Nachbarregeln.

**Der Rest, und er ist ein neuer Befund (S-1).** Die Blobs sind noch erreichbar, über genau einen
Verweis: den lokalen Zweig `backup/status-als-regelterm-vor-filter`. Ich habe jeden Ref des
Bestands abgesucht; er ist der einzige Treffer. Daher `size-pack` 181,07 MiB und `.git` 182 MB.
`git push origin status-als-regelterm` veröffentlicht ihn nicht — `git push --all` und
`git push --mirror` tun es.

### Befund S-1 (R-3) — Grenzwächter meldete grün über null Dateien: **erledigt**

`packages/domain/scripts/check-export-boundary.mjs:221-222` trägt jetzt `MIN_EXPORT_SOURCES = 1`
und `MIN_DEEP_IMPORT_SOURCES = 50`, geprüft bei `:284` und `:318`, beide mit `fail()` statt `note()`.
Dazu eine dritte Verschärfung, die ich nicht verlangt hatte und die richtig ist: Ein fehlendes
`packages/export` ist seit T-089 kein `note()` mehr, sondern ein `fail()` — die Schicht kann nicht
mehr stillschweigend übersprungen werden. Der Lauf meldet heute 8 und 312, also weit über beiden
Schwellen; die Zahlen sind, wie es gehört, weit unter dem Bestand angesetzt und fangen den
**Wegfall**, nicht das Wachstum.

### Befund S-2 (R-3) — `poolId`/`statusId`/`tagId` ohne Prüfung und ohne Anzahlgrenze: **erledigt**

`apps/local-api/src/http/input.ts:52` trägt `commaSeparatedIds`:

```ts
export const commaSeparatedIds = z.preprocess(
  (value) => (typeof value === 'string' ? value.split(',') : value),
  z.array(idSchema).min(1).max(50),
);
```

`apps/local-api/src/routes/todos.ts:122-124` schickt alle **drei** Fragezeichenparameter hindurch,
und `:153` beantwortet einen Fehlschlag mit `failValidation`. Zwei Dinge sind daran richtig gemacht
und nicht selbstverständlich: `z.preprocess` statt `.transform` — sonst prüfte `idSchema` die ganze
Zeichenkette samt Kommas und wiese jede Liste mit mehr als einem Eintrag ab —, und das `as never`
ist verschwunden, ersetzt durch `as PoolId[]` gegen einen jetzt tatsächlich geprüften Wert. Aus dem
`500` bei 1 000 Kennungen wird ein `422` mit Feldangabe; die gemessenen 8 370 ms bei 200 Kennungen
sind rechnerisch auf ein Viertel gedeckelt. Die Grenze 50 ist an der Aufrufstelle mit beiden
Richtungen begründet — „über jedem Arbeitsablauf, weit unter der teuren Schwelle" —, und das ist die
Sorte Begründung, die eine Zahl überleben lässt.

### Hinweis H-1 (R-3) — Ordnerauflösung je Term statt je Teilbaum, Faktor 70: **beim Auftraggeber**

Unverändert. `packages/storage/src/sqlite/repo-tags.ts` löst weiter je Term auf; die Grenzen sind
`max(200)` je Liste und `down.depth < 1000`. Nur der Stand, wie beauftragt: Der **gefährlichste
Multiplikator** ist inzwischen weg, ohne dass jemand H-1 angefasst hätte. Die 8,4 Sekunden von R-3
entstanden aus 200 genannten Poolkennungen **mal** 200 Ordnertermen; seit S-2 sind es höchstens 50
Kennungen. Eine einzelne Regel mit 200 Ordnertermen kostet weiterhin die gemessenen 41,6 ms. Die
Frage nach einer engeren Grenze für **Ordner**terme (25 statt 200) bleibt offen und bleibt fachlich
folgenlos.

### Hinweis H-2 (R-3) — der 409 nennt die blockierende Regel nicht: **erledigt, und weiter getragen**

`packages/storage/src/sqlite/mappers.ts:226` (`poolReference`) formt eine Regelzeile zu
`{ field: <poolId>, code: 'pool_rule', message: 'Regel „<Name>“' }`. Gerufen wird sie an zwei
Stellen: `repo-statuses.ts:310` für `status_in_use` und `repo-tags.ts:522` für `tag_in_use` am
Ordner. Beide Abfragen sind `SELECT DISTINCT … JOIN pool … ORDER BY p.position, p.name` und laufen
über die Indizes aus Migration 0011. Die Oberfläche liest die Namen seit T-097
(`apps/web/src/lib/errorText.ts`), und der Ordner-Löschdialog unterscheidet jetzt zwei Gründe
statt einen zu raten — der Satz „zwischen dem Zählen und dem Löschen ist ein Todo dazugekommen"
erscheint nur noch, wenn `details` leer ist. Das ist mehr, als H-2 verlangt hatte.

### Hinweis H-3 (R-3) — `unresolvedRequired` liest sich zur Laufzeit als „nein": **erledigt**

`packages/domain/src/tag.ts:1143` wirft bei `typeof unresolvedRequired !== 'boolean'`. Genau die
Fail-closed-Variante, die ich vorgeschlagen hatte, und sie wirkt für Aufrufer, die es noch nicht
gibt — also auch für `scripts/**/*.mjs` und `apps/*/test/**`, die kein Übersetzer sieht (O-L).

### SQL-Zusammensetzung nach Welle A/B: **unverändert dicht**

`repo-todos.ts` hat in diesem Diff **drei** geänderte Zeilen, `repo-tags.ts` 73 — und keine davon
setzt einen Wert in Abfragetext. Die zwei neuen Abfragen (die Regeln zu einem Ordner, die Regeln zu
einem Status) sind feste Zeichenketten mit einem `?`. Die Rückgabe geht über `poolReference` und
damit über `text(row, …)`, nicht über eine Verkettung. `poolMatchMode` hat als Einziges seinen
Rückgabetyp von `'any' | 'all'` auf den Domänentyp `PoolMatchMode` gehoben — eine Typänderung, kein
SQL. Die Injektionsproben aus R-3 (`'`, `a' OR '1'='1`, `%`) habe ich nicht wiederholt, weil der
Dienst nicht laufen durfte; die Bauart, die sie beantwortet hat, ist unangetastet.

### Vertrauensgrenze Add-in nach `resolveAxes` und `list('all')`: **eine Informationsfrage, ja — siehe H-1**

Ausführlich in Abschnitt 2.

### Notiz-Trennung: **hält**

`packages/export/**` ist im **ganzen** Diff unberührt — kein einziger geänderter Pfad. `boundaries`
ist grün, und diesmal mit einem Wächter, der nicht mehr über nichts grün werden kann.
Stichprobe an den neuen Antworten: `apps/local-api/src/usecases/pool-movement.ts` und
`packages/domain/src/pool-movement.ts` enthalten die Zeichenketten `note`, `Notiz` und `Vermerk`
**nicht ein einziges Mal**; die drei Listen sind `readonly string[]` mit Poolnamen. `poolMovement`
an den drei Timer-Antworten und die drei Namenslisten in den Add-in-Antworten tragen damit nichts,
was einem internen Vermerk auch nur ähnlich sieht. Die dynamische Gegenprobe über jede aufgezeichnete
Antwort steckt in `proof:openapi`; sie ist in dieser Runde **nicht von mir** gelaufen (Orchestrator:
grün).

### `RESTRICT` in Migration 0012: **richtig gebaut, kein Datenverlust**

Ausführlich in Abschnitt 3.

### Repository-Hygiene: **sauber**

Ausführlich in Abschnitt 5.

---

## 2. Neu seit R-3 — die Vertrauensgrenze zum Add-in

**Der Port-Ausschnitt ist unverändert und beweist diesmal weniger, als er zu beweisen scheint.**

`AddinUnit.pools` steht weiter auf `Pick<PoolPort, 'list' | 'resolveAxes'>`
(`apps/local-api/src/routes/addin/ports.ts:146`); die Datei ist im ganzen Diff nicht angefasst
worden. Es gibt **keine** neue Route — der Diff über `apps/local-api/src/routes/` enthält keine
einzige hinzugefügte `routes.get/post/put/patch/delete`-Zeile —, und `apps/local-api/src/access/**`,
`app.ts`, `config.ts` sowie `composition.ts` sind vollständig unberührt. Das Tokenmodell steht.

**Und trotzdem sieht das Add-in seit dieser Welle etwas Neues.**

`apps/local-api/src/usecases/pool-movement.ts:152` ruft `unit.pools.list('all')` — also
einschließlich der Regeln mit `placement: 'board'`. Der Add-in-Dienst benutzt genau diesen
Anwendungsfall (`routes/addin/service.ts:291` und `:722`) und gibt dessen drei Listen als
`poolNames`, `enteringPoolNames` und `leavingPoolNames` heraus (`routes/addin/index.ts:367`, `:373`,
`:379`). Die **Namen reiner Kanban-Spalten** verlassen den Dienst damit erstmals über das
Add-in-Token. `GET /addin/context` bleibt bei `list()` — E-058 Punkt 7 hat das ausdrücklich
entschieden. Die Vordertür ist zu, die Seitentür steht auf.

**Ist das eine Informationsfrage? Ja — und die Antwort ist trotzdem: vertretbar.**

- **Die Datenklasse ändert sich nicht.** Es sind Namen von Regeln, die der Benutzer selbst angelegt
  hat. Sie sagen, wonach eine Spalte filtert, nicht was in ihr steht. Keine Todos, keine Vermerke,
  keine Buchungen fremder Todos. Die vier Regelfelder reiner Spalten (`excludedTags`, `statusIds`,
  `completion`, `exportState`) bleiben draußen, weil `list()` sie gar nicht erst liefert;
  `emptyFolderIds` bleibt wie bisher im Dienst und wird nur zu `unresolvedRequired` verrechnet.
- **Sie ist die unvermeidliche Folge von E-056.** Der Fall, für den der Bewegungssatz geschrieben
  wurde, **ist** die reine Board-Spalte „erledigt und noch nicht abgerechnet". Wer die Bewegung aus
  ihr heraus verschweigt, sagt die halbe Wahrheit — dagegen wiegt der Zuwachs an Kenntnis wenig.
- **Sie ist ausgesprochen, nicht untergeschoben.** Das Schema `PoolMovement` in
  `apps/local-api/openapi/takt-local-api.yaml:3981` sagt es wörtlich: „**Auch reine Kanban-Spalten
  stehen darin** (`placement: board`)." Eine Grenzverschiebung, die in der Schnittstellenbeschreibung
  steht, ist eine Entscheidung; eine, die dort fehlt, wäre ein Befund.
- **Was ein entwendetes Dauertoken damit anfangen kann:** Über wiederholtes Anlegen und Bebuchen
  von Todos einen Teil der Spaltennamen aufzählen. Kein Bestand, keine Kundendaten.

**Was daraus für die Zukunft folgt — und was ich in Abschnitt 14.2 des Bedrohungsmodells zu eng
formuliert hatte.** Dort steht, die Add-in-Grenze werde am Port-Ausschnitt beurteilt, weil ein
Entwickler ihn anfassen müsse, um an neue Daten zu kommen. Diese Welle hat gezeigt, dass das nicht
stimmt: Der Ausschnitt blieb gleich, die Fläche wuchs — weil die Ausweitung nicht in einer neuen
**Methode** lag, sondern in einem **Argument** an einer alten (`list()` gegen `list('all')`). Die
Regel für den nächsten Prüfer steht jetzt in 15.3: Ausschnitt **und** Aufrufargumente lesen.

---

## 3. Neu seit R-3 — Migration 0012, eingebettete Migrationen, Bauzeitskripte

### Migration 0012 `pool_rule_restrict`

Der Tabellenumbau ist Zeile für Zeile der aus 0011. Was ich geprüft habe und was hält:

1. **Die Marke steht in beiden Richtungen** (`-- takt: foreign_keys=off`, Zeile 2 beider Dateien).
   `migration-runner.ts:65` erkennt sie, `:248` setzt das Pragma **vor** `BEGIN` — das ist nötig,
   weil `PRAGMA foreign_keys` innerhalb einer offenen Transaktion wirkungslos ist. Die Zeile
   `PRAGMA foreign_keys = ON;` am Dateiende ist damit Zierde; die Wirkung kommt aus dem `finally`
   bei `:274`.
2. **Die Fremdschlüsselprüfung läuft, und zwar über den ganzen Bestand.**
   `assertNoDanglingReferences` (`migration-runner.ts:354`) fragt `pragma_foreign_key_check` **vor**
   dem `COMMIT`; ein Verweis ins Leere nimmt die Transaktion zurück. Das ist die einzige Prüfung,
   die einen Umbau mit ruhender Fremdschlüsselprüfung noch abfangen kann, und sie ist an der
   richtigen Stelle.
3. **Kein Datenverlust auf dem Rückweg.** `0012_pool_rule_restrict.down.sql` legt dieselben fünf
   Spalten mit demselben CHECK an, kopiert eins zu eins (`INSERT … SELECT pool_id, role, tag_id,
   folder_id, status_id FROM pool_rule`) und stellt alle vier Indizes wieder her. Anders als der
   Rückweg von 0011 nimmt er keiner Zeile ihren Platz. Was er **aufmacht** — ein gelöschter Ordner
   nimmt seine Regelterme wieder still mit —, steht in seinem eigenen Kopf ausgeschrieben, samt der
   Feststellung, dass die Prüfungen in `TagPort.remove` und `TagFolderPort.remove` davon unberührt
   bleiben. Das ist die Art von Rückwärtsdatei, die man lesen kann, ohne sie auszuführen.
4. **`RESTRICT` statt `CASCADE` ist sicherheitlich die richtige Richtung**, aus demselben Grund wie
   bei `status_id` in 0011: Ein kaskadierendes Löschen entkernte eine Regel stillschweigend, und
   eine Spalte, die danach **mehr** Todos trifft als vorher, ist der Fehler in die gefährliche
   Richtung. Es schließt zugleich R-1 Befund 1 auf der zweiten Ebene: Die Prüfung im Adapter
   antwortet fachlich, die Datenbank kann nicht mehr still gehorchen, wenn eines Tages jemand an
   ihr vorbeischreibt.

**Ein Hinweis bleibt (H-4).** `legacy_alter_table` wird nicht im `finally` zurückgesetzt, sondern
nur von der letzten Zeile der Migrationsdatei. Wirft eine Migration mittendrin, läuft `ROLLBACK`,
und die Verbindung behält `legacy_alter_table = ON`. Heute folgenlos, weil ein Fehlschlag den Start
beendet; die Unsymmetrie zu `foreign_keys` gehört trotzdem geschlossen.

### `migrations.embedded.ts` — 24 Dateien, Reihenfolge, Nachweispfad

Gemessen statt gelesen. Ich habe die Konstante geparst und Datei für Datei verglichen:

```
Dateien auf Platte: 24 | eingebettet: 24
fehlt eingebettet: []      eingebettet ohne Datei: []
inhaltliche Unterschiede: 0
Schluessel aufsteigend sortiert? true
```

Die Reihenfolge ist damit fest (lexikografisch, was bei `NNNN_name.up/down.sql` der Versionsfolge
entspricht), und der Inhalt ist Zeichen für Zeichen der der `.sql`-Dateien. Der Nachweispfad
**existiert** — `packages/storage/package.json:17`, `migrations:embed:check` — und meldet
„aktuell, 24 Datei(en)".

**Er wird nur von niemandem gerufen (Befund S-2).** Weder `pnpm check` noch `proof:all` enthalten
ihn. Was das kostet, steht bei S-2.

### `paths.mjs` `isInside`, `verify-node-checksums.mjs` — Bauzeit, und die Laufzeitprüfung bleibt eigen

- **Die R-04-Prüfung „nichts extern geblieben" ist unberührt.** In `build-sidecar.mjs` hat sich nur
  der **Zähler** geändert (`inputs.filter((input) => isInside(folder, input))` statt
  `startsWith(folder + '/')`); die Prüfung auf externe Reste darüber steht unverändert. Der Zähler
  ist dabei sogar strenger geworden: Er bricht jetzt für `@takt/local-api` bei null Dateien ab.
- **`isInside` ersetzt keine Pfadprüfung zur Laufzeit.** Nachgesehen, wie beauftragt:
  `apps/local-api/src/taskpane/**` ist im ganzen Diff **nicht angefasst**, und
  `taskpane/server.ts:236-239` hat weiterhin seine eigene Fassung
  (`resolve(root, '.' + normalize(requested))`, dann `target !== root && !target.startsWith(root +
  sep)`). Das ist richtig so und keine Doppelung: Das eine ist eine Vertrauensgrenze zur Laufzeit
  gegen einen HTTP-Pfad, das andere zählt zur Bauzeit Dateien in einem Bündel. Eine gemeinsame
  Funktion für beides wäre der Anfang einer Änderung, die für den einen Zweck gut und für den
  anderen falsch ist.
- **`isInside` selbst ist korrekt.** Leerer Schritt und absoluter Schritt sind ausgeschlossen, `..`
  und `..<Trenner>` fangen den Ausbruch, und die Wahl von `relative` statt `folder + sep` ist mit
  dem Laufwerksbuchstaben begründet, den `path.win32.resolve` nicht vereinheitlicht. Das Pfadmodul
  als Parameter ist die Bedingung dafür, dass ein Windows-Fehler ohne Windows-Rechner nachprüfbar
  ist.
- **`verify-node-checksums.mjs`** ist ein reiner Vergleich: liest `sidecar-runtime.mjs`, holt
  `SHASUMS256.txt` über HTTPS, vergleicht, schreibt nichts. Er benennt seine eigene Grenze im Kopf —
  die **Signatur** von `SHASUMS256.txt` prüft er nicht, und er sagt das, statt es zu verschweigen,
  samt Anleitung für die Handprüfung mit `gpg`. Er läuft von Hand und steht in keiner Kette; das ist
  bei einem Lauf, der das Netz braucht, die richtige Wahl.

---

## 4. Neu seit R-3 — Regelnamen als Text, Anker, Neuladen, Auslieferungsablauf

### `details[]` in der Oberfläche

**Kein XSS-Weg.** Im gesamten Diff steht kein `dangerouslySetInnerHTML`, kein `innerHTML`, kein
`eval` und keine `new Function`. Die Texte aus `errorMessageWithRules`
(`apps/web/src/lib/errorText.ts:98`) gehen als Kinder in React-Elemente —
`StatusSettings.tsx:422-434` und `TagsScreen.tsx:425-430` — und werden dort maskiert. Der einzige
`new RegExp` im Diff steht in einem End-zu-End-Test.

Zwei Kanten bleiben, beide ohne Angreifer, beide als Hinweis geführt (H-2, H-3).

Ausdrücklich **richtig gemacht**: `errorText.ts` zerlegt den Text des Dienstes **nicht**, um den
Namen herauszuschneiden. Ein Ausdruck, der heute das Wort „Regel" abschneidet, schneidet morgen die
Hälfte des Namens ab, und niemand wird dabei rot. Angezeigt wird, was der Dienst geschrieben hat.
Ebenfalls richtig: `ruleReferences` filtert auf `code === 'pool_rule'` und nimmt einen Feldfehler
einer Eingabeprüfung **nicht** mit — der beantwortet eine andere Frage und gehört an das Feld.

### `navigate()` über `location.assign(href(...))`

Ausdrücklich geprüft, weil ein `location.assign` mit fremdem Text der klassische Weg zu
`javascript:` und zum Protokollwechsel ist. **Hier ist er es nicht.** `href()`
(`apps/web/src/app/router.ts:54-59`) setzt den Anker aus drei Teilen zusammen, und keiner ist frei:

- das Segment aus `SEGMENT`, einem eingefrorenen `Record<RouteName, string>` — `RouteName` ist eine
  Vereinigung von elf Literalen, es gibt keinen zwölften Schlüssel;
- die Kennung durch `encodeURIComponent` — kein `/`, kein `:`, kein `?`, kein `#`;
- die Abfragezeichenkette durch `new URLSearchParams(...).toString()`.

Das Ergebnis beginnt bauartbedingt mit `#/`. Eine relative Adresse, die mit `#` anfängt, ist gegen
das aktuelle Dokument aufgelöst immer eine Navigation im selben Dokument; ein `javascript:`, ein
`//host` oder ein Protokollwechsel ist daraus nicht herstellbar — auch nicht aus einer Kennung, die
aus einer Antwort des Dienstes stammt, weil `encodeURIComponent` davorsteht. **Kein Befund.**

Die Gegenrichtung hat eine Kante (H-5): `parseRoute` ruft `decodeURIComponent` ohne Netz
(`router.ts:93` und `:106`). `#/todos/%` ist ein `URIError`, und in `useRoute.ts:75` fällt der in
den Aufbau des Zustands — die Oberfläche entsteht dann gar nicht. Erreichbar nur, wenn jemand den
Anker von Hand setzt; die Anwendung selbst erzeugt ihn nie.

### `useDataFreshness` — Anfragelast, Schleifen, abgelaufenes Sitzungsgeheimnis

- **Keine Schleife.** Kein Zeitgeber, keine Wiederholung nach einem Fehlschlag. Die Zahl steigt
  ausschließlich durch eine Navigation (`useRoute.ts:96-103`), und `visibilitychange` hängt an einer
  Handlung des Benutzers. Der erste Durchlauf lädt bewusst nicht nach (`seen = useRef(revisit)`) —
  sonst führte schon der Aufbau eine zweite Runde Anfragen aus.
- **Abgelaufenes Sitzungsgeheimnis: kein Sturm.** Der Web-Client kennt keine Sonderbehandlung für
  401; sie wird zu einem `TaktApiError`, den `useAsync` in den Fehlerzustand der Ansicht legt. Dort
  bleibt sie stehen. Ein Neuanmelden gibt es nicht — das Geheimnis kommt einmalig aus
  `serviceHandshake()` der Hülle und lebt nur im Arbeitsspeicher dieses Moduls; der Weg zurück ist
  der Neustart der Anwendung. Bei einem Geheimnis, das weder in `localStorage` noch in der
  Adresszeile liegen darf, ist das die richtige Antwort und keine Lücke.
- **Keine Wettläufe.** `useAsync` verwirft veraltete Antworten über seinen Generationenzähler
  (`useAsync.ts:36`, `:45`); eine langsame erste Antwort kann eine schnelle zweite nicht
  überschreiben.
- **Was fehlt, ist eine Bremse (H-6).** Jeder Fensterwechsel löst `reload()` **und** `bump()` aus,
  also einen Schwung Anfragen gegen einen einfädigen Sidecar. Zwanzig Wechsel in zwanzig Sekunden
  sind zwanzig Schwünge. Geringe Schwere, weil es Handlungen eines Menschen sind und keine Uhr.

### Der Auslieferungsablauf `.github/workflows/release.yml`

Er ist über den Merge von `fix/windows-sidecar-bundle-check` (Commit `45c0d79`) neu in diesen Zweig
gekommen und fällt damit in meinen Prüfumfang; er stammt nicht aus den Wellen A bis C. **Er ist
sorgfältiger gebaut, als dieser Punkt gewöhnlich bekommt:**

- Alle Aktionen sind auf vollständige Commit-Hashes festgenagelt, mit der Fassung als Kommentar
  daneben (`actions/checkout@3d3c42e5…  # v7.0.1` und drei weitere).
- `permissions` steht oben auf `contents: read`; nur der Veröffentlichungsauftrag hebt es auf
  `contents: write`, und der Kommentar sagt, dass es der einzige Ort mit Schreibrecht ist.
- Kein `pull_request_target`, kein langlebiges Zugangsmerkmal — allein `secrets.GITHUB_TOKEN`.
  Auslöser sind Etikettendruck und `workflow_dispatch`.
- **Keine Skript-Einschleusung.** Die vom Benutzer wählbare Fassungsangabe geht über `env:`
  (`INPUT_VERSION`, `EVENT_NAME`) in die Shell und nicht mitten in eine Zeile; der Kommentar
  begründet es. Sie wird gegen `^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$` geprüft, **bevor** sie
  nach `$GITHUB_OUTPUT` geschrieben wird — damit ist auch kein Zeilenumbruch in die Ausgabe zu
  bekommen.
- `gh release create --verify-tag` legt kein Etikett an, das es nicht gibt, und ein Schritt davor
  weigert sich, eine vorhandene Fassung zu überschreiben.

Ein Befund (S-3) und eine Beobachtung stehen dagegen: Die veröffentlichte `SHA256SUMS` wird nie
gegen die Dateien gehalten, die daneben veröffentlicht werden, und `cp -n` verschluckt eine
Namenskollision lautlos.

### Semgrep — die vier Meldungen

Alle vier in `apps/desktop/scripts/verify-sidecar.mjs`, einem Prüfskript der Bauzeit, das nie
ausgeliefert wird:

| Regel | Stelle | Urteil |
|---|---|---|
| `react-insecure-request` | `:467`, `:472`, `:487` | Fehlalarm. `fetch('http://127.0.0.1:…')` ist die Architektur dieses Projekts (Abschnitt 5 des Bedrohungsmodells), keine Nachlässigkeit. |
| `unknown-value-with-script-tag` | `:212` | Fehlalarm. Ein `<script src="./assets/taskpane.js">` in einer festen Zeichenkette, in die nichts eingesetzt wird; die Regel stört sich an der danebenstehenden Variablen `taskpaneDir`, einem Dateipfad. |

**Zwei Einschränkungen dieses Laufs, damit sie niemand überliest.** Semgrep hat
`apps/local-api/openapi/takt-local-api.yaml` (ab Zeile 4141) und `packages/domain/src/index.ts`
(Zeile 37) nur **teilweise** geparst. Die Aussage „100 % geparst" aus R-3 gilt für diesen Lauf
nicht. Beide Dateien sind harmlos — eine Beschreibung und eine Sammeldatei aus Wiederausfuhren —,
aber die Zahl der geprüften Zeilen ist kleiner, als der Zielzähler behauptet.

---

## 5. Repository-Hygiene

Geprüft über den **ganzen** versionierten Baum, nicht nur über den Diff.

- **Zugangsdaten.** `git ls-files` gegen ein Muster aus Schlüsselwort, Zuweisung und mindestens
  16 Zeichen Ausweis: zwei Treffer, beide Kunstwerte und beide als solche erkennbar —
  `apps/outlook-addin/scripts/proof-addin.mjs:1074` (`takt_CCCC…wxyz`) und
  `packages/export/test/base64.test.ts:105` (`GEHEIME-KUNDENNUMMER-42`, das Beispiel dafür, dass
  Base64 keine Verschlüsselung ist). Die Sitzungsgeheimnisse der End-zu-End-Hilfe heißen weiterhin
  `takt-e2e-erfundenes-sitzungsgeheimnis-2026-08` und sagen im Namen, was sie sind; die Geheimnisse
  der Nachweisläufe entstehen zur Laufzeit.
- **Call-Nummern.** Alle im Baum vorkommenden Muster sind erfunden und als Scherz oder Zählwert
  erkennbar: `TCK-000042` (88×), `TCK-000517`/`TCK-000518`, `TCK-000815`, `SVC-4711`, `TCK-999999`.
  Kein Muster, das nach einem echten Ticketbestand aussieht.
- **Kundendaten.** Die neuen End-zu-End-Fälle arbeiten durchweg mit `E2E-…-${run}`-Namen
  (`E2E-KANBAN-LEER-…`, `E2E-Ordnersperre-API-Regel-…`). `tests/fixtures/**` ist leer — die sieben
  Unterordner tragen keine Datei; die Prüfdaten liegen in `apps/outlook-addin/scripts/fixtures.mjs`
  und inline in den Spezifikationen. Das ist eine Abweichung von CLAUDE.md („Testdaten … liegen
  unter `tests/fixtures/`"), aber keine Sicherheitsfrage: Es liegen dort keine falschen Daten,
  sondern gar keine.
- **E-Mail-Adressen.** Zehn im Arbeitsbaum. Zwei sind erfunden und benutzen reservierte Domänen
  (`a.beispiel@example.org`, `b.muster@example.com`). Sieben sind Autorenangaben fremder Pakete und
  stehen ausschließlich in `apps/desktop/src-tauri/licenses/THIRD-PARTY-LICENSES.txt` — die Datei
  ist seit `3240dcc` ignoriert und **nicht** versioniert (`git ls-files` kennt sie nicht). Die
  zehnte ist die Adresse des Entwicklers in `.claude/team/reports/T-067-security-checker.md`; sie
  steht ohnehin in jedem Commit dieses Bestands.
- **Abhängigkeiten.** `pnpm-lock.yaml` ist im gesamten Diff **unverändert**. Kein neues Paket, keine
  neue Fassung, keine neue Lieferkettenfläche.
- **Semgrep Guardian, Geheimnisse.** Nicht gelaufen. Der lokale `p/secrets`-Lauf über die
  85 geänderten Dateien hat null Treffer; das ersetzt die Plattformbefunde nicht.

---

## 6. Befunde

### Befund S-1 — der Sicherungszweig trägt die 186 MB weiter

**Schwere: sollte, vor dem Push.** **Betrifft:** B-11.4, VG-7, Abschnitt 13 und 15.2 des
Bedrohungsmodells. **Zuständig:** Orchestrator.
**Ort:** lokaler Zweig `backup/status-als-regelterm-vor-filter`.

Ich habe jeden Ref des Bestands durchsucht: Er ist der **einzige**, über den die beiden Bündel noch
erreichbar sind. Daher `size-pack` 181,07 MiB gegenüber einem Arbeitsbaum, dessen größte
versionierte Datei 224 KB misst.

**Bedrohung.** Kein Ausnutzungsweg, sondern die Wiederkehr der Auflage A-1 an einer Aufrufform:
`git push origin status-als-regelterm` ist harmlos, `git push --all` und `git push --mirror`
veröffentlichen den Sicherungszweig mitsamt Inhalt. Danach liegen 186 MB in jedem Klon, und die
Bereinigung ist wieder eine Historienumschreibung auf einem geteilten Zweig. Was in den Bündeln
steckt, ist nach wie vor nicht festgestellt (14.4 Punkt 1) — die Werkzeuge dafür fehlen auf dieser
Maschine.

**Gegenmittel.** Sobald die Wiedervorlagen R-1a, R-2a und R-3a angenommen sind:

```
git branch -D backup/status-als-regelterm-vor-filter
git reflog expire --expire=now --all && git gc --prune=now
```

Bis dahin: ausschließlich benannte Zweige pushen, nie `--all` und nie `--mirror`.

### Befund S-2 — `migrations:embed:check` steht in keiner Kette

**Schwere: sollte.** **Betrifft:** W-04 (Integrität des Bestands), Verfügbarkeit beim Kunden.
**Zuständig:** Orchestrator (`package.json` ist gemeinsame Datei).
**Ort:** `package.json:16` und `:24`; vorhanden, aber ungerufen ist
`packages/storage/package.json:17`.

`migrations.embedded.ts` ist erzeugter Code und zugleich die **einzige** Fassung der Migrationen,
die im Node-SEA vorhanden ist — was nicht durch den Bündler geht, gibt es in der ausgelieferten
Anwendung nicht. Heute stimmen die 24 Dateien Zeichen für Zeichen mit `packages/storage/migrations/`
überein; ich habe es gemessen. **Nichts hält das fest.** Weder `pnpm check` noch `proof:all` rufen
den vorhandenen Prüflauf.

**Bedrohung.** Wer eine Migration ändert und `pnpm --filter @takt/storage migrations:embed` vergisst,
bekommt von der Kette kein Wort. Zwei Ausgänge, beide teuer:

1. Die ausgelieferte Fassung führt **anderes DDL** aus als das, was im Repository steht und was
   Review und Tests gesehen haben.
2. Häufiger: `schema_migration.checksum` weicht ab, und der Dienst verweigert den vorhandenen
   Bestand des Kunden — „Die bereits gelaufene Migration N unterscheidet sich von der mitgelieferten
   Datei. Es wird nichts migriert." Ein Verfügbarkeitsausfall beim Kunden aus einem vergessenen
   Befehl.

Der zweite Fall ist zugleich der Beleg dafür, dass die Prüfsumme ihre Arbeit tut — sie fängt die
Abweichung, sie fängt sie nur zum spätestmöglichen Zeitpunkt.

**Gegenmittel.** Eine Zeile: `migrations:embed:check` in `proof:all` aufnehmen (oder als eigenen
Schritt vor `boundaries` in `check`). Der Lauf braucht keine Datenbank, kein Netz und keinen Port —
er liest zwei Verzeichnisse und vergleicht.

### Befund S-3 — die veröffentlichte `SHA256SUMS` prüft niemand

**Schwere: sollte, vor der ersten Auslieferung.** **Betrifft:** VG-7, B-10.x. **Zuständig:**
Orchestrator. **Ort:** `.github/workflows/release.yml:421` und `:506`.

Der Veröffentlichungsauftrag legt die `SHA256SUMS` der drei Läufer zusammen (`find … -exec cat {} +
| sort`) und hängt sie an die Fassung — dazwischen steht **kein** `sha256sum -c`. Die Datei behauptet
also etwas über Erzeugnisse, die im selben Auftrag heruntergeladen und nie dagegen gehalten wurden.

**Bedrohung.** Das ist wörtlich der Vorwurf aus 14.4 Punkt 2 — „sieht aus wie eine beglaubigte
Auslieferung und ist eine Selbstauskunft" —, nur eine Ebene weiter: Er trifft jetzt nicht mehr
eingecheckte Binärdateien, sondern die tatsächliche Auslieferung, die Anwender herunterladen und
gegen genau diese Datei prüfen. Ein abgeschnittener oder vertauschter Artefaktdownload würde
veröffentlicht, und der Erste, dem es auffiele, wäre der Anwender.

**Gegenmittel.** Vor `gh release create`:

```
( cd versand && sha256sum -c SHA256SUMS )
```

Zwei Zeilen, und aus der Selbstauskunft wird eine Prüfung. Zusätzlich empfohlen, aber keine
Bedingung: `cp -n` im selben Schritt verschluckt eine Namenskollision lautlos, und die
Vollzähligkeitsprüfung darunter zählt nur „mindestens eine je Muster" — eine Kollision bliebe
unsichtbar. Und wer die Selbstauskunft ganz loswerden will, hängt
`actions/attest-build-provenance` daneben; das ist eine Entscheidung, kein Befund.

### Hinweis H-1 — die reine Board-Spalte hat die Add-in-Grenze überschritten

**Schwere: Hinweis, ausdrücklich kein Befund.** **Betrifft:** VG-2. **Ort:**
`apps/local-api/src/usecases/pool-movement.ts:152`, `routes/addin/service.ts:291`, `:722`,
`routes/addin/index.ts:367`, `:373`, `:379`.

Begründung und Bewertung stehen in Abschnitt 2 und in 15.3 des Bedrohungsmodells. Er steht hier,
damit die nächste Prüfung ihn nicht als neu entdeckt: Die Verschiebung ist begründet (E-056),
entschieden (E-058) und in der Schnittstellenbeschreibung ausgesprochen. Die Lehre daraus ist
festgehalten — der Port-Ausschnitt allein bewacht diese Grenze nicht, weil eine Ausweitung auch in
einem **Argument** stecken kann.

### Hinweis H-2 — Namen dürfen Steuer- und Richtungszeichen enthalten

**Schwere: Hinweis.** **Zuständig:** domain-dev. **Ort:** `apps/local-api/src/http/input.ts:58`
(`nameSchema`), `:57` (`titleSchema`).

`z.string().trim().min(1).max(200)` sagt nichts über U+0000 bis U+001F, U+007F oder die
bidirektionalen Steuerzeichen U+202A bis U+202E und U+2066 bis U+2069. React maskiert HTML; es macht
ein U+202E nicht unschädlich, und das dreht den Rest der Zeile optisch um.

**Warum es jetzt zählt und vorher weniger.** Diese Namen reisen seit dieser Welle weiter als je
zuvor: in den Bewegungssatz an **beiden** Flächen, in den Aufgabenbereich des Add-ins und in die
Löschdialoge der Hauptanwendung. Es ist kein Grenzübertritt — nur wer das Sitzungsgeheimnis hat,
legt Pools an —, aber es ist eine Anzeige, die etwas anderes zeigt, als im Bestand steht.

**Gegenmittel.** `apps/local-api/src/access/session-secret.ts:85` trägt die Prüfung bereits
ausgeschrieben — eine Zeichenklasse über U+0000 bis U+001F und U+007F; für Namen käme die
Kategorie der Formatierungszeichen dazu. Eine Zeile an `nameSchema`, eine an `titleSchema`.

### Hinweis H-3 — `details` ist der Zahl nach unbegrenzt

**Schwere: Hinweis.** **Zuständig:** domain-dev (Abfrage), frontend-dev (Satz). **Ort:**
`packages/storage/src/sqlite/repo-tags.ts:511-520`, `repo-statuses.ts:300-309`,
`apps/web/src/lib/errorText.ts:98`.

Beide Abfragen liefern eine Zeile je verweisender Regel, ohne `LIMIT`; eine Obergrenze für die Zahl
der Pools gibt es nirgends. Bei 200 Zeichen je Name steht der ganze Bestand in einem Satz, den
`errorMessageWithRules` zu **einer** Aufzählung verbindet. Der Kommentar an `repo-statuses.ts`
begründet den Verzicht auf eine Grenze mit „`pool_rule` hält eine Handvoll von Hand eingerichteter
Zeilen" — das ist die Annahme, die eine Grenze ersetzen soll, und Annahmen dieser Art altern.

**Gegenmittel.** `LIMIT 21` in beiden Abfragen und „… und 15 weitere" im Satz. Dieselbe Bauart, die
`slice(0, 12)` in `poolsContaining` hatte, bevor sie aus einem anderen Grund fiel.

### Hinweis H-4 — `legacy_alter_table` steht nicht im `finally`

**Schwere: Hinweis.** **Zuständig:** domain-dev. **Ort:**
`packages/storage/src/sqlite/migration-runner.ts:274` (dort steht `foreign_keys`),
`packages/storage/migrations/0012_pool_rule_restrict.up.sql:122` und `.down.sql:66`.

Der Läufer stellt `foreign_keys` in einem `finally` wieder her, mit ausgeschriebener Begründung
(„Bliebe er stehen, liefe der ganze Dienst danach ohne Fremdschlüsselprüfung"). `legacy_alter_table`
schaltet nur die letzte Zeile der Migrationsdatei zurück. Wirft eine Migration mittendrin, läuft
`ROLLBACK` — und die Verbindung behält `legacy_alter_table = ON`, eine Einstellung, unter der ein
`RENAME` die Verweise der Nachbartabellen nicht mehr nachzieht. Heute folgenlos, weil ein Fehlschlag
den Start beendet; dieselbe Begründung gilt trotzdem Wort für Wort.

### Hinweis H-5 — `parseRoute` fällt bei einem kaputten Anker in den Aufbau

**Schwere: Hinweis.** **Zuständig:** frontend-dev. **Ort:** `apps/web/src/app/router.ts:93`,
`:106`; `apps/web/src/app/useRoute.ts:75`.

`decodeURIComponent` ohne Netz; `#/todos/%` wirft `URIError`. Im Anfangszustand von `useRoute`
bedeutet das: Die Oberfläche entsteht nicht. Erreichbar nur, wenn der Anker von Hand gesetzt wird —
`href()` kann ihn nicht erzeugen. Ein `try` um beide Aufrufe, mit dem Rohtext als Rückfall.

### Hinweis H-6 — `visibilitychange` hat keine Bremse

**Schwere: Hinweis.** **Zuständig:** frontend-dev. **Ort:**
`apps/web/src/app/useDataFreshness.ts:92-99`.

Jeder Fensterwechsel löst `reload()` **und** `bump()` aus, also einen Schwung Anfragen gegen einen
einfädigen Sidecar. Keine Schleife, kein Zeitgeber, keine Wiederholung nach 401 — das ist alles
geprüft und in Ordnung. Was fehlt, ist ein Mindestabstand: „nicht öfter als einmal je Sekunde"
oder „nur, wenn die letzte Auffrischung älter ist als N". Eine Zeile mit einem `useRef` auf den
Zeitpunkt.

### Hinweis H-7 — `new RegExp(<Name>)` im End-zu-End-Test

**Schwere: Hinweis.** **Zuständig:** e2e-tester. **Ort:**
`tests/e2e/tag-folder-rule-lock.spec.ts` (zwei Stellen).

Der Ordnername ist heute `E2E-Ordnersperre-UI-Regel-<Lauf>` und enthält kein Sonderzeichen. Ein
Ausdruck, der aus einem Namen gebaut wird, ist trotzdem eine Zusage an alle künftigen Namen. Nur
Testcode; erwähnt, weil es dieselbe Gestalt ist wie der konfigurierbare Ausdruck des Add-ins, für
den dieses Projekt einen Worker und eine Zeitschranke gebaut hat.

---

## 7. Was ausdrücklich in Ordnung ist

Damit der nächste Leser nicht dasselbe zweimal prüft.

- **Die Vertrauensgrenze selbst.** `apps/local-api/src/access/**`, `app.ts`, `config.ts`,
  `composition.ts` und `apps/local-api/src/taskpane/**` sind im ganzen Diff **nicht angefasst**.
  Keine neue Route. Das Tokenmodell aus T-011 steht unverändert.
- **Der konfigurierbare reguläre Ausdruck des Add-ins.** `apps/outlook-addin/src/callnumber/**` ist
  nicht angefasst; Worker, Zeitschranke und Prüfung auf ungültige Ausdrücke sind, wie sie waren
  (B-4.2). Der einzige `new RegExp` im Diff steht in einem Test.
- **Die Notiz-Trennung.** `packages/export/**` unberührt, `boundaries` grün mit belastbaren Zahlen,
  und keiner der neuen Werte (`poolMovement`, die drei Namenslisten, `details`) trägt ein Feld, das
  einem internen Vermerk auch nur ähnelt.
- **Die Fehlerhülle.** `poolReference` gibt Kennung, Schlüssel und einen Satz zurück — keinen
  Indexnamen, keine SQLite-Meldung, keinen Aufrufstapel. `tag_in_use` bekommt bewusst **keinen**
  vierten Schlüssel, weil es wörtlich derselbe Sachverhalt ist; welches Ding gemeint ist, sagt die
  Route.
- **Die Lieferkette.** `pnpm-lock.yaml` unverändert. Der neue Auslieferungsablauf nagelt seine
  Aktionen auf Hashes fest, hält `permissions` unten und lässt keine Eingabe in eine Shell-Zeile.
- **Die Bauzeitskripte.** `isInside` ist korrekt und ersetzt **keine** Laufzeitprüfung; die
  R-04-Prüfung „nichts extern geblieben" ist unberührt und der Zähler daneben sogar strenger
  geworden.

---

## 8. Kurzfassung

```
Aufgabe: R-3a — Wiedervorlage Sicherheitsprüfung
Status: fertig — freigegeben
Artefakte: .claude/team/reports/R-3a-security-checker.md,
           docs/bedrohungsmodell.md (neuer Abschnitt 15)

Zusammenfassung: Alle sechs Befunde aus R-3, die eine Nacharbeit verlangten, sind erledigt und
nachgemessen — die 186 MB sind aus der Historie (3240dcc ist kein Vorfahr von HEAD mehr, größter
Blob jetzt 224 KB), der Grenzwächter hat Untergrenzen und meldet 8 und 312, die drei
Kennungslisten von GET /todos laufen durch z.array(idSchema).min(1).max(50), der 409 nennt die
Regel beim Namen, und matchesPool wirft bei fehlendem unresolvedRequired. H-1 (Faktor 70) liegt
unverändert beim Auftraggeber, hat aber seine Spitze verloren, weil die Zahl der Poolkennungen
jetzt bei 50 gedeckelt ist. Die drei neu geprüften Flächen sind sauber: navigate() kann
bauartbedingt nichts als "#/..." erzeugen (encodeURIComponent, URLSearchParams, festes
Segment-Record), details[] geht als React-Text durch ohne einen einzigen innerHTML-Weg im Diff,
und useDataFreshness hat weder Schleife noch Zeitgeber noch eine Wiederholung nach 401. Migration
0012 ist mit Fremdschlüsselprüfung über den ganzen Bestand vor dem Festschreiben gefahren und
verliert auf dem Rückweg keine Zeile; die 24 eingebetteten Migrationen stimmen Zeichen für Zeichen
mit den .sql-Dateien überein — gemessen. Der eine wirkliche Zuwachs an Fläche ist inhaltlich, nicht
strukturell: Über poolMovement verlassen erstmals die Namen reiner Board-Spalten den Dienst in
Richtung Add-in. Begründet, entschieden, in der OpenAPI ausgesprochen — und der Beleg dafür, dass
der Port-Ausschnitt diese Grenze allein nicht bewacht.

Befunde:
  Sollte
    S-1  Zweig backup/status-als-regelterm-vor-filter — einziger Verweis, über den die 186 MB
         noch erreichbar sind (.git 182 MB). `git push --all`/`--mirror` würde sie
         veröffentlichen. Vor dem Push: nur benannte Zweige pushen; nach Annahme der
         Wiedervorlagen `git branch -D` + `reflog expire` + `gc --prune=now`. (Orchestrator)
    S-2  package.json:16,24 — migrations:embed:check existiert (packages/storage/package.json:17)
         und wird von keiner Kette gerufen. Heute stimmen die 24 eingebetteten Migrationen; ein
         Auseinanderlaufen liefert entweder anderes DDL aus als geprüft oder verweigert dem
         Kunden seinen Bestand über die Prüfsumme. Eine Zeile in proof:all. (Orchestrator)
    S-3  .github/workflows/release.yml:421,506 — die veröffentlichte SHA256SUMS wird nie gegen
         die Dateien gehalten, die daneben veröffentlicht werden. `( cd versand && sha256sum -c
         SHA256SUMS )` vor `gh release create`. Nebenbei: `cp -n` verschluckt eine
         Namenskollision lautlos. (Orchestrator)
  Hinweis
    H-1  usecases/pool-movement.ts:152 — list('all') trägt die Namen reiner Board-Spalten über
         die Add-in-Grenze. Kein Befund; festgehalten in Bedrohungsmodell 15.3 samt der Lehre,
         dass eine Ausweitung auch in einem Argument stecken kann.
    H-2  http/input.ts:57,58 — nameSchema/titleSchema erlauben Steuer- und bidirektionale
         Formatierungszeichen. Diese Namen reisen jetzt bis in den Aufgabenbereich des Add-ins.
         session-secret.ts:85 trägt die Prüfung schon. (domain-dev)
    H-3  repo-tags.ts:511, repo-statuses.ts:300, errorText.ts:98 — details ohne LIMIT, Pools
         ohne Obergrenze, alles in einem Satz. LIMIT 21 + "und N weitere". (domain-dev,
         frontend-dev)
    H-4  migration-runner.ts:274 — legacy_alter_table steht nicht im finally, foreign_keys
         schon. (domain-dev)
    H-5  router.ts:93,106 und useRoute.ts:75 — decodeURIComponent ohne Netz; "#/todos/%" ist ein
         URIError im Aufbau des Zustands. (frontend-dev)
    H-6  useDataFreshness.ts:92-99 — visibilitychange ohne Mindestabstand; jeder Fensterwechsel
         ein Schwung Anfragen gegen einen einfädigen Sidecar. (frontend-dev)
    H-7  tests/e2e/tag-folder-rule-lock.spec.ts — new RegExp aus einem Namen. (e2e-tester)

Annahmen:
  - "Freigegeben" bezieht sich auf Code und Baum. S-1 ist keine Auflage mehr, sondern eine
    Aufrufform: Ein gewöhnlicher `git push origin <zweig>` ist unbedenklich.
  - Ich habe die Nachweispfade nicht selbst gefahren (Port 17843 gehörte dem e2e-tester) und
    berufe mich, wo nötig, ausdrücklich auf die Messung des Orchestrators zu aca53df. Wo ich
    selbst gemessen habe, steht die Zahl im Bericht.
  - Was in den 186 MB des Sicherungszweigs steckt, ist weiterhin nicht festgestellt — weder
    unsquashfs noch dpkg-deb sind auf dieser Maschine vorhanden. Ich behaupte nicht, dass etwas
    Schützenswertes darin liegt; ich behaupte, dass es niemand weiß.
  - H-2 und H-3 bewerte ich als Anzeigefragen und nicht als Bedrohung, weil Pools nur anlegt, wer
    das Sitzungsgeheimnis hat — und der hat größere Möglichkeiten.
  - Den Auslieferungsablauf habe ich geprüft, obwohl er über einen Merge in den Zweig kam und
    nicht aus den Wellen A bis C stammt. Er ist Teil von `git diff 3240dcc..HEAD` und niemand
    sonst hat ihn gegen VG-7 gehalten.

Risiken:
  - Die Add-in-Fläche wächst weder über neue Routen (die würden proof:route-policy rot machen)
    noch zwingend über den Port-Ausschnitt. Diese Welle hat gezeigt, dass ein anderes Argument an
    einer bestehenden Methode genügt. Dagegen wacht kein Exitcode, sondern eine Lesegewohnheit —
    festgeschrieben in Bedrohungsmodell 15.3.
  - Zwei Prüfläufe dieses Bestands existieren und werden nicht gerufen (S-2, S-3). Ein Nachweis,
    den niemand ruft, ist einer, den niemand vermisst, bis er gefehlt hat.
  - 42Crunch ist weiterhin nicht betriebsbereit, unverändert seit T-023. Für eine Beschreibung
    mit über 44 Pfaden gibt es keinen Auditwert; das Tor aus Abschnitt 8 des
    Bedrohungsmodells bleibt uneinlösbar.
  - Semgrep Guardian ist zum fünften Mal nicht erreichbar. Der lokale Lauf ersetzt SAST, nicht die
    Lieferketten- und Geheimnisbefunde der Plattform. Zudem hat er zwei Dateien nur teilweise
    geparst — die Aussage "100 % geparst" aus R-3 gilt für diesen Lauf nicht.

Offene Fragen:
  1. Wann darf der Sicherungszweig weg? Solange er liegt, bleibt die Auflage aus R-3 an einer
     Aufrufform hängen und `.git` bei 182 MB.
  2. Bleibt es bei 200 Ordnertermen je Liste (R-3 H-1)? Steht seit R-3 beim Auftraggeber. Die
     Antwort ist jetzt billiger, weil S-2 den Multiplikator aus der Fragezeichenzeile genommen
     hat — eine engere Grenze für Ordnerterme (25) wäre fachlich folgenlos.
  3. Wird der 42Crunch-Zugang beschafft oder das Tor gestrichen und ersetzt? Die Frage steht seit
     T-023 und altert schlecht: Die Beschreibung wächst weiter, der Auditwert bleibt bei null.
  4. Soll `tests/fixtures/**` seiner Rolle aus CLAUDE.md wieder zugeführt werden, oder wird die
     Regel an den tatsächlichen Ort der Prüfdaten angepasst? Heute sind alle sieben Ordner leer.

Nächster Schritt:
  Orchestrator: S-2 aufnehmen (eine Zeile in proof:all) und S-3 (zwei Zeilen im
  Auslieferungsablauf) — beides vor der ersten Auslieferung, keines braucht einen anderen Agenten.
  S-1 erledigen, sobald R-1a und R-2a angenommen sind. H-2 und H-3 an domain-dev, H-5 und H-6 an
  frontend-dev, H-7 an den e2e-tester; alle sechs sind Einzeiler und keine Bedingung für die
  Freigabe. H-1 ist eine Feststellung und kein Auftrag.
```
