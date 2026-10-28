import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Pote } from "@sos-miam/commun/types/potes";
import type { MessageChatEnrichi } from "~/contenus/type-discussion-chat";
import { decrireJourDiscussion } from "~/fonctions/chat/decrire-jour-discussion";
import { regrouperAlbumsChat } from "~/fonctions/chat/regrouper-albums-chat";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";

/** Un message du chat prêt à afficher : son auteur, son heure, le jour à écrire au-dessus, et s'il ouvre une série */
export type LigneDiscussion = {
  message: MessageChatEnrichi;
  album: MessageChatEnrichi[] | null;
  auteur: Pote | null;
  deMoi: boolean;
  /** « 14h32 » */
  heure: string;
  /** « Aujourd'hui », « Hier », « Lundi 6 octobre » : seulement sur le premier message du jour */
  jour: string | null;
  /** Premier message d'une série du même auteur (nouvel auteur ou nouveau jour) : avatar, et prénom dans un groupe */
  debutSerie: boolean;
};

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * Range les messages d'une conversation pour la liste : jour au-dessus du premier message de chaque jour, séries par auteur,
 * photos d'un même album réunies (regrouperAlbumsChat). monId : ton identifiant (utiliserMonId), pour reconnaître tes messages.
 */
export function construireLignesDiscussion(messages: MessageChatEnrichi[], trouverPote: (id: string) => Pote | null, maintenant: Date, monId: string, langue: Langue): LigneDiscussion[] {
  const groupes = regrouperAlbumsChat(messages);
  return groupes.map(({ message, album }, i) => {
    const date = new Date(message.date);
    const precedent = groupes[i - 1]?.message;
    const nouveauJour = !precedent || debutDuJour(new Date(precedent.date)) !== debutDuJour(date);
    return {
      message,
      album,
      auteur: trouverPote(message.auteur),
      deMoi: message.auteur === monId,
      heure: ecrireHeureLangue(date, langue),
      jour: nouveauJour ? decrireJourDiscussion(date, maintenant, langue) : null,
      debutSerie: nouveauJour || precedent.auteur !== message.auteur || !!precedent.systeme || !!message.systeme,
    };
  });
}
