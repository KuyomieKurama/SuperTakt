Aufgabe: T-394 — Sicherheitsaufträge aus der Board-Bereinigung (Welle 18a)
Status: fertig
Artefakte:
- `docs/bedrohungsmodell.md`: Abschnitt 13.4 an der Stelle der Symboldateien berichtigt, neuer Nachtrag „Prüfung T-394" am Dateiende
- `.claude/team/reports/T-394-security-checker.md`: dieser Bericht

Zusammenfassung: 14 Stellen in den drei Nachweisläufen verstoßen gegen die Weigerungsregel. Sieben davon melden grün, ohne zu messen. `app.onError` darf den Fehler ins Protokoll schreiben, aber nur als Klassenname und Code, nie als Meldung. Der Triagebefund zu `data-transfer.ts:186` ist bestätigt und reicht weiter als angenommen. Dazu kommt ein neuer Befund N-1: Der Exportordner reist im Archiv mit.

Prüfung:
- Die drei Nachweisskripte habe ich vollständig gelesen, aber nicht gefahren. `proof:access` und `proof:export-api` binden 17843, und T-388 arbeitet parallel am Dienst.
- Gemessen habe ich mit einem Wegwerfskript unter scratchpad/t394 gegen den echten Adapter: `proof-export` 13.4 lehnt heute am Gruppenindex ab (`conflict`), nicht an der Vorlage. W-5 ist deshalb nur niedrig.
- Gemessen habe ich auch die Fehlermeldungen von Node 22: `JSON.parse` zitiert die Eingabe, `fs` nennt den vollen Pfad.
- Die PNG-Blockliste aller 23 versionierten PNG habe ich gelesen: keine Metadaten, kein C2PA.
- Die Quelle des Symbols habe ich angesehen.
- Semgrep und 42Crunch sind nicht gelaufen. Sie gehören nicht zu diesem Auftrag, und der 42Crunch-Audit ist nach E-120 (T-B06) geschlossen.

Die Urteile je Punkt:
1. Weigerungsregel: **Nacharbeit** für domain-dev. Die Tabelle W-1 bis W-14 im Bedrohungsmodell nennt je Fund Stelle, Zusage, warum sie ungemessen ist, und das Gegenmittel.
   - Ohne jede Messung grün: W-1 (`proof-export:510`, die Datei `takt-nichts`), W-3 (Haken in Abschnitt 4 und 5 ohne Nachweis, dass er erreicht wurde), W-6 (export-api: Token nie provoziert), W-7 (access 0: Start ohne Geheimnis), W-8 (access 14: die Hälfte „nicht das Token" fehlt), W-9 (access 12: keine Einholung und kein Anker für die Protokollzeilen), W-10 (access 1: bei fehlender externer IPv4 übersprungen, IPv6 nie geprüft).
   - Überbehauptet: W-2, W-11, W-12, W-13. Niedrig: W-4, W-5. Entscheidung nötig: W-14.
2. T-377 B-3: **freigegeben**. Die Zeile nennt jetzt 17 Dateien, 15 PNG sowie ico und icns aus `quelle.png`, mit „ST" auf dunklem Grund. Die alte Aussage bleibt als datierter Stand stehen.
3. `app.onError`: **Nacharbeit, bedingt freigegeben**. Erlaubt ist nur `reason` mit `errorKindValue` und einem `code` der Form `^[A-Z0-9_]{1,32}$`. `message`, `stack` und `cause` sind nicht erlaubt. Dazu gehört ein Nachweis, der `onError` provoziert und die Ausgabe mit einer Untergrenze nach A-A-58 prüft.
4. Namen im Archiv: **bestätigt**, T-388 soll das bauen. Nur die Dateinamen von Bildern und Dateien werden auf ihre Form geprüft. Alle Anzeigenamen werden gar nicht geprüft, weder Zeichenklasse noch Länge noch Leerwert. Gegenmittel: pro Tabelle ein festes Verzeichnis der Namensspalten, geprüft mit `hasForbiddenNameCharacter` und der Längenkonstante der jeweiligen Tür; bei einem Verstoß abweisen, nicht bereinigen.

Annahmen:
- „Grün ohne Messung" umfasst auch „übersprungen und Exitcode 0" (W-10, W-14). So lese ich E-121 Punkt 10 wörtlich.
- Die Weigerungsregel verlangt, dass der Lauf rot wird. Diesen Nachtrag schreibe ich auf Deutsch wie den Rest der Datei, obwohl `CLAUDE.md` Projektdokumentation auf Englisch verlangt. Das ist ein Widerspruch in den Regeln; siehe offene Fragen.

Risiken:
- N-1 (mittel): `app_setting.export_directory` kommt unverändert aus dem Archiv. `runExport` fragt die Merkmale des Ordners (UNC, Netz) nicht ab. Ein fremdes Archiv leitet damit künftige Abrechnungsexporte auf eine fremde Freigabe um. Unter Windows sendet schon die Prüfung des Ordners NTLM-Anmeldedaten an den fremden Wirt.
- Solange W-9 offen ist, kann die Leckprüfung auf Geheimnisse in `proof:access` still leerlaufen.
- `onError` provoziert heute keiner der drei Läufe. Eine Protokollierung der Meldung würde also nicht auffallen.

Offene Fragen an den Orchestrator:
1. W-14 und W-10 unter Windows und macOS: rot mit Grund, oder die Zusage ausdrücklich als plattformgebunden in E-121 festhalten?
2. N-1: `export_directory` beim Einspielen immer auf `null` setzen (einfach) oder nur bei `unc`/`network`/nicht vorhanden? Beides berührt A-20.4 (Round-Trip).
3. Sprachregel: `CLAUDE.md` verlangt englische Projektdokumentation. `bedrohungsmodell.md` ist durchgehend deutsch, auch der Nachtrag aus T-386 von heute. Welche Regel gilt für diese Datei?

Nächster Schritt:
- domain-dev: Punkt 4 und die Bedingung aus Punkt 3 in T-388 bauen.
- W-1 bis W-13 als eigener Auftrag an domain-dev, weil die Skripte unter `apps/local-api/scripts/` domain-dev gehören. Danach prüfe ich in T-406 gegen.
- N-1 in `risks.md` aufnehmen.
