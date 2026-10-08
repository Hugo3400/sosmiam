import type { NextFunction, Request, Response } from "express";

/** Dernier filet : une requête mal formée reçoit 400, tout le reste 500, sans détail technique dans la réponse. */
export function gererErreurs(erreur: unknown, _requete: Request, reponse: Response, _suite: NextFunction) {
  const statut = typeof erreur === "object" && erreur !== null && "status" in erreur ? Number(erreur.status) : 500;
  if (statut >= 400 && statut < 500) {
    return reponse.status(statut).json({ ok: false, erreur: "requete-invalide" });
  }
  console.error(erreur);
  reponse.status(500).json({ ok: false, erreur: "erreur-serveur" });
}
