// Partie native du logiciel de gestion de SOS Miam : la fenêtre, les notifications Windows, une seule instance,
// et l'enregistrement de fichiers (export des inscrits). Tout le reste (clé, signatures, écrans) est dans l'interface.
use std::path::Path;

use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

/// Formats que le logiciel peut enregistrer sur le disque
const EXTENSIONS_PERMISES: [&str; 3] = ["csv", "html", "txt"];

/// Ouvre la fenêtre « Enregistrer sous » puis écrit le fichier à l'endroit choisi par Hugo.
/// L'interface ne donne qu'un nom proposé : elle ne peut jamais choisir elle-même où écrire.
/// Renvoie faux si Hugo a annulé.
#[tauri::command]
async fn enregistrer_fichier(app: tauri::AppHandle, nom: String, contenu: String) -> Result<bool, String> {
    let nom = Path::new(&nom)
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("nom de fichier invalide")?
        .to_string();
    let extension = Path::new(&nom)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();
    if !EXTENSIONS_PERMISES.contains(&extension.as_str()) {
        return Err("format refusé".into());
    }
    let choix = app
        .dialog()
        .file()
        .set_file_name(&nom)
        .add_filter(extension.to_uppercase(), &[extension.as_str()])
        .blocking_save_file();
    let Some(chemin) = choix else { return Ok(false) };
    let chemin = chemin.into_path().map_err(|e| e.to_string())?;
    std::fs::write(&chemin, contenu).map_err(|e| e.to_string())?;
    Ok(true)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut application = tauri::Builder::default();
    #[cfg(desktop)]
    {
        application = application.plugin(tauri_plugin_single_instance::init(|app, _arguments, _dossier| {
            if let Some(fenetre) = app.get_webview_window("main") {
                let _ = fenetre.unminimize();
                let _ = fenetre.set_focus();
            }
        }));
    }
    application
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![enregistrer_fichier])
        .run(tauri::generate_context!())
        .expect("impossible de lancer le logiciel de gestion");
}
