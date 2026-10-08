import type { MessageChat } from "@sos-miam/commun/types/conversations";
import { formaterDureeVocal } from "~/fonctions/chat/formater-duree-vocal";
import { formaterDureeVocalLue } from "~/fonctions/chat/formater-duree-vocal-lue";

// Assez pour remplir une ligne, pas de quoi faire lire un roman au lecteur d'écran
const LONGUEUR_APERCU = 140;

/** Coupe un texte trop long sans casser un emoji en deux */
function couper(texte: string): string {
  const caracteres = Array.from(texte.replace(/\s+/g, " ").trim());
  return caracteres.length > LONGUEUR_APERCU ? `${caracteres.slice(0, LONGUEUR_APERCU - 1).join("").trimEnd()}…` : caracteres.join("");
}

/** Le contenu seul : à l'écran (avec emoji) ou pour le lecteur d'écran */
function decrireContenu(message: MessageChat, lieuNom: string | undefined, pourLecteurEcran: boolean): string {
  // Même durée, même icône que la bulle et le menu du message
  const duree = message.dureeSecondes;
  switch (message.type) {
    case "photo":
      return pourLecteurEcran ? "photo" : "📷 Photo";
    case "vocal":
      if (pourLecteurEcran) return `note vocale${duree !== undefined ? ` de ${formaterDureeVocalLue(duree)}` : ""}`;
      return `🎙️ Note vocale${duree !== undefined ? ` · ${formaterDureeVocal(duree)}` : ""}`;
    case "lieu":
      if (pourLecteurEcran) return `lieu partagé${lieuNom ? ` : ${lieuNom}` : ""}`;
      return `📍 ${lieuNom ?? "Un lieu"}`;
    default:
      return couper(message.texte ?? "");
  }
}

/**
 * L'aperçu du dernier message d'une conversation : « Toi : On y va ? », « Léa : 📷 Photo », « 🎙️ Note vocale · 0:12 », « 📍 Chez Nonna Lia ».
 * `auteur` : ce qu'on écrit devant (« Toi » pour tes messages, le prénom dans un groupe), ou null (message privé d'un pote).
 * `lieuNom` : le nom du lieu partagé (type « lieu »), s'il est connu.
 * `pourLecteurEcran` : version lue par VoiceOver et TalkBack, sans emoji ni « 0:12 » (« Toi : note vocale de 12 secondes »).
 */
export function resumerDernierMessage(message: MessageChat, auteur: string | null, lieuNom?: string, pourLecteurEcran = false): string {
  const contenu = decrireContenu(message, lieuNom, pourLecteurEcran);
  return auteur ? `${auteur} : ${contenu}` : contenu;
}
