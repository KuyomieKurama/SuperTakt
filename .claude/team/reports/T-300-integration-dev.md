# T-300 — Die Office.js-Seite der Anhangsübernahme

**Aufgabe:** T-300 — Die Nachricht als Datei, die Dateianhänge, der Fluß im Aufgabenbereich
**Rolle:** integration-dev · **Stand:** 2026-09-11

## Status

**braucht Review** — gebaut, gemessen, und `pnpm check` ist **vollständig grün**
(Rückgabewert 0, gemessen um 16:47 nach domain-devs Abschluß derselben Welle): 19 Nachweisläufe
ohne Beanstandung, `proof:addin` **290 bestanden / 0 fehlgeschlagen**, 1696 Prüffälle,
`pnpm audit` ohne Befund.

Zweimal davor war das Tor rot, beide Male an `apps/local-api/src/app.ts` mitten in domain-devs
Arbeit (`Cannot find name 'ADDIN_ATTACHMENT_MAX_BODY_BYTES'`,
`createEmailAttachmentIntake is not defined`). Das steht hier als **Beobachtung über den
Wellenbetrieb**, nicht als Befund: Zwei Agenten an derselben Anforderung sehen den Baum des
anderen halb geschrieben, und ein Tor, das währenddessen gefahren wird, mißt einen Zustand,
den es nie gab.

## Artefakte

**Neu**

- `apps/outlook-addin/src/attachments/model.ts` — Typen, Grenzen, Gründe, **die Nutzlast**
- `apps/outlook-addin/src/attachments/base64.ts` — UTF-8 → Base64 über die Plattform, Formprüfung, Bytezählung
- `apps/outlook-addin/src/attachments/eml.ts` — der **Nachbau** (A-19.22a/b/c, A-A-96)
- `apps/outlook-addin/src/attachments/plan.ts` — was vor dem Klick feststeht (A-19.23 bis A-19.30)
- `apps/outlook-addin/src/attachments/collect.ts` — der Sammellauf, Abbruch, Zeitdeckel
- `apps/outlook-addin/src/attachments/reasons.ts` — die geschlossene Liste der Gründe
- `apps/outlook-addin/src/attachments/size.ts` — Größenangaben (`340 KB`, `1,2 MB`, `< 1 KB`)
- `apps/outlook-addin/src/ui/Attachments.tsx` — Vorschau (Z0), Fortschritt (Z1/Z2), Ergebnislisten

**Geändert**

- `apps/outlook-addin/src/office/host.ts` — Fähigkeitsprüfung zur Laufzeit, die Office-Ports,
  `onItemChanged`
- `apps/outlook-addin/src/office/office-js.d.ts` — `attachments`, `to`, `cc`, `sender`,
  `getAsFileAsync`, `getAttachmentContentAsync`, `requirements.isSetSupported`, `addHandlerAsync`
- `apps/outlook-addin/src/ui/TaskPane.tsx` — die sieben Zustände, Z3/Z4/Z5/Z6
- `apps/outlook-addin/src/ui/App.tsx` — der Wechsel der geöffneten Nachricht
- `apps/outlook-addin/src/api/types.ts` — `EmailAttachmentLimitsDto`, `CreatedAttachmentsDto`
- `apps/outlook-addin/src/api/client.ts` — die Naht, benannt und gemessen
- `apps/outlook-addin/src/styles/addin.css` — die Anhangsliste, **ohne Deckel am Zeilenende**
- `apps/outlook-addin/scripts/proof-addin.mjs` — Abschnitte **21** und **22** (42 neue Prüfsätze)

**Nicht angefasst**, wie beauftragt: `apps/local-api/src/routes/addin/**`, `proof-addin.mjs`
Abschnitt 18, `manifest.xml` (es stand bereits richtig — siehe Befund 1).

## Zusammenfassung

Die Nachricht kommt über `Office.context.mailbox.item.getAsFileAsync` als EML/MIME in Base64;
fehlt Mailbox 1.14 oder schlägt der Abruf fehl, wird die Datei aus Absender, Empfängern, Kopie,
Betreff, Versanddatum und Nachrichtentext **nachgebaut** und als Nachbau gekennzeichnet. Der
Nachbau wird **kodiert erzeugt und nicht zusammengeklebt**: jeder Kopfzeilenwert als RFC-2047-
`=?UTF-8?B?…?=`, der Rumpf base64, und **keine Trennmarke, weil es keinen zweiten Teil gibt** —
die nachgebaute Nachricht ist einteiliges `text/plain`. Die Dateianhänge werden über
`getAttachmentContentAsync` eingesammelt, eingebettete Bilder zählen nicht, Cloud-Anhänge
werden erst nach `normalizeAttachmentLink` — Positivliste am **zerlegten** Schema — zu einem
Verweis. Der Fluß folgt dem Entwurf T-298: erst sammeln, dann anlegen, mit Fortschritt je
Datei, Abbrechen bis zum Anlegeruf, Zeitdeckel je Anhang und einer Ergebnisfläche, die nennt,
was angekommen ist und was nicht. Weil die Route unter `/addin` noch nicht existiert, hängt der
ganze Abschnitt an einer benannten Naht: Solange der Anlegeruf die Anhänge nicht trägt, gibt es
keine Vorschau, keinen Sammellauf und **keinen Satz darüber**.

## Die Nutzlast an die künftige Route — gegen domain-devs Naht zu halten

Zwei Stellen, beide im Add-in deklariert und im Nachweislauf gemessen.

**1. Hin: der Rumpf von `POST /api/v1/addin/todos` bekommt ein Feld**

```ts
attachments: readonly AttachmentPayload[]

type AttachmentPayload =
  | { kind: 'message'; displayName: string; contentBase64: string; rebuilt: boolean }
  | { kind: 'file';    displayName: string; contentBase64: string }
  | { kind: 'link';    displayName: string; url: string }
```

- `kind: 'message'` kommt **genau einmal** je Anlegeruf (A-19.22, A-19.27).
- `rebuilt: true` heißt „nicht das Original" — das ist die Eigenschaft aus **A-A-97**, die im
  Bestand landen, den Round-Trip überstehen und in der Rückfrage vor dem Öffnen stehen muß.
  Der Anzeigename trägt sie **nicht**; ein Name läßt sich umbenennen.
- `displayName` ist **fremder Text** (A-19.23a). Der Name auf der Platte entsteht im Dienst
  (A-A-78); von hier geht nur der Anzeigename. Für die Nachricht selbst ist er die Konstante
  `Nachricht.eml` und damit gerade **kein** fremder Text.
- `contentBase64` ist geprüft: Leerraum entfernt, Alphabet und Länge gemessen, Bytezahl aus der
  Zeichenkette gerechnet und nicht aus `AttachmentDetails.size` (**A-A-81**). Der Dienst zählt
  trotzdem noch einmal — ich messe hier, damit nichts Unnötiges über die Leitung geht, nicht
  als Ersatz für seine Grenze.
- `url` ist die **Normalform** aus `normalizeAttachmentLink` (A-A-13), nicht die Rohfassung.

**2. Zurück: zwei Felder in bestehenden Antworten**

```ts
// GET /api/v1/addin/context
emailAttachments?: { maxBytesPerFile: number; maxBytesTotal: number; maxCount: number }

// POST /api/v1/addin/todos
attachments?: { stored: number; rejected: { displayName: string }[] }
```

`emailAttachments` ist **die Naht**. Fehlt der Block, bietet der Aufgabenbereich die Übernahme
nicht an. Beide Felder sind optional gelesen; ein älterer Dienst bleibt bedienbar.

**Warum die Grenzen vom Dienst kommen und nicht im Add-in stehen:** Die Sätze der Oberfläche
nennen sie ausgeschrieben („Die Grenze liegt bei 25,0 MB je Datei."). Eine Zahl im Add-in wäre
die zweite Wahrheit über eine Grenze, die ein anderer durchsetzt — und sie stünde falsch da,
sobald jemand die echte ändert. **F-01 und F-03 aus dem Entwurf T-298 sind damit auf meiner
Seite beantwortet, ohne daß ich eine Zahl erfinde.**

### Nachtrag, gelesen nach dem grünen Lauf: domain-dev hat die bessere Quelle

`packages/domain/src/email-attachment.ts` ist in derselben Welle entstanden und aus
`packages/domain/src/index.ts` ausgeführt — der Aufgabenbereich **darf sie lesen**, `@takt/domain`
steht in seiner Abhängigkeitsliste. Damit liegen die drei Grenzen dort, wo dieser Bestand
Zahlen hinlegt, die zwei Häuser tragen (dieselbe Bauart wie `MAX_TITLE_CHARACTERS` seit T-128):

| | domain-dev | ich |
|---|---|---|
| je Datei | `MAX_EMAIL_ATTACHMENT_BYTES` = 25 MB | aus `context.emailAttachments` |
| Summe | `MAX_EMAIL_ATTACHMENT_TOTAL_BYTES` = 48 MB | aus `context.emailAttachments` |
| Anzahl | `MAX_EMAIL_ATTACHMENT_COUNT` = 25 | aus `context.emailAttachments` |

**Empfehlung für die Anschlußaufgabe: die Zahlen aus `@takt/domain` lesen, den Block im Kontext
behalten.** Beides hat einen eigenen Zweck und ist keine Dopplung: Die **Zahlen** sind eine
Fachregel und gehören in die Domäne. Der **Block im Kontext** ist die Auskunft „dieser
laufende Dienst nimmt Anhänge an" — und die kann der Aufgabenbereich nicht aus einem Paket
lesen, denn Add-in und Dienst werden getrennt installiert und können auseinanderlaufen. Er
schrumpft dann auf eine Zusage ohne Zahlen.

### Und eine Abweichung, die zusammengeführt gehört: **zwei Listen von Gründen**

A-19.29 verlangt einen Grund je nicht übernommenem Anhang. Den nennt jetzt **beides**, und die
Vokabeln decken sich nicht:

| Fall | domain-dev (`EmailAttachmentFailureReason`, 8) | ich (`SkipReason`, 10) |
|---|---|---|
| Datei zu groß | `too_large` | `too_large` |
| Summe gerissen | `too_large` | **`total_too_large`** |
| zu viele Dateien | `rejected` | **`too_many`** |
| Nachricht nicht herausgegeben | `mailbox_closed` | *entfällt* — es wird nachgebaut (E-109) |
| Nachbau abgelehnt (A-A-96) | *fehlt* | **`rebuild_rejected`** |
| übrige fünf | gleich | gleich |

Beide Begründungen sind für sich schlüssig — domain-dev trennt nach dem, was der Benutzer
**tun** kann, ich trenne nach dem, was **geschehen** ist. Zusammengeführt werden muß es
trotzdem, sonst trägt dieselbe Sache zwei Namen. **Mein Vorschlag: domain-devs Liste gewinnt
für alles, was über die Leitung geht**, und sie bekommt zwei Ergänzungen — `rebuild_rejected`
(den Fall gibt es, und heute hat er dort keinen Namen) und die Streichung von `mailbox_closed`
(den Fall gibt es seit E-109 nicht mehr). `too_many` und `total_too_large` kann ich fallen
lassen; sie sind eine Feinheit der Anzeige und keine Aussage über den Bestand. Damit fällt auch
die Frage 3 unten weg, denn die beiden Sätze, die ich erfinden mußte, verschwinden mit ihnen.

## Befunde

**1. Das Manifest stand bereits richtig — kein Befund, aber gemessen.**
`<Permissions>ReadItem</Permissions>` steht zeichengleich da, `MinVersion` steht auf `1.1`.
A-A-91′ und A-A-94 sind erfüllt, ohne daß ich etwas ändern mußte. Beides ist ab jetzt gemessen
(`proof:addin` 22) — einschließlich der Gegenprobe, daß `ReadWriteMailbox` nirgends im
Quelltext steht und `getAsFileAsync` **genau einen** Aufruf hat.

**2. Der Entwurf T-298 ist an vier Stellen von E-109 überholt, und ich habe ihm dort nicht
gefolgt.** Das Papier ist am selben Tag entstanden wie die Entscheidung und kennt sie nicht:

| Entwurf | Warum nicht gebaut |
|---|---|
| **Z7** „Das Add-in darf jetzt mehr" (Abschnitt 8.1) | Es gibt **keinen Rechtszuwachs** mehr (E-109, A-A-91′). Eine Fläche, die einen ankündigt, wäre ein Text über eine Sache, die es nicht gibt — derselbe Fehler wie am 2026-09-10 |
| Abschnitt **8.2** „Zugriff auf das Postfach (ReadWriteMailbox)" in den Einstellungen | dasselbe; der Name `ReadWriteMailbox` steht jetzt **nirgends** im Baum, und ein Nachweislauf hält das fest |
| **4.6 (b)** „Kein EWS-Weg — `ewsUrl` fehlt" | Es gibt keinen EWS-Weg mehr. Gibt Outlook die Nachricht nicht her, **fehlt sie nicht** — sie wird nachgebaut (A-19.22a) |
| Grund **`mailbox_closed`** (6.2) | aus demselben Grund entfallen; an seine Stelle tritt **`rebuild_rejected`**, der einzige Fall, in dem die E-Mail selbst fehlt |

Alles Übrige aus dem Entwurf ist zeichengleich übernommen: die sieben Zustände, die
Bereichszeile, die vier Zeilenzustände mit Wort statt nur Zeichen, „Abbrechen", der Satz
„Das Todo entsteht erst, wenn alle Anhänge übernommen sind. Abbrechen legt nichts an.", der
Nachtragsweg in Z4 und die Abwesenheitszusage darunter.

**3. `proof:callers` hat die Naht erzwungen, und das war richtig so.** Mein erster Entwurf
schickte `attachments` schon jetzt mit. `proof:callers` Abschnitt 7 wurde rot: Die Tür liest
das Feld nicht. Das ist keine Formalie — `createTodoSchema` ist ein `z.object` und
**streicht** unbekannte Felder, statt sie abzuweisen. Ein jetzt mitgeschickter Anhang wäre
lautlos verschwunden, während die Oberfläche „3 Anhänge hängen daran" gemeldet hätte: der
stille Ausfall, den A-19.31 ausschließt, in seiner unangenehmsten Form.

## Annahmen

1. **Der Nachbau ist einteilig (`text/plain`), nicht `multipart`.** A-A-96 verlangt, die
   Trennmarke zu **erzeugen** statt sie festzuschreiben. Das ist die Antwort auf ein
   `multipart`, das es hier nicht gibt: **Keine Marke ist enger als eine erzeugte.** Alle drei
   übrigen Punkte von A-A-96 sind gebaut (Kopfzeilen kodiert, Rumpf base64, `CR`/`LF` im Wert
   als Ablehnungsgrund). Ich halte das für eine Verschärfung und nicht für eine Abweichung —
   **security-checker möge es bestätigen.** Der Dateikopf von `eml.ts` sagt ausdrücklich: Wer
   je auf `multipart` erweitert, holt die erzeugte Marke aus A-A-96 zurück.
2. **Die Ablehnung ist ein Festpunkt, keine Suche.** „Jedes `CR` und `LF` ist ein
   Ablehnungsgrund" ist als Formprüfung über die **erzeugten** physischen Kopfzeilen gebaut
   (druckbares ASCII). Unter der Kodierung ist sie unerreichbar; genau deshalb steht sie da —
   als Wache für den Tag, an dem jemand einen Wert roh einsetzt. Die Gegenprobe führt sie an
   derselben Zeile vor, die ohne Kodierung entstünde.
3. **Eine Adresse, die die enge `addr-spec`-Form nicht erfüllt, kommt nicht in eine
   strukturierte Kopfzeile** — sie steht vollständig und kodiert im lesbaren Rumpf. A-19.22
   bleibt erfüllt; ein Komma oder `<` in einer `To:`-Zeile wäre eine zweite Adresse.
4. **Der Anzeigename der Nachricht ist `Nachricht.eml`** und wird **nicht** aus dem Betreff
   gebaut. Ein Betreff im Dateinamen wäre fremder Text an genau der Stelle, die später in der
   Rückfrage vor dem Öffnen steht.
5. **Ein Anhang ohne Namen heißt `(ohne Namen)`.** Ihn fallen zu lassen wäre ein stiller
   Ausfall; ihm einen Namen anzudichten wäre eine Behauptung über fremdes Material.
6. **Ein angehängtes Element (`item`) bekommt `.eml` angehängt**, wenn Outlook keine Endung
   mitliefert. Die Endung stammt aus der Art des Anhangs, nicht aus der E-Mail.
7. **`Office.EventType.ItemChanged` ist im Add-in `unknown` typisiert**, nicht mit einer
   abgeschriebenen Zeichenkette. In `office.js` ist `EventType` ein `declare enum`, dessen
   Belegung die Laufzeit vergibt.
8. **Base64 kommt aus der Plattform (`TextEncoder`, `btoa`), nicht aus `@takt/export`.**
   Begründung im Dateikopf von `base64.ts`: Der Aufgabenbereich hat **eine** Laufzeit; der
   ausgeschriebene Kodierer in `packages/export` existiert, weil dieselbe Zeile dort in **zwei**
   Laufzeiten entsteht. Eine Abhängigkeit auf `@takt/export` hätte dem Browserbündel den
   Exportmotor erreichbar gemacht.

## Risiken

- **R-a aus dem Entwurf bleibt:** `isInline` ist nicht bei jedem Absender gesetzt. Ein
  Signaturbild kann als Dateianhang durchgehen. Die Vorschau vor dem Klick ist die einzige
  Gegenmaßnahme, die es gibt.
- **Der Nachbau bleibt ein Nachbau.** Die Kodierung verhindert die Einschleusung, nicht die
  Verwechslung. Die Kennzeichnung trägt drei Stellen: Kopfzeile in der Datei, Vorspann im
  lesbaren Rumpf, `rebuilt` in der Nutzlast. **Die vierte und wichtigste — die Eigenschaft im
  Bestand und der Satz in der Rückfrage vor dem Öffnen — liegt bei domain-dev und
  frontend-dev.** Ohne sie ist A-19.22b nur zur Hälfte erfüllt.
- **A-A-88 („das MIME wird geschrieben, nicht gelesen") halte ich auf meiner Seite ein**: Der
  Aufgabenbereich zerlegt keine `.eml`, rendert keinen HTML-Teil, zeigt keinen Anhangsinhalt.
  `proof:addin` Abschnitt 0 mißt bereits, daß es im Add-in kein `innerHTML` und kein
  `dangerouslySetInnerHTML` gibt.
- **Der 60-Sekunden-Deckel je Anhang ist eine Zahl aus dem Entwurf** (D-04) und steht als
  benannte Konstante in `TaskPane.tsx`. Er begrenzt eine Systemantwort, keine Eingabe des
  Benutzers (WCAG 2.2.1).
- **Nicht geprüft, weil hier kein Outlook läuft:** daß `getAsFileAsync` wirklich EML liefert,
  daß `isSetSupported('Mailbox','1.14')` auf einem echten Wirt das Erwartete sagt, daß
  `ItemChanged` an einem angehefteten Bereich auslöst. Das gehört auf einen Windows-Rechner mit
  Outlook und steht hier als ungeprüft.

## Offene Fragen

1. **Erledigt, steht nur als Merkposten:** Das Tor war zweimal rot an domain-devs halb
   geschriebenem `app.ts` und ist beim dritten Lauf grün. Falls in dieser Welle noch jemand
   in `apps/local-api/` schreibt, gilt mein grüner Lauf für den Stand von 16:47 und nicht für
   den danach.
2. **Nimmt der Dienst die Nutzlast in der oben beschriebenen Form an?** Sobald das feststeht,
   fallen drei Zeilen im Add-in: das Feld in `CreateTodoRequest`, die Konstante
   `ATTACHMENTS_TRAVEL_WITH_CREATE` und die Weitergabe in `TaskPane.submitCreate`.
   `proof:addin` Abschnitt 22 hält Konstante und Feld **gegeneinander**: Wer eines ändert und
   das andere nicht, wird rot.
3. **Die zwei Listen von Gründen gehören zusammengeführt** (Nachtrag oben). Solange das nicht
   entschieden ist, stehen zwei Sätze in meiner Oberfläche, die es vorher nicht gab und die
   mit der Zusammenführung wieder verschwinden könnten — **ux-designer möge sie ansehen oder
   sie mit `too_many`/`total_too_large` streichen**:
   - „… nicht übernommen. Es werden höchstens «N» Dateien je E-Mail übernommen."
   - „… nicht übernommen. Zusammen dürfen die Dateien einer E-Mail «X» nicht überschreiten."

   **F-01 und F-03 sind damit beantwortet, ohne daß jemand raten mußte:** 25 MB je Datei,
   48 MB in der Summe, 25 Dateien — und alle drei stehen in `packages/domain`, nicht im Add-in.
4. **Der Entwurf T-298 sollte um E-109 berichtigt werden** (Befund 2). Z7, Abschnitt 8.2,
   4.6 (b), AK-15 bis AK-18 und R-c stehen dort in der Fassung vor der Entscheidung. Das
   gehört ux-designer, nicht mir.
5. **A-A-96 Punkt 3 in meiner Lesart** (Annahme 1) — bitte durch security-checker bestätigen
   oder verwerfen.
6. **`proof:addin` Abschnitt 18** mißt weiterhin die Abwesenheit jeder Anhangstür unter
   `/addin`. Er ist **nicht** angefasst, wie beauftragt. Er gehört mit der Route in die nächste
   Welle — und zwar so, daß er die Abwesenheit der Tür am **vorhandenen** Todo weiter mißt
   (A-A-82), nicht die Abwesenheit jeder Anhangsverarbeitung.

## Nächster Schritt

Nach domain-devs Abschluß eine kurze Anschlußaufgabe, die genau vier Dinge tut: die drei Zeilen
der Naht im Add-in setzen, `AddinContextDto.emailAttachments` gegen die tatsächliche Antwort
halten, `proof:addin` Abschnitt 18 auf die Wirkung statt den Namen umstellen, und die Abnahme
A-19.33 einmal von Ende zu Ende messen — zwei Dateianhänge, drei Anhänge am Todo. Parallel
dazu: T-298 um E-109 berichtigen (ux-designer) und die Kennzeichnung des Nachbaus in Bestand
und Rückfrage bauen (domain-dev, frontend-dev), sonst ist A-19.22b nur zur Hälfte erfüllt.
