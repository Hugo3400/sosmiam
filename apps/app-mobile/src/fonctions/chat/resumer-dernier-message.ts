import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { MessageChat } from "@sos-miam/commun/types/conversations";
import { TEXTES_CHAT_APERCUS_PAR_LANGUE } from "~/contenus/textes-chat-apercus";
import { TEXTES_SONDAGE_PAR_LANGUE } from "~/contenus/textes-sondage";
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
function decrireContenu(message: MessageChat, langue: Langue, lieuNom: string | undefined, pourLecteurEcran: boolean): string {
  const T = choisirTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE, langue);
  // Compte connecté : un message qui n'est plus visible se dit comme dans sa bulle
  if (message.etat === "supprime") return T.messageSupprime;
  if (message.etat === "masque") return T.masque;
  if (message.etat === "retire") return T.retire;
  if (message.etat === "illisible") return T.illisible;
  // Même durée, même icône que la bulle et le menu du message
  const duree = message.dureeSecondes;
  switch (message.type) {
    case "photo":
      return pourLecteurEcran ? T.photoLue : T.photo;
    case "vocal":
      if (pourLecteurEcran) return T.vocalLu(duree !== undefined ? formaterDureeVocalLue(duree, langue) : null);
      return T.vocal(duree !== undefined ? formaterDureeVocal(duree) : null);
    case "lieu":
      return pourLecteurEcran ? T.lieuLu(lieuNom) : T.lieu(lieuNom);
    case "gif":
      return pourLecteurEcran ? T.gifLu : T.gif;
    case "vote": {
      const question = choisirTextes(TEXTES_SONDAGE_PAR_LANGUE, langue).question;
      return pourLecteurEcran ? T.sondageLu(question) : T.sondage(question);
    }
    default:
      return couper(message.texte ?? "");
  }
}

/**
 * L'aperçu du dernier message d'une conversation : « Toi : On y va ? », « Léa : 📷 Photo », « 🎙️ Note vocale · 0:12 », « 📍 Chez Nonna Lia »,
 * « 🎞️ GIF », « 🗳️ On mange où ? ».
 * `auteur` : ce qu'on écrit devant (« Toi » pour tes messages, le prénom dans un groupe), ou null (message privé d'un pote).
 * `lieuNom` : le nom du lieu partagé (type « lieu »), s'il est connu.
 * `pourLecteurEcran` : version lue par VoiceOver et TalkBack, sans emoji ni « 0:12 » (« Toi : note vocale de 12 secondes »).
 */
export function resumerDernierMessage(message: MessageChat, auteur: string | null, langue: Langue, lieuNom?: string, pourLecteurEcran = false): string {
  const contenu = decrireContenu(message, langue, lieuNom, pourLecteurEcran);
  return auteur ? choisirTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE, langue).avecAuteur(auteur, contenu) : contenu;
}
