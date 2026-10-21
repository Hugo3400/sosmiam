import type { Request, Response } from "express";

import type { NouveauSignalementSecurite } from "../../../../packages/commun/src/types/securite.ts";
import type { ErreurDepotSignalement, ServicesSecuritePublics } from "../services/securite-regles.ts";

const STATUTS: Readonly<Record<ErreurDepotSignalement, number>> = {
  "trop-d-images": 400,
  "image-trop-lourde": 413,
  "image-format": 415,
  "trop-de-demandes": 429,
  "chiffrement-indisponible": 503,
  "stockage-plein": 503,
};

const estPiegeRempli = (valeur: unknown) => valeur !== undefined && valeur !== null && valeur !== false && (typeof valeur !== "string" || valeur.trim() !== "");

export function creerControleursSecurite(services: ServicesSecuritePublics) {
  return {
    async listerTableauHonneur(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, entrees: await services.listerTableauHonneur() });
    },

    async deposerSignalement(requete: Request, reponse: Response) {
      const corps = typeof requete.body === "object" && requete.body !== null && !Array.isArray(requete.body) ? (requete.body as Record<string, unknown>) : {};
      if (estPiegeRempli(corps.site_web)) return reponse.status(201).json({ ok: true });
      const resultat = await services.deposerSignalement(corps as NouveauSignalementSecurite);
      if (resultat.ok) return reponse.status(201).json({ ok: true });
      if (resultat.erreur === "champ-invalide") return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: resultat.champ });
      if (resultat.reessayerDans) reponse.set("Retry-After", String(resultat.reessayerDans));
      reponse.status(STATUTS[resultat.erreur]).json({ ok: false, erreur: resultat.erreur });
    },
  };
}
