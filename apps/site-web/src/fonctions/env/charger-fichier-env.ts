import { existsSync } from "node:fs";
import { join } from "node:path";

let fichierLu = false;

/**
 * Complète une fois l'environnement par le fichier apps/site-web/.env s'il existe (jamais commité) : les variables déjà
 * posées gardent leur valeur. Côté serveur seulement.
 */
export function chargerFichierEnv(): void {
  if (fichierLu) return;
  fichierLu = true;
  const fichier = join(process.cwd(), ".env");
  if (!existsSync(fichier)) return;
  try {
    process.loadEnvFile(fichier);
  } catch {
    console.error("Site : le fichier .env n'a pas pu être lu");
  }
}
