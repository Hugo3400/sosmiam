// Inscription des téléphones aux notifications, pour l'app (PUT/DELETE /app/appareils) : le jeton donné par Apple ou Google, la
// plateforme, la ville choisie dans l'app et, si la personne est connectée, son compte et la session qui l'a inscrit. Quand cette
// session se ferme, la base remet sessionId à null : le téléphone ne reçoit plus rien du compte (prevenirCompte).
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

export type InscriptionAppareil = {
  jeton: string; plateforme: "ios" | "android"; ville: string | null; offres: boolean; compteId: number | null;
  /** Empreinte SHA-256 du jeton de la session valable qui inscrit le téléphone (jamais le jeton), ou null sans session */
  empreinteSession: string | null;
};

/** Clé étrangère qui ne mène plus à rien (Prisma P2003) : ici, la session fermée entre la lecture et l'écriture */
const estCleEtrangereManquante = (erreur: unknown) => typeof erreur === "object" && erreur !== null && "code" in erreur && erreur.code === "P2003";

/**
 * Inscrit (ou rafraîchit) un téléphone : un même jeton n'existe qu'une fois, et redevient actif s'il revient. Avec une session,
 * il y est lié (sessionId) ; sans session, il est détaché (compteId et sessionId à null).
 */
export async function inscrireAppareil({ jeton, plateforme, ville, compteId, empreinteSession }: InscriptionAppareil) {
  const session = compteId !== null && empreinteSession
    ? await baseDeDonnees.sessionCompte.findFirst({ where: { empreinte: empreinteSession, compteId }, select: { id: true } })
    : null;
  const ecrire = (sessionId: number | null) => baseDeDonnees.appareilPush.upsert({
    where: { jeton },
    create: { jeton, plateforme, ville, compteId, sessionId },
    update: { plateforme, ville, compteId, sessionId, actif: true, vuLe: new Date() },
  });
  try {
    await ecrire(session?.id ?? null);
  } catch (erreur) {
    // La session vient de se fermer : le téléphone reste inscrit au compte, mais détaché, comme si elle s'était fermée après
    if (!session || !estCleEtrangereManquante(erreur)) throw erreur;
    await ecrire(null);
  }
}

/** Désinscrit un téléphone (la personne coupe les notifications dans l'app) : il est oublié tout de suite. */
export async function desinscrireAppareil(jeton: string) {
  const { count } = await baseDeDonnees.appareilPush.deleteMany({ where: { jeton } });
  return count > 0;
}
