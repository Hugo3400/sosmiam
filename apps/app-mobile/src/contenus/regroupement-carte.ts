export type PointCarte = { id: number; latitude: number; longitude: number; prioritaire: boolean };

export type RegionCarte = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };

export type TailleCarte = { largeur: number; hauteur: number };

export type LieuSeulCarte = { id: number; latitude: number; longitude: number };

export type GroupeCarte = { cle: string; nombre: number; latitude: number; longitude: number; ids: number[] };

export type CarteRegroupee = { seuls: LieuSeulCarte[]; groupes: GroupeCarte[] };

export const PLAFOND_MARQUEURS_CARTE = 160;

export const PLAFOND_PRIORITAIRES_CARTE = 60;

export const SEUIL_SANS_GROUPE_CARTE = 120;

export const METRES_PAR_POINT_RUE = 0.8;

export const CELLULE_GROUPE_POINTS = 64;

export const MARGE_VUE_CARTE = 0.5;

export const METRES_PAR_DEGRE = 111_320;
