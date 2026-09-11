Aufgabe: T-247 — Sicherheitsprüfung des Rückbaus der Anhäng-Fläche im Outlook-Add-in
Status: braucht Review — Urteil: **Nacharbeit**

Artefakte:
- `docs/bedrohungsmodell.md` — **Kapitel 33 neu** (Prüfung T-247, 33.0 bis 33.9, zehn Befunde,
  zwei neue Auflagen **A-A-71** und **A-A-72**); dazu drei Berichtigungen **an Ort und Stelle**
  nach A-A-70: die Nachweisspalte von **A-A-21** in der Auflagentafel von Kapitel 20, der
  Schlußabsatz der Vorabbewertung **20.4**, und ein Nachtrag an der **A-A-21-Abnahme** in
  Kapitel 21.
- `.claude/team/reports/T-247-security-checker.md` (diese Datei)

Kein Produktivcode angefaßt. Die Gegenprobe aus 33.2 lief in einem Wegwerfskript im
Scratchpad gegen den zusammengesetzten Dienst mit `:memory:`; der Baum ist dabei unverändert
geblieben.

Zusammenfassung:
Der Rückbau selbst ist sauber und an drei unabhängigen Stellen gemessen: die gefallene Route
antwortet mit **gültigem Add-in-Token 404** (Gegenprobe `…/time-entries` im selben Lauf: 422,
also weder 404 noch 401), die Add-in-Fläche zählt **vier** Routen statt fünf, und
`routes/addin/service.ts` faßt `unit.attachments` nirgends an. Was nicht fallen durfte, ist
nicht gefallen: alle vier Anhangsrouten der Hauptanwendung und alle vier `data-transfer`-Routen
antworten dem Add-in-Token mit **401** (gemessen, `proof:route-policy` Abschnitt 4); der
Öffnen-Befehl der Hülle und der Weg aus einem Fremdbackup in einen Anhang (R-21) stehen ohne
eine Zeile Änderung da. Der Deep-Link aus Outlook ist an der **Quelle** geschlossen —
`outlookWebLink` und `HostState.webLink` sind entfallen, es gibt keine Stelle mehr, an der eine
aus Office-Daten gebildete Adresse in den Bestand und von dort in den Öffnen-Befehl gelangt.

**Der Auftrag ist trotzdem nicht abgenommen, und zwar an Punkt 2.** `proof:addin` 18f mißt die
Abwesenheit jeder Anhangstür, **die „attachment" heißt** — nicht die Abwesenheit jeder Anhangstür.
Gemessen: eine zur Laufzeit angehängte Route `POST /addin/todos/:todoId/links`, die in
`todo_attachment` schreibt, antwortet mit gültigem Add-in-Token **201**, hinterläßt **eine
Zeile**, und `proof:addin` bleibt bei **228/0** — beide Prüfungen aus 18f grün. Rot wird allein
`proof:route-policy` an der **Zahl** (5 statt 4). E-100 Punkt 3 verlangte E-099 Punkt 3 auf
seinen eigenen Fall anzuwenden; angewandt wurde er zur Hälfte.

Dazu ein Befund außerhalb von F-21, den ich heute an dieser Maschine selbst ausgelöst habe:
**fünf Nachweisläufe fassen unter Windows die echten Daten des Benutzers an.** Sie lenken das
Anwendungsdatenverzeichnis über `XDG_DATA_HOME` um, und `access/paths.ts:36` liest das unter
`win32` nicht. Ein Lauf von `proof:addin-wiring` hat `%LOCALAPPDATA%\Takt\addin-token.json`
neu geschrieben — das Token der installierten Anwendung ist damit ungültig — und in `takt.db`
geschrieben.

---

## Befunde

Vollständig, mit Pfad, Anforderung, Auswirkung und Gegenmittel, in `docs/bedrohungsmodell.md`
Abschnitt **33.7**. Hier die Kurzfassung.

| Nr. | Stufe | Kurz | Zuständig |
|---|---|---|---|
| T-247-1 | **soll** | 18f spannt am Namen, nicht an der Anforderung (gemessen: 201 + eine Zeile, Lauf bleibt 228/0). Gegenmittel A-A-71 | integration-dev |
| T-247-2 | **soll** | `apps/local-api/src/app.ts:251-262` verspricht die gefallene Fläche im Präsens | Orchestrator |
| T-247-3 | Berichtigung | Die Nachweisbegründung unter A-A-21 und in 20.4 war der Grund, warum PR #16 durchkam — **berichtigt** | — |
| T-247-4 | **soll** | OpenAPI sagt `401` für den gefallenen Pfad, gemessen und von 18f verlangt: **404** | domain-dev |
| T-247-5 | **soll** | Zwei Designpapiere beschreiben die gefallene Fläche als gegenwärtig | ux-designer / Orchestrator |
| T-247-6 | **muß** | Fünf Prüfläufe schreiben unter Windows in `%LOCALAPPDATA%\Takt`. Gegenmittel A-A-72 | domain-dev |
| T-247-7 | Feststellung | Die Abwesenheit des `AttachmentPort` ist eine Zusage des Übersetzers, nicht der Laufzeit | integration-dev |
| T-247-8 | Feststellung | Der Deep-Link aus Outlook ist an der Quelle geschlossen; Wurzelspeicher und fremde Datei bleiben unbewertet | — |
| T-247-9 | Hinweis | Semgrep und 42Crunch weiterhin ohne Werkzeug | Orchestrator |
| T-247-10 | Feststellung | E-100 Punkt 5 wollte die Zustimmung zum V-08-Satz in Welle 2 einholen; der Satz fiel in Welle 1 | spec-ux-reviewer |

### T-247-1 — der neue Wächter mißt den Namen, nicht die Anforderung (soll)

**Pfad:** `apps/outlook-addin/scripts/proof-addin.mjs:5413-5573` (Abschnitt 18f).
**Anforderung:** A-19.19, E-100 Punkt 3, E-099 Punkt 3, R-25.

18f prüft zweierlei: die gefallene Adresse antwortet 404 (mit Gegenprobe), und kein Pfad unter
`/addin` führt `attachment` im Namen. Der zweite Satz ist der Fortschritt gegenüber 18d — er
gilt für den Teilbaum statt für eine Adresse. Er gilt aber für den **Namen**, und A-19.19
spricht nicht über Namen, sondern darüber, daß **kein Anhang entsteht**.

**Gemessen** (zusammengesetzter Dienst, `:memory:`, echtes Add-in-Token; die Verstümmelung wird
zur Laufzeit an die fertige App gehängt, am Baum ist nichts geändert):

```text
neue Tür /addin/todos/{id}/links mit Add-in-Token  -> 201
Zeilen in todo_attachment danach                   -> 1
18f Prüfung 1 (404 + Gegenprobe)                   -> grün
18f Prüfung 2 (kein Pfad mit "attachment")         -> grün
proof:route-policy zählt addinSurface              -> 5   (Zusicherung: 4)  ROT
```

**Auswirkung.** Der Wiederholungsfall von PR #16 — eine Anhangstür unter `/addin`, anders
benannt — bricht A-19.19 und läßt den Lauf grün, der eigens dafür geschärft wurde. Gefangen
wird er heute allein von der **Zahl** in `proof-route-policy.mjs:644`, und die kann derjenige
mitziehen, der die Route hinzufügt. Der Absatz darüber warnt ausdrücklich davor; eine Warnung
ist kein Wächter.

**Gegenmittel: A-A-71** (ausgeschrieben in 33.8). Kurz: 18f hält die Pfade unter `/addin` gegen
die **ausgeschriebene Menge der vier** statt gegen ein Muster auf `attachment`, und fährt
**jede** gefundene Route unter `/addin` mit dem Add-in-Token an, um danach
`SELECT COUNT(*) FROM todo_attachment` auf **null** zu prüfen — unabhängig vom Statuscode. Die
Gegenprobe dazu ist bereits gebaut und liegt oben.

### T-247-2 — `app.ts` verspricht die gefallene Fläche im Präsens (soll)

**Pfad:** `apps/local-api/src/app.ts:251-262`. **Anforderung:** A-19.19, R-25, E-100 Punkt 2.

Die Einhängung `api.route('/addin', createAddinAttachmentRoutes(addinDeps));` ist entfernt. Der
Kommentar **unmittelbar darüber** — die Stelle, an der ein Prüfer die Fläche des Add-ins zuerst
nachliest — steht unverändert:

> Der Aufgabenbereich darf lesen, nach einer Call-Nummer suchen, ein Todo anlegen, die bestehende
> Buchungsroute nutzen und einen **http(s)-Verweis** an ein erkanntes Todo hängen. Die neue
> Anhangroute akzeptiert weder Dateipfade noch Bildquellen; sie kann also keine Datei des
> Rechners lesen.

**Auswirkung.** Das ist R-25 spiegelbildlich: dieselbe Bauart, nur behauptet der Satz jetzt eine
Fläche, die es nicht gibt, statt die Abwesenheit einer, die es gab. Wer ihn liest, hält die
Route für vorhanden — oder hält den nächsten Bauversuch für gedeckt.

**Gegenmittel.** Den Absatz auf die vier Routen bringen und den Wegfall **benennen**, wie es
`routes/addin/index.ts`, `schema.ts`, `ports.ts`, `proof-route-policy.mjs`, `proof-callers.mjs`
und `service-scenario.mjs` bereits tun. `app.ts` ist Orchestratorhoheit.

### T-247-4 — Beschreibung und Wächter nennen verschiedene Zahlen für dieselbe Anfrage (soll)

**Pfad:** `apps/local-api/openapi/takt-local-api.yaml:3651-3654`. **Anforderung:** B-2.10.

Die Beschreibung sagt, der gefallene Pfad *„beantwortet sich wie jeder andere mit `401`, nicht
mit `404`"*. **Gemessen: 404**, und 18f verlangt diesen 404 ausdrücklich. Grund:
`credentialPolicy` senkt jeden Pfad **unter** `/addin` auf `any` ab, der Nachweis geht mit dem
Add-in-Token durch, und Hono antwortet `notFound`.

**Auswirkung** klein — ein Tokeninhaber könnte Pfade innerhalb von `/addin` ohnehin an 422 gegen
404 unterscheiden. **Der Satz ist trotzdem falsch**, und die B-2.10-Zusage „die Routenliste
bleibt verdeckt" gilt **nicht** innerhalb des Teilbaums, was nirgends steht.

**Gegenmittel.** Den Satz auf `404` berichtigen und in einem Halbsatz sagen, warum die
B-2.10-Regel innerhalb von `/addin` nicht greift.

### T-247-5 — zwei Designpapiere beschreiben die gefallene Fläche als gegenwärtig (soll)

**Pfade:** `docs/design/textbestand-aufgabenbereich.md` Zeilen 8, 15, 21-22, 27 und
`docs/design/textbestand.md:1795`. **Anforderung:** A-19.19, A-10.9 (neu), E-078, E-081.

- Zeile 21-22 erklärt die Bedeutung von **SP-A-27** und **SP-A-28** mit *„Anhängen erzeugt keine
  Zeitbuchung"* und *„Anhängen hebt das Kennzeichen nicht auf"*. Beide Sätze stehen zeichengleich
  weiter in `DuplicateOffer.tsx` und tragen dort jetzt etwas anderes.
- Zeile 27 nennt **`proof:addin` Abschnitt 21** als Nachweis. Den gibt es nicht mehr. Der Wächter
  selbst (`proof-addin.mjs:6296`) ist nachgeführt und erzählt die Geschichte richtig; das Papier
  daneben nicht.
- `textbestand.md:1795` führt *„auf das vorhandene Todo buchen statt ein Duplikat anlegen"* als
  **Pflichtflow** mit Berufung auf `CLAUDE.md`, während A-10.9 seit E-100 **keine Handlung**
  verlangt. Der Eintrag schützt einen Satz, den es nicht mehr geben darf.

**Nicht betroffen, eigens nachgesehen:** `docs/glossar.md` (139-140, 157, 187) und
`apps/web/src/components/Attachments.tsx:82` sind mit E-100 wahr geworden, ohne angefaßt zu
werden — genau die Wirkung, die E-100 Punkt 1 beabsichtigt hat.

### T-247-6 — fünf Prüfläufe fassen unter Windows die echten Daten des Benutzers an (muß)

**Pfade:** `apps/local-api/scripts/proof-access.mjs:107`, `proof-addin-wiring.mjs:146`,
`proof-conflicts.mjs:669`, `proof-export-api.mjs:178`, `proof-tags.mjs:473`.
**Anforderung:** B-7.1, E-018, R-13; „keine Kundendaten im Prüflauf" aus `CLAUDE.md`.

Alle fünf starten den Sidecar mit `env: { ...process.env, XDG_DATA_HOME: dataDir }` auf einen
`mkdtemp`-Ordner. `apps/local-api/src/access/paths.ts:36` liest `XDG_DATA_HOME` unter `win32`
**nicht** — dort gilt `%LOCALAPPDATA%\Takt`. Die Umlenkung greift also nicht.

**Gemessen, an dieser Maschine, heute** — ein einziger Lauf von `proof:addin-wiring`:

```text
%LOCALAPPDATA%\Takt\addin-token.json   geändert 2026-09-10 01:54:46
%LOCALAPPDATA%\Takt\takt.db-wal        geändert 2026-09-10 01:54:46
```

Der Lauf erzeugt das Add-in-Token zweimal neu (er prüft ausdrücklich, daß das alte danach
sofort ungültig ist) und schreibt Todos und Tags in die Datenbank des Benutzers. Der zweite
Lauf war deshalb **27/5** statt 32/0 — *„In diesem Ordner gibt es bereits ein Tag mit diesem
Namen"*, und die Duplikatsuche fand **drei** Todos zu `TCK-000042`.

**Auswirkung.** (1) `pnpm check` schreibt in den einzigen Ort, an dem dieses Erzeugnis
Kundendaten hält. (2) Ein Geheimnis wird ohne Zutun des Benutzers ungültig; wer den
Aufgabenbereich eingerichtet hat, muß ihn nach einem Prüflauf neu einrichten und erfährt den
Grund nicht. (3) Der Lauf ist nicht wiederholbar und lädt dazu ein, ihn „für Windows zu
lockern".

**Gegenmittel: A-A-72.** Die Behebung steht seit **T-075** im selben Baum:
`apps/desktop/scripts/verify-sidecar.mjs:113-137` hat genau dieses Loch geschlossen, nennt beide
Schäden wörtlich und ist acht Zeilen lang (`APP_DATA` als `{ variable, folder }` je Plattform).
`proof-db-permissions.mjs` ist ausgenommen — es steigt unter `win32` in Zeile 113 aus.

### T-247-7 — die Abwesenheit ist eine Zusage des Übersetzers (Feststellung)

**Pfad:** `apps/local-api/src/routes/addin/ports.ts:22-29`.

`AddinUnit` führt keinen `AttachmentPort`, und `service.ts` faßt `unit.attachments` nirgends an.
Zur **Laufzeit** reicht `context.transactions.inTransaction` aber weiterhin den vollständigen
`UnitOfWork` herein, und der trägt `attachments` (`packages/storage/src/ports.ts:108`);
`AddinUnit` ist ein `Pick<>` darauf und kein eigenes Objekt. Der Kommentar sagt, das Token könne
keinen Anhang anlegen, *„nicht, weil eine Prüfung es abweist, sondern weil die Fähigkeit in
dieser Vertrauensstufe nicht vorhanden ist"* — vorhanden ist sie, erreichbar ist sie nicht ohne
eine Typzusicherung. Der Verzicht auf einen Übersetzungsadapter ist in `app.ts` begründet und
bleibt die richtige Abwägung; **der Satz gehört auf das Maß der Sache gebracht.**

---

## Gemessene Läufe (Windows 11, Node 22.23.2, pnpm 11.3.0)

| Lauf | Ergebnis |
|---|---|
| `proof:route-policy` (dreimal) | **44/0**, Code 0 |
| `proof:addin` | **228/0** |
| `proof:callers` | **56/0** |
| `proof:openapi` | **113/1** — allein das CRLF-Artefakt aus `proof-openapi.mjs:153`, steht als T-248 auf dem Board |
| `proof:addin-wiring` | **27/5** — nicht der Rückbau, siehe T-247-6 |
| eigene Gegenprobe gegen 18f | siehe T-247-1 |

**Nicht gefahren und deshalb nicht behauptet:** `pnpm check` als Ganzes, `cargo test`,
`pnpm test:e2e`.

**Werkzeuge nach der Rollenbeschreibung:** `which semgrep` und `which 42crunch` sind beide leer.
**Semgrep über den Guardian-Dienst ist nicht gefahren; `42crunch-audit` gegen
`apps/local-api/openapi/takt-local-api.yaml` ist nicht gefahren; `42crunch-scan` ebenfalls
nicht.** Die Definition of Done dieser Rolle ist damit an zwei von vier Punkten **nicht** durch
Messung gedeckt, sondern durch das Fehlen des Werkzeugs — unverändert seit T-156-9 und T-241-7
und weiterhin eine Beschaffungsentscheidung.

**Repository-Hygiene:** Der Diff dieser Welle über `apps/` und `docs/` trägt keine Zugangsdaten,
keine Schlüssel und keine echten Call-Nummern; die Prüfdaten sind `TCK-000009`, `TCK-000010`,
`TCK-000042`. Alle Geheimnisse in den Prüfläufen entstehen aus `randomBytes`.

**Bauergebnisse eigens gelesen** (weil der Aufgabenbereich daraus ausgeliefert wird):
`apps/desktop/src-tauri/taskpane/assets/index-*.js` (neu gebaut 2026-09-10 01:50) und
`apps/outlook-addin/dist/` enthalten **null** Vorkommen von `attachments` und keinen Aufruf auf
`…/addin/todos/…/attachments`.

---

Annahmen:
1. **Die vier Anhangsrouten der Hauptanwendung habe ich nicht einzeln nachgebaut**, sondern die
   Rundfahrt aus `proof:route-policy` Abschnitt 4 als Messung gewertet und ihre Ausgabe gelesen.
   Sie fährt jede registrierte Route mit dem Add-in-Token an; das ist die stärkere Form als vier
   Einzelaufrufe, weil sie eine künftige fünfte mitnimmt.
2. **Die Gegenprobe zu 18f hängt die Verstümmelung zur Laufzeit an**, statt eine Datei im Baum zu
   ändern. Das mißt die Logik des Wächters und nicht seinen Text, und es hinterläßt keinen
   veränderten Baum. Die Grenze der Aussage ist damit: Ich habe gemessen, daß 18f **eine
   angehängte** Route nicht fängt, nicht, daß ein Erbauer sie genauso einbauen würde.
3. **A-A-21 bleibt inhaltlich stehen und bleibt „erfüllt".** Der Auftrag sagte, die Aussage sei
   wieder wahr; das habe ich bestätigt. Geändert ist ausschließlich ihre **Nachweisspalte** —
   nach A-A-70 an Ort und Stelle, mit dem alten Wortlaut im Zitat.
4. **T-247-6 gehört nicht zu F-21** und steht trotzdem in diesem Bericht: Ich habe den Schaden
   beim Messen dieses Auftrags ausgelöst, und die Zahl 32/0 aus dem Bericht von integration-dev
   hängt daran.
5. **`risks.md` habe ich nicht angefaßt.** R-25 sagt, das Risiko sei „auf seinen nächsten Anlaß
   vertagt" — der nächste Anlaß war derselbe Auftrag (T-247-1). Ob R-25 deshalb neu gefaßt wird,
   entscheidet der Orchestrator; die Datei gehört ihm.

Risiken:
- **Bis A-A-71 gebaut ist, hängt A-19.19 an einer Zahl.** `addinSurface.length === 4` ist heute
  der einzige Lauf, der eine neue Anhangstür unter `/addin` fängt, und er fängt sie, weil er über
  keinen Namen urteilt. Wer die Route hinzufügt, kann die Zahl mitziehen.
- **Bis A-A-72 gebaut ist, beschädigt jeder `pnpm check` auf einem Windows-Rechner mit
  installiertem SuperTakt dessen Bestand und Token.** Das betrifft auch jeden künftigen Agenten,
  der auf dieser Maschine mißt.
- **Wurzelspeicher (A-23, R-23) und fremde Datei (A-20.7, R-24) sind weiterhin nicht im
  Bedrohungsmodell bewertet.** Dieser Auftrag hat nur den dritten der drei Wege erledigt. Beide
  offenen sind schwerer als der erledigte: `Cert:\CurrentUser\Root` gilt dem Benutzerkonto für
  **jede** TLS-Verbindung, und ein Fremdbackup reicht bis an den Öffnen-Befehl heran.
- **Zwei Punkte der Definition of Done dieser Rolle sind mangels Werkzeug ungedeckt** (Semgrep,
  42Crunch-Audit über der Schwelle des Sicherheitsgates).

Offene Fragen:
1. **An den Orchestrator:** Soll A-A-71 in derselben Welle gebaut werden wie die Textbefunde
   T-247-2/4/5, oder als eigene Aufgabe? Sie liegt in `apps/outlook-addin/scripts/` und damit in
   integration-devs Hoheit, während T-247-4 in `apps/local-api/openapi/` liegt.
2. **An den Orchestrator:** T-247-6 ist der einzige Befund der Stufe **muß** und hat mit F-21
   nichts zu tun. Er blockiert aber jede weitere Messung auf dieser Maschine, sobald jemand
   `pnpm check` fährt. Vorschlag: eigene Aufgabe, **vor** der nächsten Messwelle.
3. **An den Orchestrator:** Wird R-25 neu gefaßt? Der Satz „auf seinen nächsten Anlaß vertagt"
   hat sich in derselben Aufgabe eingelöst, in der er geschrieben wurde. Das gehört in die
   Risikoliste, und die gehört Ihnen.
4. **An den spec-ux-reviewer:** T-247-10 — der V-08-Satz ist in Welle 1 gefallen, obwohl E-100
   Punkt 5 die Zustimmung für Welle 2 vorgesehen hatte. Nachträgliche Zustimmung oder Rücknahme?

Nächster Schritt:
**A-A-71 zuerst** — sie ist der eigentliche Gegenstand dieses Auftrags, ihre Gegenprobe liegt
fertig in 33.2, und ohne sie steht A-19.19 auf einer Zahl. Parallel und unabhängig davon
**T-247-6** als eigene Aufgabe, weil er die Meßgrundlage aller weiteren Wellen auf Windows
beschädigt. Die vier Textbefunde (T-247-2, -4, -5, -7) passen in **einen** Auftrag pro Hoheit
und sind zusammen keine halbe Stunde. Danach `pnpm check` als Ganzes — er ist mit dem
Nachschlag von domain-dev zum ersten Mal seit dem Rückbau vollständig fahrbar.

---
---

# Zweite Runde — Wiedervorlage T-247: hält der umgebaute Wächter meiner eigenen Aushebelung stand?

Aufgabe: T-247 (Wiedervorlage) — Gegenprüfung des Umbaus von `proof:addin` Abschnitt 18f (A-A-71)
Status: braucht Review — **Urteil: A-A-71 erfüllt; Prüfung insgesamt Nacharbeit**

Artefakte:
- `docs/bedrohungsmodell.md` — **Kapitel 34 neu** (34.0 bis 34.9: Abnahme A-A-71, vier Angriffe,
  fünf gehaltene Versuche, sieben Befunde, zwei neue Auflagen **A-A-73** und **A-A-74**); dazu
  zwei Berichtigungen **an Ort und Stelle** nach A-A-70: die Nachweisspalte von **A-A-21** in der
  Auflagentafel von Kapitel 20 (zweite Berichtigung, alter Wortlaut im Zitat) und ein **Nachtrag
  in 33.8**, der die Abnahme von A-A-71 und A-A-72 festhält.
- `.claude/team/reports/T-247-security-checker.md` (diese Datei, fortgeschrieben)

Kein Produktivcode angefaßt. Sieben Angriffsläufe im Scratchpad gegen den zusammengesetzten Dienst
mit `:memory:`; die Verstümmelungen hängen zur Laufzeit an der fertigen App, der Baum ist
unverändert. `%LOCALAPPDATA%\Takt` ist nach allen Läufen unberührt (Zeitstempel 01:56/01:57, vor
dem ersten Lauf von heute morgen) — anders als in der ersten Runde.

## Kurzfassung

**A-A-71 ist erfüllt, und der Angriff aus der ersten Runde wird heute gefangen.** Alle fünf Stücke
der Auflage sind gebaut, die Gegenproben benutzen dieselben Hilfsfunktionen wie die tragenden
Prüfungen (kein Zwilling, der neben der Sache mißt), `proof:addin` habe ich eigenständig
nachgefahren: **238 bestanden, 0 fehlgeschlagen, Code 0**.

**Zwei neue Wege am Wächter vorbei, beide gemessen, keiner davon derselbe wie in der ersten Runde.**

1. **Die Tür, die keine Route ist.** 18f spannt seine Fläche aus `service.app.routes` und filtert
   mit `path.includes('/addin')`. Ein **Kettenglied** (`app.use('*', …)`) steht dort mit dem Pfad
   `/*`, darf aber jede Anfrage selbst beantworten. Gemessen: ein Kettenglied, das
   `POST /addin/todos/{id}/links` beantwortet und eine Zeile in `todo_attachment` schreibt,
   antwortet mit gültigem Add-in-Token **201**, hinterläßt **eine Zeile** — und **alle drei**
   Prüfungen von 18f bleiben grün, Menge wie Wirkung wie Name.
2. **Die Rundfahrt kommt an der einzigen schreibenden Route nicht an.** Gemessen: 200 / 200 / 201 /
   **422**. `PROBE_RUMPF.startedAt` trägt Bruchteile (`.000Z`), die Prüfschicht von
   `…/time-entries` verlangt sie ohne — derselbe Aufruf ohne Bruchteile antwortet 201. Die
   Untergrenze fängt das nicht: Sie zählt **gefundene Routen**, nicht **angekommene Anfragen**.
   Gemessen: mit fremder Herkunft (4 × 403) und ohne Token (4 × 401) bleibt die Rundfahrt **grün**.
   Das ist wörtlich der Fall, gegen den A-A-60 geschrieben wurde.

**A-19.19 hält heute trotzdem im Code.** Neun Türen gesucht, neun zu: `…/attachments`, `…/links`,
`…/files`, `…/mail`, `/addin/attachments`, ein zufälliger Pfad und `/addin/todos/` antworten mit
gültigem Add-in-Token **404**; `/ADDIN/todos` und die Anhangsroute der Hauptanwendung antworten
**401**; null Zeilen in `todo_attachment` nach allen neun Versuchen. Die Befunde sind Befunde am
**Wächter**, nicht an der Fläche — an genau der Stelle, an der dieser Baum schon einmal einen
grünen Lauf über eine offene Tür gelegt hat.

## Antworten auf die drei Fragen des Auftrags

**„Erreicht die Rundfahrt wirklich jede Route?"** Nein, und zwar in drei Stufen. Sie erreicht (a)
nur, was in `app.routes` steht — kein Kettenglied, also nichts, was unter `/addin` antwortet, ohne
eine Route zu sein (34.2). Sie erreicht (b) nur **einen** Eintrag je Pfad: `addinFlaeche`
entdoppelt über `Set`, `proof-route-policy.mjs:392` über eine `Map`, und gemessen an Hono 4.13.5
gewinnt die **zuerst** registrierte Handhabe — eine Zeile über `api.route('/addin', …)`
beantwortet einen der vier Pfade selbst, und keine der beiden Listen zeigt sie (34.4). Und sie
erreicht (c) den **Anwendungsfall** nur bei drei von vier Routen; bei der vierten endet sie an der
Prüfschicht (34.3). Dazu ein vierter Fall: Ein Platzhalter, der nicht `:todoId` heißt, wird als
Literal angefahren — gemessen 422 auf `/addin/todos/:id/links`, während derselbe Pfad echt 201 und
eine Zeile ergibt (34.5).

**„Ist die Untergrenze stark genug?"** Nein. `addinFlaeche(service).length >= 4` schützt gegen die
Rundfahrt über **null Routen** und gegen nichts sonst; sie ist zudem im Mengenbein bereits
schärfer enthalten. Was fehlt, ist der Ankunftsnachweis aus A-A-60. Was heute **rettet**, und das
gehört dazu: Gegenprobe 1 verlangt von ihrer eingehängten Tür `status < 400` und eine Zeile — eine
**vollständige** Blindheit des Aufbaus (falscher Wirt, falsche Herkunft, kaputtes Token) fiele
damit auf. Die **teilweise** fällt nicht auf, und die teilweise besteht heute.

**„Stimmt Kapitel 33 noch?"** In der Sache ja, in einer Zeile nicht: Die Nachweisspalte von A-A-21
beschrieb 18f in seinem Stand von gestern („kein Pfad unter `/addin` mit `attachment` im Namen").
Nach A-A-70 an Ort und Stelle berichtigt, alter Wortlaut im Zitat, mit Verweis auf die Abnahme in
34.1 und auf die beiden gemessenen Grenzen in 34.2/34.3.

## Befunde der zweiten Runde

| Nr. | Stufe | Kurz | Zuständig |
|---|---|---|---|
| T-247-0 | **Abnahme** | **A-A-71 erfüllt** — fünf Stücke gebaut, `proof:addin` 238/0 eigenständig nachgefahren, beide Gegenproben tragen | — |
| T-247-11 | **soll** | Eine Anhangstür, die **keine Route** ist, sieht 18f nicht (201 + eine Zeile, alle drei Prüfungen grün). Gegenmittel **A-A-74** | integration-dev |
| T-247-12 | **soll** | Die Rundfahrt kommt an `…/time-entries` nicht an (422); die Untergrenze zählt Routen, nicht Ankünfte (4 × 403 bleibt grün). **Verstoß gegen A-A-60.** Gegenmittel **A-A-73** | integration-dev |
| T-247-13 | Feststellung | Zwei Registrierungen auf demselben Pfad ergeben **einen** Eintrag, in beiden Läufen; die zuerst registrierte gewinnt | integration-dev |
| T-247-14 | Feststellung | Ein Platzhalter, der nicht `:todoId` heißt, wird als Literal angefahren — heute nur vom Mengenbein gefangen | integration-dev |
| T-247-15 | Berichtigung | Nachweisspalte von A-A-21 beschrieb 18f von gestern — **berichtigt** | — |
| T-247-16 | Hinweis | Semgrep und 42Crunch weiterhin ohne Werkzeug | Orchestrator |

Ausgeschrieben mit Pfad, Anforderung, Auswirkung und Gegenmittel in `docs/bedrohungsmodell.md`
Kapitel **34.7**; die beiden neuen Auflagen mit ihren Gegenproben in **34.8**.

## Was ich versucht habe und was gehalten hat

Weil eine Aussage über einen Wächter nur so viel wert ist wie die Angriffe, die sie überstanden
hat — fünf Versuche, die **nicht** durchkamen (34.6):

1. Die alte Tür unter neuem Namen, **als Route** (`…/links`): beide Beine rot, mit Pfad. Das ist
   Gegenprobe 1 und sie fährt im Lauf 238/0 mit.
2. `app.mount()`: trägt als `ALL /api/v1/addin/x/*` ein — sichtbar für die Mengenprüfung und
   zusätzlich rot an A-A-56 (Form ≠ `/*`).
3. Eine zweite Tabelle: es gibt keine. `todo_attachment` ist die einzige; ein Bild liegt als Datei,
   aber **immer** mit Zeile (Migration 0015, A-A-17/18). Der Zähler mißt die richtige Stelle.
4. Groß-/Kleinschreibung: `POST /api/v1/ADDIN/todos` mit Add-in-Token → **401**.
5. Die Anhangsroute der Hauptanwendung mit Add-in-Token → **401**, unverändert.

Ein zusätzlicher gemessener Punkt zugunsten des Bestands: Ein **elftes** `app.use('*', …)` fällt
bei `proof:route-policy` an A-A-56 auf (gemessen: elf `ALL`-Einträge, alle auf `/*`). Der Weg aus
34.2 bleibt trotzdem offen, wenn die Tür **in einem der zehn vorhandenen** Kettenglieder steht —
dann ändert sich keine Zahl in diesem Baum. Und er ist auch dann ein Befund an 18f: Die Zusage zu
A-19.19 hängt an 18f, nicht an `proof:route-policy`, und ein Wächter, dessen Zusage in einem
anderen Lauf hängt, ohne es zu sagen, ist die Bauart aus R-25.

## Gemessene Läufe (Windows 11, Node 22.23.2, pnpm 11.3.0)

| Lauf | Ergebnis |
|---|---|
| `pnpm --filter @takt/outlook-addin proof:addin` | **238/0**, Code 0 — eigenständig nachgefahren |
| eigener Lauf 1: was die Rundfahrt wirklich anfährt | 200 / 200 / 201 / **422** |
| eigener Lauf 2: Kettenglied als Anhangstür | 201, eine Zeile, 18f dreimal grün |
| eigener Lauf 3: Entdopplung (`Set`) | roh 5, entdoppelt 4, Mengenprüfung grün |
| eigener Lauf 4: Vorrang zweier Registrierungen (Hono 4.13.5) | die zuerst registrierte antwortet |
| eigener Lauf 5: leere Rundfahrt | 4 × 403 grün, 4 × 401 grün |
| eigener Lauf 6: fünfte Route mit `:id` statt `:todoId` | Rundfahrt 422 ohne Wirkung, echt 201 + Zeile |
| eigener Lauf 7: neun Pfade am unveränderten Baum | siebenmal 404, zweimal 401, null Zeilen |

**Nicht gefahren und deshalb nicht behauptet:** `pnpm check` als Ganzes (der Orchestrator meldet
ihn für heute vollständig und mit Code 0 — das ist seine Messung), `proof:route-policy`,
`proof:openapi`, `cargo test`, `pnpm test:e2e`. Wo ich über `proof:route-policy` urteile, urteile
ich über **gelesenen Quelltext** und sage es an der Stelle.

**Werkzeuge nach der Rollenbeschreibung:** `semgrep` und `42crunch` unverändert nicht vorhanden.
Semgrep über den Guardian-Dienst nicht gefahren, `42crunch-audit` gegen
`apps/local-api/openapi/takt-local-api.yaml` nicht gefahren, `42crunch-scan` nicht gefahren. Zwei
von vier Punkten der Definition of Done dieser Rolle bleiben durch das Fehlen des Werkzeugs
ungedeckt.

**Repository-Hygiene:** Die Prüfdaten meiner Läufe sind erfunden (`TCK-000042`,
`https://example.org/mail/42`, `t.beispiel`); alle Geheimnisse entstehen aus `randomBytes`. Nichts
davon liegt im Baum — die Läufe stehen im Scratchpad außerhalb des Bestands.

Annahmen:
1. **A-A-71 wird nach ihrem Wortlaut abgenommen, nicht nach ihrer Wirkung.** Der Wortlaut ist
   ausgeführt und nachgemessen; daß er A-19.19 nicht vollständig einfängt, ist ein Befund an
   **meiner** Auflage aus der ersten Runde und nicht an ihrer Ausführung. Deshalb: erfüllt, und
   zwei neue Auflagen daneben.
2. **Die Verstümmelungen hängen zur Laufzeit an.** Gemessen ist damit die **Logik** des Wächters,
   nicht sein Text — und der Baum bleibt unverändert. Grenze der Aussage: Ich habe gemessen, daß
   18f eine **so** eingehängte Tür nicht fängt, nicht, daß ein Erbauer sie genauso einbauen würde.
   Für den Fall aus 34.2 ist die plausible Bauart (elftes `app.use` in `app.ts`) eigens
   mitgemessen und benannt: sie fällt bei `proof:route-policy` auf, die Bauart „in einem der zehn
   vorhandenen Kettenglieder" nicht.
3. **T-247-13 ist als Feststellung eingestuft, nicht als Befund.** Die Unsichtbarkeit in beiden
   Listen ist gemessen, die Wirkung nur im Zusammenspiel mit T-247-12 zusammengesetzt — sie am
   Stück zu messen hätte `app.ts` verlangt, und das ist nicht meine Datei.
4. **`risks.md` habe ich wieder nicht angefaßt.** R-25 („auf seinen nächsten Anlaß vertagt") hat
   sich zum zweiten Mal in derselben Aufgabe eingelöst. Ob das in die Risikoliste geht, entscheidet
   der Orchestrator; die Datei gehört ihm.

Risiken:
- **A-19.19 hängt heute an zwei Läufen, und nur einer davon sagt es.** 18f fängt die anders
  benannte Route; die Zahl in `proof:route-policy` fängt zusätzlich das elfte Kettenglied. Fällt
  einer der beiden weg oder wird eine Zahl mitgezogen, merkt es niemand am anderen.
- **Bis A-A-73 gebaut ist, kann die Rundfahrt still leerlaufen.** Vier abgewiesene Anfragen sehen
  im Lauf genauso aus wie vier angekommene.
- **Wurzelspeicher (A-23, R-23) und fremde Datei (A-20.7, R-24) sind weiterhin nicht bewertet.**
  Beide sind schwerer als alles in Kapitel 33 und 34: `Cert:\CurrentUser\Root` gilt dem
  Benutzerkonto für **jede** TLS-Verbindung, und ein präpariertes Fremdbackup reicht bis an den
  Öffnen-Befehl heran.

Offene Fragen:
1. **An den Orchestrator:** A-A-73 und A-A-74 liegen beide in `apps/outlook-addin/scripts/` und
   sind zusammen ein kleiner Auftrag — in **eine** Aufgabe an integration-dev, oder erst A-A-73
   (billig, drei Gegenproben) und A-A-74 in der Welle danach?
2. **An den Orchestrator:** Soll die Durchgriffsprobe aus A-A-74 zusätzlich in
   `proof:route-policy` stehen? Dort ist die Zahl der Kettenglieder zu Hause; in 18f ist die
   Zusage zu A-19.19 zu Hause. Ich habe sie in 18f gelegt, weil die Zusage dort steht.
3. **An den Orchestrator:** Nächster Gegenstand für diese Rolle — **A-23 Wurzelspeicher** oder
   **A-20.7 Fremdimport**? Beide sind seit den Abschnitten 20 bis 24 unbewertet (R-23, R-24), und
   beide wiegen schwerer als der jetzt zweimal geprüfte Add-in-Weg.

Nächster Schritt:
**A-A-73 zuerst** — sie ist billig, ihre drei Gegenproben liegen fertig in 34.3, und ohne sie kann
jede künftige Aussage von 18f über eine Wirkung leerlaufen. Danach **A-A-74**, deren Gegenprobe A
in 34.2 zeichengenau beschrieben ist. Beide ändern nur `apps/outlook-addin/scripts/proof-addin.mjs`.
Danach — und das ist der eigentliche Vorschlag dieser Runde — **weg von dieser Fläche**: Der
Add-in-Weg ist jetzt zweimal angegriffen worden, der Wurzelspeicher aus A-23 noch kein einziges
Mal.

---

## Nachschlag: die beiden Fragen des Orchestrators (Fund des Code-Reviewers zu `PROBE_RUMPF`)

Der Fund ist derselbe wie mein T-247-12, unabhängig gefunden und mit denselben Zahlen gemessen
(200 / 200 / 201 / 422; mit `…T08:00:00Z` antwortet dieselbe Route 201). Zwei Messungen, zwei
Wege, ein Ergebnis — das erhöht seinen Wert, ändert aber die Einstufung nicht.

**Frage 1: Reicht eine Rundfahrt, die an der Eingabeprüfung hängenbleibt, als Beleg für „keine
Route legt einen Anhang an"?**

Nein — für diese Route nicht, und zwar unabhängig davon, wie viele andere Beine daneben stehen.
Die Rundfahrt behauptet **eine Wirkung**: „nach dem Ansprechen jeder Route steht in
`todo_attachment` nichts". Bei `…/time-entries` spricht sie die Route nicht an, sondern ihre
Prüfschicht. Was sie dort belegt, ist: *ein ungültiger Rumpf legt keinen Anhang an.* Das ist wahr
und nutzlos.

Ich teile die Einschätzung des Code-Reviewers, daß es **nicht blockierend** ist — A-19.19 hält
heute im Code, neun Türen gesucht, neun zu (34.6). Und ich teile seine Einordnung in dieselbe
Fehlerklasse, eine Ebene tiefer: Erst maß der Wächter den Namen, dann die Routenliste, jetzt die
Prüfschicht. Jedes Mal etwas, das **vor** der Anforderung liegt.

**Zur Umstellung der Untergrenze: ja, aber nicht als Ersatz, sondern als drittes Stück.** Die
Untergrenze auf „angenommene Anfragen" umzustellen genügt nicht, weil „angenommen" mehrdeutig ist
— ein 404 ist auch eine Antwort. Was A-A-73 verlangt (34.8), sind drei Sätze statt eines:

1. Der Probenrumpf wird von der Prüfschicht **angenommen** (Zeitstempel ohne Bruchteile), so daß
   `…/time-entries` mit **201** antwortet.
2. **401, 403 und 404 sind Fehlschläge der Messung**, nicht Ergebnisse; mindestens eine
   **schreibende** Route muß mit `2xx` geantwortet haben. Sonst hat der Lauf den Aufbau gemessen
   und nicht die Fläche.
3. Ein Platzhalter, der nach dem Einsetzen noch im Pfad steht, ist ein Fehlschlag, kein Aufruf.

Warum Punkt 2 mehr ist als eine Verschärfung: Gemessen (34.3) bleibt die Rundfahrt heute **grün**,
wenn **jede** Anfrage abgewiesen wird — mit fremder Herkunft viermal 403, ohne Token viermal 401.
Die Untergrenze zählt Pfade und sieht davon nichts. Das ist wörtlich A-A-60 („neben jede Aussage
über einen Angriff den Nachweis, daß er angekommen ist"), und A-A-60 ist seit T-223 eine Bedingung
der Abnahme, keine Empfehlung.

**Frage 2: Erreicht die Rundfahrt wirklich jede Route?**

Nein, in vier Stufen, alle gemessen:

1. **Nur was im Zuordner steht.** Ein **Kettenglied** (`app.use('*', …)`) steht in `app.routes`
   mit dem Pfad `/*`, der Filter lautet `path.includes('/addin')` — es fällt heraus, darf aber
   jede Anfrage selbst beantworten. Gemessen: ein Kettenglied, das
   `POST /addin/todos/{id}/links` beantwortet und eine Zeile schreibt: **201**, eine Zeile,
   **alle drei** Prüfungen von 18f grün (34.2). Das ist der eigentliche Fund dieser Runde.
2. **Nur ein Eintrag je Pfad.** `addinFlaeche` entdoppelt über `Set`, `proof-route-policy.mjs:392`
   über eine `Map`. Gemessen an Hono 4.13.5: Die **zuerst** registrierte Handhabe antwortet — eine
   Zeile über `api.route('/addin', …)` beantwortet einen der vier Pfade selbst, und keine der
   beiden Listen zeigt sie (34.4).
3. **Nur bis zur Prüfschicht**, bei drei von vier Routen bis in den Anwendungsfall (34.3, Frage 1).
4. **Nur, wenn der Platzhalter `:todoId` heißt.** Gemessen: `POST /addin/todos/:id/links` wird mit
   dem Doppelpunkt im Pfad angefahren, antwortet 422, Wirkung leer — derselbe Pfad echt: 201 und
   eine Zeile (34.5). Heute fängt das allein das Mengenbein, also genau das Bein, das fortschreibt,
   wer eine fünfte Route berechtigt hinzufügt.

Für den Nachschlag an integration-dev genügen die beiden Auflagen in 34.8: **A-A-73** deckt die
Fragen 1, 3 und 4, **A-A-74** deckt 1 und 2 der Frage 2 (Durchgriffsprobe auf erfundene Pfade unter
`/addin` mit 404-Erwartung; Fläche aus der **Rohliste** statt aus der entdoppelten). Beide ändern
ausschließlich `apps/outlook-addin/scripts/proof-addin.mjs`, beide haben ihre Gegenproben
ausgeschrieben, und für A-A-74 liegt der Bauplan der Verstümmelung in 34.2 zeichengenau vor.

---

## Zweiter Nachschlag — A-A-73/A-A-74 gebaut: zwei Fragen entschieden, zwei Grenzen angenommen

**Ohne Lauf, wie angeordnet.** Beurteilt ist der **Quelltext** (`rundfahrt`, `ankunftsMaengel`,
`fahrtprotokoll`, `durchgriff`, `durchgriffsPfade`, fünf Gegenproben) und das Papier. Die Zahl
244/0 ist die Messung von integration-dev, nicht meine. **Die Abnahme von A-A-73 und A-A-74 steht
damit aus** und gehört in die nächste Wiedervorlage — sagen Sie mir Bescheid, wenn das Tor durch
ist, dann fahre ich die fünf Verstümmelungen selbst nach. Ausgeschrieben in
`docs/bedrohungsmodell.md` **34.10**.

**Frage 1 — „jede Antwort ab 400 ist ein Fehlschlag der Messung": ja, sie trägt.** Zwei Gründe,
und der zweite ist der schärfere. (1) Die Rundfahrt behauptet eine **Wirkung**, und eine Wirkung
entsteht im Anwendungsfall; ab 400 ist der Rumpf dort nie angekommen, und belegt ist nur „ein
abgewiesener Rumpf legt keinen Anhang an". (2) Mit einer Untergrenze, die nur *irgendeine*
schreibende 2xx-Antwort verlangt, **fällt die von A-A-73 verlangte dritte Gegenprobe nicht** —
`POST /addin/todos` erfüllt sie allein. Eine Gegenprobe, die nicht fällt, ist keine; das ist der
Fehler, gegen den dieses Kapitel geschrieben ist, angewandt auf den eigenen Fall. Die Regel muß
**je Route** greifen, nicht je Runde.

Der benannte Preis ist der Zweck: Eine fünfte Route, die den Probenrumpf zurückweist, steht in
`ADDIN_FLAECHE` und ist **nicht gemessen** — genau die stille Lücke aus T-247-14. **Meine Bedingung
dazu, und sie ist der eigentliche Inhalt der Antwort:** Wenn eine berechtigte fünfte Route den
gemeinsamen Rumpf zurückweist, ist der Ausweg ein **eigener Rumpf für diese Route** (Zuordnung
Pfad → Rumpf, jeder mit den Feldern einer Anhangstür) — **nicht** eine Lockerung der Regel und
**nicht** eine Ausnahmeliste von Statuscodes. Ein eigener Rumpf hält die Zusage; eine Ausnahme gibt
sie auf und sieht dabei aus wie Pflege.

Zwei kleinere Punkte, beide in Ordnung: Die Meldungen sind im Wortlaut getrennt („die Wächterkette
hat abgewiesen" gegen „die Prüfschicht hat den Probenrumpf abgewiesen") — Bedingung dafür, daß ein
roter Lauf lesbar bleibt, erfüllt. Und **404 hat im Abschnitt jetzt zwei Bedeutungen** (Rundfahrt:
Fehlschlag; Durchgriffsprobe: verlangtes Ergebnis) — kein Widerspruch, die eine fragt eine
vorhandene, die andere eine erfundene Route, aber der Kommentar sollte es an **einer** Stelle
aussprechen.

**Frage 2 — der Satz ist gezogen.** *„— die Zahl muß null bleiben, unabhängig davon, ob die Route
201, 422 oder 404 antwortet"* ist nach A-A-70 an Ort und Stelle berichtigt (33.8, alter Wortlaut
im Zitat), als **T-247-17** in der Befundtafel 34.7 geführt. Was von seinem Zweck bleibt, steht
jetzt getrennt: **Wirkung** unabhängig vom Statuscode (eine Tür, die anlegt und dann 500 antwortet,
ist eine Tür), **Ankunft** am Statuscode. Zwei Aussagen, zwei Messungen.

**Die beiden Grenzen: angenommen, aufgeschrieben, kein dritter Weg.** Die Durchgriffsprobe fängt
jede Tür mit plausiblem Anhangsnamen und über den Zufallspfad jede, die **jeden** unbekannten Pfad
beantwortet — nicht ein Kettenglied, das nur auf `/addin/todos/{id}/xyzzy` anspringt, und nicht
eines, das ein Feld verlangt, das `PROBE_RUMPF` nicht trägt. Das ist tragbar, weil der Gegner
dieses Wächters die **Wiederholung von PR #16** ist und nicht der Böswillige mit Schreibrecht:
Eine plausible Fläche heißt `attachments`, `links`, `files` oder `mail`, trägt `url`/`target`/
`kind`/`title` und ist meistens eine **Route** — von der Rohliste gefangen. `xyzzy` ist kein Name,
den jemand vergibt, der eine Funktion bauen will. Das ist keine Meßlücke mehr, sondern eine
Hintertür, und damit ist die Reichweite dieser Wächterfamilie sauber benannt: Sie mißt gegen
**Irrtum und Bequemlichkeit**, nicht gegen Absicht mit Schreibrecht.

Zwei Sätze gehören dazu: **Die Grenze gehört in den Kommentar von 18f**, nicht nur in mein Papier —
ein Lauf, der seine eigene Reichweite verschweigt, ist die Bauart aus R-25 (A-A-55: „Eine Aussage
über eine Liste, aus der etwas herausfällt, ist keine"). Und **billig, empfohlen, keine Auflage:**
Der Zufallspfad wird nur mit `POST` angefahren; zwei zusätzliche Anfragen (`PUT`, `PATCH`) auf
demselben Pfad stehen in derselben Schleife und kosten nichts.

---

## Abnahme A-A-73 und A-A-74 — **erfüllt**. Urteil: **freigegeben**

**Nicht die Zahl des Erbauers, sondern der echte Lauf gegen eine verstümmelte Laufzeit.** Ein
Auflösungshaken (`node --import`) leitet den Import von `apps/local-api/src/composition.ts` in
`proof-addin.mjs` auf ein Hüllmodul im Scratchpad um; das reicht `compose` durch und verstümmelt
den **fertigen Dienst**. Gemessen wird damit `proof-addin.mjs` in der Fassung, die im Bestand
steht — der Baum bleibt zeichengleich unverändert.

**Nullabgleich zuerst:** mit der Verstümmelung `keine` läuft `proof:addin` durch den Haken auf
**244/0, Code 0**. Der Haken selbst verändert nichts.

| Verstümmelung | Lauf | Was rot wird |
|---|---|---|
| **Kettenglied** (mein Weg 1 aus 34.2) | **243/1** | A-A-74 Durchgriffsprobe, **mit Pfad**: „unter /addin antwortet etwas, das in keiner Routenliste steht: POST /addin/todos/01a08a71-…/links -> 201" |
| **Route** (dieselbe Tür als Route) | **236/8** | Menge („zuviel"), Wirkung („über das Add-in-Token entsteht ein Anhang (A-19.19)"), Durchgriffsprobe |
| **Doppelt** (T-247-13) | **241/3** | Menge mit eigener Meldung: „doppelt registriert: POST …/time-entries" |
| **Fünfte** (harmlos) | **239/5** | Menge — **nicht** die Wirkung; die Meldungen bleiben unterscheidbar |
| **Abgewiesen** (mein Weg 2 aus 34.3) | **239/5** | A-A-73 Ankunft: „die Rundfahrt ist nicht angekommen — POST …/time-entries: 403 — die Wächterkette hat abgewiesen, hier mißt der Aufbau", samt vollständigem Fahrtprotokoll. Dazu: Die Durchgriffsprobe hat ihren **eigenen** Ankunftsnachweis über die Nachbarroute |
| **Xyzzy** (die benannte Grenze) | **244/0** | **nichts** — wie in 34.10 angenommen und aufgeschrieben |

**Beide Wege dieser Wiedervorlage sind geschlossen, und geschlossen gemessen.** Weg 1 war gestern
bei 244/0 grün und ist jetzt rot mit Nennung des Pfades; Weg 2 war grün und ist jetzt rot mit
Nennung von Route und Statuscode. Beide Male ist der rote Lauf **nicht** die Gegenprobe des
Erbauers, sondern derselbe Angriff, von außen in die Laufzeit gehängt.

Zwei Dinge, die ich nicht gesucht habe und die für den Bau sprechen: Das Fahrtprotokoll steht auch
dann in der Meldung, wenn nur **eine** Route klemmt — der rote Lauf sagt mehr als der grüne. Und
die Durchgriffsprobe trägt ihren Ankunftsnachweis selbst, statt sich auf den der Rundfahrt zu
verlassen; das ist A-A-60 an einer Stelle, an der die Auflage es nicht verlangt hat.

**Der eigene Lauf war ungefährlich:** `%LOCALAPPDATA%\Takt` unverändert (01:56/01:57), A-A-72 wirkt.

**Urteil: freigegeben.** A-A-71, A-A-72, A-A-73, A-A-74 erfüllt. T-247-11 und T-247-12 behoben und
von außen nachgemessen; T-247-13 und T-247-14 mit behoben; T-247-15 und T-247-17 sind Berichtigungen
an diesem Papier und ausgeführt. Offen bleibt allein **T-247-16** (Semgrep, 42Crunch — kein
Werkzeug, keine Agentenarbeit). Ausgeschrieben in `docs/bedrohungsmodell.md` **34.11**.

**Nicht Gegenstand dieser Aufgabe und weiterhin unbewertet:** der Wurzelspeicher aus A-23 (R-23)
und der Fremdimport aus A-20.7 (R-24). Beide wiegen schwerer als alles in den Kapiteln 33 und 34.

---

## Bestätigung 244 → 245 (ohne Lauf, Quelltext gelesen)

**1. Ja, 245 ist mir recht — und die Gegenprobe A2 ist mehr als Fleiß.** Meine Empfehlung war eine
Zeile (`DURCHGRIFF_VERFAHREN` auf drei Verfahren); ohne Gegenprobe stünde damit eine Erweiterung in
der Schleife, von der niemand weiß, ob sie beißt — dieselbe Sorte Zusicherung, gegen die A-A-55 und
A-A-60 geschrieben sind. Besonders richtig ist die **Form** von A2: Sie mißt in zwei Zügen und
belegt damit den **Unterschied**, nicht nur das Ergebnis — erst `POST` mit 404 (die alte
Fragerichtung fand die Tür also nicht), dann die Durchgriffsprobe rot mit `PATCH …/links -> 201`.
Dazu die Gegenmessung `DURCHGRIFF_VERFAHREN = ['POST']` → 244/1, die zeigt, daß A2 selbst bindet.
Genau so hätte ich es verlangt, wenn ich es als Auflage geschrieben hätte.

**2. Die Reichweitenerklärung trägt.** Gelesen im Kopf von 18f. Sie nennt beide Hälften, sie führt
`/addin/xyzzy` ausdrücklich als **Hintertür und nicht als Meßlücke**, und ihr Schlußsatz —
*„Diese Prüfungen ersetzen das Lesen einer Änderung nicht. Sie verhindern, daß eine ungelesene
Änderung **still** grün bleibt"* — ist der Satz, um den es in diesem ganzen Kapitel ging. **Eine
Verfeinerung, nicht blockierend, ohne eigene Auflage:** Der zweite Aufzählungspunkt darf sagen, daß
die Zahl in `proof:route-policy` (A-A-56) das **elfte** Kettenglied fängt, aber keine Tür
**innerhalb** der zehn vorhandenen (34.2) — sonst schreibt ein Leser dem Nachbarlauf mehr zu, als
er leistet. Wenn es in denselben Nachschlag paßt: gern; wenn nicht, ist es kein Grund, etwas
aufzuhalten.

**3. `DELETE` fehlt zu Recht.** A-19.19 spricht über Anhänge, die **entstehen**. Ein Löschverfahren
läßt keinen entstehen, und der Probenrumpf paßt nicht dazu — `PUT` und `PATCH` sind genau deshalb
richtig dazugekommen: Sie können anlegen. Wer später Vollständigkeit will, bekommt sie nicht über
ein weiteres Verfahren, sondern über die Zeilenzählung, und die läuft ohnehin nach jeder Anfrage,
gleich welchen Verfahrens.

**Am Urteil ändert das nichts: freigegeben.** Im Papier festgehalten als Nachtrag am Ende von
Kapitel 34.
