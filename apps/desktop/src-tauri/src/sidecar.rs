//! Takt — Lebenszyklus des lokalen Dienstes (E-004, B-1.6, R-04).
//!
//! Die Hülle startet den Sidecar und beendet ihn wieder. Beides ist
//! Sicherheitsfunktion und nicht Bequemlichkeit:
//!
//! - **Start.** Der Sidecar bekommt sein Startgeheimnis über `stdin`, nicht
//!   über die Befehlszeile. Befehlszeilen sind für jeden Prozess im System
//!   sichtbar — `ps`, Task-Manager, WMI —, und ein Geheimnis dort ist keines
//!   (B-1.6 Punkt 2). Ohne dieses Geheimnis beendet sich der Dienst mit Code 78;
//!   damit kann ihn niemand sonst starten und auf die echte Datenbank zeigen.
//!
//! - **Zweite Zeile: der Windows-Benutzername (E-042).** Über denselben Kanal
//!   geht der Name, den `identity.rs` vom Betriebssystem gelesen hat. Nicht
//!   über `USERNAME` — `set USERNAME=fremder && Takt.exe` würde sonst genügen,
//!   um fremde Arbeitszeit unter eigenem Namen abzurechnen (B-8.1). Nicht über
//!   die Befehlszeile, aus demselben Grund wie das Geheimnis. Ohne diese Zeile
//!   startet der Dienst ebenfalls nicht: Ein Export ohne Urheber wäre nicht
//!   nachvollziehbar.
//!
//!   **Beide Zeilen gehen in einem einzigen Schreibvorgang heraus.** Der Leser
//!   auf der Gegenseite nimmt sie in einem Zug auf; würde die Hülle sie
//!   getrennt schicken, wäre das zwar auch lesbar, aber der umgekehrte Fehler
//!   ist der teure: Zwei nacheinander geschaltete Leser verschlucken die
//!   zweite Zeile, wenn sie im selben Datenblock liegt. Ein Schreibvorgang
//!   hält beide Seiten auf dem Fall, der geprüft ist.
//!
//! - **Ende.** Ein verwaister Sidecar lauscht weiter auf `127.0.0.1:17843`,
//!   hält Kundendaten und hat kein Fenster mehr, in dem man ihn bemerkt. Das
//!   ist ein Sicherheitsproblem und kein Schönheitsfehler (B-1.6 Punkte 3
//!   und 4).
//!
//! ## Zwei Wege ins Ende, und warum es zwei braucht
//!
//! 1. **Die Hülle beendet ihn ausdrücklich** — beim Schließen des Fensters und
//!    beim Verlassen der Ereignisschleife. Das deckt den geordneten Weg.
//!
//! 2. **Die Röhre reißt.** Stirbt die Hülle hart — `kill -9`, Absturz,
//!    Abmeldung, Stromausfall —, kommt sie zu keinem Aufräumen mehr. Dann
//!    schließt das Betriebssystem ihr Ende der `stdin`-Röhre, der Dienst
//!    bemerkt das Ende und beendet sich selbst (`watchParentLink` in
//!    `apps/local-api/src/access/session-secret.ts`).
//!
//! Der zweite Weg ist der wichtigere: Er wirkt genau in den Fällen, in denen
//! der erste nicht mehr laufen kann. Er ist mit `sidecar:verify` nachgewiesen.

use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

/// Name der Binärdatei aus `tauri.conf.json`, `bundle.externalBin`.
const SIDECAR: &str = "takt-local-api";

/// Das Ereignis, mit dem die Hülle den Ausfall des Dienstes meldet (T-020b).
///
/// **Warum es das braucht.** Ohne dieses Ereignis stand der Grund nur im
/// Zustand, und die Oberfläche erfuhr davon erst beim nächsten Abruf von
/// `takt_shell_state`. Eine Sperrmeldung, die so aktuell ist wie der letzte
/// Abruf, sperrt nichts — sie beschreibt hinterher. Und genau die Minuten
/// davor sind die, in denen der Benutzer weiterarbeitet und seine Zeit
/// verliert, weil nichts mehr geschrieben wird.
///
/// Die Gegenseite steht in `apps/desktop/src/shell.ts` unter
/// `SHELL_EVENTS.serviceExited`. Dass beide Seiten dieselbe Zeichenkette
/// führen, prüft `ereignisname_steht_auch_in_shell_ts`.
pub const SERVICE_EXITED_EVENT: &str = "takt://dienst-beendet";

/// Länge des Startgeheimnisses in Bytes vor der Hex-Darstellung.
///
/// 32 Byte werden zu 64 Zeichen. Der Dienst verlangt mindestens 32 Zeichen
/// (`MIN_SECRET_LENGTH` in `session-secret.ts`).
const SECRET_BYTES: usize = 32;

/// Längengrenze des Benutzernamens, gleichlautend mit `MAX_USER_LENGTH` auf der
/// Dienstseite. Hier geprüft, damit ein zu langer Name eine verständliche
/// Meldung ergibt statt eines Starts, der nach fünf Sekunden mit 78 endet.
const MAX_USER_LENGTH: usize = 256;

/// Der Zustand, den die Hülle über den Dienst führt.
pub struct Service {
    /// Das Startgeheimnis. Zugleich der Nachweis, mit dem sich die Oberfläche
    /// ausweist (T-011). Es berührt die Platte nie und gilt für einen Start.
    secret: String,
    child: Mutex<Option<CommandChild>>,
    /// Wurde der Dienst beendet, weil er von sich aus ausgestiegen ist?
    exit: Mutex<Option<ExitReason>>,
}

/// Warum der Dienst nicht mehr läuft — in einer Form, die die Oberfläche
/// verständlich anzeigen kann.
#[derive(Debug, Clone, serde::Serialize)]
pub struct ExitReason {
    pub code: Option<i32>,
    /// Klartext für die Oberfläche. Nennt nie ein Geheimnis.
    ///
    /// Der Satz, den der Benutzer zuerst liest — und er liest ihn in dem
    /// Moment, in dem seine Anwendung nichts mehr speichert. Er sagt, was
    /// passiert ist und was zu tun ist, und er tut es ohne Fachsprache.
    pub message: String,
    /// Der technische Zusatz — das, was man weitergibt (T-020b).
    ///
    /// Steht in der Oberfläche **neben** dem Klartext, nicht an seiner Stelle.
    /// Vorher stand „Der Port 17843 ist belegt" als erster Satz auf dem
    /// Bildschirm: für die Systembetreuung genau richtig, für den Anwender ein
    /// Fremdwort. `None`, wenn es nichts weiterzugeben gibt.
    pub detail: Option<String>,
}

/// Was die Oberfläche braucht, um mit dem Dienst zu sprechen.
#[derive(Debug, Clone, serde::Serialize)]
pub struct Handshake {
    pub base_url: String,
    pub header_name: String,
    pub secret: String,
}

impl Service {
    pub fn new() -> Result<Self, String> {
        Ok(Self {
            secret: new_secret()?,
            child: Mutex::new(None),
            exit: Mutex::new(None),
        })
    }

    pub fn handshake(&self) -> Handshake {
        Handshake {
            // Fester Port aus `apps/local-api/src/config.ts`. Ausdrücklich kein
            // Geheimnis (B-1.5) — der Schutz kommt aus Herkunftsprüfung und
            // Nachweis, nicht aus der Portnummer.
            base_url: "http://127.0.0.1:17843/api/v1".to_string(),
            header_name: "X-Takt-Token".to_string(),
            secret: self.secret.clone(),
        }
    }

    pub fn exit_reason(&self) -> Option<ExitReason> {
        self.exit.lock().ok().and_then(|guard| guard.clone())
    }

    fn note_exit(&self, reason: ExitReason) {
        if let Ok(mut guard) = self.exit.lock() {
            *guard = Some(reason);
        }
        if let Ok(mut guard) = self.child.lock() {
            *guard = None;
        }
    }

    /// Beendet den Dienst. Darf mehrfach aufgerufen werden.
    ///
    /// Wird beim Schließen des Fensters **und** beim Verlassen der
    /// Ereignisschleife gerufen; welcher zuerst kommt, hängt an der Plattform.
    pub fn stop(&self) {
        let taken = self.child.lock().ok().and_then(|mut guard| guard.take());
        if let Some(child) = taken {
            // `kill` schließt zugleich unser Ende der Röhre. Selbst wenn das
            // Signal nicht ankäme, endete der Dienst über das Ende von `stdin`.
            let _ = child.kill();
        }
    }
}

/// Erzeugt das Startgeheimnis aus der Zufallsquelle des Betriebssystems.
///
/// Hex, nicht Base64: Die Kodierung ist hier nur Transport über eine Zeile
/// `stdin` und trägt keine Fachbedeutung. Base64 im Sinne von A-8.9 ist etwas
/// anderes und gehört in `packages/domain` — nicht hierher.
fn new_secret() -> Result<String, String> {
    let mut bytes = [0u8; SECRET_BYTES];
    getrandom::fill(&mut bytes)
        .map_err(|error| format!("Die Zufallsquelle des Betriebssystems ist nicht verfügbar: {error}"))?;
    let mut out = String::with_capacity(SECRET_BYTES * 2);
    for byte in bytes {
        out.push_str(&format!("{byte:02x}"));
    }
    Ok(out)
}

/// Baut die beiden Startzeilen und prüft dabei den Benutzernamen.
///
/// Geprüft wird **vor** dem Start, nicht danach. Ein Name, den die Gegenseite
/// ablehnt, würde dort in einem Abbruch mit Code 78 enden — fünf Sekunden
/// später und ohne Hinweis darauf, dass es am Namen lag und nicht am Geheimnis.
///
/// Die Regel ist dieselbe wie in `isPlausibleUserName` auf der Dienstseite:
/// nicht leer, höchstens 256 Zeichen, keine Steuerzeichen. Das Zeilenende ist
/// dabei der eigentliche Punkt — ein Name mit `\n` darin würde das Protokoll
/// dieser Röhre aufbrechen und dem Dienst eine dritte Zeile unterschieben.
fn handshake_line(secret: &str, os_user: &str) -> Result<String, String> {
    let user = os_user.trim();

    if user.is_empty() {
        return Err(
            "Der Windows-Benutzername ließ sich nicht vom Betriebssystem lesen. Takt startet den \
             lokalen Dienst nicht, weil ein Export ohne Urheber nicht nachvollziehbar wäre."
                .to_string(),
        );
    }
    if user.chars().count() > MAX_USER_LENGTH {
        return Err(format!(
            "Der vom Betriebssystem gelesene Benutzername ist länger als {MAX_USER_LENGTH} Zeichen. \
             Takt startet den lokalen Dienst nicht."
        ));
    }
    if user.chars().any(|c| c.is_control()) {
        // Der Name wird bewusst **nicht** in die Meldung gesetzt: Eine Meldung,
        // die fremde Eingabe wörtlich wiedergibt, ist der bequemste Weg, ein
        // Protokoll zu fälschen.
        return Err(
            "Der vom Betriebssystem gelesene Benutzername enthält Steuerzeichen. Takt startet den \
             lokalen Dienst nicht."
                .to_string(),
        );
    }

    Ok(format!("{secret}\n{user}\n"))
}

/// Startet den Sidecar und übergibt Startgeheimnis und Benutzernamen über `stdin`.
pub fn start(app: &AppHandle, os_user: &str) -> Result<(), String> {
    let service = app.state::<Service>();

    // Erst prüfen, dann starten. Umgekehrt hinge ein Kindprozess fünf Sekunden
    // an einer Röhre, aus der nie etwas Gültiges kommt.
    let line = handshake_line(&service.secret, os_user)?;

    let command = app
        .shell()
        .sidecar(SIDECAR)
        .map_err(|error| format!("Der lokale Dienst wurde nicht gefunden: {error}"))?;

    let (mut events, mut child) = command
        .spawn()
        .map_err(|error| format!("Der lokale Dienst ließ sich nicht starten: {error}"))?;

    // Beide Zeilen, ein Schreibvorgang, sofort nach dem Start. Der Dienst
    // wartet fünf Sekunden darauf und beendet sich sonst
    // (`SESSION_SECRET_TIMEOUT_MS`).
    child
        .write(line.as_bytes())
        .map_err(|error| format!("Die Startzeilen ließen sich nicht übergeben: {error}"))?;

    if let Ok(mut guard) = service.child.lock() {
        *guard = Some(child);
    }

    let handle = app.clone();
    let secret = service.secret.clone();
    tauri::async_runtime::spawn(async move {
        while let Some(event) = events.recv().await {
            match event {
                CommandEvent::Stdout(bytes) | CommandEvent::Stderr(bytes) => {
                    let text = String::from_utf8_lossy(&bytes);
                    // Letzte Verteidigungslinie. Der Dienst schwärzt seine
                    // Ausgabe bereits selbst; diese Zeile kostet nichts und
                    // fängt, was eine Meldung der Laufzeitumgebung mitschleppt.
                    let safe = text.replace(secret.as_str(), "<geschwärzt>");
                    eprintln!("[dienst] {}", safe.trim_end());
                }
                CommandEvent::Terminated(payload) => {
                    let (message, detail) = explain_exit(payload.code);
                    let reason = ExitReason {
                        code: payload.code,
                        message,
                        detail,
                    };
                    eprintln!("[dienst] beendet: {}", reason.message);

                    // Reihenfolge ist Inhalt: **erst** in den Zustand, **dann**
                    // melden. Ein Empfänger, der auf das Ereignis hin sofort
                    // `takt_shell_state` abruft, muss den Grund dort schon
                    // finden — sonst meldet die Hülle einen Ausfall und
                    // beschreibt im selben Atemzug eine Anwendung, der nichts
                    // fehlt.
                    handle.state::<Service>().note_exit(reason.clone());
                    let _ = handle.emit(SERVICE_EXITED_EVENT, reason);
                }
                _ => {}
            }
        }
    });

    Ok(())
}

/// Die Beendigungscodes aus `apps/local-api/src/main.ts`, in Sätzen.
///
/// Der Benutzer sieht diese Texte. „Exit code 74" hilft ihm nicht — aber „Port
/// 17843" auch nicht, und das war der Fehler der ersten Fassung (T-020b).
/// Deshalb zwei Sätze für zwei Leser: der Klartext für den, der vor dem
/// Bildschirm sitzt, der Zusatz für den, den er anruft.
///
/// Der Beendigungscode selbst steht **nicht** mehr im Text. Er ist ein eigenes
/// Feld und wird von der Oberfläche als Fußnote gezeigt; im Satz wäre er genau
/// die Nummer, die niemandem hilft.
///
/// **Was hier nicht steht: „Beenden Sie Takt und starten Sie es neu."** Diesen
/// Satz zeigt die Oberfläche ohnehin als Schritt 2 ihrer Handlungsliste, und im
/// Dialog stünde er dann zweimal im Abstand von fünf Zentimetern. Der Klartext
/// nennt deshalb nur, was **dieser** Fall an Eigenem hat — bei Code 74 die
/// Frage, ob Takt schon läuft; sonst nichts.
fn explain_exit(code: Option<i32>) -> (String, Option<String>) {
    match code {
        Some(74) => (
            "Takt konnte den lokalen Dienst nicht starten, weil ein anderes Programm den \
             Zugang belegt, über den Takt mit sich selbst spricht. Am häufigsten ist das Takt \
             selbst: Läuft es vielleicht schon in einem anderen Fenster?"
                .to_string(),
            Some(
                "Der Port 17843 auf 127.0.0.1 ist belegt. Takt weicht bewusst nicht auf einen \
                 anderen Port aus, weil sich sonst ein fremdes Programm als Takt ausgeben \
                 könnte."
                    .to_string(),
            ),
        ),
        Some(78) => (
            "Takt konnte den lokalen Dienst nicht starten, weil ihm beim Start etwas fehlte, \
             das er zum Speichern braucht."
                .to_string(),
            Some(
                "Der Dienst hat Startgeheimnis oder Windows-Benutzernamen nicht über stdin \
                 erhalten, oder das Anwendungsdatenverzeichnis fehlt."
                    .to_string(),
            ),
        ),
        Some(0) => ("Der lokale Dienst wurde beendet.".to_string(), None),
        Some(_) | None => (
            "Der lokale Dienst von Takt hat sich unerwartet beendet.".to_string(),
            None,
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn geheimnis_ist_lang_genug_und_jedes_mal_anders() {
        let first = new_secret().expect("Zufallsquelle");
        let second = new_secret().expect("Zufallsquelle");
        // Der Dienst verlangt mindestens 32 Zeichen.
        assert_eq!(first.len(), SECRET_BYTES * 2);
        assert!(first.len() >= 32);
        assert_ne!(first, second);
        assert!(first.chars().all(|c| c.is_ascii_hexdigit()));
    }

    #[test]
    fn beendigungscodes_sind_in_saetzen_erklaert() {
        let (klartext, zusatz) = explain_exit(Some(74));
        assert!(!klartext.is_empty());
        assert!(zusatz.expect("Zusatz zu 74").contains("17843"));

        let (klartext78, zusatz78) = explain_exit(Some(78));
        assert!(!klartext78.is_empty());
        let zusatz78 = zusatz78.expect("Zusatz zu 78");
        assert!(zusatz78.contains("Startgeheimnis"));
        assert!(zusatz78.contains("Benutzernamen"));

        assert!(!explain_exit(None).0.is_empty());
    }

    /// T-020b — der Satz, den der Anwender zuerst liest, spricht keine
    /// Fachsprache. Portnummer, Adresse und `stdin` gehören in den Zusatz.
    #[test]
    fn der_klartext_traegt_keine_technischen_bezeichner() {
        for code in [Some(74), Some(78), Some(0), Some(9), None] {
            let (klartext, _) = explain_exit(code);
            for begriff in ["17843", "127.0.0.1", "stdin", "Port", "Code"] {
                assert!(
                    !klartext.contains(begriff),
                    "„{begriff}“ steht im Klartext zu {code:?}: {klartext}"
                );
            }
        }
    }

    /// Ein unbekannter Code darf keine Nummer in den Satz schmuggeln — vorher
    /// tat er das über `format!("… (Code {other}).")`.
    #[test]
    fn ein_unbekannter_code_erscheint_nicht_im_satz() {
        let (klartext, zusatz) = explain_exit(Some(137));
        assert!(!klartext.contains("137"));
        assert!(zusatz.is_none());
    }

    /// Beide Seiten der Ereignisbrücke führen dieselbe Zeichenkette.
    ///
    /// Der Name steht in Rust und in TypeScript, und keine der beiden Seiten
    /// merkt es, wenn die andere ihn ändert — außer hier. Die Datei wird zur
    /// Übersetzungszeit eingelesen; verschiebt jemand sie, bricht der Bau.
    #[test]
    fn ereignisname_steht_auch_in_shell_ts() {
        let shell_ts = include_str!("../../src/shell.ts");
        assert!(
            shell_ts.contains(SERVICE_EXITED_EVENT),
            "„{SERVICE_EXITED_EVENT}“ fehlt in apps/desktop/src/shell.ts"
        );
    }

    #[test]
    fn startzeilen_sind_zwei_zeilen_in_dieser_reihenfolge() {
        let line = handshake_line("a".repeat(64).as_str(), "mmueller").expect("gültig");
        let mut parts = line.split('\n');
        assert_eq!(parts.next().unwrap().len(), 64);
        assert_eq!(parts.next().unwrap(), "mmueller");
        // Abschließendes Zeilenende: Der Leser wartet sonst auf den Rest.
        assert_eq!(parts.next().unwrap(), "");
        assert!(parts.next().is_none());
    }

    #[test]
    fn benutzername_mit_domaene_geht_unveraendert_durch() {
        let line = handshake_line(&"a".repeat(64), "KONTOSO\\mmueller").expect("gültig");
        assert!(line.ends_with("KONTOSO\\mmueller\n"));
    }

    #[test]
    fn leerer_benutzername_startet_den_dienst_nicht() {
        let error = handshake_line(&"a".repeat(64), "   ").unwrap_err();
        assert!(error.contains("nicht nachvollziehbar"));
    }

    #[test]
    fn steuerzeichen_im_namen_werden_abgewiesen() {
        // Der Fall, der das Protokoll dieser Röhre aufbräche: Der Dienst läse
        // `boese` als dritte Zeile — beziehungsweise gar nicht mehr das, was
        // die Hülle gemeint hat.
        let error = handshake_line(&"a".repeat(64), "mm\nboese").unwrap_err();
        assert!(error.contains("Steuerzeichen"));
        // Und die Meldung gibt den Wert nicht wieder.
        assert!(!error.contains("boese"));
    }

    #[test]
    fn zu_langer_name_wird_abgewiesen() {
        let error = handshake_line(&"a".repeat(64), &"x".repeat(MAX_USER_LENGTH + 1)).unwrap_err();
        assert!(error.contains("länger"));
    }
}
