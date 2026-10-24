import { statfs } from "node:fs/promises";

import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { creerSanteComplete } from "./sante-complete.ts";
import { listerSauvegardes } from "./sauvegardes.ts";

export const lireSanteComplete = creerSanteComplete({
  verifierBase: () => baseDeDonnees.$queryRaw`SELECT 1`,
  lireDisqueLibre: async () => {
    const infos = await statfs("/");
    return infos.blocks > 0 ? infos.bavail / infos.blocks : 0;
  },
  lireDerniereSauvegarde: async () => {
    const [derniere] = await listerSauvegardes();
    return derniere ? Date.parse(derniere.creeLe) : null;
  },
});
