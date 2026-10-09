// Petites adresses de l'app, sans session : l'heure du serveur (le verrou d'âge de l'app ne se fie pas à l'horloge du
// téléphone) et la version minimale de l'app (écran « mets à jour » quand un changement casserait les anciennes).
import type { Request, Response } from "express";

import { calculerClesPeriodes } from "../fonctions/dates/calculer-cles-periodes.ts";

/** Versions minimales de l'app par système (« 0.0.0 » : aucune mise à jour demandée) */
export type VersionMinimaleApp = { ios: string; android: string };

export type DependancesApp = {
  /** Lue au démarrage (demarrer.ts : SOS_MIAM_VERSION_MIN_IOS et SOS_MIAM_VERSION_MIN_ANDROID) ; absente : « 0.0.0 » */
  versionMinimale?: () => VersionMinimaleApp;
  /** Pour les tests : une fausse horloge */
  horloge?: () => number;
};

export function creerControleursApp({ versionMinimale = () => ({ ios: "0.0.0", android: "0.0.0" }), horloge = Date.now }: DependancesApp) {
  return {
    /** GET /app/temps → { ok, maintenant (ISO 8601, UTC), jourParis: "AAAA-MM-JJ" } */
    temps(_requete: Request, reponse: Response) {
      const maintenant = new Date(horloge());
      reponse.set("Cache-Control", "no-store").json({ ok: true, maintenant: maintenant.toISOString(), jourParis: calculerClesPeriodes(maintenant).jour });
    },

    /** GET /app/version → { ok, minimale: { ios, android } } : l'app compare elle-même avec sa version */
    version(_requete: Request, reponse: Response) {
      const { ios, android } = versionMinimale();
      reponse.set("Cache-Control", "no-cache").json({ ok: true, minimale: { ios, android } });
    },
  };
}
