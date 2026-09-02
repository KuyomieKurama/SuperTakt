//! Takt — Ablageort der Anwendungsdaten und seine Rechte (E-018, B-7.1, B-7.2, R-13).
//!
//! `%LOCALAPPDATA%\Takt\` unter Windows, `~/.local/share/takt/` sonst.
//! **Ausdrücklich nicht `%APPDATA%`.** Ein Roaming-Profil kopiert dieses
//! Verzeichnis beim Abmelden auf einen Dateiserver: Die Kundendatenbank
//! verlässt den Rechner (gegen E-001), und unabhängig synchronisierte
//! WAL-Dateien beschädigen SQLite.
//!
//! ## Warum die Regel hier ein zweites Mal steht
//!
//! Dieselbe Regel steht in `apps/local-api/src/access/paths.ts`. Das ist eine
//! bewusste Dopplung und keine Nachlässigkeit: Die Hülle muss das Verzeichnis
//! **anlegen und seine Rechte setzen, bevor** der Sidecar startet — unter
//! Windows trägt die ACL die Grenze, und `chmod` aus Node richtet dort nichts
//! aus (T-011, Risiko 2). Der Sidecar wiederum darf keinen Pfad als Argument
//! annehmen (B-1.6 Punkt 1), also kann die Hülle ihm den ihren nicht mitteilen.
//! Beide Seiten müssen die Regel deshalb kennen.
//!
//! Die Dopplung ist die Stelle, an der etwas auseinanderlaufen kann. Deshalb
//! ist die Auflösung hier eine reine Funktion mit Tests, die dieselben Fälle
//! abdecken wie die TypeScript-Seite. Wer eine Seite ändert, ändert beide.
//!
//! **Ausdrücklich nicht benutzt:** `app.path().app_local_data_dir()` von Tauri.
//! Das liefert `%LOCALAPPDATA%\de.takt.app` — die Kennung des Bündels, nicht
//! `Takt`. Der Sidecar würde dann in ein anderes Verzeichnis schreiben als das,
//! dessen Rechte die Hülle gesetzt hat, und niemandem fiele es auf.

use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

use serde::Serialize;

/// Warum sich kein Verzeichnis bestimmen ließ.
#[derive(Debug, PartialEq, Eq)]
pub enum ResolveError {
    /// `%LOCALAPPDATA%` fehlt. Kein Rückfall auf `%APPDATA%` — das wäre R-13.
    LocalAppDataMissing,
    /// Kein Benutzerverzeichnis.
    HomeMissing,
}

impl ResolveError {
    pub fn message(&self) -> &'static str {
        match self {
            ResolveError::LocalAppDataMissing => {
                "Das lokale Anwendungsdatenverzeichnis (%LOCALAPPDATA%) ist nicht gesetzt. \
                 Takt weicht bewusst nicht auf das Roaming-Profil aus, weil die Kundendatenbank \
                 dort auf einen Dateiserver kopiert und über die WAL-Dateien beschädigt würde."
            }
            ResolveError::HomeMissing => "Kein Benutzerverzeichnis gefunden.",
        }
    }
}

/// Was die Umgebung liefert. Als Argument, damit die Regel prüfbar bleibt.
pub struct Environment {
    pub windows: bool,
    pub vars: BTreeMap<String, String>,
    pub home: Option<PathBuf>,
}

/// Die Regel aus E-018. Rein, ohne Dateisystemzugriff.
pub fn resolve(environment: &Environment) -> Result<PathBuf, ResolveError> {
    fn non_empty<'a>(environment: &'a Environment, key: &str) -> Option<&'a str> {
        environment
            .vars
            .get(key)
            .map(|value| value.trim())
            .filter(|value| !value.is_empty())
    }

    if environment.windows {
        // Genau eine Quelle. Fehlt sie, ist das ein Fehler und keine
        // Gelegenheit, ins Roaming-Profil auszuweichen.
        return match non_empty(environment, "LOCALAPPDATA") {
            Some(local) => Ok(Path::new(local).join("Takt")),
            None => Err(ResolveError::LocalAppDataMissing),
        };
    }

    if let Some(xdg) = non_empty(environment, "XDG_DATA_HOME") {
        return Ok(Path::new(xdg).join("takt"));
    }

    match environment.home.as_ref() {
        Some(home) if !home.as_os_str().is_empty() => Ok(home.join(".local").join("share").join("takt")),
        _ => Err(ResolveError::HomeMissing),
    }
}

/// Die Umgebung dieses Prozesses.
pub fn current_environment() -> Environment {
    let mut vars = BTreeMap::new();
    for key in ["LOCALAPPDATA", "XDG_DATA_HOME"] {
        if let Ok(value) = std::env::var(key) {
            vars.insert(key.to_string(), value);
        }
    }
    Environment {
        windows: cfg!(windows),
        vars,
        home: home_dir(),
    }
}

#[cfg(unix)]
fn home_dir() -> Option<PathBuf> {
    // `$HOME` ist unter Unix die Konvention und wird von der Anmeldung gesetzt.
    // Anders als beim Benutzernamen (B-8.1) hängt hier keine Abrechnung dran:
    // Wer `$HOME` setzt, wählt sein eigenes Datenverzeichnis, und das darf er.
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .filter(|p| !p.as_os_str().is_empty())
}

#[cfg(windows)]
fn home_dir() -> Option<PathBuf> {
    // Unter Windows wird dieser Zweig nie erreicht: `resolve` kehrt vorher über
    // `%LOCALAPPDATA%` zurück oder bricht ab.
    None
}

/// Was beim Vorbereiten des Verzeichnisses herausgekommen ist.
#[derive(Debug, Serialize, Clone)]
pub struct DirectoryReport {
    /// Der Pfad. Kein Geheimnis — er darf in Meldungen stehen.
    pub path: String,
    /// Konnten die Rechte eng gesetzt werden?
    pub permissions_applied: bool,
    /// Was genau geschehen ist. Für die Anzeige in den Einstellungen.
    pub permissions_detail: String,
    /// Liegt der Pfad auf einem Netzlaufwerk oder in einem Synchronisierungsordner?
    ///
    /// Klartext: **was** gefunden wurde, in Worten, die ein Anwender versteht.
    /// Was der Befund bedeutet und was zu tun ist, sagt die Oberfläche
    /// (`ShellStatus.tsx`) — sie weiß, wie viel Platz sie hat, und muss den Satz
    /// nicht in eine Zeile zwängen.
    pub sync_warning: Option<String>,
    /// Der technische Zusatz zum selben Befund — das, was man weitergibt.
    ///
    /// Steht **neben** der Warnung und nie an ihrer Stelle (T-020b). Vorher
    /// stand „Kopierte WAL-Dateien beschädigen die Datenbank" als erster Satz
    /// auf dem Bildschirm: für die Systembetreuung genau richtig, für den
    /// Anwender ein Fremdwort im Moment seiner größten Ratlosigkeit.
    ///
    /// Immer `Some`, wenn `sync_warning` `Some` ist. Zwei Felder statt eines
    /// Tupels, weil beide einzeln in die Oberfläche gehen und dort an
    /// verschiedenen Stellen stehen.
    pub sync_detail: Option<String>,
}

/// Legt das Verzeichnis an und zieht die Rechte eng (B-7.2).
///
/// Die Reihenfolge ist Inhalt: Erst anlegen, dann Rechte setzen, **dann** den
/// Sidecar starten. Alles, was er danach hineinschreibt — Datenbank,
/// WAL-Dateien, Tokendatei —, erbt die engen Rechte. Umgekehrt wäre es ein
/// Wettlauf, in dem die Datenbank kurz offen liegt.
pub fn prepare(dir: &Path) -> Result<DirectoryReport, std::io::Error> {
    fs::create_dir_all(dir)?;

    let (permissions_applied, permissions_detail) = apply_permissions(dir);

    let finding = sync_warning(dir);

    Ok(DirectoryReport {
        path: dir.display().to_string(),
        permissions_applied,
        permissions_detail,
        sync_warning: finding.as_ref().map(|f| f.warning.clone()),
        sync_detail: finding.map(|f| f.detail),
    })
}

#[cfg(unix)]
fn apply_permissions(dir: &Path) -> (bool, String) {
    use std::os::unix::fs::PermissionsExt;

    // Die Rechte gehören auf das **Verzeichnis**, nicht nur auf die Datei:
    // SQLite erzeugt `-wal` und `-shm` selbst, und die erben von hier. Ein
    // `chmod` allein auf der Hauptdatei ist der häufige, lautlose Fehler aus
    // B-7.2 Punkt 1.
    match fs::set_permissions(dir, fs::Permissions::from_mode(0o700)) {
        Ok(()) => (true, "Verzeichnisrechte auf 0700 gesetzt.".to_string()),
        Err(error) => (
            false,
            format!("Verzeichnisrechte konnten nicht auf 0700 gesetzt werden: {error}"),
        ),
    }
}

#[cfg(windows)]
fn apply_permissions(dir: &Path) -> (bool, String) {
    use std::process::Command;

    // Unter Windows trägt die ACL die Grenze; `chmod` und `fs::stat` liefern
    // dort keinen brauchbaren POSIX-Modus. Ohne diesen Schritt liest auf einem
    // Terminalserver jeder Kollege Tokendatei und Datenbank (T-011, Risiko 2).
    //
    // `icacls` wird mit **absolutem Pfad** aufgerufen und nicht über die
    // `PATH`-Suche. Ein untergeschobenes `icacls.exe` im Arbeitsverzeichnis
    // wäre sonst eine Codeausführung — derselbe Grund, aus dem B-8.1 den
    // Unterprozess `whoami` ablehnt.
    let system_root = match std::env::var("SystemRoot") {
        Ok(value) if !value.trim().is_empty() => value,
        _ => {
            return (
                false,
                "%SystemRoot% ist nicht gesetzt; die Zugriffsrechte wurden nicht gesetzt.".to_string(),
            )
        }
    };
    let icacls = Path::new(&system_root).join("System32").join("icacls.exe");
    if !icacls.exists() {
        return (
            false,
            format!(
                "{} wurde nicht gefunden; die Zugriffsrechte wurden nicht gesetzt.",
                icacls.display()
            ),
        );
    }

    // Nur zwei Berechtigte: das Konto, unter dem Takt läuft, und `SYSTEM`.
    // `SYSTEM` steht als feste SID (`*S-1-5-18`) da, nicht als Name — der Name
    // ist in einem deutschen Windows „SYSTEM", in anderen Sprachfassungen
    // nicht, und eine übersetzte Regel greift ins Leere.
    let account = match crate::identity::sam_account_name() {
        Some(name) => name,
        None => {
            return (
                false,
                "Der Anmeldename ließ sich nicht ermitteln; die Zugriffsrechte wurden nicht gesetzt."
                    .to_string(),
            )
        }
    };

    let output = Command::new(&icacls)
        .arg(dir.as_os_str())
        .arg("/inheritance:r")
        .arg("/grant:r")
        .arg("*S-1-5-18:(OI)(CI)F")
        .arg("/grant:r")
        .arg(format!("{account}:(OI)(CI)F"))
        .arg("/Q")
        .output();

    match output {
        Ok(result) if result.status.success() => (
            true,
            "Vererbung entfernt; Vollzugriff nur für dieses Konto und SYSTEM.".to_string(),
        ),
        Ok(result) => (
            false,
            format!(
                "icacls endete mit {}. Die Zugriffsrechte sind unverändert.",
                result.status
            ),
        ),
        Err(error) => (false, format!("icacls ließ sich nicht starten: {error}")),
    }
}

/// Der Befund zu einem Ablageort, zweigeteilt (T-020b).
///
/// Zwei Sätze für zwei Leser, und beide werden gebraucht: Der Anwender will
/// wissen, was los ist; die Systembetreuung will den Satz, mit dem sie etwas
/// anfangen kann. Ein einziger Satz für beide wird entweder zu vage oder zu
/// fachlich — vorher war er zu fachlich.
pub struct SyncFinding {
    /// Klartext. Nennt den Ordner und was an ihm auffällt, sonst nichts.
    pub warning: String,
    /// Der technische Zusatz. Steht in der Oberfläche daneben, nicht davor.
    pub detail: String,
}

/// B-7.1 Punkt 2 — liegt der Pfad dort, wo er nicht liegen sollte?
///
/// Kein Abbruch, nur eine Warnung: Der Benutzer kann in einer Umgebung
/// arbeiten, in der wir uns irren, und Takt ist nicht der Ort, an dem er sich
/// dafür rechtfertigen muss. Sichtbar muss es trotzdem sein.
///
/// **Die Sätze sind Oberflächentext.** Sie gehen unverändert auf den Bildschirm
/// (`ShellStatus.tsx`), und die Oberfläche kürzt sie nicht. Was sie ergänzt,
/// ist die Bedeutung und der Weg heraus — beides hängt nicht vom Befund ab und
/// steht deshalb dort und nicht hier.
fn sync_warning(dir: &Path) -> Option<SyncFinding> {
    let text = dir.display().to_string();

    if text.starts_with("\\\\") {
        return Some(SyncFinding {
            warning: format!(
                "Der Datenordner von Takt liegt auf einer Freigabe im Netz und nicht auf \
                 einer Festplatte dieses Rechners: {text}"
            ),
            detail: "Netzfreigabe über einen UNC-Pfad. Die Datenbank von Takt kann ihre \
                     Dateien dort nicht zuverlässig sperren; greifen zwei Programme \
                     gleichzeitig zu, wird sie beschädigt."
                .to_string(),
        });
    }

    #[cfg(windows)]
    if drive_is_remote(dir) {
        return Some(SyncFinding {
            warning: format!(
                "Der Datenordner von Takt liegt auf einem Netzlaufwerk und nicht auf einer \
                 Festplatte dieses Rechners: {text}"
            ),
            detail: "Das Laufwerk meldet sich als Netzlaufwerk (DRIVE_REMOTE). Die Datenbank \
                     von Takt kann ihre Dateien dort nicht zuverlässig sperren; greifen zwei \
                     Programme gleichzeitig zu, wird sie beschädigt."
                .to_string(),
        });
    }

    // Namensprüfung, nicht Erkennung: Ein Synchronisierungsdienst gibt sich
    // nicht zu erkennen, aber sein Ordner heißt fast immer so.
    let lowered = text.to_lowercase();
    for marker in [
        "onedrive",
        "dropbox",
        "google drive",
        "googledrive",
        "nextcloud",
        "owncloud",
        "icloud",
        "sync.com",
        "seafile",
    ] {
        if lowered.contains(marker) {
            return Some(SyncFinding {
                warning: format!(
                    "Der Datenordner von Takt liegt in einem Ordner, der laufend an einen \
                     anderen Ort kopiert wird: {text}"
                ),
                detail: "Der Pfad trägt den Namen eines Synchronisierungsdienstes. Die \
                         Datenbank besteht aus mehreren Dateien, die zusammengehören; werden \
                         sie einzeln und zeitversetzt kopiert, wird die Datenbank beschädigt \
                         — und die kopierten Daten liegen danach außerhalb dieses Rechners."
                    .to_string(),
            });
        }
    }

    None
}

#[cfg(windows)]
fn drive_is_remote(dir: &Path) -> bool {
    use std::os::windows::ffi::OsStrExt;

    const DRIVE_REMOTE: u32 = 4;

    #[link(name = "kernel32")]
    extern "system" {
        fn GetDriveTypeW(lp_root_path_name: *const u16) -> u32;
    }

    let text = dir.display().to_string();
    let bytes = text.as_bytes();
    if bytes.len() < 2 || bytes[1] != b':' {
        return false;
    }
    let root = format!("{}:\\", bytes[0] as char);
    let wide: Vec<u16> = std::ffi::OsStr::new(&root)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    // SICHERHEIT: `wide` ist nullterminiert und lebt über den Aufruf hinaus.
    unsafe { GetDriveTypeW(wide.as_ptr()) == DRIVE_REMOTE }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn env(windows: bool, pairs: &[(&str, &str)], home: Option<&str>) -> Environment {
        Environment {
            windows,
            vars: pairs
                .iter()
                .map(|(key, value)| ((*key).to_string(), (*value).to_string()))
                .collect(),
            home: home.map(PathBuf::from),
        }
    }

    #[test]
    fn windows_nimmt_localappdata() {
        let resolved = resolve(&env(
            true,
            &[("LOCALAPPDATA", "C:\\Users\\mm\\AppData\\Local")],
            None,
        ));
        assert_eq!(
            resolved.unwrap(),
            Path::new("C:\\Users\\mm\\AppData\\Local").join("Takt")
        );
    }

    #[test]
    fn windows_weicht_nicht_auf_roaming_aus() {
        // Der Kern von R-13: `%APPDATA%` ist gesetzt und wird trotzdem nicht
        // benutzt. Ein stiller Rückfall wäre genau der Schaden.
        let resolved = resolve(&env(
            true,
            &[("APPDATA", "C:\\Users\\mm\\AppData\\Roaming")],
            Some("C:\\Users\\mm"),
        ));
        assert_eq!(resolved.unwrap_err(), ResolveError::LocalAppDataMissing);
    }

    #[test]
    fn windows_behandelt_leere_variable_wie_fehlend() {
        let resolved = resolve(&env(true, &[("LOCALAPPDATA", "   ")], None));
        assert_eq!(resolved.unwrap_err(), ResolveError::LocalAppDataMissing);
    }

    #[test]
    fn unix_beachtet_xdg_data_home() {
        let resolved = resolve(&env(false, &[("XDG_DATA_HOME", "/tmp/daten")], Some("/home/mm")));
        assert_eq!(resolved.unwrap(), Path::new("/tmp/daten/takt"));
    }

    #[test]
    fn unix_faellt_auf_local_share_zurueck() {
        let resolved = resolve(&env(false, &[], Some("/home/mm")));
        assert_eq!(resolved.unwrap(), Path::new("/home/mm/.local/share/takt"));
    }

    #[test]
    fn unix_ohne_home_ist_ein_fehler() {
        assert_eq!(
            resolve(&env(false, &[], None)).unwrap_err(),
            ResolveError::HomeMissing
        );
    }

    #[test]
    fn unix_ignoriert_localappdata() {
        // Die Windows-Variable darf unter Unix nichts bewirken, auch wenn sie
        // gesetzt ist — sonst wandert der Pfad in einer Wine-Umgebung.
        let resolved = resolve(&env(false, &[("LOCALAPPDATA", "/irgendwo")], Some("/home/mm")));
        assert_eq!(resolved.unwrap(), Path::new("/home/mm/.local/share/takt"));
    }

    #[test]
    fn synchronisierungsordner_wird_gemeldet() {
        assert!(sync_warning(Path::new("/home/mm/OneDrive/takt")).is_some());
        assert!(sync_warning(Path::new("/home/mm/.local/share/takt")).is_none());
    }

    #[test]
    fn netzfreigabe_wird_gemeldet() {
        assert!(sync_warning(Path::new("\\\\server\\profile\\takt")).is_some());
    }

    /// T-020b — der Satz, den der Anwender zuerst liest, spricht keine Fachsprache.
    ///
    /// Die Liste ist die aus dem Auftrag: Was hier steht, hat vorher im ersten
    /// Satz gestanden und gehört jetzt in `detail`. Der Test prüft die Trennung
    /// und nicht den Geschmack — er fällt, sobald jemand einen Fachbegriff
    /// zurück nach vorn schiebt.
    #[test]
    fn die_warnung_spricht_klartext_und_der_zusatz_traegt_die_fachsprache() {
        for pfad in ["/home/mm/OneDrive/takt", "\\\\server\\profile\\takt"] {
            let finding = sync_warning(Path::new(pfad)).expect("Befund erwartet");

            for begriff in ["WAL", "SQLite", "UNC", "DRIVE_REMOTE"] {
                assert!(
                    !finding.warning.contains(begriff),
                    "„{begriff}“ steht im Klartextsatz für {pfad}: {}",
                    finding.warning
                );
            }

            // Der Ordner gehört in den ersten Satz: Ohne ihn weiß der Benutzer
            // nicht, wovon die Rede ist.
            assert!(finding.warning.contains(pfad), "Pfad fehlt: {}", finding.warning);
            assert!(!finding.detail.is_empty(), "Zusatz fehlt für {pfad}");
        }
    }

    /// Der Zusatz ist genau dann da, wenn es eine Warnung gibt — beides kommt
    /// aus derselben Quelle und darf nicht auseinanderlaufen.
    #[test]
    fn ohne_befund_gibt_es_weder_warnung_noch_zusatz() {
        assert!(sync_warning(Path::new("/home/mm/.local/share/takt")).is_none());
    }
}
