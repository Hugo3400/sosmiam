// Mises à jour automatiques du logiciel (module « updater » de Tauri). Le manifeste et l'installateur ne sont servis
// qu'avec un jeton de 15 minutes, obtenu par une demande signée : personne d'autre ne peut récupérer le logiciel.
import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { check, type Update } from "@tauri-apps/plugin-updater";

import { noterMiseAJourInstallee } from "~/stockage/nouveautes.ts";
import { appeler } from "./client-gestion.ts";

export type MiseAJour = { version: string; notes: string | null; installer: (progression: (pourcentage: number) => void) => Promise<void> };

/** Version installée (null dans un navigateur, en développement). */
export const lireVersion = () => (isTauri() ? getVersion() : Promise.resolve(null));

/** Cherche une nouvelle version. Null s'il n'y en a pas (ou hors du logiciel installé). */
export async function chercherMiseAJour(): Promise<MiseAJour | null> {
  if (!isTauri()) return null;
  const { jeton } = await appeler<{ jeton: string }>("GET", "/maj/jeton");
  const entetes = { "X-Jeton-Maj": jeton };
  const miseAJour: Update | null = await check({ headers: entetes, timeout: 20_000 });
  if (!miseAJour) return null;
  return {
    version: miseAJour.version,
    notes: miseAJour.body ?? null,
    installer: async (progression) => {
      noterMiseAJourInstallee({ version: miseAJour.version, notes: miseAJour.body ?? null });
      let total = 0;
      let recu = 0;
      // L'installateur se lance ensuite tout seul : le logiciel se ferme, puis se rouvre à jour
      await miseAJour.downloadAndInstall((evenement) => {
        if (evenement.event === "Started") total = evenement.data.contentLength ?? 0;
        if (evenement.event === "Progress") {
          recu += evenement.data.chunkLength;
          if (total) progression(Math.round((recu / total) * 100));
        }
      }, { headers: entetes, timeout: 300_000 });
    },
  };
}
