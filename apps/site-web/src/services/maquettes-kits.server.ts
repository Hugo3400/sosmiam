// Les maquettes des kits médias (contenus/maquettes-kits.ts) : lues dans presse/, à la racine du dépôt. Seuls les fichiers
// de la liste d'un kit sont lus : le nom demandé y est cherché, jamais utilisé comme chemin (aucun « .. » possible).
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";

import {
  DOSSIER_PRESSE, listerMaquettesKit, trouverFichierMaquette, zipsMaquettes, type FichierMaquette, type KitMaquettes,
} from "~/contenus/maquettes-kits";

const nombres = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
/** « 160 Ko », « 1,1 Mo » : comme les autres fichiers des kits */
const ecrirePoids = (octets: number) => (octets < 1_000_000 ? `${Math.max(1, Math.round(octets / 1000))} Ko` : `${nombres.format(octets / 1_000_000)} Mo`);

/** Le site est toujours lancé depuis apps/site-web (npm run dev, et npm run start pour pm2) : presse/ est deux dossiers au-dessus */
const cheminPresse = (chemin: string) => join(process.cwd(), DOSSIER_PRESSE, chemin);

/** Un fichier de maquette que ce kit peut servir, et son contenu ; null : pas dans la liste, ou absent du disque */
export async function lireFichierMaquette(kit: KitMaquettes, nom: string): Promise<{ fichier: FichierMaquette; contenu: Buffer } | null> {
  const fichier = trouverFichierMaquette(kit, nom);
  const contenu = fichier ? await readFile(cheminPresse(fichier.chemin)).catch(() => null) : null;
  return fichier && contenu ? { fichier, contenu } : null;
}

/** Le poids de chaque fichier de maquette d'un kit, par nom (null : absent du disque, le bouton le dira) */
export async function lirePoidsMaquettes(kit: KitMaquettes, miamSafe: boolean): Promise<Record<string, string | null>> {
  const fichiers = [
    ...listerMaquettesKit(kit, miamSafe).flatMap((m) => m.fichiers),
    ...zipsMaquettes.filter((z) => z.kit === kit).map((z) => z.fichier),
  ];
  const lus = await Promise.all(fichiers.map(async (f) => {
    const infos = await stat(cheminPresse(f.chemin)).catch(() => null);
    return [f.nom, infos ? ecrirePoids(infos.size) : null] as const;
  }));
  return Object.fromEntries(lus);
}
