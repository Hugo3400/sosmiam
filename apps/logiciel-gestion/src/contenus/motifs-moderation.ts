// Les règles de la communauté, telles que les CGU les écrivent : le motif d'un contenu retiré, cité mot pour mot dans le
// message à l'auteur. Lues dans packages/commun (une seule liste pour l'API, le logiciel et l'app).
import { DETAILS_MOTIFS_MODERATION } from "../../../../packages/commun/src/contenus/motifs-moderation.ts";

export const MOTIFS_MODERATION: Record<string, { libelle: string; regle: string }> = DETAILS_MOTIFS_MODERATION;
