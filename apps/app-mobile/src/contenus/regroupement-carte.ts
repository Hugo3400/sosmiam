export type PointCarte = { id: number; latitude: number; longitude: number; prioritaire: boolean };

export type RegionCarte = { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number };

export type TailleCarte = { largeur: number; hauteur: number };

export type LieuSeulCarte = { id: number; latitude: number; longitude: number };

export type GroupeCarte = { cle: string; nombre: number; latitude: number; longitude: number; ids: number[]; devant?: boolean };

export type CarteRegroupee = { seuls: LieuSeulCarte[]; groupes: GroupeCarte[]; marge: number };

export const PLAFOND_MARQUEURS_CARTE = 160;

export const PLAFOND_PRIORITAIRES_CARTE = 60;

export const METRES_PAR_POINT_RUE = 0.8;

export const ECART_MARQUEURS_POINTS = 38;

export const ETENDUE_GROUPE_CARTE = 1;

export const ECART_FIXE_POINTS = 40;

export const DEMI_CADRE_LIEU_POINTS = 37;

export const DEPLACEMENT_MAX_BULLE_POINTS = 44;

export const PORTEE_LIEUX_BULLE_POINTS = 22;

export const DIAMETRE_MARQUEUR_POINTS = 40;

export const DIAMETRE_GROSSE_BULLE_POINTS = 44;

export const NOMBRE_GROSSE_BULLE = 100;

export const MARGE_VUE_CARTE = 0.25;

export const MARGE_CADRE_CARTE = 40;

export const METRES_PAR_DEGRE = 111_320;

export type PointProjete = { point: PointCarte; x: number; y: number };

export type AmasCarte = { membres: PointProjete[]; groupe: GroupeCarte; nord: number; sud: number; ouest: number; est: number };

export type EchelleCarte = { degresParPoint: number; cosLatitude: number; latitude: number; longitude: number };

export type EtageCarte = { cote: number; parZone: Map<string, AmasCarte[]>; parId: Map<number, AmasCarte> };

export type PreparationCarte = { projetes: PointProjete[]; parNiveau: Map<number, EtageCarte> };

export type PlaceEcran = { x: number; y: number };

export type MarqueurARelacher = PlaceEcran & { diametre: number; deplacementMax: number; ancre?: PlaceEcran };
