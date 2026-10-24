import { AsyncLocalStorage } from "node:async_hooks";
import type { NextFunction, Request, Response } from "express";

import { lireLangue } from "../../../../packages/commun/src/fonctions/langue/lire-langue.ts";
import { ENTETE_LANGUE, LANGUE_PAR_DEFAUT, type Langue } from "../../../../packages/commun/src/regles/langues.ts";

const langueDeLaDemande = new AsyncLocalStorage<Langue>();

export function poserLangue(requete: Request, _reponse: Response, suite: NextFunction): void {
  langueDeLaDemande.run(lireLangue(requete.get(ENTETE_LANGUE)) ?? LANGUE_PAR_DEFAUT, suite);
}

export const lireLangueDemande = (): Langue => langueDeLaDemande.getStore() ?? LANGUE_PAR_DEFAUT;
