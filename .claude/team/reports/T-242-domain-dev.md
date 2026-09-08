# T-242 — domain-dev

**Aufgabe:** A-A-69 — die Reihenfolge der Wächterkette messen.
**Status:** fertig
**Datum:** 2026-09-08

## Artefakte

- `apps/local-api/scripts/proof-route-policy.mjs`

## Zusammenfassung

`proof:route-policy` liest `src/app.ts` mit dem TypeScript-Syntaxbaum und hält die zehn
`app.use('*', …)`-Registrierungen gegen eine ausgeschriebene Reihenfolge. Die bisher separat
gepflegte Zahl wird aus dieser Liste abgeleitet. Der unveränderte Baum liefert 44/44; vier
Verstümmelungen in einer Wegwerfkopie enden jeweils mit Code 1 und nennen den betroffenen Wächter:
`securityHeaders` beziehungsweise `contentTypeGuard` als `app.all`, `authGuard` vor `hostGuard`
und ein gestrichener `originGuard`. `proof:openapi` bleibt bei 114/114.

## Annahmen

- Nur ein benannter, aufgerufener Wächter in `app.use('*', name(...))` zählt. Eine andere
  Registrierungsform ist absichtlich ein Befund, weil `app.all` als Endpunkt antworten kann.
- Der Syntaxbaum wird statt eines regulären Ausdrucks benutzt, damit Kommentare und
  Zeichenketten keine Registrierungen vortäuschen können.

## Risiken

Der Nachweis liest Quelltext und nicht Verhalten. Ein verhaltensneutraler Umbau der Kette macht
ihn absichtlich rot; diese Grenze steht im Kopf des Laufs.

## Offene Fragen

Keine.

## Nächster Schritt

T-243 nimmt die Nachweise aus T-235 ab; danach vollständiges Qualitätstor.
