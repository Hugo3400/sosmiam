// Inscription des téléphones aux notifications, pour l'app (route publique à monter quand l'app sortira) : le jeton
// donné par Apple ou Google, la plateforme, la ville choisie dans l'app et, si la personne est connectée, son compte.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

export type InscriptionAppareil = { jeton: string; plateforme: "ios" | "android"; ville: string | null; compteId: number | null };

/** Inscrit (ou rafraîchit) un téléphone : un même jeton n'existe qu'une fois, et redevient actif s'il revient. */
export async function inscrireAppareil({ jeton, plateforme, ville, compteId }: InscriptionAppareil) {
  await baseDeDonnees.appareilPush.upsert({
    where: { jeton },
    create: { jeton, plateforme, ville, compteId },
    update: { plateforme, ville, compteId, actif: true, vuLe: new Date() },
  });
}

/** Désinscrit un téléphone (la personne coupe les notifications dans l'app) : il est oublié tout de suite. */
export async function desinscrireAppareil(jeton: string) {
  const { count } = await baseDeDonnees.appareilPush.deleteMany({ where: { jeton } });
  return count > 0;
}
