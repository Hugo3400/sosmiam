// Contrôleurs des événements des lieux dans le logiciel de gestion : la liste et la suspension (journal : numéros et motif,
// jamais le nom d'une personne).
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireId, lireParametre, lireTexte } from "./lire-champs.ts";

const VUES = ["a-venir", "passes", "suspendus"] as const;
const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};

export function creerControleursEvenementsGestion(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  return {
    /** GET /evenements?vue=&ville=&page= */
    liste: async (requete: Request, reponse: Response) => {
      const vue = lireParametre(requete.query.vue, 10);
      reponse.json(await s.listerEvenementsGestion({
        vue: (VUES as readonly string[]).includes(vue) ? (vue as (typeof VUES)[number]) : "a-venir",
        ville: lireParametre(requete.query.ville, 80),
        page: Math.min(1000, Math.max(1, Math.floor(Number(requete.query.page)) || 1)),
      }));
    },
    /** POST /evenements/:id/suspension : { suspendu: boolean, motif } (motif obligatoire pour suspendre) */
    suspendre: async (requete: Request, reponse: Response) => {
      const corps = corpsDe(requete);
      let motif: string | null;
      try {
        if (typeof corps.suspendu !== "boolean") throw new ChampInvalide("suspendu");
        motif = corps.suspendu ? lireTexte(corps, "motif", 300, true) : lireTexte(corps, "motif", 300);
      } catch (erreur) {
        if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
        throw erreur;
      }
      const id = lireId(requete.params.id) ?? 0;
      const evenement = await s.suspendreEvenement(id, corps.suspendu);
      if (!evenement) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      await noter(reponse, corps.suspendu ? "Événement suspendu" : "Événement rétabli", `événement n° ${id}, lieu n° ${evenement.lieuId}${motif ? ` : ${motif}` : ""}`);
      reponse.json({ ok: true });
    },
  };
}
