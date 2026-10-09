// Les lieux lus par l'app, dans la base : seulement les lieux publiés, jamais la note interne ni le statut.
import type { CarteLieu } from "../../../../packages/commun/src/types/carte.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { presenterLieuApp, type LigneLieuApp } from "../fonctions/lieux/presenter-lieu-app.ts";
import { presenterCarte } from "../fonctions/pro/presenter-carte.ts";
import { LIEUX_PAR_LECTURE, type ServicesLieuxApp, type ZoneLieux } from "./lieux-app-regles.ts";

const CHAMPS = {
  id: true, nom: true, type: true, emoji: true, info: true, texte: true, quartier: true, ville: true, latitude: true, longitude: true,
  prix: true, prixMoyen: true, couleurs: true, horaires: true, ouverture: true, plat: true, tags: true, envies: true, reservable: true,
  telephone: true, siteWeb: true, instagram: true, animaux: true, accessible: true, terrasse: true, wifi: true, enfants: true,
  parking: true, paiements: true, reservation: true, decouvertPar: true, alerte: true, alerteJusqua: true, publieLe: true,
  _count: { select: { rattachements: { where: { statut: "valide" } }, rescousses: true } },
} as const;

/** Les champs lus, avec le SOS du soir encore en cours (le plus récent) */
const champs = (maintenant: Date) => ({
  ...CHAMPS,
  sos: { where: { arreteLe: null, jusqua: { gt: maintenant } }, orderBy: { creeLe: "desc" as const }, take: 1, select: { places: true, jusqua: true, offre: true } },
});

type LigneLue = Omit<LigneLieuApp, "rattachementsValides" | "rescousses" | "sos"> & {
  _count: { rattachements: number; rescousses: number };
  sos: { places: number; jusqua: Date; offre: string | null }[];
};
const versLigne = ({ _count, sos, ...l }: LigneLue): LigneLieuApp => ({
  ...l,
  rattachementsValides: _count.rattachements,
  rescousses: _count.rescousses,
  sos: sos[0] ?? null,
});

export function creerLieuxApp(): ServicesLieuxApp {
  return {
    async listerLieux(zone: ZoneLieux | null, maintenant: Date) {
      const lignes = await baseDeDonnees.lieu.findMany({
        where: {
          statut: "publie",
          ...(zone ? { latitude: { gte: zone.sud, lte: zone.nord }, longitude: { gte: zone.ouest, lte: zone.est } } : {}),
        },
        select: champs(maintenant),
        orderBy: { id: "asc" },
        take: LIEUX_PAR_LECTURE,
      });
      return lignes.map((l) => presenterLieuApp(versLigne(l as LigneLue), maintenant));
    },

    async lireLieu(id: number, maintenant: Date) {
      const ligne = await baseDeDonnees.lieu.findFirst({ where: { id, statut: "publie" }, select: champs(maintenant) });
      return ligne ? presenterLieuApp(versLigne(ligne as LigneLue), maintenant) : null;
    },

    async lireCarte(id: number) {
      const ligne = await baseDeDonnees.lieu.findFirst({ where: { id, statut: "publie" }, select: { carte: true, carteMajLe: true } });
      if (!ligne) return null;
      return presenterCarte((ligne.carte ?? null) as Omit<CarteLieu, "majLe"> | null, ligne.carteMajLe);
    },

    async trouverParCode(codePublic: string) {
      const lieu = await baseDeDonnees.lieu.findFirst({ where: { statut: "publie", validation: { codePublic } }, select: { id: true } });
      return lieu?.id ?? null;
    },
  };
}
