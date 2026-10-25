import express, { Router, type RequestHandler } from "express";

import { IMAGES_LIEU, REGLES_IMAGES_LIEU, type ImageLieu } from "../../../../packages/commun/src/regles/images-lieu.ts";
import { creerControleursImagesLieu, repondreRefusImageLieu } from "../controleurs/images-lieu.ts";
import type { ImagesLieu } from "../services/images-lieu.ts";

const lireCorpsImage = (quelle: ImageLieu): RequestHandler => {
  const lire = express.raw({ type: REGLES_IMAGES_LIEU[quelle].type, limit: REGLES_IMAGES_LIEU[quelle].poidsMax });
  return (requete, reponse, suite) => {
    lire(requete, reponse, (erreur?: unknown) => {
      if ((erreur as { type?: string } | undefined)?.type === "entity.too.large") return void repondreRefusImageLieu(reponse, { ok: false, erreur: "image-lieu-trop-lourde" });
      suite(erreur);
    });
  };
};

export function creerRoutesImagesLieu(images: Pick<ImagesLieu, "envoyer" | "retirer" | "lirePublique">, avantEnvoi: RequestHandler[] = [], avantRetrait: RequestHandler[] = []) {
  const c = creerControleursImagesLieu(images);
  const routes = Router();
  for (const quelle of IMAGES_LIEU) {
    routes.put(`/lieux/:id/${quelle}`, ...avantEnvoi, lireCorpsImage(quelle), c.envoyer(quelle));
    routes.delete(`/lieux/:id/${quelle}`, ...avantRetrait, c.retirer(quelle));
  }
  return routes;
}
