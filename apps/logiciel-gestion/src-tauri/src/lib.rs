// Partie native du logiciel de gestion de SOS Miam : la fenêtre, les notifications Windows, une seule instance,
// et l'enregistrement de fichiers (exports, pièces jointes, Espace presse). Tout le reste (clé, signatures, écrans) est dans
// l'interface.
use std::path::Path;

use base64::Engine;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

/// Formats texte que le logiciel peut enregistrer sur le disque (exports CSV et JSON, newsletter, QR de vitrine en SVG…)
const EXTENSIONS_TEXTE: [&str; 6] = ["csv", "html", "txt", "json", "svg", "md"];
/// Formats binaires : sauvegardes chiffrées, Espace presse (images, PDF, zips, vidéos, sons) et pièces jointes courantes des
/// mails. Jamais un programme ni un script (exe, bat, ps1, js…) : l'interface ne peut pas en écrire sur le PC.
const EXTENSIONS_BINAIRES: [&str; 27] = [
    "sauvegarde", "png", "jpg", "jpeg", "webp", "gif", "svg", "heic", "pdf", "zip", "mp4", "mov", "mp3", "ogg", "wav", "m4a",
    "md", "txt", "csv", "json", "docx", "xlsx", "pptx", "odt", "ods", "odp", "rtf",
];

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

/// Enregistre un fichier binaire reçu en base64 (sauvegarde chiffrée, visuel de l'Espace presse, pièce jointe d'un mail).
#[tauri::command]
async fn enregistrer_fichier_binaire(app: tauri::AppHandle, nom: String, contenu_base64: String) -> Result<bool, String> {
    let contenu = base64::engine::general_purpose::STANDARD.decode(contenu_base64).map_err(|e| e.to_string())?;
    demander_et_ecrire(&app, &nom, &EXTENSIONS_BINAIRES, &contenu).await
}

const ENTROPIE_DPAPI: &[u8] = b"sos-miam-gestion:deverrouillage-retenu";

#[cfg(windows)]
fn passer_par_dpapi(entree: &[u8], proteger: bool) -> Result<Vec<u8>, String> {
    use windows_sys::Win32::Foundation::LocalFree;
    use windows_sys::Win32::Security::Cryptography::{CryptProtectData, CryptUnprotectData, CRYPTPROTECT_UI_FORBIDDEN, CRYPT_INTEGER_BLOB};
    let mut donnees = entree.to_vec();
    let mut entropie = ENTROPIE_DPAPI.to_vec();
    let blob = CRYPT_INTEGER_BLOB { cbData: donnees.len() as u32, pbData: donnees.as_mut_ptr() };
    let sel = CRYPT_INTEGER_BLOB { cbData: entropie.len() as u32, pbData: entropie.as_mut_ptr() };
    let mut sortie = CRYPT_INTEGER_BLOB { cbData: 0, pbData: std::ptr::null_mut() };
    let reussi = unsafe {
        if proteger {
            CryptProtectData(&blob, std::ptr::null(), &sel, std::ptr::null(), std::ptr::null(), CRYPTPROTECT_UI_FORBIDDEN, &mut sortie)
        } else {
            CryptUnprotectData(&blob, std::ptr::null_mut(), &sel, std::ptr::null(), std::ptr::null(), CRYPTPROTECT_UI_FORBIDDEN, &mut sortie)
        }
    };
    donnees.fill(0);
    if reussi == 0 || sortie.pbData.is_null() {
        return Err("dpapi".into());
    }
    let resultat = unsafe { std::slice::from_raw_parts(sortie.pbData, sortie.cbData as usize) }.to_vec();
    unsafe {
        std::ptr::write_bytes(sortie.pbData, 0, sortie.cbData as usize);
        LocalFree(sortie.pbData as _);
    }
    Ok(resultat)
}

#[cfg(not(windows))]
fn passer_par_dpapi(_entree: &[u8], _proteger: bool) -> Result<Vec<u8>, String> {
    Err("indisponible".into())
}

#[tauri::command]
fn proteger_secret(contenu_base64: String) -> Result<String, String> {
    let mut contenu = base64::engine::general_purpose::STANDARD.decode(contenu_base64).map_err(|e| e.to_string())?;
    let protege = passer_par_dpapi(&contenu, true);
    contenu.fill(0);
    Ok(base64::engine::general_purpose::STANDARD.encode(protege?))
}

#[tauri::command]
fn deproteger_secret(contenu_base64: String) -> Result<String, String> {
    let contenu = base64::engine::general_purpose::STANDARD.decode(contenu_base64).map_err(|e| e.to_string())?;
    let mut clair = passer_par_dpapi(&contenu, false)?;
    let texte = base64::engine::general_purpose::STANDARD.encode(&clair);
    clair.fill(0);
    Ok(texte)
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
        .invoke_handler(tauri::generate_handler![enregistrer_fichier, enregistrer_fichier_binaire, proteger_secret, deproteger_secret])
        .run(tauri::generate_context!())
        .expect("impossible de lancer le logiciel de gestion");
}
