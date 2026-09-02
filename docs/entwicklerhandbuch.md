# Entwicklerhandbuch — Takt

Dieses Dokument richtet sich an den nächsten Menschen, der an Takt arbeitet. Es beschreibt den
Aufbau des Projekts, die Gründe hinter den wichtigsten Entscheidungen und, im letzten
Hauptabschnitt, die Fehler, die dieses Projekt bereits gemacht und behoben hat. Wer diesen
Abschnitt überspringt, macht sie mit einiger Wahrscheinlichkeit noch einmal.

Quellen für alles hier: `.claude/team/decisions.md` (51 Entscheidungen mit Begründung),
`docs/architektur.md`, `docs/datenmodell.md`, `docs/glossar.md` und die rund fünfzig Berichte
unter `.claude/team/reports/`. Wo eine Aussage aus einer dieser Quellen stammt, steht die
Fundstelle dabei.

---

## Projektaufbau

Takt ist ein pnpm-Arbeitsbereich mit acht Paketen: vier unter `packages/` und vier unter `apps/`.

```
packages/
  domain/        Fachlogik. Kennt weder HTTP noch SQL, keine Laufzeitabhängigkeit (E-001).
  storage/       Ausgehende Ports und der austauschbare SQLite-Adapter (E-001, E-035).
  export/        Der Exportvorlagen-Motor. Rein, ohne Ports, ohne Dateizugriff (E-005, E-017).
  ui-tokens/     Farb-, Schrift-, Abstands- und Schatten-Token als geteiltes CSS (E-040).
apps/
  local-api/     Der lokale Dienst. Node-Sidecar, eingehender Adapter plus Anwendungsfälle (E-004).
  web/           Die Oberfläche. React, Vite, TypeScript.
  desktop/       Die Tauri-Hülle: Fenster, Menü, Sidecar-Lebenszyklus, Windows-Benutzername.
  outlook-addin/ Das Outlook-Add-in. Office.js, TypeScript, eigener Vite-Bau.
```

Jeder Pfad hat genau einen Besitzer (Tabelle unten unter „Dateihoheit im Team"), damit zwei
Beteiligte nie dieselbe Datei gleichzeitig ändern. Gemeinsame Dateien wie das Wurzel-`package.json`,
`pnpm-workspace.yaml` oder die Reihenfolge der Datenbankmigrationen ändert nur, wer die
Gesamtverantwortung für das Projekt trägt.

## Lehren, die dieses Projekt teuer bezahlt hat

Vier Muster sind in diesem Projekt mehrfach aufgetreten, jedes davon nachweislich, jedes davon
mit echtem Schaden am Rand. Sie stehen hier zuerst, weil sie sich beim nächsten Feature genauso
leicht wiederholen lassen wie beim letzten.

### Dieselbe Fachregel entsteht immer wieder an einer zweiten Stelle

Sechsmal ist in diesem Bestand dieselbe Regel unabhängig ein zweites Mal geschrieben worden, statt
sie an einer Stelle aufzurufen: die Rundung, die Plausibilisierung der Call-Nummer, die Zustandsform
der Anwendungshülle, die Berechnung des Kalendertags in der Oberfläche, die Liste der
Exportfeldquellen und, zuletzt und am teuersten, die Berechnung des Kalendertags noch einmal in
SQL (`packages/domain/src/kernel.ts`, Kommentar zu `calendarDayBounds`; `docs/datenmodell.md`
8.4a). Jede einzelne Doppelung wurde gefunden, weil sie an einer Nahtstelle zweier Schichten
sichtbar wurde, nicht weil sie beim Schreiben auffiel.

Die letzte und teuerste: `packages/storage/src/sqlite/repo-time.ts` filterte Zeitbuchungen mit
SQLite `date(started_at)`, also nach dem UTC-Tag, während der Export über `toCalendarDay` den
Kalendertag in Ortszeit bestimmt (E-025). Beide Fassungen stimmen tagsüber überein und
widersprechen sich in der Nacht: `date('2026-08-31T23:30:00Z')` ist der 31. August, derselbe
Zeitpunkt ist in Europe/Berlin bereits der 1. September. Jede Buchung, die zwischen 00:00 und
02:00 Uhr Ortszeit beginnt, lag deshalb für die Filterung an einem anderen Tag als für die
Rundung, die auf diesem Tag aufbaut. Der Fund kam aus dem Code-Review (T-024), nicht aus einem
Test: Kein bestehender Fall deckte eine Buchung nahe Mitternacht ab.

Behoben wurde das nicht durch eine dritte Fassung der Regel, sondern durch eine einzige Funktion
in der Domäne, `calendarDayBounds`, die die UTC-Grenzen eines Kalendertags in einer gegebenen
Zeitzone liefert. Der SQLite-Adapter vergleicht seither nur noch lexikographisch gegen diese
Grenzen und rechnet selbst nichts mehr. Ein zweiter Adapter, sollte er je entstehen, ruft dieselbe
Funktion auf, statt sie neu zu erfinden.

**Regel für das nächste Mal:** Sobald eine Berechnung, die über Geld oder über eine
Datenschutzgrenze entscheidet, an einer zweiten Stelle im Code auftaucht und sei es nur, weil eine
Schicht (SQL, eine Oberfläche, ein Add-in) die Funktion der anderen Schicht nicht direkt aufrufen
kann, ist das ein Befund, kein Kompromiss. Die Regel gehört nach `packages/domain`, aufrufbar von
jeder Seite. Wenn eine Schicht sie im Moment nicht aufrufen kann (SQL kann keine TypeScript-Funktion
aufrufen), ist die Antwort, die Berechnung in dieser Schicht so klein wie möglich zu halten und die
eigentliche Regel drumherum zu bauen, so wie es der SQLite-Adapter seit der Behebung tut, nicht,
die Formel zweimal zu schreiben.

### Eine Prüfung war grün, weil sie nichts mehr prüfte

Dreimal hat sich herausgestellt, dass eine Prüfung nicht deshalb bestand, weil das geprüfte
Verhalten stimmte, sondern weil die Prüfung selbst nichts mehr fand.

Der Wächter gegen eine doppelt geschriebene Plausibilisierungsregel suchte nach zwei
Kennzeichen im Quelltext. Eine testweise eingefügte Zweitfassung mit maskiertem Schrägstrich blieb
davon unentdeckt, weil der Suchausdruck an genau dieser Stelle zu genau gefasst war. „Ohne die
Mutationsprobe wäre der Wächter grün gewesen und blind." (T-028) Erst der Versuch, den Wächter mit
Absicht zu überlisten, zeigte, dass er es zulässt.

Der Trigger, der eine Protokollzeile vor einem widersprüchlichen Statuswechsel schützen soll, bekam
seinen Nachweis lange über einen einzigen eingefügten Fall. Ein Trigger, der aufgehört hätte zu
prüfen, wäre an derselben Stelle ebenfalls grün gewesen. Erst eine Gegenprobe, die absichtlich eine
Reihenfolge herstellt, die der Trigger eigentlich abweisen muss, und die belegt, dass er es
tatsächlich tut, macht aus dem einen Fall einen Beweis (T-047, `proof:export` Abschnitt 12).

Der Vergleicher, der die OpenAPI-Beschreibung des Dienstes gegen dessen tatsächliche Antworten
hält, hätte selbst kaputt sein können, ohne dass es aufgefallen wäre: Ein Leser oder ein
Vergleicher, der eine Abweichung verschluckt, ist „der schlimmste Fall: grün, weil er nichts
findet" (`docs/architektur.md`, Abschnitt 5). Deshalb hält `scripts/proof-openapi.mjs` dem
Vergleicher inzwischen sieben bekannte, künstlich eingebaute Abweichungen hin und verlangt, dass er
jede einzelne findet, bevor er der echten Beschreibung vertraut wird.

**Regel für das nächste Mal:** Eine Prüfung, die niemals rot werden kann, prüft nichts, sie
dokumentiert nur eine Hoffnung. Jeder Wächter, jeder Trigger und jeder Vergleicher, der Verhalten
gegen eine Erwartung hält, verdient eine Gegenprobe: einmal absichtlich das falsche Verhalten
herbeiführen und nachsehen, ob die Prüfung das bemerkt. Ohne diese Gegenprobe ist unbekannt, ob die
Prüfung etwas taugt oder nur so aussieht.

### Ein Wettlauf, unsichtbar in drei von vier Läufen

`packages/storage/src/sqlite/ids.ts` erzeugt Kennungen nach UUID Fassung 7 und verspricht dabei
„nach Erzeugungszeit sortierbar". Ein Datenbanktrigger (`trg_time_entry_exported_needs_provenance`,
Migration 0006) verließ sich genau darauf: Er sucht die jüngste Protokollzeile einer Buchung mit
`ORDER BY occurred_at DESC, id DESC`. Beide Teile dieser Sortierung trugen nicht. `occurred_at` hat
Sekundenauflösung, und die zwölf Bit hinter der Versionskennung der Kennung kamen aus
`crypto.randomBytes`, also aus reinem Zufall. Fielen zwei Protokollzeilen derselben Buchung in
dieselbe Sekunde, war die Reihenfolge der beiden Kennungen ein Münzwurf.

Ein automatischer Testlauf, der den Dienst einmal aufbaut und jede Route anfährt, wurde deshalb
„in etwa drei von vier Läufen grün und im vierten rot" (`docs/architektur.md`, Abschnitt 5, T-041):
`POST /time-entries/{id}/not-billed` scheiterte mit einem Serverfehler, sobald der Zufall gegen die
erwartete Reihenfolge fiel. Die Folge war schlimmer als der sichtbare Fehler: Der Trigger brach in
diesem Fall das eigentliche Update ab, aber die bereits eingefügte Protokollzeile blieb stehen,
weil ein fachlicher Fehlschlag im Adapter als Rückgabewert gemeldet wird und keine Transaktion
zurückrollt. Am Ende stand ein Protokoll, das bezeugte, eine Buchung sei nicht abzurechnen, während
die Buchung selbst weiterhin offen war und in den nächsten Export gehen konnte.

Zwei unabhängige Maßnahmen beheben das, nicht eine: Die Kennungserzeugung bekam einen echten
Zähler in den zwölf Bit hinter der Version, sodass zwei Kennungen innerhalb derselben Millisekunde
nachweislich in Erzeugungsreihenfolge bleiben (geprüft an 20 000 Kennungen in Folge). Und der
betroffene Schreibvorgang bekam einen Sicherungspunkt, damit ein Fehlschlag beim zweiten Schritt
den ersten wieder zurücknimmt, unabhängig davon, wie die Kennungen sortiert sind.

**Regel für das nächste Mal:** Ein Wettlauf, der nur bei einer bestimmten Verteilung von
Zufallswerten auftritt, zeigt sich nicht in jedem Lauf, und ein einzelner grüner Testlauf beweist
seine Abwesenheit nicht. Wo eine Reihenfolge oder Eindeutigkeit für eine fachliche Zusicherung
vorausgesetzt wird, wie hier „nach Erzeugungszeit sortierbar", gehört sie tatsächlich gemessen,
über viele Wiederholungen, nicht nur angenommen, weil der Name der Funktion es verspricht.

### Ein abgelehntes Ergebnis, das trotzdem stehen bleibt

Die Transaktionsklammer im Speicherungspaket nimmt nur zurück, was **geworfen** wird. Ein
fachlicher Fehlschlag ist dort aber als **Wert** modelliert (`Result<T, TaktError>`), aus gutem
Grund: Ein Anwendungsfall soll nicht bei jedem erwarteten Fehlschlag abstürzen. Beide
Entscheidungen sind für sich richtig. Zusammen ergeben sie eine Lücke, die keiner der beiden Seiten
für sich ansieht: Schreibt eine Methode zwei Anweisungen nacheinander und meldet den Fehlschlag der
zweiten nur als Wert, bleibt die erste Anweisung geschrieben, obwohl die Transaktionsklammer genau
das ausschließen sollte.

Eine gezielte Durchsicht aller sieben Speicherungs-Repositorien fand **sieben Stellen** dieser Art,
sechs davon außerhalb des Exports. Vier davon wurden einzeln nachgestellt, indem der jeweilige
Sicherungspunkt versuchsweise entfernt und der Nachweispfad erneut gefahren wurde (T-047,
`docs/architektur.md` 3.3b):

| Stelle | Was ohne Sicherungspunkt stehen bleibt |
|---|---|
| Statusspalte umbenennen und zur Standardspalte erklären, mit einem bereits vergebenen Namen | ein Kanban-Brett ganz ohne Standardspalte; jedes neue Todo scheitert danach |
| Eine neue Statusspalte mit bereits vergebenem Namen anlegen | alle Positionen ab der Zielstelle um eins verschoben |
| Ein Todo in eine neue Spalte verschieben, während derselbe Aufruf einen unbekannten Tag mitschickt | das Todo steht in der neuen Spalte, obwohl die Anfrage insgesamt abgewiesen wurde |
| Einen Exportlauf mit einer bereits vorhandenen Tagesgruppe protokollieren | ein Exportlauf ohne zugehörige Datei, und die betroffene Buchung gilt als exportiert |

Der letzte Fall ist der teuerste: Eine Buchung gilt danach als exportiert, ist damit gesperrt und
erscheint in keinem weiteren Export, aber es gibt keine Datei, in der sie tatsächlich steht.
Abgerechnete Zeit, die nie in einer Rechnung stand, und niemand vermisst sie, weil nichts danach
sucht.

Alle sieben Stellen sind inzwischen in denselben wiederverwendbaren Baustein gefasst
(`packages/storage/src/sqlite/atomic.ts`), der zwischen einem geworfenen Fehlschlag (eine
SQLite-Störung) und einem als Wert gemeldeten Fehlschlag (zum Beispiel ein `UPDATE`, das keine Zeile
trifft) unterscheidet und in beiden Fällen den bereits geschriebenen Teil zurücknimmt.

**Regel für das nächste Mal:** Sobald eine Methode innerhalb einer Transaktion mehr als eine
schreibende Anweisung enthält und irgendeine davon ihren Fehlschlag als Wert statt als Wurf meldet,
braucht diese Methode einen eigenen Sicherungspunkt um genau diese Anweisungen. Der Test dafür ist
einfach zu formulieren und leicht zu vergessen: den Sicherungspunkt versuchsweise entfernen und
prüfen, was von einem erzwungenen Fehlschlag übrig bleibt.

## Domäne, Ports und Adapter: warum diese Trennung

Der Auftraggeber hat früh festgelegt, dass Takt „zumindest derzeit" ohne Cloud- oder
Datenbankanbindung läuft (E-001). Dieser Nebensatz wird architektonisch ernst genommen: Sollte sich
das eines Tages ändern, darf sich nur der Adapter ändern, nicht die Fachlogik.

Deshalb kennt `packages/domain` weder HTTP noch SQL noch irgendeine Fremdbibliothek. Es importiert
nichts außer sich selbst. Alles, was über Geld oder über eine Datenschutzgrenze entscheidet, die
Rundung, der Exportstatuswechsel, die Timer-Regeln, die Zyklusprüfung im Tag-Baum, die
Pool-Ableitung, die Tagesgruppierung, wohnt hier, als reine Funktion: gleiche Eingabe, gleiche
Ausgabe, kein Zugriff auf Uhr, Dateisystem, Netz oder Datenbank. Selbst die Uhr ist ein Port
(`ClockPort`), damit sich ein Anwendungsfall mit einer festen Zeit prüfen lässt, ohne die
Systemzeit zu verstellen.

`packages/storage` beschreibt in der Sprache der Domäne, was die Anwendungsfälle von der
Speicherung brauchen, und setzt das für SQLite um. Der Adapter ist die einzige Stelle im Projekt,
an der SQL-Text entsteht, und jeder Wert geht als Parameter hinein, nie als zusammengesetzte
Zeichenkette. `apps/local-api` übersetzt HTTP-Anfragen in einfache Werte und ruft die
Anwendungsfälle auf; kein Modul unter `src/usecases/` bindet die HTTP-Bibliothek ein, und keine
Datei unter `src/routes/` enthält eine Fachregel. Diese Trennung ist im Quelltext erzwungen, nicht
nur vereinbart: Ein automatisierter Lauf (`pnpm boundaries`) prüft die erlaubten Importe zwischen
den Paketen bei jedem Durchlauf.

`packages/export`, der Vorlagen-Motor, bekommt keine Ports, sondern ausschließlich fertige Werte.
Er hat also keinen Zugang zur Datenbank und kann den persönlichen Vermerk eines Todos schon deshalb
nicht lesen, weil er nichts lesen kann. Das ist eine von vier unabhängigen Schichten, die die
Trennung zwischen Vermerk und Leistung absichern (`docs/architektur.md`, Abschnitt 4): eine eigene
Tabelle für den Vermerk, eine eigene Sicht ohne diese Spalte für den Export, ein enger
Einstiegspunkt in die Domäne, der den Vermerk gar nicht kennt, und eine geschlossene Liste
erlaubter Exportfeldquellen, gegen den Typprüfer abgesichert. Jede dieser vier Schichten hält die
Grenze für sich; zusammen halten sie sie auch dann, wenn jemand eine davon versehentlich aufweicht.

## Speicherung: eingebettetes SQLite über Ports

Gespeichert wird in einer einzelnen SQLite-Datei, angesprochen über `node:sqlite`, das mit Node
selbst mitgeliefert wird (E-035). Das war nicht die ursprüngliche Wahl: Vorgesehen war zunächst
`better-sqlite3`, eine Bibliothek mit einer nativen Erweiterung. Da der lokale Dienst als
eigenständige Binärdatei gebündelt wird (E-044), ist ein natives Modul in diesem Bündel
erfahrungsgemäß die anfälligste Stelle, und `node:sqlite` bringt genau dieses Risiko nicht mit.
Der Preis ist, dass das Modul in der verwendeten Node-Fassung noch als experimentell gekennzeichnet
ist.

Die Ports geben durchgehend `Promise` zurück, obwohl `node:sqlite` selbst synchron arbeitet. Das ist
kein Versehen: Ein späterer Adapter gegen einen entfernten Dienst wäre zwangsläufig asynchron, und
eine heute synchrone Portfläche müsste bei einem solchen Wechsel an jeder Aufrufstelle umgeschrieben
werden. Die Kehrseite ist, dass zwischen zwei `await`-Punkten innerhalb einer offenen Transaktion
grundsätzlich eine andere Anfrage bedient werden könnte; deshalb reiht `createTransactionPort` alle
Transaktionen in eine Warteschlange, sodass niemals zwei gleichzeitig laufen. Ein Aufruf, der
versucht, aus einer bereits laufenden Transaktion heraus dieselbe Klammer erneut zu öffnen, würde
sich sonst hinter sich selbst einreihen; ein eigener Wächter über den asynchronen
Aufrufzusammenhang weist diesen Fall ab, bevor er in die Warteschlange gerät.

### Speicherorte: `%LOCALAPPDATA%`, nicht `%APPDATA%`

Die Datenbankdatei und der voreingestellte Exportordner liegen unter `%LOCALAPPDATA%\Takt\`
beziehungsweise `~/.local/share/takt/`, nicht unter dem Roaming-Profil (E-018). Der Grund ist
konkret: Ein Roaming-Profil kopiert das dortige Verzeichnis auf einen Dateiserver. Für die
Datenbank hieße das zweierlei Schaden gleichzeitig, Kundendaten würden den Rechner verlassen, was
der ersten Entscheidung des Projekts widerspricht, und unabhängig synchronisierte WAL-Dateien
würden die Datenbank beschädigen. Aus demselben Grund ist die Vorgabe für den Exportordner
ausdrücklich nicht Desktop oder Dokumente, weil beide unter OneDrive umgeleitet sein können.

Die Datenbankdateien selbst liegen mit den engstmöglichen Dateirechten (`0600`) im Verzeichnis
(`0700`). Das war zunächst nicht der Fall: SQLite legt seine Dateien beim ersten Öffnen mit `0644`
an, unabhängig davon, wie eng das umgebende Verzeichnis gesetzt ist, und der Rechtemodus einer
Datei wandert mit, sobald sie kopiert, gesichert oder verschoben wird (`docs/datenmodell.md` 2.5).
Seit T-034 setzt der Sidecar beim Start eine enge `umask`, damit jede künftig angelegte Datei
sofort die richtigen Rechte bekommt, und zieht die Rechte bereits vorhandener Dateien beim Öffnen
zusätzlich nach.

## Die Tauri-Hülle und der Node-Sidecar

### Warum ein Sidecar statt eines Rust-Backends

Tauri bringt keinen eigenen Node-Prozess mit, das Outlook-Add-in braucht aber eine HTTP-Schnittstelle,
und die Fachlogik soll durchgehend TypeScript bleiben (E-002, E-004). Ein Rust-Backend hätte
bedeutet, die Rundung und das Exportformat zweimal zu pflegen, einmal in Rust für die Hülle, einmal
in TypeScript für Oberfläche und Add-in, bei einer Regel, an der unmittelbar Geld hängt. Die Wahl
fiel deshalb auf einen Node-Sidecar, den die Tauri-Hülle startet und beendet: ein Datenpfad für
Oberfläche und Add-in gemeinsam, und ein bewusst dünner Rust-Anteil.

### Start und Lebenszyklus des Sidecars

Der Sidecar entsteht in drei Schritten (`apps/desktop/README.md`, „Wie der Sidecar entsteht"): Der
gesamte lokale Dienst wird mit esbuild zu einer einzigen CommonJS-Datei gebündelt, aus der eine
Node-„Single Executable Application" entsteht, in die anschließend eine geprüfte Node-Laufzeit
eingebettet wird. Die Node-Binärdatei wird dafür von nodejs.org geladen und gegen eine im
Repository hinterlegte Prüfsumme geprüft, aus zwei Gründen: `node:sqlite` gibt es erst ab Node
22.5, und die mit manchen Linux-Distributionen ausgelieferte Node-Fassung lässt sich zwar zu einer
Einzeldatei-Anwendung verarbeiten, stirbt beim Start aber mit einem Speicherzugriffsfehler (E-044).
Die fertige Binärdatei wird nicht blind übernommen: `verify-sidecar.mjs` startet sie gegen ein
Wegwerfverzeichnis und prüft unter anderem beide Startzeilen einzeln und das saubere Ende des
Prozesses, sobald seine Standardeingabe schließt.

Die Hülle übergibt dem Sidecar beim Start zwei Zeilen über dessen Standardeingabe, nicht über
Umgebungsvariablen oder die Befehlszeile: das Sitzungsgeheimnis für die Oberfläche und den
Windows-Benutzernamen (E-042). Beide Kanäle scheiden für die Befehlszeile aus demselben Grund aus,
sie steht jedem lokalen Prozess in der Prozessliste offen. Der Benutzername kommt dabei über
`GetUserNameW` vom Betriebssystem, ausdrücklich nicht aus der Umgebungsvariable `USERNAME`, denn
`set USERNAME=fremder && Takt.exe` würde sonst genügen, um fremde Arbeitszeit unter falschem Namen
abzurechnen (B-8.1). Ohne die zweite Zeile startet der Dienst gar nicht erst.

Zwei voneinander unabhängige Wege beenden den Sidecar wieder: Die Hülle beendet ihn ausdrücklich
beim Schließen des Fensters, und stirbt die Hülle hart, etwa durch Abmeldung oder Absturz, schließt
das Betriebssystem ihr Ende der Standardeingabe-Röhre, was der Sidecar bemerkt und worauf er sich
selbst beendet. Der zweite Weg ist der wichtigere, weil er gerade dann greift, wenn der erste nicht
mehr laufen kann, und ein Sidecar, der unbemerkt weiterläuft, hielte Kundendaten offen, ohne dass
ein Fenster daran erinnert.

### Der Rust-Anteil: bewusst dünn

Der Rust-Code in `apps/desktop/src-tauri` kümmert sich um das Fenster, das Menü, den Lebenszyklus
des Sidecars, das Anlegen des Anwendungsdatenverzeichnisses mit engen Rechten, und das Auslesen des
Windows-Benutzernamens. Keine Fachlogik. Das ist die unmittelbare Konsequenz aus der
Sidecar-Entscheidung: Alles, was über Geld entscheidet, bleibt in TypeScript und in
`packages/domain`, wo es geprüft und mit der übrigen Anwendung geteilt wird.

## Datenbankmigrationen

Jede Migration besteht aus zwei SQL-Dateien mit derselben Nummer, einer für die Vorwärts- und einer
für die Rückwärtsrichtung, und Schema- und Datenänderungen sind bewusst auf getrennte Migrationen
verteilt (`docs/datenmodell.md`, Abschnitt 8). Der Stand steht in einer eigenen Tabelle
(`schema_migration`), zusammen mit dem SHA-256 der jeweiligen Vorwärtsdatei; wurde eine bereits
ausgeführte Migration nachträglich verändert, verweigert der Läufer die Arbeit, statt zu raten.

Jeder einzelne Migrationsschritt läuft in einer eigenen Transaktion. Nach dem letzten Befehl der
Datei prüft der Läufer die Fremdschlüsselintegrität des gesamten Bestands, bevor er festschreibt.
SQLite führt auch Schemaänderungen transaktional aus, anders als etwa MySQL: Bricht eine Migration
mittendrin ab, bleibt kein halb angelegtes Schema zurück.

**Vorwärts.** Vor dem Anwenden fehlender Migrationen legt der Läufer eine vollständige Sicherung
der bestehenden Datenbankdatei an, mit `VACUUM INTO`, nicht mit einer einfachen Dateikopie, denn
eine Kopie einer geöffneten WAL-Datenbank würde den Inhalt des noch nicht geschriebenen Journals
verlieren. Ist der vorgefundene Bestand neuer als die mitgelieferten Migrationen, etwa weil eine
ältere Fassung von Takt eine bereits migrierte Datei öffnet, startet die Anwendung überhaupt nicht.
Diese Prüfung läuft ausdrücklich vor der Prüfsummenkontrolle, weil ein zu neuer Bestand sonst als
„nachträglich verändert" fehlgedeutet würde, obwohl die richtige Antwort „bitte aktualisieren"
lautet.

**Rückwärts.** Jede Migration hat eine Gegenrichtung; eine Vorwärtsdatei ohne zugehörige
Rückwärtsdatei ist ein Fehler beim Einlesen, kein zulässiger Sonderfall. Eine Datenmigration lässt
sich aber nur zurücknehmen, solange niemand auf die von ihr angelegten Zeilen verweist: Die
Migration, die die Standardvorlage anlegt, bricht ihre eigene Rücknahme deshalb ausdrücklich mit
einer sprechenden Fehlermeldung ab, sobald bereits Todos oder Exportläufe existieren, statt entweder
mit einem rohen Fremdschlüsselfehler zu scheitern oder still nur teilweise zu wirken.

Ein Sonderfall lohnt eine eigene Erwähnung, weil er beim nächsten mehrstufigen Rückweg wieder
auffallen wird: Scheitert ein Abstieg über mehrere Fassungen unterwegs absichtlich, etwa weil eine
Migration ihre eigene Rücknahme verweigert, bleibt der Bestand auf der zuletzt **erfolgreich**
zurückgenommenen Fassung stehen, nicht auf der ursprünglichen. Das ist kein halber Zustand, jede
Fassung für sich ist vollständig, aber es ist ein anderer Zustand, als man beim Aufruf erwartet
hätte (`docs/datenmodell.md` 8.4b).

**Was bewusst keine Migration bekommt.** Als die Prüfung der Feldnamen in Exportvorlagen
verschärft wurde, blieben ältere, bereits gespeicherte Vorlagen mit inzwischen unzulässigen
Feldnamen unangetastet, obwohl das denkbar gewesen wäre. Eine Migration hätte die Feldnamensregel
ein siebtes Mal, diesmal in SQL, nachbilden müssen, in einer Sprache, die kein Typprüfer gegen das
Original hält. Der jetzige Zustand, eine unzulässige Vorlage bricht beim Export ab und nennt das
betroffene Feld, ist gemessen und sicher; eine Migration wäre entweder eine Sackgasse (sie liefe
vor dem Start, und der Benutzer käme nicht mehr in die Anwendung, um die Vorlage zu ändern) oder
ein stiller Eingriff in eine abrechnungsrelevante Vorlage ohne Zutun ihres Besitzers
(`docs/datenmodell.md` 8.4a).

## Tagesrundung: Buchungen zu Tagesgruppen zusammenfassen

Vor dem Export wird nicht jede Zeitbuchung einzeln gerundet. Alle noch offenen Buchungen desselben
Todos an einem Kalendertag werden zunächst zu einer Tagesgruppe addiert, und erst die Summe der
Gruppe wird auf die nächste Viertelstunde aufgerundet, mit 0,25 als kleinstem Wert (E-008, E-020).
Der Domänentyp dafür heißt vor dem Export `ExportGroup` (Kandidat, aus `ExportCandidate`-Werten
zusammengesetzt), nach dem Export `ExportRunGroup` in der Datenbank.

### Welcher Kalendertag zählt

Maßgeblich für die Gruppierung ist der Kalendertag, an dem der Timer **gestartet** wurde, nicht der
Tag des Stopps (E-025). Eine Buchung von 23:40 bis 00:20 zählt deshalb vollständig zum Starttag und
wird nicht aufgeteilt. Die Umrechnung zwischen Ortszeit und der in UTC gespeicherten Zeit läuft
ausschließlich über `calendarDayBounds` in `packages/domain/src/kernel.ts`, siehe dazu den
Abschnitt „Lehren, die dieses Projekt teuer bezahlt hat" oben.

### Leistungstexte einer Tagesgruppe zusammenführen

Die Leistungstexte der in einer Gruppe enthaltenen Buchungen werden nach Startzeit sortiert, an den
Rändern getrimmt, und mit `"; "` verbunden; leere Texte werden dabei übersprungen (E-026, E-028).
Enthält ein Text selbst ein Semikolon, wird nichts maskiert oder ersetzt. Ein Escaping wäre
schädlich, weil das Abrechnungstool das Verfahren nicht kennt und die Maskierung wörtlich auf der
Rechnung erschiene; ein Ersetzen durch ein anderes Zeichen würde stillschweigend Kundendaten
verändern. Wer wissen will, welche Buchungen zu einer Exportzeile gehören, fragt die entsprechende
Datenbanktabelle (`export_run_entry`), nicht den zusammengeführten Text.

### Eine Tagesgruppe ohne Leistungstext

Eine Tagesgruppe, deren enthaltene Buchungen sämtlich ohne Leistungstext sind, wird nicht
exportiert, weil das Abrechnungstool eine leere Notiz nicht annimmt (E-034). Sie wird in der
Vorschau als solche gekennzeichnet, hält den übrigen Export aber nicht auf: Die restlichen Gruppen
werden geschrieben, die betroffene bleibt offen und erscheint beim nächsten Export erneut.

## Das Exportvorlagen-Modell

Eine Exportvorlage ist eine geordnete Liste von Feldern, jedes mit einem frei wählbaren Namen im
JSON, einer Quelle, einer Transformation und einer optionalen Bedingung (A-8.7, E-005). Die
Standardvorlage bildet `Call`, `Zeit`, `Notiz` (Base64) und `WindowsUser` exakt ab, ist nicht
löschbar, aber kopierbar. `packages/export` rendert eine solche Vorlage rein aus fertigen Werten,
ohne selbst Ports zu besitzen.

### Geschlossene Auswahlliste statt Freitextpfad

Die Feldquelle wird nicht als freier Pfad eingegeben, sondern aus einer festen, im Code
ausgeschriebenen Liste gewählt (E-017). Ein generischer Pfadauflöser wäre ein Leseweg auf
praktisch alles, was ihm übergeben wird, und würde jedes künftig hinzugefügte Feld automatisch
exportierbar machen, auch eines, das das nie sein sollte. Das ist die vierte und äußerste Schicht
der Notiz-Trennung, siehe oben. Der Dienst liefert diese Liste über eine eigene Route
(`GET /export/sources`) an die Oberfläche aus, statt dass die Oberfläche sie ein zweites Mal
kennt, siehe „Lehren, die dieses Projekt teuer bezahlt hat".

### Gruppenquellen statt `booking.*`

Seit die Tagesgruppe und nicht die Einzelbuchung die Exportzeile bildet, sind alle Feldquellen auf
die Gruppe geschnitten; der frühere Pfad `booking.*` wurde entfernt, nicht umgedeutet (E-033). Ein
entfernter Pfad bricht sichtbar, sobald er benutzt wird; ein Pfad, der weiterhin `booking` heißt,
aber inzwischen die Gruppe meint, bräche still und würde erst in der Abrechnung auffallen, genau
die Art von stillem Bedeutungswechsel, gegen den die Bezeichner-Bereinigung aus T-013 ursprünglich
angetreten ist.

### Die Exportvorschau gliedert nach Tagesgruppen

Vorschau und tatsächliche Datei benutzen denselben Renderer (R-17). Das ist keine Bequemlichkeit,
sondern die einzige Möglichkeit, dass eine Vorschau tatsächlich etwas über den Export aussagt: Zwei
unabhängige Renderer könnten sich unbemerkt auseinanderentwickeln, und dann zeigte die Vorschau
etwas, das die Datei nicht mehr enthält. Wer die Vorschau um ein Detail erweitert, das der Export
selbst nicht auch bekommt, hat diese Zusicherung gebrochen, auch wenn beide Ansichten weiterhin
plausibel aussehen.

## Exportstatus, Zurücksetzen und Protokoll

Der Exportstatus einer Zeitbuchung kennt in Datenbank, Domäne und API ausnahmslos zwei Werte,
`open` und `exported` (A-6.9, E-032). Er lässt sich je Buchung zurücksetzen (E-012), aber niemals
von Hand auf `exported` setzen; dafür gibt es keinen Weg außer einem tatsächlichen Exportlauf oder
dem eigenen Vorgang „nicht abrechnen" (E-047).

Jeder Statuswechsel entsteht zusammen mit einer Protokollzeile in derselben Transaktion, in der
Tabelle `export_audit` (R-10). Diese Tabelle ist anhängend: Ein Trigger verbietet sowohl das Ändern
als auch das Löschen einzelner Zeilen. Ein zusammengesetzter Datenbankzwang erzwingt außerdem, dass
ein Wechsel auf „exportiert" nur stattfinden darf, wenn zugleich ein Exportlauf oder ein
„nicht abrechnen"-Ereignis vorliegt; „beides oder keines" hängt damit nicht an der Sorgfalt eines
einzelnen Adapters, sondern am Datenbankschema selbst.

Das Protokoll kennt drei Ereignistypen: `exported` (aus einem echten Lauf, mit zugehöriger
Exportzeile), `reset` (Zurücksetzen auf offen) und `not_billed` (Ausbuchen ohne Export). Nur der
zweite und der dritte ändern den Status, nur der erste und der dritte führen zu `exported`, und der
Unterschied zwischen ihnen ist genau die Unterscheidung, für die man ein solches Protokoll führt:
Wie viel abgerechnete Zeit wurde tatsächlich exportiert, und wie viel wurde ausdrücklich nicht
abgerechnet.

Der Anzeigezustand einer Buchung ist reicher als ihr gespeicherter Status: „Erneut offen" markiert
eine offene Buchung, die schon einmal exportiert war (`export_count > 0`), „Nicht abgerechnet"
markiert eine exportierte Buchung, die aus einem „nicht abrechnen"-Vorgang stammt statt aus einem
echten Lauf (E-050). Beides bleibt Anzeige. Kein Filter, keine Abfrage und keine Exportauswahl darf
mehr als die zwei tatsächlichen Werte kennen; wer eine dieser Anzeigeformen versehentlich als
eigenen Filterwert behandelt, nimmt einer Buchung die Chance, jemals wieder exportiert zu werden.

## Sicherheit: der lokale Dienst und das Add-in-Token

Der lokale Dienst hört auf `127.0.0.1` und ist damit für jeden Prozess auf demselben Rechner
erreichbar, auch für eine beliebige Webseite im Browser des Benutzers (R-02). Dagegen wirken zwei
unabhängige Maßnahmen, die unterschiedliche Angreifer abwehren, nicht zwei Schichten gegen
denselben:

Der **Nachweis über ein Geheimnis** in der Kopfzeile `X-Takt-Token` wirkt gegen jeden beliebigen
lokalen Prozess; gegen diesen Akteur ist er die einzige wirksame Maßnahme. Die **Herkunftsprüfung**
(Zielrechner, `Origin`, Abrufkontext) wirkt gegen eine fremde Webseite im Browser, weil ein Browser
zu wahrheitsgemäßen Werten gezwungen ist; gegen einen lokalen Prozess, der drei Zeilen Skript
schreibt, ist sie wirkungslos. Wer eine der beiden für eine Reserve der anderen hält, baut sie beim
nächsten Umbau versehentlich weg (`docs/architektur.md`, Abschnitt 6.4).

Es gibt zwei Sorten Geheimnis: ein Sitzungsgeheimnis, das die Hülle bei jedem Start neu über
`stdin` an den Sidecar übergibt und das nie die Festplatte berührt, für die Oberfläche; und das
Add-in-Token, dauerhaft, vom Benutzer in die Add-in-Einstellungen eingetragen. Für welche Route
welcher der beiden Nachweise genügt, entscheidet eine einzige, reine Funktion über den angefragten
Pfad (`access/route-policy.ts`), nicht eine gepflegte Liste von Ausnahmen. Wichtig dabei: Die
Vorgabe ist „alles verlangt das Sitzungsgeheimnis", und nur der schmale Add-in-Pfad senkt diese
Anforderung ausdrücklich ab. Ursprünglich war es umgekehrt gebaut, „alles offen, drei Ausnahmen",
und eine Sicherheitsprüfung zeigte, was ein gestohlenes Add-in-Token damit erreichte: den
persönlichen Vermerk eines beliebigen Todos lesen und überschreiben, den Exportordner auf einen
frei gewählten Pfad setzen und darüber sogleich einen Exportlauf auslösen. Eine Positivliste
vergisst mit der Zeit etwas; eine Negativliste, die alles sperrt und nur das Notwendige öffnet,
lässt eine neue Route ohne weiteres Zutun geschlossen (`docs/architektur.md`, Abschnitt 6.7).

### Token-Ablage: `localStorage`, nicht `roamingSettings`

Das Add-in-Token liegt im `localStorage` der Add-in-Herkunft, ausdrücklich nicht in
`Office.context.roamingSettings` (E-019). Letzteres liegt im Postfach und wird über Exchange oder
Microsoft 365 synchronisiert; ein Geheimnis, das sämtliche lokalen Kundendaten öffnet, würde damit
in die Cloud wandern, gegen die erste Entscheidung dieses Projekts. Der Preis dafür ist ehrlich
benannt: Das Token gilt je Rechner und Browserprofil, nicht postfachweit, wer Outlook an mehreren
Orten nutzt, trägt es mehrfach ein.

### Token erzeugen und neu erzeugen

Das Token entsteht ausschließlich im Dienst selbst, aus 256 Bit kryptografisch sicherem Zufall, mit
dem Präfix `takt_`. Gespeichert wird nur sein SHA-256-Abdruck, nie der Klartext, denn wer die
Ablagedatei liest, ein anderer Benutzer des Rechners, ein Sicherungsprogramm, soll dann einen
Abdruck in der Hand halten, keinen Schlüssel. Der Klartext wird deshalb genau einmal, als Antwort
auf die Erzeugung, herausgegeben und ist danach nicht mehr abrufbar. Jede eingehende Anfrage wird
zeitkonstant gegen diesen Abdruck geprüft, damit die Vergleichsdauer selbst kein Geheimnis
preisgibt. Die Neuerzeugung eines Tokens macht das alte im selben Moment ungültig; es gibt keine
Übergangsfrist und keine Liste mehrerer gültiger Token.

## Tests schreiben

### Werkzeuge

Vitest für Einheiten- und Integrationstests, unter `packages/*/test/` und `apps/*/test/`, neben dem
Paket, das sie prüfen. Playwright für Ende-zu-Ende-Tests unter `tests/e2e/`. Beide laufen getrennt;
`vitest.config.ts` schließt `tests/e2e/**` ausdrücklich aus.

Ein Vitest-Lauf läuft mit fester Zeitzone (`Europe/Berlin`) und fester Sprache. Das ist kein
Zufall: Die Tagesgruppierung im Export hängt am Kalendertag der Startzeit, und ein Test, der in
einer anderen Zeitzone liefe als die Anwendung im Betrieb, würde etwas anderes prüfen, als das
Produkt tatsächlich tut.

Für die drei Pakete, in denen unmittelbar Geld entsteht, `packages/domain`, `packages/storage` und
`packages/export`, gilt eine Abdeckungsschwelle von 80 Prozent in allen vier Maßen (Anweisungen,
Zweige, Funktionen, Zeilen). Die Oberfläche trägt bewusst keine erzwungene Schwelle; dort deckt die
Ende-zu-Ende-Prüfung ab, und eine erzwungene Zahl würde eher zu Tests führen, die einen Baustein
nur rendern, ohne sein Verhalten zu prüfen, als zu besseren Tests.

**Eine Warnung, die dieses Projekt selbst erlebt hat:** Vitest 4 blendet in einer erkannten
Agentenumgebung standardmäßig jede Datei und jedes Verzeichnis aus der gedruckten
Abdeckungstabelle aus, das bereits bei 100 Prozent liegt. `packages/domain/src` verschwand dadurch
zeitweise vollständig und spurlos aus der Anzeige, obwohl die zugrunde liegende Messung und die
Schwellenprüfung durchgehend richtig waren; nur die gedruckte Tabelle log. Die Konfiguration in
`vitest.config.ts` setzt deshalb ausdrücklich `skipFull: false` und erklärt im Kommentar, warum
diese eine Zeile nicht wieder entfernt werden darf.

### Reihenfolge: Tests vor Umsetzung

Für die Fachlogik in `packages/domain` und `packages/export` sind zunächst 155 Testfälle
geschrieben worden, alle absichtlich rot, weil die zugehörige Umsetzung noch fehlte. Für
`packages/domain` allein waren das 70 Fälle; als die Umsetzung dort folgte, waren alle 70 grün,
ohne dass danach eine einzige Testzeile dieser Dateien noch angefasst werden musste. Das ist der
Maßstab, an dem sich eine neue Fachregel messen lassen sollte: Der Test beschreibt zuerst, was
richtig sein soll, unabhängig davon, ob der Code dafür schon existiert.

### Pflichtfälle für die Fachlogik

Unabhängig vom konkreten Feature gehören diese Fälle in jede Prüfung, die eine fachliche Regel
berührt:

- Die vollständige Rundungstabelle, einschließlich der Randwerte (eine Minute, sieben Minuten
  dreißig Sekunden, genau fünfzehn Minuten, sechzehn Minuten).
- Die Trennung von Vermerk und Leistung, geprüft **sowohl im Klartext als auch base64-kodiert**
  gegen das Exportergebnis. Ein Test, der nur den Klartext sucht, besteht bei jeder Vorlage, die
  das Feld über eine Base64-Transformation ausgibt, also genau im Regelfall, und die Grenze könnte
  trotzdem gebrochen sein (R-18).
- Der zweiwertige Exportstatus, über beliebige Filter und Vorlagen hinweg, nicht nur die
  Standardvorlage.
- Zyklen im Tag-Ordnerbaum, einschließlich des Falls, dass ein Ordner unter einen eigenen
  Nachfahren verschoben werden soll.
- Ein erzwungener Abbruch mitten in einer mehrschrittigen Transaktion, mit anschließender Prüfung,
  dass wirklich nichts von den bereits ausgeführten Schritten stehen geblieben ist, siehe „Lehren,
  die dieses Projekt teuer bezahlt hat".

## Das Outlook-Add-in

Das Add-in liegt unter `apps/outlook-addin`, gebaut mit Office.js und TypeScript, mit eigenem
Vite-Bau und eigenem Entwicklungsserver auf Port 17844. Es spricht ausschließlich mit dem lokalen
Dienst, über eine eigens dafür geschnittene, schmale Routengruppe (`/api/v1/addin/*`): den Tag- und
Ordnerbaum lesen, nach einer Call-Nummer suchen, ein Todo anlegen, eine Zeit buchen. Nichts
darüber hinaus, siehe „Sicherheit" oben.

Die Plausibilisierung der erkannten Call-Nummer war ursprünglich zweimal geschrieben, einmal im
Add-in als Bedienhilfe, einmal im Dienst als tatsächliche Vertrauensgrenze, mit einem eigenen
Wächter, der beide Fassungen zusammenhielt. Seit E-045 liegt sie einmal in `packages/domain` und
wird von beiden Seiten aufgerufen; der Wächter ist damit überflüssig geworden. Die Rollen bleiben
trotzdem unterschiedlich: Der Dienst prüft weiterhin selbst und verlässt sich nicht darauf, dass
nur das Add-in ihn aufruft, denn die Regel entscheidet mit, ob ein Zeiterfassungsvorgang auf den
richtigen Kundenvorgang zeigt.

Weil Office ausschließlich HTTPS für den Aufgabenbereich eines Add-ins zulässt, liefert der lokale
Dienst diesen Bereich zusätzlich über einen zweiten Port mit einem selbst erzeugten Zertifikat aus
(E-046). Das Zertifikat entsteht beim ersten Start und muss vom Benutzer einmalig akzeptiert
werden, ein Vorgang, der sich vollständig erst auf einem echten Windows-Rechner mit Outlook prüfen
lässt, siehe „Was nie geprüft werden konnte" unten.

## Dateihoheit im Team

Jeder Pfad im Projekt gehört genau einer Rolle. Das ist keine Formalie, sondern die Voraussetzung
dafür, dass mehrere Beteiligte gleichzeitig arbeiten können, ohne sich gegenseitig zu überschreiben.

| Pfad | Gehört |
|---|---|
| `docs/spec.md`, `docs/prototype/**` | Auftraggeber, nur lesen |
| `packages/domain/**`, `packages/storage/**` | domain-dev |
| `apps/local-api/**` außer `src/routes/addin/` | domain-dev |
| `docs/architektur.md`, `docs/datenmodell.md` | domain-dev |
| `apps/web/**`, `apps/desktop/**` | frontend-dev |
| `packages/export/**`, `apps/outlook-addin/**`, `apps/local-api/src/routes/addin/**` | integration-dev |
| `packages/*/test/**`, `apps/*/test/**` | unit-tester |
| `tests/e2e/**`, `tests/fixtures/**`, `docs/testplan.md` | e2e-tester |
| `docs/bedrohungsmodell.md` | security-checker |
| `docs/**` außer den genannten Ausnahmen, `README.md` | documenter |

Gemeinsame Dateien, das Wurzel-`package.json`, `pnpm-workspace.yaml`, `.claude/settings.json`,
`CLAUDE.md`, die Reihenfolge der Datenbankmigrationen, ändert nur die Gesamtverantwortung für das
Projekt, nicht eine einzelne Rolle. Ein Verstoß dagegen ist kein Stilfehler: Im Verlauf dieses
Projekts hat ein Beitrag versehentlich in zwei Dateien eines fremden Pakets geschrieben
(`packages/export/src/render.ts` und `template.ts`, durch den domain-dev statt den
integration-dev), und ein Code-Review musste die Freigabe deswegen verweigern, obwohl die
inhaltliche Änderung selbst richtig war. Die Regel gilt unabhängig von der Qualität der Änderung.

## Ablauf und Berichte

Arbeit läuft in Wellen. Unabhängige Aufgaben laufen parallel, abhängige Aufgaben folgen in der
nächsten Welle. Beteiligte sprechen nicht direkt miteinander; alles läuft über das Board, die
Berichte unter `.claude/team/reports/` und die Entscheidungen unter `.claude/team/decisions.md`.

Jeder Bericht folgt demselben Schema: Aufgabe, Status, Artefakte, Zusammenfassung, Annahmen,
Risiken, offene Fragen, nächster Schritt. Eine Aufgabe gilt erst als fertig, wenn Code-Review,
Spezifikations- und UX-Prüfung, Test und Sicherheitsprüfung sie freigegeben haben; die
Dokumentation entsteht als Letztes, aus genau diesem Grund.

## Befehle

Von der Wurzel des Arbeitsbereichs aus:

| Befehl | Zweck |
|---|---|
| `pnpm install` | Abhängigkeiten für den gesamten Arbeitsbereich installieren |
| `pnpm dev` | Entwicklungsserver der Oberfläche, `apps/web`, auf `127.0.0.1:5173` |
| `pnpm desktop` | Takt als Tauri-Anwendung starten, baut den Sidecar zuerst mit |
| `pnpm desktop:build` | Takt einschließlich Installationspaket bauen |
| `pnpm typecheck` | `tsc --noEmit` über alle acht Pakete |
| `pnpm boundaries` | erlaubte Importe zwischen den Paketen prüfen |
| `pnpm contrast` | alle Farbpaare der Oberfläche gegen WCAG 2.2 AA messen |
| `pnpm test` | alle Vitest-Fälle unter `packages/*/test` und `apps/*/test` |
| `pnpm test:coverage` | dieselben Fälle mit Abdeckungsbericht und Schwellenprüfung |
| `pnpm proof:openapi` | die OpenAPI-Beschreibung des lokalen Dienstes gegen dessen tatsächliches Verhalten prüfen |
| `pnpm check` | die vollständige Kette: Typprüfung, Paketgrenzen, Kontrast, OpenAPI-Nachweis, Testabdeckung, Bau |

Daneben bestehen in `apps/local-api` und `apps/outlook-addin` neun weitere, einzeln aufrufbare
Nachweispfade (`proof:access`, `proof:export`, `proof:export-api`, `proof:taskpane`,
`proof:addin-wiring`, `proof:route-policy`, `proof:template-fields`, `proof:db-permissions` und,
im Add-in-Paket, `proof:addin`), die zusammen mit `proof:openapi` die zehn Nachweispfade des
Projekts bilden. Sie stehen nicht alle in `pnpm check`, weil ein Teil von ihnen den echten Sidecar
auf seinem festen Port startet und deshalb nicht neben einem bereits laufenden Takt bestehen kann.

## Was nie geprüft werden konnte

Ein ehrliches Handbuch nennt auch die Grenzen dessen, was tatsächlich geprüft wurde, nicht nur die
Grenzen der Software selbst.

- **Eine Windows-Prüfliste mit sechs benannten Punkten** ist bis heute nicht abgearbeitet, weil
  kein Windows-Rechner zur Verfügung stand. Der wichtigste einzelne Punkt darunter: Takt mit einer
  absichtlich gesetzten Umgebungsvariablen `USERNAME` starten und nachweisen, dass trotzdem der
  richtige, vom Betriebssystem gelesene Name im Export landet (B-8.1, E-042). Die übrigen Punkte
  betreffen unter anderem den erzeugten Installer, die Dateirechte unter Windows und die tatsächliche
  Herkunft, die der Webview dort meldet.
- **Die drei Zustände, die die Anwendungshülle beim Start anzeigen kann** (unvollständiger Start,
  beendeter lokaler Dienst, ein mitkopierter Datenordner), lassen sich in der End-zu-Ende-Prüfung
  nicht auslösen, weil dafür ein echter Tauri-Prozess nötig ist, den die vorhandene Prüfumgebung
  nicht bereitstellt.
- **42Crunch**, das für die OpenAPI-Beschreibung vorgesehene Prüfwerkzeug, ist nicht installiert
  und verlangt zusätzlich ein Konto bei 42Crunch, auf das kein Zugriff bestand. Es existiert deshalb
  kein Auditwert und keine Bewertung gegen ein Security Quality Gate für diese Beschreibung, nur
  eine von Hand durchgeführte Ersatzprüfung.
- **`cargo audit` und `cargo deny`** sind nicht installiert; der Rust-Anteil der Anwendung (Tauri,
  die verwendeten Tauri-Plugins und ihre Abhängigkeiten) wurde deshalb nie gegen eine
  Schwachstellendatenbank geprüft. Die verwendeten Fassungen sind über `Cargo.lock` festgeschrieben,
  was Reproduzierbarkeit sichert, aber keine Prüfung ersetzt.

Keiner dieser Punkte ist ein bekannter Fehler. Sie stehen hier, weil eine Dokumentation, die
verschweigt, was ungeprüft blieb, die teuerste Sorte Dokumentation ist.

## Begriffe

Siehe `docs/glossar.md` für die vollständige Begriffsliste mit Anforderungs-ID und Beleg im Code.
