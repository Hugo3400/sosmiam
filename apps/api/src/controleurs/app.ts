// Petites adresses de l'app, sans session : l'heure du serveur (le verrou d'âge de l'app ne se fie pas à l'horloge du
// téléphone) et la version minimale de l'app (écran « mets à jour » quand un changement casserait les anciennes).
import type { Request, Response } from "express";

import { calculerJourParis } from "../../../../packages/commun/src/fonctions/temps/calculer-jour-paris.ts";
import { listerThemesDuJour } from "../../../../packages/commun/src/fonctions/themes-saison/lister-themes-du-jour.ts";
import { preparerThemeSaisonApi } from "../../../../packages/commun/src/fonctions/themes-saison/preparer-theme-saison-api.ts";
import { ENTETE_LANGUE } from "../../../../packages/commun/src/regles/langues.ts";
import { calculerClesPeriodes } from "../fonctions/dates/calculer-cles-periodes.ts";
import { lireLangueDemande } from "../middlewares/poser-langue.ts";

/** Versions minimales de l'app par système (« 0.0.0 » : aucune mise à jour demandée) */
export type VersionMinimaleApp = { ios: string; android: string };

export type DependancesApp = {
  /** Lue au démarrage (demarrer.ts : SOS_MIAM_VERSION_MIN_IOS et SOS_MIAM_VERSION_MIN_ANDROID) ; absente : « 0.0.0 » */
  versionMinimale?: () => VersionMinimaleApp;
  versionDerniere?: () => VersionMinimaleApp;
  /** Pour les tests : une fausse horloge */
  horloge?: () => number;
};

const SANS_VERSION = (): VersionMinimaleApp => ({ ios: "0.0.0", android: "0.0.0" });

export function creerControleursApp({ versionMinimale = SANS_VERSION, versionDerniere = SANS_VERSION, horloge = Date.now }: DependancesApp) {
  return {
    /** GET /app/temps → { ok, maintenant (ISO 8601, UTC), jourParis: "AAAA-MM-JJ" } */
    temps(_requete: Request, reponse: Response) {
      const maintenant = new Date(horloge());
      reponse.set("Cache-Control", "no-store").json({ ok: true, maintenant: maintenant.toISOString(), jourParis: calculerClesPeriodes(maintenant).jour });
    },

    /** GET /app/version → { ok, minimale: { ios, android }, derniere: { ios, android } } : l'app compare elle-même avec sa version */
    version(_requete: Request, reponse: Response) {
      const minimale = versionMinimale();
      const derniere = versionDerniere();
      reponse
        .set("Cache-Control", "no-cache")
        .json({ ok: true, minimale: { ios: minimale.ios, android: minimale.android }, derniere: { ios: derniere.ios, android: derniere.android } });
    },

    themes(requete: Request, reponse: Response) {
      const ville = typeof requete.query.ville === "string" && requete.query.ville.length <= 80 ? requete.query.ville : null;
      const jour = calculerJourParis(horloge());
      const langue = lireLangueDemande();
      const themes = listerThemesDuJour(jour, ville).map((theme) => preparerThemeSaisonApi(theme, langue));
      reponse.set("Cache-Control", "private, max-age=300").set("Vary", ENTETE_LANGUE).json({ ok: true, jour, themes });
    },
  };
}
