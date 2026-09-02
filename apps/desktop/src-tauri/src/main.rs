// Ohne diese Zeile öffnet Windows im Auslieferungsbau zusätzlich ein
// Konsolenfenster hinter der Anwendung. Im Entwicklungsbau bleibt es, weil dort
// die Ausgabe des lokalen Dienstes hineinläuft.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    takt_desktop_lib::run()
}
