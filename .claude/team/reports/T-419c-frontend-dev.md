# T-419c — `verify-sidecar.mjs` Prüfung umkehren

**Status:** Überprüfung läuft

**Aufgabe:** Code-Reviewer meldet: `apps/desktop/scripts/verify-sidecar.mjs` prüft `/commands.html`, aber quick-command wurde entfernt (T-398c). Die Assertion muss umgekehrt werden: von "muss 404 sein / muss Script sein" zu "muss 404 sein / darf kein Script sein".

**Befund am Code (Zeile 445–450):**

Die Assertion ist bereits korrekt umgekehrt:

```javascript
const commands = await taskpaneRequestOrNull('/commands.html', ca);
check(
  'Der entfernte Schnellbefehl wird nicht mehr ausgeliefert: GET /commands.html ergibt 404',
  commands.status === 404 && !/<script/i.test(commands.body),
  `Status ${String(commands.status)}${commands.error ? `, ${commands.error}` : ''}`,
);
```

Die Bedingung `commands.status === 404 && !/<script/i.test(commands.body)` prüft korrekt:
- Status muss 404 sein
- Body darf KEIN `<script>`-Tag enthalten

Das Negation-Zeichen `!` ist vorhanden und korrekt eingesetzt.

**Verifikationslauf:** ✓ Bestanden

Output: 21 bestanden, 0 fehlgeschlagen.

Zeile 32 der Verifikation meldet: `ok    Der entfernte Schnellbefehl wird nicht mehr ausgeliefert: GET /commands.html ergibt 404`

---

## Zusammenfassung

Die Assertion in `verify-sidecar.mjs` (Zeile 445–450) ist bereits korrekt umgekehrt. Sie prüft:

1. **Keine Auslieferung:** Status-Code ist 404
2. **Kein Skript im Body:** Das Negation-Zeichen `!` vor `/<script/i.test(commands.body)` stellt sicher, dass der 404-Response kein Skript-Tag enthält

Die Prüfung bestätigt, dass die `/commands.html`-Route nach T-398c (Entfernung des quick-command) korrekt nicht mehr ausgeliefert wird.

**Status:** Fertig — keine Codeänderung erforderlich. Die Assertion ist bereits korrekt implementiert.
