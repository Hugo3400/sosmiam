// Ce qui passe par Windows (Tauri) : enregistrer un fichier, notifications. Dans un navigateur (essais en
// développement), on retombe sur un téléchargement classique et sur les notifications du navigateur.
import { invoke, isTauri } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";

/** Propose où enregistrer un fichier, puis l'écrit. Faux si Hugo a annulé. */
export async function enregistrerFichier(nomPropose: string, contenu: string, type = "text/csv"): Promise<boolean> {
  if (!isTauri()) {
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([contenu], { type }));
    lien.download = nomPropose;
    lien.click();
    setTimeout(() => URL.revokeObjectURL(lien.href), 10_000);
    return true;
  }
  const extension = nomPropose.split(".").pop() ?? "txt";
  const chemin = await save({ defaultPath: nomPropose, filters: [{ name: extension.toUpperCase(), extensions: [extension] }] });
  if (!chemin) return false;
  await invoke("enregistrer_fichier", { chemin, contenu });
  return true;
}

/** Notification Windows (centre de notifications), demandée une fois à la première alerte. */
export async function notifier(titre: string, texte: string): Promise<void> {
  try {
    if (isTauri()) {
      if (!(await isPermissionGranted()) && (await requestPermission()) !== "granted") return;
      sendNotification({ title: titre, body: texte });
    } else if ("Notification" in window) {
      if (Notification.permission === "default") await Notification.requestPermission();
      if (Notification.permission === "granted") new Notification(titre, { body: texte });
    }
  } catch {
    // Pas de notification possible : l'alerte reste visible dans le logiciel
  }
}

/** Copie un texte dans le presse-papiers. */
export async function copier(texte: string): Promise<void> {
  await navigator.clipboard.writeText(texte);
}
