import { LONGUEUR_MAX_EXTRAIT_CITATION } from "../../../../../packages/commun/src/regles/chat.ts";
import type { MessageCiteApi } from "../../../../../packages/commun/src/types/messagerie.ts";
import type { ContenuMessage, LigneMessage } from "./presenter-message.ts";

export function presenterCitation(l: LigneMessage, o: { auteurId: string | null; contenu: ContenuMessage | "illisible"; cache: boolean }): MessageCiteApi {
  const etat: MessageCiteApi["etat"] = o.cache ? "masque"
    : l.supprimeLe ? "supprime" : l.retireLe ? "retire" : l.suspenduLe ? "masque" : o.contenu === "illisible" ? "illisible" : "visible";
  const contenu = etat === "visible" && o.contenu !== "illisible" ? o.contenu : null;
  const texte = contenu && (l.type === "texte" || l.type === "lieu" || l.type === "vote") ? contenu.texte : null;
  return {
    id: String(l.id),
    auteurId: o.cache ? null : o.auteurId,
    type: l.type,
    extrait: texte === null ? null : [...texte].slice(0, LONGUEUR_MAX_EXTRAIT_CITATION).join(""),
    etat,
  };
}
