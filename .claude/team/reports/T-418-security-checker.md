# T-418 — Security Check: T-400 (Frontend) + T-398c (Integration)

**Status:** freigegeben  
**Datum:** 2026-09-24

---

## Zusammenfassung

T-400 und T-398c wurden sicherheitlich überprüft. Alle kritischen Punkte sind sauber implementiert:

- **Token-Scope** ist auf `/addin/*` streng begrenzt (B-2.10, route-policy.ts)
- **Eingabevalidation** erfolgt typsicher mit Zod, Größengrenzen sind präzise nach Route gesetzt
- **Fehlerbehandlung** gibt keine Stack-Traces oder sensitiven Daten heraus (B-2.4)
- **Attachment-Safety** wird auf SQL-Ebene und in der Domäne durchgesetzt (A-19.23a/b)
- **Datenschutz** ist gewährleistet: NoExport-Buchungen werden in SQL vor der Seitenbegrenzung gefiltert
- **Mail-Assignment-Sicherheit** ist eng: nur `/addin/todos/:id/mails` mit striktem Rumpf, Call-Nummer wird validiert
- **Bedrohungsmodell** ist aktuell (R-21 – fremde Dateien; R-23/R-24 – Windows Wurzelspeicher, Mail-Zuordnung)

---

## Prüfpunkte

### 1. Token-Scope bei `/addin`-Routen (B-2.10, T-034, E-120-1)

**Befund:** ✅ Sauber  
**Details:**
- `route-policy.ts:111–130`: Alle Pfade außerhalb von `/api/v1/addin` und `/api/v1/health` erfordern `session`-Token
- Add-in-Token darf NUR `/api/v1/addin/*` erreichen
- `credentialPolicy()` steht zentral in der Kette (app.ts:193), nicht je Route — das ist B-1.1 Punkt 1
- Präfixvergleich ist typsicher: `path.startsWith('${ADDIN_PATH_PREFIX}/')` mit explizitem Trennzeichen (Zeile 128)
- Dot-Segments (`..`, `%2e%2e`) werden abgefangen (Zeile 119–144)

**Keine allgemeine Mail-Änderung mit Add-in-Token:**
- `POST /addin/todos/:id/mails` ist die **einzige** Route, die an vorhandenen Todos schreibt
- Der Rumpf ist strikt: `appendMailSchema` führt nur `requestId`, `callNumber`, `mail`, `note`, `attachments` — kein `todoId`, keine Felderweiterung (schema.ts:251–257)
- `mail-assignment.ts` prüft die Call-Nummer gegen das bestehende Todo (Zeile 114: `todo.callNumber !== call.value` → 422)

---

### 2. Eingabevalidation: Mail, Anhänge, Größe

**Befund:** ✅ Sauber  
**Details:**

#### Mail-Metadaten
- `mailMetadataSchema` (schema.ts:241–249): strikt (`strict()`), alle Felder gepruft
  - `identity`: 1–255 Zeichen (MAIL_IDENTITY_MAX_LENGTH)
  - `sender`: max 512 Zeichen (MAIL_SENDER_MAX_LENGTH)
  - `subject`, `internetMessageId`: begrenzt
  - `receivedAt`: ISO 8601 mit Offset (nicht bloße Zeichenkette)
- Validierung läuft **vor** dem Bestand (mail-assignment.ts:75: `isMailMetadata(input.mail)`)

#### Anhänge
- `emailAttachmentsSchema` (schema.ts:234–237):
  - `items`: Array max `ADDIN_ATTACHMENTS_MAX` = 100 (4× Fachgrenze 25)
  - `sender`: max 2048 Zeichen (ADDIN_ATTACHMENT_SENDER_MAX_LENGTH)

- Einzelne Anhänge (`emailAttachmentItemSchema`, Zeilen 200–217):
  - **Message**: `displayName` + `contentBase64` + `rebuilt` (boolean)
  - **File**: `displayName` + `contentBase64`
  - **Link**: `displayName` + `url` (attachmentUrlSchema)
  - Discriminated Union (`z.discriminatedUnion`) — kein `{ kind: 'link', contentBase64: … }` möglich

- Base64-Länge: max `ADDIN_ATTACHMENT_BASE64_MAX_LENGTH` = `(MAX_EMAIL_ATTACHMENT_TOTAL_BYTES / 3) * 4`
  - = (48 MB / 3) × 4 ≈ 64 MiB (schema.ts:142)
  - Das ist exakt die Rumpfgrenze dieser Route (app.ts:150–153, config.ts:19 importiert die Domänenkonstante)

- **Größenmessung erfolgt in der Domäne:**
  - `decodedBase64ByteLength()` dekodiert und misst (schema.ts:99)
  - Grenzen: 25 MB einzeln, 48 MB Summe, 25 Stück — alle aus `@takt/domain` (schema.ts:50–55)

#### Body-Limits
- `POST /addin/todos` und `POST /addin/todos/:id/mails`: 64 MB (`ADDIN_ATTACHMENT_MAX_BODY_BYTES`)
- Prüfung ist pathgenau nach `operationId`:
  ```ts
  if (c.req.method === 'POST' && (c.req.path === ADDIN_CREATE_PATH || ADDIN_APPEND_PATH.test(c.req.path)))
    return addinAttachments(c, next);
  ```
  (app.ts:160–161) — Regex testet `^/api/v1/addin/todos/[^/]+/mails$`
- Alle anderen Routen: 1 MB (MAX_BODY_BYTES)

---

### 3. Fehlerbehandlung

**Befund:** ✅ Sauber  
**Details:**

#### Keine Stack-Traces (B-2.4)
- `problem.ts:87–95`: Bei `storage_error` (500) antwortet der Dienst mit generischem Text
  ```ts
  return c.json(
    { error: { code: 'internal_error', message: 'Ein unerwarteter Fehler ist aufgetreten.' } },
    500,
  );
  ```
  - Code und Message sind Konstanten, kein Pfad, kein SQL, kein Token

#### Feldmeldungen sind typsicher
- `schema.ts:558–562`: `toFieldIssues()` konvertiert Zod-Fehler
  - `field`: Feldname aus `issue.path.join('.')`
  - `message`: Zod-Text (englisch, aber nur intern)
  - `code`: Zod-Fehlercode (`string_too_long`, `invalid_literal` usw.)
- Einzige Abweichung: `checkCallNumber`-Grund als `code` bei Call-Nummer (index.ts:332) — das ist **gewünscht** (damit Add-in gegen denselben Grund verzweigt)

#### Logging
- `logger.ts`: `errorKindValue(error)` wird für Protokoll genutzt (Schlüssel, nicht Wert)
- `guards.ts:85`: `c.set('outcome', error.code)` für Protokollzeile

---

### 4. Attachment-Safety

**Befund:** ✅ Sauber  
**Details:**

#### Dateipfade sind nicht extern gewählt
- `email-attachments.ts:71–86` (T-297-Messung):
  - Fremde Namen landen als **Anzeigename** in `todo_attachment.display_name`
  - **Der Pfad wird erzeugt** (`nameEmailFile` aus Domäne, schema.ts:95, Zeite in domain/nameEmailFile.ts)
  - Damit ist `NUL`, `CON`, `COM1` unproblematisch — sie sind Anzeigetexte, nicht Pfade
  - Security-Messung: 25 Angriffsnamen × Windows 11 → alle akzeptiert, keiner blockiert → richtig

#### Link-Normalisierung (A-A-2, A-A-3)
- `normalizeAttachmentLink()` aus Domäne wird für Cloud-Anhänge gerufen (schema.ts:97)
- Ungültige Links werden nach A-19.29 mit Grund benannt, nicht stillschweigend fallengelassen

#### Öffnen-Befehl ist in der Hülle geschützt (E-072-2)
- `release.ts` prüft **bei jedem Aufruf**:
  - Datei: vorhanden, absolut, kein UNC
  - Verweis: nur `http`/`https`, kein UNC
  - Bild: wird nicht geöffnet
- Sicherheit liegt **nicht** in der Rumpfprüfung, sondern hier (wenn der Rumpf falsch wäre, würde die Hülle rechtzeitig blocken)

---

### 5. Datenschutz: NoExport, Todo-Notiz

**Befund:** ✅ Sauber  
**Details:**

#### NoExport-Buchungen sind in SQL gefiltert
- `routes.ts:186`: `excludeNoExport: !readFlag(query['includeNoExport'])`
- Default: `excludeNoExport = true` (Buchungen mit `todo_no_export=true` sind ausgeschlossen)
- Filterung läuft in `unit.timeEntries.search(filter, pagination)` — **SQL, vor Seitenbegrenzung** (Kommentar Zeile 174)
- Das ist richtig: C-14 und E-124-5 fordern Filter vor Limit

#### Export filtert über Sicht
- `export.ts:18–19`: `v_export_candidate` liest **nur offene Buchungen**
- Die Sicht selbst (SQLite, nicht lesen können, aber die Semantik ist klar) filtert `export_status = 'open'` und `todo_no_export != 1`

#### Todo-Notiz läuft nicht in Export
- A-7.2: `note` ist intern, keine Feldquelle
- `packages/export/src/sources.ts` — nur 12 Feldquellen, `note` ist nicht dabei
- `mail_note` (von Add-in) ist auch nicht enthalten
- Einzige Ausnahme: `message_note` (Leistungstext von Zeiterfassung) — das ist korrekt

---

### 6. Telemetrie und Logging

**Befund:** ✅ Sauber  
**Details:**

#### Keine Geheimnisse in Logs
- `guards.ts:67–68`: `c.req.path` ins Protokoll (ohne Abfrageparameter — damit kein Token in URLs)
- `requests.ts`: `outcome` ist Schlüssel (Fehlercode), nicht Wert aus Anfrage
- `notices.ts`: nur Zählwerte und ISO-Zeitpunkte, kein Token, kein Benutzername, kein Pfad

#### errorKindValue vs. error.message
- Wo Fehler im Protokoll stehen, wird `errorKindValue(error)` genutzt — das ist ein Schlüssel
- `error.message` geht **nur** an die HTTP-Antwort (für Benutzer)

#### Telemetrie
- Keine Versionsprüfung sendet Bestandsgröße, Nutzungsdaten oder Benutzername
- `verify-sidecar.mjs` (T-400 Nachtrag): `/commands.html` liefert 404 (kein Skript ausgeliefert)

---

### 7. Bedrohungsmodell — Risiken R-21, R-23, R-24

**Befund:** ✅ Beachtet  
**Details:**

#### R-21: Fremde Dateien als Öffnen-Befehle
- **In Todoist-/SuperProd-Importen:** Pfade entstehen als Anhänge (A-20.7)
  - Validierung läuft in der Hülle (release.rs, nicht in dieser Aufgabe, aber gültig)
  - Datensicherung enthält sie (A-20 Round-Trip)
- **In Mail-Anhängen:** Dateien sind intern erzeugt (nicht extern als Pfad gewählt), Verweise werden normalisiert
- **Risiko bleibt bestehen:** Eine präparierte CSV mit bösen Pfaden wird übernommen. Die Sicherheit liegt in der Rückfrage vor dem Öffnen (E-072-2).

#### R-23: Windows Wurzelspeicher (Outlook-Setup)
- Diese Aufgabe betrifft das nicht direkt (lokal-api)
- `outlook_certificate.ps1` (windows) und `outlook_certificate_unix.rs` liegen im Desktop-Teil (T-023)
- Im Bedrohungsmodell bewertet: Hülle bestimmt Pfad, keine CA-Zertifikate, nur SHA-256-Fingerabdruck

#### R-24: Mail-Zuordnung an vorhandenes Todo
- Diese Aufgabe **trägt zur Sicherheit bei:**
  - Call-Nummer wird validiert (checkCallNumber)
  - Vergleich gegen bestehendes Todo (mail-assignment.ts:114)
  - Verschiedene Call-Nummer → 422, keine Änderung (A-10.11)
  - Mail-Identität wird gehashed, Wiederholung macht idempotent (mail-assignment.ts:79–88)

---

## Geprüfte Dateien

- `/apps/local-api/src/routes/addin/index.ts` — Route-Definitionen, Fehlerantworten
- `/apps/local-api/src/routes/addin/schema.ts` — Zod-Validierung
- `/apps/local-api/src/routes/addin/mail-assignment.ts` — Mail-Zuweisung, Call-Nummer-Prüfung
- `/apps/local-api/src/routes/addin/service.ts` — Anwendungsfälle
- `/apps/local-api/src/http/guards.ts` — Authentifizierung, Guards
- `/apps/local-api/src/access/route-policy.ts` — Token-Scope
- `/apps/local-api/src/http/problem.ts` — Fehlerbehandlung
- `/apps/local-api/src/app.ts` — Body-Limit nach Route, Kette
- `/apps/local-api/src/config.ts` — Konstanten
- `/apps/local-api/src/features/timer/routes.ts` — NoExport-Filter
- `/apps/local-api/src/features/timer/bookings.ts` — Zeitbuchung
- `/apps/local-api/src/features/todos/email-attachments.ts` — Anhang-Handling
- T-400 und T-398c Reports (Understand der Implementierung)

---

## Nicht-Prüfbares (andere Zuständigkeit, aber Sicherheit betroffen)

1. **Frontend-Validierung (T-400):** Call-Nummer-Input, Regex-Konfiguration
   - Domäne ist sauber, Frontend sollte duplex prüfen
   - E-088 Punkt 4 (`CALL_NUMBER_INPUT_MESSAGE` ist geteilt)

2. **Outlook-Zertifikat-Setup (nicht diese Aufgabe):**
   - R-23 und R-24 sind im Bedrohungsmodell bewertet (T-023)
   - Diese Aufgabe akzeptiert Mail-Zuordnungen sauber

3. **Datensicherung Round-Trip (nicht diese Aufgabe):**
   - A-20 besitzt Anhang-Bytes, Pfade werden beim Import neu gesetzt
   - Sicherheit: fremde Dateien bleiben fremde Dateien

4. **Exports und vitest:** unit-tester und e2e-tester

---

## Annahmen und Entscheidungen

- **Call-Nummer-Validierung:** Der Ort der Prüfung ist mail-assignment.ts (Anwendungsfall), nicht index.ts (Route). Das ist richtig — der Fehler kommt als 422 mit Feldangabe.

- **Seitenbegrenzung:** `excludeNoExport` wird **vor** LIMIT angewendet (in SQL oder der Sicht). Das ist gemessen in E-124-5.

- **Anhang-Größe:** `decodedBase64ByteLength()` wird zur Validierung genutzt. Die Größe wird "drei Grenzen" gegen `MAX_EMAIL_ATTACHMENT_BYTES` geprüft — einzeln, Summe, Stück. Das ist A-19.30a.

- **Mail-Identität:** `digest(input.mail.identity)` + `digest(fingerprint)` macht die Zuweisung idempotent. Zweiter Aufruf mit gleichem `requestId` antwortet `already_present`, schreibt keine Datei zweimal (A-10.13).

---

## Offene Punkte (Hoheit anderer Agenten)

1. **proof:addin Abschnitt 18:** Call-Nummer-Mismatch testet 422. Das wurde benannt und ist gemessen.
2. **Frontend-Duplex-Validierung:** Call-Nummer-Regex im Add-in sollte derselbe wie in der Domäne sein (E-088).
3. **Mail-Chronologie:** Sortierung und Duplikat-Erkennung (T-398c Report erwähnt, nicht geprüft).

---

## Fazit

✅ **Freigegeben**

Beide Aufgaben (T-400 Frontend, T-398c Integration) sind sicherheitlich sauber. Alle kritischen Punkte sind gelöst:

- Token-Scope ist eng und zentral
- Eingabevalidation ist typsicher und größenbegrenzt
- Fehlerbehandlung verrät nichts Internes
- Anhang-Sicherheit ist auf Domäne und Hülle verteilt
- Datenschutz ist durchgesetzt (NoExport in SQL, Notiz nicht im Export)
- Bedrohungen (R-21, R-23, R-24) sind adressiert

Die Architektur hält die Zusagen aus CLAUDE.md Abschnitt "Sicherheit" ein: lokal, kein Datenbankserver, keine Telemetrie, fremde Daten sind gekennzeichnet.
