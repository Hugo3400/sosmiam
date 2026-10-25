import { calculerDistanceMetres } from "../../../../packages/commun/src/fonctions/geo/calculer-distance-metres.ts";
import { ecrireAdresseImageLieu } from "../../../../packages/commun/src/fonctions/lieux/ecrire-adresse-image-lieu.ts";
import type { LieuApi, PositionLieu } from "../../../../packages/commun/src/types/lieu.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { choisirLieuxAccueil } from "../fonctions/lieux/choisir-lieux-accueil.ts";
import type { FiltresListeLieux } from "../fonctions/lieux/lire-filtres-liste-lieux.ts";
import type { FichePublique, LieuPublic } from "./lieux-publics.ts";

export const LIEUX_PAR_PAGE = 24;
export const EPINGLES_MAX = 3000;
export const LIEUX_AUTOUR = 4;
const ECART_AUTOUR_DEGRES = 0.03;

export type LieuListe = LieuPublic & { verifie: boolean; sos: { places: number } | null };
export type PageLieux = { lieux: LieuListe[]; total: number; page: number; pages: number };
export type VilleLieux = { ville: string; nombre: number };
export type EpingleLieu = { id: number; nom: string; type: string; latitude: number; longitude: number; sos: boolean };
export type FicheSite = FichePublique & {
  position: PositionLieu | null;
  sos: LieuApi["sos"] | null;
  ouverture: LieuApi["ouverture"];
  etiquettes: string[];
  autour: LieuListe[];
  reservable: boolean;
};

export type ServicesLieuxSite = {
  listerPage: (filtres: FiltresListeLieux, maintenant: Date) => Promise<PageLieux>;
  listerVilles: () => Promise<VilleLieux[]>;
  listerEpingles: (filtres: Pick<FiltresListeLieux, "ville" | "type">, maintenant: Date) => Promise<EpingleLieu[]>;
  choisirAccueil: (maintenant: Date) => Promise<LieuListe[]>;
  lireFiche: (id: number, maintenant: Date) => Promise<FicheSite | null>;
};

const CHAMPS_PUBLICS = { id: true, nom: true, type: true, emoji: true, info: true, quartier: true, ville: true, prix: true, couleurs: true, decouvertPar: true, logo: true } as const;

const sosEnCours = (maintenant: Date) => ({ arreteLe: null, jusqua: { gt: maintenant } });

const champsListe = (maintenant: Date) => ({
  ...CHAMPS_PUBLICS,
  sos: { where: sosEnCours(maintenant), orderBy: { creeLe: "desc" as const }, take: 1, select: { places: true } },
  _count: { select: { rattachements: { where: { statut: "valide" } } } },
});

type LigneListe = Omit<LieuPublic, "logo"> & { logo: string | null; sos: { places: number }[]; _count: { rattachements: number } };

const versLieuListe = ({ sos, _count, logo, ...lieu }: LigneListe): LieuListe => {
  const verifie = _count.rattachements > 0;
  return { ...lieu, logo: verifie ? ecrireAdresseImageLieu(logo) : null, verifie, sos: verifie && sos[0] ? { places: sos[0].places } : null };
};

const filtreRecherche = ({ ville, type, recherche }: Pick<FiltresListeLieux, "ville" | "type" | "recherche">) => ({
  statut: "publie",
  ...(ville ? { ville: { equals: ville, mode: "insensitive" as const } } : {}),
  ...(type ? { type } : {}),
  ...(recherche
    ? {
        OR: [
          { nom: { contains: recherche, mode: "insensitive" as const } },
          { quartier: { contains: recherche, mode: "insensitive" as const } },
          { info: { contains: recherche, mode: "insensitive" as const } },
          { plat: { contains: recherche, mode: "insensitive" as const } },
        ],
      }
    : {}),
});

const filtreEnSos = (maintenant: Date) => ({ sos: { some: sosEnCours(maintenant) }, rattachements: { some: { statut: "valide" } } });

async function lireDansLOrdre(ids: readonly number[], maintenant: Date): Promise<LieuListe[]> {
  if (ids.length === 0) return [];
  const lignes = await baseDeDonnees.lieu.findMany({ where: { id: { in: [...ids] }, statut: "publie" }, select: champsListe(maintenant) });
  const parId = new Map(lignes.map((ligne) => [ligne.id, versLieuListe(ligne as LigneListe)]));
  return ids.flatMap((id) => parId.get(id) ?? []);
}

const jourAParis = (maintenant: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(maintenant);

export function creerLieuxSite(dependances: {
  lireFichePublique: (id: number) => Promise<FichePublique | null>;
  lireLieuApp: (id: number, maintenant: Date) => Promise<LieuApi | null>;
}): ServicesLieuxSite {
  async function listerAutour(id: number, position: PositionLieu, maintenant: Date): Promise<LieuListe[]> {
    const proches = await baseDeDonnees.lieu.findMany({
      where: {
        statut: "publie",
        id: { not: id },
        latitude: { gte: position.latitude - ECART_AUTOUR_DEGRES, lte: position.latitude + ECART_AUTOUR_DEGRES },
        longitude: { gte: position.longitude - ECART_AUTOUR_DEGRES * 1.5, lte: position.longitude + ECART_AUTOUR_DEGRES * 1.5 },
      },
      select: { id: true, latitude: true, longitude: true },
      take: 300,
    });
    const ids = proches
      .flatMap(({ id: autre, latitude, longitude }) => (latitude === null || longitude === null ? [] : [{ id: autre, metres: calculerDistanceMetres(position, { latitude, longitude }) }]))
      .sort((a, b) => a.metres - b.metres || a.id - b.id)
      .slice(0, LIEUX_AUTOUR)
      .map(({ id: autre }) => autre);
    return lireDansLOrdre(ids, maintenant);
  }

  return {
    async listerPage(filtres, maintenant) {
      const ou = filtreRecherche(filtres);
      const [total, enSos] = await Promise.all([
        baseDeDonnees.lieu.count({ where: ou }),
        baseDeDonnees.lieu.findMany({ where: { AND: [ou, filtreEnSos(maintenant)] }, select: { id: true }, orderBy: { nom: "asc" }, take: 500 }),
      ]);
      const pages = Math.max(1, Math.ceil(total / LIEUX_PAR_PAGE));
      const page = Math.min(filtres.page, pages);
      const debut = (page - 1) * LIEUX_PAR_PAGE;
      const idsSos = enSos.map(({ id }) => id);
      const dejaSos = idsSos.slice(debut, debut + LIEUX_PAR_PAGE);
      const reste = LIEUX_PAR_PAGE - dejaSos.length;
      const autres = reste > 0
        ? await baseDeDonnees.lieu.findMany({
            where: { AND: [ou, { id: { notIn: idsSos } }] },
            select: { id: true },
            orderBy: [{ rattachements: { _count: "desc" } }, { nom: "asc" }, { id: "asc" }],
            skip: Math.max(0, debut - idsSos.length),
            take: reste,
          })
        : [];
      const lieux = await lireDansLOrdre([...dejaSos, ...autres.map(({ id }) => id)], maintenant);
      return { lieux, total, page, pages };
    },

    async listerVilles() {
      const groupes = await baseDeDonnees.lieu.groupBy({ by: ["ville"], where: { statut: "publie" }, _count: { _all: true } });
      return groupes
        .filter(({ ville }) => ville.trim() !== "")
        .map(({ ville, _count }) => ({ ville, nombre: _count._all }))
        .sort((a, b) => b.nombre - a.nombre || a.ville.localeCompare(b.ville, "fr"));
    },

    async listerEpingles({ ville, type }, maintenant) {
      const lignes = await baseDeDonnees.lieu.findMany({
        where: { ...filtreRecherche({ ville, type, recherche: null }), latitude: { not: null }, longitude: { not: null } },
        select: {
          id: true, nom: true, type: true, latitude: true, longitude: true,
          sos: { where: sosEnCours(maintenant), take: 1, select: { places: true } },
          _count: { select: { rattachements: { where: { statut: "valide" } } } },
        },
        orderBy: { id: "asc" },
        take: EPINGLES_MAX,
      });
      return lignes.flatMap(({ latitude, longitude, sos, _count, ...lieu }) =>
        latitude === null || longitude === null ? [] : [{ ...lieu, latitude, longitude, sos: _count.rattachements > 0 && sos.length > 0 }]);
    },

    async choisirAccueil(maintenant) {
      const [candidats, enSos] = await Promise.all([
        baseDeDonnees.lieu.findMany({ where: { statut: "publie" }, select: { id: true, type: true, ville: true }, orderBy: { id: "asc" } }),
        baseDeDonnees.lieu.findMany({ where: { statut: "publie", ...filtreEnSos(maintenant) }, select: { id: true }, orderBy: { id: "asc" } }),
      ]);
      return lireDansLOrdre(choisirLieuxAccueil(candidats, enSos.map(({ id }) => id), jourAParis(maintenant)), maintenant);
    },

    async lireFiche(id, maintenant) {
      const [fiche, lieuApp] = await Promise.all([dependances.lireFichePublique(id), dependances.lireLieuApp(id, maintenant)]);
      if (!fiche) return null;
      const position = lieuApp?.position ?? null;
      return {
        ...fiche,
        position,
        sos: lieuApp?.sos ?? null,
        ouverture: lieuApp?.ouverture ?? [],
        etiquettes: lieuApp?.tags ?? [],
        reservable: lieuApp?.reservable ?? false,
        autour: position ? await listerAutour(id, position, maintenant) : [],
      };
    },
  };
}
