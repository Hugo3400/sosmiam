import type { Request, Response } from "express";

import type { CompteSession } from "../middlewares/proteger-comptes.ts";
import type { PhotosProfil } from "../services/photos-profil.ts";
import {
  ATTENTE_STOCKAGE_PLEIN_PHOTO_PROFIL_SECONDES, CACHE_PHOTO_PROFIL_PUBLIQUE, STATUTS_REFUS_PHOTO_PROFIL, type RefusPhotoProfil,
} from "../services/photos-profil-regles.ts";
import { lireCompteId } from "./comptes-champs.ts";

export function repondreRefusPhotoProfil(reponse: Response, refus: RefusPhotoProfil) {
  if (refus.erreur === "compte-inconnu") return reponse.status(401).json({ ok: false, erreur: "session-expiree" });
  if (refus.erreur === "stockage-plein") reponse.set("Retry-After", String(ATTENTE_STOCKAGE_PLEIN_PHOTO_PROFIL_SECONDES));
  const { ok: _ok, ...corps } = refus;
  return reponse.status(STATUTS_REFUS_PHOTO_PROFIL[refus.erreur]).json({ ok: false, ...corps });
}

export function creerControleursPhotoProfil(photos: Pick<PhotosProfil, "envoyer" | "retirer" | "lirePublique">) {
  return {
    async envoyer(requete: Request, reponse: Response) {
      const corps: unknown = requete.body;
      if (!Buffer.isBuffer(corps) || corps.length === 0) return repondreRefusPhotoProfil(reponse, { ok: false, erreur: "format-refuse" });
      const r = await photos.envoyer(lireCompteId(reponse), corps);
      if (!r.ok) return repondreRefusPhotoProfil(reponse, r);
      reponse.status(201).json({ ok: true, avatar: r.avatar });
    },

    async retirer(_requete: Request, reponse: Response) {
      const r = await photos.retirer(lireCompteId(reponse), "personne");
      if (!r.ok) return repondreRefusPhotoProfil(reponse, r);
      reponse.json({ ok: true, avatar: r.avatar });
    },

    async lire(requete: Request, reponse: Response) {
      const lecteur = (reponse.locals.compte as CompteSession | undefined)?.id ?? null;
      const octets = await photos.lirePublique(String(requete.params.nom), lecteur);
      if (!octets) return reponse.status(404).set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }).json({ ok: false, erreur: "photo-inconnue" });
      reponse.set({
        "Content-Type": "image/jpeg",
        "Content-Length": String(octets.length),
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": CACHE_PHOTO_PROFIL_PUBLIQUE,
      });
      reponse.status(200).end(octets);
    },
  };
}
