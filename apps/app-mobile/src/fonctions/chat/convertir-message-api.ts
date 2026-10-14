import { convertirCodeEnReaction } from "@sos-miam/commun/fonctions/messagerie/convertir-code-en-reaction";
import type { MessageChat, ReactionChat } from "@sos-miam/commun/types/conversations";
import type { MessageApi } from "@sos-miam/commun/types/messagerie";

/**
 * Un message tel que l'API le rend, au format des écrans du chat : l'auteur par son identifiant public (« » : compte
 * supprimé), les réactions en emoji, l'état seulement s'il n'est pas « visible », et le média sans son fichier (il se
 * télécharge à l'affichage, utiliserMediaChat).
 */
export function convertirMessageApi(m: MessageApi): MessageChat {
  const reactions: Partial<Record<ReactionChat, string[]>> = {};
  for (const [code, qui] of Object.entries(m.reactions)) {
    const reaction = convertirCodeEnReaction(code);
    if (reaction && qui && qui.length > 0) reactions[reaction] = [...qui];
  }
  return {
    id: m.id,
    idClient: m.idClient,
    auteur: m.auteur?.id ?? "",
    date: m.date,
    type: m.type,
    ...(m.texte !== null ? { texte: m.texte } : {}),
    ...(m.lieuId !== null ? { lieuId: m.lieuId } : {}),
    ...(m.media?.dureeSecondes != null ? { dureeSecondes: m.media.dureeSecondes } : {}),
    reactions,
    ...(m.etat !== "visible" ? { etat: m.etat } : {}),
    ...(m.media ? { media: { etat: m.media.etat, largeur: m.media.largeur, hauteur: m.media.hauteur, dureeSecondes: m.media.dureeSecondes } } : {}),
  };
}
