import { LONGUEUR_MAX_RECHERCHE_GIF } from "@sos-miam/commun/regles/chat";
import type { RequeteGif } from "~/contenus/type-discussion-chat";

export function construireRequeteGif(texte: string, motPastille: string | null): RequeteGif {
  const propre = Array.from(texte.replace(/\s+/g, " ").trim()).slice(0, LONGUEUR_MAX_RECHERCHE_GIF).join("").trim();
  if (propre !== "") return { type: "recherche", q: propre };
  const mot = motPastille?.trim();
  return mot ? { type: "recherche", q: mot } : { type: "tendances" };
}
