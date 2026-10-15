import type { Request, Response } from "express";

import { lireIdentifiantPublic } from "../fonctions/social/lire-identifiant-public.ts";
import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { Refus, Resultat } from "../services/communaute-regles.ts";
import type { AppliquerEffetsSociaux } from "../services/effets-sociaux-regles.ts";
import type { RelationsSociales } from "../services/relations-sociales-regles.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { refuserSocial } from "./social-champs.ts";

const STATUTS: Readonly<Record<string, number>> = { "public-reserve": 403, "chiffrement-indisponible": 503 };

export const moi = (reponse: Response) => lireProfilSocialPose(reponse).compteId;

export function lireParametre(requete: Request, champ: "id"): number {
  const id = lireIdentifiant(requete.params[champ]);
  if (id === null) throw new ChampInvalide(champ);
  return id;
}

export async function lirePersonneOuNull(requete: Request, relations: Pick<RelationsSociales, "trouverCompte">): Promise<number | null> {
  const idPublic = lireIdentifiantPublic(requete.params.personne);
  if (!idPublic) throw new ChampInvalide("personne");
  return relations.trouverCompte(idPublic);
}

export function refuserCommunaute(reponse: Response, r: Refus): void {
  if (r.erreur === "cle-deja-prise") throw new ChampInvalide("idClient");
  if (r.jusqua) return void reponse.status(409).json({ ok: false, erreur: r.erreur, details: { jusqua: r.jusqua.toISOString() } });
  throw refuserSocial(r.erreur, STATUTS);
}

export async function repondreCommunaute<T extends object>(
  reponse: Response, appliquer: AppliquerEffetsSociaux, r: Resultat<T>, rendre: (ok: T) => object, statut = 200,
): Promise<void> {
  if (!r.ok) return refuserCommunaute(reponse, r);
  await appliquer(r.effets);
  reponse.status(statut).json({ ok: true, ...rendre(r) });
}
