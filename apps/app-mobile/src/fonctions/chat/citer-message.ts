import { LONGUEUR_MAX_EXTRAIT_CITATION } from "@sos-miam/commun/regles/chat";
import type { CitationChat, MessageChatEnrichi } from "~/contenus/type-discussion-chat";

export function citerMessage(message: MessageChatEnrichi): CitationChat {
  const etat = message.etat === "supprime" || message.etat === "masque" || message.etat === "retire" || message.etat === "illisible" ? message.etat : "visible";
  const texte = etat === "visible" && (message.type === "texte" || message.type === "lieu") ? (message.texte ?? null) : null;
  return {
    id: message.id,
    auteur: message.auteur === "" ? null : message.auteur,
    type: message.type,
    extrait: texte === null ? null : Array.from(texte).slice(0, LONGUEUR_MAX_EXTRAIT_CITATION).join(""),
    etat,
  };
}
