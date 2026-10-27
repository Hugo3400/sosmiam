import type { MotifModeration } from "../../../../packages/commun/src/contenus/motifs-moderation.ts";
import type { ActusARelire, ArticleARelire, CommentaireActusSignale, ReponseLieuARelire } from "../../../../packages/commun/src/types/actus.ts";
import { appeler } from "./client-gestion.ts";

export type { ArticleARelire, CommentaireActusSignale, ReponseLieuARelire };

export type PublicationActus = { aLaUne: boolean; alcool: boolean };

export type RefusActus = { motif: MotifModeration; motivation: string };

export const lireFileActus = () => appeler<ActusARelire>("GET", "/actus");
export const publierArticleActus = (id: number, publication: PublicationActus) => appeler<{ ok: true }>("POST", `/actus/${id}/publier`, { corps: publication });
export const retoucherArticleActus = (id: number, message: string) => appeler<{ ok: true }>("POST", `/actus/${id}/retoucher`, { corps: { message } });
export const refuserArticleActus = (id: number, refus: RefusActus) => appeler<{ ok: true }>("POST", `/actus/${id}/refuser`, { corps: refus });
export const publierReponseActus = (id: number) => appeler<{ ok: true }>("POST", `/actus/reponses/${id}/publier`);
export const refuserReponseActus = (id: number, refus: RefusActus) => appeler<{ ok: true }>("POST", `/actus/reponses/${id}/refuser`, { corps: refus });
