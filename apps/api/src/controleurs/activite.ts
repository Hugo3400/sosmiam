// L'activité de l'app, pour le compte connecté (voir routes/activite.ts). Les points et le badge du premier sauveteur sont
// donnés ici, une fois le geste écrit ; une rescousse reprise rend ses points.
import type { Request, Response } from "express";

import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import { FORME_PSEUDO_CREATEUR, type GesteActivite, type ServicesActivite } from "../services/activite-regles.ts";

/** Points des rescousses (barème, docs/decisions.md) */
export const POINTS_RESCOUSSE = 2;
export const POINTS_PREMIER_SAUVETEUR = 20;

export type DependancesActivite = {
  services: ServicesActivite;
  /** ajouterPoints de services/comptes.ts (négatif : retire) */
  ajouterPoints: (compteId: number, points: number, raison: "rescousse" | "premier-sauveteur", detail?: string) => Promise<unknown>;
  /** donnerBadge de services/comptes.ts */
  donnerBadge: (compteId: number, badge: string) => Promise<unknown>;
};

const ERREURS: Record<string, number> = { "lieu-inconnu": 404, "publication-inconnue": 404, "lieu-non-verifie": 409, "plus-de-rescousse": 409 };

/** Le geste demandé par l'adresse (/gardes/12, /jaimes/34, /suivis/createurs/lea.mange…) ; null s'il ne va pas */
function lireGeste(type: string, brut: string): GesteActivite | null {
  if (type === "createurs") return FORME_PSEUDO_CREATEUR.test(brut) ? { quoi: "suivi-createur", pseudo: brut } : null;
  const id = lireIdentifiant(brut);
  if (id === null) return null;
  if (type === "gardes") return { quoi: "garde", lieuId: id };
  if (type === "lieux") return { quoi: "suivi-lieu", lieuId: id };
  if (type === "jaimes") return { quoi: "jaime", publicationId: id };
  if (type === "masques") return { quoi: "masque", publicationId: id };
  return null;
}

export function creerControleursActivite({ services, ajouterPoints, donnerBadge }: DependancesActivite, horloge: () => number) {
  const maintenant = () => new Date(horloge());
  const repondreActivite = async (reponse: Response, compteId: number, statut = 200, enPlus: Record<string, unknown> = {}) =>
    reponse.status(statut).json({ ok: true, activite: await services.lireActivite(compteId, maintenant()), ...enPlus });

  return {
    /** GET /app/activite */
    async lire(_requete: Request, reponse: Response) {
      await repondreActivite(reponse, lireCompteId(reponse));
    },

    /** POST /app/activite/rescousses { lieuId } */
    async donnerRescousse(requete: Request, reponse: Response) {
      const compteId = lireCompteId(reponse);
      const brut = lireCorps(requete).lieuId;
      const lieuId = typeof brut === "number" && Number.isInteger(brut) && brut > 0 && brut < 1_000_000_000 ? brut : null;
      if (lieuId === null) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: "lieuId" });
      const r = await services.donnerRescousse(compteId, lieuId, maintenant());
      if (!r.ok) return reponse.status(ERREURS[r.erreur] ?? 400).json({ ok: false, erreur: r.erreur });
      if (!r.deja) {
        await ajouterPoints(compteId, POINTS_RESCOUSSE, "rescousse", `lieu ${lieuId}`);
        if (r.premierSauveteur) {
          await ajouterPoints(compteId, POINTS_PREMIER_SAUVETEUR, "premier-sauveteur", `lieu ${lieuId}`);
          await donnerBadge(compteId, "premier-sauveteur");
        }
      }
      await repondreActivite(reponse, compteId, r.deja ? 200 : 201, { premierSauveteur: r.premierSauveteur });
    },

    /** DELETE /app/activite/rescousses/:lieuId */
    async reprendreRescousse(requete: Request, reponse: Response) {
      const compteId = lireCompteId(reponse);
      const lieuId = lireIdentifiant(requete.params.lieuId);
      if (lieuId === null) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: "lieuId" });
      const r = await services.reprendreRescousse(compteId, lieuId, maintenant());
      if (r.reprise) await ajouterPoints(compteId, -POINTS_RESCOUSSE, "rescousse", `reprise, lieu ${lieuId}`);
      if (r.premierSauveteurRetire) await ajouterPoints(compteId, -POINTS_PREMIER_SAUVETEUR, "premier-sauveteur", `reprise, lieu ${lieuId}`);
      await repondreActivite(reponse, compteId);
    },

    /** PUT (oui) ou DELETE (non) /app/activite/:type/:cible et /app/activite/suivis/:type/:cible */
    basculer(oui: boolean) {
      return async (requete: Request, reponse: Response) => {
        const compteId = lireCompteId(reponse);
        const geste = lireGeste(String(requete.params.type), String(requete.params.cible));
        if (!geste) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: "cible" });
        const r = await services.basculer(compteId, geste, oui);
        if (!r.ok) return reponse.status(ERREURS[r.erreur] ?? 400).json({ ok: false, erreur: r.erreur });
        await repondreActivite(reponse, compteId);
      };
    },
  };
}
