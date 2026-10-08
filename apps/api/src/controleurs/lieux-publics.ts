import type { Request, Response } from "express";

import type { LieuPublic } from "../services/lieux-publics.ts";

/** Renvoie les lieux publiés. Une liste vide est une réponse normale : il n'y a pas encore de lieu. */
export function creerControleurLieuxPublics(lister: () => Promise<LieuPublic[]>) {
  return async (_requete: Request, reponse: Response) => {
    reponse.json({ ok: true, lieux: await lister() });
  };
}
