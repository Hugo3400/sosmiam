// Pas de fenêtre de console en plus sous Windows, une fois compilé
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    sos_miam_gestion_lib::run()
}
