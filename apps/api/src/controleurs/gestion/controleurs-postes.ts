import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { AccesGestion } from "../../services/gestion/acces.ts";
import type { RegistrePostesDistance } from "../../services/gestion/postes-distance.ts";

type Dependances = {
  lireAcces: () => AccesGestion | null;
  registre: RegistrePostesDistance;
  oublierSessionsDuPoste: (posteId: string) => Promise<void>;
  noterAction: (poste: string, action: string, detail?: string) => Promise<void>;
};

export function creerControleursPostes(d: Dependances) {
  const refuser = (reponse: Response, statut: number, erreur: string) => void reponse.status(statut).json({ ok: false, erreur });
  return {
    lister: (_requete: Request, reponse: Response) => {
      const { poste: actuel } = reponse.locals.gestion as ContexteGestion;
      const acces = d.lireAcces();
      if (!acces) return refuser(reponse, 503, "gestion-fermee");
      reponse.json({
        distanceOuverte: Boolean(acces.distance),
        alertesParMail: Boolean(acces.distance?.courriel),
        postes: acces.postes.map((poste) => ({
          id: poste.id,
          nom: poste.nom,
          origine: poste.origine ?? "serveur",
          ajouteLe: poste.ajouteLe ?? null,
          expireLe: typeof poste.expireLe === "number" ? new Date(poste.expireLe).toISOString() : null,
          cePoste: poste.id === actuel.id,
        })),
      });
    },
    couper: async (requete: Request, reponse: Response) => {
      const { poste: actuel } = reponse.locals.gestion as ContexteGestion;
      const id = String(requete.params.id);
      const acces = d.lireAcces();
      const cible = acces?.postes.find((poste) => poste.id === id);
      if (!cible) return refuser(reponse, 404, "introuvable");
      if (cible.id === actuel.id && cible.origine !== "distance") return refuser(reponse, 409, "ce-poste");
      const fichier = d.registre.lire();
      if (!fichier) return refuser(reponse, 503, "gestion-fermee");
      d.registre.ecrire({ postes: fichier.postes.filter((poste) => poste.id !== id), coupes: [...fichier.coupes.filter((coupe) => coupe !== id), id] });
      await d.oublierSessionsDuPoste(id);
      await d.noterAction(actuel.nom, cible.id === actuel.id ? "poste-parti" : "poste-coupe").catch(() => {});
      reponse.json({ ok: true });
    },
  };
}
