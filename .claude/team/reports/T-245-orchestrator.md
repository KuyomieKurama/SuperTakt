# T-245 — Bestandsaufnahme nach zwölf Commits von außen

Aufgabe: T-245 — den Bestand nach dem Wechsel des Werkzeugs einlesen und die
Orchestratordateien auf den gemessenen Stand bringen
Status: fertig
Artefakte: `CLAUDE.md`, `.claude/team/board.md`, `.claude/team/decisions.md`,
`.claude/team/risks.md`, dieser Bericht

## Ausgangspunkt

Der Auftraggeber hat mitgeteilt, daß bis unmittelbar vor dieser Sitzung ein anderes Werkzeug an
diesem Bestand gearbeitet hat, und um ein Einlesen gebeten. Gemessen an `git log` gegen
`board.md`: **zwölf Commits Rückstand**, die Pull Requests #5 bis #16 vom 2026-09-08 und
2026-09-09. `git diff ef4d721^..15bdd97` zählt **208 Dateien, 9 804 Zeilen dazu, 2 979 weg**.
`board.md`, `decisions.md` und `risks.md` wurden in keinem dieser Commits angefaßt; `CLAUDE.md`
bekam achtzehn Zeilen, davon dreizehn den Abschnitt „Befehle" und die Marke.

## Was diese Aufnahme ist — und was sie nicht ist

**Gelesen, nicht gemessen.** In dieser Umgebung stehen weder `node` noch `pnpm` noch `cargo` zur
Verfügung; `pnpm check`, `pnpm test:e2e` und `cargo test --lib` waren nicht fahrbar. Jede Zahl in
Board und Bericht ist entweder am Quelltext gezählt oder aus einer Commitnachricht **zitiert**,
und wo zitiert, steht es dabei (E-096 Punkt 3). Der erste Auftrag der nächsten Welle ist deshalb
ein Torlauf auf einem Rechner mit Werkzeug, kein Bauauftrag.

## Befunde

### 1. Der Widerspruch an A-19.19 (T-245-1, F-21, E-099, R-25)

Seit PR #16 gibt es `POST /api/v1/addin/todos/{todoId}/attachments`
(`apps/local-api/src/routes/addin/attachments.ts`), mit dem Add-in-Token erreichbar
(`app.ts:279`). A-19.19 verbietet genau das und steht unverändert in `docs/spec.md`. Die Tür ist
eng gebaut — nur `http(s)` über `normalizeAttachmentLink`, keine Datei, kein Bild, idempotent
gegen den normalisierten Verweis.

Der schwerere Teil ist der zweite: Der Bestand behauptet an **sechs** Stellen weiterhin die
Abwesenheit dieser Fläche — `routes/addin/index.ts:278`, `routes/addin/schema.ts:299`,
`apps/web/src/components/Attachments.tsx:82`, `docs/glossar.md`, `docs/bedrohungsmodell.md`
(A-A-21) und `proof:addin` Abschnitt 18. Der Wächter dort mißt die **Wirkung** und ist trotzdem
zu milde: Er ruft die Anlegetür auf und zählt Zeilen in `todo_attachment`, und die Anlegetür legt
tatsächlich keinen Anhang an. **Er mißt die Tür, die zu ist, nicht die, die aufging** — dieselbe
Klasse wie O-AY und O-LG.

### 2. Archivfassung 5 gegen Spezifikation 4 (T-245-2)

`DATA_ARCHIVE_VERSION = 5` (`usecases/data-transfer.ts:42`), gelesen werden 1 bis 5. A-24.7 nennt
die 4. Die fünfte trägt `idle_keep_timer_running`, also das Timerverhalten aus dem Anhang A der
Spezifikation — dort Fließtext ohne Anforderungs-ID.

### 3. Der Rust-Anteil ist nicht mehr dünn

`CLAUDE.md` beschrieb die Hülle als „Fenster, Menü, Lebenszyklus des Sidecars,
Windows-Benutzername". Gezählt sind **elf** Befehle: dazu Fassung und Release-Seite
(`release.rs`), Öffnen von Verweis und Datei (`attachment.rs`), systemweite Inaktivität
(`idle.rs`, `idle/linux.rs`) und der Zertifikatsweg (`outlook_certificate.rs` mit
`outlook_certificate.ps1`, 122 Zeilen PowerShell). Der letzte schreibt nach
`Cert:\CurrentUser\Root` — der schwerste neue Punkt im ganzen Bestand.

### 4. Was unverändert trägt

Die CSP der Hülle ist zeichengleich geblieben: vier Marken in `connect-src`, `17843` darunter.
Die Bindeadresse ist `127.0.0.1`, der zweite Port `17844` ist HTTPS und liefert ausschließlich
statische Dateien. Nach außen geht weiterhin **eine** Adresse aus dem Erzeugnis:
`api.github.com/repos/KuyomieKurama/SuperTakt/releases/latest`. Zwei weitere Adressen sind
dazugekommen und stehen ausdrücklich nur im **Bau** (Zeitstempeldienst des Code-Signierens,
Azure Artifact Signing) — E-001 bleibt damit unberührt, und in `CLAUDE.md` steht jetzt, warum.

## Was ich geändert habe

- **`CLAUDE.md`:** Hülle und Dienst auf den gezählten Stand; die zwei Bauadressen neben E-001
  benannt; `.github/**` in die Hoheit des Orchestrators; ein neuer Abschnitt „Ungedeckt gebaut"
  zu A-19.19; ein neuer Abschnitt zu den Spezifikationsabschnitten 20 bis 24 mit den Punkten,
  die bei jeder Freigabe zu prüfen sind; drei neue Wege in die Sicherheitsgrenze; „Befehle" um
  Tor, neunzehn Nachweisläufe, die zwei Ausnahmen und die drei GitHub-Abläufe ergänzt; im
  „Ablauf" die Regel, daß Arbeit von außen eingelesen und nicht fertig ist.
- **`board.md`:** T-245 als eigener Abschnitt oben, mit Tabelle je Pull Request, den drei
  Unterbefunden und der Liste dessen, was das Tor noch nicht gesehen hat. Kopf auf SuperTakt und
  auf den 2026-09-10. F-21 und F-22 an den Auftraggeber.
- **`decisions.md`:** E-096 bis E-099.
- **`risks.md`:** R-23 bis R-25.

Zusammenfassung: Zwölf Commits waren an Board, Entscheidungen und Risiken vorbeigelaufen und
sind jetzt eingelesen. Fünf Spezifikationsabschnitte sind dazugekommen (20 bis 24) und sechs
Migrationen (0016 bis 0021); keiner davon hat das Qualitätstor gesehen. Zwei Punkte sind ohne
Deckung durch eine Anforderungs-ID gebaut, einer davon widerspricht einer geltenden Anforderung
ausdrücklich. Die Orchestratordateien stehen wieder auf dem Stand des Bestands, und die
Trennung zwischen Gelesenem und Gemessenem ist an jeder Zahl benannt.

Annahmen: Daß die Pull Requests #5 bis #16 vom Werkzeug des Auftraggebers stammen und nicht von
einem Dritten, ist aus der Mitteilung des Auftraggebers und den Commitnachrichten geschlossen.
Daß A-19.19 **nicht** stillschweigend geändert werden sollte, ist meine Lesart des unveränderten
Spezifikationstextes — die Gegenlesart wäre, daß der Auftraggeber die Anforderung mündlich
aufgehoben hat und nur die Datei nicht nachgezogen wurde. Genau dafür steht F-21.
Risiken: R-23 bis R-25, alle drei neu und keiner davon im Bedrohungsmodell bewertet.
Offene Fragen: F-21 (A-19.19 — Anforderung ändern oder Route entfernen?), F-22 (Auslieferung mit
oder ohne die drei blockierten Punkte?).
Nächster Schritt: Zwei Dinge, in dieser Reihenfolge. Erstens F-21 beantworten lassen — daran
hängt, ob die nächste Welle an dieser Fläche baut oder zurückbaut. Zweitens ein Torlauf auf einem
Rechner mit `node`, `pnpm` und `cargo`, damit die Zahlen im Board wieder gemessen sind. Danach die
Welle: security-checker über die Abschnitte 20 bis 24, spec-ux-reviewer über die Deckung jeder ID
von A-20.1 bis A-24.7, code-reviewer über die 9 800 neuen Zeilen — parallel, die Hoheiten
kollidieren nicht.
