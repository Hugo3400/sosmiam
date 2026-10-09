// Contrôleurs de la surveillance des visites dans le logiciel de gestion : comptes signalés, lieux qui refusent beaucoup,
// contestations de refus, et les seuils (réglables). Rien n'est bloqué tout seul : l'équipe regarde et décide.
// Journal : « compte n° X », « lieu n° X », « visite n° X », jamais de prénom ni le mot de la contestation.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import { BORNES_SEUILS, type SeuilsSurveillance } from "../../services/gestion/seuils-surveillance.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireId, lireNombre } from "./lire-champs.ts";

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};
const introuvable = (reponse: Response, erreur = "introuvable") => reponse.status(404).json({ ok: false, erreur });

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

/** Tous les seuils, entiers et dans leurs bornes */
function lireSeuils(corps: Record<string, unknown>): SeuilsSurveillance {
  const seuils = {} as SeuilsSurveillance;
  for (const [cle, [min, max]] of Object.entries(BORNES_SEUILS) as [keyof SeuilsSurveillance, readonly [number, number]][]) {
    const valeur = lireNombre(corps, cle, min, max);
    if (valeur === null) throw new ChampInvalide(cle);
    seuils[cle] = valeur;
  }
  return seuils;
}

const decrireSeuils = (s: SeuilsSurveillance) =>
  `plus de ${s.parJour} visites par jour, ${s.partRefusMin} % de refus sur ${s.decisionsMin} visites ; lieux : ${s.lieuxPartRefusMin} % sur ${s.lieuxDecisionsMin} ; sur ${s.fenetreJours} jours`;

export function creerControleursSurveillance(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => lireId(requete.params.id) ?? 0;

  return {
    /** GET /surveillance */
    lire: verifier(async (_requete, reponse) => reponse.json(await s.lireSurveillance())),

    /** PUT /surveillance/seuils : { parJour, partRefusMin, decisionsMin, lieuxPartRefusMin, lieuxDecisionsMin, fenetreJours } */
    regler: verifier(async (requete, reponse) => {
      const seuils = lireSeuils(corpsDe(requete));
      await s.ecrireSeuilsSurveillance(seuils);
      await noter(reponse, "Seuils de surveillance des visites modifiés", decrireSeuils(seuils));
      reponse.json({ ok: true, seuils });
    }),

    /** POST /surveillance/comptes/:id/vu et /surveillance/lieux/:id/vu : « vu, rien à signaler » */
    vuCompte: verifier(async (requete, reponse) => {
      if (!(await s.marquerSurveilleVu("compte", id(requete)))) return introuvable(reponse, "pas-signale");
      await noter(reponse, "Compte signalé vu (rien à signaler)", `compte n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),
    vuLieu: verifier(async (requete, reponse) => {
      if (!(await s.marquerSurveilleVu("lieu", id(requete)))) return introuvable(reponse, "pas-signale");
      await noter(reponse, "Lieu qui refuse beaucoup vu (rien à signaler)", `lieu n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),

    /** POST /surveillance/contestations/:id/relue */
    relue: verifier(async (requete, reponse) => {
      const visite = await s.marquerContestationRelue(id(requete));
      if (!visite) return introuvable(reponse);
      await noter(reponse, "Contestation de refus relue", `visite n° ${id(requete)}, compte n° ${visite.compteId}, lieu n° ${visite.lieuId}`);
      reponse.json({ ok: true });
    }),
  };
}
