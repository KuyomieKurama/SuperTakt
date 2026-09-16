# Themes pflegen

Jede `.css`-Datei in diesem Ordner ist ein Theme. Dateiname, Kopfkommentar und
CSS reichen aus; keine Importliste, TypeScript-Aufzählung oder SQL-Liste ergänzen.
Die bestehenden Dateien eignen sich als Ausgangspunkt, etwa `arc.css` für ein
festes dunkles Theme oder `everfrost.css` für Hell und Dunkel.

Beispiel `ocean.css`:

```css
/* @theme {"label":"Ocean","mode":"dark","hint":"Dunkles Blau","order":100} */
:root[data-design-theme="ocean"] {
  --preset-canvas: #101820;
  --preset-surface: #182530;
  --preset-ink: #f0f5fa;
  --preset-muted: #b8c8d8;
  --preset-accent: #82cfff;
  --preset-link: #82cfff;
  --preset-on: #101820;
  --preset-accent-hover: #a0daff;
  --preset-accent-active: #b5e2ff;
}
```

- Der Dateiname ohne `.css` ist die dauerhafte Kennung: Kleinbuchstaben,
  Ziffern und einzelne Bindestriche, Beginn mit einem Buchstaben, höchstens
  64 Zeichen. Der CSS-Selektor muss dieselbe Kennung verwenden.
- `label` ist der Anzeigename, `hint` die Beschreibung. Beide sind Pflicht.
- `mode` ist `dark`, `light` oder `auto`. Bei `auto` gilt die gespeicherte
  Hell-/Dunkel-/Systemwahl. Eine automatische Palette definiert ihre dunklen
  Farben sowohl für `[data-theme="dark"]` als auch in der Media Query für
  `prefers-color-scheme: dark`; `everfrost.css` zeigt beide Fälle.
- `order` ist optional und bestimmt die Reihenfolge, Vorgabe 100. Klassisch
  steht immer zuerst. Bei gleichem Wert entscheidet die Kennung.
- Alle neun `--preset-*`-Farben des Beispiels sind erforderlich. Zusätzliche
  Effekte gehören ebenfalls in diese Datei und unter ihren Theme-Selektor.
- `classic.css` übernimmt die gemeinsamen Grundtoken. Dort können semantische
  Token wie `--bg-canvas` direkt überschrieben werden. `classic` bleibt als
  Rückfall erforderlich; `clear` ist für ältere Bestände reserviert.

## Übernahme

`pnpm dev` erkennt neue, geänderte und entfernte Theme-Dateien und lädt die
Oberfläche neu. Die Theme-Listen werden ebenfalls aktualisiert. Wenn ein neuer
Theme-Name hinzukommt, muss auch ein bereits laufender lokaler Dienst neu
starten, weil seine geprüfte Auswahl beim Start geladen wird.

Für die Desktop-App: regulär schließen und `pnpm desktop` erneut starten.
Dabei werden die Listen erzeugt und der Sidecar neu gebaut. Ein fertiges
Installationspaket erhält neue Themes durch einen neuen `pnpm desktop:build`;
das Installationsverzeichnis wird nicht zur Laufzeit nach CSS durchsucht.

Ohne Entwicklungsserver lassen sich die Abbilder mit `pnpm themes:sync`
erzeugen. `pnpm themes:check` prüft nur, ob sie aktuell sind. Vor einem
`pnpm check` die Abbilder synchronisieren; veraltete Abbilder machen das Gate rot.
Die generierten Dateien werden mit eingecheckt.

## Was automatisch entsteht

`scripts/sync-themes.mjs` erzeugt den CSS-Importplan `../theme-palettes.css`,
den Katalog der Oberfläche, die Theme-Kennungen der Domäne und das frühe
Startskript. Es aktualisiert außerdem die beiden Enum-Felder der OpenAPI-
Beschreibung. Diese Inhalte nicht von Hand bearbeiten.

`../theme-base.css` übersetzt die Palettenfarben in die gemeinsamen semantischen
Token. Das gehört zur Infrastruktur; einzelne Themes benötigen dort keine Änderung.
Die SQLite-Migration `0024_theme_identifiers` erlaubt zusätzliche Kennungen,
während die API weiterhin nur die mitgelieferten Themes annimmt.

Entfernte Themes fallen bei der Anzeige auf Klassisch zurück. Theme-Dateien
werden lokal gebündelt; es werden keine Themes aus dem Netz nachgeladen.
