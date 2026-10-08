import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { calculerPalierAuxPoints } from "../fonctions/ambassadeurs/calculer-palier-aux-points.ts";
import { calculerEmpreinteJeton } from "../fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../fonctions/securite/creer-jeton.ts";

// Comptes SOS Miam (espace ambassadeur du site, puis l'app). Les fonctions ci-dessous servent aussi au logiciel de
// gestion (services/gestion) : la logique des points, des badges et des réinitialisations reste à un seul endroit.

export type PalierCompte = "curieux" | "denicheur" | "ambassadeur-quartier" | "ambassadeur-ville";

/**
 * Codes du barème (docs/decisions.md, packages/commun/src/regles/ambassadeurs.ts), plus « defi » et « equipe »
 * (ajout ou retrait à la main depuis le logiciel de gestion).
 */
export type RaisonPoints =
  | "visite" | "visite-sos" | "avis-photo" | "proposer-lieu" | "corriger-fiche" | "premier-sauveteur" | "rescousse" | "defi" | "equipe";

/** Durée de validité d'un lien de réinitialisation préparé par l'équipe (24 h au plus : CNIL, OWASP) */
const DUREE_REINITIALISATION = 24 * 3600_000;

/**
 * Ajoute (ou retire, si négatif) des points : journal, total et palier changent ensemble. Le total ne descend jamais
 * sous 0. Le palier suit les points, sauf « ambassadeur-ville », qui ne se donne et ne se retire qu'à la main.
 */
export async function ajouterPoints(compteId: number, points: number, raison: RaisonPoints, detail?: string): Promise<{ points: number; palier: PalierCompte }> {
  return baseDeDonnees.$transaction(async (transaction) => {
    await transaction.journalPoints.create({ data: { compteId, points, raison, detail: detail?.slice(0, 200) || null } });
    const apres = await transaction.compte.update({ where: { id: compteId }, data: { points: { increment: points } } });
    const total = Math.max(0, apres.points);
    const palier: PalierCompte = apres.palier === "ambassadeur-ville" ? "ambassadeur-ville" : calculerPalierAuxPoints(total);
    if (total !== apres.points || palier !== apres.palier) {
      await transaction.compte.update({ where: { id: compteId }, data: { points: total, palier } });
    }
    return { points: total, palier };
  });
}

/** Donne un badge (« premier-sauveteur », « deniche-par-toi », « fondateur »…). Renvoie true s'il est nouveau. */
export async function donnerBadge(compteId: number, badge: string): Promise<boolean> {
  const { count } = await baseDeDonnees.badgeCompte.createMany({ data: [{ compteId, badge }], skipDuplicates: true });
  return count === 1;
}

/** Nomme quelqu'un « Ambassadeur de ville » (sur candidature ou invitation, jamais aux points). */
export async function nommerAmbassadeurVille(compteId: number): Promise<void> {
  await baseDeDonnees.compte.update({ where: { id: compteId }, data: { palier: "ambassadeur-ville" } });
}

/** Retire « Ambassadeur de ville » : le compte retrouve le palier de ses points. */
export async function retirerAmbassadeurVille(compteId: number): Promise<PalierCompte> {
  const compte = await baseDeDonnees.compte.findUniqueOrThrow({ where: { id: compteId }, select: { points: true } });
  const palier = calculerPalierAuxPoints(compte.points);
  await baseDeDonnees.compte.update({ where: { id: compteId }, data: { palier } });
  return palier;
}

/**
 * Prépare une réinitialisation du mot de passe (demandée par mail à l'équipe, tant que le site n'envoie pas de mails).
 * Renvoie le jeton UNE seule fois, pour le lien https://ambassadeur.sosmiam.fr/nouveau-mot-de-passe#jeton=… (après un « # »,
 * le jeton n'est jamais envoyé au serveur, donc jamais écrit dans les journaux) ; la base n'en garde que l'empreinte,
 * valable 24 h. Un nouveau lien remplace le précédent.
 */
export async function preparerReinitialisation(compteId: number): Promise<{ jeton: string; expireLe: Date }> {
  const jeton = creerJeton();
  const expireLe = new Date(Date.now() + DUREE_REINITIALISATION);
  await baseDeDonnees.compte.update({
    where: { id: compteId },
    data: { jetonReinitialisation: calculerEmpreinteJeton(jeton), jetonExpireLe: expireLe },
  });
  return { jeton, expireLe };
}
