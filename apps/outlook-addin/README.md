# Takt — Outlook-Add-in

Aus einer geöffneten E-Mail heraus ein Todo in Takt anlegen oder Zeit auf ein
vorhandenes Todo buchen. Deckt Abschnitt 10 der Spezifikation (A-10.1 bis
A-10.10) und die Screens S-12 und S-13.

## Aufbau

```
manifest.xml                 Office-Manifest, ReadItem, enge AppDomains
index.html                   Aufgabenbereich, CSP, Einbindung von office.js
src/config.ts                feste Betriebswerte, darunter die Add-in-Herkunft
src/office/office-js.d.ts    die benutzte Office-Fläche, handgeschrieben
src/office/host.ts           die EINZIGE Datei, die `Office.*` anfasst
src/office/mail.ts           MailFacts, Titelvorschlag, Textübernahme
src/callnumber/pattern.ts    Musterprüfung (B-4.1, B-4.2, B-4.3) + Begründung
src/callnumber/run.ts        die einzige Stelle, an der ein Benutzerausdruck läuft
src/callnumber/worker.ts     der Web Worker; ruft run.ts
src/callnumber/evaluate.ts   harte Zeitgrenze und terminate() — ohne Browser prüfbar
src/callnumber/detect.ts     der Ablauf: Muster → Betreff → Text → Plausibilität
src/callnumber/catalog.ts    erprobte Muster, alle Beispiele erfunden
src/callnumber/labels.ts     die deutschen Ablehnungstexte — die Regel liegt in der Domäne
src/duplicate/rule.ts        A-10.9 und R-15
src/settings/store.ts        Token und Muster im localStorage — nie roamingSettings
src/api/client.ts            X-Takt-Token, Fehlerabbildung, fetch als Port
src/tags/tree.ts             Baum abflachen und durchsuchen, vier Ebenen und mehr
src/tags/new-name.ts         ein Tag, das es noch nicht gibt — die Regel kommt aus der Domäne
src/ui/                      S-12 (TaskPane) und S-13 (SettingsView)
scripts/fixtures.mjs         erfundene Prüfdaten und die Attrappe der Speicherung
scripts/proof-addin.mjs      der ausführbare Nachweis, 100 Prüfungen
```

## Befehle

```
pnpm --filter @takt/outlook-addin proof:addin   # der Nachweis, ohne Outlook
pnpm --filter @takt/outlook-addin typecheck
pnpm --filter @takt/outlook-addin build
pnpm --filter @takt/outlook-addin dev           # Entwicklungsserver auf 17844
```

## Warum das Token im `localStorage` liegt und nicht in `roamingSettings`

`Office.context.roamingSettings` ist der naheliegende Ort für eine
Add-in-Einstellung. Diese Werte werden **im Postfach gespeichert und über
Exchange beziehungsweise Microsoft 365 synchronisiert**. Das Token öffnet
sämtliche lokalen Kundendaten; es dort abzulegen hieße, das Geheimnis in die
Cloud zu tragen — gegen E-001, die erste Entscheidung dieses Produkts. Deshalb
E-019: `localStorage` der Add-in-Herkunft.

In diesem Paket gibt es **keinen einzigen** Aufruf von `roamingSettings`, auch
nicht für Nicht-Geheimnisse. Der Preis ist ehrlich: Muster und Token gelten je
Rechner und Browserprofil. Der Nachweispfad prüft die Abwesenheit über den
gesamten Quelltext.

## Warum die Plausibilisierung zweimal aufgerufen und einmal geschrieben wird

Bis T-028 stand dieselbe Regel zweimal im Quelltext — hier als Bedienung, im
Dienst als Vertrauensgrenze — und ein Wächter im Nachweispfad hielt beide
Fassungen zusammen. E-045 hat sie nach `packages/domain/src/call-number.ts`
gezogen; das Add-in und der Dienst rufen sie seither auf, statt sie zu führen.

Die **zwei Rollen bleiben**: Der Dienst prüft weiterhin selbst und verlässt
sich nicht darauf, dass der Aufrufer das Add-in ist (B-2.9, RR-1). Nur ist der
zweite Aufruf jetzt derselbe Quelltext. Der Grund für den Umzug ist die
Begründung aus E-045: Diese Regel entscheidet mit, ob das Duplikatangebot auf
den richtigen Kundenvorgang zeigt (R-15) — und eine Regel, die über Geld
entscheidet, gehört genau einmal hin. Dieselbe Begründung wie bei der Rundung,
die der Vorlagen-Motor aufruft statt sie nachzubauen.

Was hier blieb, ist der Anzeigetext: `src/callnumber/labels.ts` übersetzt jeden
Ablehnungsgrund der Domäne in einen deutschen Satz. `scripts/proof-addin.mjs`
fährt die Fälletabelle und die 5000 erzeugten Werte weiterhin — jetzt gegen die
eine Fassung, samt der Gegenprobe, dass keine zweite wieder entstanden ist.

## Warum das Add-in Tagnamen schickt und keine Tags anlegt

Seit T-061 kann aus dem Aufgabenbereich heraus ein Tag entstehen, das es in
Takt noch nicht gibt — genau wie im Anlegedialog der Hauptanwendung (T-058).
A-9.5 verlangt, dass die Standard-Tags auf **jedem** Weg greifen, auf dem ein
Todo entsteht; für neue Tags gilt dasselbe Argument. Derselbe Vorgang mit zwei
Ergebnissen, je nachdem wo er geschieht, ist der Befund C-03.

Drei Regeln tragen das:

1. **Das Add-in ruft nirgends „Tag anlegen" auf.** Es sammelt Namen und
   schickt sie als `tagNames` mit `POST /addin/todos`. Der Dienst sucht, findet
   oder legt an — in **derselben** Transaktion, in der das Todo entsteht. Damit
   bleibt weder ein Tag ohne sein Todo zurück, noch ergeben zwei gleichzeitige
   Anfragen zwei Tags.
2. **Wann zwei Namen derselbe sind, entscheidet `packages/domain/src/tag-name.ts`.**
   Das Add-in ruft `tagNameKey` auf und vergleicht nicht selbst. Ein eigener
   Vergleich wäre nicht falsch, sondern *fast* richtig — er träfe „Backend"
   gegen „backend" und läge erst bei „Straße" gegen „Strasse" oder bei einem
   geschützten Leerzeichen daneben. Also genau dort, wo ein Doppelgänger
   entstünde. Derselbe Grund wie bei der Plausibilisierung eine Überschrift
   weiter oben.
3. **Ein vorgemerkter Name ist gekennzeichnet.** Der Chip trägt das Wort „neu",
   wie ein Standard-Tag das Wort „Standard" trägt (A-9.3). Ein Tag anzulegen
   wirkt über dieses Todo hinaus; das darf nicht wie eine Auswahl aussehen.

Gemessen ist das in `scripts/proof-addin.mjs`, Abschnitt 11 — darunter acht
**gleichzeitige** Anfragen mit acht Schreibweisen desselben Namens gegen eine
echte SQLite-Datenbank, die Gegenprobe, dass diese Messung rot werden kann, und
der Vergleich mit dem Weg der Hauptanwendung gegen dieselbe Datenbank.

## Was zum Betrieb noch fehlt

1. **Die Herkunft muss freigeschaltet sein.** `https://localhost:17844` gehört
   in `apps/local-api/src/config.ts` unter `ALLOWED_ORIGINS`. Ohne den Eintrag
   antwortet der Dienst mit 403 — richtig so, aber das Add-in funktioniert dann
   nicht.
2. **Die Routen sind eingehängt** (T-021): `api.route('/addin',
   createAddinRoutes(...))` in `app.ts`, hinter der Kette aus `http/guards.ts`.
3. **Auslieferung über HTTPS.** Office verlangt es. Für die Entwicklung
   erzeugt man ein Zertifikat für `localhost` (üblicherweise mit
   `office-addin-dev-certs`) und lässt Vite darüber ausliefern; im Betrieb
   liefert die Hülle die Dateien aus `dist/` aus.
4. **Symbole.** `assets/takt-16.png` und die übrigen Größen aus `manifest.xml`
   liegen noch nicht vor.
