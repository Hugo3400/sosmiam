// « Prévenir un pote » (Miam Safe) côté serveur : formes et contrat des services (Prisma : partages-miam-safe.ts ; double en
// mémoire : partages-miam-safe-en-memoire.ts). Une personne qui ne se sent pas en sécurité dans un lieu prévient un pote de
// sa bande et lui montre sa position pendant 1 heure, arrêtable à tout moment. La position est chiffrée dans la base,
// effacée dès l'arrêt ou la fin de l'heure, et jamais écrite dans un journal ; la ligne entière disparaît la nuit suivante
// (effacerMiamSafeAncien, services/gestion/miam-safe.ts).
import { DUREE_PARTAGE_POSITION_MINUTES } from "../../../../packages/commun/src/regles/miam-safe.ts";
import type { PositionMiamSafe } from "../../../../packages/commun/src/types/miam-safe.ts";

export type { PositionMiamSafe };

/** Un partage dure 1 heure à partir du moment où l'on prévient le pote */
export const DUREE_PARTAGE_MS = DUREE_PARTAGE_POSITION_MINUTES * 60_000;

/** Un partage tel que la base le garde ; position : null s'il n'y en a pas, ou si le partage est fini (elle est alors effacée) */
export type LignePartage = {
  id: number;
  /** La personne qui partage */
  compteId: number;
  /** Le pote qui voit */
  poteId: number;
  lieu: { id: number; nom: string } | null;
  /** Interrupteur « Partager ma position pendant 1 h » : faux, aucune position n'est jamais acceptée */
  avecPosition: boolean;
  position: (PositionMiamSafe & { le: Date }) | null;
  creeLe: Date;
  expireLe: Date;
  arreteLe: Date | null;
};

/** Ni arrêté, ni passé l'heure */
export function estPartageActif(ligne: Pick<LignePartage, "expireLe" | "arreteLe">, maintenant: Date): boolean {
  return ligne.arreteLe === null && ligne.expireLe.getTime() > maintenant.getTime();
}

export interface ServicesPartagesMiamSafe {
  /**
   * Nouveau partage pour 1 heure, depuis un lieu publié (« lieu-inconnu » sinon). Un partage encore en cours vers le même
   * pote s'arrête (sa position est effacée) : on garde un seul partage par pote. Sans la clé des données, le partage se crée
   * sans position (partage.position vaut null : l'app le dit).
   */
  creer(
    partage: { compteId: number; poteId: number; lieuId: number; avecPosition: boolean; position: PositionMiamSafe | null },
    maintenant: Date,
  ): Promise<{ ok: true; partage: LignePartage } | { ok: false; erreur: "lieu-inconnu" }>;
  /**
   * Seulement la personne qui partage ; « inconnu » : pas le sien ; « termine » : arrêté ou l'heure passée ;
   * « indisponible » : la clé des données manque, la position ne peut pas être gardée chiffrée ; « sans-position » : la
   * personne a choisi de ne pas partager sa position
   */
  envoyerPosition(id: number, compteId: number, position: PositionMiamSafe, maintenant: Date): Promise<"ok" | "inconnu" | "termine" | "indisponible" | "sans-position">;
  /** Seulement la personne qui partage ; efface la position. false : pas le sien. Déjà fini : true quand même */
  arreter(id: number, compteId: number, maintenant: Date): Promise<boolean>;
  /** Un partage (null : inconnu ou déjà effacé) ; qui a le droit de le voir est vérifié par le contrôleur */
  lire(id: number, maintenant: Date): Promise<LignePartage | null>;
  /** Les partages en cours de ce compte, envoyés et reçus, les plus récents d'abord */
  listerActifs(compteId: number, maintenant: Date): Promise<LignePartage[]>;
}
