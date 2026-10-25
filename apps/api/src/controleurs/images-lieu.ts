import type { Request, Response } from "express";

import type { ImageLieu } from "../../../../packages/commun/src/regles/images-lieu.ts";
import type { ImagesLieu } from "../services/images-lieu.ts";
import { ATTENTE_STOCKAGE_PLEIN_IMAGE_LIEU_SECONDES, CACHE_IMAGE_LIEU_PUBLIQUE, STATUTS_REFUS_IMAGE_LIEU, type RefusImageLieu } from "../services/images-lieu-regles.ts";
import { lireCompteId } from "./comptes-champs.ts";

export function repondreRefusImageLieu(reponse: Response, refus: RefusImageLieu) {
  if (refus.erreur === "stockage-plein") reponse.set("Retry-After", String(ATTENTE_STOCKAGE_PLEIN_IMAGE_LIEU_SECONDES));
  return reponse.status(STATUTS_REFUS_IMAGE_LIEU[refus.erreur]).json({ ok: false, erreur: refus.erreur });
}

const lireLieuId = (requete: Request) => {
  const id = Number(requete.params.id);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export function creerControleursImagesLieu(images: Pick<ImagesLieu, "envoyer" | "retirer" | "lirePublique">) {
  return {
    envoyer: (quelle: ImageLieu) => async (requete: Request, reponse: Response) => {
      const lieuId = lireLieuId(requete);
      if (lieuId === null) return repondreRefusImageLieu(reponse, { ok: false, erreur: "lieu-inconnu" });
      const corps: unknown = requete.body;
      if (!Buffer.isBuffer(corps) || corps.length === 0) return repondreRefusImageLieu(reponse, { ok: false, erreur: "image-lieu-invalide" });
      const r = await images.envoyer(lireCompteId(reponse), lieuId, quelle, corps);
      if (!r.ok) return repondreRefusImageLieu(reponse, r);
      reponse.json({ ok: true, adresse: r.adresse });
    },

    retirer: (quelle: ImageLieu) => async (requete: Request, reponse: Response) => {
      const lieuId = lireLieuId(requete);
      if (lieuId === null) return repondreRefusImageLieu(reponse, { ok: false, erreur: "lieu-inconnu" });
      const r = await images.retirer(lireCompteId(reponse), lieuId, quelle);
      if (!r.ok) return repondreRefusImageLieu(reponse, r);
      reponse.json({ ok: true });
    },

    async lire(requete: Request, reponse: Response) {
      const image = await images.lirePublique(String(requete.params.nom));
      if (!image) return reponse.status(404).set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }).json({ ok: false, erreur: "introuvable" });
      reponse.set({
        "Content-Type": image.type,
        "Content-Length": String(image.octets.length),
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": CACHE_IMAGE_LIEU_PUBLIQUE,
      });
      reponse.status(200).end(image.octets);
    },
  };
}
