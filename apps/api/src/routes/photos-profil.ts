import express, { Router, type RequestHandler } from "express";

import { TAILLE_MAX_PHOTO_PROFIL, TYPE_PHOTO_PROFIL } from "../../../../packages/commun/src/regles/photo-profil.ts";
import { creerControleursPhotoProfil, repondreRefusPhotoProfil } from "../controleurs/comptes-photo.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { ProtectionComptes } from "../middlewares/proteger-comptes.ts";
import { sessionFacultative } from "../middlewares/session-facultative.ts";
import type { PhotosProfil } from "../services/photos-profil.ts";

export const LIMITE_LECTURES_PHOTOS_PROFIL = { fenetre: 60_000, maximum: 1200 };

const lireCorpsPhoto = express.raw({ type: TYPE_PHOTO_PROFIL, limit: TAILLE_MAX_PHOTO_PROFIL });

export const lireCorpsPhotoProfil: RequestHandler = (requete, reponse, suite) => {
  lireCorpsPhoto(requete, reponse, (erreur?: unknown) => {
    if ((erreur as { type?: string } | undefined)?.type === "entity.too.large") return void repondreRefusPhotoProfil(reponse, { ok: false, erreur: "media-trop-lourd" });
    suite(erreur);
  });
};

export function creerRoutesPhotosProfil(photos: PhotosProfil, protection: ProtectionComptes) {
  const c = creerControleursPhotoProfil(photos);
  const routes = Router();
  routes.get("/:nom", limiterRequetes(LIMITE_LECTURES_PHOTOS_PROFIL), sessionFacultative(protection), c.lire);
  return routes;
}
