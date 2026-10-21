import type { Request, Response } from "express";

import { lireNouvelleCandidature } from "../fonctions/carriere/lire-nouvelle-candidature.ts";
import type { ErreurDepotCandidature, ServicesCarrierePublics } from "../services/carriere-regles.ts";

const STATUTS: Readonly<Record<ErreurDepotCandidature, number>> = {
  "offre-inconnue": 404,
  "offre-fermee": 409,
  "cv-trop-lourd": 413,
  "cv-format": 415,
  "trop-de-demandes": 429,
  "chiffrement-indisponible": 503,
  "stockage-plein": 503,
};

const estPiegeRempli = (valeur: unknown) => valeur !== undefined && valeur !== null && valeur !== false && (typeof valeur !== "string" || valeur.trim() !== "");

export function creerControleursCarriere(services: ServicesCarrierePublics) {
  return {
    async listerOffres(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, offres: await services.listerOffresPubliees() });
    },

    async lireOffre(requete: Request, reponse: Response) {
      const offre = await services.lireOffrePubliee(String(requete.params.id));
      if (!offre) return reponse.status(404).json({ ok: false, erreur: "offre-inconnue" });
      reponse.json({ ok: true, offre });
    },

    async deposerCandidature(requete: Request, reponse: Response) {
      const corps = typeof requete.body === "object" && requete.body !== null ? (requete.body as Record<string, unknown>) : {};
      if (estPiegeRempli(corps.site_web)) return reponse.status(201).json({ ok: true });
      const lecture = lireNouvelleCandidature(corps);
      if (!lecture.ok) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: lecture.champ });
      const resultat = await services.deposerCandidature(String(requete.params.id), lecture.candidature);
      if (resultat.ok) return reponse.status(201).json({ ok: true });
      if (resultat.erreur === "champ-invalide") return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: resultat.champ });
      if (resultat.reessayerDans) reponse.set("Retry-After", String(resultat.reessayerDans));
      reponse.status(STATUTS[resultat.erreur]).json({ ok: false, erreur: resultat.erreur });
    },
  };
}
