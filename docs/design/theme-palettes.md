# Farbthemen im klassischen Layout

Klassisch ist die Vorgabe. Die zusätzlichen Themes ändern semantische Farbtoken
und Oberflächeneffekte; Navigation, Karten, Abstände und Bedienung bleiben klassisch.
Die alte gespeicherte Auswahl `clear` wird als Klassisch dargestellt.

Die Auswahl entsteht aus den CSS-Dateien unter
[`apps/web/src/styles/themes/`](../../apps/web/src/styles/themes/README.md).
Palette, Beschreibung, Reihenfolge und Modus werden je Theme dort gepflegt.
`scripts/sync-themes.mjs` erzeugt daraus die benötigten Abbilder; eine zweite
Liste der Themes wird hier nicht geführt.

Feste helle/dunkle Paletten tragen ihren Modus in der Auswahl. Der Farbmodus wird
für diese Palette angewendet, ohne die gespeicherte System/Hell/Dunkel-Vorliebe
zu überschreiben. Beim Wechsel zu einem anpassbaren Theme gilt diese wieder.
Alle Paletten werden lokal mitgeliefert; zur Laufzeit erfolgt kein Download.

## Farbreferenzen

- [Super Productivity Themes](https://github.com/super-productivity/super-productivity/tree/master/src/assets/themes): Ausgangsfarben und Materialideen; für SuperTakts Komponenten neu umgesetzt.
- [Catppuccin Palette](https://catppuccin.com/palette/): alle vier offiziellen Farbvarianten.
- [Nord Palette](https://www.nordtheme.com/docs/colors-and-palettes/): Polar Night und Snow Storm.

Everfrost ist die gewünschte Beschriftung; die Naturfarben orientieren sich an
Everforest. Kontraste für Texte, Links und Eingaberänder werden für SuperTakt
angepasst. Exportstatus und Timer behalten ihre semantischen Signalfarben.
