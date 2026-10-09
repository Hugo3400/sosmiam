// Contrôleurs du logiciel de gestion pour les fondateurs par ville (docs/decisions.md) : candidatures, choix de la
// commune, acceptation avec les deux numéros de carte, refus, place libérée après un déménagement, zones et leurs places.
// Journal : seulement des numéros (candidature, compte, numéro national), jamais un prénom, une adresse ni une commune.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import type { OutilsComptes } from "./controleurs-ambassadeurs.ts";
import { ChampInvalide, lireId, lireParametre, lireTexte } from "./lire-champs.ts";

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};
const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });

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

export function creerControleursFondateurs(s: ServicesGestion, comptes?: OutilsComptes) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => lireId(requete.params.id) ?? 0;

  return {
    candidatures: verifier(async (requete, reponse) => reponse.json(await s.listerCandidatures(lireParametre(requete.query.statut, 12)))),
    zones: verifier(async (_requete, reponse) => reponse.json(await s.listerZonesFondateurs())),
    communes: verifier(async (requete, reponse) => reponse.json(await s.chercherCommunesAvecZone(lireParametre(requete.query.texte, 80)))),

    accepter: verifier(async (requete, reponse) => {
      const resultat = await s.accepterCandidature(id(requete));
      if (resultat.etat === "introuvable") return introuvable(reponse);
      if (resultat.etat === "sans-zone") return reponse.status(409).json({ ok: false, erreur: "sans-zone" });
      if (resultat.etat === "complet") return reponse.status(409).json({ ok: false, erreur: "zone-complete", zone: resultat.zone });
      if (comptes) await comptes.donnerBadge(resultat.compteId, "fondateur");
      await noter(reponse, "Candidature fondateur acceptée", `fondateur n° ${resultat.numeroNational} en France (compte n° ${resultat.compteId})`);
      reponse.json({ ok: true, numeroLocal: resultat.numeroLocal, numeroNational: resultat.numeroNational, zone: resultat.zone });
    }),
    refuser: verifier(async (requete, reponse) => {
      if (!(await s.refuserCandidature(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Candidature fondateur refusée", `candidature n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),
    commune: verifier(async (requete, reponse) => {
      const code = lireTexte(corpsDe(requete), "commune", 5, true);
      if (!/^[0-9][0-9AB][0-9]{3}$/.test(code)) throw new ChampInvalide("commune");
      const resultat = await s.choisirCommuneCandidature(id(requete), code);
      if (!resultat) return introuvable(reponse);
      await noter(reponse, "Commune d'une candidature fondateur choisie", `candidature n° ${id(requete)}`);
      reponse.json({ ok: true, ...resultat });
    }),
    liberer: verifier(async (requete, reponse) => {
      const resultat = await s.libererPlaceFondateur(id(requete));
      if (!resultat) return introuvable(reponse);
      await noter(reponse, "Place de fondateur libérée (déménagement)", `candidature n° ${id(requete)}`);
      reponse.json({ ok: true, encoreFondateurDeVille: resultat.encoreFondateurDeVille });
    }),
  };
}
