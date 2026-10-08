import type { MessageChat } from "@sos-miam/commun/types/conversations";

// Assez pour remplir une ligne, pas de quoi faire lire un roman au lecteur d'écran
const LONGUEUR_APERCU = 140;

/** « 0:12 », « 1:00 » */
const ecrireDuree = (secondes: number) => `${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, "0")}`;

/** « 12 secondes », « 1 minute », « 1 minute 5 » */
function direDuree(secondes: number): string {
  const minutes = Math.floor(secondes / 60);
  const reste = secondes % 60;
  if (minutes === 0) return `${reste} seconde${reste > 1 ? "s" : ""}`;
  return `${minutes} minute${minutes > 1 ? "s" : ""}${reste > 0 ? ` ${reste}` : ""}`;
}

/** Coupe un texte trop long sans casser un emoji en deux */
function couper(texte: string): string {
  const caracteres = Array.from(texte.replace(/\s+/g, " ").trim());
  return caracteres.length > LONGUEUR_APERCU ? `${caracteres.slice(0, LONGUEUR_APERCU - 1).join("").trimEnd()}…` : caracteres.join("");
}

/** Le contenu seul : à l'écran (avec emoji) ou pour le lecteur d'écran */
function decrireContenu(message: MessageChat, lieuNom: string | undefined, pourLecteurEcran: boolean): string {
  const duree = message.dureeSecondes !== undefined ? Math.max(0, Math.round(message.dureeSecondes)) : null;
  switch (message.type) {
    case "photo":
      return pourLecteurEcran ? "photo" : "📷 Photo";
    case "vocal":
      if (pourLecteurEcran) return `note vocale${duree !== null ? ` de ${direDuree(duree)}` : ""}`;
      return `🎤 Note vocale${duree !== null ? ` · ${ecrireDuree(duree)}` : ""}`;
    case "lieu":
      if (pourLecteurEcran) return `lieu partagé${lieuNom ? ` : ${lieuNom}` : ""}`;
      return `📍 ${lieuNom ?? "Un lieu"}`;
    default:
      return couper(message.texte ?? "");
  }
}

/**
 * L'aperçu du dernier message d'une conversation : « Toi : On y va ? », « Léa : 📷 Photo », « 🎤 Note vocale · 0:12 », « 📍 Chez Nonna Lia ».
 * `auteur` : ce qu'on écrit devant (« Toi » pour tes messages, le prénom dans un groupe), ou null (message privé d'un pote).
 * `lieuNom` : le nom du lieu partagé (type « lieu »), s'il est connu.
 * `pourLecteurEcran` : version lue par VoiceOver et TalkBack, sans emoji ni « 0:12 » (« Toi : note vocale de 12 secondes »).
 */
export function resumerDernierMessage(message: MessageChat, auteur: string | null, lieuNom?: string, pourLecteurEcran = false): string {
  const contenu = decrireContenu(message, lieuNom, pourLecteurEcran);
  return auteur ? `${auteur} : ${contenu}` : contenu;
}
