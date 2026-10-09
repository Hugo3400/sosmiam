// « Ma carte » (espace pro du site, mode pro de l'app) : le gérant et l'équipe la lisent, seul le gérant la remplace.
// La vérification est celle de packages/commun (validerCarteDuLieu), la même dans l'app, sur le site et ici ; la date
// de mise à jour est toujours posée par le serveur. Contrat : routes/pro.ts.
import type { Request, Response } from "express";

import { validerCarteDuLieu } from "../../../../packages/commun/src/validation/valider-carte-du-lieu.ts";
import { presenterCarte } from "../fonctions/pro/presenter-carte.ts";
import type { AccesPro } from "../middlewares/proteger-pro.ts";
import type { CarteGardee, ServicesPro } from "../services/pro-regles.ts";
import { lireCorps } from "./comptes-champs.ts";

const lireAcces = (reponse: Response) => reponse.locals.pro as AccesPro;
const pasPro = (reponse: Response) => reponse.status(403).json({ ok: false, erreur: "pas-pro" });

export function creerControleursCartePro(services: Pick<ServicesPro, "lireCarte" | "enregistrerCarte">, horloge: () => number) {
  return {
    /** GET /pro/lieux/:id/carte → { ok, carte, majLe } */
    async lire(_requete: Request, reponse: Response) {
      const gardee = await services.lireCarte(lireAcces(reponse).lieuId);
      if (!gardee) return pasPro(reponse);
      reponse.json({ ok: true, ...presenterCarte(gardee.carte, gardee.majLe) });
    },

    /** PUT /pro/lieux/:id/carte { carte } (gérant) → { ok, carte, majLe } ; { carte: null } efface la carte */
    async enregistrer(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      let carte: CarteGardee["carte"] = null;
      if (!("carte" in corps)) return reponse.status(400).json({ ok: false, erreur: "carte-invalide", champ: "autre", section: null, element: null });
      if (corps.carte !== null) {
        const verifiee = validerCarteDuLieu(corps.carte);
        if (!verifiee.ok) return reponse.status(400).json(verifiee);
        // Une carte sans aucune section n'est pas une carte : elle est effacée
        if (verifiee.carte.sections.length > 0) carte = { sections: verifiee.carte.sections };
      }
      const maintenant = new Date(horloge());
      if (!(await services.enregistrerCarte(lireAcces(reponse).lieuId, carte, maintenant))) return pasPro(reponse);
      reponse.json({ ok: true, ...presenterCarte(carte, carte === null ? null : maintenant) });
    },
  };
}
