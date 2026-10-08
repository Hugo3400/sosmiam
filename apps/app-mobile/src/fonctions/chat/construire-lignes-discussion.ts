import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { MessageChat } from "@sos-miam/commun/types/conversations";
import type { Pote } from "@sos-miam/commun/types/potes";
import { decrireJourDiscussion } from "~/fonctions/chat/decrire-jour-discussion";
import { formaterHeure } from "~/fonctions/dates/formater-heure";

/** Un message du chat prêt à afficher : son auteur, son heure, le jour à écrire au-dessus, et s'il ouvre une série */
export type LigneDiscussion = {
  message: MessageChat;
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

/** Range les messages d'une conversation pour la liste : jour au-dessus du premier message de chaque jour, séries par auteur. */
export function construireLignesDiscussion(messages: MessageChat[], trouverPote: (id: string) => Pote | null, maintenant: Date): LigneDiscussion[] {
  return messages.map((message, i) => {
    const date = new Date(message.date);
    const precedent = messages[i - 1];
    const nouveauJour = !precedent || debutDuJour(new Date(precedent.date)) !== debutDuJour(date);
    return {
      message,
      auteur: trouverPote(message.auteur),
      deMoi: message.auteur === ID_MOI,
      heure: formaterHeure(`${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`),
      jour: nouveauJour ? decrireJourDiscussion(date, maintenant) : null,
      debutSerie: nouveauJour || precedent.auteur !== message.auteur,
    };
  });
}
