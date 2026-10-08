// Contrôleurs des réponses types (modèles de mails du logiciel de gestion).
import type { Request, Response } from "express";

import { CATEGORIES_REPONSES } from "../../services/gestion/categories-reponses.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireChoix, lireId, lireTexte } from "./lire-champs.ts";

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};

function lireSaisie(corps: Record<string, unknown>) {
  return {
    titre: lireTexte(corps, "titre", 80, true),
    categorie: lireChoix(corps, "categorie", CATEGORIES_REPONSES),
    objet: lireTexte(corps, "objet", 150) ?? "",
    texte: lireTexte(corps, "texte", 5000, true),
  };
}

function verifier(controleur: (requete: Request, reponse: Response) => Promise<unknown>) {
  return async (requete: Request, reponse: Response) => {
    try {
      await controleur(requete, reponse);
    } catch (erreur) {
      if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
      throw erreur;
    }
  };
}

export function creerControleursReponsesTypes(s: ServicesGestion) {
  const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });
  return {
    liste: verifier(async (_requete, reponse) => reponse.json(await s.listerReponsesTypes())),
    creer: verifier(async (requete, reponse) => reponse.status(201).json(await s.creerReponseType(lireSaisie(corpsDe(requete))))),
    modifier: verifier(async (requete, reponse) => {
      const modifiee = await s.modifierReponseType(lireId(requete.params.id) ?? 0, lireSaisie(corpsDe(requete)));
      return modifiee ? reponse.json(modifiee) : introuvable(reponse);
    }),
    supprimer: verifier(async (requete, reponse) => ((await s.supprimerReponseType(lireId(requete.params.id) ?? 0)) ? reponse.json({ ok: true }) : introuvable(reponse))),
  };
}
