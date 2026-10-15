import { LONGUEUR_MAX_DETAIL_IDEE, LONGUEUR_MAX_TITRE_IDEE, LONGUEUR_MIN_TITRE_IDEE } from "../regles/idees.ts";
import type { NouvelleIdee } from "../types/idees.ts";
import { nettoyerTexteSocial } from "./nettoyer-texte-social.ts";
import { verifierTexteSocial } from "./verifier-texte-social.ts";

export type ResultatNouvelleIdee =
  | { ok: true; idee: NouvelleIdee }
  | { ok: false; champ: "titre" | "detail"; raison: "vide" | "trop-court" | "trop-long" | "mot-interdit" };

export function validerNouvelleIdee(s: { titre?: unknown; detail?: unknown }): ResultatNouvelleIdee {
  const titreBrut = typeof s.titre === "string" ? s.titre : "";
  const titre = verifierTexteSocial(titreBrut, LONGUEUR_MAX_TITRE_IDEE);
  if (titre !== "ok") return { ok: false, champ: "titre", raison: titre };
  const titrePropre = nettoyerTexteSocial(titreBrut);
  if ([...titrePropre].length < LONGUEUR_MIN_TITRE_IDEE) return { ok: false, champ: "titre", raison: "trop-court" };

  const detailPropre = typeof s.detail === "string" ? nettoyerTexteSocial(s.detail) : "";
  if (detailPropre !== "") {
    const detail = verifierTexteSocial(detailPropre, LONGUEUR_MAX_DETAIL_IDEE);
    if (detail !== "ok") return { ok: false, champ: "detail", raison: detail };
  }
  return { ok: true, idee: { titre: titrePropre, detail: detailPropre } };
}
