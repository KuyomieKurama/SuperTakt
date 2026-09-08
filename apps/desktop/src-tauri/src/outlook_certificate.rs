//! A-23: two narrow desktop commands, no caller-controlled file or URL.
use crate::Startup;

fn fingerprint_is_valid(value: &str) -> bool {
    value.len() == 64 && value.bytes().all(|b| b.is_ascii_digit() || (b'A'..=b'F').contains(&b))
}

#[cfg(windows)]
fn run(path: std::path::PathBuf, fingerprint: Option<String>) -> Result<serde_json::Value, String> {
    use std::io::Write;
    use std::os::windows::process::CommandExt;
    use std::process::{Command, Stdio};
    use std::time::{Duration, Instant};

    let system_root = std::env::var_os("SystemRoot")
        .map(std::path::PathBuf::from)
        .filter(|p| p.is_absolute())
        .ok_or("Windows PowerShell wurde nicht gefunden.")?;
    let executable = system_root.join("System32/WindowsPowerShell/v1.0/powershell.exe");
    let input = serde_json::json!({
        "path": path,
        "action": if fingerprint.is_some() { "trust" } else { "inspect" },
        "fingerprint": fingerprint,
    });
    let mut child = Command::new(executable)
        .args(["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", include_str!("outlook_certificate.ps1")])
        .creation_flags(0x08000000) // CREATE_NO_WINDOW; no shell, no elevation.
        .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::null())
        .spawn().map_err(|_| "Die Zertifikatsprüfung konnte nicht gestartet werden.")?;
    let written = child.stdin.take().ok_or("Eingabe nicht verfügbar.")
        .and_then(|mut stdin| stdin.write_all(input.to_string().as_bytes()).map_err(|_| "Eingabe fehlgeschlagen."));
    if written.is_err() {
        let _ = child.kill();
        let _ = child.wait();
        return Err("Die Zertifikatsprüfung konnte nicht gestartet werden.".into());
    }
    let deadline = Instant::now() + Duration::from_secs(25);
    loop {
        match child.try_wait() {
            Ok(Some(_)) => break,
            Ok(None) if Instant::now() < deadline => std::thread::sleep(Duration::from_millis(50)),
            _ => {
                let _ = child.kill();
                let _ = child.wait();
                return Err("Die Zertifikatsprüfung hat nicht rechtzeitig geantwortet. Bitte den Zustand erneut prüfen.".into());
            }
        }
    }
    let output = child.wait_with_output().map_err(|_| "Die Zertifikatsprüfung ist fehlgeschlagen.")?;
    if !output.status.success() || output.stdout.len() > 16_384 {
        return Err("Die Zertifikatsprüfung ist fehlgeschlagen. Windows PowerShell muss zugelassen sein.".into());
    }
    let result: serde_json::Value = serde_json::from_slice(&output.stdout)
        .map_err(|_| "Die Zertifikatsprüfung hat keine lesbare Antwort geliefert.")?;
    if let Some(code) = result.get("error").and_then(|v| v.as_str()) {
        return Err(match code {
            "certificate_missing" => "Das lokale Zertifikat fehlt. Bitte SuperTakt mit installiertem Outlook-Add-in-Bündel neu starten.",
            "certificate_invalid" => "Das Zertifikat ist abgelaufen, noch nicht gültig oder kein lokales SuperTakt-Serverzertifikat.",
            "certificate_changed" => "Das Zertifikat hat sich geändert. Bitte erneut prüfen und den neuen Fingerabdruck bestätigen.",
            "trust_failed" => "Windows hat das Vertrauen nicht gespeichert. Bitte die Berechtigungen oder Unternehmensrichtlinien prüfen.",
            _ => "Die Zertifikatsprüfung ist fehlgeschlagen.",
        }.into());
    }
    Ok(result)
}

async fn execute(startup: tauri::State<'_, Startup>, fingerprint: Option<String>) -> Result<serde_json::Value, String> {
    #[cfg(windows)]
    {
        let path = startup.directory.as_ref()
            .map(|d| std::path::PathBuf::from(&d.path).join("taskpane-cert.pem"))
            .ok_or("Das Anwendungsdatenverzeichnis ist nicht verfügbar.")?;
        tauri::async_runtime::spawn_blocking(move || run(path, fingerprint)).await
            .map_err(|_| "Die Zertifikatsprüfung wurde unterbrochen.".to_string())?
    }
    #[cfg(not(windows))]
    {
        let _ = (startup, fingerprint);
        Ok(serde_json::json!({ "supported": false }))
    }
}

#[tauri::command]
pub async fn takt_outlook_certificate(startup: tauri::State<'_, Startup>) -> Result<serde_json::Value, String> {
    execute(startup, None).await
}

#[tauri::command]
pub async fn takt_trust_outlook_certificate(startup: tauri::State<'_, Startup>, fingerprint: String) -> Result<serde_json::Value, String> {
    if !fingerprint_is_valid(&fingerprint) {
        return Err("Der bestätigte Fingerabdruck ist ungültig.".into());
    }
    execute(startup, Some(fingerprint)).await
}

#[cfg(test)]
mod tests {
    use super::fingerprint_is_valid;
    #[test]
    fn only_a_complete_sha256_fingerprint_is_accepted() {
        assert!(fingerprint_is_valid(&"AB12".repeat(16)));
        for value in ["", &"A".repeat(63), &"A".repeat(65), &"ab12".repeat(16), &"G".repeat(64), "../taskpane-cert.pem"] {
            assert!(!fingerprint_is_valid(value));
        }
    }
}
