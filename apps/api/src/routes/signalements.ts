import { Router } from "express";

import { creerControleurSignalement } from "../controleurs/signalements.ts";
import { limiterRequetes } from "../middlewares/limiter-requetes.ts";
import type { ProtectionComptes } from "../middlewares/proteger-comptes.ts";
import { sessionFacultative } from "../middlewares/session-facultative.ts";
import type { SignalementRecu } from "../services/gestion/moderation.ts";
import type { JugeSignaleurPublication } from "../services/juge-signaleur-publication.ts";

/** POST /signalements : signaler une publication (10 signalements par personne toutes les 10 minutes). */
export function creerRoutesSignalements(
  enregistrer: (signalement: SignalementRecu) => Promise<void>,
  comptes: { protection: ProtectionComptes; jugerSignaleur: JugeSignaleurPublication } | null = null,
) {
  const routes = Router();
  const limite = limiterRequetes({ fenetre: 10 * 60 * 1000, maximum: 10 });
  const controleur = creerControleurSignalement(enregistrer, comptes?.jugerSignaleur ?? null);
  if (comptes) routes.post("/", limite, sessionFacultative(comptes.protection), controleur);
  else routes.post("/", limite, controleur);
  return routes;
}
