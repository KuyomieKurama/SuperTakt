Aufgabe: T-409b — Sicherheitsprüfung (Teil des Qualitätstors) für PR #18, #19 und #20 (außerhalb des Wellenmodells)
Status: fertig
Artefakte: docs/bedrohungsmodell.md (Nachtrag „Prüfung T-409b“ am Ende), dieser Bericht

Zusammenfassung: Der Mail-Zuordnungsendpunkt ist eng und hält. Das ist gemessen: strikter Rumpf,
gleiche gültige Call-Nummer, Schlüsseltabellen gegen Dubletten, Rollback samt Dateien, nur zwei
Pfade mit erhöhter Rumpfgrenze und unveränderte Aufgaben-, Zeit- und Exportdaten. Die
Zertifikatseinrichtung unter Linux ist eng und durch Prüffälle belegt. Unter macOS ist sie
ungeprüft, und bei jeder Erneuerung bleiben alte Vertrauenseinträge liegen. Nacharbeit gibt es
vor allem bei Zusagen, die seit A-10.11 falsch sind, bei totem Schnellbefehl-Code und bei den
unversionierten Berichten.

Urteil je PR:
- #18: freigegeben, soweit die Wellenprüfungen T-287 bis T-381 ihn decken (Bedrohungsmodell 38 bis 47). Deren offene Auflagen liegen bei T-406a.
- #19: Nacharbeit (T-409b-1, -5 mittel; -2, -3, -4, -6 niedrig)
- #20: freigegeben

Befunde:
- T-409b-1, mittel, A-10.11/A-10.16/A-A-82 — Drei Stellen behaupten noch, an einer vorhandenen
  Aufgabe könne kein Anhang entstehen:
  - der Kopf von `apps/local-api/src/features/todos/email-attachments.ts` („keinen Aufruf, der eine
    Todo-Kennung entgegennimmt und einen Anhang erzeugt“),
  - `CLAUDE.md` im Abschnitt „Frist und Anhänge“ („strukturell“),
  - `apps/outlook-addin/scripts/proof-addin.mjs` Abschnitt 18 unter der Kennung „A-A-82“; `/mails`
    steht dort auf einer Ausnahmeliste.

  `routes/addin/mail-assignment.ts` reicht aber genau das über eine Closure an die Aufnahme weiter.
  Der Wächter misst deshalb die alte Zusage und nicht die neue Grenze.
  Gegenmittel:
  - domain-dev schreibt den Kopfkommentar auf die neue Grenze um: nur über `/mails`, nur bei gleicher
    gültiger Call-Nummer, nur in der Transaktion.
  - integration-dev stellt `proof-addin` 18 auf diese Grenze um und ergänzt eine Gegenprobe:
    `/mails` mit abweichender Call-Nummer liefert 422, `todo_attachment` bleibt unverändert.
  - Der Orchestrator berichtigt `CLAUDE.md`.
- T-409b-2, niedrig, A-10.17 — Der Schnellbefehl ist abgelöst und steht nicht mehr im Manifest-Menü.
  Ausgeliefert werden trotzdem weiter:
  - `apps/outlook-addin/src/quick-command.ts`, `commands.ts` und `commands.html`,
  - `FunctionFile`/`commandsUrl` in `manifest.xml`.

  Der einzige Aufrufer von `mode: 'auto'` ist dieser Code. Der Modus hängt eine fremde Mail samt
  Anhängen ohne Auswahl durch den Benutzer an die Aufgabe, deren Call-Nummer im Mailtext steht.
  Gegenmittel: integration-dev entfernt die vier Stellen und den Modus `auto` aus Schema und
  `mail-assignment.ts`. Ein Weiterbestehen braucht eine Entscheidung.
- T-409b-3, niedrig, A-23.2 bis A-23.5 — Für den macOS-Pfad in
  `apps/desktop/src-tauri/src/outlook_certificate_unix.rs` gibt es keinen Prüffall. Die Tests stehen
  unter `cfg(all(test, target_os = "linux"))`. Gegenmittel: unit-tester ergänzt einen macOS-Test
  mit temporärem Schlüsselbund (`security create-keychain`). Er deckt ab: Anzeige ohne Import,
  falscher Fingerabdruck, CA-Profil.
- T-409b-4, niedrig, A-23 — Bei der Erneuerung bleiben alte Vertrauenseinträge liegen: 825 Tage
  Gültigkeit, Erneuerung 14 Tage vor Ablauf. Unter Linux ist es je ein NSS-Eintrag, unter macOS ein
  Schlüsselbundeintrag, und einen Entfernen-Weg gibt es nicht.
  Gegenmittel: frontend-dev entfernt beim bestätigten Vertrauen fremde Einträge
  `SuperTakt localhost <anderer Fingerabdruck>`, unter Linux mit `certutil -D`, unter macOS mit
  `security delete-certificate -Z`.
- T-409b-5, mittel, Nachvollziehbarkeit der Freigaben — PR #19 hat 395 Berichte gelöscht, und
  `.gitignore` schließt `.claude/team/reports/*` weiter aus. Versioniert ist heute kein Bericht
  (`git ls-files`: 0). E-121 Punkt 12 ist damit nicht umgesetzt. Die Freigaben aus T-287 bis T-381,
  auf die das Bedrohungsmodell verweist, sind nur noch über `git show 7eeb073:<pfad>` lesbar, und
  auch dieser Bericht würde nicht versioniert.
  Gegenmittel (Orchestrator): In `.gitignore` wieder `.claude/team/reports/*-screens/` eintragen und
  die Berichte aus `7eeb073` zurückholen.
- T-409b-6, niedrig — PR #19 hat den Kopf von `apps/desktop/src-tauri/src/attachment.rs` auf fünf
  Zeilen gekürzt. Die Regeln und die Prüffälle für `x.lnk.` und `::$DATA` sind erhalten, die
  Verweise auf A-A-5′ und A-A-28 fehlen. Gegenmittel: frontend-dev ergänzt an den beiden
  Hilfsfunktionen je eine englische Verweiszeile.

Prüfung:
- Semgrep 1.166 lokal (`p/default`, `p/secrets`, `p/github-actions`) über 301 geänderte
  Quelldateien: 23 Treffer, keiner echt, keine Geheimnisse. Die Treffer sind:
  - `shell: win32` bei festen Argumenten,
  - `http://127.0.0.1` in `verify-sidecar.mjs`,
  - nicht-literale reguläre Ausdrücke in Nachweisläufen,
  - `pattern.ts`, das den Ausdruck nur übersetzt; ausgeführt wird er im Worker mit 100 ms Frist.

  Die Guardian-Plattformbefunde habe ich nicht abgefragt, weil sie eine interaktive
  Repository-Auswahl verlangen.
- `pnpm audit --prod`: keine bekannten Schwachstellen. `cargo audit` ist lokal nicht vorhanden.
- Vitest: `mail-assignment.test.ts`, `service-startup.test.ts`, `outlook-addin/test/api/client.test.ts`
  → 38/38 grün.
- `cargo test --lib outlook_certificate` (Linux, echte `certutil`/`openssl`): 7/7 grün.
- Nicht gefahren:
  - `proof:route-policy` und `proof:addin`: binden Port 17843, und parallel arbeiten andere Agenten.
  - 42Crunch-Audit: nicht im Umfang.
  - Der Windows-Pfad (PowerShell): In #19 haben sich dort nur Kommentare geändert.
  - macOS: kein Läufer vorhanden.
- Bewertet am Stand `dd81e4e`. Im Arbeitsbaum sind die Add-in-Dateien parallel in Arbeit, zum
  Beispiel ist die Buchungsroute des Add-ins schon entfernt (E-120).

Annahmen:
- #18 bestand aus Wellenarbeit mit eigenen Sicherheitsberichten (T-287 bis T-370, Bedrohungsmodell
  bis Abschnitt 47). Ich habe ihn nicht vollständig nachgeprüft, sondern mich auf die dort
  anschließenden Punkte gestützt.
- Geldpfad, Archiv und Suche habe ich ausgelassen, weil T-406a sie prüft.

Risiken:
- Solange T-409b-1 offen ist, misst ein grüner `proof-addin` 18 die neue Anhangstür nicht.
- Die unversionierten Berichte (T-409b-5) nehmen dem Qualitätstor die Nachvollziehbarkeit.

Offene Fragen:
- An den Orchestrator: Wird `.gitignore` gemäß E-121 Punkt 12 zurückgestellt?
- An den Orchestrator: Soll `mode: 'auto'` ganz entfallen?

Nächster Schritt:
- Den Aufträgen T-409b-1 und T-409b-2 eine Welle geben, jeweils in einer Welle nach der
  laufenden Add-in-Arbeit.
- `.gitignore` berichtigen (Orchestrator).
- T-409b-3 und T-409b-4 als Risiken zu R-23 führen.
