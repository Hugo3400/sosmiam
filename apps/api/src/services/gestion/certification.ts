// « Ambassadeur certifié » dans le logiciel de gestion (décidé le 9 octobre 2026, docs/decisions.md) : un titre à part,
// pas un palier, pour qui aide les lieux partenaires (ambassadeur, pro ou structure). Candidatures envoyées depuis
// l'espace (schéma : prisma/schema/certification.prisma), acceptées ou refusées ici ; le titre se retire ici aussi.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

const COMPTE = {
  id: true, prenom: true, email: true, emailVerifieLe: true, points: true, palier: true,
  ambassadeur: { select: { ville: true, quartier: true, statut: true, certifieLe: true, profilCertifie: true, structure: true } },
} as const;

/** Les candidatures d'un statut (« en-attente », « acceptee », « refusee » ; vide : toutes), avec le compte. */
export async function listerCandidaturesCertification(statut: string) {
  return baseDeDonnees.candidatureCertification.findMany({
    where: statut ? { statut } : {},
    orderBy: { creeLe: statut === "en-attente" ? "asc" : "desc" },
    take: 300,
    include: { compte: { select: COMPTE } },
  });
}

/** Les ambassadeurs certifiés aujourd'hui, du plus récent au plus ancien. */
export async function listerCertifies() {
  return baseDeDonnees.compte.findMany({
    where: { ambassadeur: { is: { certifieLe: { not: null } } } },
    orderBy: { ambassadeur: { certifieLe: "desc" } },
    select: { ...COMPTE, _count: { select: { missions: { where: { statut: "faite" } } } } },
  });
}

/**
 * Accepte une candidature : le compte devient certifié maintenant, avec le profil et la structure de sa candidature.
 * « introuvable » si elle n'est plus en attente ; « pas-ambassadeur » si la personne n'a plus de rôle d'ambassadeur.
 */
export async function accepterCertification(id: number, maintenant = new Date()) {
  const candidature = await baseDeDonnees.candidatureCertification.findFirst({
    where: { id, statut: "en-attente" },
    select: { compteId: true, profil: true, structure: true, compte: { select: { ambassadeur: { select: { compteId: true } } } } },
  });
  if (!candidature) return { etat: "introuvable" as const };
  if (!candidature.compte.ambassadeur) return { etat: "pas-ambassadeur" as const };
  const [{ count }] = await baseDeDonnees.$transaction([
    baseDeDonnees.candidatureCertification.updateMany({ where: { id, statut: "en-attente" }, data: { statut: "acceptee", reponduLe: maintenant } }),
    baseDeDonnees.ambassadeur.update({
      where: { compteId: candidature.compteId },
      data: { certifieLe: maintenant, profilCertifie: candidature.profil, structure: candidature.structure },
      select: { compteId: true },
    }),
  ]);
  return count > 0 ? { etat: "acceptee" as const, compteId: candidature.compteId } : { etat: "introuvable" as const };
}

export async function refuserCertification(id: number, maintenant = new Date()) {
  const { count } = await baseDeDonnees.candidatureCertification.updateMany({ where: { id, statut: "en-attente" }, data: { statut: "refusee", reponduLe: maintenant } });
  return count > 0;
}

/** Retire le titre (le compte reste ambassadeur, avec son palier) ; faux s'il n'était pas certifié. */
export async function retirerCertification(compteId: number) {
  const { count } = await baseDeDonnees.ambassadeur.updateMany({
    where: { compteId, certifieLe: { not: null } },
    data: { certifieLe: null, profilCertifie: null, structure: null },
  });
  return count > 0;
}
