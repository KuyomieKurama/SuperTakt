# Hinweis zu Migration 0022 — der Text daneben ist ein Zeitzeuge

**Angelegt:** T-288, 2026-09-11 · **Anlass:** Befund T-287-4, Regel **A-A-77**

Diese Datei ist **keine Migration**. Der Erzeuger (`packages/storage/scripts/embed-migrations.mjs`)
und der Läufer sehen ausschließlich Dateien der Form `NNNN_name.(up|down).sql`; `.md` fällt durch
das Sieb. Die Prüfsumme von `0022_last_version_check_at.up.sql` bleibt davon unberührt — genau
deshalb steht der Hinweis hier und nicht *in* der Migration.

## Worum es geht

`0022_….up.sql` beschreibt ausführlich, wozu die Spalte `app_setting.last_version_check_at`
angelegt wurde: als **Bezugspunkt des harten Bodens über Prozeßgrenzen hinweg** (A-V-11, T-279).
Der Dienst las den Wert beim ersten Prüflauf; ein Neustart innerhalb einer Stunde prüfte deshalb
nicht.

**Dieser Zweck gilt seit E-106 / T-285 nicht mehr.** Der Wert wird geschrieben und **nicht
gelesen**. Ein Programmstart prüft immer einmal; der Boden von 60 Minuten gilt nur noch
*innerhalb* eines Prozeßlaufs. Der Grund steht in `docs/datenmodell.md`, Abschnitt zu
`app_setting`: Weil der Zeitpunkt **vor** der Anfrage geschrieben wird, setzte ihn auch ein
fehlgeschlagener Versuch — Start ohne Netz um 9:00, Neustart um 9:10, keine Prüfung bis 10:00
(TP-VER-11). Der Neustart ist die einzige Selbsthilfe, die E-069 dem Benutzer läßt.

## Der falsche Zeiger, Punkt für Punkt

Der Abschnitt „Form" in `0022_….up.sql` sagt über einen Zeitstempel aus der Zukunft:

> Behandelt wird er dort, wo er gelesen wird: `run()` in
> `apps/local-api/src/features/version/version.ts` erkennt an `elapsed < 0`, …

Das war am 2026-09-11 vormittags richtig und ist es seit T-285 nicht mehr. **`run()` liest den
Wert nicht.** Der `elapsed < 0`-Zweig bewacht heute den Bezugspunkt im Arbeitsspeicher desselben
Laufs, nicht den aus dem Bestand. Der CHECK der Migration selbst ist unverändert gültig: Form,
Länge, `GLOB`, `NULL` erlaubt, Zukunft erlaubt.

Ein Zeiger aus einer Migration in eine Codestelle ist besonders heikel, weil er die Codestelle
überlebt (**A-A-77**). Die Migration darf sagen, *warum* sie geschrieben wurde; *was gerade gilt*,
sagt sie nicht.

## Was gültig ist

| Frage | Gültige Auskunft |
|---|---|
| Wozu die Spalte heute dient | `docs/datenmodell.md`, `app_setting` → `last_version_check_at` |
| Wer sie lesen darf | `docs/datenmodell.md`; bewacht von `proof:release-safety`, Prüfung `rueckweg` (A-V-27, T-288) |
| Warum sie nicht sichtbar ist | `docs/bedrohungsmodell.md` **A-V-26** |
| Warum ein Migrationstext nicht nachgezogen wird | `docs/bedrohungsmodell.md` **A-A-77** |

## Warum die Migration nicht einfach berichtigt wird

Der Läufer vergleicht eine Prüfsumme über den Dateiinhalt (`checksum_mismatch`). Eine bereits
gelaufene Migration im Wortlaut zu ändern bräche **jeden bestehenden Bestand** — auch den des
Benutzers, der nichts von der Änderung weiß. Der Text von 0022 bleibt deshalb, wie er ist, und
diese Datei steht daneben.

Der Rückwärtsteil (`0022_….down.sql`) ist unverändert **richtig**: Er nimmt Spalte und CHECK
zurück. Nur seine Begründung („die Lücke ist wieder offen") beschreibt einen Verlust, den es seit
T-285 nicht mehr zu verlieren gibt.
