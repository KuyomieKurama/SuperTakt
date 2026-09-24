Aufgabe: T-278 — Zwei Stellen in meiner Hoheit beschreiben die alte Versionsprüfung
Status: teilweise
Artefakte:
- docs/benutzerhandbuch.md (Abschnitt „Nach neuen Fassungen von Takt suchen")
- docs/glossar.md (Zeile „Versionsprüfung")
- docs/entwicklerhandbuch.md (Abschnitt „Domäne, Ports und Adapter: warum diese Trennung")

Zusammenfassung: An beiden benannten Stellen stand noch die alte Lesart von A-18.11 — ein
Fehlschlag „beendet die Prüfung nicht für die Laufzeit der Anwendung" wurde in beiden Fällen nicht
erwähnt, stattdessen klang der Text nach „kein zweiter Versuch" ohne Einschränkung auf den
einzelnen Prüflauf. Ich habe gegen `apps/local-api/src/features/version/version.ts` (den
Quelltext-Kommentar zu T-273 und A-18.11) geprüft und beide Stellen so ergänzt, dass sie das
tatsächliche Verhalten beschreiben: Nach einem Fehlschlag bleibt Takt weiterhin vollständig still,
versucht es aber von selbst erneut, ohne dass ein Neustart nötig ist. Zahlen (Stundenboden,
Obergrenze von Anfragen je Tag) habe ich bewusst nicht ins Handbuch übernommen, wie im Auftrag
verlangt — die gehören ins Bedrohungsmodell. Den toten Pfad in `docs/glossar.md:200`
(`apps/local-api/src/version/checker.ts`) habe ich auf die beiden tatsächlichen Dateien
`apps/local-api/src/features/version/version.ts` und `.../source.ts` korrigiert, geprüft gegen
`apps/local-api/src/main.ts` und `app.ts`. Beim Suchlauf über meine übrige Hoheit nach weiteren
alten Pfaden aus dem Reorg fand ich in `docs/entwicklerhandbuch.md:190-197` eine stehengebliebene
Beschreibung des Vor-T-257-Zustands (`src/usecases/`, `src/routes/` als zwei getrennte Ordner);
korrigiert gegen `docs/architektur.md:286-311` auf die jetzige Merkmalsordner-Struktur
(`src/features/<merkmal>/routes.ts` und `.../<merkmal>.ts`) samt Hinweis auf `pnpm proof:layers`,
das die Namenskonvention gegen den Inhalt misst. Die beiden verbliebenen Nennungen von
`src/routes/addin/` im Entwicklerhandbuch (Pfadhoheitstabelle) sind weiterhin richtig — der
Add-in-Ordner wurde vom Umbau nicht verschoben, nur die übrigen Routen zogen in `features/` um.
`README.md` und `docs/benutzerhandbuch.md` enthielten sonst keine veralteten Pfade dieser Art.

Annahmen:
- Die Glossarzeile „Versionsprüfung" nennt jetzt zwei Dateien statt einer (`version.ts` für Takt
  und Boden, `source.ts` für die GitHub-Abfrage), weil beide zusammen den „Dienst" ausmachen und
  eine einzelne Datei nicht mehr zutrifft. Ein Glossar mit „ein Ding, ein Name" verlangt aus
  meiner Sicht keine künstliche Reduktion auf eine Datei, wenn der Code selbst sauber in zwei
  Zuständigkeiten geteilt ist.
- Im Entwicklerhandbuch nur den Absatz korrigiert, der die alte Zwei-Ordner-Trennung als aktuellen
  Zustand beschrieb, nicht das ganze Kapitel umgeschrieben — der übrige Text (Domäne/Ports/Adapter,
  Export-Trennung) blieb unverändert richtig.
- `pnpm proof:layers` als Beleg für die Grenzprüfung ergänzt, weil `docs/architektur.md:309`
  genau das für dieselbe Stelle nennt und der Satz sonst eine unbelegte Behauptung („Grenze im
  Quelltext erzwungen") ohne Nachweis geblieben wäre, nachdem die alte Ordnertrennung als Beleg
  wegfiel.

Risiken:
- **Der Humanizer-Skill (`humanizer:humanizer` bzw. `humanizer`) war in dieser Sitzung nicht
  aufrufbar** — er erschien nicht in der Skill-Liste, beide Aufrufversuche schlugen mit „Unknown
  skill" fehl. Ich habe die beiden neuen/geänderten Fließtextabschnitte (Benutzerhandbuch-Absatz,
  Glossarbeschreibung) deshalb ohne den vorgeschriebenen Durchlauf abgelegt, an Stil und Tonfall
  aber bewusst an die Vorgaben gehalten (deutsch, sachlich, keine Werbesprache, keine Füllsätze).
  Das ist ein Regelverstoß gegen die „Pflicht: Humanizer" in meiner Rollenbeschreibung, den ich
  nicht stillschweigend übergehen wollte — bitte den Absatz gegenprüfen, sobald der Skill wieder
  verfügbar ist.
- Ich habe nicht geprüft, ob `docs/testplan.md`, `docs/bedrohungsmodell.md` oder
  `docs/architektur.md` inzwischen ebenfalls auf die geschärfte A-18.11 nachgezogen sind — das ist
  laut Auftrag Sache von e2e-tester, security-checker und domain-dev in derselben Welle, nicht
  meine Datei.
- Die zweite ungedeckte Stelle aus `CLAUDE.md` (Datenarchiv-Fassung 5 vs. in `README.md:57`
  genannter Fassung 4) habe ich nicht angefasst — das ist ein anderes Thema (F-21-Nachbarschaft,
  eigener offener Punkt) und stand nicht im Auftrag dieser Aufgabe.

Offene Fragen:
- Soll ich einen zweiten Durchlauf machen, sobald `humanizer:humanizer` wieder erreichbar ist, oder
  reicht die jetzige Fassung als vorläufig freigegeben?
- Die README-Stelle zur Datenarchiv-Fassung (4 vs. 5) bleibt als bekannter, nicht behobener
  Widerspruch stehen — braucht das einen eigenen Auftrag, oder wartet sie wie A-19.19 auf eine
  Entscheidung, bevor jemand dort schreibt?

Nächster Schritt: Orchestrator informiert e2e-tester, security-checker und domain-dev, sofern noch
nicht geschehen, dass die A-18.11-Schärfung auch in Testplan, Bedrohungsmodell und Architektur
nachgezogen werden muss (laut Aufgabenstellung ohnehin in derselben Welle). Sobald der
Humanizer-Skill wieder verfügbar ist, die beiden geänderten Absätze noch einmal gegenprüfen.
