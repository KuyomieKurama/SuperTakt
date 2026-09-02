//! Takt — der Windows-Benutzername (E-010, A-8.5, B-8.1, B-8.2).
//!
//! Das Feld `WindowsUser` geht in die Exportdatei und entscheidet dort mit
//! darüber, wem Arbeitszeit zugerechnet wird. Es ist damit keine Bequemlichkeit
//! und keine Anzeige, sondern ein Abrechnungswert.
//!
//! ## Was hier ausdrücklich **nicht** steht
//!
//! - `std::env::var("USERNAME")`. Umgebungsvariablen setzt, wer den Prozess
//!   startet: `set USERNAME=kollege.mueller && takt.exe`, und jede Exportzeile
//!   trägt einen fremden Namen (B-8.1).
//! - `USERPROFILE`, aus demselben Grund.
//! - Ein Unterprozess `whoami`. Der erbt die Umgebung **und** die `PATH`-Suche;
//!   ein untergeschobenes `whoami.exe` im Arbeitsverzeichnis wäre zusätzlich
//!   eine Codeausführung.
//!
//! Übrig bleibt der Betriebssystemaufruf. `GetUserNameW` liefert den nackten
//! Anmeldenamen, `GetUserNameExW(NameSamCompatible)` denselben Namen mit
//! Domäne davor. Beide werden gelesen und beide weitergereicht — welcher in
//! den Export geht, ist eine offene Frage an den Auftraggeber (B-8.2 Punkt 4)
//! und keine, die die Hülle still entscheidet.
//!
//! ## Warum die Aufrufe von Hand deklariert sind
//!
//! Zwei Funktionen aus zwei Systembibliotheken. Dafür eine Bindungskiste in die
//! Lieferkette zu holen, deren Modulpfade sich zwischen Fassungen verschieben,
//! wäre mehr Fläche als Gewinn — und dieser Rechner kann keine davon
//! übersetzen, um es zu merken.

use serde::Serialize;

/// Der Anmeldename, wie ihn das Betriebssystem kennt.
#[derive(Debug, Clone, Serialize)]
pub struct OsUser {
    /// Der nackte Anmeldename, etwa `mmueller`.
    pub name: String,
    /// Derselbe Name mit Domäne, etwa `KONTOSO\mmueller`.
    ///
    /// `None`, wenn das System ihn nicht liefert. Welcher der beiden Werte in
    /// `WindowsUser` gehört, ist offen (B-8.2 Punkt 4) — deshalb stehen hier
    /// beide und nicht einer.
    pub qualified_name: Option<String>,
    /// Woher der Wert kommt. Steht in der Oberfläche, damit nachvollziehbar
    /// bleibt, dass er nicht aus einer Einstellung stammt.
    pub source: &'static str,
    /// Ist der Wert vom Betriebssystem oder ein Notbehelf?
    pub trusted: bool,
}

#[cfg(windows)]
mod win {
    #[link(name = "advapi32")]
    extern "system" {
        /// `BOOL GetUserNameW(LPWSTR lpBuffer, LPDWORD pcbBuffer)`
        pub fn GetUserNameW(lp_buffer: *mut u16, pcb_buffer: *mut u32) -> i32;
    }

    #[link(name = "secur32")]
    extern "system" {
        /// `BOOLEAN GetUserNameExW(EXTENDED_NAME_FORMAT, LPWSTR, PULONG)`
        pub fn GetUserNameExW(name_format: i32, lp_name_buffer: *mut u16, n_size: *mut u32) -> u8;
    }

    /// `NameSamCompatible` aus `EXTENDED_NAME_FORMAT` — `DOMAENE\benutzer`.
    pub const NAME_SAM_COMPATIBLE: i32 = 2;
}

#[cfg(windows)]
fn bare_name() -> Option<String> {
    // `pcb_buffer` ist ein Ein- und Ausgabewert: hinein die Puffergröße in
    // Zeichen, heraus die Zahl der geschriebenen Zeichen **einschließlich** der
    // abschließenden Null.
    let mut size: u32 = 257;
    let mut buffer: Vec<u16> = vec![0; size as usize];
    // SICHERHEIT: `buffer` fasst `size` Zeichen; die Funktion schreibt nicht
    // darüber hinaus und meldet sonst einen Fehlschlag.
    let ok = unsafe { win::GetUserNameW(buffer.as_mut_ptr(), &mut size) };
    if ok == 0 {
        // Zweiter Versuch mit der Größe, die uns das System genannt hat.
        buffer = vec![0; size as usize];
        // SICHERHEIT: wie oben, mit der vom System verlangten Größe.
        let ok = unsafe { win::GetUserNameW(buffer.as_mut_ptr(), &mut size) };
        if ok == 0 {
            return None;
        }
    }
    let len = (size as usize).saturating_sub(1);
    let value = String::from_utf16_lossy(&buffer[..len.min(buffer.len())]);
    let trimmed = value.trim().to_string();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed)
    }
}

/// `DOMAENE\benutzer`. Auch die Rechtevergabe in `appdata.rs` benutzt ihn.
#[cfg(windows)]
pub fn sam_account_name() -> Option<String> {
    // Hier ist `n_size` hinein die Puffergröße in Zeichen und heraus die Zahl
    // der Zeichen **ohne** die abschließende Null.
    let mut size: u32 = 513;
    let mut buffer: Vec<u16> = vec![0; size as usize];
    // SICHERHEIT: `buffer` fasst `size` Zeichen.
    let ok = unsafe { win::GetUserNameExW(win::NAME_SAM_COMPATIBLE, buffer.as_mut_ptr(), &mut size) };
    if ok == 0 {
        buffer = vec![0; (size as usize).saturating_add(1)];
        // SICHERHEIT: wie oben, mit der vom System verlangten Größe.
        let ok = unsafe { win::GetUserNameExW(win::NAME_SAM_COMPATIBLE, buffer.as_mut_ptr(), &mut size) };
        if ok == 0 {
            return None;
        }
    }
    let value = String::from_utf16_lossy(&buffer[..(size as usize).min(buffer.len())]);
    let trimmed = value.trim().trim_end_matches('\0').trim().to_string();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed)
    }
}

#[cfg(windows)]
pub fn current() -> OsUser {
    match bare_name() {
        Some(name) => OsUser {
            name,
            qualified_name: sam_account_name(),
            source: "GetUserNameW",
            trusted: true,
        },
        None => OsUser {
            // Kein Rückfall auf `USERNAME`. Ein Wert, der von jedem setzbar
            // ist, wäre schlechter als gar keiner: Er sähe richtig aus.
            name: String::new(),
            qualified_name: None,
            source: "nicht ermittelbar",
            trusted: false,
        },
    }
}

#[cfg(unix)]
pub fn current() -> OsUser {
    use std::ffi::CStr;

    // Unter Unix gibt es kein `WindowsUser`. Der Wert dient hier nur der
    // Entwicklung und wird über `trusted` als solcher gekennzeichnet, damit die
    // Oberfläche ihn nicht wie einen Abrechnungswert behandelt.
    //
    // Auch hier bewusst nicht `$USER` oder `$LOGNAME`, sondern die
    // Passwortdatenbank über die tatsächliche Benutzerkennung des Prozesses —
    // damit die Umgehung aus B-8.1 auf keiner Plattform funktioniert.
    // SICHERHEIT: `geteuid` hat keine Vorbedingung; `getpwuid` gibt einen
    // Zeiger auf einen statischen Puffer der C-Bibliothek oder null zurück.
    let entry = unsafe { libc::getpwuid(libc::geteuid()) };
    let name = if entry.is_null() {
        String::new()
    } else {
        // SICHERHEIT: `pw_name` ist bei nicht-null `entry` ein gültiger,
        // nullterminierter Zeiger, der bis zum nächsten Aufruf lebt.
        unsafe { CStr::from_ptr((*entry).pw_name) }
            .to_string_lossy()
            .into_owned()
    };

    OsUser {
        name,
        qualified_name: None,
        source: "getpwuid(geteuid())",
        // Kein Windows, also kein Abrechnungswert.
        trusted: false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn liefert_einen_namen_und_nennt_die_quelle() {
        let user = current();
        assert!(!user.source.is_empty());
        // Auf einem Bausystem ohne Passworteintrag darf der Name leer sein.
        // Was nicht sein darf: ein Name, der aus der Umgebung stammt.
        if let Ok(from_env) = std::env::var("USER") {
            if !user.name.is_empty() && !from_env.is_empty() {
                // Sie dürfen übereinstimmen — sie tun es meistens. Der Test hält
                // nur fest, dass der Wert nicht **aus** der Variablen kommt:
                // eine gesetzte Variable ändert ihn nicht.
                std::env::set_var("USER", "jemand.anderes");
                let again = current();
                std::env::set_var("USER", from_env);
                assert_eq!(user.name, again.name);
            }
        }
    }
}
