// « Télécharger mes données sociales » (GET /app/social/export, voir routes/social.ts) : tes données sociales et TES messages
// déchiffrés, pour toi seul. Lu sans jamais créer le profil social (lireProfilSocial) : sans profil, l'export dit seulement
// ce qui existe (signalements faits, éléments masqués, cloche…), avec profil: null.
import type { Request, Response } from "express";

import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import type { DependancesSocialApp } from "../routes/social-app.ts";

export function creerControleursExportSocial(d: Pick<DependancesSocialApp, "exportSocial">, horloge: () => number) {
  return {
    /** GET /app/social/export */
    async exporter(_requete: Request, reponse: Response) {
      const { compteId } = lireProfilSocialPose(reponse);
      reponse.json({ ok: true, export: await d.exportSocial.exporter(compteId, new Date(horloge())) });
    },
  };
}
