Aufgabe: T-306 — Punkt 1: `AddinDeps`-Attrappe um `emailAttachments` ergänzen (Tor entsperren). Punkt 2:
Prüffälle für `packages/domain/src/email-attachment.ts` und
`apps/local-api/src/features/todos/email-attachments.ts` (die aus T-305 gemeldete Lücke).

Status: fertig

## Artefakte

**Geändert**

- `apps/local-api/test/routes/addin/service.test.ts` — `buildDeps` bekommt ein drittes Feld
  `emailAttachments`, eine reine Durchreich-Attrappe

**Neu**

- `packages/domain/test/email-attachment.test.ts` — 70 Prüffälle
- `apps/local-api/test/usecases/email-attachments.test.ts` — 13 Prüffälle

## Zusammenfassung

**Punkt 1 zuerst und vollständig, wie verlangt.** `buildDeps` in `service.test.ts` bekam ein
drittes Feld `emailAttachments`, dessen Typ ich aus `AddinDeps.emailAttachments`
(`apps/local-api/src/routes/addin/ports.ts`) und der Signatur `EmailAttachmentIntake`
(`apps/local-api/src/features/todos/email-attachments.ts`) abgelesen habe, statt sie zu raten. Die
Attrappe ruft `create()`, reicht einen Fehlschlag unverändert durch und liefert bei Erfolg
`{ created, attachments: { attached: [], failed: [] } }` — sie erzeugt nie einen Anhang und läßt
nie einen scheitern. **Wonach das nichts zusichert:** Diese Attrappe prüft nicht, *was*
`attachEmailToNewTodo`/`createEmailAttachmentIntake` wirklich tun — `service.test.ts` prüft
`findMatches`/`bookOnTodo`, nicht die Anhangsübernahme, und die Attrappe existiert ausschließlich,
damit `AddinDeps` dort vollständig bleibt. Die eigentliche Prüfung der Anhangsübernahme steht in
den beiden neuen Dateien aus Punkt 2. Danach `pnpm run typecheck` gefahren: **grün**, alle acht
Pakete und beide `tsc`-Läufe (`src` und `test`) ohne einen einzigen Fehler — TS2741 war tatsächlich
der letzte im ganzen Baum.

**Punkt 2.** `packages/domain/test/email-attachment.test.ts` (70 Fälle) mißt: die acht Fehlgründe
als geschlossene Menge — jeder einzeln über `isEmailAttachmentFailureReason` erreichbar, `mailbox_closed`
ausdrücklich **nicht mehr** erreichbar (T-301); die drei Grenzen aus `admitEmailAttachment` an
ihren jeweiligen Achsen (Größe je Datei, Summe, Anzahl), inklusive einer Gegenprobe, die die
Größengrenze an einer **echten** dekodierten Länge mißt und zeigt, daß die Base64-Zeichenkette
selbst länger ist als die Grenze — ein Prüffall, der stattdessen an der Zeichenkette mäße, wäre
selbst bei korrekter Implementierung falsch grün; `decodedBase64ByteLength` gegen Leerraum,
URL-sicheres Alphabet, fehlende oder falsch plazierte Polsterung und eine Länge, die kein
Vielfaches von 4 ist, sowie gegen von Hand geprüfte Lehrbuch-Kodierungen (`"A"→"QQ=="`,
`"AB"→"QUI="`, `"ABC"→"QUJD"`); `nameEmailFile`/`emailFileExtension` an den Fällen aus dem
security-checker-Befund (T-297, 39.4.1) — Gerätenamen ohne und mit Endung, Doppelendung (nur die
letzte zählt), keine Endung, eine Endung an und über der Längengrenze, alle fünf Umleitungsendungen
als vollständige Menge, der nachgestellte Punkt/das nachgestellte Leerzeichen (T-156-1) und der
Doppelpunkt/alternativer Datenstrom (T-164); `shortenEmailDisplayName` mit Endungserhalt am Ende,
sichtbarer Kürzungsmarke und einer Emoji-Gegenprobe, die an Unicode-Codepunkten zählt und kein
Surrogatpaar zerschneidet.

`apps/local-api/test/usecases/email-attachments.test.ts` (13 Fälle) mißt die Verdrahtung von
`attachEmailToNewTodo`: Scheitert `create`, wird **kein** Byte geschrieben und **keine** Transaktion
begonnen (Attrappen, die bei jedem Aufruf werfen, decken das auf); eine Datei einen Byte über der
Grenze erreicht `storeEmailFile` **nie** und wird mit der gemessenen Größe gemeldet, eine Datei
genau an der Grenze wird angenommen; bei drei Dateien, von denen die mittlere an der Datenbankzeile
scheitert, kommen die beiden anderen an, die mittlere wird namentlich gemeldet und ihre bereits
geschriebene Datei wieder entfernt (A-A-83, zweite Hälfte); die Reihenfolge Nachricht → Dateien →
Cloud-Verweise und `rebuilt` ausschließlich an der Nachricht; die Fehlschläge aus dem
Aufgabenbereich stehen vorn und werden bei Überlänge gekürzt; Gerätenamen, Doppelendung, fehlende
und zu lange Endung laufen unverändert durch — keine zweite Namensprüfung an der Naht; die
Anzahlgrenze bei Cloud-Verweisen greift vor der Formprüfung der Adresse; der Absender wird
getrimmt, leer wird `null`, sehr lang wird auf 640 Zeichen gekürzt.

**Rot vor grün.** Vor diesen beiden Dateien gab es unter `packages/domain/test/**` keinen Treffer
auf `email-attachment` und unter `apps/local-api/test/**` keinen Treffer auf `email-attachments` —
`git status --porcelain` weist beide Dateien als neu (`??`) aus, und der Coverage-Lauf vor T-306
(T-305) hatte für `email-attachment.ts` 35,71 % Anweisungen/16,66 % Funktionen und für die
lokale-API-Datei 0 % direkte Prüffälle protokolliert. Das ist derselbe Nachweis, den
`packages/domain/test/attachment.test.ts` in seinem eigenen Kopfkommentar für T-148 führt ("ROT
ZUERST" bei einer bereits gebauten Datei ohne Prüffall). Beide neuen Dateien sind jetzt grün:
70 von 70 bzw. 13 von 13 Fällen bestehen, der gesamte Testlauf über `packages/domain` und
`apps/local-api` bleibt bei 972 von 972 grün, `pnpm run test:coverage` bei 1793 von 1796 (3
übersprungen, unverändert von vorher) über 92 statt vorher 90 Testdateien.

**Coverage-Wert für `email-attachment.ts` (der neue Wert, nachgemessen, kein übernommener Stand):**

| Datei | Anweisungen | Zweige | Funktionen | Zeilen |
|---|---|---|---|---|
| `packages/domain/src/email-attachment.ts` | **100 %** | **97,61 %** | **100 %** | **100 %** |

Vorher (T-305): 35,71 % / — / 16,66 % / —. Der eine verbleibende ungetestete Zweig (Zeile 296,
`character.codePointAt(0) ?? 0`) ist die `?? 0`-Rückfalllogik in `emailFileExtension` — bei einem
Zeichen, das aus einer `for…of`-Schleife über eine nicht-leere Zeichenkette stammt, liefert
`codePointAt(0)` nie `undefined`; der Zweig ist eine TypeScript-Absicherung gegen die Typangabe
`number | undefined` und mit legitimen Eingaben nicht erreichbar. Ich habe ihn nicht künstlich
erzwungen (z. B. über einen manipulierten Iterator), weil das keinen echten Fall abbildete, sondern
nur die Zahl bewegte.

`apps/local-api/src/features/todos/email-attachments.ts` fließt **nicht** in die
Schwellenmessung ein — `vitest.config.ts` `coverage.include` faßt ausschließlich
`packages/domain/src/**`, `packages/storage/src/**` und `packages/export/src/**`; `apps/local-api`
ist dort nicht gelistet, unabhängig davon, wie viele Prüffälle sie hat (das deckt sich mit der
Vorgabe im Auftrag: "Abdeckung mindestens 80 Prozent auf `packages/domain` und `packages/export`").
Der Prüffall für diese Datei war trotzdem geboten, weil sie zuvor keinen einzigen hatte und die
Verdrahtung — Reihenfolge, Aufräumen bei einer gescheiterten Zeile, keine zweite Namensprüfung —
sonst ungeprüft bliebe.

## Annahmen

1. **Die Attrappe aus Punkt 1 ist eine reine Durchreichung** (kein Anhang entsteht, keiner
   scheitert). Das genügt für `service.test.ts`, weil die dortigen Fälle `findMatches`/`bookOnTodo`
   prüfen und nie `emailAttachments` selbst aufrufen — ein Blick in die Datei bestätigt: Keiner der
   bestehenden `it(...)`-Blöcke ruft eine Add-in-Anlegeroute, die diesen Pfad berührt. Die Attrappe
   sichert also **nichts** über die Anhangsübernahme zu; sie hält nur den Typ vollständig.
2. **`packages/domain/tsconfig.json` setzt `types: []`** — `Buffer` und jedes andere Node-Global
   sind dort nicht benennbar (das ist Absicht, siehe Kopfkommentar der Datei). Ich habe deshalb für
   `packages/domain/test/email-attachment.test.ts` einen reinen, bibliotheksfreien Base64-Helfer
   geschrieben (`base64OfExactByteLength`, gebaut aus von Hand geprüften Bausteinen `"QUJD"`
   (3 Bytes), `"QQ=="` (1 Byte), `"QUI="` (2 Bytes)), statt `Buffer` zu importieren. Das hält die
   Domänentests so umgebungsfrei wie die Domäne selbst und ist zugleich deutlich billiger als ein
   echter Puffer von 25 MB — der erste Anlauf mit `Buffer.alloc(MAX_EMAIL_ATTACHMENT_BYTES, …)` ließ
   sich zwar unter `apps/local-api` (Node-Typen vorhanden) ausführen, scheiterte aber am
   `tsc -p packages/domain/tsconfig.test.json`-Lauf des Tors (TS2591/TS2552). In
   `apps/local-api/test/usecases/email-attachments.test.ts` — wo Node-Typen vorhanden sind — steht
   dagegen ein echter `Buffer`, weil dort die Größengrenze an einem **tatsächlich** allozierten
   und base64-kodierten Puffer gemessen werden sollte, nicht nur an einer Zeichenkette passender
   Form.
3. **Die neue lokale-API-Testdatei liegt unter `test/usecases/`**, nicht unter einem neuen
   `test/features/todos/`. Das folgt der bestehenden Konvention: `attachment-input-validation.test.ts`
   prüft ebenfalls eine Datei aus `src/features/todos/` und liegt in genau diesem Ordner. Ein neuer
   Ordner wäre eine Strukturentscheidung außerhalb meiner Hoheit gewesen.
4. **Keine Prüffälle für den baumelnden Symlink** aus T-299s "Nächster Schritt" 5 (POSIX,
   `open(…, 'wx')` gegen `storeEmailFile`) — der Auftrag zu T-306 nennt namentlich nur
   `packages/domain/src/email-attachment.ts` und `apps/local-api/src/features/todos/email-attachments.ts`;
   der Symlink-Fall gehört zu `apps/local-api/src/access/attachment-store.ts`, einer dritten,
   nicht genannten Datei mit bereits vorhandener Testdatei (`attachment-store.test.ts`, aus T-160).
   Das würde ich als eigenen, kleinen Auftrag vorschlagen, falls gewünscht.
5. **Keine erzwungene Prüfung der Zeile 296-Rückfalllogik** in `emailFileExtension` — siehe oben,
   Coverage-Tabelle.

## Risiken

- Ein unbeteiligter Fund während der Arbeit: `git status` zeigt den aktuellen Arbeitsbaum auf dem
  Branch `feature/outlook-anhaenge-und-versionspruefung` bei Commit `222b531`, zwei Commits **vor**
  dem `main`, das im Sitzungs-Systemhinweis als Ausgangspunkt genannt war (`15bdd97` auf `main`).
  Ich habe selbst keinen `git`-Schreibbefehl ausgeführt (kein `commit`, `checkout`, `merge`) — das
  ist eine reine Beobachtung des Bestands, kein von mir verursachter Zustand. Der Orchestrator
  sollte prüfen, ob dieser Branchwechsel beabsichtigt ist, bevor er den weiteren Ablauf plant.
- Keine sicherheitsrelevanten Befunde im Produktivcode. Ich habe an keiner Stelle etwas in `src/`
  angefaßt.

## Offene Fragen

Keine.

## Nächster Schritt

`pnpm check` vollständig fahren (mein `pnpm run typecheck` und `pnpm run test:coverage` waren
beide grün, aber `boundaries`, `proof:all`, `verify:bundle`, `test:rust`, `build`, `audit` habe ich
nicht gefahren — das bleibt beim Orchestrator, wie im Auftrag vorgesehen). Falls gewünscht: einen
eigenen kleinen Auftrag für den baumelnden-Symlink-Fall an `attachment-store.ts` (Annahme 4).
