import type { CitationChat } from "~/contenus/type-discussion-chat";

const INDISPONIBLE = "Message indisponible";

const replier = (texte: string) => texte.replace(/\s+/g, " ").trim();

export function decrireCitation(citation: CitationChat, lieuNom?: string): { vu: string; lu: string } {
  if (citation.etat !== "visible") return { vu: INDISPONIBLE, lu: INDISPONIBLE };
  const extrait = citation.extrait ? replier(citation.extrait) : "";
  switch (citation.type) {
    case "photo":
      return { vu: "📷 Photo", lu: "une photo" };
    case "vocal":
      return { vu: "🎙️ Note vocale", lu: "une note vocale" };
    case "gif":
      return { vu: "🎞️ GIF", lu: "un GIF" };
    case "vote":
      return { vu: "🗳️ Sondage", lu: "un sondage" };
    case "lieu": {
      const nom = lieuNom ?? "Un lieu";
      return { vu: `📍 ${nom}${extrait ? ` · ${extrait}` : ""}`, lu: `un lieu, ${nom}${extrait ? ` : ${extrait}` : ""}` };
    }
    default:
      return extrait ? { vu: extrait, lu: extrait } : { vu: INDISPONIBLE, lu: INDISPONIBLE };
  }
}
