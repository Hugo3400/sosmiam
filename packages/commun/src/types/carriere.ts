export type TypeOffreCarriere = "benevolat" | "freelance";

export type DomaineOffreCarriere = "moderation" | "reseaux-sociaux" | "graphisme" | "video" | "developpement" | "autre";

export type OffreCarriere = {
  id: string;
  titre: string;
  type: TypeOffreCarriere;
  domaine: DomaineOffreCarriere;
  resume: string;
  description: string;
  missions: string[];
  profil: string[];
  enEchange: string[];
  lieu: string;
  publieeLe: string;
};

export type NouvelleCandidature = {
  nom: string;
  email: string;
  message: string;
  lien: string | null;
  majeur: true;
  cv: { nomFichier: string; base64: string } | null;
};

export type StatutCandidature = "nouvelle" | "lue" | "retenue" | "non-retenue";

export type CandidatureGestion = {
  id: string;
  offreId: string;
  offreTitre: string;
  nom: string;
  email: string;
  message: string;
  lien: string | null;
  aUnCv: boolean;
  statut: StatutCandidature;
  creeLe: string;
  effaceeLe: string;
};

export type DonneesOffreCarriere = {
  titre: string;
  type: TypeOffreCarriere;
  domaine: DomaineOffreCarriere;
  resume: string;
  description: string;
  missions: string[];
  profil: string[];
  enEchange: string[];
  lieu: string;
};

export type OffreCarriereGestion = DonneesOffreCarriere & {
  id: string;
  publieeLe: string | null;
  fermeeLe: string | null;
  creeLe: string;
  modifieLe: string;
  candidatures: number;
  nouvelles: number;
};
