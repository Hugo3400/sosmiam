import type { DomaineOffreCarriere, StatutCandidature, TypeOffreCarriere } from "../../../../packages/commun/src/types/carriere.ts";

export const TYPES_OFFRE: { valeur: TypeOffreCarriere; libelle: string }[] = [
  { valeur: "benevolat", libelle: "Bénévolat" },
  { valeur: "freelance", libelle: "Freelance ou mission" },
];

export const DOMAINES_OFFRE: { valeur: DomaineOffreCarriere; libelle: string }[] = [
  { valeur: "moderation", libelle: "Modération" },
  { valeur: "reseaux-sociaux", libelle: "Réseaux sociaux" },
  { valeur: "graphisme", libelle: "Graphisme et illustration" },
  { valeur: "video", libelle: "Vidéo et montage" },
  { valeur: "developpement", libelle: "Développement" },
  { valeur: "autre", libelle: "Autre" },
];

export const STATUTS_CANDIDATURE: { valeur: StatutCandidature; libelle: string }[] = [
  { valeur: "nouvelle", libelle: "Nouvelle" },
  { valeur: "lue", libelle: "Lue" },
  { valeur: "retenue", libelle: "Retenue" },
  { valeur: "non-retenue", libelle: "Non retenue" },
];
