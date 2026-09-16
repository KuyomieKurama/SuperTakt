//! User-scoped trust installation. Paths and executable arguments never come from IPC.
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};
use std::time::{Duration, Instant};
use tempfile::NamedTempFile;
use x509_parser::prelude::*;

const CERT_INVALID: &str = "Das Zertifikat ist ungültig oder kein lokales SuperTakt-Serverzertifikat.";
const TOOL_FAILED: &str =
    "Die Zertifikatseinrichtung ist fehlgeschlagen. Bitte Browser schließen und erneut prüfen.";
const MAX_OUTPUT: u64 = 131_072;

struct Certificate {
    pem: Vec<u8>,
    fingerprint: String,
    subject: String,
    issuer: String,
    valid_from: String,
    valid_until: String,
    valid_now: bool,
    valid_profile: bool,
}

fn inspect_certificate(bytes: &[u8]) -> Result<Certificate, String> {
    if bytes.len() > 32_768 {
        return Err(CERT_INVALID.into());
    }
    let (remaining, pem) = parse_x509_pem(bytes).map_err(|_| CERT_INVALID)?;
    if pem.label != "CERTIFICATE" || !remaining.iter().all(u8::is_ascii_whitespace) {
        return Err(CERT_INVALID.into());
    }
    let certificate = pem.parse_x509().map_err(|_| CERT_INVALID)?;
    let san = certificate.subject_alternative_name().map_err(|_| CERT_INVALID)?;
    let basic = certificate.basic_constraints().map_err(|_| CERT_INVALID)?;
    let eku = certificate.extended_key_usage().map_err(|_| CERT_INVALID)?;
    let names_valid = san.is_some_and(|san| {
        let names = &san.value.general_names;
        names.len() == 2
            && names
                .iter()
                .any(|name| matches!(name, GeneralName::DNSName("localhost")))
            && names
                .iter()
                .any(|name| matches!(name, GeneralName::IPAddress(ip) if *ip == [127, 0, 0, 1]))
    });
    let usage_valid = eku.is_some_and(|eku| {
        let usage = &eku.value;
        usage.server_auth
            && !usage.any
            && !usage.client_auth
            && !usage.code_signing
            && !usage.email_protection
            && !usage.time_stamping
            && !usage.ocsp_signing
            && usage.other.is_empty()
    });
    let valid_profile = names_valid
        && basic.is_some_and(|basic| !basic.value.ca)
        && usage_valid
        && certificate.subject() == certificate.issuer()
        && certificate.verify_signature(None).is_ok();
    let date = |value: ASN1Time| {
        value
            .to_datetime()
            .format(&::time::format_description::well_known::Rfc3339)
            .map_err(|_| CERT_INVALID.to_string())
    };
    Ok(Certificate {
        pem: bytes.to_vec(),
        fingerprint: format!("{:X}", Sha256::digest(&pem.contents)),
        subject: certificate.subject().to_string(),
        issuer: certificate.issuer().to_string(),
        valid_from: date(certificate.validity().not_before)?,
        valid_until: date(certificate.validity().not_after)?,
        valid_now: certificate.validity().is_valid(),
        valid_profile,
    })
}

// Drain stdout while the child runs so a full pipe cannot deadlock the timeout.
fn execute(tool: &Path, args: &[&str], input: &[u8], timeout: Duration) -> Result<Output, String> {
    let mut child = Command::new(tool)
        .args(args)
        .env("LC_ALL", "C")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|_| {
            format!(
                "{} konnte nicht gestartet werden. Bitte die Anwendung installieren.",
                tool.file_name().unwrap_or_default().to_string_lossy()
            )
        })?;
    let stdout = child.stdout.take().ok_or(TOOL_FAILED)?;
    let reader = std::thread::spawn(move || {
        let mut output = Vec::new();
        stdout
            .take(MAX_OUTPUT + 1)
            .read_to_end(&mut output)
            .map(|_| output)
    });
    let stdin = child.stdin.take().ok_or(TOOL_FAILED)?;
    let input = input.to_vec();
    // A tool waiting on a locked database must not block the parent while writing stdin.
    let writer = std::thread::spawn(move || {
        let mut stdin = stdin;
        stdin.write_all(&input)
    });
    let deadline = Instant::now() + timeout;
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break Ok(status),
            Ok(None) if Instant::now() < deadline => std::thread::sleep(Duration::from_millis(25)),
            _ => {
                let _ = child.kill();
                let _ = child.wait();
                break Err("Die Zertifikatsprüfung hat nicht rechtzeitig geantwortet. Bitte erneut prüfen.");
            }
        }
    };
    let written = writer.join().map_err(|_| TOOL_FAILED)?;
    let stdout = reader.join().map_err(|_| TOOL_FAILED)?.map_err(|_| TOOL_FAILED)?;
    if stdout.len() > MAX_OUTPUT as usize {
        return Err(TOOL_FAILED.into());
    }
    let status = status.map_err(str::to_string)?;
    if status.success() && written.is_err() {
        return Err(TOOL_FAILED.into());
    }
    Ok(Output {
        status,
        stdout,
        stderr: Vec::new(),
    })
}

fn snapshot(certificate: &Certificate) -> Result<NamedTempFile, String> {
    let mut file = NamedTempFile::new().map_err(|_| TOOL_FAILED)?;
    file.write_all(&certificate.pem).map_err(|_| TOOL_FAILED)?;
    file.flush().map_err(|_| TOOL_FAILED)?;
    Ok(file)
}

fn check_https(certificate: &Certificate, port: u16) -> &'static str {
    if !certificate.valid_now || !certificate.valid_profile {
        return "certificate_invalid";
    }
    let address = std::net::SocketAddr::from(([127, 0, 0, 1], port));
    if std::net::TcpStream::connect_timeout(&address, Duration::from_secs(2)).is_err() {
        return "unreachable";
    }
    let Ok(file) = snapshot(certificate) else {
        return "tls_failed";
    };
    let address = address.to_string();
    let Some(path) = file.path().to_str() else {
        return "tls_failed";
    };
    // Normal chain, validity and hostname verification against the confirmed certificate.
    // Browser-store installation is verified separately, never inferred from this connection.
    let output = execute(
        Path::new("/usr/bin/openssl"),
        &[
            "s_client",
            "-connect",
            &address,
            "-servername",
            "localhost",
            "-verify_return_error",
            "-verify_hostname",
            "localhost",
            "-CAfile",
            path,
            "-showcerts",
            "-ign_eof",
        ],
        b"GET /index.html HTTP/1.1\r\nHost: localhost:17844\r\nConnection: close\r\n\r\n",
        Duration::from_secs(8),
    );
    let Ok(output) = output else {
        return "tls_failed";
    };
    let text = String::from_utf8_lossy(&output.stdout);
    if let Some(start) = text.find("-----BEGIN CERTIFICATE-----") {
        if let Ok((_, pem)) = parse_x509_pem(text[start..].as_bytes()) {
            if format!("{:X}", Sha256::digest(&pem.contents)) != certificate.fingerprint {
                return "certificate_mismatch";
            }
        } else {
            return "tls_failed";
        }
    } else {
        return "tls_failed";
    }
    if !output.status.success() {
        return "tls_failed";
    }
    if text
        .lines()
        .any(|line| line.starts_with("HTTP/1.1 200 ") || line.starts_with("HTTP/1.0 200 "))
    {
        "ready"
    } else {
        "page_missing"
    }
}

#[derive(Clone)]
struct BrowserStore {
    path: PathBuf,
    kind: &'static str,
}

fn browser_stores(home: &Path) -> Vec<BrowserStore> {
    let legacy = home.join(".pki/nssdb");
    let shared = if legacy.is_dir() {
        legacy
    } else {
        home.join(".local/share/pki/nssdb")
    };
    let mut stores = vec![BrowserStore {
        path: shared,
        kind: "chromium",
    }];
    // Only existing Firefox profiles are included; never initialize a new Firefox profile.
    for root in [
        home.join(".mozilla/firefox"),
        home.join(".config/mozilla/firefox"),
        home.join(".var/app/org.mozilla.firefox/.mozilla/firefox"),
    ] {
        if let Ok(entries) = fs::read_dir(root) {
            let mut profiles: Vec<PathBuf> = entries
                .filter_map(Result::ok)
                .map(|entry| entry.path())
                .filter(|path| path.join("cert9.db").is_file())
                .collect();
            profiles.sort();
            stores.extend(profiles.into_iter().map(|path| BrowserStore {
                path,
                kind: "firefox",
            }));
        }
    }
    stores
}

fn nss_installed(tool: &Path, store: &BrowserStore, certificate: &Certificate) -> bool {
    let database = format!("sql:{}", store.path.display());
    let nickname = format!("SuperTakt localhost {}", certificate.fingerprint);
    let Ok(output) = execute(
        tool,
        &["-L", "-d", &database, "-n", &nickname, "-a"],
        &[],
        Duration::from_secs(5),
    ) else {
        return false;
    };
    if !output.status.success() {
        return false;
    }
    let Ok(installed) = inspect_certificate(&output.stdout) else {
        return false;
    };
    if installed.fingerprint != certificate.fingerprint {
        return false;
    }
    let Ok(list) = execute(tool, &["-L", "-d", &database], &[], Duration::from_secs(5)) else {
        return false;
    };
    list.status.success()
        && String::from_utf8_lossy(&list.stdout).lines().any(|line| {
            line.strip_prefix(&nickname).is_some_and(|flags| {
                flags
                    .trim()
                    .split(',')
                    .next()
                    .is_some_and(|ssl| ssl.contains('P'))
            })
        })
}

fn install_nss(tool: &Path, store: &BrowserStore, certificate: &Certificate) -> Result<(), String> {
    use std::os::unix::fs::DirBuilderExt;
    if nss_installed(tool, store, certificate) {
        return Ok(());
    }
    let database = format!("sql:{}", store.path.display());
    if !store.path.join("cert9.db").is_file() {
        // Missing shared database may be initialized only during the confirmed write command.
        fs::DirBuilder::new()
            .recursive(true)
            .mode(0o700)
            .create(&store.path)
            .map_err(|_| TOOL_FAILED)?;
        let output = execute(
            tool,
            &["-N", "-d", &database, "--empty-password"],
            &[],
            Duration::from_secs(5),
        )?;
        if !output.status.success() {
            return Err(TOOL_FAILED.into());
        }
    }
    let nickname = format!("SuperTakt localhost {}", certificate.fingerprint);
    // P trusts this server certificate, not a certificate authority. Feed the checked bytes via stdin.
    let output = execute(
        tool,
        &["-A", "-d", &database, "-n", &nickname, "-t", "P,,", "-a"],
        &certificate.pem,
        Duration::from_secs(5),
    )?;
    if !output.status.success() || !nss_installed(tool, store, certificate) {
        return Err(TOOL_FAILED.into());
    }
    Ok(())
}

#[cfg(target_os = "linux")]
fn trust_stores(home: &Path, certificate: &Certificate, install: bool) -> Result<(Vec<Value>, bool), String> {
    let tool = Path::new("/usr/bin/certutil");
    let mut failed = false;
    let stores = browser_stores(home)
        .iter()
        .map(|store| {
            if install && install_nss(tool, store, certificate).is_err() {
                failed = true;
            }
            json!({ "kind": store.kind, "installed": nss_installed(tool, store, certificate) })
        })
        .collect();
    Ok((stores, failed))
}

#[cfg(target_os = "macos")]
fn trust_stores(
    _home: &Path,
    certificate: &Certificate,
    install: bool,
) -> Result<(Vec<Value>, bool), String> {
    let file = snapshot(certificate)?;
    let path = file.path().to_str().ok_or(TOOL_FAILED)?;
    let security = Path::new("/usr/bin/security");
    let keychain = execute(
        security,
        &["default-keychain", "-d", "user"],
        &[],
        Duration::from_secs(5),
    )?;
    if !keychain.status.success() {
        return Err("Der Benutzerschlüsselbund ist nicht verfügbar.".into());
    }
    let keychain = String::from_utf8_lossy(&keychain.stdout)
        .trim()
        .trim_matches('"')
        .to_string();
    if !Path::new(&keychain).is_absolute() {
        return Err(TOOL_FAILED.into());
    }
    let failed = install
        && !execute(
            security,
            &[
                "add-trusted-cert",
                "-r",
                "trustRoot",
                "-p",
                "ssl",
                "-s",
                "localhost",
                "-k",
                &keychain,
                path,
            ],
            &[],
            Duration::from_secs(180),
        )?
        .status
        .success();
    let verified = execute(
        security,
        &[
            "verify-cert",
            "-c",
            path,
            "-p",
            "ssl",
            "-s",
            "localhost",
            "-k",
            &keychain,
        ],
        &[],
        Duration::from_secs(10),
    )?;
    Ok((
        vec![json!({"kind": "macos", "installed": verified.status.success()})],
        failed,
    ))
}

fn run_for_home(path: PathBuf, fingerprint: Option<String>, home: &Path, port: u16) -> Result<Value, String> {
    let mut bytes = Vec::new();
    fs::File::open(path)
        .and_then(|file| file.take(32_769).read_to_end(&mut bytes))
        .map_err(|_| {
            "Das lokale Zertifikat fehlt. Bitte SuperTakt mit dem Outlook-Add-in-Bündel neu starten."
        })?;
    let certificate = inspect_certificate(&bytes)?;
    if let Some(expected) = &fingerprint {
        if expected != &certificate.fingerprint {
            return Err("Das Zertifikat hat sich geändert. Bitte erneut prüfen und den neuen Fingerabdruck bestätigen.".into());
        }
        if !certificate.valid_now || !certificate.valid_profile {
            return Err(CERT_INVALID.into());
        }
    }
    let (stores, failed) = trust_stores(home, &certificate, fingerprint.is_some())?;
    let installed = !stores.is_empty() && stores.iter().all(|store| store["installed"] == true);
    Ok(
        json!({ "supported": true, "fingerprint": certificate.fingerprint, "subject": certificate.subject,
        "issuer": certificate.issuer, "validFrom": certificate.valid_from, "validUntil": certificate.valid_until,
        "validProfile": certificate.valid_profile, "validNow": certificate.valid_now, "installed": installed,
        "https": check_https(&certificate, port), "trustScope": if cfg!(target_os = "linux") { "linux_nss" } else { "macos_user" },
        "trustStores": stores, "installFailed": failed,
        "toolsAvailable": Path::new("/usr/bin/openssl").is_file() && (!cfg!(target_os = "linux") || Path::new("/usr/bin/certutil").is_file()) }),
    )
}

pub(super) fn run(path: PathBuf, fingerprint: Option<String>) -> Result<Value, String> {
    static OPERATION: std::sync::Mutex<()> = std::sync::Mutex::new(());
    let _guard = OPERATION.lock().map_err(|_| TOOL_FAILED)?;
    let home = std::env::var_os("HOME")
        .map(PathBuf::from)
        .filter(|path| path.is_absolute())
        .ok_or("Das Benutzerverzeichnis ist nicht verfügbar.")?;
    run_for_home(path, fingerprint, &home, 17844)
}

#[cfg(all(test, target_os = "linux"))]
mod tests {
    use super::*;
    use std::io::BufRead;
    use std::process::Child;
    use tempfile::{tempdir, TempDir};

    struct Fixture {
        directory: TempDir,
        certificate: Certificate,
    }
    impl Fixture {
        fn new(ca: bool, names: &str) -> Self {
            let directory = tempdir().unwrap();
            let cert = directory.path().join("cert.pem");
            let key = directory.path().join("key.pem");
            let result = execute(
                Path::new("/usr/bin/openssl"),
                &[
                    "req",
                    "-x509",
                    "-newkey",
                    "rsa:2048",
                    "-nodes",
                    "-keyout",
                    key.to_str().unwrap(),
                    "-out",
                    cert.to_str().unwrap(),
                    "-days",
                    "1",
                    "-subj",
                    "/O=Takt/CN=localhost",
                    "-addext",
                    if ca {
                        "basicConstraints=critical,CA:TRUE"
                    } else {
                        "basicConstraints=critical,CA:FALSE"
                    },
                    "-addext",
                    "extendedKeyUsage=serverAuth",
                    "-addext",
                    names,
                ],
                &[],
                Duration::from_secs(10),
            )
            .unwrap();
            assert!(result.status.success());
            let certificate = inspect_certificate(&fs::read(cert).unwrap()).unwrap();
            Self {
                directory,
                certificate,
            }
        }
        fn local() -> Self {
            Self::new(false, "subjectAltName=DNS:localhost,IP:127.0.0.1")
        }
        fn path(&self) -> PathBuf {
            self.directory.path().join("cert.pem")
        }
    }
    struct Server(Child, u16);
    impl Server {
        fn start(fixture: &Fixture, status: u16) -> Self {
            // Node provides a real local HTTPS endpoint. Arguments are data, never shell text.
            let script = "const fs = require('node:fs'); const https = require('node:https'); const server = https.createServer({ cert:fs.readFileSync(process.argv[1]), key:fs.readFileSync(process.argv[2]) }, (_req,res)=>{res.writeHead(Number(process.argv[3]));res.end('local test');}); server.listen(0,'127.0.0.1',()=>process.stdout.write(String(server.address().port)+'\\n'));";
            let mut child = Command::new("node")
                .args(["-e", script])
                .arg(fixture.path())
                .arg(fixture.directory.path().join("key.pem"))
                .arg(status.to_string())
                .stdin(Stdio::null())
                .stdout(Stdio::piped())
                .stderr(Stdio::null())
                .spawn()
                .unwrap();
            let mut line = String::new();
            std::io::BufReader::new(child.stdout.take().unwrap())
                .read_line(&mut line)
                .unwrap();
            Self(child, line.trim().parse().unwrap())
        }
    }
    impl Drop for Server {
        fn drop(&mut self) {
            let _ = self.0.kill();
            let _ = self.0.wait();
        }
    }

    #[test]
    fn native_linux_flow_installs_only_after_confirmation_and_verifies_tls() {
        let fixture = Fixture::local();
        let home = tempdir().unwrap();
        let server = Server::start(&fixture, 200);
        let initial = run_for_home(fixture.path(), None, home.path(), server.1).unwrap();
        assert_eq!(initial["supported"], true);
        assert_eq!(initial["installed"], false);
        assert_eq!(initial["https"], "ready");
        assert!(
            !home.path().join(".local").exists(),
            "Inspection must be read-only"
        );
        let wrong = run_for_home(fixture.path(), Some("AB".repeat(32)), home.path(), server.1);
        assert!(wrong.unwrap_err().contains("geändert"));
        assert!(!home.path().join(".local").exists());
        let trusted = run_for_home(
            fixture.path(),
            Some(fixture.certificate.fingerprint.clone()),
            home.path(),
            server.1,
        )
        .unwrap();
        assert_eq!(trusted["installed"], true, "{trusted}");
        assert_eq!(trusted["installFailed"], false);
        assert_eq!(trusted["https"], "ready");
        let repeated = run_for_home(
            fixture.path(),
            Some(fixture.certificate.fingerprint.clone()),
            home.path(),
            server.1,
        )
        .unwrap();
        assert_eq!(repeated, trusted);
        let store = &browser_stores(home.path())[0];
        let list = execute(
            Path::new("/usr/bin/certutil"),
            &["-L", "-d", &format!("sql:{}", store.path.display())],
            &[],
            Duration::from_secs(5),
        )
        .unwrap();
        let listing = String::from_utf8_lossy(&list.stdout);
        assert_eq!(listing.matches("SuperTakt localhost").count(), 1);
        assert!(listing.contains("P,,"));
        assert!(!listing.contains("C,,"));
    }

    #[test]
    fn rejects_ca_extra_names_and_certificate_bundles_before_import() {
        for fixture in [
            Fixture::new(true, "subjectAltName=DNS:localhost,IP:127.0.0.1"),
            Fixture::new(
                false,
                "subjectAltName=DNS:localhost,IP:127.0.0.1,DNS:example.test",
            ),
        ] {
            assert!(!fixture.certificate.valid_profile);
            let home = tempdir().unwrap();
            assert!(run_for_home(
                fixture.path(),
                Some(fixture.certificate.fingerprint.clone()),
                home.path(),
                1
            )
            .is_err());
            assert_eq!(fs::read_dir(home.path()).unwrap().count(), 0);
        }
        let fixture = Fixture::local();
        let mut bundle = fixture.certificate.pem.clone();
        bundle.extend_from_slice(&fixture.certificate.pem);
        assert!(inspect_certificate(&bundle).is_err());
        assert!(inspect_certificate(&vec![b'x'; 32_769]).is_err());
    }

    #[test]
    fn stored_trust_does_not_hide_https_failures_or_a_different_certificate() {
        let fixture = Fixture::local();
        let server = Server::start(&fixture, 404);
        assert_eq!(check_https(&fixture.certificate, server.1), "page_missing");
        let different = Fixture::local();
        assert_ne!(check_https(&different.certificate, server.1), "ready");
        drop(server);
        let socket = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let port = socket.local_addr().unwrap().port();
        drop(socket);
        assert_eq!(check_https(&fixture.certificate, port), "unreachable");
    }

    #[test]
    fn selects_existing_legacy_nss_and_existing_firefox_profiles() {
        let home = tempdir().unwrap();
        fs::create_dir_all(home.path().join(".pki/nssdb")).unwrap();
        let firefox = home.path().join(".mozilla/firefox/example.default");
        fs::create_dir_all(&firefox).unwrap();
        fs::write(firefox.join("cert9.db"), []).unwrap();
        let stores = browser_stores(home.path());
        assert_eq!(stores.len(), 2);
        assert_eq!(stores[0].path, home.path().join(".pki/nssdb"));
        assert_eq!(stores[1].path, firefox);
    }

    #[test]
    fn partial_store_failure_is_reported_and_successful_stores_survive() {
        let fixture = Fixture::local();
        let home = tempdir().unwrap();
        let firefox = home.path().join(".mozilla/firefox/broken.default");
        fs::create_dir_all(&firefox).unwrap();
        fs::write(firefox.join("cert9.db"), b"not a database").unwrap();
        let result = run_for_home(
            fixture.path(),
            Some(fixture.certificate.fingerprint.clone()),
            home.path(),
            1,
        )
        .unwrap();
        assert_eq!(result["installed"], false);
        assert_eq!(result["installFailed"], true);
        assert_eq!(result["trustStores"][0]["installed"], true);
        assert_eq!(result["trustStores"][1]["installed"], false);
    }

    #[test]
    fn tool_timeout_is_bounded() {
        let start = Instant::now();
        assert!(execute(
            Path::new("/usr/bin/sleep"),
            &["10"],
            &vec![b'x'; MAX_OUTPUT as usize],
            Duration::from_millis(50)
        )
        .is_err());
        assert!(start.elapsed() < Duration::from_secs(2));
    }
}
