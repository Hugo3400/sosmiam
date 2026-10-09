// Candidature au titre d'« ambassadeur certifié » (docs/decisions.md, « Ambassadeur certifié »), envoyée depuis l'espace
// par un ambassadeur validé (« actif »). L'équipe répond dans le logiciel de gestion ; ici, seulement ce que la personne
// lit et envoie. Une candidature refusée est effacée 3 mois après la réponse (services/menage-comptes.ts).
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

/** « Tu es plutôt… » : un ambassadeur qui aime aider les lieux, un pro ou une structure (asso, mairie…) */
export type ProfilCertifie = "ambassadeur" | "pro" | "structure";

export type StatutCandidatureCertification = "en-attente" | "acceptee" | "refusee";

/** Le titre tel que la personne le voit (null : pas certifiée). `profil` est null seulement si l'équipe ne l'a pas noté. */
export type CertifieVue = { depuis: string; profil: ProfilCertifie | null; structure: string | null };

/** Sa dernière candidature, telle que la base la garde (dates en ISO 8601, envies en liste) */
export type CandidatureCertificationBrute = {
  statut: StatutCandidatureCertification;
  profil: ProfilCertifie;
  structure: string | null;
  communeCode: string;
  envies: string[];
  creeLe: string;
  reponduLe: string | null;
};

export type NouvelleCandidatureCertification = {
  profil: ProfilCertifie;
  structure: string | null;
  /** Code INSEE de la commune (celui de la commune, pas d'un arrondissement) */
  communeCode: string;
  /** Comment la personne aide déjà les lieux (600 caractères au plus) */
  aide: string;
  /** Parmi « fiche », « photos », « presenter », « big-sos » (liste : controleurs/comptes-certification.ts) */
  envies: string[];
  /** Toujours vrai : la case est obligatoire */
  engagementGratuit: true;
};

/** Candidature enregistrée, ou pourquoi elle ne l'est pas */
export type ResultatCandidatureCertification = "ok" | "deja-certifie" | "candidature-existante";

/** Le titre d'après les colonnes de la fiche d'ambassadeur (certifieLe null : pas certifié). */
export function decrireCertifie(certifieLe: Date | null, profilCertifie: string | null, structure: string | null): CertifieVue | null {
  if (!certifieLe) return null;
  return { depuis: certifieLe.toISOString(), profil: (profilCertifie as ProfilCertifie | null) ?? null, structure };
}

/** Sa dernière candidature au titre de certifié, ou null (jamais envoyée, ou refusée puis effacée). */
export async function lireCandidatureCertification(compteId: number): Promise<CandidatureCertificationBrute | null> {
  const candidature = await baseDeDonnees.candidatureCertification.findFirst({
    where: { compteId },
    orderBy: [{ creeLe: "desc" }, { id: "desc" }],
    select: { statut: true, profil: true, structure: true, communeCode: true, envies: true, creeLe: true, reponduLe: true },
  });
  if (!candidature) return null;
  return {
    ...candidature,
    statut: candidature.statut as StatutCandidatureCertification,
    profil: candidature.profil as ProfilCertifie,
    envies: candidature.envies.split(",").filter(Boolean),
    creeLe: candidature.creeLe.toISOString(),
    reponduLe: candidature.reponduLe?.toISOString() ?? null,
  };
}

/**
 * Enregistre la candidature, sauf si la personne est déjà certifiée ou en a une en attente. Après un refus (ou un titre
 * retiré), elle peut recandidater tout de suite.
 */
export async function creerCandidatureCertification(
  compteId: number, { envies, ...candidature }: NouvelleCandidatureCertification,
): Promise<ResultatCandidatureCertification> {
  return baseDeDonnees.$transaction(async (transaction) => {
    const ambassadeur = await transaction.ambassadeur.findUnique({ where: { compteId }, select: { certifieLe: true } });
    if (ambassadeur?.certifieLe) return "deja-certifie";
    const enAttente = await transaction.candidatureCertification.count({ where: { compteId, statut: "en-attente" } });
    if (enAttente > 0) return "candidature-existante";
    await transaction.candidatureCertification.create({ data: { ...candidature, compteId, envies: envies.join(",") } });
    return "ok";
  });
}
