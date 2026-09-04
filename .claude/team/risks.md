# Risiken und Blocker

Offene Punkte, die Arbeit verzögern oder Ergebnisse falsch machen können. Wird ein Risiko
geschlossen, bleibt der Eintrag stehen und bekommt das Datum und die Auflösung.

Stand: 2026-08-31, aktualisiert nach den Antworten des Auftraggebers zu Welle 1.

---

## R-01 — Der klickbare Prototyp liegt nicht vor — GESCHLOSSEN 2026-08-31

**Schwere:** war hoch. **Auflösung:** Der Auftraggeber hat entschieden, dass kein Framer-Prototyp
nachgereicht wird; das Designsystem wird im Projekt selbst erstellt (E-013).

Damit entfällt die unbezifferbare Nacharbeit durch einen späteren Abgleich. Das Gewicht
verschiebt sich auf T-006: Was dort festgelegt wird, gilt für alle 14 Screens, und die Abnahme
durch den Auftraggeber wird zum Tor vor Welle 2. Die zwei Referenzbilder für das Outlook-Add-in
fehlen weiterhin; das Add-in gestaltet sich aus dem Designsystem heraus.

---

## R-02 — Der lokale Dienst ist für jeden Prozess auf dem Rechner erreichbar

**Schwere:** hoch. **Betrifft:** security-checker, domain-dev, integration-dev.

Ein Dienst auf `127.0.0.1` nimmt Anfragen von jedem lokalen Prozess an — auch von einer
beliebigen Webseite im Browser des Benutzers, wenn die Herkunftsprüfung fehlt oder CORS zu weit
gesetzt ist. Der Dienst hält Kundendaten.

**Umgang:** Geklärt durch E-009 — die Anwendung erzeugt ein Token, das der Benutzer im Add-in
einträgt. Damit ist das Risiko benannt, aber nicht erledigt: T-003 prüft Ablage des Tokens,
zeitkonstanten Vergleich, sofortige Ungültigkeit des alten Tokens beim Neuerzeugen und die
Herkunftsprüfung der Anfrage. Ein Token allein darf aus einem fremden Browsertab nicht reichen.

---

## R-03 — Rundungsregel an der Stufengrenze ist nicht festgelegt

**Schwere:** mittel. **Betrifft:** domain-dev, unit-tester, Abrechnung.

Die Spezifikation nennt die Stufen, nicht die Regel für Werte dazwischen. 7 Minuten 30 Sekunden
können 0,00 oder 0,25 ergeben. Über viele Buchungen summiert sich das zu echtem Geld.

**Umgang:** Weitgehend geklärt durch E-008 — aufwärts auf die nächste Viertelstunde, Minimum
0,25. Offen bleibt ein Randfall: Die beiden vom Auftraggeber genannten Werte sind auch mit
„kaufmännisch runden, nie unter 0,25" vereinbar, wo 16 Minuten 0,25 statt 0,50 ergäben. T-001
legt beide Varianten mit Beispieltabelle vor, der Auftraggeber bestätigt vor Welle 3.

---

## R-04 — Rust-Toolchain ohne Werkzeugunterstützung

**Schwere:** niedrig, herabgestuft am 2026-09-01. Die Umgebung ist vollständig: rustc und cargo
1.89.0 aus der Distribution, dazu webkit2gtk-4.1 2.52.5, libsoup-3.0 3.6.6, javascriptcoregtk-4.1
und gtk+-3.0 3.24.52. Rustup wird nicht gebraucht. Es bleibt, dass im Inventar kein Skill die
Hüllenschicht abdeckt und die Sidecar-Bündelung noch nicht erprobt ist. **Betrifft:** frontend-dev, Bauablauf.

Tauri braucht Rust. Im Inventar gibt es keinen Skill für die Hüllenschicht, und die
Sidecar-Bündelung einer Node-Anwendung ist erfahrungsgemäß der fummeligste Teil eines
Tauri-Aufbaus.

Der Auftraggeber hat bestätigt, dass die Toolchain auf dem Rechner nicht installiert ist (E-014).

**Umgang:** Rust-Anteil bewusst dünn halten. Die Installation gehört zu T-008 und läuft über den
Auftraggeber, nicht über einen Agenten. Fällt Toolchain oder Sidecar-Bündelung durch, ist der
Rückweg ein lokaler Dienst plus Browser — dann fällt E-010, und der Windows-Benutzername muss
doch aus einer Einstellung kommen, was ihn wieder zur Vertrauensgrenze macht. Welle 1 ist nicht
betroffen.

---

## R-05 — Base64 wirkt wie Schutz, ist aber keiner

**Schwere:** mittel. **Betrifft:** security-checker, documenter.

Die Exportdatei enthält Kundennotizen im Klartextäquivalent. Wer die Kodierung für Verschlüsselung
hält, legt die Datei zu sorglos ab.

**Umgang:** Im Bedrohungsmodell festhalten, in der Benutzerdokumentation deutlich sagen.

---

## R-06 — Exportvorlagen können die Notiz-Trennung aushebeln

**Schwere:** hoch. **Betrifft:** integration-dev, unit-tester, security-checker.

Die Todo-Notiz ist intern (A-7.2), die Buchungsnotiz geht in die Abrechnung (A-7.4). Sobald der
Benutzer Feldquellen frei wählen kann, ist die Grenze nur noch so stark wie die Prüfung im
Vorlagen-Motor.

**Umgang:** Die Todo-Notiz ist als Quelle nicht wählbar — nicht per Voreinstellung, sondern
strukturell. Der Test dazu prüft nicht nur die Standardvorlage, sondern beliebige Vorlagen.

---

## R-07 — Berechtigungsschema kann nicht geschrieben werden — GESCHLOSSEN 2026-08-31

**Auflösung:** Der Auftraggeber hat das Schema selbst in `.claude/settings.json` eingefügt.
Nachgeprüft: `permissions` mit 47 Einträgen in `allow`, 17 in `ask`, 27 in `deny`, dazu der
`env`-Block, der GateGuard abschaltet. Damit ist auch T-B03 erledigt.

---

## R-08 — Zwei Notizfelder heißen im Alltag beide „Notiz"

**Schwere:** niedrig. **Betrifft:** frontend-dev, documenter, spec-ux-reviewer.

Die Verwechslung von Todo-Notiz und Buchungsnotiz ist der wahrscheinlichste Bedienfehler in
diesem Produkt, und er wird erst in der Abrechnung sichtbar.

**Umgang:** In der Oberfläche unterschiedlich benennen und beschriften — sichtbar machen, welche
Notiz in die Abrechnung geht. Das Glossar aus T-004 legt die Begriffe fest.

---

## R-09 — Das Add-in-Token wird zum verwundbarsten Punkt

**Schwere:** hoch. **Betrifft:** security-checker, domain-dev, integration-dev. Neu am 2026-08-31.

Mit E-009 hängt der gesamte Zugriffsschutz des lokalen Dienstes an einer einzigen Zeichenkette,
die der Benutzer von Hand in ein Outlook-Add-in kopiert. Der Weg dorthin führt erfahrungsgemäß
über Zwischenablage, Notizzettel und gelegentlich eine E-Mail an sich selbst.

**Umgang:** Token nur im Anwendungsdatenverzeichnis, nie im Repository, nie in Protokollen, nie
in Fehlermeldungen. Zeitkonstanter Vergleich. Neuerzeugen macht das alte sofort ungültig. Die
Oberfläche zeigt das Token nur auf ausdrückliche Anforderung. T-003 bewertet, ob die
Herkunftsprüfung allein einen Tokendiebstahl auffängt.

---

## R-10 — Zurücksetzen des Exportstatus ermöglicht Doppelabrechnung

**Schwere:** mittel. **Betrifft:** domain-dev, spec-ux-reviewer, e2e-tester. Neu am 2026-08-31.

E-012 erlaubt, den Exportstatus jeder einzelnen Buchung zurückzusetzen. Damit kann dieselbe
Arbeitszeit ein zweites Mal in die Abrechnung gelangen — versehentlich und ohne dass es jemandem
auffällt.

**Umgang:** Bestätigungsdialog, der ausspricht, was passiert. Der Vorgang wird protokolliert,
damit eine Doppelabrechnung nachvollziehbar bleibt. Die Oberfläche kennzeichnet eine
zurückgesetzte Buchung sichtbar als „schon einmal exportiert".

---

## R-11 — Der Exportordner ist Benutzereingabe

**Schwere:** mittel. **Betrifft:** integration-dev, security-checker. Neu am 2026-08-31.

E-011 macht den Zielordner konfigurierbar. Ein frei eingegebener Pfad kann auf Systemverzeichnisse
zeigen, Pfadtraversierung enthalten oder auf ein Netzlaufwerk verweisen, das gerade nicht da ist.
Der Ordner enthält lesbare Kundennotizen.

**Umgang:** Pfad prüfen, ausschließlich in den gewählten Ordner schreiben, verständlicher Fehler
statt Absturz bei fehlendem oder schreibgeschütztem Ziel. T-003 bewertet die Voreinstellung und
die Dateirechte der erzeugten Datei.

---

## R-12 — Das Add-in-Token würde über Exchange synchronisiert

**Schwere:** hoch. **Betrifft:** integration-dev, security-checker. Neu am 2026-08-31 aus T-003.

`Office.context.roamingSettings` ist der naheliegende Ablageort für eine Add-in-Einstellung, wird
aber im Postfach gespeichert und über Exchange oder M365 synchronisiert. Damit verließe genau das
Geheimnis den Rechner, das sämtliche lokalen Kundendaten öffnet — gegen E-001.

**Umgang:** E-019 legt `localStorage` der Add-in-Herkunft fest. Der Fehler ist so naheliegend,
dass er ausdrücklich in der Aufgabenbeschreibung von T-007 steht, nicht nur hier.

---

## R-13 — Roaming-Profile und OneDrive beschädigen die Datenbank und tragen Kundendaten fort

**Schwere:** hoch. **Betrifft:** domain-dev, integration-dev. Neu am 2026-08-31 aus T-003.

Liegt die SQLite-Datei unter `%APPDATA%`, kopiert ein Roaming-Profil sie auf einen Dateiserver.
Zwei Schäden gleichzeitig: Die Kundendaten verlassen den Rechner, und die unabhängig
synchronisierten WAL-Dateien beschädigen die Datenbank. Für den Exportordner gilt dasselbe
gegenüber OneDrive-umgeleiteten Ordnern wie Desktop und Dokumente.

**Umgang:** E-018 legt `%LOCALAPPDATA%` fest und hält die Vorgabe des Exportordners aus
umgeleiteten Ordnern heraus.

---

## R-14 — Kein Git-Repository, keine `.gitignore`

**Schwere:** hoch bis T-008. **Betrifft:** Orchestrator. Neu am 2026-08-31 aus T-003.

Wird in T-008 installiert und gestartet, bevor `.gitignore` und `git init` stehen, landen
Add-in-Token, SQLite-Datei und Exportdateien dauerhaft in der Historie. Aus einer Git-Historie
bekommt man ein Geheimnis nicht sauber wieder heraus.

**Umgang:** E-021 legt die Reihenfolge fest: `.gitignore`, dann `git init`, dann installieren.

---

## R-15 — Ein zu weiter regulärer Ausdruck bucht auf den falschen Kundenvorgang

**Schwere:** hoch. **Betrifft:** integration-dev, e2e-tester. Neu am 2026-08-31 aus T-003.

Der Ausdruck zur Erkennung der Call-Nummer ist frei konfigurierbar (A-10.8). Trifft er auf jede
E-Mail zu, greift zusammen mit der Duplikaterkennung aus A-10.9 die Empfehlung, auf ein
vorhandenes Todo zu buchen — und die Zeit landet auf dem falschen Kundenvorgang. Das ist ein
Abrechnungsfehler mit Außenwirkung, und er sieht im Alltag aus wie eine hilfreiche
Voreinstellung.

**Umgang:** Eine leere oder unplausible Call-Nummer ist nie ein Übereinstimmungskriterium. Das
Add-in zeigt vor dem Buchen, auf welches Todo es buchen will, mit Titel und Call-Nummer.

---

## R-16 — Deutsche Typnamen neben englischen Tabellennamen

**Schwere:** mittel, aber nur solange T-013 offen ist. **Betrifft:** domain-dev, code-reviewer.
Neu am 2026-08-31 aus T-006.

Dieselbe Sache heißt in der Datenbank `tag_folder` und im TypeScript-Typ `TagOrdner`. Solange das
so bleibt, muss jeder, der die Schichten verbindet, im Kopf übersetzen — und tut es irgendwann
falsch.

**Umgang:** E-015, Aufgabe T-013. Jetzt billig, weil nur Typdefinitionen existieren. Nach T-009
teuer.

---

## R-17 — Die Exportvorschau ist die einzige Stelle, an der ein Bruch der Notiz-Trennung sichtbar würde

**Schwere:** mittel. **Betrifft:** integration-dev, frontend-dev, unit-tester. Neu am 2026-08-31
aus T-005 (B-14).

Vorschau in S-07 und S-14 und der tatsächliche Export müssen denselben Renderer benutzen. Tun sie
es nicht, zeigt die Vorschau etwas anderes als die Datei, und genau die Prüfung, für die sie da
ist, geht ins Leere.

**Umgang:** Ein Renderer, zwei Aufrufer. Auflage für T-007. Der Test aus T-010 prüft Vorschau und
Datei gegen dieselbe Erwartung.

---

## R-18 — Der Test auf Notiz-Trennung besteht sonst versehentlich

**Schwere:** hoch. **Betrifft:** unit-tester. Neu am 2026-08-31 aus T-003.

Ein Test, der den Text der Todo-Notiz nur im Klartext im Exportergebnis sucht, besteht bei jeder
Vorlage, die das Feld über die Transformation `base64` ausgibt — also genau in dem Fall, den die
Standardvorlage benutzt. Der Test wäre grün und die Grenze trotzdem gebrochen.

**Umgang:** Der Eigenschaftstest sucht den Text im Ergebnis **im Klartext und base64-kodiert**,
über beliebige Vorlagen. Auflage für T-010.

---

## R-19 — Takt bekommt einen Ausgang ins Netz

**Schwere:** hoch. **Betrifft:** security-checker, domain-dev, frontend-dev. Neu am 2026-09-04.

Bis heute kannte Takt keine Adresse außerhalb von `127.0.0.1`; das war die stärkste einzelne
Zusage des Entwurfs. Mit A-18.2 stellt der lokale Dienst eine Anfrage ins offene Netz. Vier
Dinge ändern sich damit auf einmal:

1. **Eine fremde Antwort betritt den Prozess.** Sie ist unbegrenzt groß, beliebig geformt und
   trägt Text, der am Ende in der Oberfläche steht — dieselbe Klasse wie E-063, nur aus einer
   neuen Richtung.
2. **Eine Adresse aus dieser Antwort kann zum Öffnen-Befehl der Hülle wandern.** Von dort öffnet
   sie den Browser des Benutzers. Das ist der gefährlichste Weg in diesem Vorhaben.
3. **Jede Anfrage ist ein Lebenszeichen.** Wer sie sieht, weiß, dass dieser Rechner Takt in
   dieser Fassung fährt. A-18.12 verbietet, mehr mitzuschicken als nötig.
4. **Der Ausgang steht offen, auch wenn niemand ihn braucht.** Er gehört bei jeder künftigen
   Freigabe geprüft, nicht nur bei dieser Aufgabe.

**Umgang:** Festgelegt in E-064: Adresse fest im Erzeugnis, keine Weiterleitung auf einen fremden
Wirt, Zeitüberschreitung, Obergrenze der gelesenen Antwort, aus der Antwort verlässt nur eine
geprüfte Fassungsbezeichnung den Dienst, und der Öffnen-Befehl der Hülle nimmt keine Adresse
entgegen. Das Bedrohungsmodell bewertet die Grenze, bevor gebaut wird.

---

## R-20 — Eine Aktualisierungsmeldung, die man nicht loswird, wird weggeklickt

**Schwere:** niedrig. **Betrifft:** frontend-dev, spec-ux-reviewer. Neu am 2026-09-04.

A-18.10 sagt, dass eine übersprungene Fassung nicht wiederkommt. Wird das Überspringen nur für
die Sitzung gemerkt oder nur an einer von mehreren Flächen, meldet sich der Hinweis beim
nächsten Start wieder — und der Benutzer lernt, ihn ungelesen zu schließen. Danach übersieht er
auch die Meldung, die zählt.

**Umgang:** Der übersprungene Wert steht im Bestand, nicht im Arbeitsspeicher und nicht im
Browserspeicher. Der Prüffall dazu misst einen Neustart und nicht nur das Schließen des Dialogs.

