# Vorlagen für die Gegenprobe zu `distContainsRenderedText` (T-263)

Keine echten Bauergebnisse — von Hand geschriebene Nachbildungen der Form, die `vite build`
tatsächlich erzeugt (ESM-Bündelstücke mit `import…from"./Name-<hash>.js"`, `export{…}`,
`//# sourceMappingURL=…`-Kommentar am Ende). Erfundene Bezeichner, keine echten Kunden- oder
Personendaten.

Zweck: `web-build-smoke.spec.ts`s Gegenprobe zur Feldbezeichnung „Frist" (A-19.2) soll unabhängig
davon gelten, wie `apps/web/src/shared/ui/DeadlineFlag.tsx` heute zufällig gebündelt wird — eine
feste Vorlage hält die Eingabe fest, während der Produktivcode sich weiterbewegt.

## `ohne-verstoss/`

Bildet den am echten `apps/web/dist` gemessenen Befund aus T-263 nach: Ein eigenes
`DeadlineFlag-<hash>.js`-Bündelstück (seit dem `shared/ui`-Umbau ein eigenes Bündelstück, weil
mehrere Merkmale es benutzen), eine Import-Angabe darauf aus einem anderen Bündelstück
(`BoardScreen-<hash>.js`), eine Vorlade-Liste mit demselben Dateinamen als rohe Zeichenkette
(`preload-manifest-<hash>.js`), und Requisitennamen (`onDeadlineChange`, `deadlineFilter`) — alles
Bezeichner, keine Anführungszeichen. Zusätzlich ein erfundenes `FälligkeitsdatumBadge-<hash>.js`
für dieselbe Prüfung am zweiten verbotenen Wort. Der einzige tatsächlich gerenderte Text in dieser
Vorlage ist „Frist" — korrekt, kein Fund.

`fällig am` kommt in dieser Vorlage nirgends vor, auch nicht als Bezeichner oder Dateiname — ein
Leerzeichen ist in beidem ungültig, die Bauart aus T-263 (ein Bezeichner trägt zufällig dieselbe
Zeichenfolge wie das verbotene Wort) kann bei einem zweiteiligen Ausdruck mit Leerzeichen
strukturell nicht auftreten. Die Negativkontrolle für dieses Wort ist deshalb „kommt in
`ohne-verstoss/` an keiner Stelle vor", nicht ein eigens konstruierter Bezeichner-Fund.

## `mit-verstoss/`

Je eine Datei je verbotenem Wort, mit demselben Rauschen (Importe, Bezeichner) wie in
`ohne-verstoss/`, aber mit einem echten JSX-Kind-String-Literal — derselben Form wie ein
tatsächlich gerendertes `e.jsx("span",{},"Deadline")`. Beweist, dass die Verengung aus T-263 einen
echten Verstoß weiterhin meldet (E-101/E-103: ein Sieb, das nach der Verengung nicht mehr rot
werden kann, ist keins) und nennt dabei die Fundstelle.
