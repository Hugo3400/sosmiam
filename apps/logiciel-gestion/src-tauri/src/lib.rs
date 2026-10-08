// Partie native du logiciel de gestion de SOS Miam : la fenêtre, les notifications Windows, une seule instance,
// et l'enregistrement de fichiers (export des inscrits). Tout le reste (clé, signatures, écrans) est dans l'interface.
use std::path::Path;

use base64::Engine;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

/// Formats texte que le logiciel peut enregistrer sur le disque
const EXTENSIONS_TEXTE: [&str; 3] = ["csv", "html", "txt"];
/// Formats binaires : seulement les sauvegardes chiffrées de la base
const EXTENSIONS_BINAIRES: [&str; 1] = ["sauvegarde"];

/// Ouvre la fenêtre « Enregistrer sous » puis écrit le fichier à l'endroit choisi par Hugo.
/// L'interface ne donne qu'un nom proposé : elle ne peut jamais choisir elle-même où écrire.
/// Renvoie faux si Hugo a annulé.
async fn demander_et_ecrire(app: &tauri::AppHandle, nom: &str, permises: &[&str], contenu: &[u8]) -> Result<bool, String> {
    let nom = Path::new(nom)
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or("nom de fichier invalide")?
        .to_string();
    let extension = Path::new(&nom)
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase())
        .unwrap_or_default();
    if !permises.contains(&extension.as_str()) {
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

/// Enregistre un fichier texte (export CSV des inscrits, newsletter en HTML…).
#[tauri::command]
async fn enregistrer_fichier(app: tauri::AppHandle, nom: String, contenu: String) -> Result<bool, String> {
    demander_et_ecrire(&app, &nom, &EXTENSIONS_TEXTE, contenu.as_bytes()).await
}

/// Enregistre un fichier binaire reçu en base64 (copie d'une sauvegarde chiffrée de la base).
#[tauri::command]
async fn enregistrer_fichier_binaire(app: tauri::AppHandle, nom: String, contenu_base64: String) -> Result<bool, String> {
    let contenu = base64::engine::general_purpose::STANDARD.decode(contenu_base64).map_err(|e| e.to_string())?;
    demander_et_ecrire(&app, &nom, &EXTENSIONS_BINAIRES, &contenu).await
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut application = tauri::Builder::default();
    #[cfg(desktop)]
    {
        application = application
            .plugin(tauri_plugin_single_instance::init(|app, _arguments, _dossier| {
                if let Some(fenetre) = app.get_webview_window("main") {
                    let _ = fenetre.unminimize();
                    let _ = fenetre.set_focus();
                }
            }))
            .plugin(tauri_plugin_updater::Builder::new().build());
    }
    application
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![enregistrer_fichier, enregistrer_fichier_binaire])
        .run(tauri::generate_context!())
        .expect("impossible de lancer le logiciel de gestion");
}
