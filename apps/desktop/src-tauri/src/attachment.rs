//! Takt — die zwei Öffnen-Befehle für Anhänge (A-19.9, A-19.18, E-072,
//! Auflagen A-A-1 bis A-A-8 aus `docs/bedrohungsmodell.md` Abschnitt 20).
//!
//! ## Warum die ganze Kontrolle in dieser Datei liegt
//!
//! T-136 hat `tauri-plugin-shell 2.3.6` gemessen: `Shell::open`
//! (`src/lib.rs:76-78`) reicht an `open::open(None, …)` durch, und `open::open`
//! sagt im eigenen Quelltext *„when running directly from Rust code we don't
//! need to validate the path"*. Der `OpenScope` mit dem Prüfausdruck wird
//! ausschließlich betreten, wenn der Aufruf **aus JavaScript** kommt — und aus
//! JavaScript kommt hier keiner, weil `capabilities/default.json` keine
//! `shell:`-Zeile trägt (A-V-17, A-A-11).
//!
//! Zwischen einer Zeichenkette aus dem Bestand und `xdg-open` beziehungsweise
//! `ShellExecuteW` steht damit genau **eine** Kontrolle: [`check_link`] und
//! [`check_file`] in dieser Datei. Kein zweites Netz.
//!
//! ## Warum die Prüfung hier sitzt und nicht im Eingabefeld
//!
//! Zwischen Eingabe und Öffnen liegt der **Bestand**, und drei Wege führen an
//! jedem Eingabefeld vorbei in ihn hinein (Bedrohungsmodell 20.3): die Routen
//! des Dienstes (VG-1, jeder lokale Prozeß mit dem Sitzungsgeheimnis), die
//! SQLite-Datei selbst (VG-3, `sqlite3` und ein `UPDATE` genügen) und jede
//! künftige Migration oder jeder zweite Schreibpfad. Eine Prüfung im Feld ist
//! Bedienkomfort; die Kontrolle sitzt an der letzten Stelle, hinter der nichts
//! mehr kommt.
//!
//! ## Die drei Arten, und warum es nur zwei Befehle gibt
//!
//! Ein **Bild** öffnet gar nichts nach draußen (E-072 Punkt 2). Es wird als
//! `data:`-Adresse angezeigt, und das ist der ganze Umfang — es gibt deshalb
//! keinen dritten Befehl, den man versehentlich mit einem Pfad füttern könnte.
//!
//! Verweis und Datei haben **getrennte** Befehle mit je genau einem `String`
//! (A-A-1). Ein gemeinsamer Befehl mit einem Typkennzeichen wäre die Stelle,
//! an der ein falsch gesetztes Kennzeichen eine Adresse durch die Pfadprüfung
//! schickt.
//!
//! ## Der eigentliche Angriff ist die Normalisierung, nicht das Schema
//!
//! T-145 hat die Zeichenketten aus der Tafel in 20.2 gegen drei Fassungen
//! gefahren — **22**, nicht 28; die Zahl stand vier Stellen lang falsch und ist
//! mit T-164 (O-DI) berichtigt. Wer sie hier ändert, zählt die Tafel und
//! schreibt sie nicht ab; im Prüfteil steht sie ohnehin im Typ
//! (`[(&str, Option<Rejection>); 22]`) und wird dort rot, ohne daß jemand ein
//! Dokument gelesen haben muß. Ergebnis: Eine Positivliste aus `http` und
//! `https` reicht gegen alle
//! gefährlichen Schemata **und** gegen den UNC-Pfad in beiden Schreibweisen —
//! `\\server\freigabe` läßt sich gar nicht zerlegen, `file://server/freigabe`
//! fällt an der Positivliste.
//!
//! Gefährlich ist etwas anderes: Der Zerleger **normalisiert**. Er entfernt
//! Tabulator und Zeilenumbruch an jeder Stelle, schneidet führenden Leerraum
//! weg, wandelt Homoglyphen nach Punycode und läßt eine Nullbreite im
//! Wirtsnamen verschwinden. `ht<TAB>tps://exam<ZWSP>ple.org` wird zu
//! `https://example.org/`. Wer die **Rohfassung** anzeigt und die
//! **Normalform** öffnet, hat einen Verweis gebaut, der lügt.
//!
//! Die Antwort ist ein **Festpunkt** (A-A-3): Der gespeicherte Wert muß
//! bereits die Normalform sein, `Url::parse(x).as_str() == x`. Normalisiert
//! wird **einmal**, beim Anlegen, in `packages/domain` (A-A-13). Hier wird
//! nicht normalisiert, hier wird abgewiesen. T-145 hat für alle zehn Zeilen
//! der Festpunkttabelle gemessen, daß die Normalform idempotent ist — die
//! Auflage ist damit erfüllbar und nicht bloß streng.
//!
//! ## Warum `url` und nicht sieben Zeilen von Hand
//!
//! Bei der Fassungsbezeichnung (`release.rs`) war die handgeschriebene
//! Formprüfung richtig: ein Zeichenvorrat ohne `/`, `:`, `\`, `?`, `#` und
//! Leerzeichen, sieben Zeilen, keine Bibliothek. Hier ist es umgekehrt.
//! `url 2.5.8` liegt bereits im Baum (`Cargo.lock`, transitiv über `tauri`) —
//! eine unmittelbare Abhängigkeit ist **kein** Zuwachs in der Lieferkette
//! (T-145-12, VG-7). Und die Fälle aus 20.2 zeigen, wie viele Regeln man beim
//! Zerlegen von Hand nachbauen müßte, um dieselbe Aussage zu treffen.
//!
//! ## Zur Endungs-Verbotsliste, ausdrücklich
//!
//! Sie ist **keine Grenze** und wird hier nicht als eine verkauft (A-A-5).
//! `PATHEXT` ist unter Windows benutzerbestimmt, die Menge startbarer Endungen
//! damit nicht fest; und eine Liste, die blockiert, lehrt das Umbenennen.
//! `.exe`, `.bat`, `.ps1` werden deshalb **nicht** hier abgewiesen — sie gehen
//! durch die Rückfrage der Oberfläche, die den vollen Pfad nennt und ihre
//! Wörter nach der Endung wählt.
//!
//! Fünf Endungen stehen trotzdem hart auf der Verbotsliste, und zwar aus einem
//! anderen Grund: `.lnk`, `.url`, `.pif`, `.scf` und `.desktop` sind
//! **Umleitungen**. Bei ihnen zeigt der Pfad, den die Rückfrage nennt, nicht
//! auf das, was startet — eine `rechnung.lnk` trägt jedes Ziel und jedes
//! Symbol. Für sie ist die Rückfrage nicht bloß schwach, sondern aktiv
//! irreführend: Sie sagt die Wahrheit über die Datei und lügt über die Wirkung.
//!
//! ## Und warum die Endung nicht aus `Path::extension()` kommt (A-A-5′)
//!
//! T-156 hat die Verbotsliste mit **einem Zeichen** ausgehebelt:
//! `…/rechnung.lnk.` und `…/rechnung.lnk ` gingen durch, weil
//! `Path::extension()` dafür `""` beziehungsweise `"lnk "` liefert. **Windows
//! schneidet nachgestellte Punkte und Leerzeichen vom letzten
//! Namensbestandteil ab, bevor es die Datei auflöst** — `is_file()` bejaht
//! (dieselbe Abkürzung), und `ShellExecuteW` folgt danach der Verknüpfung.
//! Die Prüfung sah einen Namen, den das Betriebssystem nie zu sehen bekommt.
//!
//! Deshalb steht in [`has_indirect_extension`] eine eigene Zerlegung und nicht
//! `Path::extension()`. Sie tut zwei Dinge, und beide sind Absicht:
//!
//!  1. Sie schneidet nachgestellte `.` und Leerzeichen **vor** dem Vergleich
//!     ab — geprüft wird der Name, den Windows auflöst, nicht der gespeicherte.
//!  2. Sie zählt auch bei einem führenden Punkt: Für `Path::extension()` ist
//!     `.lnk` eine versteckte Datei **ohne** Endung (Unix-Sitte); für den
//!     Windows-Explorer ist es eine Verknüpfung.
//!
//! Beides gilt **auf jeder Plattform** und nicht nur unter `cfg(windows)`.
//! Derselbe Grund wie bei [`is_unc`]: Ein Zweig, der nur auf einem
//! Betriebssystem etwas tut, ist auf dem Läufer der Reihe unmeßbar (A-A-10),
//! und der Preis ist eine Datei namens `rechnung.lnk.` unter Linux, die Takt
//! nicht öffnet. Eine `.lnk` unter Linux tut ohnehin nichts.
//!
//! Wer hier später aufräumen und `Path::extension()` zurückholen will: Der
//! Fall heißt `x.lnk.`, er ist gemessen, und er steht als A-A-5′ im
//! Bedrohungsmodell.
//!
//! ## Und der Doppelpunkt, der dieselbe Zusage noch einmal brach (A-A-28)
//!
//! Der nachgestellte Punkt hatte einen Nachbarn. T-164 hat gegen wirklich
//! angelegte Dateien gemessen: `…/rechnung.lnk::$DATA` und
//! `…/rechnung.lnk:harmlos.txt` gingen **durch**. Unter NTFS ist der
//! Doppelpunkt der Trenner eines alternativen Datenstroms — `datei::$DATA`
//! löst auf den unbenannten Datenstrom von `datei` auf —, und damit redeten
//! `is_file()` und [`has_indirect_extension`] über verschiedene Dateien: Die
//! Existenzprüfung folgte der Auflösung von Win32, die Endungsprüfung nahm die
//! Zeichenkette und sah `lnk::$DATA`, also keine Umleitung. Die umgekehrte
//! Schreibweise (`bericht.txt:evil.lnk`) fiel schon immer, weil das letzte
//! Punktsegment dort `lnk` ist; gefährlich war die andere Richtung.
//!
//! [`has_stream_separator`] schließt das, und zwar **vor** der Endungsprüfung:
//! Ein Name mit Doppelpunkt hat keine beurteilbare Endung mehr, und die Frage
//! danach ist keine sinnvolle Frage. Auch das gilt auf jeder Plattform, aus
//! demselben Grund wie oben — der Preis ist ein `Besprechung 10:30.pdf` unter
//! Linux, das Takt nicht öffnet; unter Windows kostet die Regel nichts, weil
//! dort kein gültiger Dateiname einen Doppelpunkt trägt.

use std::path::{Component, Path, Prefix};

use tauri_plugin_shell::ShellExt;
use url::Url;

/// Obergrenze einer Adresse in Bytes (A-A-2).
///
/// Sie steht **vor** dem Zerlegen, damit eine Zeichenkette von 60 000 Zeichen
/// nicht erst durch den Zerleger geht. 2 048 ist die Länge, die jeder Browser
/// und jeder Server im Feld verkraftet; darüber hinaus ist eine Adresse kein
/// Verweis mehr, sondern eine Nutzlast.
const MAX_LINK_LEN: usize = 2_048;

/// Obergrenze eines Pfades in Bytes (A-A-4).
///
/// `PATH_MAX` ist unter Linux 4 096, unter Windows liegt die Grenze ohne
/// Verbatim-Präfix bei 260 und mit langen Pfaden bei rund 32 767. Der kleinere
/// der beiden großen Werte genügt: Ein Pfad, den kein Dateisystem dieser Länge
/// tragen kann, ist keiner.
const MAX_PATH_LEN: usize = 4_096;

/// Die fünf **Umleitungen**, über die die Rückfrage nicht die Wahrheit sagen
/// kann (A-A-5). Kleingeschrieben; verglichen wird ohne Rücksicht auf Groß-
/// und Kleinschreibung.
const INDIRECT_EXTENSIONS: [&str; 5] = ["lnk", "url", "pif", "scf", "desktop"];

/// Die technischen Schlüssel, mit denen ein abgewiesener Aufruf zurückkommt.
///
/// Eine geschlossene Aufzählung, englisch wie jeder Schlüssel dieses Bestands,
/// und **ohne den abgewiesenen Wert** (A-A-8): Ein abgewiesener Wert in einer
/// Meldung wäre derselbe fremde Text an einer neuen Stelle. Den deutschen Satz
/// dazu schreibt die Oberfläche.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Rejection {
    LinkEmpty,
    LinkTooLong,
    LinkControlCharacter,
    LinkUnparsable,
    LinkSchemeRejected,
    LinkNotNormalized,
    LinkNoHost,
    LinkUserinfo,
    PathEmpty,
    PathTooLong,
    PathControlCharacter,
    PathUnc,
    PathNotAbsolute,
    PathStreamSeparator,
    PathIndirectExtension,
    PathMissing,
}

impl Rejection {
    /// Der Schlüssel, den die Oberfläche liest. Genau ein Wort je Fall.
    pub fn key(self) -> &'static str {
        match self {
            Rejection::LinkEmpty => "link_empty",
            Rejection::LinkTooLong => "link_too_long",
            Rejection::LinkControlCharacter => "link_control_character",
            Rejection::LinkUnparsable => "link_unparsable",
            Rejection::LinkSchemeRejected => "link_scheme_rejected",
            Rejection::LinkNotNormalized => "link_not_normalized",
            Rejection::LinkNoHost => "link_no_host",
            Rejection::LinkUserinfo => "link_userinfo",
            Rejection::PathEmpty => "path_empty",
            Rejection::PathTooLong => "path_too_long",
            Rejection::PathControlCharacter => "path_control_character",
            Rejection::PathUnc => "path_unc",
            Rejection::PathNotAbsolute => "path_not_absolute",
            Rejection::PathStreamSeparator => "path_stream_separator",
            Rejection::PathIndirectExtension => "path_indirect_extension",
            Rejection::PathMissing => "path_missing",
        }
    }
}

/// Ist der Wert eine Adresse, die Takt öffnen darf? (A-A-2, A-A-3, R-22.)
///
/// Die Reihenfolge der Prüfungen ist Inhalt und keine Geschmacksfrage:
///
///  1. **Leer und Länge** stehen vorn, damit nichts Langes erst zerlegt wird.
///  2. **Steuerzeichen vor dem Zerlegen** (A-A-2, wörtlich). Der Zerleger
///     entfernt Tabulator und Zeilenumbruch stillschweigend an jeder Stelle;
///     danach zu prüfen hieße, eine Zeichenkette zu prüfen, die es nie gab.
///     `ht<TAB>tps://example.org` fällt hier und nicht erst am Festpunkt.
///  3. **Zerlegen** und Positivliste auf dem **geparsten** Schema, nicht auf
///     einem Präfix der Rohfassung. `http:/\example.org/` ist für einen
///     Präfixvergleich kein `http`, für den Zerleger schon.
///  4. **Wirt vorhanden und nicht leer.** `https:///pfad` befördert sonst das
///     erste Pfadstück zum Wirt (gemessen, 20.2).
///  5. **Keine Zugangsdaten.** `https://evil.example@gutartig.example/` ist ein
///     Festpunkt — die Normalform behält die Zugangsdaten —, und die Anzeige
///     liest sich danach wie ein anderer Wirt, als sie ansteuert. Eine Zeile.
///  6. **Der Festpunkt** (A-A-3): der geprüfte Wert **ist** der geöffnete.
///
/// Zurück kommt die zerlegte Adresse und nicht die Rohfassung — sie sind an
/// dieser Stelle zeichengleich, und wer sie weiterreicht, soll das an der
/// Signatur sehen.
pub fn check_link(value: &str) -> Result<Url, Rejection> {
    if value.is_empty() {
        return Err(Rejection::LinkEmpty);
    }
    if value.len() > MAX_LINK_LEN {
        return Err(Rejection::LinkTooLong);
    }
    if value.chars().any(char::is_control) {
        return Err(Rejection::LinkControlCharacter);
    }

    let parsed = Url::parse(value).map_err(|_| Rejection::LinkUnparsable)?;

    if !matches!(parsed.scheme(), "http" | "https") {
        return Err(Rejection::LinkSchemeRejected);
    }
    match parsed.host_str() {
        None => return Err(Rejection::LinkNoHost),
        Some(host) if host.is_empty() => return Err(Rejection::LinkNoHost),
        Some(_) => {}
    }
    if !parsed.username().is_empty() || parsed.password().is_some() {
        return Err(Rejection::LinkUserinfo);
    }
    if parsed.as_str() != value {
        return Err(Rejection::LinkNotNormalized);
    }

    Ok(parsed)
}

/// Der Dateiname, **wie das Betriebssystem ihn auflöst** (A-A-5′).
///
/// Windows wirft nachgestellte Punkte und Leerzeichen vom letzten
/// Namensbestandteil weg, bevor es die Datei sucht: `rechnung.lnk.` und
/// `rechnung.lnk ` öffnen beide `rechnung.lnk`. Wer den gespeicherten Namen
/// prüft, prüft eine Zeichenkette, die nie eine Datei war.
///
/// Abgeschnitten wird nur am **Ende** und nur diese beiden Zeichen. Ein Punkt
/// mitten im Namen gehört dazu, ein führender ebenfalls — `.lnk` ist unter
/// Windows eine Verknüpfung und keine versteckte Datei.
fn effective_file_name(path: &Path) -> Option<&str> {
    let name = path.file_name()?.to_str()?;
    Some(name.trim_end_matches(|character| character == '.' || character == ' '))
}

/// Trägt der letzte Namensbestandteil einen Doppelpunkt? (A-A-28.)
///
/// Unter Windows ist der Doppelpunkt der Trenner eines alternativen
/// Datenstroms: `datei::$DATA` löst NTFS auf den unbenannten Datenstrom von
/// `datei` auf, `datei:strom` auf einen benannten. `Path` weiß davon nichts und
/// behandelt ihn als gewöhnliches Zeichen — womit die Endungsprüfung über einen
/// anderen Namen urteilt als den, den das Betriebssystem öffnet.
///
/// Gefragt wird nur der **letzte** Bestandteil, damit der Laufwerksbuchstabe
/// (`C:`) nicht mitfällt; er ist ein Präfix und kein Namensbestandteil.
///
/// **Der rohe Name, nicht der aus [`effective_file_name`].** Die Beschneidung
/// dort nimmt nachgestellte Punkte und Leerzeichen weg und keinen Doppelpunkt;
/// beide Wege lieferten hier dieselbe Antwort. Der rohe steht trotzdem da, weil
/// diese Frage nichts über eine Endung wissen muß — sie stellt fest, daß der
/// Name eine ist, über die sich keine Endungsfrage mehr stellen läßt.
fn has_stream_separator(path: &Path) -> bool {
    match path.file_name().and_then(|name| name.to_str()) {
        Some(name) => name.contains(':'),
        None => false,
    }
}

/// Trägt der Pfad eine der fünf Umleitungsendungen? (A-A-5, A-A-5′.)
///
/// Verglichen wird das **letzte Punktsegment des aufgelösten Dateinamens**,
/// ohne Rücksicht auf Groß- und Kleinschreibung. `X.LNK` ist dasselbe wie
/// `x.lnk`; unter Windows entscheidet die Schreibweise über gar nichts.
///
/// **Nicht `Path::extension()`.** Der Grund steht im Kopf dieser Datei unter
/// „A-A-5′"; kurz: Er sieht `rechnung.lnk.` als endungslos an und `.lnk` als
/// versteckte Datei, und Windows tut in beiden Fällen etwas anderes. Diese
/// Zeilen sind die Behebung eines gemessenen Fundes (T-156-1) und keine
/// Umständlichkeit.
fn has_indirect_extension(path: &Path) -> bool {
    let Some(name) = effective_file_name(path) else {
        return false;
    };
    // `rsplit_once` statt `Path::extension()`: Es nimmt auch den führenden
    // Punkt als Trenner, und genau darum geht es.
    let Some((_, extension)) = name.rsplit_once('.') else {
        return false;
    };
    let lowered = extension.to_ascii_lowercase();
    INDIRECT_EXTENSIONS.contains(&lowered.as_str())
}

/// Ist der Wert ein UNC-Pfad? (A-A-4, R-21, R-22.)
///
/// **`Path::is_absolute()` genügt hier nicht, und das ist der ganze Punkt:**
/// Unter Windows ist `\\server\freigabe\datei.exe` absolut. Ohne diese Prüfung
/// wäre jedes Öffnen einer Datei zugleich ein Anmeldeversuch gegen einen
/// fremden Rechner, und was dabei über die Leitung geht, ist der
/// NTLM-Handshake des angemeldeten Benutzers.
///
/// Zwei Wege, und beide werden gebraucht:
///
///  - **Über die Schreibweise**, auf jeder Plattform: `\\server\…` und
///    `//server/…` lösen unter Windows beide auf. Diese Hälfte greift auch auf
///    einem Linux-Läufer, auf dem `Component::Prefix` nie entsteht — sonst
///    wäre die Regel dort unmeßbar.
///  - **Über das Präfix**, wo das Betriebssystem es liefert: `UNC`,
///    `VerbatimUNC`, `Verbatim` und `DeviceNS`. `\\?\C:\…` und `\\.\…` fangen
///    zwar ebenfalls mit zwei Zeichen an, die oben schon greifen; die
///    ausdrückliche Prüfung steht trotzdem hier, weil sie die Aussage trifft
///    und nicht ihre Nebenwirkung.
fn is_unc(value: &str, path: &Path) -> bool {
    if value.starts_with("\\\\") || value.starts_with("//") {
        return true;
    }
    match path.components().next() {
        Some(Component::Prefix(prefix)) => matches!(
            prefix.kind(),
            Prefix::UNC(..) | Prefix::VerbatimUNC(..) | Prefix::Verbatim(..) | Prefix::DeviceNS(..)
        ),
        _ => false,
    }
}

/// Ist der Wert ein Pfad, den Takt mit der Standardanwendung öffnen darf?
/// (A-A-4, A-A-5, R-21.)
///
/// Die Reihenfolge:
///
///  1. **Leer, Länge, Steuerzeichen** — dieselbe Hygiene wie bei der Adresse.
///     Ein `\n` im Pfad ist auf keinem Dateisystem ein gewollter Name.
///  2. **Kein UNC**, siehe [`is_unc`]. Vor `is_absolute`, weil ein UNC-Pfad
///     die Absolutheitsprüfung besteht.
///  3. **Absolut.** Ein relativer Pfad würde gegen das Arbeitsverzeichnis der
///     Hülle aufgelöst, und das ist ein Ort, den niemand bewußt gewählt hat.
///  4. **Kein Doppelpunkt im Namen** (A-A-28), siehe [`has_stream_separator`].
///     **Nach** `is_absolute`, weil ein Windows-Laufwerkspfad unter Linux sonst
///     mit dem neuen statt mit dem richtigen Grund abgewiesen würde und die
///     Meldung in die Irre führte. **Vor** der Endungsprüfung, weil ein Name
///     mit Doppelpunkt keine beurteilbare Endung mehr hat.
///  5. **Keine Umleitungsendung** (A-A-5, A-A-5′) — gemessen am Namen, den
///     Windows auflöst, und nicht am gespeicherten. Siehe
///     [`effective_file_name`].
///  6. **Vorhanden.** Ausdrücklich **keine** Sicherheitsprüfung — zwischen
///     `exists()` und `open()` liegt ein Wettlauf, den niemand gewinnt. Sie
///     steht hier für A-19.15: Der Anhang soll sagen können, daß die Datei
///     nicht mehr da ist, statt eine Standardanwendung mit nichts zu starten.
pub fn check_file(value: &str) -> Result<&Path, Rejection> {
    if value.is_empty() {
        return Err(Rejection::PathEmpty);
    }
    if value.len() > MAX_PATH_LEN {
        return Err(Rejection::PathTooLong);
    }
    if value.chars().any(char::is_control) {
        return Err(Rejection::PathControlCharacter);
    }

    let path = Path::new(value);

    if is_unc(value, path) {
        return Err(Rejection::PathUnc);
    }
    if !path.is_absolute() {
        return Err(Rejection::PathNotAbsolute);
    }
    if has_stream_separator(path) {
        return Err(Rejection::PathStreamSeparator);
    }
    if has_indirect_extension(path) {
        return Err(Rejection::PathIndirectExtension);
    }
    if !path.is_file() {
        return Err(Rejection::PathMissing);
    }

    Ok(path)
}

/// Öffnet einen Verweis im Browser des Benutzers (A-19.9).
///
/// **Ein Parameter, und er ist eine Adresse** — anders als bei
/// `takt_open_release`, wo der Parameter bewußt keine ist. Der Unterschied ist
/// die Quelle: Dort kommt der Wert aus einer bekannten Antwort und die Adresse
/// entsteht in der Hülle; hier hat der Benutzer eine Adresse angehängt, und
/// eine feste Adresse mit einem eingesetzten Stück gäbe es dafür nicht. Deshalb
/// steht in [`check_link`] mehr Prüfung als in `is_release_version`.
///
/// **Keine Rückfrage** (A-A-7). Ein Browser ist der erwartete Ausgang, und eine
/// Rückfrage, die vor jedem Verweis erscheint, ist die Rückfrage, die
/// weggeklickt wird — und danach auch bei der Datei weggeklickt wird.
#[tauri::command]
pub fn takt_open_attachment_link(app: tauri::AppHandle, url: String) -> Result<(), String> {
    let checked = check_link(&url).map_err(|rejection| rejection.key().to_string())?;

    // Geöffnet wird `checked.as_str()` und nicht `url`. Beide sind an dieser
    // Stelle zeichengleich — der Festpunkt aus A-A-3 sagt genau das —, und der
    // Weg über den geprüften Wert hält fest, daß hier nichts anderes hinausgeht
    // als das, was durch die Prüfung ging.
    #[allow(deprecated)]
    app.shell()
        .open(checked.as_str(), None)
        .map_err(|_| "open_failed".to_string())
}

/// Öffnet eine Datei mit der Standardanwendung des Systems (A-19.9).
///
/// **Das ist ein Doppelklick im Dateimanager**, ausgelöst von einem Wert, den
/// Takt gespeichert hat: bei einer `.txt` ein Editor, bei einer `.bat`, `.exe`
/// oder `.ps1` eine Ausführung — mit den Rechten des Benutzers, ohne Rückfrage
/// des Betriebssystems und ohne Mark-of-the-Web-Warnung, denn Takt lädt nichts
/// herunter und setzt deshalb auch keine Zone (B-19.1).
///
/// Deshalb steht **vor** diesem Befehl die Rückfrage der Oberfläche
/// (`AttachmentOpenDialog`, A-A-6): voller Pfad, ungekürzt, durch die
/// Behandlung für fremden Text, mit der Wirkung im Satz, ohne Vorauswahl, ohne
/// „nicht mehr fragen" und ohne `window.confirm`. Sie ist die letzte
/// Verteidigung und keine Kontrolle — die Kontrolle ist [`check_file`], und
/// sie läuft bei **jedem** Aufruf neu.
#[tauri::command]
pub fn takt_open_attachment_file(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let checked = check_file(&path).map_err(|rejection| rejection.key().to_string())?;

    #[allow(deprecated)]
    app.shell()
        .open(checked.to_string_lossy(), None)
        .map_err(|_| "open_failed".to_string())
}

// =============================================================================
// T-160 (unit-tester) — die einzige Kontrolle vor `open` bekommt Prüffälle
// (A-A-2, A-A-3, A-A-4, A-A-5, A-A-5′, A-A-25; V-01 aus T-154; T-156-1/-2).
// =============================================================================
//
// Diese Datei hatte vor T-160 **keinen einzigen** `#[cfg(test)]`-Block — bei
// vier anderen Dateien dieses Verzeichnisses gab es welche (`release.rs`,
// `identity.rs`, `sidecar.rs`, `appdata.rs`). `cargo test --lib` zählte 31
// Fälle, alle vier fremd. Genau das war der Befund: Die einzige Kontrolle
// zwischen einer Zeichenkette aus dem Bestand und `ShellExecuteW` lief
// ungeprüft, während der Ablauf, der sie prüfen soll (`test:rust` in
// `pnpm check`, `cargo test --lib` auf allen drei Läufern), grün war.
//
// Die Fallliste folgt `T-157-frontend-dev.md`, ist aber nicht auf sie
// beschränkt: die 22 Zeichenketten aus `docs/bedrohungsmodell.md` 20.2 (dort
// gemessen, nicht neu erfunden — Abschnitt 21.3 Punkt 1 nennt für jede den
// Ablehnungsgrund), die zehn Zeilen der Festpunkttabelle (A-A-3), die
// UNC-Fälle (A-A-4) und die Umleitungsfälle samt der beiden
// Reihenfolge-Fälle und der drei `#[cfg(windows)]`-Fälle (A-A-5′, A-A-10).
//
// **Die Gegenprobe (Auftrag Punkt 2):** `gegenprobe_die_alte_fassung_...`
// baut absichtlich eine zweite, VOR T-157 gültige Fassung von
// `has_indirect_extension` nach (`Path::extension()` ohne Beschneidung) und
// prüft, dass sie bei genau den neun Fällen versagt, die T-157 gemessen hat
// — nicht mehr und nicht weniger. Jeder andere Testfall in dieser Datei, der
// eine Umleitungsendung mit nachgestelltem Zeichen prüft, hätte also VOR der
// Behebung aus T-157 fehlgeschlagen; die reinen Positivfälle (`bericht.txt`
// & Co.) wären dagegen auch vorher schon grün gewesen — das ist beabsichtigt
// und in `keine_umleitungsendung_geht_ungehindert_durch_has_indirect_extension`
// mit ausgeschrieben, nicht in der Gegenprobe, weil sie nichts über die
// Behebung aussagen.
//
// **Ohne fremde Kiste.** `tempfile` liegt nur transitiv in `Cargo.lock`
// (nicht in `Cargo.toml`, siehe Bemerkung im Bericht) — die Hilfsfunktionen
// unten legen eigene, über Prozess-ID und Zähler eindeutige Verzeichnisse
// unter dem System-Temp an und räumen bewusst **nicht** auf: Es sind
// Wegwerfdateien von wenigen Bytes, das Betriebssystem holt sie beim
// Neustart, und ein `Drop`-Aufräumer wäre hier mehr Fläche als Nutzen.

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicU64, Ordering};

    static COUNTER: AtomicU64 = AtomicU64::new(0);

    fn eigenes_verzeichnis(marke: &str) -> PathBuf {
        let einmalig = COUNTER.fetch_add(1, Ordering::SeqCst);
        let ordner = std::env::temp_dir().join(format!(
            "takt-attachment-test-{}-{}-{marke}",
            std::process::id(),
            einmalig
        ));
        fs::create_dir_all(&ordner).expect("Temp-Verzeichnis muss anlegbar sein");
        ordner
    }

    fn echte_datei(marke: &str, name: &str) -> String {
        let ordner = eigenes_verzeichnis(marke);
        let pfad = ordner.join(name);
        fs::write(&pfad, b"").expect("Datei muss anlegbar sein");
        pfad.to_string_lossy().into_owned()
    }

    #[test]
    fn schema_und_normalform_gegen_die_22_zeilen_aus_20_2() {
        let faelle: [(&str, Option<Rejection>); 22] = [
            ("https://example.org/seite", None),
            ("HTTP://example.org/", Some(Rejection::LinkNotNormalized)),
            ("javascript:alert(1)", Some(Rejection::LinkSchemeRejected)),
            ("file:///etc/passwd", Some(Rejection::LinkSchemeRejected)),
            ("file:///C:/Windows/System32/calc.exe", Some(Rejection::LinkSchemeRejected)),
            ("data:text/html,<script>", Some(Rejection::LinkSchemeRejected)),
            ("vbscript:msgbox(1)", Some(Rejection::LinkSchemeRejected)),
            ("ms-msdt:/id PCWDiagnostic", Some(Rejection::LinkSchemeRejected)),
            (
                "search-ms:query=x&crumb=location:\\\\server\\f",
                Some(Rejection::LinkSchemeRejected),
            ),
            ("\\\\server\\freigabe\\datei.txt", Some(Rejection::LinkUnparsable)),
            ("file://server/freigabe/datei.txt", Some(Rejection::LinkSchemeRejected)),
            ("//server/freigabe", Some(Rejection::LinkUnparsable)),
            ("http:/\\example.org/", Some(Rejection::LinkNotNormalized)),
            (" https://example.org", Some(Rejection::LinkNotNormalized)),
            ("ht\tps://example.org", Some(Rejection::LinkControlCharacter)),
            ("java\nscript:alert(1)", Some(Rejection::LinkControlCharacter)),
            ("http\0s://example.org", Some(Rejection::LinkControlCharacter)),
            ("https://ex\u{0430}mple.org/", Some(Rejection::LinkNotNormalized)),
            (
                "https://evil.example@gutartig.example/",
                Some(Rejection::LinkUserinfo),
            ),
            ("https:///pfad", Some(Rejection::LinkNotNormalized)),
            (
                "https://example.org/\u{202e}gpj.exe",
                Some(Rejection::LinkNotNormalized),
            ),
            ("https://exam\u{200b}ple.org/", Some(Rejection::LinkNotNormalized)),
        ];

        for (eingabe, erwartet) in faelle {
            let ergebnis = check_link(eingabe);
            match erwartet {
                None => assert!(ergebnis.is_ok(), "sollte angenommen werden: {eingabe:?}"),
                Some(grund) => assert_eq!(
                    ergebnis.err(),
                    Some(grund),
                    "falscher Ablehnungsgrund fuer {eingabe:?}"
                ),
            }
        }
    }

    #[test]
    fn festpunkttabelle_rohfassung_abgewiesen_normalform_angenommen_und_idempotent() {
        let zeilen: [(&str, &str); 10] = [
            ("https://example.org/seite", "https://example.org/seite"),
            ("http://example.org", "http://example.org/"),
            ("HTTP://Example.ORG/Pfad", "http://example.org/Pfad"),
            ("http:/\\example.org/", "http://example.org/"),
            (" https://example.org", "https://example.org/"),
            ("ht\tps://example.org", "https://example.org/"),
            ("https://exam\u{200b}ple.org/", "https://example.org/"),
            ("https://example.org/a b", "https://example.org/a%20b"),
            (
                "https://example.org/\u{202e}gpj.exe",
                "https://example.org/%E2%80%AEgpj.exe",
            ),
            ("https://ex\u{0430}mple.org/", "https://xn--exmple-4nf.org/"),
        ];

        for (roh, norm) in zeilen {
            let normalform = check_link(norm).unwrap_or_else(|f| {
                panic!("Normalform muss angenommen werden: {norm:?}, Grund {f:?}")
            });
            assert_eq!(normalform.as_str(), norm, "Festpunkt fuer {norm:?}");

            if roh == norm {
                assert!(check_link(roh).is_ok(), "unveraendert bleibt angenommen: {roh:?}");
            } else {
                assert!(
                    check_link(roh).is_err(),
                    "Rohfassung darf NICHT angenommen werden: {roh:?}"
                );
            }
        }
    }

    #[test]
    fn zugangsdaten_im_wirt_werden_auch_dann_abgewiesen_wenn_sie_kein_festpunktfehler_waeren() {
        assert_eq!(
            check_link("https://evil.example@gutartig.example/"),
            Err(Rejection::LinkUserinfo)
        );
    }

    #[test]
    fn leerer_und_zu_langer_verweis() {
        assert_eq!(check_link(""), Err(Rejection::LinkEmpty));
        let praefix = "https://example.org/";
        let genau_2048 = format!("{praefix}{}", "a".repeat(2048 - praefix.len()));
        assert_eq!(genau_2048.len(), 2048);
        assert!(check_link(&genau_2048).is_ok(), "2048 Byte muss noch angenommen werden");
        let einer_zu_viel = format!("{genau_2048}a");
        assert_eq!(einer_zu_viel.len(), 2049);
        assert_eq!(check_link(&einer_zu_viel), Err(Rejection::LinkTooLong));
    }

    #[test]
    fn leerer_wirt_wird_nicht_zum_ersten_pfadstueck() {
        // https:///pfad faellt schon am Festpunkt (der Wirtsname "pfad" ist
        // nicht die Rohfassung) -- die Wirtspruefung selbst zeigt sich erst,
        // wenn Rohfassung und Normalform zusammenfallen wuerden. Ein Schema
        // ohne Autoritaet ("mailto:" o.ae.) parst der Zerleger anders; hier
        // wird direkt gegen die Normalform gemessen.
        assert_eq!(check_link("https:///pfad").unwrap_err(), Rejection::LinkNotNormalized);
        assert!(check_link("https://pfad/").is_ok());
    }

    #[test]
    fn steuerzeichen_werden_vor_dem_zerlegen_erkannt_nicht_erst_danach() {
        // Reihenfolge: Ein Wert, der SOWOHL ein verbotenes Schema als auch ein
        // Steuerzeichen traegt, muss am Steuerzeichen scheitern (Punkt 2 vor
        // Punkt 3 im Kopfkommentar von check_link).
        assert_eq!(
            check_link("java\nscript:alert(1)"),
            Err(Rejection::LinkControlCharacter)
        );
    }

    // ===========================================================================
    // is_unc / check_file — A-A-4, A-A-25
    // ===========================================================================

    #[test]
    fn unc_ueber_die_schreibweise_auf_jeder_plattform() {
        for wert in [
            "\\\\server\\freigabe\\datei.exe",
            "//server/freigabe/datei.exe",
            "\\\\?\\C:\\x.txt",
            "\\\\.\\pipe\\x",
        ] {
            assert_eq!(check_file(wert), Err(Rejection::PathUnc), "sollte UNC sein: {wert:?}");
        }
    }

    #[test]
    fn ein_windows_laufwerkspfad_ist_unter_linux_nicht_absolut_und_damit_nicht_messbar_als_unc() {
        // Dokumentiert die Grenze aus A-A-4/Bedrohungsmodell 21.3, Punkt 3:
        // Unter Windows waere dieser Pfad absolut; auf diesem Laeufer ist er
        // es nicht, und die Kette endet folgerichtig bei PathNotAbsolute.
        assert_eq!(
            check_file("C:\\Windows\\System32\\calc.exe"),
            Err(Rejection::PathNotAbsolute)
        );
    }

    #[test]
    fn leerer_zu_langer_und_steuerzeichenbehafteter_pfad() {
        assert_eq!(check_file(""), Err(Rejection::PathEmpty));
        assert_eq!(
            check_file("/tmp/datei\nmit\numbruch.pdf"),
            Err(Rejection::PathControlCharacter)
        );

        let praefix = "/";
        let genau_4096 = format!("{praefix}{}", "a".repeat(4096 - praefix.len()));
        assert_eq!(genau_4096.len(), 4096);
        // Laenge allein reicht bis zur Existenzpruefung durch -- eine
        // erfundene Datei dieser Laenge gibt es nicht, also PathMissing und
        // NICHT PathTooLong.
        assert_eq!(check_file(&genau_4096), Err(Rejection::PathMissing));
        let einer_zu_viel = format!("{genau_4096}a");
        assert_eq!(einer_zu_viel.len(), 4097);
        assert_eq!(check_file(&einer_zu_viel), Err(Rejection::PathTooLong));
    }

    #[test]
    fn relativer_pfad_ist_path_not_absolute() {
        assert_eq!(check_file("relativ/datei.pdf"), Err(Rejection::PathNotAbsolute));
    }

    #[test]
    fn fehlende_datei_ergibt_path_missing_wenn_alles_andere_stimmt() {
        assert_eq!(
            check_file("/pfad/der/hoffentlich/nicht/existiert/takt-test-attachment"),
            Err(Rejection::PathMissing)
        );
    }

    #[test]
    fn eine_wirklich_angelegte_datei_mit_harmloser_endung_wird_angenommen() {
        let pfad = echte_datei("ok", "bericht.txt");
        assert!(check_file(&pfad).is_ok());
    }

    // ---------------------------------------------------------------------
    // has_indirect_extension -- direkt, ohne Dateisystem (A-A-5, A-A-5', T-157)
    //
    // Diese Faelle brauchen keine echte Datei: has_indirect_extension laeuft
    // in check_file VOR path.is_file() (siehe Reihenfolge-Faelle weiter
    // unten), daher entscheidet die Existenz nicht mit.
    // ---------------------------------------------------------------------

    #[test]
    fn umleitungsendungen_werden_erkannt_auch_mit_nachgestelltem_punkt_oder_leerzeichen() {
        // Genau die Fallliste aus T-157-frontend-dev.md Abschnitt "Uebergabe
        // an unit-tester", Tabelle 1. Jeder Fall ist einzeln benannt statt in
        // einer Schleife versteckt, damit ein fehlschlagender Fall sofort
        // seinen Namen zeigt.
        assert!(has_indirect_extension(Path::new("/x/rechnung.lnk")), "Grundfall");
        assert!(
            has_indirect_extension(Path::new("/x/rechnung.lnk.")),
            "T-156-1: nachgestellter Punkt"
        );
        assert!(
            has_indirect_extension(Path::new("/x/rechnung.lnk ")),
            "T-156-1: nachgestelltes Leerzeichen"
        );
        assert!(
            has_indirect_extension(Path::new("/x/rechnung.lnk. . ")),
            "gemischt, mehrfach"
        );
        assert!(
            has_indirect_extension(Path::new("/x/rechnung.LNK.")),
            "Gross-/Kleinschreibung UND nachgestellter Punkt zugleich"
        );
        assert!(has_indirect_extension(Path::new("/x/verweis.url ")));
        assert!(has_indirect_extension(Path::new("/x/start.pif.")));
        assert!(has_indirect_extension(Path::new("/x/ordner.scf.")));
        assert!(has_indirect_extension(Path::new("/x/app.desktop.")));
        assert!(
            has_indirect_extension(Path::new("/x/.lnk")),
            "Name ist nur die Endung -- Path::extension() saehe hier None"
        );
    }

    #[test]
    fn keine_umleitungsendung_geht_ungehindert_durch_has_indirect_extension() {
        assert!(!has_indirect_extension(Path::new("/x/bericht.txt")));
        assert!(!has_indirect_extension(Path::new("/x/bericht.txt.")));
        assert!(
            !has_indirect_extension(Path::new("/x/rechnung.lnk.txt")),
            "die LETZTE Endung zaehlt, und die ist txt"
        );
        assert!(
            !has_indirect_extension(Path::new("/x/rechnung.")),
            "nach dem Abschneiden bleibt keine Endung"
        );
        assert!(!has_indirect_extension(Path::new("/x/.gitignore")));
        assert!(
            !has_indirect_extension(Path::new("/x/programm.exe.")),
            ".exe ist kein Umleiter, auch nicht mit nachgestelltem Punkt (A-A-5)"
        );
    }

    #[test]
    fn unc_steht_vor_der_endungspruefung_in_der_reihenfolge() {
        // Reihenfolge-Fall 1 aus T-157: PathUnc, NICHT PathIndirectExtension.
        assert_eq!(
            check_file("\\\\server\\freigabe\\rechnung.lnk."),
            Err(Rejection::PathUnc)
        );
    }

    #[test]
    fn absolutheit_steht_vor_der_endungspruefung_in_der_reihenfolge() {
        // Reihenfolge-Fall 2 aus T-157: PathNotAbsolute, NICHT PathIndirectExtension.
        assert_eq!(check_file("rechnung.lnk."), Err(Rejection::PathNotAbsolute));
    }

    #[test]
    fn indirekte_endung_wird_vor_der_existenzpruefung_abgewiesen() {
        // Ohne dass die Datei je existiert hat -- has_indirect_extension muss
        // vor is_file() laufen, sonst waere das Ergebnis PathMissing.
        assert_eq!(
            check_file("/pfad/der/nicht/existiert/rechnung.lnk"),
            Err(Rejection::PathIndirectExtension)
        );
    }

    #[test]
    fn eine_wirklich_angelegte_umleitung_wird_trotzdem_abgewiesen() {
        let pfad = echte_datei("lnk-echt", "rechnung.lnk");
        assert_eq!(check_file(&pfad), Err(Rejection::PathIndirectExtension));
    }

    // ===========================================================================
    // T-174 (unit-tester), O-DQ Punkt 1 -- A-A-28: der Doppelpunkt im
    // Dateinamen, gemessen auf Linux gegen wirklich angelegte Dateien
    // (Bedrohungsmodell 22.1.1, Tafel). has_stream_separator() selbst hat
    // schon eine Doku-Zeile im Kopf der Datei; hier steht die Messung.
    // ===========================================================================

    #[test]
    fn a_a_28_unbenannter_alternativer_datenstrom_wird_abgewiesen() {
        // Unter NTFS loest "datei::$DATA" auf den unbenannten Datenstrom von
        // "datei" auf. Vor A-A-28 (T-164) ging das mit Ok() durch.
        let pfad = echte_datei("a-a-28-1", "rechnung.lnk::$DATA");
        assert_eq!(check_file(&pfad), Err(Rejection::PathStreamSeparator));
    }

    #[test]
    fn a_a_28_benannter_alternativer_datenstrom_wird_abgewiesen() {
        let pfad = echte_datei("a-a-28-2", "rechnung.lnk:harmlos.txt");
        assert_eq!(check_file(&pfad), Err(Rejection::PathStreamSeparator));
    }

    #[test]
    fn a_a_28_doppelpunkt_geht_der_endungspruefung_vor_bericht_txt_doppelpunkt_evil_lnk() {
        // Vor T-167 war das PathIndirectExtension (letztes Punktsegment
        // "lnk"). Mit A-A-28 ist der Doppelpunkt selbst schon der Grund, VOR
        // der Endungspruefung -- die Endung "lnk" wird gar nicht mehr
        // angeschaut. Das ist der Reihenfolge-Beleg aus der Tafel 22.1.1.
        let pfad = echte_datei("a-a-28-3", "bericht.txt:evil.lnk");
        assert_eq!(check_file(&pfad), Err(Rejection::PathStreamSeparator));
    }

    #[test]
    fn a_a_28_gegenfaelle_bericht_txt_und_programm_exe_bleiben_angenommen() {
        let bericht = echte_datei("a-a-28-4", "bericht.txt");
        assert!(check_file(&bericht).is_ok(), "bericht.txt muss weiterhin angenommen werden");

        let programm = echte_datei("a-a-28-5", "programm.exe");
        assert!(check_file(&programm).is_ok(), "programm.exe muss weiterhin angenommen werden");
    }

    #[test]
    fn a_a_28_doppelpunkt_faellt_vor_der_existenzpruefung_nicht_path_missing() {
        // Ein nicht vorhandener Pfad mit Doppelpunkt bekommt
        // PathStreamSeparator und NICHT PathMissing -- has_stream_separator
        // laeuft in check_file VOR path.is_file().
        assert_eq!(
            check_file("/pfad/der/hoffentlich/nicht/existiert/rechnung.lnk::$DATA"),
            Err(Rejection::PathStreamSeparator)
        );
    }

    #[test]
    fn a_a_28_windows_laufwerksbuchstabe_ist_kein_doppelpunkt_im_dateinamen() {
        // Unveraendert durch A-A-28: has_stream_separator fragt nur den
        // LETZTEN Namensbestandteil, der Laufwerksbuchstabe "C:" faellt also
        // nicht darunter. Die Kette endet unter Linux ohnehin vorher bei
        // PathNotAbsolute (siehe auch
        // ein_windows_laufwerkspfad_ist_unter_linux_nicht_absolut_und_damit_nicht_messbar_als_unc,
        // hier als eigener Beleg fuer die Tafel 22.1.1 wiederholt).
        assert_eq!(
            check_file("C:\\Temp\\bericht.txt"),
            Err(Rejection::PathNotAbsolute)
        );
    }

    /// Nachbau von `check_file`, wie es VOR T-167 aussah: identisch, aber
    /// OHNE den Aufruf von `has_stream_separator` (A-A-28). Lebt
    /// ausschliesslich in `#[cfg(test)]` und dient der Gegenprobe unten --
    /// kein Produktivcode wird dafuer angefasst oder ausgecheckt.
    fn check_file_ergebnis_vor_t_167(value: &str) -> Result<(), Rejection> {
        if value.is_empty() {
            return Err(Rejection::PathEmpty);
        }
        if value.len() > MAX_PATH_LEN {
            return Err(Rejection::PathTooLong);
        }
        if value.chars().any(char::is_control) {
            return Err(Rejection::PathControlCharacter);
        }
        let path = Path::new(value);
        if is_unc(value, path) {
            return Err(Rejection::PathUnc);
        }
        if !path.is_absolute() {
            return Err(Rejection::PathNotAbsolute);
        }
        // has_stream_separator fehlt hier bewusst -- exakt der Stand vor T-167.
        if has_indirect_extension(path) {
            return Err(Rejection::PathIndirectExtension);
        }
        if !path.is_file() {
            return Err(Rejection::PathMissing);
        }
        Ok(())
    }

    #[test]
    fn gegenprobe_a_a_28_die_fassung_vor_t_167_war_bei_drei_faellen_anders() {
        // Rot-vor-gruen ohne Produktivcode anzufassen: Diese Gegenprobe baut
        // den Stand VOR T-167 nach (siehe Funktion oben) und zeigt, dass genau
        // die drei "Stream-Separator"-Faelle divergieren -- waeren alle Faelle
        // hier schon vorher gleich ausgegangen, wuerde keiner von ihnen etwas
        // ueber die Behebung aus T-167 messen (dieselbe Forderung wie bei
        // gegenprobe_die_alte_fassung_waere_bei_neun_der_folgenden_faelle_blind_gewesen
        // fuer T-157).
        let ads_unbenannt = echte_datei("a-a-28-gp-1", "rechnung.lnk::$DATA");
        assert_eq!(
            check_file_ergebnis_vor_t_167(&ads_unbenannt),
            Ok(()),
            "alte Fassung nahm das an -- gemessen von T-164"
        );
        assert_eq!(check_file(&ads_unbenannt).unwrap_err(), Rejection::PathStreamSeparator);

        let ads_benannt = echte_datei("a-a-28-gp-2", "rechnung.lnk:harmlos.txt");
        assert_eq!(
            check_file_ergebnis_vor_t_167(&ads_benannt),
            Ok(()),
            "alte Fassung nahm das an -- gemessen von T-164"
        );
        assert_eq!(check_file(&ads_benannt).unwrap_err(), Rejection::PathStreamSeparator);

        let doppelpunkt_und_lnk = echte_datei("a-a-28-gp-3", "bericht.txt:evil.lnk");
        assert_eq!(
            check_file_ergebnis_vor_t_167(&doppelpunkt_und_lnk),
            Err(Rejection::PathIndirectExtension),
            "alte Fassung wies das ueber den Endungsgrund ab, nicht ueber den Doppelpunkt"
        );
        assert_eq!(
            check_file(&doppelpunkt_und_lnk).unwrap_err(),
            Rejection::PathStreamSeparator
        );

        // Gegenfaelle: alte und neue Fassung MUESSEN uebereinstimmen -- sonst
        // haette A-A-28 etwas veraendert, das gar nicht sein Gegenstand ist.
        let harmlos = echte_datei("a-a-28-gp-4", "bericht.txt");
        assert_eq!(check_file_ergebnis_vor_t_167(&harmlos), Ok(()));
        assert!(check_file(&harmlos).is_ok());

        assert_eq!(
            check_file_ergebnis_vor_t_167("C:\\Temp\\bericht.txt"),
            Err(Rejection::PathNotAbsolute)
        );
        assert_eq!(
            check_file("C:\\Temp\\bericht.txt"),
            Err(Rejection::PathNotAbsolute)
        );
    }

    // ===========================================================================
    // T-174 (unit-tester), O-DQ Punkt 1 -- A-A-29: `Rejection::key()` bekommt
    // seinen Prüffall (Bedrohungsmodell 22.5, Befund T-164-2).
    //
    // Ein vertauschter Schluessel -- z.B. PathUnc => "path_not_absolute" --
    // blieb bislang gruen: Kein Praeffall beruehrte `key()`. Die Liste unten
    // ist bewusst ZWEIMAL unabhaengig ausgeschrieben (einmal in
    // `erwarteter_schluessel`, als eigener `match` ohne Sammelzweig, einmal
    // als Feldliste `alle`), damit ein vertauschtes Paar in der
    // Produktivfunktion nicht zufaellig von derselben Abschreibfehlerquelle
    // gedeckt wird.
    // ===========================================================================

    #[test]
    fn a_a_29_jeder_ablehnungsgrund_traegt_genau_seinen_eigenen_schluessel() {
        // KEIN `_ => ...`-Sammelzweig: Kommt ein siebzehnter Ablehnungsgrund
        // zur Aufzaehlung dazu, verweigert der Compiler die Uebersetzung
        // dieser Datei, statt den neuen Fall stillschweigend zu uebergehen.
        fn erwarteter_schluessel(grund: Rejection) -> &'static str {
            match grund {
                Rejection::LinkEmpty => "link_empty",
                Rejection::LinkTooLong => "link_too_long",
                Rejection::LinkControlCharacter => "link_control_character",
                Rejection::LinkUnparsable => "link_unparsable",
                Rejection::LinkSchemeRejected => "link_scheme_rejected",
                Rejection::LinkNotNormalized => "link_not_normalized",
                Rejection::LinkNoHost => "link_no_host",
                Rejection::LinkUserinfo => "link_userinfo",
                Rejection::PathEmpty => "path_empty",
                Rejection::PathTooLong => "path_too_long",
                Rejection::PathControlCharacter => "path_control_character",
                Rejection::PathUnc => "path_unc",
                Rejection::PathNotAbsolute => "path_not_absolute",
                Rejection::PathStreamSeparator => "path_stream_separator",
                Rejection::PathIndirectExtension => "path_indirect_extension",
                Rejection::PathMissing => "path_missing",
            }
        }

        // Ausgeschriebene Liste ALLER Auspraegungen (A-A-29 verlangt genau
        // das: "in einer im Pruefall ausgeschriebenen Liste"). Stand heute 16
        // Faelle -- die Zahl steht im Array-Typ und wird rot, sobald jemand
        // eine Auspraegung vergisst einzutragen.
        let alle: [Rejection; 16] = [
            Rejection::LinkEmpty,
            Rejection::LinkTooLong,
            Rejection::LinkControlCharacter,
            Rejection::LinkUnparsable,
            Rejection::LinkSchemeRejected,
            Rejection::LinkNotNormalized,
            Rejection::LinkNoHost,
            Rejection::LinkUserinfo,
            Rejection::PathEmpty,
            Rejection::PathTooLong,
            Rejection::PathControlCharacter,
            Rejection::PathUnc,
            Rejection::PathNotAbsolute,
            Rejection::PathStreamSeparator,
            Rejection::PathIndirectExtension,
            Rejection::PathMissing,
        ];

        for grund in alle {
            assert_eq!(
                grund.key(),
                erwarteter_schluessel(grund),
                "vertauschter oder falscher Schluessel fuer {grund:?}"
            );
        }

        // Paarweise verschieden -- zwei Ablehnungsgruende duerfen sich
        // niemals einen Schluessel teilen, sonst zeigte die Oberflaeche bei
        // zwei verschiedenen Ursachen denselben deutschen Satz.
        for (i, a) in alle.iter().enumerate() {
            for (j, b) in alle.iter().enumerate() {
                if i != j {
                    assert_ne!(
                        a.key(),
                        b.key(),
                        "Schluessel-Kollision zwischen {a:?} und {b:?}"
                    );
                }
            }
        }
    }

    #[test]
    fn gegenprobe_a_a_29_ein_vertauschtes_paar_faellt_beim_obigen_massstab_durch() {
        // Rot-vor-gruen ohne Produktivcode: Diese Funktion baut absichtlich
        // EINEN vertauschten Schluessel nach (PathUnc <-> PathNotAbsolute --
        // genau das Beispiel aus Bedrohungsmodell 22.5/T-164-2) und zeigt,
        // dass der Massstab aus dem Fall oben genau diese zwei Auspraegungen
        // beanstandet -- nicht mehr und nicht weniger. Waere die Liste oben
        // blind fuer eine Vertauschung, zeigte diese Gegenprobe null statt
        // zwei Abweichungen.
        fn schluessel_mit_vertauschtem_paar(grund: Rejection) -> &'static str {
            match grund {
                Rejection::PathUnc => "path_not_absolute", // absichtlich vertauscht
                Rejection::PathNotAbsolute => "path_unc",  // absichtlich vertauscht
                other => other.key(),
            }
        }

        let alle: [Rejection; 16] = [
            Rejection::LinkEmpty,
            Rejection::LinkTooLong,
            Rejection::LinkControlCharacter,
            Rejection::LinkUnparsable,
            Rejection::LinkSchemeRejected,
            Rejection::LinkNotNormalized,
            Rejection::LinkNoHost,
            Rejection::LinkUserinfo,
            Rejection::PathEmpty,
            Rejection::PathTooLong,
            Rejection::PathControlCharacter,
            Rejection::PathUnc,
            Rejection::PathNotAbsolute,
            Rejection::PathStreamSeparator,
            Rejection::PathIndirectExtension,
            Rejection::PathMissing,
        ];

        let mut abweichungen = 0;
        for grund in alle {
            if schluessel_mit_vertauschtem_paar(grund) != grund.key() {
                abweichungen += 1;
            }
        }
        assert_eq!(
            abweichungen, 2,
            "die Gegenprobe muss genau die zwei vertauschten Auspraegungen zeigen"
        );
    }

    // ===========================================================================
    // T-174 (unit-tester), O-DQ Punkt 1 -- A-A-30: die Laengeninvariante der
    // Umleitungsliste und die vier gemessenen 8.3-Kurznamen (Bedrohungsmodell
    // 22.1.2).
    // ===========================================================================

    #[test]
    fn a_a_30_laengeninvariante_der_umleitungsliste_und_vier_8_3_kurznamen() {
        // Vier der fuenf Eintraege in INDIRECT_EXTENSIONS sind genau drei
        // Zeichen lang und ueberstehen deshalb eine 8.3-Kurznamen-Verkuerzung
        // unveraendert; nur "desktop" wird verkuerzt (zu "DES"), und ein
        // ".desktop" tut unter Windows nichts (Bedrohungsmodell 22.1.2). Kaeme
        // ein Windows-Umleiter mit mehr als drei Zeichen dazu (z.B.
        // "appref-ms", der ClickOnce-Starter), waere sein 8.3-Kurzname
        // (".APP") sofort ein Vorbeiweg -- dieser Fall wird in dem Moment rot,
        // in dem jemand die Liste erweitert, ohne an 8.3 zu denken.
        for endung in INDIRECT_EXTENSIONS {
            if endung == "desktop" {
                continue;
            }
            assert!(
                endung.len() <= 3,
                "{endung:?} ist laenger als drei Zeichen und ueberlebt eine \
                 8.3-Kuerzung NICHT unveraendert -- A-A-30 greift, ein neuer \
                 Prueffall fuer den zugehoerigen Kurznamen wird faellig"
            );
        }

        // Die vier gemessenen Kurznamen, die trotz Kuerzung erkannt werden
        // (Tafel aus 22.1.2; "APP~1.DES" fehlt hier bewusst -- es wird NICHT
        // erkannt, siehe Kommentar dort, und ist kein Vorbeiweg, weil ein
        // ".desktop" unter Windows nichts tut).
        assert!(has_indirect_extension(Path::new("/x/RECHNU~1.LNK")));
        assert!(has_indirect_extension(Path::new("/x/VERWEI~1.URL")));
        assert!(has_indirect_extension(Path::new("/x/START~1.PIF")));
        assert!(has_indirect_extension(Path::new("/x/ORDNER~1.SCF")));
    }

    // ===========================================================================
    // O-FS (T-185, aus T-174 Risiko 1): A-A-30 oben iteriert ueber die
    // HEUTIGEN fuenf Eintraege und haelt damit den heutigen Bestand fest, aber
    // die Ausnahme ist NAMENTLICH an die Zeichenkette "desktop" gebunden --
    // sie sagt nichts darueber, WIE VIELE Ausnahmen erlaubt sind. Die beiden
    // Faelle unten binden sich stattdessen an die REGEL selbst:
    //
    //  1. Auf der ECHTEN Liste: genau EIN Eintrag darf laenger als drei
    //     Zeichen sein, und es muss "desktop" sein -- nicht zwei Eintraege,
    //     nicht ein anderer einzelner.
    //  2. Auf einer HYPOTHETISCHEN, zukuenftigen Liste (sechs statt fuenf
    //     Eintraege, ein Windows-Umleiter mit vier Zeichen kommt dazu, der
    //     NICHT "desktop" heisst): dieselbe Regel muss verletzt sein, egal
    //     wie viele Eintraege die Liste dann hat. Das ist der Unterschied zu
    //     A-A-30 oben, das nur ueber die eingebaute Liste selbst geht und
    //     damit nichts ueber eine kuenftige Erweiterung aussagt, die A-A-30
    //     unveraendert liesse.
    // ===========================================================================

    #[test]
    fn o_fs_genau_eine_umleitungsendung_ueberschreitet_drei_zeichen_und_es_ist_desktop() {
        let laengere: Vec<&str> = INDIRECT_EXTENSIONS
            .into_iter()
            .filter(|endung| endung.len() > 3)
            .collect();
        assert_eq!(
            laengere,
            vec!["desktop"],
            "genau ein Eintrag darf die 8.3-Ausnahme tragen, und es ist \"desktop\" -- \
             nicht null, nicht zwei, nicht ein anderer (A-A-30, Bedrohungsmodell 22.1.2)"
        );
    }

    /// Dieselbe Regel wie oben, aber gegen eine LOKALE, zukuenftige Fixtur
    /// angewendet statt gegen die eingebaute Liste -- sie bildet die REGEL
    /// nach, nicht den heutigen Bestand. Kaeme zu den fuenf heutigen
    /// Eintraegen ein sechster hinzu, der laenger als drei Zeichen ist und
    /// nicht "desktop" heisst (hier: "conf", ein frei erfundener Platzhalter,
    /// keine echte Windows-Umleitung), muss dieselbe Pruefung wie oben
    /// scheitern -- unabhaengig davon, dass `INDIRECT_EXTENSIONS` selbst gar
    /// nicht veraendert wurde. `#[should_panic]` macht aus dem erwarteten
    /// Fehlschlag ein gruenes Ergebnis; ohne dieses Attribut waere die
    /// Funktion unten das rote Gegenstueck.
    #[test]
    #[should_panic(expected = "genau ein Eintrag darf die 8.3-Ausnahme tragen")]
    fn o_fs_gegenprobe_eine_kuenftige_vier_zeichen_endung_verletzt_dieselbe_regel() {
        const KUENFTIGE_LISTE: [&str; 6] = ["lnk", "url", "pif", "scf", "desktop", "conf"];
        let laengere: Vec<&str> = KUENFTIGE_LISTE
            .into_iter()
            .filter(|endung| endung.len() > 3)
            .collect();
        assert_eq!(
            laengere,
            vec!["desktop"],
            "genau ein Eintrag darf die 8.3-Ausnahme tragen, und es ist \"desktop\" -- \
             nicht null, nicht zwei, nicht ein anderer (A-A-30, Bedrohungsmodell 22.1.2)"
        );
    }

    // ===========================================================================
    // Gegenprobe: die ALTE Fassung (vor T-157) haette 9 von 18 dieser Faelle
    // nicht gefangen. Diese Funktion ist eine Testhilfe, kein Produktivcode --
    // sie lebt ausschliesslich in #[cfg(test)] und dient dem Nachweis, dass
    // die obigen Faelle die Behebung tatsaechlich messen und nicht nur eine
    // ohnehin schon richtige Eigenschaft wiederholen.
    // ===========================================================================

    /// Nachbau von `Path::extension()`-basierter Endungspruefung, wie sie VOR
    /// T-157 in `has_indirect_extension` stand (ohne Beschneidung, ohne
    /// `rsplit_once`). Dient ausschliesslich der Gegenprobe unten.
    fn hatte_indirekte_endung_alte_fassung(path: &Path) -> bool {
        match path.extension().and_then(|e| e.to_str()) {
            Some(ext) => INDIRECT_EXTENSIONS.contains(&ext.to_ascii_lowercase().as_str()),
            None => false,
        }
    }

    #[test]
    fn gegenprobe_die_alte_fassung_waere_bei_neun_der_folgenden_faelle_blind_gewesen() {
        // Jeder Fall hier ist eine Eingabe, bei der ALT und NEU auseinanderfallen
        // MUESSEN -- sonst waere er kein Beleg fuer die Behebung aus T-157,
        // sondern nur eine Wiederholung des Grundfalls (T-160, Auftrag Punkt 2).
        let bekannt_blinde_faelle: [&str; 9] = [
            "/x/rechnung.lnk.",
            "/x/rechnung.lnk ",
            "/x/rechnung.lnk. . ",
            "/x/rechnung.LNK.",
            "/x/verweis.url ",
            "/x/start.pif.",
            "/x/ordner.scf.",
            "/x/app.desktop.",
            "/x/.lnk",
        ];

        let mut tatsaechlich_blind = 0;
        for eingabe in bekannt_blinde_faelle {
            let pfad = Path::new(eingabe);
            let alt = hatte_indirekte_endung_alte_fassung(pfad);
            let neu = has_indirect_extension(pfad);
            assert!(neu, "neue Fassung muss ablehnen: {eingabe}");
            if !alt {
                tatsaechlich_blind += 1;
            }
            assert!(
                !alt,
                "dieser Fall waere schon von der ALTEN Fassung erkannt worden \
                 und ist damit kein Beleg fuer die Behebung: {eingabe}"
            );
        }
        assert_eq!(
            tatsaechlich_blind, 9,
            "T-157 hat neun blinde Faelle gemessen; diese Liste muss genau neun tragen"
        );

        // Und der Grundfall MUSS bei beiden Fassungen gleich ausgehen --
        // sonst waere die alte Fassung insgesamt falsch gewesen, nicht nur
        // bei einem Randfall.
        assert_eq!(
            hatte_indirekte_endung_alte_fassung(Path::new("/x/rechnung.lnk")),
            has_indirect_extension(Path::new("/x/rechnung.lnk"))
        );
    }

    // ===========================================================================
    // Windows -- die drei Faelle, die auf dem Linux-Laeufer nichts pruefen
    // koennen, weil die Win32-Namensaufloesung dort nicht existiert (A-A-10).
    // ===========================================================================

    #[cfg(windows)]
    mod windows_namensaufloesung {
        use super::*;

        /// Windows schneidet nachgestellte Punkte und Leerzeichen vom letzten
        /// Namensbestandteil ab, BEVOR es die Datei sucht -- das ist die
        /// Mechanik hinter T-156-1, unabhaengig von dieser Anwendung. Diese
        /// drei Faelle legen EINE reale Datei "x.lnk" an und zeigen, dass drei
        /// verschiedene Schreibweisen sich alle auf sie aufloesen.
        #[test]
        fn plain_name_loest_sich_auf_die_reale_datei_auf() {
            let pfad = echte_datei("win-plain", "x.lnk");
            assert!(Path::new(&pfad).is_file());
            assert_eq!(check_file(&pfad), Err(Rejection::PathIndirectExtension));
        }

        #[test]
        fn nachgestellter_punkt_loest_sich_auf_dieselbe_reale_datei_auf() {
            let plain = echte_datei("win-dot", "x.lnk");
            let mit_punkt = format!("{plain}.");
            assert!(
                Path::new(&mit_punkt).is_file(),
                "Windows muss '{mit_punkt}' auf die reale 'x.lnk' aufloesen"
            );
            assert_eq!(check_file(&mit_punkt), Err(Rejection::PathIndirectExtension));
        }

        #[test]
        fn nachgestelltes_leerzeichen_loest_sich_auf_dieselbe_reale_datei_auf() {
            let plain = echte_datei("win-space", "x.lnk");
            let mit_leerzeichen = format!("{plain} ");
            assert!(
                Path::new(&mit_leerzeichen).is_file(),
                "Windows muss '{mit_leerzeichen}' auf die reale 'x.lnk' aufloesen"
            );
            assert_eq!(
                check_file(&mit_leerzeichen),
                Err(Rejection::PathIndirectExtension)
            );
        }
    }
}
