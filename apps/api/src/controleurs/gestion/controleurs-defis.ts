// Contrôleurs des défis dans le logiciel de gestion (décidé par Hugo le 14 octobre 2026) : liste (brouillons compris, avec
// les réussites), création, modification et suppression. La règle (vérification, champs figés après une réussite) est dans
// services/defis.ts de la session App ; ici, seulement les statuts et le journal (numéro et titre du défi).
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ServicesDefis } from "../../services/defis-regles.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { lireId } from "./lire-champs.ts";

/** Ce que la gestion utilise des défis, fourni par demarrer.ts */
export type DefisGestion = Pick<ServicesDefis, "listerGestion" | "creer" | "modifier" | "supprimer">;

const STATUTS = { "champ-invalide": 400, "defi-inconnu": 404, "defi-deja-reussi": 409 } as const;
const corpsDe = (requete: Request): unknown => (typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {});

export function creerControleursDefis(s: ServicesGestion, defis?: DefisGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => lireId(requete.params.id) ?? 0;
  const indisponible = (reponse: Response) => reponse.status(503).json({ ok: false, erreur: "bientot-disponible" });
  const echec = (reponse: Response, resultat: { erreur: keyof typeof STATUTS; champ?: string }) =>
    reponse.status(STATUTS[resultat.erreur]).json({ ok: false, ...resultat });

  return {
    /** GET /defis */
    liste: async (_requete: Request, reponse: Response) => (defis ? reponse.json(await defis.listerGestion()) : indisponible(reponse)),
    /** POST /defis : un BrouillonDefi complet */
    creer: async (requete: Request, reponse: Response) => {
      if (!defis) return indisponible(reponse);
      const resultat = await defis.creer(corpsDe(requete));
      if (!resultat.ok) return echec(reponse, resultat);
      await noter(reponse, resultat.defi.publie ? "Défi créé et publié" : "Défi créé (brouillon)", `défi n° ${resultat.defi.id} : ${resultat.defi.titre}`);
      reponse.status(201).json({ ok: true, defi: resultat.defi });
    },
    /** PUT /defis/:id : les champs à changer ; 409 si on touche à la règle d'un défi déjà réussi */
    modifier: async (requete: Request, reponse: Response) => {
      if (!defis) return indisponible(reponse);
      const resultat = await defis.modifier(id(requete), corpsDe(requete));
      if (!resultat.ok) return echec(reponse, resultat);
      await noter(reponse, "Défi modifié", `défi n° ${resultat.defi.id} : ${resultat.defi.titre}${resultat.defi.publie ? "" : " (brouillon)"}`);
      reponse.json({ ok: true, defi: resultat.defi });
    },
    /** DELETE /defis/:id ; 409 si quelqu'un l'a déjà réussi (on le dépublie) */
    supprimer: async (requete: Request, reponse: Response) => {
      if (!defis) return indisponible(reponse);
      const resultat = await defis.supprimer(id(requete));
      if (!resultat.ok) return echec(reponse, resultat);
      await noter(reponse, "Défi supprimé", `défi n° ${id(requete)}`);
      reponse.json({ ok: true });
    },
  };
}
