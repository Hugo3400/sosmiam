import { MAX_BROUILLONS_CHAT, type BrouillonChat, type BrouillonsChat } from "~/contenus/type-brouillon-chat";
import { placerBrouillonChat } from "~/fonctions/chat/placer-brouillon-chat";

const LONGUEUR_MAX_ID = 128;

function estBrouillon(valeur: unknown): valeur is BrouillonChat {
  if (!valeur || typeof valeur !== "object") return false;
  const { texte, le } = valeur as Record<string, unknown>;
  return typeof texte === "string" && typeof le === "string" && !Number.isNaN(Date.parse(le));
}

export function nettoyerBrouillonsChat(lu: unknown): BrouillonsChat {
  if (!lu || typeof lu !== "object" || Array.isArray(lu)) return new Map();
  return Object.entries(lu)
    .filter((entree): entree is [string, BrouillonChat] => entree[0].length > 0 && entree[0].length <= LONGUEUR_MAX_ID && estBrouillon(entree[1]) && entree[1].texte.trim().length > 0)
    .sort((a, b) => Date.parse(a[1].le) - Date.parse(b[1].le))
    .slice(-MAX_BROUILLONS_CHAT)
    .reduce<BrouillonsChat>((brouillons, [id, brouillon]) => placerBrouillonChat(brouillons, id, brouillon.texte, brouillon.le), new Map());
}
