// Le profil social du compte connecté, pour les routes sociales (spécification sociale B.0), après exigerCompte. Deux
// middlewares, sur le modèle de creerControleMajorite :
// - lireProfilSocial : LECTURE SEULE, ne crée jamais rien et ne demande pas de pseudo (pouls, cloche, lectures, recherche,
//   masques, blocages, signalements, décisions de la modération) ; sans profil, la route rend des valeurs vides ;
// - exigerProfilSocial : crée le profil au besoin (geste volontaire : ouverture de Potes, première écriture sociale) ; sans
//   pseudo, 409 « pseudo-requis ».
// Le profil social rend le compte trouvable : une lecture ne doit jamais le créer.
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { lireCompteId } from "../controleurs/comptes-champs.ts";
import type { ServicesSocial } from "../services/social-regles.ts";

/** Ce que les deux middlewares posent dans reponse.locals.social ; cree : exigerProfilSocial vient de le créer */
export type ProfilSocialPose = { compteId: number; idPublic: string | null; cree?: boolean };

export type ProfilSocialMiddlewares = { lireProfilSocial: RequestHandler; exigerProfilSocial: RequestHandler };

/** Le profil social posé par lireProfilSocial ou exigerProfilSocial */
export function lireProfilSocialPose(reponse: Response): ProfilSocialPose {
  return reponse.locals.social as ProfilSocialPose;
}

export function creerProfilSocialMiddlewares(social: Pick<ServicesSocial, "lireIdPublic" | "assurerProfil">): ProfilSocialMiddlewares {
  async function lireProfilSocial(_requete: Request, reponse: Response, suite: NextFunction) {
    const compteId = lireCompteId(reponse);
    reponse.locals.social = { compteId, idPublic: await social.lireIdPublic(compteId) } satisfies ProfilSocialPose;
    suite();
  }
  async function exigerProfilSocial(_requete: Request, reponse: Response, suite: NextFunction) {
    const compteId = lireCompteId(reponse);
    const profil = await social.assurerProfil(compteId);
    if (!profil) return void reponse.status(409).json({ ok: false, erreur: "pseudo-requis" });
    reponse.locals.social = { compteId, idPublic: profil.idPublic, cree: profil.cree } satisfies ProfilSocialPose;
    suite();
  }
  return { lireProfilSocial, exigerProfilSocial };
}
