#!/usr/bin/env python3
"""Takt - die Auswertung der Bilder (T-232).

Aufruf:  measure-bands.py <bild.png> <auftrag.json>
Ausgabe: eine Zeile JSON auf die Standardausgabe.

Drei Messungen, drei Fragen
---------------------------
1. Ein **waagerechter** Schnitt durch die Knopfmitte. Ab dem ersten Bildpunkt,
   der nicht die Flaechenfarbe traegt, werden `fenster` Bildpunkte gelesen und
   gleiche Farben zu Baendern zusammengefasst. Antwort: die Reihenfolge der
   Baender von der Flaeche zur Fuellung. Der Fundort wird **mitgemeldet**,
   damit der Lauf ihn gegen die gerechnete Koordinate halten kann.
2. Ein **senkrechter** Schnitt an bekannter Stelle durch die linke Kante der
   zwei Felder. Antwort: Zahl der Striche und Zahl der Luecken - also die
   **Form**.
3. **Die Farbfelder.** Fuer jede gemessene Farbe: in welchen Spaltenbereichen
   des ganzen Bildes kommt sie ueberhaupt vor.

Warum es die dritte Messung gibt
--------------------------------
Beim ersten Messen hat eine Sonde die durchgezogene Schiene ueber ihre Farbe
gesucht - und dieselbe Farbe traegt in Takt auch der Fokusring. Der Schnitt
lief durch Knopf **und** Schiene und meldete als "Luecke" den Abstand zwischen
beiden. Die Zahl war falsch, ohne falsch auszusehen.

Eine Sonde, deren Farbe an mehr als einer Stelle vorkommt, misst etwas anderes,
als sie behauptet. Deshalb zaehlt diese Auswertung die Vorkommen, und der Lauf
wird rot, wenn es mehr sind als erwartet - das ist billiger als jede spaetere
Auslegung.

Was hier bewusst **nicht** gemessen wird
----------------------------------------
Die **Laengen** der Striche, ihre **Anzahl** als feste Zahl, die bemalte Laenge
und ihr Anteil - und kein Vergleich gegen ein hinterlegtes Bild (P-3 aus
`docs/design/traeger-und-zusage.md` 2.8). Der Rhythmus einer unterbrochenen
Linie ist Sache der Engine; WebKitGTK und Chromium teilen dieselbe Strecke
verschieden auf, und beide sind richtig. Gemessen wird die **Form**. Ueber die
Schranken urteilt der Lauf, nicht diese Datei: sie liefert Zahlen, keine Noten.

Farbzuordnung
-------------
Jeder Bildpunkt wird auf die naechstliegende Farbe der Tafel abgebildet, aber
nur innerhalb von `TOLERANZ` je Kanal. Ein Bildpunkt ausserhalb bleibt als
roher Wert stehen und faellt damit als unbekanntes Band auf - das ist die
gewuenschte Richtung: lieber ein gemeldeter Fremdton als ein stillschweigend
eingerundeter.
"""

import json
import sys

from PIL import Image

TOLERANZ = 6
"""Abstand je Kanal, innerhalb dessen ein Bildpunkt einer benannten Farbe gilt."""


def als_hex(rgb):
    return "#%02x%02x%02x" % (rgb[0], rgb[1], rgb[2])


def zerlege(hexwert):
    h = hexwert.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def trifft(rgb, ziel):
    return all(abs(rgb[i] - ziel[i]) <= TOLERANZ for i in range(3))


def benenne(rgb, tafel):
    """Bildet einen Bildpunkt auf einen Namen der Tafel ab, oder auf seinen Rohwert."""
    for name, wert in tafel.items():
        if trifft(rgb, zerlege(wert)):
            return name
    return als_hex(rgb)


def naeher_an(rgb, a, b):
    """True, wenn `rgb` naeher an `a` liegt als an `b`. Faengt die Kantenglaettung."""
    ta, tb = zerlege(a), zerlege(b)
    da = sum((rgb[i] - ta[i]) ** 2 for i in range(3))
    db = sum((rgb[i] - tb[i]) ** 2 for i in range(3))
    return da <= db


def laeufe(werte):
    """Fasst gleiche Nachbarn zu Laeufen zusammen."""
    ergebnis = []
    for wert in werte:
        if ergebnis and ergebnis[-1]["wert"] == wert:
            ergebnis[-1]["laenge"] += 1
        else:
            ergebnis.append({"wert": wert, "laenge": 1})
    return ergebnis


def miss_baender(bild, auftrag):
    """Der waagerechte Schnitt. Liefert die Baender und, falls leer, den Grund."""
    breite, _hoehe = bild.size
    y = auftrag["knopfschnitt"]["y"]
    tafel = auftrag["tafel"]
    flaeche = zerlege(tafel["flaeche"])

    zeile = [bild.getpixel((x, y)) for x in range(breite)]
    fremd = [x for x, rgb in enumerate(zeile) if not trifft(rgb, flaeche)]

    if not fremd:
        return {
            "gemessen": False,
            "grund": f"In Zeile {y} steht nur die Flaechenfarbe - der Knopf ist nicht da.",
            "baender": [],
        }

    # Ein einziger zusammenhaengender Abschnitt ist die Zusage; alles andere
    # heisst, dass in dieser Zeile noch etwas anderes steht als der Knopf.
    abschnitte = []
    for x in fremd:
        if abschnitte and abschnitte[-1][1] == x - 1:
            abschnitte[-1][1] = x
        else:
            abschnitte.append([x, x])

    start = abschnitte[0][0]
    fenster = auftrag["fenster"]
    punkte = [benenne(rgb, tafel) for rgb in zeile[start : start + fenster]]
    return {
        "gemessen": True,
        "grund": "",
        "start": start,
        "abschnitte": [{"von": a, "bis": b} for a, b in abschnitte],
        "baender": [{"farbe": lauf["wert"], "laenge": lauf["laenge"]} for lauf in laeufe(punkte)],
    }


def miss_schiene(bild, schnitt, hintergrund):
    """Der senkrechte Schnitt an bekannter Stelle, ueber die ganze Bildspalte.

    Kein Fenster: P-1 spricht von der Form "entlang ihrer Laenge". Ein
    Ausschnitt mittendrin schnitte Striche an den Raendern ab und zaehlte
    weniger, als die Engine zeichnet - und das waere ein falscher Alarm an
    genau der Schranke, die P-4 gesetzt hat.

    Gezaehlt wird zwischen dem ersten und dem letzten Balken der Spalte. Was
    davor und dahinter liegt, ist Flaeche und keine Luecke.
    """
    _breite, bildhoehe = bild.size
    x = schnitt["x"]
    spalte = [bild.getpixel((x, y)) for y in range(bildhoehe)]
    zuordnung = ["balken" if naeher_an(rgb, schnitt["farbe"], hintergrund) else "luecke" for rgb in spalte]

    balken = [y for y, wert in enumerate(zuordnung) if wert == "balken"]
    if not balken:
        return {
            "name": schnitt["name"],
            "x": x,
            "striche": [],
            "luecken": [],
            "bemalt": 0,
            "laenge": 0,
            "oben": None,
            "unten": None,
        }

    oben, unten = balken[0], balken[-1]
    gruppen = laeufe(zuordnung[oben : unten + 1])
    return {
        "name": schnitt["name"],
        "x": x,
        "striche": [lauf["laenge"] for lauf in gruppen if lauf["wert"] == "balken"],
        "luecken": [lauf["laenge"] for lauf in gruppen if lauf["wert"] == "luecke"],
        "bemalt": sum(lauf["laenge"] for lauf in gruppen if lauf["wert"] == "balken"),
        "laenge": unten - oben + 1,
        "oben": oben,
        "unten": unten,
    }


def zaehle_farbfelder(bild, farben):
    """Fuer jede Farbe: die zusammenhaengenden Spaltenbereiche, in denen sie vorkommt."""
    breite, hoehe = bild.size
    ergebnis = {}
    for name, wert in farben.items():
        ziel = zerlege(wert)
        spalten = []
        for x in range(breite):
            for y in range(hoehe):
                if trifft(bild.getpixel((x, y)), ziel):
                    spalten.append(x)
                    break
        felder = []
        for x in spalten:
            if felder and felder[-1]["bis"] == x - 1:
                felder[-1]["bis"] = x
            else:
                felder.append({"von": x, "bis": x})
        ergebnis[name] = [{"von": f["von"], "breite": f["bis"] - f["von"] + 1} for f in felder]
    return ergebnis


def main(argv):
    if len(argv) != 3:
        sys.stderr.write("Aufruf: measure-bands.py <bild.png> <auftrag.json>\n")
        return 2

    with open(argv[2], "r", encoding="utf-8") as datei:
        auftrag = json.load(datei)

    bild = Image.open(argv[1]).convert("RGB")
    ergebnis = {"groesse": list(bild.size)}

    if "knopfschnitt" in auftrag:
        ergebnis["knopf"] = miss_baender(bild, auftrag)
    if "schienenschnitte" in auftrag:
        hintergrund = auftrag["tafel"]["flaeche"]
        ergebnis["schienen"] = [miss_schiene(bild, s, hintergrund) for s in auftrag["schienenschnitte"]]
    ergebnis["farbfelder"] = zaehle_farbfelder(bild, auftrag["farbfelder"])

    sys.stdout.write(json.dumps(ergebnis, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
