// Ambassadeur certifié : la candidature depuis l'espace, appels à l'API, côté serveur uniquement. Réservé aux
// ambassadeurs validés (l'API répond 403 « ambassadeur-non-actif » sinon). L'IP du visiteur (X-IP-Visiteur) ne sert
// qu'aux limites. Contrat : apps/api/src/routes/comptes.ts ; décisions : docs/decisions.md, « Ambassadeur certifié ».
import { appelerApiComptes } from "~/services/comptes.server";
import type { CandidatureCertification, CertificationAmbassadeur, NouvelleCandidatureCertification } from "~/types/compte";

/** Le titre (ou null) et la dernière candidature envoyée (ou null : jamais, ou refusée et effacée 3 mois après). */
export function lireCertification(jeton: string, ip: string | null) {
  return appelerApiComptes<{ certifie: CertificationAmbassadeur | null; candidature: CandidatureCertification | null }>("/comptes/moi/certification", { jeton, ip });
}

/**
 * Envoie la candidature. Erreurs : champ-invalide (avec le champ), deja-certifie, candidature-existante (une en attente ;
 * après un refus, on peut recandidater tout de suite).
 */
export function envoyerCandidatureCertification(jeton: string, ip: string | null, candidature: NouvelleCandidatureCertification) {
  return appelerApiComptes<object>("/comptes/moi/certification", { methode: "POST", jeton, ip, corps: candidature });
}
