# Outlook-Angleichung (A-10.11)

## Abgleich vor der Umsetzung

Referenz: KuyomieKurama/SP-OutlookBridge, am 15.09.2026 eingelesener Git-Stand.
Geprüfte Bereiche: taskpane, commands, outlook, email-attachments, settings,
tag-combo, theme, call-number, notes, email-type, taskpane.html, Manifest und Server.
Die Referenz implementiert Projektauswahl und einen SP-Zwischendienst; diese gehören
nicht zum SuperTakt-Datenmodell und werden nicht übernommen.

| Referenzfunktion | Vorgefundener SuperTakt-Code | Änderung |
|---|---|---|
| Funktionsbefehl ohne Seitenleiste | Aufgabenbereich, kein Funktionseinstieg | commands.html, commands.ts, gemeinsamer saveMail-Aufruf |
| Mail zu einem Call ergänzen | Nur Duplikathinweis | Enger POST /addin/todos/{todoId}/mails |
| Mailverlauf | Übernommener Text im internen Vermerk | Separate todo_mail-Tabelle, persönliche Ergänzungen pro Mail |
| Call-Basiserkennung | Standardmuster TCK, isolierter Worker | Eigenständige 5+-Ziffern, CALL bevorzugt, Rückfall bei ungültigem/trefferlosem Muster |
| Ziel und Tags | Echte Tag-Ordner, Status, Standard-Tags | Lokale Status-/Tag-Vorgaben, Erhalt gültiger Auswahl beim Neuladen |
| Frist/Schätzung | Nur Datum | dueTime und estimateMinutes in Domäne, SQLite, API und Hauptanwendung |
| Anhänge | EML, Nachbau, Dateien, Links, Grenzen, Sammlung, Ergebnisabgleich | Wiederverwendung im transaktionalen Mail-Anwendungsfall |
| Darstellung | Gemeinsame Tokens, Systemmodus | Automatisch (Outlook vor System), Hell, Dunkel |

## Geänderte Produktentscheidung

A-10.11 ersetzt die bisherigen Verbote aus A-10.9, A-19.19, E-100 und E-108
**nur hinsichtlich der Mail-Zuordnung**. Keine allgemeine Aufgabenbearbeitung mit
dem Add-in-Token. Der Ergänzungsrumpf ist strikt und lässt ausschließlich requestId,
callNumber, mail, note und attachments zu. Call-Nummern werden in der gemeinsamen
Domäne geprüft und mit dem strukturierten Aufgabenfeld verglichen.

Eine eindeutige Zuordnung ergänzt die Aufgabe. Eine bewusste Neuanlage verwendet
mode=new; mode=auto entscheidet innerhalb der Schreibtransaktion und weist mehrere
Treffer ab. Leere/ungültige Call-Nummern führen nie zum Zusammenführen namenloser Vorgänge.
Eigene Aufgabenvermerke bleiben erhalten; neue eigene Ergänzungen stehen separat am
Mail-Eintrag. Weder Timer noch Zeitbuchung, Exportstatus, Status oder Erledigt-Kennzeichen
werden beim Ergänzen verändert.

## Speicherung, Identität und Wiederholungen

Migration **0025_outlook_mail** ergänzt todo_mail, addin_mail_receipt, due_time und
estimate_minutes. Datumsfristen bleiben YYYY-MM-DD; Uhrzeiten sind optionale Ortszeiten
HH:mm. Ohne Uhrzeit findet keine Zeitzonenumrechnung statt. Die Schätzung ist eine
positive ganze Minutenanzahl, höchstens 525600. Archivfassung **7** enthält diese Daten;
Fassungen 1–6 erhalten beim Einlesen leere Mailtabellen und null für die Planungsfelder.

Die Identität verwendet vorrangig Internet-Message-ID, danach Outlook-itemId mit
Postfachkennung. Fehlen beide, wird ein SHA-256-Fingerabdruck aus Betreff, Absenderadresse,
verfügbarem Originalzeitpunkt und vollständigem Nur-Text-Inhalt gebildet. Identische
Nachrichten ohne IDs und mit identischen verfügbaren Angaben sind damit nicht unterscheidbar.
Der Fallback ist kein beweisbarer weltweiter Nachrichtenschlüssel. Verschieben einer Mail
kann eine itemId verändern. Typ plus Tag wird ausdrücklich nicht als Identität verwendet.

Mail und Anhänge werden unter derselben serialisierten SQLite-Transaktion gespeichert.
Ein eindeutiger Schlüssel pro Aufgabe/Mail und ein persistenter Anfragebeleg verhindern
Doppelschreiben. Automatische Anfragen verwenden zusätzlich die Mailidentität als Schlüssel.
Bewusste Neuanlagen erhalten eine eigene Anfragekennung. Ein identischer Wiederholungsaufruf
meldet bereits vorhanden; eine widersprüchliche Wiederverwendung einer expliziten Kennung
wird abgewiesen. Die Bestätigung erfolgt erst nach Abschluss der Transaktion.

Dateien erhalten weiterhin serverseitige, eindeutige Namen. Ein Rollback entfernt Dateien
dieses Aufrufs; nach Prozessabbruch greift der vorhandene Dateiwaisen-Abgleich. Einzelne
Dateifehler werden als abgewiesene Anhänge im bestätigten Ergebnis zurückgegeben. Ein
Timeout einer bereits gesendeten Anfrage beweist keinen Rollback; die Wiederholung muss
mit derselben Kennung erfolgen.

## Grenzen und Nachweise

Outlook-Rückverweise sind validierte HTTPS-Adressen zu Outlook. Ein Rückverweis kann nach
Verschieben, in geteilten Postfächern oder bei abweichenden Kontotypen unbrauchbar sein.
Ein fehlender Rückverweis verhindert die Speicherung nicht. Cloud-Anhänge bleiben Links;
kein serverseitiger Download, kein Graph-Zwang, keine Cloud-Anmeldung.

Die bestehenden lokalen Grenzen (Token im Header, Loopback, enge Herkunftsprüfung, CSP,
Zertifikate und Desktop-Sidecar) bleiben bestehen. Einstellungen liegen im lokalen
Browserprofil derselben Add-in-Herkunft, niemals in Office-Roaming-Einstellungen.

Automatisierte Nachweise liegen in `apps/local-api/test/routes/addin/mail-assignment.test.ts`,
`apps/outlook-addin/test/callnumber/reference.test.ts` sowie den bestehenden API-, Anhangs-,
OpenAPI- und Add-in-Nachweisen. Office-Mocks sind keine echten Outlook-Kompatibilitätstests.
Die endgültigen Ausführungsergebnisse werden im Abschlussbericht festgehalten.

Referenzstand: SP-OutlookBridge `3a4981bc47da55a4b99904d1e119cc9dbd62811b`.
Auch die Leertextprüfung eigener Muster läuft im Worker. Die synchrone Prüfung
kompiliert nur die Syntax und untersucht die Musterzeichen, ohne sie auszuführen.

## Abnahmezuordnung

| Abnahmefälle des Auftrags | Automatisierter Nachweis |
| --- | --- |
| 1–8, 12: Neuanlage, Ergänzen, bewusste Neuanlage, Dubletten, gleiche Tage, Mehrdeutigkeit, unveränderte Aufgaben/Notizen/Zeitdaten | `apps/local-api/test/routes/addin/mail-assignment.test.ts`: echte SQLite-Transaktionen und echtes Dateiverzeichnis, einschließlich Parallelaufrufen und Rollback |
| 9–10: Standardstatus, verschachtelte Tags, neue Tags, Neuladen | `quick-command.test.ts`, gebautes Formular in `outlook-addin-build.spec.ts`, Mail-Anwendungsfall sowie bestehende Tag-/Add-in-Nachweise |
| 11: Anhangsfehler, Limits, Fähigkeiten, Abbruch, Nachrichtenwechsel | bestehende Anhangs-/Office-Nachweise; zusätzliche Link-Zeilenfehler und Schnellbefehlsfälle |
| 13: Planung speichern, anzeigen und bearbeiten | `outlook-mail-detail.spec.ts`: echte lokale API und Hauptanwendung, Frist am Zeitumstellungstag, Bearbeiten und Neuladen; Archiv-Roundtrip im Mail-Anwendungsfall |
| 14: Schnellbefehl wartet und beendet genau einmal | `apps/outlook-addin/test/office/quick-command.test.ts`: kontrolliert verzögerte Sammlung und Serverantwort, Fehler und Nachrichtenwechsel |
| 15: Sicherheitsregeln | bestehende Zugriff-, Herkunft-, CSP-, Add-in-, OpenAPI- und Desktop-Prüfungen; strikter neuer Ergänzungsrumpf |

Der Browsernachweis des gebauten Add-ins prüft auch das tatsächliche Laden des
Worker-Chunks, die Ablehnung leer treffender Muster und das Speichern eines leeren
Musters für die Basiserkennung. Die Microsoft-Manifestvalidierung besteht mit
Manifestversion 1.0.0.0. Diese statische Validierung belegt keine tatsächliche
Ausführung in einem Outlook-Client.

## Ausgeführte Prüfungen (2026-09-15)

- `pnpm test:coverage`: **1.960 bestanden**, 2 übersprungen; Abdeckung der gemessenen Pakete: 92,22 % Statements, 86,12 % Branches, 95,92 % Functions, 94,61 % Lines.
- `pnpm test:rust`: **69 bestanden**, 1 ignoriert.
- `pnpm proof:addin`: **307 bestanden**; `pnpm proof:openapi`: **115 bestanden**; `pnpm proof:route-policy`: **50 bestanden**.
- `pnpm verify:bundle`: **22 bestanden**. Der Nachweis baut und kopiert das echte Add-in mit dem Auslieferungsadapter neben die gebaute Sidecar-Binärdatei; er prüft beide HTML-Einstiege und das Schnellbefehlsmodul über HTTPS mit dem erzeugten Zertifikat. Testdaten und ein zusätzlicher Herkunftsmarker liegen nur im temporären Installationsbild.
- `pnpm exec playwright test -c tests/e2e/playwright.outlook-build.config.ts`: **3 bestanden**, gebautes Add-in/echter Worker, Office und API im Formularfall simuliert.
- `pnpm exec playwright test -c tests/e2e/playwright.config.ts outlook-mail-detail.spec.ts`: **1 bestanden**, echte lokale API, SQLite und Hauptanwendung.
- `pnpm dlx office-addin-manifest validate apps/outlook-addin/manifest.xml`: **gültig**.
- `pnpm build`: erfolgreich; `pnpm audit`: keine bekannten Schwachstellen gemeldet.

Es wurde **kein echter Outlook-Client** getestet. Der Paketnachweis startet die
gebaute Sidecar-Binärdatei im Installationslayout; er ersetzt keinen manuellen
Durchlauf eines Windows-/macOS-Installers oder einen Outlook-Kompatibilitätstest.

**Abschließendes Gesamttor:** `pnpm check` wurde nach allen Korrekturen vollständig
mit Exit-Code **0** ausgeführt. Es umfasst Typprüfungen, Paketgrenzen, Kontrast,
alle Nachweisskripte, den gebauten Sidecar, Tests mit Abdeckung, Rust-Tests,
Builds und Audit. Die oben genannten Zahlen wurden dabei erneut bestätigt.

### Entwicklungsstart: veraltete Ansicht trotz Neustart (15.09.2026)

Tauri kopiert beim Start die Ressourcen aus `src-tauri/taskpane` nach
`target/debug/taskpane`. Wurde vorher nur das Ziel aktualisiert, überschrieb
Tauri es wieder mit dem alten Ressourcenstand. `build-taskpane.mjs --dev` baut
nun einmal und aktualisiert beide Verzeichnisse. Der Regressionstest
`apps/desktop/test/taskpane-staging.test.ts` stellt den anschließenden
Tauri-Kopiervorgang mit einer vorher veralteten Ressource nach.

Verifikation: Das laufende HTTPS-Endpunkt-Bündel enthält nach der Bereitstellung
„Stattdessen neue Aufgabe erstellen“ und „E-Mail an Aufgabe anhängen“, aber
nicht mehr „Auf dieses Todo buchen“. Ein Neuladen des Aufgabenbereichs reicht
für die bereits laufende Anwendung; künftige Entwicklungsstarts erhalten den Stand.

### E-Mail-Anhänge und Einstieg (A-10.17, 15.09.2026)

Das Manifest 1.0.0.1 enthält einen ShowTaskpane-Befehl „E-Mail anhängen“.
Der bisherige Schnellbefehl wird nicht mehr angeboten. Nach Änderung muss das
Manifest in Outlook neu eingebunden werden; ein bloßes Neuladen der HTML-Seite
ändert die im Outlook-Menüband installierten Befehle nicht.

Mail-Einträge speichern optional `attachmentIds` im vorhandenen JSON-Metadatensatz.
Diese Kennungen kommen ausschließlich aus erfolgreich gespeicherten Anhängen;
Mail, Zuordnung und Wiederholungsbeleg werden in derselben Transaktion geschrieben.
Das Datenarchiv erhält die Zuordnung und prüft das optionale Feld beim Import.
Eine SQL-Schemaänderung ist dafür nicht erforderlich.

Die Anhangsliste sortiert aufsteigend nach Mail-Zeitpunkt; Dateien einer Nachricht
bleiben zusammen. EML-Standardnamen werden in der Anzeige beispielsweise durch
„Antwort – 13.07.2026, 14:09:15“ ersetzt. Persönliche Titel behalten Vorrang.
Die eigentliche Datei und ihr ursprünglicher Anzeigename bleiben unverändert.
Ohne historische Zuordnung gilt das Anlegedatum, ausdrücklich als „hinzugefügt“
bezeichnet; es wird kein Mail-Empfangsdatum aus alten Dateinamen geraten.

Prüfung: 50 Einheiten-/Integrationsfälle (einschließlich Datensicherung),
7 Browserfälle, Add-in-Nachweis mit 307 Prüfungen und betroffene Typprüfungen bestanden.
Die Menübandwirkung ist am Manifest geprüft, nicht in einer echten Outlook-Sitzung.
