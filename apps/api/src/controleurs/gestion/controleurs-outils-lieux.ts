// Contrôleurs des outils sur les fiches de lieux : contrôle (positions douteuses, doublons), lieux semblables à une
// fiche pas encore créée, et import en lot (CSV lu par le logiciel).
import type { Request, Response } from "express";

import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { lireParametre } from "./lire-champs.ts";

const nombreOuNull = (valeur: unknown) => {
  const nombre = typeof valeur === "string" && valeur.trim() !== "" ? Number(valeur) : NaN;
  return Number.isFinite(nombre) ? nombre : null;
};

export function creerControleursOutilsLieux(s: ServicesGestion) {
  return {
    controle: async (_requete: Request, reponse: Response) => reponse.json(await s.lireControleLieux()),
    /** ?nom=&ville=&adresse=&latitude=&longitude= : lieux déjà en base qui ressemblent à cette fiche */
    semblables: async (requete: Request, reponse: Response) => {
      const nom = lireParametre(requete.query.nom, 80);
      if (!nom) return reponse.json([]);
      reponse.json(await s.chercherLieuxSemblables({
        nom,
        ville: lireParametre(requete.query.ville, 80),
        adresse: lireParametre(requete.query.adresse, 160) || null,
        latitude: nombreOuNull(requete.query.latitude),
        longitude: nombreOuNull(requete.query.longitude),
      }));
    },
  };
}
