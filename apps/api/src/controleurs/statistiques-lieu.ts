// Statistiques d'un lieu pour son équipe (voir routes/comptoir.ts) : par semaine de Paris, les vues de sa fiche dans l'app,
// les rescousses reçues, les visites validées et les nouveaux clients. Le gérant et l'équipe les voient (roleDe : rattachement
// validé ET 18 ans, comme le reste du comptoir).
import type { Request, Response } from "express";

import { calculerInstantParis } from "../../../../packages/commun/src/fonctions/temps/calculer-instant-paris.ts";
import type { StatistiquesLieu } from "../../../../packages/commun/src/types/statistiques-lieu.ts";
import { listerPeriodes } from "../fonctions/dates/lister-periodes.ts";
import { calculerStatistiquesSemaines } from "../fonctions/statistiques/calculer-statistiques-semaines.ts";
import { lireNombreSemaines } from "../fonctions/statistiques/lire-nombre-semaines.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { RoleRattachement } from "../services/pro-regles.ts";
import type { ServicesStatistiquesLieu } from "../services/statistiques-lieu-regles.ts";
import { lireCompteId } from "./comptes-champs.ts";
import { champInvalide } from "./visites.ts";

/** Les `nombre` dernières semaines du lieu, celle en cours comprise, de la plus récente à la plus ancienne */
async function lireStatistiques(services: ServicesStatistiquesLieu, lieuId: number, nombre: number, maintenant: Date): Promise<StatistiquesLieu> {
  const periodes = listerPeriodes("semaine", nombre, maintenant);
  const premiere = periodes[0]!;
  const derniere = periodes[periodes.length - 1]!;
  // Le lundi de la plus ancienne semaine, à minuit heure de Paris (jamais un soir de changement d'heure, qui se fait à 2 h)
  const depuis = new Date(calculerInstantParis(premiere.debut, "00:00"));
  const [vues, rescousses, validations, premieresValidations] = await Promise.all([
    services.listerVues(lieuId, premiere.debut, derniere.fin),
    services.compterRescousses(lieuId, periodes.map((p) => p.cle)),
    services.listerValidations(lieuId, depuis),
    services.listerPremieresValidations(lieuId, depuis),
  ]);
  return { semaines: calculerStatistiquesSemaines(periodes, { vues, rescousses, validations, premieresValidations }) };
}

export function creerControleursStatistiques(
  services: ServicesStatistiquesLieu,
  roleDe: (compteId: number, lieuId: number) => Promise<RoleRattachement | null>,
  horloge: () => number,
) {
  return {
    /** GET /pro/comptoir/lieux/:id/statistiques?semaines=1..26 (8 par défaut) */
    async lire(requete: Request, reponse: Response) {
      const lieuId = lireIdentifiant(requete.params.id);
      if (lieuId === null) return champInvalide(reponse, "id");
      if (!(await roleDe(lireCompteId(reponse), lieuId))) return reponse.status(403).json({ ok: false, erreur: "role-requis" });
      const nombre = lireNombreSemaines(requete.query.semaines);
      if (nombre === null) return champInvalide(reponse, "semaines");
      reponse.json({ ok: true, ...(await lireStatistiques(services, lieuId, nombre, new Date(horloge()))) });
    },
  };
}
