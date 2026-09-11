# Takt — Produktspezifikation

Quelle: Der ursprüngliche Framer-Gestaltungsauftrag des Auftraggebers, hier in eine prüfbare
Anforderungsliste überführt. Der Wortlaut der Anforderungen ist inhaltlich unverändert; ergänzt
wurden nur Nummerierung, Gliederung und die Abgrenzungen, die für Umsetzung und Test nötig sind.

Ergänzungen und Entscheidungen, die nicht aus dem Originaltext stammen, sind als **Nachtrag**
gekennzeichnet. Alles andere ist Vorgabe.

Status: verbindlich. Änderungen laufen über `.claude/team/decisions.md`.

---

## 1. Grundidee

Takt verbindet Todo- und Ticketverwaltung, ein Kanban-Board, Zeiterfassung, flexible
Tagverwaltung, hierarchische Ordner für Tags, persönliche Todo-Notizen, Notizen je Zeitbuchung,
den Export erfasster Zeiten an ein externes Abrechnungstool, konfigurierbare Standard-Tags und
eine Outlook-Anbindung zum schnellen Anlegen von Todos.

Trotz des Funktionsumfangs bleibt die Anwendung intuitiv und übersichtlich. Das Design ist
modern, hochwertig, reduziert und professionell und fühlt sich nach einem modernen
SaaS-Produkt an, nicht nach einer klassischen To-do-App.

**Nachtrag — Betriebsform.** Takt läuft vollständig lokal. Es gibt keine Cloudanbindung und
keinen Datenbankserver. Gespeichert wird in einer eingebetteten SQLite-Datei im
Anwendungsdatenverzeichnis des Benutzers.

---

## 2. Todos und Tickets

| ID | Anforderung |
|---|---|
| A-2.1 | Benutzer können beliebig viele Todos beziehungsweise Tickets anlegen. |
| A-2.2 | Ein Todo hat mindestens: Titel, Status, mehrere Tags, persönliche Notiz, erfasste Arbeitszeit, optional weitere Metadaten. |
| A-2.3 | Ein Todo kann mit beliebig vielen Tags versehen werden. |
| A-2.4 | Ein Todo kann als „Erledigt" markiert werden. |
| A-2.5 | Wird die Zeiterfassung eines bereits erledigten Todos erneut gestartet, hebt die Anwendung den Erledigt-Status automatisch auf. Das Todo wird wieder aktiv und landet erneut in dem zuvor definierten Todo-Pool. |

**Nachtrag — A-2.6.** Ein Todo trägt zusätzlich das Feld `callNumber`. Es nimmt die Nummer auf,
die das Outlook-Add-in per konfigurierbarem regulärem Ausdruck aus der E-Mail erkennt, und ist
die Standardquelle für das Exportfeld `Call` (siehe Abschnitt 8). Das Feld darf leer bleiben;
eine Buchung ohne Call-Nummer ist exportierbar, sofern die gewählte Exportvorlage das zulässt.

---

## 3. Todo-Pools

| ID | Anforderung |
|---|---|
| A-3.1 | Todos lassen sich Pools zuordnen. |
| A-3.2 | Ein Pool kann über ein bestimmtes Tag definiert werden. |
| A-3.3 | Die Oberfläche erlaubt es, Pools flexibel zu konfigurieren und Todos danach zu organisieren und zu filtern. |

**Nachtrag — A-3.4.** Pool-Zugehörigkeit ist abgeleitet, nicht gespeichert: Ein Todo gehört zu
einem Pool, weil seine Tags der Pool-Regel entsprechen. Das ist die Voraussetzung dafür, dass
A-2.5 funktioniert — nach dem Aufheben von „Erledigt" landet das Todo automatisch wieder in
seinem Pool, ohne dass eine Zuordnung zwischengespeichert werden muss.

---

## 4. Tags und Ordner

| ID | Anforderung |
|---|---|
| A-4.1 | Benutzer können unbegrenzt viele Tags anlegen. |
| A-4.2 | Für Tags lassen sich Ordner anlegen; Tags werden darin organisiert. |
| A-4.3 | Die Ordnerstruktur darf beliebig tief verschachtelt werden (Ordner → Unterordner → Unterordner → Unterordner → Tag). |
| A-4.4 | Navigation und Verwaltung dieser Struktur bleiben trotzdem übersichtlich. |
| A-4.5 | Tags dienen unter anderem für: Projekte, Kunden, Aufgabenarten, Abteilungen, Prioritäten, Todo-Pools und weitere individuelle Kategorien. |

**Nachtrag — A-4.6.** Zyklen in der Ordnerhierarchie sind unzulässig. Ein Ordner darf weder sich
selbst noch einen seiner Vorfahren als übergeordneten Ordner haben. Die Anwendung verhindert
das beim Verschieben.

---

## 5. Kanban-Board

| ID | Anforderung |
|---|---|
| A-5.1 | Die Anwendung enthält ein Kanban-Board. |
| A-5.2 | Todos lassen sich per Drag & Drop zwischen Status-Spalten verschieben. |
| A-5.3 | Beispielspalten: Backlog, In Progress, Waiting, Done. |
| A-5.4 | Die Statusstruktur ist konfigurierbar. |
| A-5.5 | Ein Todo lässt sich direkt aus dem Board öffnen und bearbeiten. |
| A-5.6 | Der Time-Tracker lässt sich direkt aus einem Todo beziehungsweise aus einer Kanban-Karte starten und stoppen. |

---

## 6. Zeiterfassung

| ID | Anforderung |
|---|---|
| A-6.1 | Für jedes Todo lässt sich Arbeitszeit erfassen. |
| A-6.2 | Ein Benutzer kann einen Timer starten und stoppen. |
| A-6.3 | Ein Todo kann mehrere einzelne Zeitbuchungen besitzen. |
| A-6.4 | Jede Zeitbuchung enthält mindestens: Startzeit, Endzeit, Dauer, Exportstatus, Notiz. |
| A-6.5 | Eine Zeitbuchung ist eindeutig als „noch nicht exportiert" oder „bereits exportiert" gekennzeichnet. |
| A-6.6 | Es ist jederzeit erkennbar, welche Arbeitszeiten bereits an das Abrechnungstool übertragen wurden und welche noch offen sind. |
| A-6.7 | Die Oberfläche unterscheidet diese beiden Zustände visuell klar. |

**Nachtrag — A-6.8.** Es läuft höchstens ein Timer gleichzeitig. Wird ein Timer gestartet,
während ein anderer läuft, stoppt die Anwendung den laufenden und fragt vorher nach.

**Nachtrag — A-6.9.** Der Exportstatus einer Buchung ist zweiwertig, nie leer und nie
mehrdeutig. Eine bereits exportierte Buchung ist nicht mehr bearbeitbar, solange ihr
Exportstatus nicht ausdrücklich zurückgesetzt wird.

---

## 7. Notizen

| ID | Anforderung |
|---|---|
| A-7.1 | Jedes Todo besitzt eine persönliche Notiz. |
| A-7.2 | Diese Notiz ist ausschließlich innerhalb der Anwendung sichtbar und wird nicht automatisch an das Abrechnungstool übertragen. |
| A-7.3 | Jede einzelne Zeitbuchung besitzt ein eigenes Notizfeld für das, was im entsprechenden Zeitraum erledigt wurde. Beispiel: „Fehleranalyse im Backend durchgeführt und API-Response angepasst." |
| A-7.4 | Die Notiz der Zeitbuchung wird beim Export an das Abrechnungstool übertragen. |

Die Trennung aus A-7.2 und A-7.4 ist eine Datenschutzgrenze und wird ausdrücklich getestet:
Die Todo-Notiz darf in keinem Exportergebnis auftauchen.

---

## 8. Export an das Abrechnungstool

| ID | Anforderung |
|---|---|
| A-8.1 | Die Anwendung exportiert erfasste, noch nicht exportierte Zeitbuchungen als JSON. |
| A-8.2 | Das Standardformat enthält die Werte `Call`, `Zeit`, `Notiz` und `WindowsUser`. |
| A-8.3 | `Zeit` wird in Schritten von 0,25 exportiert: 1,00 = 60 Minuten, 0,75 = 45 Minuten, 0,50 = 30 Minuten, 0,25 = 15 Minuten. |
| A-8.4 | `Notiz` wird vor dem Export als Base64 kodiert. Die Eingabe ist UTF-8. |
| A-8.5 | Der Windows-Benutzername wird mitübertragen. |
| A-8.6 | Die Oberfläche stellt deutlich dar, welche Zeitbuchungen bereits exportiert wurden und welche noch exportiert werden müssen. |

Beispielstruktur:

```json
{
  "Call": "...",
  "Zeit": 1.25,
  "Notiz": "...",
  "WindowsUser": "..."
}
```

**Nachtrag — A-8.7, konfigurierbare Exportvorlagen.** Die Struktur aus A-8.2 ist die mitgelieferte
Standardvorlage, nicht die einzig mögliche. Der Benutzer kann in der Anwendung festlegen, welche
Felder exportiert werden. Eine Exportvorlage ist eine geordnete Liste von Feldern:

```
Feld = {
  name            frei wählbarer Schlüssel im JSON, z. B. "Call"
  quelle          Pfad auf die Daten, z. B. todo.callNumber | buchung.notiz
                  | buchung.dauer | system.windowsUser | todo.tags
  transformation  roh | base64 | runde_auf_viertelstunde | datum(format) | konstante
  bedingung       optional; Feld wird nur ausgegeben, wenn erfüllt
}
```

Die Standardvorlage bildet A-8.2 bis A-8.5 exakt ab und ist nicht löschbar, aber kopierbar. Der
Vorlageneditor zeigt eine Live-Vorschau auf tatsächlich offenen Buchungen.

**Nachtrag — A-8.8.** Der Export läuft als Transaktion: Entweder wird die Datei geschrieben und
alle enthaltenen Buchungen werden als exportiert markiert, oder es passiert nichts. Ein Abbruch
mitten im Vorgang darf keine Buchung in einem Zwischenzustand hinterlassen.

**Nachtrag — A-8.9.** Base64 ist eine Kodierung, keine Verschlüsselung. Die Exportdatei enthält
Kundendaten im Klartextäquivalent und wird entsprechend behandelt.

---

## 9. Standard-Tags

| ID | Anforderung |
|---|---|
| A-9.1 | Eine Einstellung legt fest, welche Tags bei einem neu erstellten Todo automatisch gesetzt werden. |
| A-9.2 | Beispiel: „Intern", „Todo", „Nicht abgerechnet". |
| A-9.3 | Beim Erstellen eines neuen Todos werden diese Tags automatisch hinzugefügt. |
| A-9.4 | Die Standard-Tags sind jederzeit in den Einstellungen anpassbar. |

**Nachtrag — A-9.5.** Standard-Tags greifen bei jedem Weg, auf dem ein Todo entsteht, also auch
beim Anlegen aus dem Outlook-Add-in heraus.

---

## 10. Outlook-Add-in

| ID | Anforderung |
|---|---|
| A-10.1 | Zusätzlich zur Haupt-Anwendung gibt es ein Outlook-Add-in. |
| A-10.2 | Ziel ist das Anlegen eines neuen Todos direkt aus Outlook. |
| A-10.3 | Das Add-in kommuniziert über eine API mit der Todo-Anwendung. |
| A-10.4 | Beim Öffnen beziehungsweise Anlegen eines Todos ruft das Add-in die vorhandene Tag- und Ordnerstruktur über die API ab. |
| A-10.5 | Der Benutzer kann aus Outlook heraus: ein neues Todo anlegen, Tags auswählen, verschachtelte Tag-Ordner durchsuchen, relevante Informationen aus der E-Mail übernehmen und weitere Todo-Einstellungen vornehmen. |
| A-10.6 | Das Add-in fügt sich optisch und funktional in Outlook ein und passt gleichzeitig zum Design der Hauptanwendung. |
| A-10.7 | Die Referenzbilder dienen nur als Anregung; das Design wird daraus eigenständig und konsistent zur Hauptanwendung entwickelt. |

**Nachtrag — A-10.8.** Das Add-in erkennt die Call-Nummer über einen regulären Ausdruck, der in
den Add-in-Einstellungen konfigurierbar ist und nicht im Code steht.

**Nachtrag — A-10.9.** Existiert bereits ein Todo mit derselben Call-Nummer, **weist das Add-in
darauf hin**, bevor ein zweites entsteht. Es bietet am gefundenen Todo **keine Handlung an** —
weder eine Zeitbuchung noch einen Anhang. Der Benutzer entscheidet daraufhin, ob er das
vorhandene Todo in SuperTakt selbst weiterbearbeitet oder aus dem Add-in heraus bewußt ein neues
anlegt; das Add-in legt nicht stillschweigend an oder zusammen.

Geändert am 2026-09-10 mit der Entscheidung zu F-21 (E-100). Die frühere Fassung verlangte ein
Buchungsangebot auf dem gefundenen Todo; Pull Request #15 hatte daraus ein Anhängen gemacht, und
E-100 streicht beides. Der Hinweis selbst bleibt — ohne ihn entstünde ein Duplikat unbemerkt, und
das ist der Zweck dieser Anforderung (R-15).

**Nachtrag — A-10.10.** Die Referenzbilder aus dem Originalauftrag liegen nicht vor. Bis sie
nachgereicht werden, gestaltet sich das Add-in allein aus dem Designsystem der Hauptanwendung.

---

## 11. Pflicht-Screens

Das UI-Konzept umfasst mindestens diese Ansichten:

| ID | Screen |
|---|---|
| S-01 | Dashboard / Startseite |
| S-02 | Todo-Liste |
| S-03 | Todo-Detailansicht |
| S-04 | Kanban-Board |
| S-05 | Time-Tracking-Ansicht |
| S-06 | Übersicht aller Zeitbuchungen |
| S-07 | Export-Ansicht |
| S-08 | Tag- und Ordnerverwaltung |
| S-09 | Einstellungen |
| S-10 | Verwaltung der Standard-Tags |
| S-11 | Todo-Pool-Konfiguration |
| S-12 | Outlook-Add-in |
| S-13 | Einstellungen des Outlook-Add-ins |

**Nachtrag — S-14.** Editor für Exportvorlagen. Folgt aus A-8.7 und hat im Originalauftrag noch
keine Entsprechung, weil dort die Exportstruktur fest war.

---

## 12. Dashboard

Das Dashboard gibt schnellen Überblick über die wichtigsten Informationen, zum Beispiel:
aktuell laufender Timer, heute erfasste Arbeitszeit, noch nicht exportierte Zeiten, erledigte
Todos, offene Todos, aktuelle Projekte beziehungsweise Tags, zuletzt bearbeitete Todos.

Wichtige Aktionen sind möglichst direkt vom Dashboard aus ausführbar.

---

## 13. UX-Anforderungen

| ID | Anforderung |
|---|---|
| A-13.1 | Schnell erfassbar. |
| A-13.2 | Wenig visuelle Unordnung. |
| A-13.3 | Komplexe Tag-Hierarchien verständlich dargestellt. |
| A-13.4 | Zeiterfassung prominent, aber nicht störend integriert. |
| A-13.5 | Exportstatus eindeutig visualisiert. |
| A-13.6 | Drag & Drop unterstützt. |
| A-13.7 | Globale Suche und Filter. |
| A-13.8 | Responsiv aufgebaut. |
| A-13.9 | Auf Desktop-Nutzung optimiert. |

Moderne SaaS-Designprinzipien, klare Typografie, konsistente Abstände, verständliche Icons,
hochwertiges UI-System.

---

## 14. Navigation

Logische globale Navigation, beispielsweise: Dashboard, Todos, Kanban, Time Tracking, Export,
Tags, Einstellungen. Die Navigation ist jederzeit sichtbar und leicht verständlich.

---

## 15. Designrichtung

Wirkung wie ein professionelles, modernes B2B-SaaS-Produkt. Ziele: modern, minimalistisch,
hochwertig, funktional, übersichtlich, professionell, informationsreich ohne Überladung.

Karten, Panels, Tabellen, Status-Badges, Filter, Dropdowns und Kontextmenüs dort einsetzen, wo
sie sinnvoll sind. Der Funktionsumfang darf nicht zu einer überladenen Oberfläche führen.

Verlangt sind ausdrücklich auch: sinnvolle Empty States, Loading States, Hover States, aktive
Zustände, Fehlermeldungen und Bestätigungsdialoge.

---

## 16. Interaktionen und Zustände

Für jede dieser Interaktionen sind passende UI-Zustände und Rückmeldungen zu zeigen:

| ID | Interaktion |
|---|---|
| I-01 | Todo erstellen |
| I-02 | Todo bearbeiten |
| I-03 | Todo als erledigt markieren |
| I-04 | Time-Tracker starten und stoppen |
| I-05 | Erledigtes Todo durch erneutes Starten des Timers wieder aktiv setzen |
| I-06 | Tags hinzufügen und entfernen |
| I-07 | Tags in Ordner verschieben |
| I-08 | Ordner verschachteln |
| I-09 | Zeitbuchungen als exportiert markieren |
| I-10 | Zeitbuchungen filtern |
| I-11 | Daten exportieren |
| I-12 | Standard-Tags konfigurieren |
| I-13 | Todo-Pools konfigurieren |
| I-14 | Todos per Drag & Drop verschieben |

**Nachtrag — I-15.** Exportvorlage anlegen, bearbeiten und in der Vorschau prüfen.

---

## 17. Ziel

Ein durchgängiges, realistisches Produktdesign mit konsistentem Designsystem und klarer
Informationsarchitektur. Die Anwendung soll sich wie ein tatsächlich entwickeltes
professionelles Produkt anfühlen, nicht wie eine Demo. Priorität hat eine exzellente
Desktop-Erfahrung, weil die Anwendung primär für produktives Arbeiten am PC gedacht ist.

---

## 18. Versionsprüfung

Nachtrag des Auftraggebers vom 2026-09-04. Takt bleibt eine lokale Anwendung (E-001); dieser
Abschnitt beschreibt die **einzige** Verbindung nach außen, die sie kennt, und zwar in dem Umfang,
in dem sie erlaubt ist.

| ID | Anforderung |
|---|---|
| A-18.1 | Takt ermittelt die eigene installierte Fassung eindeutig aus einer einzigen Quelle im Erzeugnis. |
| A-18.2 | Beim Start und danach regelmäßig prüft Takt, ob im offiziellen GitHub-Bestand eine neuere veröffentlichte Fassung vorliegt. |
| A-18.3 | Gefragt wird die dafür vorgesehene offizielle Quelle: die Releases des Bestands. Die Adresse ist fest im Erzeugnis hinterlegt und weder einstellbar noch aus einer Antwort übernehmbar. |
| A-18.4 | Verglichen wird die installierte Fassung mit der neuesten veröffentlichten. Der Vergleich folgt einer festgelegten Ordnung von Versionsnummern, nicht dem Zeichenkettenvergleich. |
| A-18.5 | Liegt keine neuere Fassung vor, sagt Takt nichts und tut nichts. |
| A-18.6 | Liegt eine neuere Fassung vor, zeigt Takt sie an, und zwar mindestens: die installierte Fassung, die verfügbare Fassung und den Verweis auf die offizielle Release-Seite dieser Fassung. |
| A-18.7 | Takt fragt ausdrücklich, ob der Benutzer installieren oder überspringen möchte. Es gibt keine Vorauswahl, die eine der beiden Antworten für ihn trifft. |
| A-18.8 | Wählt der Benutzer „Installieren", öffnet Takt die offizielle Release-Seite dieser Fassung. Mehr geschieht nicht. |
| A-18.9 | Takt lädt zu keinem Zeitpunkt eine Datei herunter und installiert zu keinem Zeitpunkt etwas. Herunterladen und Installieren löst ausschließlich der Benutzer aus, außerhalb von Takt. |
| A-18.10 | Wählt der Benutzer „Überspringen", wird genau diese Fassung übersprungen. Für sie erscheint der Hinweis nicht wieder; eine spätere, neuere Fassung wird wieder gemeldet. |
| A-18.11 | Ist GitHub nicht erreichbar, antwortet die Quelle unerwartet oder fehlt eine Versionsangabe, bleibt die Prüfung folgenlos: kein Hinweis, keine Fehlerfläche, kein wiederholtes Nachfragen **im selben Prüflauf**. Der gewöhnliche Takt bleibt davon unberührt — der nächste Versuch folgt frühestens nach dem Mindestabstand von einer Stunde. Ein Fehlschlag beendet die Prüfung **nicht** für die Laufzeit der Anwendung. Der Mindestabstand gilt **innerhalb eines Laufs**: Ein Programmstart fragt immer einmal, gleich wann zuletzt gefragt wurde. Der Grund steht im Protokoll. |
| A-18.12 | Die Prüfung überträgt nichts über den Benutzer, den Bestand oder die Nutzung. Sie stellt eine Frage und liest eine Antwort. |

**Was diese Anforderung ausdrücklich nicht ist.** Kein Selbstaktualisierer, kein Hintergrundlader,
keine Telemetrie. E-001 gilt unverändert für alles andere: Es gibt weiterhin keinen Cloud-Dienst,
keinen Datenbankserver und keine Übertragung von Daten aus Takt heraus.

---

## 19. Frist und Anhänge am Todo

Nachtrag des Auftraggebers vom 2026-09-05, mit der Anhangfunktion von Super Productivity als
Vorbild für Bedienung und Verhalten. Beides hängt am **bestehenden** Todo und ist keine zweite
Struktur daneben.

### 19.1 Frist

| ID | Anforderung |
|---|---|
| A-19.1 | Ein Todo kann eine Frist tragen. Sie ist **optional**; ein Todo ohne Frist bleibt in jeder Hinsicht ein gültiges Todo. |
| A-19.2 | In der Oberfläche heißt sie ausschließlich **„Frist"**. Nicht „Fälligkeitsdatum", nicht „fällig am", nicht „Deadline". |
| A-19.3 | Die Frist wird beim Anlegen und beim Bearbeiten eines Todos gesetzt, geändert und wieder entfernt. |
| A-19.4 | Die Frist ist in der Todo-Ansicht sichtbar, ohne dass man das Todo öffnen muss. |
| A-19.5 | Drei Zustände sind unterscheidbar und benannt: **überfällig**, **heute fällig**, **später fällig**. Ein Todo ohne Frist hat keinen dieser Zustände. |
| A-19.6 | Die Frist ist ein Tag, keine Uhrzeit. Die drei Zustände aus A-19.5 sind Tagesvergleiche. |
| A-19.7 | Die Frist ändert nichts an Pools, Spalten, Zeitbuchungen oder Export. Sie ist eine Eigenschaft des Todos, keine neue Achse. |

### 19.2 Anhänge

| ID | Anforderung |
|---|---|
| A-19.8 | Ein Todo kann **beliebig viele** Anhänge tragen. |
| A-19.9 | Es gibt drei Arten: **Verweis** (öffnet im Browser), **Bild** (wird als Vorschaubild angezeigt), **Datei** (öffnet mit der Standardanwendung des Systems). |
| A-19.10 | Beim Hinzufügen bestimmt die gewählte Art das Eingabefeld: Verweis → **Adresse** (Pflicht) und **Titel** (optional); Bild → **Bild** (Pflicht) und **Titel** (optional); Datei → **Dateipfad** (Pflicht) und **Titel** (optional). |
| A-19.11 | Anhänge sind unmittelbar am Todo sichtbar und dort verwaltbar: hinzufügen, öffnen, entfernen. |
| A-19.12 | Bei Verweis und Datei steht der Titel als Bezeichnung; fehlt er, steht dort etwas Lesbares aus Adresse beziehungsweise Pfad und nie eine leere Zeile. |
| A-19.13 | Ein Bild wird als Vorschaubild dargestellt. |
| A-19.14 | Anhänge und Frist werden gespeichert und stehen beim erneuten Öffnen des Todos unverändert wieder da. |
| A-19.15 | Ein Anhang, der sich nicht öffnen lässt — Datei verschwunden, Adresse unbrauchbar, Bild nicht mehr lesbar —, sagt das an Ort und Stelle. Er verschwindet nicht und er wirft nicht. |

### 19.3 Sortieren, Filtern und das Add-in

Nachtrag des Auftraggebers vom 2026-09-05, als Antwort auf F-20.

| ID | Anforderung |
|---|---|
| A-19.20 | Die Todo-Liste lässt sich nach der Frist **sortieren** und nach ihr **filtern**. |
| A-19.21 | Das Outlook-Add-in kann beim Anlegen eines Todos eine **Frist** setzen. |

### 19.4 Was dabei nicht geschehen darf

| ID | Anforderung |
|---|---|
| A-19.16 | Bestehende Todos funktionieren unverändert weiter. Frist und Anhänge sind Ergänzungen, keine Umstellung. |
| A-19.17 | Die Notiz-Trennung bleibt: Weder Frist noch Anhang gelangen in einen Export. |
| A-19.18 | Ein Anhang wird **nur auf ausdrückliche Handlung des Benutzers** geöffnet. Nichts öffnet sich beim Anzeigen einer Liste, beim Laden eines Todos oder als Nebenwirkung. |
| A-19.19 | Über das Outlook-Add-in entstehen Anhänge **ausschließlich beim Anlegen eines neuen Todos aus einer E-Mail** und ausschließlich auf dem in 19.5 beschriebenen Weg. An einem **bereits vorhandenen** Todo entsteht über das Add-in kein Anhang — weder im Duplikatfall (A-10.9) noch sonst. *Bis zum 2026-09-11 lautete diese Anforderung „Über das Outlook-Add-in entstehen **keine** Anhänge"; sie ist durch E-108 ersetzt.* |

### 19.5 Anhänge aus dem Outlook-Add-in

Nachtrag des Auftraggebers vom 2026-09-11. Er hebt E-100 zur Hälfte auf: Beim **Anlegen** aus
einer E-Mail entstehen Anhänge, am **gefundenen** Todo weiterhin nicht. Vorbild für das
Einsammeln der Dateien ist die bestehende Outlook-Bridge zu Super Productivity; die E-Mail
selbst als Datei anzuhängen kann diese Bridge **nicht** — sie legt dafür einen Deep-Link und
einen Textauszug ab, und genau das genügt hier nicht.

| ID | Anforderung |
|---|---|
| A-19.22 | Entsteht ein Todo aus einer E-Mail, wird die **E-Mail selbst als Datei** an dieses Todo gehängt. Die Datei enthält Absender, Empfänger, Betreff, Versanddatum und Nachrichteninhalt. Ein Verweis auf die E-Mail und ein kopierter Nachrichtentext genügen **nicht**. |
| A-19.22a | Gibt Outlook die Nachricht als Datei her, ist es **die ursprüngliche Nachricht**, unverändert. Gibt es sie nicht her, wird die Datei aus den verfügbaren Angaben **nachgebaut** — mit demselben Inhalt nach A-19.22, ohne die übrigen Kopfzeilen. |
| A-19.22b | Ein **Nachbau ist als solcher gekennzeichnet**. Die Kennzeichnung hängt an der **Datei**, nicht am Augenblick des Anlegens: Sie ist am Anhang sichtbar, sie steht in der Rückfrage vor dem Öffnen, und sie übersteht die Datensicherung. Ein Hinweis, der nur beim Anlegen erscheint, ist drei Wochen später nirgends. Eine Datei, die für die ursprüngliche Nachricht gehalten werden kann, ohne es zu sein, ist der Fehler, den diese Anforderung ausschließt. |
| A-19.22c | Der Nachbau wird aus fremdem Text **erzeugt**. Dabei darf aus keiner Angabe der Nachricht eine Struktur der Datei werden — kein zusätzlicher Kopfteil, kein zusätzlicher Abschnitt, kein zusätzlicher Anhang. Ein Anhang, der auf diesem Weg entstünde, wäre keiner im Sinne von A-19.23 und unterläge keiner seiner Regeln. |
| A-19.23 | **Sämtliche Dateianhänge** derselben E-Mail werden zusätzlich als je ein eigener Anhang an dasselbe Todo gehängt. Inhalt und Dateiformat bleiben unverändert. |
| A-19.23a | Der Name aus der E-Mail ist **fremder Text** und wird als **Anzeigename** geführt, nicht als Name auf der Platte; den Namen auf der Platte bestimmt SuperTakt. Die Endung bleibt dabei erhalten, denn sie entscheidet, womit die Datei geöffnet wird. |
| A-19.23b | Wo ein Anzeigename aus fremder Hand erscheint — in der Liste der Anhänge **und in der Rückfrage vor dem Öffnen** —, ist die **Endung stets sichtbar** und nicht durch Kürzung, Richtungszeichen oder unsichtbare Zeichen zu verbergen. |
| A-19.24 | Eingebettete Bilder, die Teil der Darstellung sind — Signaturbilder, Logos im Nachrichtentext —, sind keine Dateianhänge im Sinne von A-19.23. |
| A-19.25 | Ein Anhang, der in der E-Mail selbst nur als Verweis auf einen Ablageort liegt (Cloud-Anhang), wird als **Verweis** übernommen, nicht als Datei, und ist als solcher erkennbar. |
| A-19.26 | Übernommene Dateien sind gewöhnliche Dateianhänge im Sinne von A-19.9. Für sie gilt A-19.18 unverändert: Sie öffnen sich nie von selbst, und vor dem Öffnen nennt die Oberfläche den vollen Pfad. |
| A-19.27 | Eine E-Mail **ohne** Dateianhänge ergibt genau **einen** Anhang: die E-Mail. |
| A-19.28 | Die Übernahme von Titel, Beschreibung, Tags, Pool, Frist und allen übrigen Feldern ändert sich nicht. |
| A-19.29 | **Kein Fehlschlag ist still.** Scheitert ein einzelner Anhang, bricht er die übrigen nicht ab — aber das Ergebnis nennt, **wie viele** übernommen wurden und **welche** nicht, mit Namen und Grund. Ein Todo, das mit weniger Anhängen entsteht als die E-Mail trägt, sagt das. |
| A-19.30 | Eine Datei über der Größengrenze wird übersprungen und nach A-19.29 namentlich gemeldet. Die Grenze gilt **je Datei**; die Rumpfgrenze der übrigen Routen (B-1.7) bleibt davon unberührt. |
| A-19.31 | Steht der Weg zur ursprünglichen Nachricht nicht offen — das Postfach gibt ihn nicht her, die benötigte Outlook-Fassung fehlt —, entsteht das Todo trotzdem, und **was fehlt, steht dabei**. Ein stiller Ausfall der Anhangsübernahme ist ausgeschlossen. |
| A-19.32 | Das Add-in fordert **kein weitergehendes Recht** als bisher. Die Nachricht als Datei zu lesen genügt mit dem Recht, das es für die geöffnete Nachricht ohnehin hat; ein Zugriff auf das Postfach über die geöffnete Nachricht hinaus ist ausgeschlossen. |
| A-19.34 | Die **Datensicherung trägt die übernommenen Dateien mit** — die Bytes, nicht nur den Verweis darauf. Eine Sicherung, auf einem anderen Rechner eingespielt, gibt alle Anhänge wieder her. Das gilt für die Nachricht wie für ihre Anhänge und ist dieselbe Zusage, die für Bildanhänge bereits besteht. |
| A-19.33 | **Abnahme:** Ein Todo, aus einer E-Mail mit zwei Dateianhängen angelegt, trägt danach **drei** Anhänge — die E-Mail als Datei und die beiden ursprünglichen Dateien. |

---

## 20. Datensicherung und Datenmigration

Nachtrag des Auftraggebers vom 2026-09-08. Der Datenexport dieses Abschnitts ist eine
vollständige Datensicherung und ausdrücklich nicht der Abrechnungsexport aus Abschnitt 8.

| ID | Anforderung |
|---|---|
| A-20.1 | In den Einstellungen lässt sich eine vollständige Datensicherung als anwendungsunabhängige JSON-Datei herunterladen und wieder einlesen. |
| A-20.2 | Das eigene Archiv trägt eine eindeutige Formatkennung, eine ganzzahlige Schemafassung, den Erzeugungszeitpunkt und den Erzeuger. Unbekannte Fassungen werden abgewiesen statt geraten. |
| A-20.3 | Das Archiv enthält alle fachlichen Daten: Aufgaben, Vermerke, Tags und Ordner, Status, Fristen, Zeitbuchungen und Timerzustand, Anhänge samt Bildkopien, Pools und Regeln, Standard-Tags, Exportvorlagen, Exportläufe und -protokoll sowie Anwendungseinstellungen. Zugriffstoken und das interne Migrationsbuch sind ausgeschlossen. |
| A-20.4 | Export und anschließender Re-Import stellen denselben fachlichen Bestand einschließlich Kennungen, Zeitstempeln, Beziehungen und Protokollen wieder her. |
| A-20.5 | Vor dem Ersetzen des Bestands verlangt die Oberfläche eine ausdrückliche Bestätigung und weist auf den Verlust nur lokal vorhandener Änderungen hin. Ein ungültiges Archiv verändert nichts. |
| A-20.6 | Das Format ist durch seine Schemafassung versionierbar. Eine künftige Änderung der Tabellen oder Bedeutung verlangt eine bewusste neue Fassung und einen eigenen Einlesepfad. |
| A-20.7 | Takt importiert Todoist-Projektdateien im CSV-Format und Datensicherungen von Super Productivity im JSON-Format. Fremdimporte ergänzen den Bestand; sie ersetzen ihn nicht. |
| A-20.8 | Soweit im Quellformat vorhanden, werden Aufgaben, Projekte, Bereiche, Labels/Tags, Prioritäten, Fristen, Vermerke/Beschreibungen, Unteraufgaben, Erledigt-Zustand, erfasste Zeiten und weitere Metadaten übernommen. |
| A-20.9 | Nicht nativ darstellbare Beziehungen oder Metadaten bleiben nachvollziehbar im Vermerk der importierten Aufgabe erhalten. Projekte werden als Projekt-Tags und Pools, Bereiche, Labels und Prioritäten als getrennt gruppierte Tags abgebildet. |
| A-20.10 | Todoist-Importe liegen in einem eigenen, benannten Importordner. Super-Productivity-Importe übernehmen die Tag-Struktur direkt auf oberster Ebene. Namenskonflikte mit vorhandenem Bestand werden durch nummerierte Zusätze aufgelöst. |

Super-Productivity-Import: Call-Nummern werden mit einem einstellbaren Regex aus dem Titel extrahiert (Vorgabe `call[\s#:_-]*(\d{5,6})`, ohne Groß-/Kleinschreibung). Die erste Klammergruppe liefert die Nummer, ohne Gruppe gilt der gesamte Treffer; ein leeres Muster deaktiviert die Erkennung. Das Muster wird im Importbereich auf diesem Gerät gemerkt. Ungültige oder zu langsame Muster brechen vor Schreibzugriffen ab. LINK- und FILE-Anhänge werden nach Prüfung als Verweise beziehungsweise Dateipfade im Anhangsbereich angelegt. Dateiinhalte sind im Fremdbackup nicht enthalten. Nicht unterstützte Anhänge bleiben mit Importhinweis im Aufgabenvermerk erhalten. Tag-Ordner aus `menuTree.tagTree` werden einschließlich Unterordnern und leeren Ordnern übernommen. Tag-Zuordnungen verwenden die Quellkennungen, damit gleiche Namen in verschiedenen Ordnern getrennt bleiben. Die Tag-Struktur steht direkt auf oberster Ebene, ohne Import- oder Labels-Ordner. Zusätzliche Gruppen für Projekte und Bereiche entstehen nur bei vorhandenem Inhalt; Projektnamen erhalten keinen Produktpräfix. OutlookBridge-Leistungsnachweise werden anhand ihrer Datumszeilen den Tagesbuchungen zugeordnet; die vollständigen Originalnotizen bleiben an der Aufgabe. Undatierte Texte werden nur bei genau einem erfassten Tag zugeordnet. Maßgeblich ist `timeSpentOnDay`, ohne doppelte Elternsummen; Plugin-Dauerzeilen erzeugen keine zusätzlichen Zeiten. Unbekannte Startzeiten erhalten den ausdrücklich ausgewiesenen Platzhalter 08:00 UTC. Bereits übertragene Tage (Plugin-Tagesmarker oder Eingetragen-Tag) werden standardmäßig mit Herkunftsvermerk ausgebucht und vom erneuten Export ausgeschlossen; die Importauswahl kann dies deaktivieren.

---

## 21. Produktname und Layout

Nachtrag des Auftraggebers vom 2026-09-08: Umbenennung von Takt in SuperTakt und
Überarbeitung der als KI-generiert empfundenen Oberfläche.

| ID | Anforderung |
|---|---|
| A-21.1 | Der sichtbare Produktname lautet SuperTakt, einschließlich Desktop-Fenster, Menü, Meldungen und Outlook-Add-in. |
| A-21.2 | Navigation, Dashboard und gemeinsame Oberflächen erhalten eine klarere Gewichtung und weniger gleichförmige Kartenflächen. |
| A-21.3 | Vorhandene Daten, Schnittstellen, Statuskennzeichnungen und Bedienabläufe bleiben kompatibel. |
| A-21.4 | Unter Einstellungen → Darstellung bleibt das klassische Layout für alle Themes erhalten. Klassisch ist der Standard. Die Auswahl umfasst zusätzlich Arc, Cybr, Dark-base, Dracula, Everfrost, Glass, Lines, Liquid-Glass, Nord-Polar-Night, Nord-Snow-Storm, Plainspace, Rainbow, Zen, Velvet und alle vier Catppuccin-Varianten. Farbmodus und Zeilendichte werden separat gespeichert; feste helle/dunkle Paletten wenden ihren Modus an, ohne die Farbmodus-Vorliebe zu überschreiben. Die alte Auswahl Klar wird klassisch dargestellt. |
| A-21.5 | Datenarchive enthalten die Darstellungseinstellungen ab Schemafassung 2. Archive der bisherigen Fassung 1 werden mit Klassisch und angenehmer Dichte eingelesen; unbekannte Fassungen werden weiterhin abgewiesen. |

---

## 22. Leistungsabfrage beim Timerstopp

Nachtrag des Auftraggebers: Die Leistungsabfrage beim Stoppen soll einstellbar sein.

| ID | Anforderung |
|---|---|
| A-22.1 | Einstellungen → Timer enthält „Leistung beim Stoppen abfragen“. Die Auswahl wird dauerhaft gespeichert; der bisherige Standard bleibt eingeschaltet. |
| A-22.2 | Ausgeschaltet stoppt ein ausdrücklicher Stopp den Timer ohne Leistungsdialog und bucht die Zeit. Vorhandener Leistungstext bleibt erhalten; fehlende Leistung kann in der Buchungsübersicht nachgetragen werden. Die Exportregeln bleiben bestehen. |
| A-22.3 | Fehler beim direkten Stopp werden sichtbar gemeldet. Mehrere Stop-Klicks während derselben Anfrage erzeugen keine weiteren Stoppanfragen. Die Bestätigung beim Wechsel auf einen anderen laufenden Timer und die Wiederherstellung verwaister Timer bleiben erhalten. |
| A-22.4 | Archivfassung 3 sichert die Timer-Einstellung. Die Fassungen 1 und 2 bleiben lesbar und erhalten für die Leistungsabfrage den bisherigen Standard. |

---

## 23. Lokale Outlook-Einrichtung

Nachtrag des Auftraggebers: Lokaler Einrichtungsassistent mit ausdrücklicher
Bestätigung des Zertifikats; keine Bereitstellung über eine Domain.

| ID | Anforderung |
|---|---|
| A-23.1 | Einstellungen → Outlook-Add-in zeigt den lokalen Zertifikatsinhaber, Aussteller, SHA-256-Fingerabdruck, Gültigkeit und den HTTPS-Zustand. |
| A-23.2 | Erst nach ausdrücklicher Bestätigung darf die Desktop-Hülle das angezeigte Zertifikat in CurrentUser/Root unter Windows hinterlegen. Die zusätzliche Windows-Sicherheitsabfrage bleibt erhalten; für ihre Bestätigung stehen drei Minuten zur Verfügung. Keine automatische Installation, keine Rechteerhöhung, keine Änderung von Unternehmensrichtlinien. |
| A-23.3 | Die Hülle bestimmt den Zertifikatspfad selbst. Der Auftrag enthält nur den bestätigten Fingerabdruck. Geänderte, ungültige, abgelaufene oder nicht lokale Zertifikate werden abgewiesen; CA-Zertifikate und zusätzliche DNS-Namen sind ausgeschlossen. Der private Schlüssel verlässt seine Datei nicht. |
| A-23.4 | Nach der Bestätigung wird die Add-in-Seite über Loopback mit regulärer Windows-TLS-Prüfung und Abgleich des Serverzertifikats geprüft. Ein Eintrag im Zertifikatsspeicher allein gilt nicht als erfolgreicher HTTPS-Test. |
| A-23.5 | Fehler, nicht erreichbare Seiten und nicht unterstützte Betriebsarten werden sichtbar erklärt. Browserbetrieb und andere Betriebssysteme behaupten keine Windows-Vertrauensprüfung. Manifestimport und Tokenverbindung bleiben explizite nächste Schritte. |

---

## 24. Inaktivität und Rückkehr

Nachtrag des Auftraggebers: Inaktivitätsanzeige und anschließende Zeitaufteilung,
angelehnt an Super Productivity. Eigenständige Umsetzung für SuperTakt.

| ID | Anforderung |
|---|---|
| A-24.1 | In der Desktop-App wird die systemweite Inaktivität der aktuellen Sitzung verwendet: Windows über GetLastInputInfo, macOS über CoreGraphics, Linux über Wayland ext-idle-notify, GNOME Mutter oder X11 ScreenSaver. Arbeit in anderen Programmen zählt als Aktivität. Keine Eingabeinhalte, Fenstertitel oder Telemetrie. Im Browser und bei fehlender Systemschnittstelle wird keine automatische Erkennung behauptet. XWayland wird nicht als Ersatz für systemweite Wayland-Aktivität verwendet. |
| A-24.2 | Einstellungen → Timer enthält einen Ein-/Ausschalter und eine Schwelle von 1 bis 120 Minuten, zunächst eingeschaltet mit 5 Minuten. Speicherung in SQLite und Datensicherung. Ausschalten verwirft keine bereits erkannte Phase. |
| A-24.3 | Bei laufendem Timer und überschrittener Schwelle wird die Abwesenheit vorgemerkt; der Timer läuft weiter. Erst bei der Rückkehr wird die aktive Zeit vor der Abwesenheit abgeschlossen und der Timer atomar ab dem Rückkehrzeitpunkt fortgeführt. Die inaktive Zeit wartet separat auf Zuordnung. Eine Rückkehr, die zwischen Webview-Abfragen liegt, wird aus dem nativen Verlauf erkannt. |
| A-24.4 | Bei der Rückkehr erscheint ein Dialog mit Zeitraum und Dauer: als Pause auslassen, auf eine Aufgabe buchen oder in mehrere Aufgaben-/Pausenabschnitte aufteilen. Aufgaben sind suchbar, auch erledigte. Leistungstext ist freiwillig und nachträglich ergänzbar. |
| A-24.5 | Die Summe muss sekundengenau dem gesamten Zeitraum entsprechen. „Rest übernehmen“ ergänzt einen Abschnitt. Keine negativen/überzähligen Zeiten, keine überlappenden Teilstücke. Alle Buchungen entstehen atomar; ein Fehler erhält den offenen Zustand, Wiederholungen buchen nicht doppelt. Abrechnungsrundung bleibt ausschließlich Sache des Exports. |
| A-24.6 | Der Rückkehrzeitpunkt friert den Zeitraum ein. Der Timer läuft während des Dialogs und nach „Später“ weiter. Die Zuordnung verändert keinen inzwischen gewechselten oder manuell gestoppten Timer. Timerwechsel sind nach der Rückkehr auch bei offener Zuordnung möglich. Der Dialog zeigt Dauer und die drei Optionen Pause, Gearbeitet und Aufteilen; weitere Felder erscheinen nur bei Bedarf. |
| A-24.7 | Offene Phasen überleben Neuladen, Neustart und Datensicherung. Ab Archivfassung 4 enthält das Archiv Einstellungen und Phase; Fassungen 1–3 werden mit bisherigen Defaults ohne offene Phase übernommen. Ein nicht automatisch erkanntes Wiederkommen kann ausdrücklich bestätigt werden. *Die Fassung wird hier nicht mehr beziffert — sie stand am 2026-09-10 auf 4 im Papier und auf 5 im Code (T-245-2). Die führende Angabe ist `DATA_ARCHIVE_VERSION`; was jede Fassung enthält, steht in A-20 und in `docs/datenmodell.md`.* |

---

## Anhang A — Was nicht vorliegt

- Der klickbare Framer-Prototyp (`docs/prototype/takt-ui-konzept.html`). Bis er nachgereicht
  wird, ist diese Spezifikation zusammen mit dem Designsystem aus Aufgabe T-006 die verbindliche
  Referenz.
- Die zwei Referenzbilder für das Outlook-Add-in aus Abschnitt 10.

Das Timerverhalten bei Inaktivität ist unter Einstellungen → Timer wählbar: Weiterlaufen (Standard) oder bis zur Zuordnung pausieren. Im Pausenmodus bleibt der Timer auch bei „Später“ pausiert und startet nach dem Speichern der Zuordnung wieder.
