//! Takt — die installierte Fassung und der Weg zur Release-Seite (A-18.1,
//! A-18.6, A-18.8, E-067, Auflagen A-V-15 und A-V-16).
//!
//! ## Warum dieses Modul die Vertrauensgrenze ist und nicht ihre Absicherung
//!
//! T-136 hat `tauri-plugin-shell 2.3.6` gemessen, nicht vermutet:
//! `Shell::open` (`src/lib.rs:76-78`) reicht an `open::open(None, …)` durch,
//! und `open::open` (`src/open.rs:122-136`) sagt im eigenen Quelltext
//! *„when running directly from Rust code we don't need to validate the
//! path"*. Der `OpenScope` mit dem Prüfausdruck wird ausschließlich betreten,
//! wenn der Aufruf **aus JavaScript** kommt.
//!
//! Zwischen der Antwort von GitHub und `xdg-open` beziehungsweise
//! `ShellExecuteW` steht damit genau **eine** Kontrolle: [`is_release_version`]
//! in dieser Datei. Kein zweites Netz, keine Vorgabeprüfung, die im Zweifel
//! greift (Befund T-136-1).
//!
//! Der zweite Teil derselben Auflage steht nicht hier, sondern in
//! `capabilities/default.json`: Dort darf **keine** `shell:`-Zeile stehen. Der
//! Vorgabesatz `shell:default` enthält `allow-open`, und dessen Prüfausdruck
//! `^((mailto:\w+)|(tel:\w+)|(https?://\w+)).+` lässt jede `https:`-Adresse
//! durch — eine offene Weiterleitung in den Browser des Benutzers, ausgelöst
//! von einem eingeschleusten Skript im Webview. Beide Hälften misst
//! `scripts/proof-shell-surface.mjs`, damit sie nicht bloß zugesagt sind
//! (E-067 Punkt 3).
//!
//! ## Was der Befehl **nicht** entgegennimmt
//!
//! Keine Adresse. Kein Schema, keinen Wirt, keinen Pfad, keine Abfrage. Nur
//! die Fassungsbezeichnung, und die wird geprüft, bevor sie in eine hier fest
//! stehende Adresse eingesetzt wird (E-064 Punkt 4). Die naheliegende Form —
//! `html_url` aus der Antwort an einen Öffnen-Befehl reichen — wäre wörtlich
//! eine offene Weiterleitung, deren Ziel nicht ein Reiter ist, sondern der
//! Browser des Benutzers (B-18.2).
//!
//! ## Und die Fassung kommt aus der Binärdatei
//!
//! [`takt_installed_version`] liest `app.package_info().version` — die beim
//! Bauen eingeprägte Angabe. **Nicht** aus einer Datei neben der ausführbaren
//! Datei, nicht aus einer Umgebungsvariablen, nicht aus einem Argument
//! (A-V-15, E-067 Punkt 1). Läge die Zahl daneben, könnte jeder Prozess im
//! Benutzerkonto sie herabsetzen und Takt dauerhaft eine
//! Aktualisierungsaufforderung zeigen lassen — auf einen Knopf, bei dem der
//! Benutzer darauf eingestellt ist, eine unsignierte Datei zu holen und
//! auszuführen (T-136-3).

use tauri_plugin_shell::ShellExt;

/// Die Adresse der Release-Seite, ohne die Fassungsbezeichnung.
///
/// Die **einzige** Stelle im Rust-Anteil, an der eine Adresse außerhalb von
/// `127.0.0.1` steht. Sie ist eine Konstante und keine Einstellung: weder aus
/// der Umgebung, noch aus einer Datei, noch aus einem Argument, noch aus einer
/// Antwort (A-18.3).
const RELEASE_TAG_PREFIX: &str = "https://github.com/KuyomieKurama/SuperTakt/releases/tag/v";

/// Obergrenze der Fassungsbezeichnung: 9+1+9+1+9+1+64 (B-18.2, „Welche Länge?").
///
/// Sie steht **vor** jeder anderen Prüfung, damit eine Zeichenkette von 60 000
/// Zeichen nicht erst zerlegt wird.
const MAX_VERSION_LEN: usize = 94;

/// Höchstlänge einer der drei Zahlen. Ohne diese Schranke wäre der Ausdruck in
/// der Länge unbegrenzt.
const MAX_NUMBER_LEN: usize = 9;

/// Höchstlänge der Vorabkennung hinter dem `-`.
const MAX_PRERELEASE_LEN: usize = 64;

/// Entspricht die Bezeichnung
/// `^[0-9]{1,9}\.[0-9]{1,9}\.[0-9]{1,9}(-[0-9A-Za-z.-]{1,64})?$`? (A-V-8.)
///
/// **Ohne führendes `v`.** Das `v` gehört zur Bezeichnung der Veröffentlichung
/// und nicht zur Fassung; abgeschnitten wird es an genau einer Stelle, und die
/// liegt in `packages/domain` (E-066 Punkt 3). Hier wird es abgewiesen — eine
/// zweite Stelle, die es abschneidet, wäre eine zweite Meinung darüber, was
/// eine Fassung ist.
///
/// Der Zeichenvorrat ist der Grund, warum die Zusammensetzung unten sicher
/// ist, und nicht eine Meinung über die entstehende Adresse: `/`, `\`, `?`,
/// `#`, `:`, `@`, `%`, Leerzeichen und Zeilenumbruch kommen darin nicht vor,
/// und jedes Segment beginnt mit `v` und einer Ziffer — ein vollständiges
/// Segment `..` ist damit ausgeschlossen.
///
/// Von Hand geschrieben und nicht mit einem Prüfausdruck: Eine
/// Ausdrucksbibliothek in der Lieferkette wäre für sieben Zeilen mehr Fläche
/// als Gewinn, und ein fehlendes `$` ist genau die Falle, die B-18.2 Punkt 3
/// beschreibt.
pub fn is_release_version(value: &str) -> bool {
    if value.is_empty() || value.len() > MAX_VERSION_LEN {
        return false;
    }
    // `len()` zählt Bytes. Erst diese Zeile macht daraus eine Aussage über
    // Zeichen — und weist zugleich jede Ziffer ab, die keine ASCII-Ziffer ist
    // (arabisch-indische Ziffern etwa sind `is_numeric`, aber nicht `0-9`).
    if !value.is_ascii() {
        return false;
    }

    // Der erste Bindestrich trennt Kern und Vorabkennung. Er kann nicht früher
    // stehen: Der Kern besteht ausschließlich aus Ziffern und Punkten.
    let (core, prerelease) = match value.split_once('-') {
        Some((core, prerelease)) => (core, Some(prerelease)),
        None => (value, None),
    };

    let mut numbers = core.split('.');
    for _ in 0..3 {
        match numbers.next() {
            Some(number) => {
                if number.is_empty() || number.len() > MAX_NUMBER_LEN {
                    return false;
                }
                if !number.bytes().all(|byte| byte.is_ascii_digit()) {
                    return false;
                }
            }
            None => return false,
        }
    }
    if numbers.next().is_some() {
        return false;
    }

    match prerelease {
        None => true,
        Some(tail) => {
            if tail.is_empty() || tail.len() > MAX_PRERELEASE_LEN {
                return false;
            }
            tail.bytes()
                .all(|byte| byte.is_ascii_alphanumeric() || byte == b'.' || byte == b'-')
        }
    }
}

/// Die Adresse der Release-Seite dieser Fassung, oder `None`.
///
/// Getrennt vom Befehl, damit die Zusammensetzung ohne laufende Anwendung
/// prüfbar ist — die Ausbruchsliste aus B-18.2 fährt gegen diese Funktion.
fn release_url(version: &str) -> Option<String> {
    if is_release_version(version) {
        Some(format!("{RELEASE_TAG_PREFIX}{version}"))
    } else {
        None
    }
}

/// Die installierte Fassung, aus den eingeprägten Angaben des Erzeugnisses
/// (A-18.1, A-V-15).
///
/// Genau ein Aufruf, keine Datei, kein Rückweg. Der Wert wird beim Bauen aus
/// `version` in `tauri.conf.json` eingeprägt (E-065); im Auslieferungsbau legt
/// `scripts/build-app.mjs` die Zahl aus dem Git-Etikett darüber. Zur Laufzeit
/// gibt es hier deshalb keine zweite Quelle und keinen Zweig.
#[tauri::command]
pub fn takt_installed_version(app: tauri::AppHandle) -> String {
    app.package_info().version.to_string()
}

/// Öffnet die Release-Seite dieser Fassung im Browser des Benutzers (A-18.8).
///
/// **Genau ein Parameter, und er trägt keine Adresse** (A-V-16). Besteht die
/// Bezeichnung die Form nicht, geschieht nichts: kein Aufruf, kein Öffnen,
/// kein zweiter Versuch. Zurück kommt ein technischer Schlüssel **ohne** den
/// abgewiesenen Wert — ein abgewiesener Wert in einer Meldung wäre derselbe
/// fremde Text an einer neuen Stelle (B-18.2, letzte Zeile der Tabelle).
///
/// Heruntergeladen und installiert wird nichts, hier so wenig wie sonst
/// irgendwo (A-18.9). `open` startet den eingestellten Browser mit einer
/// Adresse; was danach geschieht, entscheidet der Benutzer außerhalb von Takt.
#[tauri::command]
pub fn takt_open_release(app: tauri::AppHandle, version: String) -> Result<(), String> {
    let url = release_url(&version).ok_or_else(|| "version_rejected".to_string())?;

    // `open` ist seit 2.1.0 zugunsten von `tauri-plugin-opener` abgekündigt.
    // Der Tausch wäre eine weitere Kiste in der Lieferkette für dieselbe eine
    // Zeile; die Abkündigung ändert nichts an dem, was hier zählt — der Weg
    // aus Rust betritt den Prüfbereich des Plugins ohnehin nicht (T-136-1),
    // und die Kontrolle steht vollständig in dieser Datei.
    #[allow(deprecated)]
    app.shell().open(url, None).map_err(|_| "open_failed".to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Die zehn Ausbruchsversuche aus `docs/bedrohungsmodell.md` 18.3, wörtlich
    /// und **neben** dem Befehl statt in einer fernen Testdatei (T-136-1).
    const AUSBRUCHSVERSUCHE: [&str; 10] = [
        "../../../evil",
        "1.2.3/../../evil",
        "1.2.3?x=1",
        "1.2.3#a",
        "1.2.3@evil.example",
        "1.2.3\\evil",
        "1.2.3%2f..%2f..%2fevil",
        "1.2.3 evil",
        "1.2.3\n",
        "999999999999999999999.0.0",
    ];

    #[test]
    fn kein_ausbruchsversuch_erreicht_die_zusammensetzung() {
        for versuch in AUSBRUCHSVERSUCHE {
            assert!(!is_release_version(versuch), "durchgelassen: {versuch:?}");
            assert!(release_url(versuch).is_none(), "zusammengesetzt: {versuch:?}");
        }
    }

    #[test]
    fn weist_ab_was_keine_fassung_ist() {
        for versuch in [
            "",
            "v1.2.3", // Das `v` schneidet die Domäne ab, nicht die Hülle.
            "1.2",
            "1.2.3.4",
            "1.2.3-",
            "1.2.3-rc 1",
            "1.2.3-rc/1",
            "1.2.3--\u{202e}",
            "١.٢.٣", // Arabisch-indische Ziffern sind Ziffern, aber nicht `0-9`.
            "0000000000.0.0",
            "1.2.3-rc.1-\u{fffd}",
        ] {
            assert!(!is_release_version(versuch), "durchgelassen: {versuch:?}");
        }

        // Länge: 64 Zeichen Vorabkennung bestehen, 65 nicht.
        let gerade_noch = format!("1.2.3-{}", "a".repeat(MAX_PRERELEASE_LEN));
        let eines_zu_viel = format!("1.2.3-{}", "a".repeat(MAX_PRERELEASE_LEN + 1));
        assert!(is_release_version(&gerade_noch));
        assert!(!is_release_version(&eines_zu_viel));

        // Und die Zeichenkette aus 60 000 Zeichen aus A-V-8.
        assert!(!is_release_version(&"9".repeat(60_000)));
    }

    #[test]
    fn laesst_durch_was_eine_fassung_ist() {
        for fassung in [
            "0.0.0",
            "1.2.3",
            "0.10.0",
            "999999999.999999999.999999999",
            "1.0.0-rc.1",
            "1.0.0-beta.10",
            "1.2.3-alpha-2",
        ] {
            assert!(is_release_version(fassung), "abgewiesen: {fassung:?}");
        }
    }

    #[test]
    fn die_adresse_bleibt_auf_github() {
        let url = release_url("1.2.3-rc.1").expect("gültige Fassung");
        assert_eq!(
            url,
            "https://github.com/KuyomieKurama/SuperTakt/releases/tag/v1.2.3-rc.1"
        );
        assert!(url.starts_with(RELEASE_TAG_PREFIX));
        // Weder Abfrage noch Fragment: Beide Zeichen kommen im Vorrat nicht vor.
        assert!(!url.contains('?'));
        assert!(!url.contains('#'));
    }

    // -----------------------------------------------------------------
    // T-140 — Erweiterung (unit-tester), neben dem Befehl statt in einer
    // fernen Testdatei, wie T-136-1/T-139 es verlangen.
    // -----------------------------------------------------------------

    /// `MAX_NUMBER_LEN` gilt je Komponente, unabhängig von der Gesamtlänge —
    /// eine Komponente mit zehn Ziffern ist ungültig, auch wenn der ganze Wert
    /// weit unter `MAX_VERSION_LEN` bleibt. Ohne diesen Fall könnte die
    /// Komponentenschranke verschwinden, ohne dass ein bestehender Test es
    /// merkt: Der einzige bisherige Längenfall (`weist_ab_was_keine_fassung_ist`,
    /// `"999999999999999999999.0.0"`) ist so lang, dass schon die
    /// Gesamtlängenprüfung am Anfang der Funktion greift.
    #[test]
    fn max_number_len_gilt_je_komponente_nicht_nur_gesamt() {
        // Genau neun Ziffern: die Obergrenze, gültig.
        assert!(is_release_version("999999999.2.3"));
        // Zehn Ziffern in EINER Komponente: ungültig, obwohl der ganze Wert
        // nur 14 Zeichen lang ist — weit unter MAX_VERSION_LEN (94).
        let zehn_ziffern = "1234567890.2.3";
        assert!(zehn_ziffern.len() < MAX_VERSION_LEN);
        assert!(!is_release_version(zehn_ziffern));
        assert!(release_url(zehn_ziffern).is_none());

        // Dieselbe Falle in der zweiten und dritten Komponente.
        assert!(!is_release_version("1.1234567890.3"));
        assert!(!is_release_version("1.2.1234567890"));
    }

    /// Die Gesamtlängenschranke selbst, exakt an ihrer Grenze — nicht nur ihr
    /// Vielfaches (`60_000` Zeichen). Ein "off by one" in `MAX_VERSION_LEN`
    /// (`>` statt `>=`, oder umgekehrt) würde von keinem bisherigen Fall
    /// bemerkt.
    #[test]
    fn max_version_len_exakt_an_der_grenze() {
        // 9 + 1 + 9 + 1 + 9 + 1 = 30: die drei größten Kernkomponenten samt
        // Bindestrich, dazu eine Vorabkennung an IHRER eigenen Grenze (64) —
        // 30 + 64 = 94, genau die Obergrenze.
        let kern = "999999999.999999999.999999999-";
        assert_eq!(kern.len(), 30);
        let genau_94 = format!("{kern}{}", "a".repeat(64));
        assert_eq!(genau_94.len(), 94);
        assert!(is_release_version(&genau_94), "94 Zeichen muss gültig sein");

        // Ein Zeichen mehr: Die Vorabkennung wäre für sich schon zu lang
        // (65 > MAX_PRERELEASE_LEN), UND der Gesamtwert überschreitet
        // MAX_VERSION_LEN — die Prüfung dieser Zeile greift als ALLERERSTES
        // in der Funktion, vor jeder Zerlegung.
        let genau_95 = format!("{kern}{}", "a".repeat(65));
        assert_eq!(genau_95.len(), 95);
        assert!(!is_release_version(&genau_95), "95 Zeichen muss ungültig sein");
        assert!(release_url(&genau_95).is_none());
    }

    /// Ein großes `V` ist an dieser Stelle IMMER ungültig — anders als ein
    /// kleines, das aber ohnehin nie hier ankommt (E-066 Punkt 3 schneidet es
    /// vorher in `packages/domain` ab). Diese Funktion kennt kein `v` in
    /// irgendeiner Schreibweise; würde sie versehentlich ein großes `V`
    /// zulassen, entstünde eine zweite, abweichende Meinung darüber, was eine
    /// Fassung ist.
    #[test]
    fn kein_v_in_irgendeiner_schreibweise_wird_hier_akzeptiert() {
        for versuch in ["V1.2.3", "v1.2.3", "vV1.2.3"] {
            assert!(!is_release_version(versuch), "durchgelassen: {versuch:?}");
        }
    }

    /// Führende Nullen in einer Kernkomponente sind nach der Form aus A-V-8
    /// zulässig (`[0-9]{1,9}`, keine Sonderregel gegen führende Nullen) —
    /// dieselbe Form wie `VERSION_SHAPE` in `packages/domain/src/version.ts`.
    /// Ein Auseinanderlaufen der beiden Prüfungen wäre die Art Fehler, die
    /// erst auffällt, wenn eine Fassung an der einen Stelle durchgeht und an
    /// der anderen nicht.
    #[test]
    fn fuehrende_nullen_in_kernkomponenten_sind_zulaessig_wie_in_der_domaene() {
        assert!(is_release_version("007.2.3"));
        assert!(is_release_version("0.0.0"));
    }

    /// `release_url` trägt den abgewiesenen Wert NICHT in einer anderen Form
    /// weiter — `None` ist `None`, kein `Some("")` und keine Teilzusammensetzung.
    /// Ohne diese Zusicherung könnte eine künftige Änderung `release_url` so
    /// umbauen, dass sie bei einer ungültigen Eingabe eine unvollständige,
    /// aber nicht-leere Adresse zurückgibt — die Formprüfung wäre dann
    /// umgangen, ohne dass `is_release_version` selbst sich ändert.
    #[test]
    fn release_url_ist_wirklich_none_und_keine_teiladresse() {
        for versuch in AUSBRUCHSVERSUCHE {
            assert_eq!(release_url(versuch), None, "unerwartet Some für {versuch:?}");
        }
    }
}
