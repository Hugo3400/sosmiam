// Ce qui passe par Windows (Tauri) : enregistrer un fichier, notifications. Dans un navigateur (essais en
// développement), on retombe sur un téléchargement classique et sur les notifications du navigateur.
import { invoke, isTauri } from "@tauri-apps/api/core";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";
import { openUrl } from "@tauri-apps/plugin-opener";

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
  // La partie native ouvre elle-même « Enregistrer sous » : l'interface ne choisit jamais où écrire
  return invoke<boolean>("enregistrer_fichier", { nom: nomPropose, contenu });
}

/** Comme enregistrerFichier, pour un fichier binaire (une sauvegarde chiffrée). */
export async function enregistrerFichierBinaire(nomPropose: string, contenu: Blob): Promise<boolean> {
  if (!isTauri()) {
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(contenu);
    lien.download = nomPropose;
    lien.click();
    setTimeout(() => URL.revokeObjectURL(lien.href), 10_000);
    return true;
  }
  const octets = new Uint8Array(await contenu.arrayBuffer());
  let binaire = "";
  for (let i = 0; i < octets.length; i += 0x8000) binaire += String.fromCharCode(...octets.subarray(i, i + 0x8000));
  return invoke<boolean>("enregistrer_fichier_binaire", { nom: nomPropose, contenuBase64: btoa(binaire) });
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

/** Ouvre un lien hors du logiciel : navigateur (https), messagerie (mailto), Discord. */
export async function ouvrirLien(url: string): Promise<void> {
  if (!/^(https:|mailto:|tel:)/.test(url)) return;
  if (isTauri()) await openUrl(url);
  else window.open(url, "_blank", "noopener");
}

/** Copie un texte dans le presse-papiers. */
export async function copier(texte: string): Promise<void> {
  await navigator.clipboard.writeText(texte);
}
