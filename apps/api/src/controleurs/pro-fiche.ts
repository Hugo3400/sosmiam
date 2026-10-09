// « Ma fiche » et « Les suggestions sur mon lieu » (espace pro). Le gérant change tout de suite les horaires, le texte,
// le contact et les infos pratiques ; le nom et l'adresse partent à l'équipe (suggestion « pro », décidée dans le
// logiciel de gestion). Un membre « equipe » lit, mais ne modifie pas. Contrat : routes/pro.ts.
import type { Request, Response } from "express";

import { chargerValiderPropositionLieu } from "../fonctions/commun/charger-valider-proposition-lieu.ts";
import { preparerModificationFiche } from "../fonctions/pro/preparer-modification-fiche.ts";
import type { AccesPro } from "../middlewares/proteger-pro.ts";
import type { ServicesPro, ValeursDirectes } from "../services/pro-regles.ts";
import type { FicheSuggerable } from "../services/suggestions-comptes-regles.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";

const lireAcces = (reponse: Response) => reponse.locals.pro as AccesPro;
const pasPro = (reponse: Response) => reponse.status(403).json({ ok: false, erreur: "pas-pro" });

export function creerControleursFichePro(services: ServicesPro, horloge: () => number) {
  return {
    /** GET /pro/lieux/:id → { ok, fiche, role, peutModifier } */
    async lire(_requete: Request, reponse: Response) {
      const { lieuId, role } = lireAcces(reponse);
      const fiche = await services.lireFichePro(lieuId);
      if (!fiche) return pasPro(reponse);
      reponse.json({ ok: true, fiche, role, peutModifier: role === "gerant" });
    },

    /** PATCH /pro/lieux/:id (gérant) → { ok, appliques, envoyesAEquipe, suggestionId, fiche } */
    async modifier(requete: Request, reponse: Response) {
      const { lieuId } = lireAcces(reponse);
      const fiche = await services.lireFichePro(lieuId);
      if (!fiche) return pasPro(reponse);
      const preparee = preparerModificationFiche(lireCorps(requete), fiche, await chargerValiderPropositionLieu());
      if (!preparee.ok) return reponse.status(400).json({ ok: false, erreur: "proposition-invalide", champ: preparee.champ });

      const envoyesAEquipe = Object.keys(preparee.parEquipe) as (keyof FicheSuggerable)[];
      const suggestion = envoyesAEquipe.length === 0 ? null : {
        proposition: preparee.parEquipe as Partial<FicheSuggerable>,
        avant: Object.fromEntries(envoyesAEquipe.map((champ) => [champ, fiche[champ] ?? null])) as Partial<FicheSuggerable>,
        message: preparee.message,
      };
      const directs = preparee.directs as ValeursDirectes;
      const resultat = await services.modifierFichePro(lireCompteId(reponse), lieuId, { directs, suggestion }, new Date(horloge()));
      if (!resultat.ok) return reponse.status(409).json({ ok: false, erreur: resultat.erreur });
      reponse.json({
        ok: true, appliques: Object.keys(directs), envoyesAEquipe, suggestionId: resultat.suggestionId, fiche: await services.lireFichePro(lieuId),
      });
    },

    /** GET /pro/lieux/:id/suggestions → { ok, suggestions } (les plus récentes d'abord, sans l'auteur) */
    async suggestions(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, suggestions: await services.listerSuggestionsDuLieu(lireAcces(reponse).lieuId) });
    },
  };
}
