import { AsyncLocalStorage } from "node:async_hooks";
import type { NextFunction, Request, Response } from "express";

import { estAncienneApp } from "../fonctions/social/est-ancienne-app.ts";
import type { AppCliente } from "../services/messagerie-regles.ts";

const demandeEnCours = new AsyncLocalStorage<AppCliente>();

/**
 * L'app qui fait la demande, retenue pour toute la demande : une app d'avant la 1.0.2 n'envoie pas X-Version-App. Lu par la
 * présentation des messages et les compteurs (lireAppCliente) ; hors d'une demande (tâches, essais directs), l'app récente
 */
export function poserAppCliente(requete: Request, _reponse: Response, suite: NextFunction): void {
  demandeEnCours.run({ ancienneApp: estAncienneApp(requete.get("X-Version-App")) }, suite);
}

export const lireAppCliente = (): AppCliente => demandeEnCours.getStore() ?? {};
