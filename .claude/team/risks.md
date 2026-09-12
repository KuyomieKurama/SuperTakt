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
