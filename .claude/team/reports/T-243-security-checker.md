# T-243 — security-checker

**Aufgabe:** Abnahme von T-235 (A-A-66 bis A-A-68).
**Status:** fertig, freigegeben
**Datum:** 2026-09-08

## Artefakte

- Dieser Bericht; keine Produktivdatei geändert.

## Zusammenfassung

Der unveränderte Baum liefert `proof:tags` 45/45 und `proof:access` 108/108. In einer getrennten
Wegwerfkopie wurden neun Gegenproben gefahren; jede endete mit Code 1. Die entscheidenden
Kombinationen stimmen mit T-235 überein: gebrochene Tag-Transaktion plus vorgeschaltete
Gestaltprüfung ergibt 43/2, entfernte Tagnamen-Obergrenze plus Gestaltprüfung ebenfalls 43/2,
und eine übersehene Unterordnerdatei ergibt 107/1. A-A-66, A-A-67 und A-A-68 sind damit in beide
Richtungen abgenommen.

## Gemessene Gegenproben

| Verletzung | Ergebnis |
|---|---:|
| Abschnitt 5: Gestaltprüfung statt Fremdschlüsselbruch | 43/2 |
| Tag-Anlage in eigener Transaktion | 42/3 |
| beides zusammen | 43/2 |
| `tagNames.max(50)` auf 500 geweitet | 44/1 |
| geweitete Grenze plus überlange Titel | 43/2 |
| überlange Titel bei intakter Grenze | 43/2 |
| Unterordnerdatei plus Sammler ohne `recursive` | 107/1 |
| erste Sammlerendung `.ts` auf `.tsx` verengt | 105/3 |
| verbotener Vergleich in einer neuen flachen Datei | 107/1 |

## Annahmen

Keine über die Ergebnisse; alle Zahlen und Ausgangscodes wurden erneut gemessen.

## Risiken

Die Zeitmessung in `proof:access` blieb diesmal innerhalb der Schwelle (Streuung 1,02). Ihre
bekannte Lastempfindlichkeit bleibt ein nicht blockierender Rest.

## Offene Fragen

Keine.

## Nächster Schritt

Vollständiges Qualitätstor; danach nur noch ausdrücklich umgebungsgebundene Grenzen als solche
führen.
