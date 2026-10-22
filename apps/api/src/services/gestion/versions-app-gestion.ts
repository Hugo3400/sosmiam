import { existsSync } from "node:fs";
import { rename, writeFile } from "node:fs/promises";

import { lireVersionApp } from "../../fonctions/texte/lire-version-app.ts";
import { creerVersionsApp, FICHIER_VERSIONS_APP, type VersionsApp } from "../versions-app.ts";

const PAR_DEFAUT: VersionsApp = {
  minimale: { ios: lireVersionApp(process.env.SOS_MIAM_VERSION_MIN_IOS), android: lireVersionApp(process.env.SOS_MIAM_VERSION_MIN_ANDROID) },
  derniere: { ios: lireVersionApp(process.env.SOS_MIAM_VERSION_DERNIERE_IOS), android: lireVersionApp(process.env.SOS_MIAM_VERSION_DERNIERE_ANDROID) },
};

export function creerVersionsAppGestion(fichier = FICHIER_VERSIONS_APP, parDefaut = PAR_DEFAUT) {
  const lecteur = creerVersionsApp(fichier, parDefaut);
  return {
    lireVersionsApp: async () => ({ minimale: lecteur.minimale(), derniere: lecteur.derniere(), fichier: existsSync(fichier) }),
    ecrireVersionsApp: async (versions: VersionsApp, maintenant = new Date()) => {
      const provisoire = `${fichier}.${process.pid}.tmp`;
      await writeFile(provisoire, `${JSON.stringify({ ...versions, modifieLe: maintenant.toISOString() }, null, 2)}\n`, { mode: 0o644 });
      await rename(provisoire, fichier);
    },
  };
}

const versionsAppGestion = creerVersionsAppGestion();
export const lireVersionsAppGestion = versionsAppGestion.lireVersionsApp;
export const ecrireVersionsAppGestion = versionsAppGestion.ecrireVersionsApp;
