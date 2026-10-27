import type { ChampArticleActus } from "../../../../packages/commun/src/types/actus.ts";
import type { ErreurService } from "../../../../packages/commun/src/types/erreurs-service.ts";
import type { Prisma } from "../base-de-donnees/client-genere/client.ts";

export const DOSSIER_PHOTOS_ACTUS = process.env.DOSSIER_PHOTOS_ACTUS || "/var/lib/sos-miam/photos-actus";
export const DELAI_UTILISATION_PHOTO_ACTUS_MS = 24 * 3600_000;
export const DELAI_MENAGE_PHOTO_ACTUS_MS = 25 * 3600_000;
export const PHOTOS_ACTUS_PAR_PASSAGE_DE_MENAGE = 200;
export const REPONSE_ACTUS_MIN = 2;

export type ErreurActusService = Extract<
  ErreurService,
  "article-invalide" | "limite-actus-semaine" | "photo-actus-introuvable" | "introuvable" | "lieu-inconnu" | "role-requis" | "membre-du-lieu" | "message-refuse" | "reponse-deja-donnee" | "transition-interdite"
>;

export type EchecActus = { ok: false; erreur: ErreurActusService; champs?: ChampArticleActus[] };

export const echecActus = (erreur: ErreurActusService, champs?: ChampArticleActus[]): EchecActus => ({ ok: false, erreur, ...(champs ? { champs } : {}) });

export const SELECTION_ARTICLE_ACTUS = {
  id: true,
  rubrique: true,
  titre: true,
  accroche: true,
  texte: true,
  citation: true,
  couverture: true,
  photos: true,
  collaboration: true,
  alcool: true,
  finLe: true,
  publieLe: true,
  aLaUne: true,
  auteur: { select: { prenom: true, avatar: true, ambassadeur: { select: { statut: true } } } },
  lieux: {
    orderBy: { rang: "asc" },
    select: {
      lieu: {
        select: {
          id: true, nom: true, type: true, emoji: true, quartier: true, ville: true, statut: true,
          _count: { select: { rattachements: { where: { statut: "valide" } } } },
        },
      },
    },
  },
  reponses: { where: { statut: "publie" }, orderBy: { id: "asc" }, select: { lieuId: true, texte: true, decideLe: true, lieu: { select: { nom: true } } } },
  _count: { select: { commentaires: { where: { supprimeLe: null, retireLe: null } } } },
} satisfies Prisma.ArticleActusSelect;

export type LigneArticleActus = Prisma.ArticleActusGetPayload<{ select: typeof SELECTION_ARTICLE_ACTUS }>;
