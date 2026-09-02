//! Takt — die Hülle (E-003, E-004).
//!
//! Der Rust-Anteil ist bewusst dünn: Fenster, Menü, Lebenszyklus des Sidecars,
//! Windows-Benutzername, Anwendungsdatenverzeichnis. **Keine Fachlogik.** Sie
//! lebt in TypeScript, und das ist der ganze Grund für die Sidecar-Bauweise aus
//! E-004 — eine Rundung oder ein Exportformat, das hier zum zweiten Mal
//! entstünde, liefe irgendwann auseinander.
//!
//! Reihenfolge beim Start, und sie ist Inhalt:
//!
//! ```text
//!   1  Einzelinstanz sichern      B-1.6 Punkt 5
//!   2  Datenverzeichnis anlegen   E-018, B-7.2 — vor dem Dienst, damit alles,
//!                                 was er hineinschreibt, die engen Rechte erbt
//!   3  Startgeheimnis erzeugen    B-1.6 Punkt 2
//!   4  Benutzernamen lesen        E-010, B-8.1 — vom Betriebssystem, nicht
//!                                 aus der Umgebung
//!   5  Sidecar starten            Geheimnis und Benutzername über `stdin`,
//!                                 zwei Zeilen, ein Schreibvorgang (E-042)
//!   6  Fenster zeigen
//! ```

mod appdata;
mod identity;
mod menu;
mod sidecar;

use tauri::{Manager, RunEvent, WindowEvent};

use appdata::DirectoryReport;
use identity::OsUser;
use sidecar::{ExitReason, Handshake, Service};

/// Was beim Start schiefgehen konnte, ohne dass Takt deswegen nicht startet.
///
/// Die Hülle bricht **nicht** ab, wenn die Rechte nicht gesetzt werden konnten
/// oder das Verzeichnis in einem Synchronisierungsordner liegt. Sie sagt es.
/// Ein Abbruch wäre hier falsch: Der Benutzer stünde ohne Anwendung und ohne
/// Möglichkeit da, den Zustand zu ändern (B-7.2 Punkt 3).
#[derive(Default)]
struct Startup {
    directory: Option<DirectoryReport>,
    problems: Vec<String>,
}

/// Zustand der Hülle für die Oberfläche.
#[derive(serde::Serialize)]
struct ShellState {
    directory: Option<DirectoryReport>,
    problems: Vec<String>,
    service_exit: Option<ExitReason>,
}

/// Das Sitzungsgeheimnis und die Anschrift des Dienstes.
///
/// Damit weist sich die **Oberfläche** aus, nicht mit dem Add-in-Token (T-011).
/// Der Wert lebt im Arbeitsspeicher und gilt für einen Start. Wer ihn liest,
/// kann in diesem Fenster alles, was die Oberfläche kann — deshalb ist die
/// Sicherheitsrichtlinie des Fensters in `tauri.conf.json` eng gesetzt und die
/// Fähigkeitenliste kurz.
#[tauri::command]
fn takt_service_handshake(service: tauri::State<'_, Service>) -> Handshake {
    service.handshake()
}

/// Der Windows-Benutzername (E-010).
///
/// Eine **Abfrage**, kein gespeicherter Wert: B-8.2 Punkt 1 verlangt, dass der
/// Wert zum Zeitpunkt des Exports gefragt wird und weder in SQLite noch im
/// Anwendungszustand liegt. Es gibt bewusst keinen Gegenbefehl, der ihn setzt.
#[tauri::command]
fn takt_os_user() -> OsUser {
    identity::current()
}

/// Ablageort, Rechte und Warnungen (E-018, B-7.1, B-7.2).
#[tauri::command]
fn takt_shell_state(app: tauri::AppHandle, startup: tauri::State<'_, Startup>) -> ShellState {
    ShellState {
        directory: startup.directory.clone(),
        problems: startup.problems.clone(),
        service_exit: app.state::<Service>().exit_reason(),
    }
}

/// Beendet den Dienst und danach die Anwendung.
///
/// Der Weg über einen eigenen Befehl existiert, damit die Oberfläche einen
/// laufenden Timer vorher abfragen kann (E-036): Erst fragen, dann beenden.
#[tauri::command]
fn takt_quit(app: tauri::AppHandle) {
    app.state::<Service>().stop();
    app.exit(0);
}

pub fn run() {
    let mut builder = tauri::Builder::default();

    // Muss als **erstes** Plugin stehen. Ein zweiter Takt-Start würde sonst
    // einen zweiten Sidecar auf dieselbe Datenbank setzen; der zweite bekäme
    // den Port nicht und beendete sich mit 74, aber der Benutzer stünde vor
    // einer Fehlermeldung statt vor seinem Fenster (B-1.6 Punkt 5).
    builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
    }));

    let app = builder
        .plugin(tauri_plugin_shell::init())
        // Ordnerauswahl fuer den Exportordner (B-5.1 Punkt 1, Befund S-04).
        // Die Oberflaeche ruft `plugin:dialog|open` ueber
        // `apps/desktop/src/shell.ts`; freigegeben ist in
        // `capabilities/default.json` nur `dialog:allow-open`.
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let mut startup = Startup::default();

            // 2 — Datenverzeichnis, **vor** dem Dienst.
            match appdata::resolve(&appdata::current_environment()) {
                Ok(dir) => match appdata::prepare(&dir) {
                    Ok(report) => {
                        if !report.permissions_applied {
                            startup.problems.push(report.permissions_detail.clone());
                        }

                        // Die Ordnerwarnung geht **nicht** zusätzlich hierher
                        // (T-020b). Sie stand hier, solange sie sonst nirgends
                        // erschienen wäre; seit die Oberfläche sie an ihrem
                        // eigenen Platz zeigt, wäre die zweite Ablage doppelt —
                        // und die Überschrift dieser Liste, „Takt ist nicht
                        // vollständig gestartet", ist für sie schlicht falsch:
                        // Takt läuft, der Ordner liegt nur an einer Stelle, an
                        // der er nicht liegen sollte.
                        //
                        // `report.sync_warning` und `report.sync_detail`
                        // bleiben unverändert und gehen über `directory` an die
                        // Oberfläche.
                        startup.directory = Some(report);
                    }
                    Err(error) => startup.problems.push(format!(
                        "Das Anwendungsdatenverzeichnis {} ließ sich nicht anlegen: {error}",
                        dir.display()
                    )),
                },
                Err(reason) => startup.problems.push(reason.message().to_string()),
            }

            // 3 — Startgeheimnis.
            let service = Service::new().map_err(|error| -> Box<dyn std::error::Error> { error.into() })?;
            app.manage(service);

            // 4 — Der Benutzername, vom Betriebssystem (E-010, B-8.1). Er geht
            // als zweite Startzeile an den Dienst (E-042) und ist dort Pflicht:
            // Ohne ihn startet er nicht, weil ein Export ohne Urheber nicht
            // nachvollziehbar wäre.
            //
            // Bewusst der **nackte** Name und nicht `qualified_name`. A-8.5
            // nennt das Feld `WindowsUser`, nicht `Domäne und Benutzer`; ob das
            // Abrechnungstool die Domäne erwartet, ist offen (B-8.2 Punkt 4).
            // Beide Werte stehen der Oberfläche über `takt_os_user` zur
            // Verfügung, damit die Antwort auf diese Frage keine Änderung an
            // der Startkette braucht.
            let os_user = identity::current();

            // 5 — Sidecar. Ein Fehlschlag beendet Takt nicht: Das Fenster soll
            // erscheinen und den Grund nennen können.
            if let Err(error) = sidecar::start(app.handle(), &os_user.name) {
                startup.problems.push(error);
            }

            menu::install(app.handle())?;
            app.manage(startup);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            takt_service_handshake,
            takt_os_user,
            takt_shell_state,
            takt_quit
        ])
        .on_window_event(|window, event| {
            // Auch beim harten Schließen — der Benutzer klickt auf das Kreuz,
            // ohne irgendetwas zu bestätigen.
            //
            // **Hier gehört E-036 hin, und hier steht es noch nicht.** Beim
            // geordneten Beenden soll Takt fragen, ob ein laufender Timer
            // gestoppt werden soll. Dafür müsste dieser Zweig
            // `api.prevent_close()` rufen, `takt://beenden-angefordert` senden
            // und darauf warten, dass die Oberfläche über `takt_quit`
            // antwortet.
            //
            // Solange die Oberfläche darauf nicht hört, wäre das eine
            // Anwendung, die sich nicht schließen lässt — und das ist der
            // schlechtere Fehler. Der Umbau ist eine Zeile und gehört in die
            // Aufgabe, die den Timer in die Oberfläche bringt.
            if matches!(event, WindowEvent::Destroyed | WindowEvent::CloseRequested { .. }) {
                window.app_handle().state::<Service>().stop();
            }
        })
        .build(tauri::generate_context!())
        .expect("Takt ließ sich nicht aufbauen");

    app.run(|handle, event| {
        // Zweiter Halt. `Exit` kommt auch dann, wenn kein Fensterereignis
        // gelaufen ist — etwa bei `app.exit(0)` aus dem Menü.
        if matches!(event, RunEvent::Exit) {
            handle.state::<Service>().stop();
        }
    });
}
