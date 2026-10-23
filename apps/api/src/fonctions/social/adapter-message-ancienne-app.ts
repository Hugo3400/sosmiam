import type { MessageApi } from "../../../../../packages/commun/src/types/messagerie.ts";

const TEXTES_DE_REMPLACEMENT: Readonly<Partial<Record<MessageApi["type"], string>>> = {
  gif: "🎞️ Un GIF t'attend : mets l'app à jour pour le voir.",
  vote: "🍝 On mange où ? Mets l'app à jour pour voter.",
};
const SONDAGE_CLOS = "🍝 Le vote est fini : mets l'app à jour pour voir qui gagne.";

export function adapterMessageAncienneApp(m: MessageApi): MessageApi {
  const remplacement = m.type === "vote" && m.vote?.closLe ? SONDAGE_CLOS : TEXTES_DE_REMPLACEMENT[m.type];
  if (!remplacement) return m;
  const { gif: _gif, vote: _vote, ...reste } = m;
  return { ...reste, type: "texte", texte: m.etat === "visible" ? remplacement : null };
}
