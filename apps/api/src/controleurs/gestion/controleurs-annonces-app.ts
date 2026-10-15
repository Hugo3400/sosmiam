import type { Request, Response } from "express";

import { BOUTON_ANNONCE_APP_MAX, CIBLES_ANNONCE_APP, LIEN_ANNONCE_APP_MAX, TEXTE_ANNONCE_APP_MAX, TITRE_ANNONCE_APP_MAX } from "../../../../../packages/commun/src/regles/annonces-app.ts";
import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { SaisieAnnonceApp } from "../../services/gestion/annonces-app-gestion.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireChoix, lireId, lireTexte } from "./lire-champs.ts";

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};

function lireDate(corps: Record<string, unknown>, champ: string): Date | null {
  const valeur = corps[champ];
  if (valeur === undefined || valeur === null || valeur === "") return null;
  const date = typeof valeur === "string" ? new Date(valeur) : null;
  if (!date || Number.isNaN(date.getTime())) throw new ChampInvalide(champ);
  return date;
}

export function lireAnnonceApp(corps: Record<string, unknown>, maintenant = new Date()): SaisieAnnonceApp {
  const boutonLibelle = lireTexte(corps, "boutonLibelle", BOUTON_ANNONCE_APP_MAX);
  const boutonLien = lireTexte(corps, "boutonLien", LIEN_ANNONCE_APP_MAX);
  if (boutonLien && !/^\/[a-z0-9/-]*$/.test(boutonLien)) throw new ChampInvalide("boutonLien");
  if (Boolean(boutonLibelle) !== Boolean(boutonLien)) throw new ChampInvalide(boutonLibelle ? "boutonLien" : "boutonLibelle");
  const cible = lireChoix(corps, "cible", CIBLES_ANNONCE_APP);
  const ville = cible === "ville" ? lireTexte(corps, "ville", 80, true) : null;
  const debut = lireDate(corps, "debut") ?? maintenant;
  const fin = lireDate(corps, "fin");
  if (fin && fin.getTime() <= debut.getTime()) throw new ChampInvalide("fin");
  return {
    titre: lireTexte(corps, "titre", TITRE_ANNONCE_APP_MAX, true),
    texte: lireTexte(corps, "texte", TEXTE_ANNONCE_APP_MAX, true),
    emoji: lireTexte(corps, "emoji", 16),
    boutonLibelle,
    boutonLien,
    cible,
    ville,
    debut,
    fin,
  };
}

export function creerControleursAnnoncesApp(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const verifier = (controleur: (requete: Request, reponse: Response) => Promise<unknown>) => async (requete: Request, reponse: Response) => {
    try {
      await controleur(requete, reponse);
    } catch (erreur) {
      if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
      throw erreur;
    }
  };
  const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });

  return {
    liste: async (_requete: Request, reponse: Response) => {
      reponse.json({ annonces: await s.listerAnnoncesAppGestion() });
    },
    creer: verifier(async (requete, reponse) => {
      const annonce = await s.creerAnnonceApp(lireAnnonceApp(corpsDe(requete)));
      await noter(reponse, "Pop-up de l'app créée", `pop-up n° ${annonce.id}, cible ${annonce.cible}`);
      reponse.json({ ok: true, id: annonce.id });
    }),
    modifier: verifier(async (requete, reponse) => {
      const id = lireId(requete.params.id) ?? 0;
      if (!(await s.modifierAnnonceApp(id, lireAnnonceApp(corpsDe(requete))))) return introuvable(reponse);
      await noter(reponse, "Pop-up de l'app modifiée", `pop-up n° ${id}`);
      reponse.json({ ok: true });
    }),
    publier: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      if (typeof corps.publiee !== "boolean") throw new ChampInvalide("publiee");
      const id = lireId(requete.params.id) ?? 0;
      if (!(await s.publierAnnonceApp(id, corps.publiee))) return introuvable(reponse);
      await noter(reponse, corps.publiee ? "Pop-up de l'app publiée" : "Pop-up de l'app retirée", `pop-up n° ${id}`);
      reponse.json({ ok: true });
    }),
    supprimer: async (requete: Request, reponse: Response) => {
      const id = lireId(requete.params.id) ?? 0;
      const resultat = await s.supprimerAnnonceApp(id);
      if (resultat === "introuvable") return introuvable(reponse);
      if (resultat === "deja-publiee") return reponse.status(409).json({ ok: false, erreur: "deja-publiee" });
      await noter(reponse, "Pop-up de l'app supprimée (brouillon)", `pop-up n° ${id}`);
      reponse.json({ ok: true });
    },
  };
}
