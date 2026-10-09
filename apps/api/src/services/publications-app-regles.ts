// Le fil « Pour toi » lu par l'app (GET /app/publications, /app/medias/:fichier) : contrat commun du service Prisma et de
// son double en mémoire. Une publication est visible quand elle est publiée, pas suspendue, que sa date est passée et que
// son lieu est publié ; un lieu ne publie lui-même que s'il est vérifié (docs/decisions.md, « Lieux vérifiés »).
import type { PublicationApi } from "../../../../packages/commun/src/types/publication.ts";

/** Une page du fil, au plus */
export const PUBLICATIONS_PAR_PAGE_MAX = 30;
export const PUBLICATIONS_PAR_PAGE = 20;

/** Où reprendre le fil : la date de mise en ligne et l'id de la dernière publication reçue (de la plus récente à la plus ancienne) */
export type CurseurFil = { publieeLe: Date; id: number };

export type PageFil = { publications: PublicationApi[]; /** Curseur de la page suivante, null : c'était la dernière */ suite: CurseurFil | null };

export interface ServicesPublicationsApp {
  /** Une page du fil, après `apres` (null : depuis le début), `limite` publications au plus */
  lister(apres: CurseurFil | null, limite: number, maintenant: Date): Promise<PageFil>;
  /** Le type d'un fichier de média d'une publication visible ; null : inconnu, ou publication invisible (jamais servi) */
  lireMedia(fichier: string, maintenant: Date): Promise<{ typeMime: string } | null>;
}

/** Les noms de fichiers des médias (tirés au hasard par la gestion) : rien d'autre n'est cherché sur le disque */
export const FORME_FICHIER_MEDIA = /^[0-9a-f-]{36}\.[a-z0-9]{2,4}$/;
