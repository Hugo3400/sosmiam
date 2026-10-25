import type { Request, Response } from "express";

import { lireFiltresListeLieux } from "../fonctions/lieux/lire-filtres-liste-lieux.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { ServicesLieuxSite } from "../services/lieux-site.ts";

const requeteEnObjet = (requete: Request) => requete.query as Record<string, unknown>;

export function creerControleursLieuxSite(services: ServicesLieuxSite, horloge: () => number = Date.now) {
  const maintenant = () => new Date(horloge());
  return {
    async liste(requete: Request, reponse: Response) {
      const page = await services.listerPage(lireFiltresListeLieux(requeteEnObjet(requete)), maintenant());
      reponse.set("Cache-Control", "public, max-age=60").json({ ok: true, ...page });
    },
    async villes(_requete: Request, reponse: Response) {
      reponse.set("Cache-Control", "public, max-age=300").json({ ok: true, villes: await services.listerVilles() });
    },
    async carte(requete: Request, reponse: Response) {
      const { ville, type } = lireFiltresListeLieux(requeteEnObjet(requete));
      reponse.set("Cache-Control", "public, max-age=60").json({ ok: true, epingles: await services.listerEpingles({ ville, type }, maintenant()) });
    },
    async accueil(_requete: Request, reponse: Response) {
      reponse.set("Cache-Control", "public, max-age=300").json({ ok: true, lieux: await services.choisirAccueil(maintenant()) });
    },
    async fiche(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      const lieu = id === null ? null : await services.lireFiche(id, maintenant());
      if (!lieu) return reponse.status(404).json({ ok: false, erreur: "lieu-inconnu" });
      reponse.set("Cache-Control", "public, max-age=60").json({ ok: true, lieu });
    },
  };
}
