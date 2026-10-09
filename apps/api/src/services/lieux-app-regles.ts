// Les lieux lus par l'app (GET /app/lieux) : contrat commun du service Prisma et de son double en mémoire.
import type { CarteLieu } from "../../../../packages/commun/src/types/carte.ts";
import type { LieuApi } from "../../../../packages/commun/src/types/lieu.ts";

/** Un rectangle de la carte de l'app (degrés) : seulement les lieux qui y ont leur position */
export type ZoneLieux = { nord: number; sud: number; ouest: number; est: number };

/** Au plus, par lecture : au-delà, l'app resserre sa zone (à quelques km, ta région) */
export const LIEUX_PAR_LECTURE = 1000;

export interface ServicesLieuxApp {
  /** Les lieux publiés (dans la zone si elle est donnée), au format de l'app, LIEUX_PAR_LECTURE au plus */
  listerLieux(zone: ZoneLieux | null, maintenant: Date): Promise<LieuApi[]>;
  /** Un lieu publié, ou null (absent, brouillon ou masqué) */
  lireLieu(id: number, maintenant: Date): Promise<LieuApi | null>;
  /**
   * La carte d'un lieu publié (avec l'alcool : c'est l'app qui le retire pour les moins de 18 ans, comme le site), avec
   * le moment exact de sa mise à jour ; null : lieu inconnu (absent, brouillon ou masqué)
   */
  lireCarte(id: number): Promise<{ carte: CarteLieu | null; majLe: string | null } | null>;
  /** Le lieu publié dont c'est le code du QR de vitrine (sosmiam.fr/l/<code>), ou null */
  trouverParCode(codePublic: string): Promise<number | null>;
}

/** Le code public d'un QR de vitrine : 8 caractères a-z et 2-9 (comme lireCodeScanne) */
export const FORME_CODE_PUBLIC = /^[a-z2-9]{8}$/;
