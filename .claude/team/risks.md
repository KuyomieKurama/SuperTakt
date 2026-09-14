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
   Seit E-106 ist das Lebenszeichen **eines je Programmstart**; wer die Verbindung sieht, bekommt
   je Rechner und Tag eine ungefähre **Einschaltzeit** dazu. Der Inhalt hält A-18.12, der
   **Zeitpunkt** ist selbst eine Angabe über die Nutzung.
4. **Der Ausgang steht offen, auch wenn niemand ihn braucht.** Er gehört bei jeder künftigen
   Freigabe geprüft, nicht nur bei dieser Aufgabe.
5. **Die Frequenz schadet nicht uns, sondern den Nachbarn.** Ein Prozeß, der den Sidecar in einer
   Schleife startet, erreicht rund 344 Anfragen je Stunde und kann damit das GitHub-Kontingent
   **einer Quelladresse** erschöpfen — die Aktualisierungsmeldung fällt dann für alle
   Installationen hinter dieser Adresse still aus. Schaden an der **Verfügbarkeit eines
   Sicherheitskanals**, kein Datenabfluß. Kein Verstärker: Wer den Sidecar in einer Schleife
   starten kann, ruft dieselbe Adresse unmittelbar auf — SuperTakt ist der langsamste Weg dorthin.

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

---

## R-21 — Ein Dateianhang ist ein Startknopf

**Schwere:** hoch. **Betrifft:** security-checker, frontend-dev, domain-dev. Neu am 2026-09-05.

„Mit der Standardanwendung öffnen" ist bei einer `.txt` ein Editor und bei einer `.bat`, `.lnk`,
`.exe` oder `.scr` eine Ausführung. Der Pfad kommt aus dem Bestand; jeder Weg, auf dem etwas in
den Bestand gelangt, ist damit ein Weg zu einem Programmstart auf dem Rechner des Benutzers.

**Umgang:** E-072 — keine Anhänge über das Add-in, Prüfung im Öffnen-Befehl bei jedem Aufruf und
nach Art getrennt, kein UNC-Pfad, und eine Rückfrage, die den vollen Pfad nennt, bevor eine Datei
startet. Das Bedrohungsmodell bewertet die Grenze vor dem Bau.

---

**Bewertet am 2026-09-11 (T-297), und die Bewertung verschiebt das Risiko, statt es zu bestätigen.**
Bis heute mußte ein Pfad **eingetippt** werden — das war die stillschweigende Bremse dieses
Risikos, und sie stand in keiner Zeile. Ab A-19.23 genügt eine E-Mail. Der Weg von fremder Hand
bis zum Startknopf ist damit nicht neu, aber er ist zum ersten Mal **bequem**.

Gemessen wurde die Vorlage, nicht gelesen: `sanitizeFileName` und `uniqueTargetPath` der
Outlook-Bridge zeichengleich nachgebaut, 25 Angriffsnamen, echte Dateien, Node 22 auf Windows 11.
**25 hinein, 25 auf der Platte, null Ablehnungen.** Pfadausbruch, absolute Pfade und UNC fängt
sie in beiden Schreibweisen; Gerätenamen, Doppelendungen und Richtungszeichen nicht. Vier von
fünf Gerätenamen (`NUL`, `COM1`, `CON.txt`, `prn.pdf`) landen als Datei, die Windows
anschließend **nicht sieht** — ein Anhang, der von Anfang an tot ist, während die Oberfläche
„übernommen" meldet. Das ist der dritte Fall der Klasse „geprüfter Name ≠ aufgelöster Name".

Die Gegenmaßnahme ist deshalb nicht ein besserer Filter: Der fremde Name wird **Anzeigename**,
den Namen auf der Platte bestimmt SuperTakt (A-19.23a). Damit ist die Klasse nicht abgewehrt,
sondern **unmöglich**.


**Nachgetragen am 2026-09-12 (T-313).** Die Bytes einer fremden E-Mail liegen jetzt wirklich im
Anwendungsdatenverzeichnis — mit erzeugtem Namen und `0600`/`0700`, beides gemessen. **Neu und
in der anderen Richtung:** Aus ihnen wird beim Aufräumen ein **Löschziel**. Ein Fehler beim
Hereinlassen ist eine Lücke; ein Fehler beim Entfernen ist nicht wiedergutzumachen. Siehe R-29.


## R-22 — Ein Verweis kann alles sein, was wie eine Adresse aussieht

**Schwere:** hoch. **Betrifft:** security-checker, frontend-dev. Neu am 2026-09-05.

`file:///etc/passwd`, `javascript:…`, `\\server\freigabe` — alles drei nimmt ein Eingabefeld
für eine Adresse widerspruchslos entgegen, und alles drei tut beim Öffnen etwas anderes als „eine
Seite im Browser zeigen". Der UNC-Pfad ist der unauffälligste und der schlimmste: Unter Windows
ist er ein Anmeldeversuch gegen einen fremden Rechner.

**Umgang:** E-072 Punkt 2 — ausschließlich `http` und `https`, geprüft im Öffnen-Befehl und nicht
nur im Eingabefeld. Dieselbe Bauart wie bei der Fassungsbezeichnung in T-139, und aus demselben
Grund: Zwischen Eingabe und Öffnen liegt der Bestand.


**Nachtrag zu R-21 vom 2026-09-05 (T-156-1, gemessen).** Die Endung ist nicht das, was sie zu sein
scheint. `/…/rechnung.lnk.` und `/…/rechnung.lnk ` bestehen die Prüfung, weil `Path::extension()`
in Rust `""` bzw. `"lnk "` liefert — **Windows aber schneidet nachgestellte Punkte und Leerzeichen
ab, bevor es die Datei auflöst**. `is_file()` bejaht, `ShellExecuteW` folgt der Verknüpfung. Der
Angriff braucht kein besonderes Zeichen und keine Kodierung, nur ein Zeichen mehr am Ende des
Namens.

Zwei Dinge daran gehören festgehalten, weil sie über diesen einen Fall hinausreichen:

1. **Die Rückfrage lügt mit.** Dieselbe Blindheit steckt in der Beschriftung
   (`attachmentLabel.ts:113`): `…exe.` gilt dort als endungslos, und der Dialog sagt „wird
   geöffnet" statt „wird ausgeführt". Eine Rückfrage, die den vollen Pfad nennt, ist nur so viel
   wert wie ihre Auskunft darüber, **was** beim Bestätigen geschieht.
2. **Der Läufer war Linux.** Auf Linux ist der nachgestellte Punkt Teil des Namens und die Prüfung
   damit scheinbar richtig. Genau dafür stehen A-A-4 und A-A-10 — die Zweige, die nur unter
   Windows etwas anderes tun, sind die, die niemand betritt. Ein grüner Lauf auf dem falschen
   Betriebssystem ist bei dieser Klasse kein Nachweis, sondern eine Aussage über den Läufer.

---

## R-23 — Was im Wurzelspeicher liegt, gilt für alles

**Schwere:** hoch. **Betrifft:** security-checker, frontend-dev. Neu am 2026-09-10 (A-23, E-098).

Die Hülle legt auf Bestätigung ein Zertifikat in `Cert:\CurrentUser\Root`. Der Zweck ist eng —
der Aufgabenbereich auf `https://localhost:17844` soll ohne Warnung laden. Die Wirkung ist es
nicht: Ein Wurzelzertifikat gilt dem Benutzerkonto für **jede** TLS-Verbindung, für jeden Wirt,
in jedem Programm, das diesen Speicher benutzt. Wer den Auftrag verbiegen kann — durch einen
Pfad, einen zweiten DNS-Namen, ein CA-Kennzeichen —, bekommt keine Ausnahme für einen Port,
sondern einen Generalschlüssel für das Konto.

Dazu kommt, daß dieser Weg **ausschließlich** Windows-Code ist und in dieser Umgebung nie
gelaufen ist. Jede Aussage darüber ist heute am Quelltext gelesen.

**Umgang:** E-098 — der Auftrag trägt nur den Fingerabdruck, die Hülle wählt den Pfad, CA und
zusätzliche DNS-Namen sind ausgeschlossen, die Windows-Sicherheitsabfrage bleibt stehen, und ein
Eintrag im Speicher gilt nicht als bestandener HTTPS-Test. Vor der Auslieferung einmal auf einem
Windows-Rechner fahren (T-B05).

---

**Bewertet am 2026-09-11 (T-297), gemessen und unangenehm.** In `apps/desktop/**` gibt es
**keinen Deinstallationspfad**. Das Zertifikat bleibt dauerhaft in `Cert:CurrentUserRoot`
stehen, der private Schlüssel dauerhaft als `taskpane-key.pem` — auch wenn SuperTakt längst
entfernt ist. Damit ist die Frage beantwortet, die der security-checker seit dem 2026-09-10
gestellt hatte, und die Antwort lautet: ja, es bleibt stehen.

Die Kette, die daraus folgt: Schlüssel lesen → `127.0.0.1:17844` binden, solange SuperTakt
nicht läuft → Outlook lädt den Aufgabenbereich **des Angreifers** über eine **gültige**
TLS-Verbindung, ohne Warnung, weil das Zertifikat im Wurzelspeicher des Benutzers liegt und dort
niemand mehr nach ihm sieht.

**Die Beute hat sich im Lauf desselben Tages zweimal geändert.** Vor E-108: das Takt-Token. Nach
E-108 in seiner ersten Fassung: das ganze Postfach samt Sendeberechtigung. Nach **E-109**: wieder
das Takt-Token, weil `ReadWriteMailbox` entfallen ist. Die Einstufung dieses Risikos hängt
damit an einer Entscheidung, die anderswo getroffen wurde — das ist der Grund, ihn hier
aufzuschreiben, und nicht bloß eine Buchhaltung.

**Offen bleibt**, ob die Rücknahme auf das Takt-Token die Schwere senkt. Der security-checker ist
gefragt; ich trage seine Einstufung nach und rate sie nicht.


**Nachgemessen am 2026-09-11, und es begrenzt ehrlich, ohne zu entlasten.** Das Zertifikat ist
**kein CA-Zertifikat** (`basicConstraints` kritisch und leer, `certificate.ts:159`) und trägt
als alternativen Namen ausschließlich `localhost` und die Loopback-Adresse (`:170`). Die
Wirkung reicht damit **nicht** über `localhost` hinaus — der Absatz oben, der von einem
„Generalschlüssel für das Konto" spricht, beschreibt die Bauart des Speichers, nicht dieses
Zertifikat.

**Die Einstufung bleibt trotzdem „hoch", und der Grund ist nicht die Beute, sondern die Dauer.**
Der Aufgabenbereich ist genau das, was ein Angreifer hier will; ein Vertrauensanker, den
**niemand je entfernt**, mit dem privaten Schlüssel daneben, läßt ihn sich **dauerhaft** als
dieser Aufgabenbereich ausgeben — auch nach der Deinstallation, wenn niemand mehr hinsieht.

**Was sich ändert, ist der Termin, nicht die Schwere:** von „vor dem Bau" auf **vor der
Auslieferung**. Damit hängt T-B05 mit daran.


**Zweite Messung am 2026-09-12, Ergebnis identisch:** weiterhin **kein Deinstallationspfad**,
A-A-92 ist nicht gebaut. Zweimal null gemessen, an zwei Tagen. Termin bleibt **vor der
Auslieferung**; T-B05 hängt mit daran.


## R-24 — Ein Fremdbackup ist eine fremde Datei, und aus ihr entstehen Dateipfade

**Schwere:** hoch. **Betrifft:** security-checker, domain-dev, integration-dev. Neu am
2026-09-10 (A-20.7 bis A-20.10, E-097 Punkt 4).

R-21 sagt: Ein Dateianhang ist ein Startknopf, und jeder Weg in den Bestand ist ein Weg zu einem
Programmstart. Seit Abschnitt 20 gibt es einen neuen Weg in den Bestand, und er ist der breiteste
bisher: eine JSON- oder CSV-Datei, die der Benutzer von außen mitbringt. Aus ihren
`FILE`-Einträgen entstehen **Dateipfade als Anhänge** — genau die Sorte Zeichenkette, die R-21
beschreibt, nur diesmal nicht von Hand eingetippt, sondern hundertfach auf einmal und ungelesen.

Die Datei kommt aus einem Programm, dem der Benutzer vertraut. Das macht sie nicht
vertrauenswürdig: Sie ist eine Datei auf der Platte, und wer sie schreiben kann, schreibt in den
Bestand.

**Umgang:** Die Prüfungen aus E-072 gelten für importierte Anhänge unverändert und an derselben
Stelle — im Öffnen-Befehl der Hülle, bei jedem Aufruf, nach Art getrennt. Eine Prüfung beim
Import trägt zusätzlich, aber nicht statt dessen: zwischen Import und Öffnen liegt der Bestand.
Ausdrücklich zu messen ist, daß ein importierter Pfad denselben Weg nimmt wie ein eingetippter.

---

**Bewertet am 2026-09-11 (T-297).** Die Beschreibung dieses Risikos ist seit E-108 **zu eng**:
Sie spricht von einem Fremdbackup, aus dem **Zeiger** entstehen — Verweise und Dateipfade. Ab
A-19.23 entstehen aus fremder Hand die **Bytes selbst**, und sie entstehen nicht mehr bei einem
seltenen Umzug, sondern bei jeder E-Mail, aus der ein Todo wird.

Der Unterschied ist nicht graduell. Ein Zeiger ins Leere ist ein Anhang, der sich nicht öffnen
läßt (A-19.15). Eine Datei, die wirklich im Datenverzeichnis liegt, öffnet sich.


**Nachgetragen am 2026-09-12 (T-313): eine zweite Hälfte.** Bisher handelte dieser Eintrag vom
**Hereinkommen** — eine fremde Datei wird zur Quelle eines Anhangs. Ab heute auch vom
**Verschwinden**: Dieselbe fremde Datei ist Gegenstand eines Laufs, der beim Start löscht.


## R-25 — Eine Zusage, die der Nachbar bricht, ist schlimmer als keine Zusage

**Schwere:** hoch. **Betrifft:** alle Rollen. Neu am 2026-09-10 (T-245-1, F-21, E-099).

Seit Pull Request #16 hängt der Aufgabenbereich die geöffnete Outlook-Nachricht als Verweis an
ein vorhandenes Todo. A-19.19 verbietet das. Der Widerspruch ist benannt und wartet auf eine
Entscheidung — das ist tragbar.

Nicht tragbar ist der zweite Teil: An sechs Stellen behauptet der Bestand weiterhin die
Abwesenheit dieser Fläche, und eine dieser Stellen ist ein **Wächter**, der grün läuft.
`proof:addin` Abschnitt 18 mißt die Wirkung — null Zeilen in `todo_attachment` — aber er ruft
dafür die Anlegetür auf, und die legt tatsächlich keinen Anhang an. Ein Prüfer, der ihn liest,
schließt daraus auf eine Zusage, die nicht mehr gilt.

Das ist die Gefahr, nicht die Route: Ein Bestand, der falsche Zusagen macht, wird geglaubt. Die
Route ist eng gebaut und einzeln bewertbar; der falsche Satz daneben wirkt an jeder Stelle, an
der jemand aufhört zu prüfen, weil er ihn gelesen hat.

**Umgang:** E-099, seit dem 2026-09-10 abgelöst durch **E-100**. F-21 ist beantwortet: die Route
fällt, A-19.19 bleibt. Damit verschwindet nicht der Widerspruch, sondern seine Ursache — die
sechs Textstellen werden wahr, statt geändert zu werden. Der Wächter aus `proof:addin`
Abschnitt 18 wird dabei **schärfer** gestellt und mißt künftig die Abwesenheit jeder Anhangstür
unter `/addin`, nicht mehr nur die Wirkung eines Aufrufs der Anlegetür (T-247).

**Offen bleibt die Lehre, und sie ist der Grund, warum dieses Risiko stehen bleibt:** Für jeden
künftigen Wächter gilt E-099 Punkt 3. Wer eine Abwesenheit zusichert, spannt seine Menge an der
Anforderung auf, nicht an der Route, die er kennt. Das Risiko ist mit T-247 nicht erledigt,
sondern auf seinen nächsten Anlaß vertagt.

## R-26 — zurückgezogen

Am 2026-09-11 angelegt („Das Postfach hinter dem Add-in") und **am selben Tag wieder
gestrichen**, auf Einspruch des security-checkers: Die Grenze ist nicht abgesichert worden,
sie ist **nie entstanden** — mit E-109 fiel `ReadWriteMailbox`, bevor eine Zeile davon gebaut
war. Ein Risiko, das eine Fläche beschreibt, die es nicht gibt, ist derselbe Fehler wie ein
Wächter, der eine Abwesenheit mißt, die nicht mehr gilt.

Die Lehre daraus war nie ein Risiko, sondern eine Arbeitsweise, und sie steht dort, wo sie
hingehört: in **E-109** — vor der Frage steht die Suche. Die Nummer bleibt unbesetzt.

## R-27 — Die Kürzung, die kein Wächter sieht

**Schwere:** offen, beim security-checker. **Betrifft:** security-checker, frontend-dev.
Neu am 2026-09-11 (T-297, A-A-93).

Die Rückfrage vor dem Öffnen einer Datei nennt den vollen Pfad. Das ist seit A-19.18 die eine
Sicherung zwischen einem fremden Anhang und der Standardanwendung — und seit A-19.23 steht in
diesem Pfad ein Name aus fremder Hand.

Der Befund ist, daß diese Sicherung **ohne ein einziges verändertes Zeichen** ausfallen kann: Ein
Deckel in der Darstellung, der den Namen am Ende kürzt, nimmt der Rückfrage die **Endung**. Der
Benutzer bestätigt `Rechnung…` und startet eine `.exe`. Kein Wächter dieses Bestands sieht
das, weil kein Zeichen falsch ist — die Prüfläufe messen Text, und der Text ist in Ordnung.

Daraus folgt A-19.23b: Wo ein Anzeigename aus fremder Hand erscheint, ist die Endung **stets**
sichtbar. Und daraus folgt die allgemeinere Frage, die dieser Eintrag offen hält: **Wie mißt man
eine Zusage über die Darstellung?** Die zweite Bauart desselben Fehlers, das Richtungszeichen,
ist als Zeichen zu fangen. Die Kürzung ist es nicht.

**Beantwortet am 2026-09-11 (T-302), und die Antwort war besser als die Frage.** Dieser Eintrag
hielt offen: *Wie mißt man eine Zusage über die Darstellung?* Die Prüfläufe messen Text, und bei
einer Kürzung ist der Text in Ordnung.

Die Lösung: **Der Deckel hat keinen Typ, aber einen Namen — und die Stelle, an der er wirkt,
hat auch einen.** `proof:clamp` rechnet zwei Mengen und mißt ihren Schnitt:

- **Menge D**, jede CSS-Klasse, deren Regel `text-overflow`, `-webkit-line-clamp`,
  `white-space: nowrap|pre` oder `overflow[-x]: hidden|clip` erklärt — aus den Stilblättern
  gelesen, heute 34;
- **Menge A**, jeder Wert vom Herkunftstyp `UncappedText`, beim Übersetzer erfragt, samt
  Elternelementen und einem Fixpunkt über Bausteingrenzen — heute 20 Stellen in 9 Bausteinen,
  70 Elemente.

Ein Schnitt der beiden ist der Befund. Dazu neun Gegenproben, darunter die, daß der Lauf bei
leerer Deckelmenge **still bliebe** — die Untergrenze, ohne die „nichts gefunden" von „nichts
gesehen" nicht zu unterscheiden ist.

**Ein Detail daraus gehört über diesen Lauf hinaus festgehalten:** Der erste Lauf las
`.screen:has(> .board) > .board` als `.screen` — er nahm den **Anfang** des Wählers statt
seinen **Gegenstand**. Das ist die Art Fehler, die als grün durchgeht. Wer eine Menge über
Wähler bildet, bildet sie über den Gegenstand.

**Was offen bleibt, ausgesprochen:** Der Lauf mißt **Quelltext, keine Pixel**. Der Fall aus
A-A-93 — 200 Zeichen Anzeigename, `.exe` am Ende, gerenderte Breite — gehört dem e2e-tester
und fehlt. Von Hand gemessen bei 420 px, hell und dunkel: Name vollständig, Endung sichtbar.
Eine Handmessung ist ein Stand, kein Nachweis.


**Nachgetragen am 2026-09-12 (T-313): der Träger hat gewechselt, die Einstufung sinkt auf
mittel.** `apps/web` ist gebaut **und** bewacht (`proof:clamp`, dazu der Prüffall gegen das
lebende DOM aus T-311). Der **Aufgabenbereich** ist gebaut und **nicht** bewacht. Die Kürzung im
Bestand ist gemessen richtig — in der Mitte, Marke sichtbar, Endung erhalten. R-27 bleibt offen,
steht aber nur noch auf **einem** Bein, und das gehört hier hin, damit niemand den Rest für
gedeckt hält.


## R-28 — Ein selbst erzeugtes Format ist eine neue Rolle

**Schwere:** niedrig seit dem 2026-09-12 (vorher: offen) — **20 gefahrene Angriffe, 0 Durchbrüche**.
Die Einstufung hängt an **einer** Bauentscheidung: Der Nachbau erzeugt **kein** `multipart`, und
was es nicht gibt, kann niemand treffen. Wird diese Entscheidung je zurückgenommen, kommt die
Einstufung mit ihr zurück. Der Kern bleibt für jede künftige Erweiterung wahr: Dieser Bestand
erzeugt ein Format, das ein anderes Programm interpretiert.

**Schwere vor der Messung:** offen, beim security-checker. **Betrifft:** security-checker, integration-dev.
Neu am 2026-09-11 (T-297-15, T-297-16; Auflagen A-A-96 und A-A-97).

Mit dem Rückfall aus A-19.22a **erzeugt** dieser Bestand zum ersten Mal aus fremdem Text ein
Format, das ein **anderes Programm** interpretiert. Bisher hat er fremden Text gelesen, geprüft
und abgelegt; jetzt schreibt er ihn in eine `.eml`, die Outlook öffnet.

Betreff, Absender und Textkörper kommen aus der Nachricht und damit von außen. Wer sie
zusammenklebt, gibt dem Absender die Feder: Ein Zeilenumbruch im Betreff schreibt eigene
Kopfzeilen, eigene Kopfzeilen schreiben `multipart/mixed`, und in den so entstandenen Teil paßt
ein **Anhang**, der in unserem Datenverzeichnis liegt und den Outlook zum Doppelklick anbietet —
**ohne Größengrenze, ohne Namensprüfung, ohne die Auflagen aus A-19.23**, weil er nie ein Anhang
in deren Sinne war. Dasselbe über die Trennmarke.

Die Abwehr ist deshalb die **Kodierung, nicht die Suche**: jeden Teil base64, die Trennmarke
erzeugen wie einen Anhangsnamen, ein `CR` oder `LF` im Wert einer Kopfzeile ist ein
Ablehnungsgrund. Eine Liste verbotener Zeichenfolgen wäre hier der alte Fehler in neuer Lage.

**Der zweite Teil betrifft die Kennzeichnung.** „Nachgebaut" hängt an der **Datei**, überlebt den
Round-Trip der Datensicherung und steht in der Rückfrage vor dem Öffnen. A-19.31 kennt
„geklappt" und „etwas fehlt" — dies ist ein **dritter** Zustand, und ein Hinweis, der nur beim
Anlegen erscheint, ist drei Wochen später nirgends.

**Der Eintrag steht hier und nicht nur im Bedrohungsmodell**, weil er eine Grenze verschiebt, die
dieses Vorhaben bisher getragen hat: „Takt liest fremden Text, Takt schreibt ihn nicht."

## R-29 — Der Lauf, der löscht

**Schwere:** hoch. **Betrifft:** domain-dev, security-checker. Neu am 2026-09-12 (T-313-1 bis
T-313-3, T-314; Auflagen A-A-98 und A-A-100).

Dieser Bestand hat seit E-111 einen Weg, der **ohne Zutun des Benutzers Kundendaten entfernt** —
und er entscheidet darüber an einer Zeichenkette aus der Datenbank. Das ist keine Abwandlung von
R-21 (dort geht es ums Hereinkommen) und keine von R-24 (dort ist die fremde Datei die Quelle).
Der Schaden ist **Datenverlust ohne Wiederherstellung und ohne Spur** außer einer Zahl im
Protokoll.

**Drei Wege daran vorbei waren gemessen** (T-313), alle geschlossen in T-314. Der teuerste war
nicht ein Loch, sondern ein Denkfehler in einer Auflage des Orchestrators: Der Widerspruchsriegel
sollte über **dieselbe** Bedingung zählen wie die Abfrage. Ein Riegel, der dieselbe Frage stellt,
kann aber nur bestätigen, was die Abfrage ohnehin behauptet. Er fragt seither auf **zwei
Achsen** — einmal am Anfang des Pfades, einmal gar nicht am Pfad.

**Die Umkehr, die den Lauf trägt:** Die Eigentümerfrage ist jetzt die **weiteste**, die einen
Eigentümer finden kann — ohne `origin`, ohne `kind`, namensbasiert —, und der SQL-Filter
darunter ist ausdrücklich **weiter** als nötig, nie enger. Wer weniger fragt, löscht mehr.

**Der offene Punkt, und er ist größer als der behobene.** `sweepOrphanedImages` hat **dieselbe
Bauart** und ist älter. Gemessen am 2026-09-12, nicht vermutet:

- T-313-1 trägt dort **strukturell** — der Riegel hängt weiter an `known.size === 0`; Auslöser
  ist die Groß-/Kleinschreibung statt der Pfadschreibweise.
- T-313-2 trägt mit `kind='image'` statt `origin`: **beide Dateien fort, beide Zeilen stehen.**
- Ein **vierter Weg**, den die Sicherheitsprüfung nicht genannt hat und der **ohne besondere
  Rechte** erreichbar ist: Der Bildlauf fragt mit bloßen **Namen**. Eine Zeile, die dieselbe
  Datei mit ihrem **vollen Pfad** nennt, ist für ihn unsichtbar — und so ein Pfad kommt durch die
  **gewöhnliche** Tür (absolut, vorhanden, `.png`). Gemessen: `entfernt = 1, Dateien = 0,
  Zeilen = 1`.

Das ist kein neues Risiko dieser Welle. Es ist ein **bestehendes**, das erst sichtbar wurde, als
jemand denselben Mechanismus ein zweites Mal baute und dabei gemessen wurde.

**Nachgetragen am 2026-09-12 (T-318), und es ist der Grund, diesen Eintrag NICHT zu schließen.**
Der code-reviewer hat die Aufräumläufe freigegeben — und im selben Lauf **zwei weitere Stellen**
gefunden, die dieselbe Frage enger beantworten, außerhalb jedes Aufräumlaufs:

`apps/local-api/src/features/todos/attachments.ts:341` und
`apps/local-api/src/features/todos/todos.ts:377` entfernen die Datei allein an `kind`
beziehungsweise `origin` **der gelöschten Zeile**. Das ist eine zweite, engere Antwort auf „wem
gehört diese Datei" — und sie entscheidet eine Löschung.

**Der Verlust tritt hier ohne Startlauf ein:** Der in T-314 gemessene vierte Weg — ein Anhang der
Art `file`, der den vollen Pfad einer Bildkopie trägt und durch `checkAttachmentPath`
kommt — führt dazu, daß **Todo A zu löschen Todo B seinen Anhang kostet**. Kein Angriff, kein
Neustart, ein gewöhnlicher Bedienweg.

**Die Auflage des Prüfers, wörtlich übernommen:** *Für die Aufräumläufe ist R-29 zu, für die
Klasse nicht.* Die Klasse heißt: **Wer eine Datei entfernt, muß fragen, ob sie noch jemandem
gehört — und zwar mit der weitesten Frage, nicht mit der nächstliegenden.** Beide Stellen stehen
hinter dem `COMMIT`; dort genügt dieselbe Frage, die der Aufräumlauf stellt.

Dieser Eintrag bleibt offen, bis die Frage an **jeder** löschenden Stelle dieselbe ist.

**Nachgetragen am 2026-09-12 (T-325), und der Eintrag bleibt trotzdem offen.** Die beiden in T-318
gefundenen Stellen sind zu: `removeAttachment` und `removeTodo` stellen seit T-320 dieselbe weite
Frage wie die Aufräumläufe, und sie ist am echten Bestand gemessen — einschließlich der Gegenprobe,
die die Datei wieder fallen läßt, sobald die Antwort blind leer ist. Das Inventar der löschenden
Stellen ist unabhängig nachgezählt: acht, davon drei mit Frage, drei mit einer begründeten
Eigenschaft statt einer Frage, zwei in Adaptern, die ihre eigene gerade angelegte Datei abräumen.
Die Hülle hebt keine Datei auf.

**Offen bleibt die Klasse als Wächter.** Kein Lauf dieses Bestands bemerkt eine neunte Stelle.
T-320 hat einen solchen Lauf abgelehnt, weil seine Menge „an der Route aufgespannt" wäre — die
Begründung trägt hier nicht: Die Menge „jeder Aufruf von `removeImage`/`removeEmailFile` außerhalb
des Adapters" ist an der Anforderung aufgespannt, denn es ist gemessen, daß es keinen zweiten Weg
zum Aufheben einer Blob-Datei gibt. Gegenmittel A-A-102 (Bedrohungsmodell 41.8). **Der
code-reviewer hat denselben Widerspruch unabhängig gefunden** (T-324): `caller-scan.mjs` spannt
für `request` genau eine solche Menge auf.

**Und ein zweiter offener Punkt, an derselben Frage, aus der anderen Richtung** (Bedrohungsmodell
41.4): Die SQL-Vorauswahl in `attachmentsNamingFiles` ist seit T-320 **enger** als die
Entscheidung, weil der neue dritte Zweig des Vergleichs nicht mehr verlangt, daß der Name wie
übergeben eine Teilzeichenkette des `target` ist. Gemessen an drei Gestalten; heute unerreichbar,
weil beide Aufrufer gekürzte oder formgeprüfte Namen hereingeben. Der Kommentar über der Anweisung
nennt genau diese Ungleichung als tragend — sie ist es nicht mehr. Gegenmittel A-A-103.

Dieser Eintrag bleibt offen, bis A-A-102 und A-A-103 gebaut sind.

**Was dagegen gemessen zu ist** (T-324 und T-325 unabhängig voneinander): Das Inventar der acht
Stellen ist zweimal getrennt aufgespannt worden und beide Male gleich ausgefallen — keine neunte.
`attachmentNamesOfKind` ist absichtlich eng und entscheidet **keine** Löschung; sie speist
ausschließlich `missing`.

---

## R-30 — Der Ausschalter, den kein Wächter an der Verdrahtung sucht

**Schwere:** mittel. **Betrifft:** security-checker, domain-dev. Neu am 2026-09-12 (T-325,
Bedrohungsmodell 41.6).

Die Bauart aus T-287 heißt: Weil die Datensicherung `app_setting` als fremden Text vollständig
ersetzt, ist **jeder** Leser dieser Tabelle, dessen Wert über die ausgehende Anfrage entscheidet,
ein stiller Ausschalter der Versionsprüfung über ein präpariertes Archiv — still im Sinn von
A-18.11. Bei unsignierten Erzeugnissen ist die Aktualisierungsmeldung der einzige Weg, auf dem
eine Sicherheitsbehebung den Benutzer überhaupt erreicht.

`proof:release-safety` mißt diese Bauart an fünf Gestalten, und alle fünf hängen an einem
**Bezeichner** oder an einem **Ordner**: `lastCheckAt`, `last_version_check_at`, der
Datenbankgriff im Ordner des Prüfers, die Importmenge dieses Ordners, die Gestalt des Ports.
Gemessen am 2026-09-12: Ein Ausschalter in `composition.ts` — außerhalb des Ordners, über die
Spalte `locale`, wirksam über `startDelayMs`/`intervalMs` — übersetzt mit Exit 0 und läßt
`proof:release-safety` (76/0), `proof:route-policy` (48/0) und `proof:layers` (36/0) grün.

**Es gibt heute nichts zu beheben** — die Verdrahtung ist sauber, und der Wächter sagt diese Lücke
in seiner eigenen Liste an. Offen ist der Wächter darüber: Gegenmittel A-A-105, eine sechste
Gestalt an der **Verdrahtung** statt ein sechster Name.

**Nachgetragen am 2026-09-13: A-A-105 steht, und der Eintrag bleibt trotzdem offen.** T-327 hat die
sechste Gestalt gebaut, und der bekannte Ausschalter ist danach rot (105/1, vier Befunde aus zwei
Zweigen, von T-331 und T-332 unabhängig nachgefahren). **Drei Gestalten gleicher Wirkung kommen
weiterhin durch**, alle drei gemessen, alle drei mit `tsc` Exit 0:

| | Bauart | Lauf | Wirkung am echten Prüfer |
|---|---|---|---|
| T-331 | Ausschalter über den **`source`-Port**, außerhalb `features/version/` gebaut, über den erlaubten Schlüssel hereingereicht | **106/0** | — |
| T-332 K-1 | `recordCheck` wartet vor dem `UPDATE` einen aus `app_setting.locale` gelesenen Abstand ab; `composition.ts` und `main.ts` bleiben **zeichengleich** | **106/0** | **0 statt 14** Anfragen, Zustand `unknown`, leeres Protokoll |
| T-332 K-2 | `source: releaseSource` — erlaubter Schlüssel, erlaubte Wertform; Datenbankmarke in einer Nachbardatei | **106/0** | 0 statt 14 Anfragen; im Erzeugnis erreichbar, weil `entry.ts` `main()` ohne Optionen ruft |

Rot wird nur K-3 (zweites Mitglied im `store`-Literal), und der scheitert ohnehin schon am
Übersetzer. **Die Berichtigung, die daraus folgt, steht im Bedrohungsmodell:** Satz (c) ist baubar
und trägt allein nicht, und (a) bis (d) schließen **zusammen** die Klasse aus 41.6 nicht.

**Der eigentliche Hebel ist kein Wächterproblem** (T-332 B-1, Gegenmittel A-A-106):
`apps/local-api/src/features/version/version.ts:385` wartet unbefristet auf ein fremdes
Versprechen auf dem Weg zur Anfrage, und `:592`/`:594` stellen `await remember(...)` **vor**
`await source.latest(...)`. Ein Wurf ist behandelt, ein **Nie-Eintreffen** nicht. Solange das so
ist, ist jeder Leser auf diesem Weg ein Ausschalter, gleich wie eng die Menge des Wächters gezogen
wird.

Dieser Eintrag bleibt offen. **Stand 2026-09-13 (T-360), `proof:release-safety` 154/0 → 158/0:**
6g-1 mißt jetzt den **Weg** vom `setTimeout`-Rückruf bis zum Rumpf mit der Anfrage — jedes Glied
wartet auf genau eines, das nächste —, und „kein Weg gefunden" ist selbst ein Befund. Der Ausgang
aus T-356 (Anfrage eine Funktion tiefer) ist damit rot: vorher 154/0 grün und **0 statt 40**
Anfragen, nachher 157/1.

Der synchrone Riegel ist **teilweise** gefangen: die **Schleife** auf dem Weg und in allem, was von
dort synchron erreichbar ist (10 von 11 benannten Funktionen) — verboten ist dort eine **Sprachform**,
keine Zeile. Beide Gestalten aus T-357 sind rot, die laute in `run()` und die leise in `remember`
(3 statt 40 Anfragen, Protokoll leer). **Nicht geschlossen:** ein fremder Aufruf, der synchron nicht
zurückkehrt — der hat keine Schleife, sondern einen Namen; `now`, `logger` und der Rumpf eines
fremden Pakets sind ungemessen und stehen als benannte Lücke im Nachweis.

**Entschieden:** Die Quelle bekommt **keinen** zweiten Riegel — die Gesamtfrist der gebauten Quelle
trägt den Rumpf, selbst nachgemessen gegen einen tropfenden Wirt: Ausgang nach **5 002 ms** mit
`reason: timeout`, `source.ts` dabei unberührt.

**Zweite Achse, neu am 2026-09-14 (T-364), an konkreter Stelle gemessen:** `recordCheck` hält unter
fremder Schreibsperre die Ereignisschleife **5 004 ms** an — auf dem Weg **vor** der ausgehenden
Anfrage, und während der Port des Prüfers ausdrücklich sagt, ein Adapter dürfe nicht synchron
blockieren. Alle bisherigen Gestalten dieser Familie hängen an einem Warten, einem Namen oder einer
Sprachform; diese hängt an einer **Sperre der Datei**. Für den security-checker.

**Offen und an `packages/storage` abzugeben (A-A-124):** Ein abgelegter Speicher hinterläßt einen
**veralteten** statt eines fehlenden Zeitpunkts — und der reist in die Datensicherung. Ein
veralteter Zeitpunkt ist schlimmer als keiner: er sieht aus wie eine Auskunft.

**Gebaut und gemessen am 2026-09-14 (T-364) — und der Vorschlag ist widerlegt.** `write(null)` führt
über **denselben Kanal, der eben versagt hat**: In drei von vier gemessenen Fehlerlagen des echten
Adapters wirft auch das `UPDATE … = NULL` (nur lesende Verbindung, geschlossene Verbindung,
gesperrte Datei). Am echten Prüfer blieb der Wert mit Löschversuch **genauso 52 Stunden alt** wie
ohne — und der Lauf fiel dabei von 158/0 auf **157/1**.

**Der wirksame Hebel liegt beim Prüfer, nicht beim Speicher:** Ein Speicher, der **wirft**, ist
beschränkt und harmlos und darf nicht für die Laufzeit abgelegt werden; abzulegen ist allein der,
der **nie antwortet** — und der ist für den gebauten Adapter unerreichbar, weil sein `UPDATE`
synchron zurückkehrt. In dieser Fassung ist der Wert nach der Störung wieder **1 h statt 52 h** alt,
bei 158/0. Eigene Messung statt übernommener Zahl: **ein** fehlgeschlagener von **63**
Schreibversuchen genügt, danach 51 Anfragen ohne einen weiteren Eintrag.

Drei Zeilen in `features/version/**` stehen als gemessener Vorschlag bereit; A-A-124 bleibt offen,
bis sie gebaut sind — **gebaut ist die Auskunft, nicht die Behebung**.

**Gebaut am 2026-09-14 (T-367).** Die drei Stellen stehen im Bestand: `reportStoreFailure` trägt
die Zusage „genau eine Zeile" jetzt für **beide** Gründe und damit für das **Modul** statt für eine
Funktion; `forgetStore` ist die Antwort auf `timeout` **allein**; der Wurf meldet, statt abzulegen.
Selbst gemessen in beide Richtungen gegen eine Meßkopie mit genau der einen zurückgedrehten Zeile:
Nach einer vorübergehenden Dateisperre ist `app_setting.last_version_check_at` vorher **60 h** alt
und nachher **0 h**, bei gleichen 42 ausgehenden Anfragen und je genau einer Protokollzeile.
`proof:release-safety` hält 158/0, die 52 Prüffälle unter `apps/local-api/test/version` blieben
grün **ohne eine Änderung an einer Prüfdatei**. 7 neue Codezeilen, 2 entfernt, 1 geändert — der
Rest der 99 Zeilen ist Kommentar.

**A-A-124 ist damit verkleinert, nicht geschlossen.** Bleibt die Datei **dauerhaft**
unbeschreibbar, steht dort weiter der alte Wert, und dagegen hilft keine Bauform — nur der Wegfall
der Spalte, und der ist unverändert offen. Der Preis steht im Quelltext daneben und ist
nachgemessen: Ein Speicher, der synchron blockiert **und** wirft, blockiert danach **je Intervall**
statt einmal (10 Anfragen statt 55 bei 50 ms Blockade, Takt 10 ms, Fenster 600 ms; im Erzeugnis
höchstens 5 s je Stunde über `busy_timeout`).

**A-A-125 / zweite Achse, von T-367 selbst nachgemessen statt übernommen:**
`packages/storage/src/sqlite/repo-version-check.ts:130` hält unter fremdem `BEGIN EXCLUSIVE`
**5 004 ms** und wirft dann `database is locked`. Ein parallel laufender `setInterval` mit 10 ms
Takt kam dabei **null Mal** dran statt rund 500 Mal — während der Port sagt, ein Adapter dürfe
nicht synchron blockieren. Nicht gebaut, wie beauftragt.

**Fortgeschrieben am 2026-09-13 (T-342), weiterhin offen.** Die Lückenliste ist an der Anforderung
aufgespannt und ordnet den Weg in **vier Arten von Stellen**: gelesen, eingegrenzt, **nur
durchlaufen**, außerhalb des Baums. Die dritte Art ist die Klasse — **alle drei Ausschalter vom
2026-09-13 saßen darin.** Drei neue Sätze schließen sie (6h liest den Rumpf des Portliterals, 6i die
freien Laufzeitnamen der beiden Entscheidungsmodule, 6j den Ausdruck der Auskunft); 6i ist keine
Namensliste, sondern die zweite der genau zwei Türen, auf denen ein Modul an etwas herankommt, das
es nicht selbst erklärt hat — die erste nagelt Gestalt 5 seit T-290. Jede Gestalt beidseitig: vorher
130/0 grün, nachher je 144/1. Nullpunkt 145/0. Offen bleibt **A-A-106** — und drei Befunde aus der Freigaberunde:

- **„Genau zwei Wege" ist widerlegt.** 6i ist besser als erwartet (die dynamische Einfuhr mit
  literalem Quellnamen ist rot, `import.meta` ist bedacht), aber ein **gerechneter** Quellname —
  `await import(teile.join(':'))` — ist ein dritter Weg: `tsc` Exit 0, 145/0 grün, am Modul
  gemessen 0 statt 1 ausgehende Anfrage. Dazu zwei Türen aus T-346, beide unsichtbar für Gestalt 5
  und 6i: die Konstruktorkette und die Einfuhr als Aufruf mit berechneter Quelle.
- **Eine fünfte Art von Stelle fehlt in der Einteilung** (T-347 K-9): der Rumpf einer Funktion aus
  `packages/domain` hinter einer festgenagelten Einfuhr. 145/0 grün; gefangen **nur** von den
  Einheitenprüfungen (31 bzw. 17 rote Fälle). `packages/domain` kommt im ganzen Lauf kein einziges
  Mal vor.
- **Nicht der Lauf ist blockierend, sondern der Wortlaut** (T-346): 145/0 ist richtig; falsch wäre
  erst der Satz „die Menge der Türen ist geschlossen" im Risikoregister. Er steht hier deshalb
  nicht.

**Berichtigt am 2026-09-13 (T-337).** Der Satz stimmt, **sein Beleg nicht mehr**: `return new
Promise<void>(() => undefined)` steht inzwischen in der zeichengleich festgenagelten Deklaration und
wäre heute rot. Der bessere Beleg ist **K-7** — dieselbe Technik wie K-1, vier Zeilen versetzt in den
**Rumpf des `write`-Literals**, den Satz 6b als Literal prüft, aber nicht liest: `tsc` Exit 0, Lauf
**130/0**, **0 statt 1** ausgehende Anfrage. **Die Lücke liegt nicht in der Schreibweise, sondern in
der Stelle** — und das ist ein schärferer Satz als der, den er ersetzt. Dazu offen: die Lückenliste
bei `:1383` hängt noch an den Gestalten 1–5, und zwei Ausschalter über eine Umgebungsvariable
kommen bei 130/0 durch (T-336), obwohl der Port zwei Zeilen über sich selbst „keine
Umgebungsvariable" zusagt.

---

## R-31 — Die Rückfrage, die man nicht erreichen kann

**Schwere:** mittel. **Betrifft:** frontend-dev, security-checker. Neu am 2026-09-13 (T-332 B-3,
Bedrohungsmodell Abschnitt 42, Gegenmittel A-A-108).

A-19 verlangt, daß die Oberfläche vor dem Öffnen einer **Datei** fragt und dabei den vollen Pfad
nennt. Gemessen in den Gestaltungen `glass` und `liquid-glass`: Die Rückfrage hängt an der Karte
statt am Fenster (`apps/web/src/features/todos/Attachments.tsx:335` und `:352` mit
`apps/web/src/styles/theme-palettes.css:453`–`:457`). Die Abdunklung mißt 644×1344 bei (265,121)
statt 1280×820 bei (0,0); der Knopf „Öffnen" steht bei y = 952, also **außerhalb des Fensters**,
und die Fläche rollt mit (y = −479 nach 600 px Bildlauf).

**Der Befund ist älter als der fensterfeste Umbau** — mit den Stilblättern aus `HEAD` ergibt sich
dieselbe Geometrie. Er gehört nicht T-326; er ist dabei aufgefallen, weil zum ersten Mal jemand in
einer Glasgestaltung nachgesehen hat.

Eine Bestätigungsfläche, die in zwei von neunzehn Gestaltungen nicht erreichbar ist, ist keine
Bestätigung. Gegenmittel: Portal nach `document.body` in `DialogSurface`, mit Nachweis in `glass`.
**Geschlossen am 2026-09-13 (T-337), an der Menge gemessen und nicht am Fall.** Am Quelltext
zeichnen genau drei Stellen eine Abdunklung, alle über den Baustein `Scrim`. Im Browser 342
Messungen — 19 Paletten × 2 Modi × 9 Flächen — mit **einer einzigen** Geometrie, Elternknoten stets
`body`, null Vorfahren mit umschließendem Block, null wegrollende Flächen, null unerreichbare
Knöpfe; 822 Tabulatorschritte, keiner außerhalb; `Escape` schließt und ist nirgends Zustimmung.

**Der wichtigste Satz über diese Schließung handelt vom ersten Meßlauf, der nichts maß:**
`designsystem.tsx` lädt `startup.css` nicht und damit keine `theme-palettes.css` — 67 Karten,
**null** mit `backdrop-filter`. 342 grüne Zahlen hätten „in `glass` ist alles gut" gesagt, ohne daß
`glass` an war. Erst die **feuernde** Gegenprobe — die Abdunklung zurück in eine Karte gesetzt,
958 × 666 bei (297, −36333), beide Knöpfe unerreichbar — macht aus dem sauberen Ergebnis eine
Aussage. Eine Meßreihe ohne feuernde Gegenprobe mißt ihre eigene Abwesenheit.

**Der Wächter darüber ist nicht geschlossen** und steht als R-32.

**Dieselbe Klasse, andere Richtung, unabhängig gefunden** (T-324, blockierend): Der Wächter liest
seinen Dateibestand über die handgeschriebene Endungsliste `istTypescriptDatei`, und `.cts` fehlt
darin. Gemessen mit dem `tsc` dieses Vorhabens: eine `src/augment.cts` liegt im Programm, ihre
`declare module`-Zusammenführung greift, beide Zusagen überspringen sie, der neue Prüfsatz über
den Baum bleibt dabei grün. Sechste Runde derselben Familie — der Baum folgt seit T-320 dem
Compiler, die **Menge der gelesenen Dateien** folgt ihm nicht.

---

## R-32 — Der Wächter über die Abdunklungen mißt Portale, nicht Verankerung

**Schwere:** mittel. **Betrifft:** frontend-dev, security-checker. Neu am 2026-09-13 (T-336 und
T-337 unabhängig, Gegenmittel A-A-109, Bedrohungsmodell 43).

A-A-108 schreibt sein Kriterium an der **Anforderung** auf — jede Bestätigungsfläche hängt am
Fenster. Gebaut wurde in `apps/web/scripts/proof-surface.mjs:1458` eine Zusage über **Portale**:
Regel F läuft nur die direkten Kinder von `.app` ab, hält am ersten HTML-Knoten an, und die neue
Zeile prüft `portale > 0`.

Vier Mutationen, alle `tsc` Exit 0 und alle **28/0 grün**: `.scrim` ohne Portal in
`AttachmentOpenDialog.tsx:348` (die Portalzahl bleibt 3 — die Datei war nie erreicht), dasselbe in
`ShellStatus.tsx:763` (3 → 1, die Untergrenze hält trotzdem), und ein rohes
`<div className="scrim">` im Rumpf von `Attachments.tsx`.

**Es ist die Klasse aus E-099 Punkt 3, gefunden an der Stelle, an der sie behoben werden sollte.**

**Fortgeschrieben am 2026-09-13 (T-341 gebaut, T-346 und T-347 gemessen) — weiterhin offen, und
jetzt aus einem schwereren Grund.** Regel G mißt die Verankerung und fängt die vier Gestalten aus
R-32. Zehn weitere kommen durch, alle mit `tsc` Exit 0 und `proof:surface` 34/0: Klasse aus einem
Schablonenliteral (T-346 an `classTokensOf`, **die Gestalt steht schon im Baum**,
`PoolAdministration.tsx:142`) oder aus einem Bezeichner, Abdunklung ohne JSX über `createElement`,
dieselbe Fläche unter einem zweiten Klassennamen, `Escape` als Zustimmung,
`.scrim { position: static }`.

**G-4 ist eine neue Bauart und die schwerste bisher: eine falsche Zusage statt einer fehlenden.**
Vier Zeilen mit einem **eigenen Namen** `createPortal` bringen den Lauf dazu, die Fläche als
verankert zu **melden** — Ernte „2, davon 2 in einem `createPortal(…, document.body)`" —, während
sie an ihrer Karte hängt; dieselben vier Zeilen nehmen zugleich ein Kind von `.app` aus Regel F
heraus. Ursache ist **eine Zeile in zwei Regeln**: `callee(node) === 'createPortal'` ohne Blick auf
die Herkunft des Namens (`proof-surface.mjs:1118` und `:1339`).

Ein Lauf, der „1 von 1 verankert" meldet, während nichts verankert ist, wird zitiert. Deshalb steht
A-A-112 vor allen anderen Auflagen. Heute ist nichts kaputt: genau eine Stelle erzeugt die Klasse,
und sie geht durch das echte Portal. Offen, bis `createPortal` gegen seine Einfuhr aufgelöst wird
und die Menge an „jeder gezeichneten Abdunklung" hängt statt an den Gestalten, die der Autor in der
Hand hatte.

---

## R-33 — Die Meldung, die nie ankommt

**Schwere:** mittel. **Betrifft:** domain-dev, security-checker. Neu am 2026-09-13 (T-337 K-4,
Gegenmittel A-A-111).

Alle bisherigen Gestalten von R-30 messen **die ausgehende Anfrage**. K-4 geht daran vorbei: Die
Anfrage geht hinaus wie immer (eine, wie erwartet), aber `versionState` liefert über
`app_setting.locale` `{state:'unknown'}` — die **Auskunft** wird abgeschaltet, nicht die Prüfung.
Lauf 130/0, `proof:layers` 36/0, `proof:route-policy` 48/0, `proof:callers` 74/0.

**Halbiert am 2026-09-13 (T-342), nicht geschlossen.** Satz 6j macht K-4 rot — die **Stelle** ist
zu. Die **Klasse** nicht: derselbe Ausschalter wirkt auch im Rumpf von `current()`, in der Route, in
der Antwortgestalt und in der Oberfläche, und dorthin reicht kein Satz dieses Laufs. Der
vollständige Nachweis existiert bereits, aber am **Verhalten** statt am Quelltext:
`tests/e2e/version-check-live.spec.ts` TP-VER-10 mißt den Dialog auf dem Bildschirm und wird von
K-4 rot. **Am 2026-09-13 verknüpft und gefahren** (T-345): TP-VER-10 trägt jetzt den Verweis auf
R-33 und A-A-111 samt der Begründung, warum ein Verhaltensprüffall fängt, was vier Quelltextwächter
strukturell nicht können — 5/5 grün.

**Und die Reihenfolge dreht sich dabei um** (T-347): TP-VER-10 fängt, was **unbedingt** abschaltet;
die Türanalyse fängt, was **bedingt** abschaltet — für TP-VER-10 unsichtbar, weil der Prüffall die
Umgebung selbst stellt. Die beiden Mechanismen sind komplementär, nicht gestuft. Offen, bis der Weg
von `versionState` bis zum Dialog auch für die bedingte Bauart gemessen wird.

Für den Benutzer ist das Ergebnis dasselbe wie bei R-30: Er erfährt nichts von einer neuen Fassung,
und bei unsignierten Erzeugnissen ist die Aktualisierungsmeldung der einzige Weg, auf dem eine
Sicherheitsbehebung ihn erreicht. **Wer nur die Anfrage zusichert, hat die halbe Strecke
zugesichert** — der Weg endet nicht am Netz, sondern am Bildschirm. Offen, bis A-A-111 steht.

---

## R-34 — Das eingespielte Archiv bringt einen laufenden Timer mit

**Schwere:** hoch. **Betrifft:** domain-dev, e2e-tester. Neu am 2026-09-13 (T-350, Abschnitt 4).

E-036 und die Verwaistenerkennung fragen „beim Start vorgefunden". `dataArchive.replaceAll` (A-20)
ist ein **zweiter Eingang** für offene Einträge, und er kommt nach dem Start.

**Gemessen über den echten Einspielweg:** Ein Archiv mit laufendem Timer gilt **nicht** als
verwaist. Der Eintrag zeigt sich als laufender Timer seit dem Startzeitpunkt des **Quellrechners**,
und ein Stopp buchte **39 600 s Wanduhr statt 1 200 s** bis zum mitgereisten Lebenszeichen.

Das ist wörtlich der Schaden, gegen den E-036 gebaut wurde — und er landet in der **Abrechnung**.
Elf Stunden, die niemand gearbeitet hat, in einer Buchung, die exportiert werden kann.

**Berichtigt am 2026-09-13 (T-356): der Polaritätswechsel ist nicht die Bedingung.** Der Prüfer hat
gemessen, daß ein `captureTimerRecovery` **hinter** `replaceAll` denselben Fall auf **1 200 s statt
39 600 s** bringt — eine Zeile in `data-transfer.ts`. T-350 hatte den teuren Weg beschrieben, weil
er ihn für den einzigen sauberen hielt; er ist es nicht. Der Polaritätswechsel bleibt der
gründlichere Weg und faßt `context.ts`, `composition.ts`, `main.ts`, `idle.ts` und einen fremden
Prüffall an. Zweitens ist
`AppContext.timerRecovery` **optional** — fehlt es, gilt wieder jeder offene Eintrag als verwaist;
heute sicher, aber am Typ hängt es nicht.

**Geschärft am 2026-09-13 (T-357) — schwerer als das gemeldete Beispiel:**

- **Keine Obergrenze für die Dauer.** Gemessen bis `"Zeit": 8 999 868` in einer **Exportzeile**;
  die einzige Schranke ist die vierstellige Jahresangabe der Formprüfung.
- **Kein Angreifer nötig.** Eine **ehrliche** Datensicherung mit laufendem Timer genügt. Das ist
  der Unterschied zu jedem anderen Eintrag in dieser Liste.
- **Der Wert steht nicht in der Datei** — ihn rechnet der **empfangende** Rechner aus. Es gibt
  also nichts, was eine Prüfung des Archivs daran erkennen könnte.

Nachgemessen und haltend: die Notizgrenze (`todo.note` → `export_source_forbidden`),
`WindowsUser` aus der Hülle, und das Rückrollen eines ungültigen Archivs.

**Es ist der einzige Punkt dieser Liste, der ohne Zutun eines Angreifers Geld bewegt.**

**Am 2026-09-13 zur Hälfte geschlossen (T-358) — und die andere Hälfte ist erst dadurch sichtbar
geworden.** Die Aufnahme liegt jetzt mit `replaceAll` in **einer** Transaktionsklammer, die
Zuweisung nach dem COMMIT. Der erste Anlauf hatte einen Leser als harmlos abgetan („war vor dem
Schreiben abgeschickt"); gemessen war er **gereiht** vor dem Schreiben, lief aber **nach dem COMMIT
und vor der Aufnahme** und sah einen laufenden Timer mit 39 600 s ohne Waisenmeldung. Nebenläufig
mit 17 Lesern, je viermal: HEAD 0/17 richtig, zwei Klammern 16/17, **eine Klammer 17/17**.
Beidseitig über den echten Weg: ohne → `timer_not_running`, mit → **1 200 s**.

**Offen bleibt der direkte Weg, und er ist gemessen:** Ein `POST /timer/stop` unmittelbar nach dem
Einspielen bucht **weiterhin 39 600 s**. `stopTimer` fragt `foundAtServiceStart` **nicht** — der
Schutz liegt allein in der **Anzeige**. Der Polaritätswechsel über fünf Dateien hätte daran
ebenfalls nichts geändert; er war nie die Bedingung und wäre auch nicht die Lösung gewesen.

Zwei Nebenpunkte, benannt und nicht gemessen: eine offene `timer_idle`-Phase aus einem Archiv
(Ausgang wäre der A-24-Rückkehrdialog statt E-036), und `AppContext.timerRecovery` ist weiterhin
**optional** — fehlt es, gilt wieder jeder offene Eintrag als verwaist.

**Am 2026-09-14 geschlossen (T-363) — und dabei größer gewesen als der Name des Eintrags.** Der
Auftrag nannte den direkten Stopp „den letzten Weg". Gemessen waren es **drei**, plus ein vierter
Befund, der die anderen wieder geöffnet hätte. Alle beidseitig gemessen:

| Weg | vorher | jetzt |
|---|---|---|
| `POST /timer/stop` nach dem Einspielen | 39 600 s | **1 200 s** |
| `POST /timer/stop` nach gewöhnlichem Absturz, **ohne jedes Archiv** | 39 600 s | **1 200 s** |
| `POST /timer/start {stopRunning:true}` verdrängt den vorgefundenen Timer | 39 600 s | **1 200 s** |
| `POST /timer/heartbeat` hebt `bookableSeconds` des Dialogs an | 1 200 → **39 600** | 1 200 → **1 200** |
| gewöhnlicher Fall (Timer dieser Sitzung) | unverändert | unverändert |

**Die zweite Zeile ändert, was dieser Eintrag ist.** R-34 hieß „das eingespielte Archiv bringt einen
laufenden Timer mit" — aber derselbe Schaden entstand nach einem **gewöhnlichen Absturz ohne jedes
Archiv**. Der Einspielweg war der Anlaß, nicht die Bedingung. Wer nur ihn geschlossen hätte, hätte
zwei Drittel stehengelassen.

Die Regel bleibt an **einer** Stelle (`foundAtServiceStart` → `decideOrphanedTimer` in
`packages/domain`); neu ist allein, wer fragt.

**Nicht geschlossen und benannt:** Ein Lebenszeichen **aus der Zukunft** (die Uhr des Quellrechners
geht vor) bucht mehr als die Wanduhr. Das ist kein neuer Weg — `resolveOrphanedTimer` tut es seit
E-036 —, aber ein Deckel „nie nach jetzt" gehört in die Domäne. Ebenso offen: Das
A-24-Zuordnungsfenster nach einem Archiv mit offener `timer_idle`-Phase bietet gemessen **39 000 s**
zur Verteilung an.

**Und ein Befund am Rand, der keiner Aufgabe gehörte:** Die Zusage „monotone Messung" an
`POST /timer/stop` war **nie** eingelöst — `monotonicSeconds` ruft niemand. In der OpenAPI
berichtigt.

### R-34 bleibt offen — T-369 hat die Menge an der Anforderung nachgespannt (2026-09-14)

**Die Schließung ist zurückgenommen.** T-363 hatte die Menge der Wege an den **Routen**
aufgespannt, die es kannte; der code-reviewer hat sie an der **Anforderung** aufgespannt, und es
waren nicht drei Wege plus einer, sondern **sechs — zwei davon stehen offen:**

| Weg | Bucht auf einem beim Dienststart vorgefundenen Eintrag | Der Dialog bietet für denselben Eintrag |
|---|---|---|
| `beginIdle` (`apps/local-api/src/features/timer/idle.ts:71`) | **39 000 s** | 1 200 s |
| `separateIdle` bei der Rückkehr (`idle.ts:41`) | **39 000 s** | 1 200 s |

**Kein Benutzer muß dafür etwas tun:** `useIdleTimer` schickt das selbsttätig, sobald der Benutzer
weggeht. Damit gilt für R-34 unverändert, was ihn zum schwersten Eintrag der Liste gemacht hat —
kein Angreifer nötig, und der Wert steht nicht in der Datei.

**Zwei weitere Befunde derselben Runde:**

- **Der Deckel greift nur nach unten.** `bookingEndOfStop` fängt das zu kleine Ende, nicht das zu
  große: bei einem Lebenszeichen **aus der Zukunft** bucht der Stopp gemessen **43 200 s bei
  39 600 s Wanduhr**. Der Deckel „nie nach jetzt" gehört in `decideOrphanedTimer`
  (`packages/domain`), nicht in die Route.
- **Eine Überlappung, die es an `HEAD` nicht gab.** `startTimer` erzeugt gemessen eine
  **geschlossene** Buchung 06:00 → 18:00 neben einem **laufenden** Eintrag ab 17:00. Das ist eine
  Regression aus T-363, keine vorbestehende Lage, und sie verletzt A-24 („ohne Überlappung").

**Die eine Klammer aus T-358 trägt** — 17 von 17 Lesern sahen `bookableSeconds = 1200`, vom
Prüfer selbst über den echten `importDataArchive` nachgefahren. **Aber sie trägt aus einem Grund,
den niemand aufgeschrieben hat:** `unit-of-work.ts:236` gibt `next` zurück und `queue` ist eine
Ableitung davon. Diese Zusage steht nirgends und in keinem Prüffall — wer `unit-of-work.ts`
umbaut, öffnet R-34 wieder, ohne es zu merken.

**Am Rand gemessen:** `updated_at` steht nach einem gedeckelten Stopp **elf Stunden vor** dem
Schreibvorgang. Und der Wurf in `timer.ts:422` rollt richtig zurück, aber `app.onError` wirft die
Meldung weg — im Fehlerfall steht der Grund nirgends.

### R-34 — beide Bedingungen für die Schließung sind erfüllt (2026-09-14, T-371 und T-375)

T-371 hat die Menge **von unten an der Speicherung** aufgespannt — drei `UPDATE … SET ended_at` in
`repo-time.ts`, darüber sieben Aufrufe im Dienst, dieselbe Sieben wie T-370 und unabhängig
erreicht. Beide offenen Türen gehen jetzt durch `bookingEndOf`; `beginIdle` **weist ab**,
`completeReturn` **deckelt**. `decideOrphanedTimer` deckelt auf `min(heartbeatAt, now)`. Die
Überlappung in `startTimer` ist weg. **`proof:layers` Abschnitt 7 zieht die Menge der Türen bei
jedem Lauf aus der Platte** (36/0 → 51/0), damit die achte rot wird, bevor ein Prüfer sie findet.

T-371 hatte die Schließung an zwei Bedingungen geknüpft — „sonst ist sie zum dritten Mal eine
Behauptung". **Beide sind erfüllt:** Die achtzehn Fälle in `idle.test.ts` sind grün, und ein Fall
mißt die idle-Tür. `pnpm test:coverage` steht vom Orchestrator nachgefahren bei **1 914 grün / 0
rot** über 101 Dateien.

**Die Fixture-Lücke war wirklich nur eine Lücke, und das ist nachgemessen statt angenommen.**
T-375 hat für jeden der achtzehn einzeln geprüft, ob er danach dieselbe Behauptung festnagelt wie
vorher. Die beiden Archiv-Fälle, bei denen der Verdacht am größten war, umgehen
`importDataArchive` ganz und berühren `foundAtServiceStart` nie — sie messen die Treue des
Round-Trips und sind von B-1/B-2 unberührt.

**Berichtigung an der Zusage aus `unit-of-work.ts`:** Die oben notierte Sorge war zur Hälfte
falsch. Die wörtliche Mutation, vor der T-371 gewarnt hat (`return next` → `return queue`), ist
**nicht still** — `queue` löst stets zu `undefined` auf, bricht damit den Rückgabewert für jeden
Aufrufer und wird vom bestehenden Prüfstand breit gefangen. **Der wirklich stille Rückschritt** —
die früher verworfene Zwei-Transaktionen-Anordnung — wird von Fall E mit 17 Lesern zuverlässig
gefangen: **0/17 gegen 17/17 über fünf Wiederholungen**. Die Zusage bleibt damit ein **gemessenes
Verhalten, kein typgesicherter Vertrag**.

**Noch nicht geschlossen, und zwar aus Verfahrensgründen:** T-371 hat weder Code-Review noch
Sicherheitsprüfung gesehen. T-370 hat T-363 geprüft, nicht T-371. Der Eintrag bleibt offen, bis
die Freigaberunde über T-371 durch ist.

**Weiter offen, unabhängig davon:** **B-5** — das A-24-Zuordnungsfenster aus einem Archiv bietet
gemessen 39 000 s zur Verteilung an; nur benannt, nicht behoben. **A-A-127** — weiterhin keine
Obergrenze für eine Dauer.

