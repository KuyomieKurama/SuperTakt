/**
 * Takt — `apps/outlook-addin/src/text/hidden.ts` ist seit T-123 eine reine
 * Wiederausfuhr aus `@takt/domain` (E-063, T-119, T-122, T-123).
 *
 * ---------------------------------------------------------------------------
 * Umgebaut in T-131 — eine Gleichheitsprüfung statt einer dritten Randtabelle
 * ---------------------------------------------------------------------------
 *
 * Bis hierher stand die VOLLSTÄNDIGE Randtabelle der Zeichenklasse ein
 * zweites Mal in dieser Datei — unabhängig geschrieben, unabhängig von der
 * Tabelle in `apps/local-api/test/http/input.test.ts` und seit T-127 auch
 * von der an der Quelle selbst (`packages/domain/test/characters.test.ts`).
 * Drei Abschriften derselben Wahrheit in Testdateien sind dasselbe Muster,
 * das T-117/T-119 im Produktivcode möglich gemacht hat, nur eine Ebene
 * tiefer.
 *
 * Seit T-123 ist eine andere, stärkere Prüfung überhaupt erst möglich:
 * `hidden.ts` FÜHRT die Klasse nicht mehr, sie IST die Klasse der Domäne
 * (reine Wiederausfuhr, keine Kopie). Ein Verhaltensvergleich — dieselben
 * Randwerte hier wie dort, beide grün — hätte trotzdem eine zweite Fassung
 * NICHT bemerkt, solange sie sich zeichengleich verhält: T-123 hat genau das
 * gemessen (Gegenprobe A seines Berichts): Setzt man die alte, eigene Klasse
 * probeweise wieder ein, bleiben alle Verhaltensprüfungen grün, weil sie
 * Ergebnisse vergleichen und keine Herkunft (E-063 Punkt 5). Deshalb prüft
 * diese Datei jetzt GLEICHHEIT DER OBJEKTE (`toBe`, nicht `toEqual`): Zwei
 * Funktionen, die sich nur gleich verhalten, können sich beim nächsten Mal
 * verschieden verhalten; ein einziges Objekt kann das nicht.
 *
 * Die Randtabelle selbst — WELCHE Codepunkte verboten sind, welche Ausnahme
 * der Steuer-Leerraum bekommt — steht nur noch an einer Stelle:
 * `packages/domain/test/characters.test.ts`. Was hier bleibt, ist die
 * Gleichheitsprüfung plus ein einziger, benannter Rauchtest (der Kernfall aus
 * T-119), der zeigt, dass die Umleitung selbst funktioniert — dass also
 * `dropHidden` wirklich an `dropHiddenCharacters` hängt und nicht etwa an
 * `hasHiddenCharacter` vertauscht wurde. Das ist etwas anderes als die
 * Gleichheitsprüfung: Zwei Namen können auf zwei verschiedene, aber jeweils
 * für sich genommen echte Domänenfunktionen zeigen (dann wäre jede einzelne
 * Gleichheitsprüfung für sich grün) und trotzdem am falschen Namen hängen
 * (`dropHidden` würde dann streichen statt fallen lassen — derselbe Fehler
 * wie eine vertauschte E-063-Behandlung). Der Rauchtest ruft die
 * Add-in-Namen tatsächlich auf und prüft das Ergebnis; die Gleichheitsprüfung
 * prüft die Herkunft. Beides zusammen und keins für sich allein deckt beide
 * Fehlerarten ab.
 *
 * Keine echten Call-Nummern, Kundennamen oder Zugangsdaten. "Rechnung" im
 * RLO-Beispiel ist die Situation aus dem T-119-Bericht ("Rechnung<RLO>gnp.exe"
 * las sich als "Rechnung exe.png"), keine echte Datei.
 */
import {
  HIDDEN_MARKER as DOMAIN_HIDDEN_MARKER,
  dropHiddenCharacters,
  hasHiddenCharacter,
  visibleText as domainVisibleText,
} from "@takt/domain";
import { describe, expect, it } from "vitest";
import { HIDDEN_MARKER, dropHidden, hasHidden, visibleText } from "../../src/text/hidden.ts";

// RLO (Right-to-Left Override), als Escape-Folge und nicht als rohes Zeichen
// im Quelltext (T-112-H2): Ein rohes Richtungszeichen drehte dieselbe Zeile
// um, die es beschreibt.
const RLO = "\u202e";

describe("hidden.ts ist eine reine Wiederausfuhr — Gleichheit der Objekte, nicht nur ihres Verhaltens (E-063 Punkt 5, T-131)", () => {
  it("dropHidden IST dropHiddenCharacters aus der Domäne — dasselbe Funktionsobjekt, kein Verhaltensklon", () => {
    expect(dropHidden).toBe(dropHiddenCharacters);
  });

  it("hasHidden IST hasHiddenCharacter aus der Domäne — dasselbe Funktionsobjekt, kein Verhaltensklon", () => {
    expect(hasHidden).toBe(hasHiddenCharacter);
  });

  it("visibleText IST das visibleText der Domäne — dasselbe Funktionsobjekt, kein Verhaltensklon", () => {
    expect(visibleText).toBe(domainVisibleText);
  });

  it("HIDDEN_MARKER ist derselbe Wert wie in der Domäne", () => {
    expect(HIDDEN_MARKER).toBe(DOMAIN_HIDDEN_MARKER);
  });
});

describe("Ein Rauchtest über die Add-in-Namen — die Umleitung selbst funktioniert, keine Verwechslung der drei Funktionen (E-063 Punkte 2 und 3)", () => {
  it("der RLO-Kernfall aus T-119, aufgerufen über die Add-in-Namen: erkannt, gestrichen (dropHidden), markiert (visibleText)", () => {
    const trick = `Rechnung${RLO}gnp.exe`;
    expect(hasHidden(trick)).toBe(true);
    expect(dropHidden(trick)).toBe("Rechnunggnp.exe");
    expect(visibleText(trick)).toBe(`Rechnung${HIDDEN_MARKER}gnp.exe`);
    // dropHidden STREICHT, visibleText MARKIERT — eine vertauschte Zuordnung
    // wäre derselbe Fehler wie eine falsche Objektreferenz oben, nur am
    // Verhalten statt an der Herkunft sichtbar.
    expect(dropHidden(trick)).not.toBe(visibleText(trick));
  });
});
