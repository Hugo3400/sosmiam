import { LONGUEUR_MAX_DESCRIPTION_LISTE, LONGUEUR_MAX_TITRE_LISTE, VISIBILITES_LISTE } from "../regles/listes.ts";
import type { NouvelleListe, VisibiliteListe } from "../types/listes.ts";
import { estEmojiSeul } from "./est-emoji-seul.ts";
import { verifierTexteSocial } from "./verifier-texte-social.ts";

export type ChampNouvelleListe = "titre" | "emoji" | "description" | "visibilite";

export type ResultatNouvelleListe = { ok: true; liste: NouvelleListe } | { ok: false; champ: ChampNouvelleListe; raison?: "mot-interdit" };

/**
 * Vérifie une nouvelle liste (lue telle quelle dans le corps de la demande) : titre de 1 à 40 caractères après trim, un
 * seul emoji, description facultative de 140 caractères (absente : ""), sans mot interdit (raison « mot-interdit »), et
 * qui la voit (« tous » ou « bande »). Rend la liste nettoyée.
 */
export function validerNouvelleListe(l: { [Champ in keyof NouvelleListe]?: unknown }): ResultatNouvelleListe {
  if (typeof l.titre !== "string") return { ok: false, champ: "titre" };
  const titre = verifierTexteSocial(l.titre, LONGUEUR_MAX_TITRE_LISTE);
  if (titre === "mot-interdit") return { ok: false, champ: "titre", raison: "mot-interdit" };
  if (titre !== "ok") return { ok: false, champ: "titre" };

  const emoji = typeof l.emoji === "string" ? l.emoji.trim() : null;
  if (!estEmojiSeul(emoji)) return { ok: false, champ: "emoji" };

  if (l.description !== undefined && l.description !== null && typeof l.description !== "string") return { ok: false, champ: "description" };
  const description = typeof l.description === "string" ? l.description.trim() : "";
  if (description !== "") {
    const verdict = verifierTexteSocial(description, LONGUEUR_MAX_DESCRIPTION_LISTE);
    if (verdict === "mot-interdit") return { ok: false, champ: "description", raison: "mot-interdit" };
    if (verdict !== "ok") return { ok: false, champ: "description" };
  }

  if (typeof l.visibilite !== "string" || !(VISIBILITES_LISTE as readonly string[]).includes(l.visibilite)) {
    return { ok: false, champ: "visibilite" };
  }

  return { ok: true, liste: { titre: l.titre.trim(), emoji, description, visibilite: l.visibilite as VisibiliteListe } };
}
