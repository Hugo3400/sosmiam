// Protection des routes /pro/lieux/:id/… (espace pro) : après exigerCompte, le compte connecté doit avoir un rattachement
// VALIDÉ à ce lieu, sinon 403 « pas-pro » (même réponse si le lieu n'existe pas : rien à deviner). Certaines routes
// sont réservées au gérant : un membre « equipe » y reçoit 403 « reserve-au-gerant ». Le rôle est relu à chaque demande
// (un membre retiré perd l'accès tout de suite).
import type { NextFunction, Request, Response } from "express";

import type { CompteSession } from "./proteger-comptes.ts";
import type { RoleRattachement, ServicesPro } from "../services/pro-regles.ts";

/** Ce que la protection met dans reponse.locals.pro */
export type AccesPro = { lieuId: number; role: RoleRattachement };

/** Un identifiant d'adresse (/pro/lieux/12) : entier positif, ou null. */
export function lireIdentifiant(brut: unknown): number | null {
  return typeof brut === "string" && /^[1-9]\d{0,8}$/.test(brut) ? Number(brut) : null;
}

export function creerProtectionPro(services: Pick<ServicesPro, "lireRole">) {
  /** `gerantSeulement` : la route modifie la fiche ou l'équipe */
  return function exigerRattachement(gerantSeulement = false) {
    return async (requete: Request, reponse: Response, suite: NextFunction) => {
      const lieuId = lireIdentifiant(requete.params.id);
      const compteId = (reponse.locals.compte as CompteSession).id;
      const role = lieuId === null ? null : await services.lireRole(compteId, lieuId);
      if (lieuId === null || role === null) return void reponse.status(403).json({ ok: false, erreur: "pas-pro" });
      if (gerantSeulement && role !== "gerant") return void reponse.status(403).json({ ok: false, erreur: "reserve-au-gerant" });
      reponse.locals.pro = { lieuId, role } satisfies AccesPro;
      suite();
    };
  };
}
