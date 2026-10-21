export type CibleSignalementSecurite = "site" | "espaces" | "api" | "app-ios" | "app-android";

export type StatutSignalementSecurite = "nouveau" | "en-cours" | "corrige" | "non-retenu" | "doublon";

export type GraviteSignalementSecurite = "critique" | "haute" | "moyenne" | "basse";

export type ImageSignalementSecurite = { nomFichier: string; base64: string };

export type NouveauSignalementSecurite = {
  nom: string;
  email: string;
  cible: CibleSignalementSecurite;
  titre: string;
  description: string;
  lien: string | null;
  majeur: true;
  reglesAcceptees: true;
  nomTableauHonneur: string | null;
  images: ImageSignalementSecurite[];
};

export type EntreeTableauHonneur = { nom: string; mois: string };

export type SignalementSecuriteGestion = {
  id: string;
  nom: string;
  email: string;
  cible: CibleSignalementSecurite;
  titre: string;
  description: string;
  lien: string | null;
  nomTableauHonneur: string | null;
  auTableauHonneur: boolean;
  images: number;
  statut: StatutSignalementSecurite;
  gravite: GraviteSignalementSecurite | null;
  compteTrouve: boolean;
  badgeDonne: boolean;
  creeLe: string;
  clotureLe: string | null;
  effaceLe: string | null;
};

export type ChangementsSignalementSecurite = {
  statut?: StatutSignalementSecurite;
  gravite?: GraviteSignalementSecurite | null;
  auTableauHonneur?: boolean;
};
