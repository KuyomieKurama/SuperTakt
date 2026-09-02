//! Takt — das Anwendungsmenü.
//!
//! Kurz gehalten. Ein Menü ist kein Ort für Fachfunktionen: Alles, was der
//! Benutzer regelmäßig tut, gehört sichtbar in die Oberfläche und nicht zwei
//! Klicks tief in eine Leiste, die unter Windows ohnehin selten benutzt wird.
//! Hier stehen nur die Dinge, die es **nur** hier geben kann — Beenden mit
//! Tastenkürzel und die Angaben zur Anwendung.
//!
//! Alle Beschriftungen auf Deutsch (`CLAUDE.md`).

use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
use tauri::{AppHandle, Emitter, Manager};

pub fn install(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let quit = MenuItemBuilder::with_id("takt.beenden", "Takt beenden")
        .accelerator("CmdOrCtrl+Q")
        .build(app)?;

    let settings = MenuItemBuilder::with_id("takt.einstellungen", "Einstellungen …")
        .accelerator("CmdOrCtrl+,")
        .build(app)?;

    let about = MenuItemBuilder::with_id("takt.ueber", "Über Takt").build(app)?;

    let application = SubmenuBuilder::new(app, "Takt")
        .item(&settings)
        .separator()
        .item(&quit)
        .build()?;

    let edit = SubmenuBuilder::new(app, "Bearbeiten")
        .item(&PredefinedMenuItem::undo(app, Some("Rückgängig"))?)
        .item(&PredefinedMenuItem::redo(app, Some("Wiederherstellen"))?)
        .separator()
        .item(&PredefinedMenuItem::cut(app, Some("Ausschneiden"))?)
        .item(&PredefinedMenuItem::copy(app, Some("Kopieren"))?)
        .item(&PredefinedMenuItem::paste(app, Some("Einfügen"))?)
        .item(&PredefinedMenuItem::select_all(app, Some("Alles auswählen"))?)
        .build()?;

    let help = SubmenuBuilder::new(app, "Hilfe").item(&about).build()?;

    let menu = MenuBuilder::new(app)
        .items(&[&application, &edit, &help])
        .build()?;
    app.set_menu(menu)?;

    app.on_menu_event(|app, event| match event.id().as_ref() {
        "takt.beenden" => {
            // Über dasselbe Ereignis wie das Fensterkreuz: Die Oberfläche
            // bekommt Gelegenheit, einen laufenden Timer zu erfragen (E-036),
            // und beendet danach über `takt_quit`.
            let _ = app.emit("takt://beenden-angefordert", ());
        }
        "takt.einstellungen" => {
            let _ = app.emit("takt://einstellungen-oeffnen", ());
        }
        "takt.ueber" => {
            let _ = app.emit("takt://ueber-oeffnen", ());
        }
        _ => {}
    });

    let _ = app.get_webview_window("main");
    Ok(())
}
