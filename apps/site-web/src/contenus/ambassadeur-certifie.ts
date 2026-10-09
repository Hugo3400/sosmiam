// Ambassadeur certifié (docs/decisions.md, « Ambassadeur certifié », validé par Hugo le 9 octobre 2026) : les choix du
// formulaire de candidature de /espace/certification, avec les mêmes codes que l'API (POST /comptes/moi/certification).
// La présentation (qui, comment, ce qu'on a de plus) est dans programme-ambassadeur.ts, partagée avec /programme.
import type { EnvieCertification, ProfilCertifie } from "~/types/compte";

/** « Tu es plutôt… » */
export const profilsCertifie: { valeur: ProfilCertifie; libelle: string }[] = [
  { valeur: "ambassadeur", libelle: "Un ambassadeur qui aime aider les lieux" },
  { valeur: "pro", libelle: "Un pro (resto, commerce…)" },
  { valeur: "structure", libelle: "Une structure (asso, mairie, office de tourisme, école…)" },
];

/** « Ce que tu aimerais faire » */
export const enviesCertification: { valeur: EnvieCertification; libelle: string }[] = [
  { valeur: "fiche", libelle: "Aider un lieu à remplir sa fiche" },
  { valeur: "photos", libelle: "Faire de belles photos" },
  { valeur: "presenter", libelle: "Présenter SOS Miam aux lieux du coin" },
  { valeur: "big-sos", libelle: "Donner un coup de main pendant un BIG SOS" },
];

/** La case obligatoire (engagementGratuit) */
export const engagementCertifie = "J'ai compris : je ne suis jamais payé par un lieu (sinon j'écris « Collaboration commerciale »)";

/** Longueurs maximales, les mêmes que l'API */
export const AIDE_MAX = 600;
export const STRUCTURE_MAX = 100;
