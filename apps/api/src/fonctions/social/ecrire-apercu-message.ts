import type { TypeConversation } from "../../../../../packages/commun/src/types/messagerie.ts";

const TEXTE_MAX = 180;
const PREFIXES: Readonly<Record<string, string>> = { lieu: "📍 ", photo: "📷 " };

const couper = (texte: string) => {
  const propre = texte.replace(/\s+/g, " ").trim();
  const lettres = [...propre];
  return lettres.length > TEXTE_MAX ? `${lettres.slice(0, TEXTE_MAX - 1).join("").trimEnd()}…` : propre;
};

export function ecrireApercuMessage(m: {
  prenom: string;
  type: string;
  texte: string | null;
  titre: string;
  conversation: { type: TypeConversation };
}): { titre: string; texte: string } | null {
  if (m.type !== "texte" && m.type !== "lieu" && m.type !== "photo") return null;
  const contenu = m.texte ? couper(m.texte) : "";
  if (!contenu) return null;
  const texte = `${PREFIXES[m.type] ?? ""}${contenu}`;
  return { titre: m.titre, texte: m.conversation.type === "prive" ? texte : `${m.prenom} : ${texte}` };
}
