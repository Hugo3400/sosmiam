import type { Request, Response } from "express";

import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { FichePublique, LieuDuPlan, LieuPublic } from "../services/lieux-publics.ts";

/** Renvoie les lieux publiés. Une liste vide est une réponse normale : il n'y a pas encore de lieu. */
export function creerControleurLieuxPublics(lister: () => Promise<LieuPublic[]>) {
  return async (_requete: Request, reponse: Response) => {
    reponse.json({ ok: true, lieux: await lister() });
  };
}

/** Les fiches publiées pour le plan du site (/sitemap.xml) : identifiant et date de modification (ISO 8601). */
export function creerControleurLieuxDuPlan(lister: () => Promise<LieuDuPlan[]>) {
  return async (_requete: Request, reponse: Response) => {
    const lieux = (await lister()).map(({ id, modifieLe }) => ({ id, modifieLe: modifieLe.toISOString() }));
    reponse.set("Cache-Control", "public, max-age=300").json({ ok: true, lieux });
  };
}

/** La fiche d'un lieu publié (page publique du site), ou 404. Contrat : routes/lieux-publics.ts. */
export function creerControleurFichePublique(lire: (id: number) => Promise<FichePublique | null>) {
  return async (requete: Request, reponse: Response) => {
    const id = lireIdentifiant(requete.params.id);
    const lieu = id === null ? null : await lire(id);
    if (!lieu) return reponse.status(404).json({ ok: false, erreur: "lieu-inconnu" });
    reponse.set("Cache-Control", "public, max-age=60").json({ ok: true, lieu });
  };
}
