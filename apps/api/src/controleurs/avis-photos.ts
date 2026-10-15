import type { Request, Response } from "express";

import {
  ATTENTE_STOCKAGE_PLEIN_PHOTOS_AVIS_SECONDES, STATUTS_REFUS_PHOTO_AVIS, type RefusPhotoAvis,
} from "../services/photos-avis-regles.ts";
import type { PhotosAvis } from "../services/photos-avis.ts";
import { lireCompteId } from "./comptes-champs.ts";

export const CACHE_PHOTO_AVIS_PUBLIQUE = "public, max-age=300";

export function repondreRefusPhotoAvis(reponse: Response, refus: RefusPhotoAvis) {
  if (refus.erreur === "stockage-plein") reponse.set("Retry-After", String(ATTENTE_STOCKAGE_PLEIN_PHOTOS_AVIS_SECONDES));
  const { ok: _ok, ...corps } = refus;
  return reponse.status(STATUTS_REFUS_PHOTO_AVIS[refus.erreur]).json({ ok: false, ...corps });
}

export function creerControleursPhotosAvis(photos: Pick<PhotosAvis, "deposer" | "lirePublique">) {
  return {
    async deposer(requete: Request, reponse: Response) {
      const corps: unknown = requete.body;
      if (!Buffer.isBuffer(corps) || corps.length === 0) return repondreRefusPhotoAvis(reponse, { ok: false, erreur: "format-refuse" });
      const r = await photos.deposer(lireCompteId(reponse), corps);
      if (!r.ok) return repondreRefusPhotoAvis(reponse, r);
      reponse.status(201).json({ ok: true, photo: r.photo });
    },

    async lire(requete: Request, reponse: Response) {
      const octets = await photos.lirePublique(String(requete.params.photo));
      if (!octets) return reponse.status(404).set("Cache-Control", "no-store").json({ ok: false, erreur: "photo-inconnue" });
      reponse.set({
        "Content-Type": "image/jpeg",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": CACHE_PHOTO_AVIS_PUBLIQUE,
      });
      reponse.status(200).send(octets);
    },
  };
}
