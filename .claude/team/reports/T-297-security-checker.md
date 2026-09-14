# T-297 — Vorabbewertung: Anhänge aus dem Outlook-Add-in (E-108, Abschnitt 19.5)

**Aufgabe:** T-297 — Bewertung **vor** dem Bau: Postfachrecht, fremde Binärdatei im
Datenverzeichnis, Pfad aus fremder Hand am Öffnen-Befehl.
**Status:** fertig — **Urteil: Nacharbeit vor dem Bau.** Bedingungen in 39.12 des
Bedrohungsmodells.

**Artefakte:**

- `C:\Users\kyk\Documents\Repo\SuperTakt\docs\bedrohungsmodell.md` — neues **Kapitel 39**;
  **A-A-21 an Ort und Stelle berichtigt** (Auflagentafel Kap. 20 und Abnahme Kap. 21, nach
  A-A-70), Neufassung **A-A-21′** in 39.7; **VG-12** neu und **VG-13** angelegt und wieder
  gestrichen in Abschnitt 3; **A-06** in Abschnitt 4 erweitert; Werkzeugstand T-297 in
  Abschnitt 0. **20 Auflagen A-A-78 bis A-A-97**, **16 Befunde T-297-1 bis T-297-16**.
- `C:\Users\kyk\Documents\Repo\SuperTakt\.claude\team\reports\T-297-security-checker.md`
- Sonst nichts. Kein `apps/**`, kein `spec.md`, kein `risks.md`.

**Nachgezogen am selben Tag** (A-A-70, Berichtigung jeweils an der Stelle der alten Aussage):
die Entscheidung des Auftraggebers für `getAsFileAsync`, die drei Befunde aus T-298 und die
Frage F-02.

---

## Zusammenfassung

Die Vorlage wurde nicht gelesen, sondern **gefahren**: `sanitizeFileName`/`uniqueTargetPath`
zeichengleich nachgebaut, Node 22 auf Windows 11, 25 Angriffsnamen, echte Dateien, dazu eine
Win32-Gegenprobe aus PowerShell. **25 hinein, 25 auf der Platte, null Ablehnungen.** Pfadausbruch,
absolute Pfade und UNC fängt sie in beiden Schreibweisen; Gerätenamen, Doppelendungen und
Richtungszeichen nicht. Vier von fünf Gerätenamen landen als Datei, die Win32 **nicht sieht** —
dritter Fall der Klasse „geprüfter Name ≠ aufgelöster Name" nach T-156-1 und T-164-1.

Unser eigener `attachment-store.ts` löst dieselbe Aufgabe seit T-156 an jedem offenen Punkt
besser. **A-A-78** macht die ganze Klasse **unmöglich** statt sie abzuwehren: erzeugter Name auf
der Platte, fremder Name als Anzeigename, Endung erhalten.

**Der teuerste Weg ist nicht abgesichert, sondern weggefallen** — durch eine Frage, die fünf
Minuten kostete.

---

## W-1 ist gegenstandslos. Was an seine Stelle tritt, ist neu

`item.getAsFileAsync` (EML/MIME als Base64, Mindestrecht **read item**, Mailbox **1.14**) trägt
A-19.22 ohne EWS. Entscheidung des Auftraggebers: Manifest bleibt bei `ReadItem`. Damit fallen:
Postfachzugriff, Senden im Namen des Benutzers, Posteingangsregel als Beharrlichkeit, die
Vertrauensgrenze VG-13 und die Auflagen A-A-89 und A-A-91 in ihrer alten Fassung. **Kapitel 39.3
trägt die Berichtigung am Kopf; 39.3.1 bis 39.3.5 bleiben stehen als Bewertung der verworfenen
Weiche.**

**An seine Stelle tritt W-1′ — der Nachbau (39.3.0), und er ist ein eigener Weg.** Zum ersten Mal
**erzeugt** dieser Bestand aus fremdem Text ein Format, das ein anderes Programm interpretiert.
Zwei Befunde daraus, beide **muß**:

- **T-297-15 — Kopfzeilen-Einschleusung, und sie ist der scharfe Punkt.** Betreff, Absender und
  Textkörper kommen von A-06. Wer eine `.eml` zusammenklebt, gibt ihm die Feder: `CRLF` im Betreff
  schreibt eigene Kopfzeilen, eigene Kopfzeilen schreiben `multipart/mixed`, und in den so
  entstandenen Teil paßt ein **Anhang**. Der liegt dann in unserem Datenverzeichnis, Outlook zeigt
  ihn, der Benutzer kann ihn doppelklicken — **ohne** Größengrenze, **ohne** Namensprüfung,
  **ohne** A-A-78, weil er nie ein Anhang im Sinne von A-19.23 war. Dieselbe Sache über die
  Trennmarke. **A-A-96:** jeden Kopfzeilenwert kodieren, `CR`/`LF` darin ablehnen, Trennmarke
  erzeugen wie einen Anhangsnamen, **jeden Teil base64-kodieren** — dann stirbt die Einschleusung
  an der Kodierung statt an einer Suche.
- **T-297-16 — eine Datei, die aussieht wie das Original und es nicht ist.** Kein DKIM, kein
  S/MIME, keine Empfangsstempel; als Beleg nichts wert, und sie wird weitergereicht. A-19.31 kennt
  „geklappt" und „etwas fehlt" — das ist ein **dritter** Zustand. **A-A-97:** die Kennzeichnung
  hängt an der **Datei**, überlebt den Round-Trip und steht in der Rückfrage. Ein Hinweis beim
  Anlegen ist drei Wochen später nirgends.

**A-A-94 (`MinVersion`) hat seine tragende Hälfte gewechselt und ist wichtiger geworden.** Der
Zusatz über `<Permissions>` ist entfallen. Dafür braucht `getAsFileAsync` Mailbox **1.14** — eine
**höhere** Schwelle als die 1.8 der Vorlage. Stünde sie im Manifest, verweigerte ein großer Teil
der Outlook-Fassungen die Installation, und der Nachbau, der genau für diesen Fall gebaut wird,
käme nie zum Zug. Die Zahl im Manifest ist die Bedingung dafür, daß der Rückfallweg erreichbar ist.

---

## Deine Frage zu R-23, ausdrücklich beantwortet

**Die Einstufung verschiebt sich nicht. R-23 bleibt „hoch".** Was sich ändert, ist die halbe
Begründung und die Dringlichkeit.

- **Die Beute ist wieder das Takt-Token und die geöffnete Nachricht**, nicht das Postfach.
- **Was bleibt und „hoch" trägt:** ein Vertrauensanker, den **niemand je entfernt** — gemessen:
  kein Deinstallationspfad in `apps/desktop/**` —, während der private Schlüssel als
  `taskpane-key.pem` mit Benutzerrechten daneben liegt. Ein Angreifer kann sich damit **dauerhaft**
  als der Aufgabenbereich ausgeben, auch nach der Deinstallation, wenn es die Anwendung gar nicht
  mehr gibt und niemand mehr hinsieht.
- **Neu gemessen und in `risks.md` bisher nicht enthalten, weil es nie jemand nachgesehen hat:**
  Das Zertifikat ist **kein CA-Zertifikat** (`basicConstraints` kritisch und leer,
  `apps/local-api/src/taskpane/certificate.ts:159`) und trägt als alternative Namen ausschließlich
  `localhost` und die Loopback-Adresse (`:170`). **Die Wirkung reicht nicht über `localhost`
  hinaus** — es ist kein Generalschlüssel für beliebige Wirte, sondern einer für den
  Aufgabenbereich. Dieser Satz gehört in R-23, er begrenzt es ehrlich, und er senkt die Einstufung
  trotzdem nicht: Der Aufgabenbereich ist genau das, was der Angreifer will.
- **Was sich ändert, ist der Termin:** A-A-92 und T-B05 müssen nicht mehr **vor dem Bau** liegen,
  sondern **vor der Auslieferung**.

---

## Für `risks.md` — zum Eintragen (die Datei gehört dir)

1. **R-21 — hoch.** Im Wesen unverändert, in der Häufigkeit nicht: Der Weg in den Bestand ist ab
   A-19.23 eine E-Mail statt einer Eingabe. E-072 bleibt richtig, plus A-A-85 (Herkunft in der
   Rückfrage) und A-A-86 (abgesetzte Endung). Bewertet in 39.5 und 39.6.
2. **R-23 — hoch, unverschoben.** Begründung und Abgrenzung wie oben; Termin auf „vor der
   Auslieferung". Gegenmittel A-A-92.
3. **R-24 — hoch, Beschreibung ab heute zu eng.** Drei Unterschiede zur neuen Fläche: Der Benutzer
   wählt die Datei nicht (er wählt eine E-Mail), sie kommt täglich statt einmal, und **die Bytes
   entstehen** statt nur ein Zeiger auf etwas Vorhandenes. Bewertet in 39.6.
4. **R-26 „Das Postfach hinter dem Add-in" — bitte nicht anlegen.** Ich hatte es vorgeschlagen;
   mit `getAsFileAsync` ist die Grenze **nicht entstanden** statt abgesichert. VG-13 steht in
   Abschnitt 3 durchgestrichen, damit niemand sie ein zweites Mal für neu hält.
5. **R-27 — „Die Kürzung, die kein Wächter sieht".** `visibleText` und `proof:foreign` behandeln
   fremden Text an der **Zeichenklasse**; ein CSS-Deckel verändert kein Zeichen und nimmt der
   Rückfrage trotzdem die Endung. Gegenmittel A-A-93.
6. **R-28 — „Ein selbst erzeugtes Format ist eine neue Rolle" (neu vorzuschlagen).** Dieser Bestand
   hat fremden Text bisher angezeigt, gespeichert und weitergereicht. Mit dem Nachbau **erzeugt**
   er daraus ein Format, das ein anderes Programm interpretiert — und damit gelten die Regeln für
   Einschleusung, die bisher nirgends galten. Gegenmittel A-A-96 und A-A-97.

---

## Der rohe U+200B — behoben, und er gehört ins Papier

`proof:codepoints` schlug an: ein **U+200B (ZERO WIDTH SPACE)** in `docs/bedrohungsmodell.md`,
kein Beispiel, sondern ein typografischer Rest in der Tafel 39.4.1. Dazu ein U+00AD, das derselbe
Lauf nicht meldet, aber dieselbe Klasse ist. **Beide entfernt; `node scripts/proof-codepoints.mjs`
läuft 46/0, mein eigener Nachlauf über die ganze Datei findet null unsichtbare Zeichen.**

Die Sache steht jetzt als Absatz in 39.4.1, weil sie mehr ist als ein Formfehler: **Ein
Bedrohungsmodell, das seine Beispiele wörtlich trägt, wird selbst zum Träger**, und der Wächter
kann nicht unterscheiden, ob ein Zeichen einen Angriff **ausführt** oder ihn **erklärt** — er prüft
den Bestand und nicht die Gesinnung. Regel: Bezeichner schreiben und die **Stelle** zeigen —
`rechnung.pdf<U+200B>.exe` —, nie das Zeichen. Gilt für dieses Papier, für Prüffälle, für
Fehlermeldungen und für Designbeschreibungen.

**Gemessene Nebenbemerkung, die dabei abfiel:** `visibleText` erfaßt `U+200B` bis `U+200D`
**absichtlich nicht** (`packages/domain/src/characters.ts` — ZWJ hält zusammengesetzte Emoji
zusammen). Für die Rückfrage ist das **kein** Loch: Ein U+200B in einer Endung macht sie
unregistriert, Windows startet nichts. Was bleibt, ist eine Anzeigemehrdeutigkeit in der Liste.
Schwere niedrig; mit A-A-78 steht das Zeichen ohnehin nur noch im Anzeigenamen.

---

## Befunde (vollständig in 39.10)

| Kennung | Schwere | Kurz |
|---|---|---|
| T-297-1 | **muß** | Fremder Name darf kein Pfadbestandteil werden (A-A-78). **A-19.23 ↔ A-A-17 widersprechen einander** |
| T-297-2 | **muß** | `existsSync` + `writeFile` nicht übernehmen — TOCTOU, Symlink-Folgen (A-A-79) |
| T-297-3 | **muß** | Die Route der Vorlage ist kein Vorbild: keine Prüfschicht, `Allow-Origin: *`, PNA (A-A-82) |
| T-297-4 | **muß** | `detail.size` ist eine Ankündigung, keine Grenze — wörtlich A-A-15 (A-A-81) |
| T-297-5 | **muß** | A-A-21 sichert eine Abwesenheit zu, die es nicht mehr gibt (A-A-21′) |
| T-297-6 | **muß** | R-23: kein Deinstallationspfad; Einstufung **unverschoben**, Termin auf Auslieferung (A-A-92) |
| T-297-7 | sollte | Rückfrage nennt die Wirkung, nicht die Herkunft; drei Prüffälle fehlen (A-A-84…86) |
| T-297-8 | sollte | Cloud-Anhang: erster Verweis, den niemand eingetippt hat (A-A-87) |
| T-297-9 | **erledigt** | `getAsFileAsync` gibt es → W-1 gegenstandslos. Frage (2) offen |
| T-297-10 | Hinweis | Datensicherung wächst um ganze E-Mails — oder verliert sie still (A-A-90) |
| T-297-11 | Hinweis | Semgrep Guardian und 42Crunch erneut nicht verfügbar |
| T-297-12 | **muß** | Kürzung am Zeilenende bringt die Rückfrage zum Lügen (A-A-93) |
| T-297-13 | **muß** | `MinVersion` nicht auf 1.14 — sonst ist der Rückfallweg unerreichbar (A-A-94) |
| T-297-14 | **muß** | F-02: Bytes bleiben im Aufgabenbereich, ein Anlegeruf trägt alles (A-A-95 nur hilfsweise) |
| T-297-15 | **muß** | Kopfzeilen-Einschleusung in die nachgebaute `.eml` (A-A-96) |
| T-297-16 | **muß** | „Nachgebaut" muß an der Datei hängen, nicht am Augenblick (A-A-97) |

---

## Annahmen

- **A-19.23 „Dateiname bleibt erhalten" meint den Namen, den der Benutzer sieht.** Darauf ist
  A-A-78 gebaut; A-A-80 ist die teurere Alternative. Der Widerspruch zu A-A-17 ist echt.
- **A-A-7 bleibt gültig** (Verweise ohne Rückfrage); ich habe die halb entfallene Begründung
  benannt und nicht die Regel gekippt.
- **Die Vorlage ist als Vorbild bewertet, nicht als Bestand.** Ihre Route habe ich verworfen, ihre
  Ablagefunktion teilweise übernommen.

## Risiken dieser Bewertung selbst

- **Der Nachbau steht vollständig auf Office.js-Verhalten, das ich hier nicht prüfen kann**
  (kein Outlook, kein Netz, keine Beschreibung): welche Felder Office.js hergibt, in welcher
  Kodierung, ab welcher Fassung 1.14 in der Fläche steht, ob `attachments[].size` angekündigt oder
  wirklich ist, ob `isInline` überall gleich gesetzt wird. Der Boden ist kleiner geworden, aber es
  ist derselbe Boden (39.8 Punkt 1).
- **39.3.3 ist an der Abwesenheit von Code gemessen**, nicht an einer Installation (T-B05).
- **Die 25 Dateinamensfälle liefen auf Windows.** macOS und Linux sind ungemessen.

---

## Offene Fragen an den Orchestrator

1. **Der Widerspruch A-19.23 ↔ A-A-17 muß vor dem Bau entschieden werden.** Vorschlag in 39.4.3.
2. **Zweite Bestätigung bei ausführbarer Endung?** Preis und Nutzen in 39.5.3. Ich empfehle nicht,
   ich lege beides hin. *(Frage 1 der alten Liste — `getAsFileAsync` — ist beantwortet.)*
3. **Wächst das Datenarchiv um die E-Mail-Dateien?** Beides vertretbar, das Schweigen nicht
   (A-A-90). Mit dem Nachbau kommt die Kennzeichnung aus A-A-97 dazu, die den Round-Trip überleben
   muß.
4. **`addinSurface.length` steigt von 4 auf 5** (auf 6 nur mit A-A-95). Die Zahl gehört in denselben
   Auftrag wie die Route.

---

## Nächster Schritt

1. **Auftraggeber:** Entscheidung zum Widerspruch A-19.23 ↔ A-A-17 und zu Frage 2.
2. **Orchestrator:** R-21/R-23/R-24 nachziehen, R-27 und R-28 anlegen, R-26 **nicht** anlegen,
   T-B05 auf „vor der Auslieferung" terminieren, `addinSurface.length` und die Archivfrage
   einplanen.
3. **Dann:** integration-dev und domain-dev mit A-A-78 bis A-A-84, A-A-89′, A-A-96 und A-A-97;
   frontend-dev mit A-A-85, A-A-86, A-A-93; unit-tester mit den drei fehlenden Rückfragefällen und
   den Einschleusungsfällen zu A-A-96.
4. **Nach dem Bau:** Semgrep über die neue Fläche — zum ersten Mal mit einem lohnenden Ziel —, und
   42Crunch über die neue Routenbeschreibung.

---

**Urteil: Nacharbeit vor dem Bau.** Gebaut werden darf, sobald der Widerspruch A-19.23 ↔ A-A-17
entschieden ist, A-A-21′ im selben Auftrag wie die Route steht, A-A-78/79/81/82/93/94/96/97 im
Auftrag des Bauenden stehen und A-A-92 auf „vor der Auslieferung" terminiert ist. Ohne diese vier:
nicht bauen.
