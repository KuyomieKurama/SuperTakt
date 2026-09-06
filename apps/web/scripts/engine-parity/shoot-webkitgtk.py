#!/usr/bin/env python3
"""Takt - ein Bild der Vorrichtung aus dem System-WebKitGTK (T-232).

Aufruf:  shoot-webkitgtk.py <datei-adresse> <ziel.png> <breite> <hoehe>

Warum dieses Skript existiert
-----------------------------
Playwright bringt sein eigenes, festgeschriebenes WebKit mit. Das ist nicht die
Engine, mit der das Linux-Erzeugnis von Takt zeichnet - die Huelle benutzt das
WebKitGTK des Systems. Dieses Skript geht an dieser Vorrichtung vorbei und
fragt genau die Bibliothek, die im Erzeugnis steckt (WebKit2 4.1).

Zwei Punkte, die beim Bauen Zeit gekostet haben und deshalb hier stehen:

  * `Gtk.OffscreenWindow` waere die naheliegende Wahl und ist die falsche: Sie
    verlangt einen GL-Kontext, den Xvfb nicht stellt. Ein gewoehnliches
    `Gtk.Window` unter Xvfb tut es.
  * Der Schnappschuss muss **nach** dem ersten Malen geholt werden.
    `LoadEvent.FINISHED` ist dafuer zu frueh; deshalb liegt eine kurze Frist
    dazwischen.

Das Skript schreibt nichts ausser der Bilddatei und meldet ueber seinen
Rueckgabewert.
"""

import sys

import gi

gi.require_version("Gtk", "3.0")
gi.require_version("WebKit2", "4.1")

from gi.repository import GLib, Gtk, WebKit2  # noqa: E402  (nach require_version)

MALFRIST_MS = 300
"""Frist zwischen `FINISHED` und Schnappschuss. Kurz, aber nicht null."""

ABBRUCHFRIST_S = 30
"""Notbremse. Ohne sie haengt ein fehlgeschlagener Lauf endlos in `Gtk.main`."""


def main(argv):
    if len(argv) != 5:
        sys.stderr.write("Aufruf: shoot-webkitgtk.py <adresse> <ziel.png> <breite> <hoehe>\n")
        return 2

    adresse, ziel, breite, hoehe = argv[1], argv[2], int(argv[3]), int(argv[4])

    zustand = {"code": 1, "grund": "Der Schnappschuss wurde nie geholt."}

    fenster = Gtk.Window()
    fenster.set_default_size(breite, hoehe)
    ansicht = WebKit2.WebView()
    fenster.add(ansicht)
    fenster.show_all()

    def fertig(view, ergebnis, _daten):
        try:
            flaeche = view.get_snapshot_finish(ergebnis)
            flaeche.write_to_png(ziel)
            zustand["code"] = 0
            zustand["grund"] = ""
        except (GLib.Error, OSError) as fehler:
            zustand["code"] = 1
            zustand["grund"] = str(fehler)
        Gtk.main_quit()

    def hole():
        ansicht.get_snapshot(
            WebKit2.SnapshotRegion.FULL_DOCUMENT,
            WebKit2.SnapshotOptions.NONE,
            None,
            fertig,
            None,
        )
        return False

    def geladen(_view, ereignis):
        if ereignis == WebKit2.LoadEvent.FINISHED:
            GLib.timeout_add(MALFRIST_MS, hole)

    def abbruch():
        zustand["code"] = 1
        zustand["grund"] = "Zeitueberschreitung: die Vorrichtung wurde nicht fertig geladen."
        Gtk.main_quit()
        return False

    ansicht.connect("load-changed", geladen)
    GLib.timeout_add_seconds(ABBRUCHFRIST_S, abbruch)
    ansicht.load_uri(adresse)
    Gtk.main()

    if zustand["code"] != 0:
        sys.stderr.write(f"WebKitGTK: {zustand['grund']}\n")
        return zustand["code"]

    # P-5: Die Fassung gehoert zur Messung. Ohne sie ist die naechste Messung
    # in einer anderen Fassung mit dieser nicht vergleichbar.
    fassung = "%d.%d.%d" % (
        WebKit2.get_major_version(),
        WebKit2.get_minor_version(),
        WebKit2.get_micro_version(),
    )
    sys.stdout.write(fassung)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
