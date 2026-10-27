import express, { Router, type RequestHandler } from "express";

import { creerControleursActus, repondreRefusPhotoActus, type DependancesActus } from "../controleurs/actus.ts";
import { creerControleursActusCommentaires } from "../controleurs/actus-commentaires.ts";
import { lireCompteId } from "../controleurs/comptes-champs.ts";
import { limiterEnvoisMedias } from "../middlewares/limiter-envois-medias.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import { gererErreursComptes, type ProtectionComptes } from "../middlewares/proteger-comptes.ts";
import { sessionFacultative } from "../middlewares/session-facultative.ts";
import { TAILLE_MAX_PHOTO_AVIS } from "../services/photos-avis-regles.ts";

export const LIMITE_LECTURES_ACTUS = { fenetre: 60_000, maximum: 120 };
export const LIMITE_IMAGES_ACTUS = { fenetre: 60_000, maximum: 600 };
export const LIMITE_JAIMES_ACTUS = { fenetre: 10 * 60_000, maximum: 200 };
export const LIMITE_ECRITURES_ACTUS = { fenetre: 60 * 60_000, maximum: 20 };
export const LIMITE_PHOTOS_ACTUS = { fenetre: 60 * 60_000, maximum: 40 };
export const LIMITE_COMMENTAIRES_ACTUS = { fenetre: 10 * 60_000, maximum: 30 };

const lireCorpsPhoto = express.raw({ type: "image/jpeg", limit: TAILLE_MAX_PHOTO_AVIS });
const corpsPhoto: RequestHandler = (requete, reponse, suite) => {
  lireCorpsPhoto(requete, reponse, (erreur?: unknown) => {
    if ((erreur as { type?: string } | undefined)?.type === "entity.too.large") return void repondreRefusPhotoActus(reponse, { ok: false, erreur: "media-trop-lourd" });
    suite(erreur);
  });
};

export function creerRoutesActus(
  d: DependancesActus, protection: ProtectionComptes, limiteConnectee: RequestHandler,
  refuserSiLimite: RequestHandler = (_requete, _reponse, suite) => suite(),
) {
  const c = creerControleursActus(d);
  const k = creerControleursActusCommentaires(d.commentaires);
  const parCompte = (r: { fenetre: number; maximum: number }) => limiterRequetes({ ...r, cle: (_q, reponse) => `compte:${lireCompteId(reponse)}` });
  const prive: RequestHandler = (_q, reponse, suite) => {
    reponse.set("Cache-Control", "private, no-store");
    suite();
  };
  const lecture = [limiterRequetes(LIMITE_LECTURES_ACTUS), sessionFacultative(protection)];
  const ambassadeur: RequestHandler[] = [limiteConnectee, protection.exigerAmbassadeurActif, prive];
  const compte: RequestHandler[] = [limiteConnectee, protection.exigerCompte, prive];

  const routes = Router();
  routes.get("/", ...lecture, c.lister);
  routes.get("/villes", ...lecture, c.villes);
  routes.get("/images/:nom", limiterRequetes(LIMITE_IMAGES_ACTUS), c.image);
  routes.get("/abonnements", ...compte, c.abonnements);
  routes.get("/miens", ...compte, c.mesArticles);
  routes.get("/miens/medias/:nom", ...compte, c.monImage);
  routes.get("/miens/:id", ...compte, c.lireBrouillon);
  routes.post("/photos", limiterEnvoisMedias(), ...ambassadeur, parCompte(LIMITE_PHOTOS_ACTUS), refuserSiLimite, corpsPhoto, c.deposerPhoto);
  routes.post("/", ...ambassadeur, parCompte(LIMITE_ECRITURES_ACTUS), refuserSiLimite, c.envoyer);
  routes.put("/miens/:id", ...ambassadeur, parCompte(LIMITE_ECRITURES_ACTUS), refuserSiLimite, c.retoucher);
  routes.get("/:id/commentaires", ...lecture, k.lister);
  routes.post("/:id/commentaires", ...compte, parCompte(LIMITE_COMMENTAIRES_ACTUS), refuserSiLimite, k.commenter);
  routes.delete("/commentaires/:commentaireId", ...compte, k.supprimer);
  routes.post("/:id/jaime", ...compte, parCompte(LIMITE_JAIMES_ACTUS), c.aimer);
  routes.delete("/:id/jaime", ...compte, parCompte(LIMITE_JAIMES_ACTUS), c.aimer);
  routes.get("/:id", ...lecture, c.lire);
  routes.use(gererErreursComptes);
  return routes;
}
