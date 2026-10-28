import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import { TEXTES_CHAT_APERCUS_PAR_LANGUE } from "~/contenus/textes-chat-apercus";
import type { CitationChat } from "~/contenus/type-discussion-chat";

const replier = (texte: string) => texte.replace(/\s+/g, " ").trim();

export function decrireCitation(citation: CitationChat, langue: Langue, lieuNom?: string): { vu: string; lu: string } {
  const T = choisirTextes(TEXTES_CHAT_APERCUS_PAR_LANGUE, langue);
  const indisponible = { vu: T.citationIndisponible, lu: T.citationIndisponible };
  if (citation.etat !== "visible") return indisponible;
  const extrait = citation.extrait ? replier(citation.extrait) : "";
  switch (citation.type) {
    case "photo":
      return { vu: T.citationPhoto, lu: T.citationPhotoLue };
    case "vocal":
      return { vu: T.citationVocal, lu: T.citationVocalLu };
    case "gif":
      return { vu: T.citationGif, lu: T.citationGifLu };
    case "vote":
      return { vu: T.citationSondage, lu: T.citationSondageLu };
    case "lieu": {
      const nom = lieuNom ?? T.citationLieuDefaut;
      return { vu: `📍 ${nom}${extrait ? ` · ${extrait}` : ""}`, lu: T.citationLieuLu(nom, extrait) };
    }
    default:
      return extrait ? { vu: extrait, lu: extrait } : indisponible;
  }
}
