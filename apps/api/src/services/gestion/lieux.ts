// Fiches des lieux, saisies dans le logiciel de gestion.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";
import { listerManquesLieu } from "../../fonctions/lieux/lister-manques-lieu.ts";
import { supprimerFichiersMedias } from "./medias.ts";

/** Ce que le logiciel envoie pour créer ou modifier une fiche (déjà vérifié par le contrôleur) */
export type LieuSaisi = Omit<Prisma.LieuCreateInput, "publications" | "creeLe" | "modifieLe">;

/**
 * Les fiches pour la liste du logiciel : de quoi afficher la carte (et la carte géographique), et ce qui manque à
 * chacune pour être complète (contrôle qualité avant la mise en ligne). Le texte et les infos pratiques ne repartent pas.
 */
export async function listerLieux({ recherche, statut }: { recherche: string; statut: string }) {
  const lieux = await baseDeDonnees.lieu.findMany({
    where: {
      ...(statut ? { statut } : {}),
      ...(recherche
        ? { OR: ["nom", "ville", "quartier", "info"].map((champ) => ({ [champ]: { contains: recherche, mode: "insensitive" } })) }
        : {}),
    },
    orderBy: [{ modifieLe: "desc" }],
    select: {
      id: true, nom: true, type: true, emoji: true, info: true, quartier: true, ville: true, statut: true, couleurs: true, modifieLe: true,
      adresse: true, latitude: true, longitude: true,
      texte: true, horaires: true, ouverture: true, plat: true, telephone: true, siteWeb: true, instagram: true,
      animaux: true, accessible: true, terrasse: true, wifi: true, enfants: true, parking: true, paiements: true, reservation: true,
      _count: { select: { publications: true } },
      rattachements: { where: { statut: "valide" }, select: { id: true }, take: 1 },
    },
  });
  return lieux.map((lieu) => ({
    id: lieu.id, nom: lieu.nom, type: lieu.type, emoji: lieu.emoji, info: lieu.info, quartier: lieu.quartier, ville: lieu.ville,
    statut: lieu.statut, couleurs: lieu.couleurs, modifieLe: lieu.modifieLe, adresse: lieu.adresse, latitude: lieu.latitude,
    longitude: lieu.longitude, _count: lieu._count, manques: listerManquesLieu(lieu), verifie: lieu.rattachements.length > 0,
  }));
}

export const lireLieu = (id: number) => baseDeDonnees.lieu.findUnique({ where: { id } });
export const creerLieu = (saisie: LieuSaisi) => baseDeDonnees.lieu.create({ data: saisie });
export const modifierLieu = (id: number, saisie: LieuSaisi) => baseDeDonnees.lieu.update({ where: { id }, data: saisie }).catch(() => null);

/** Ce qu'on peut changer d'un coup sur plusieurs fiches */
export type ModificationLot = Partial<Pick<LieuSaisi, "statut" | "ville" | "quartier" | "type" | "prix" | "reservable">>;

/** Applique la même modification à plusieurs fiches. Rend le nombre de fiches modifiées. */
export async function modifierLieuxEnLot(ids: number[], modification: ModificationLot): Promise<number> {
  const { count } = await baseDeDonnees.lieu.updateMany({ where: { id: { in: ids } }, data: modification });
  return count;
}

/** Supprime plusieurs fiches (avec leurs publications et leurs fichiers). Rend le nombre de fiches supprimées. */
export async function supprimerLieuxEnLot(ids: number[]): Promise<number> {
  let supprimes = 0;
  for (const id of ids) if (await supprimerLieu(id)) supprimes++;
  return supprimes;
}

/** Supprime une fiche, ses publications et leurs fichiers. Faux si elle n'existe pas. */
export async function supprimerLieu(id: number): Promise<{ nom: string } | null> {
  const lieu = await baseDeDonnees.lieu.findUnique({
    where: { id },
    select: { nom: true, publications: { select: { medias: { select: { fichier: true } } } } },
  });
  if (!lieu) return null;
  await baseDeDonnees.lieu.delete({ where: { id } });
  await supprimerFichiersMedias(lieu.publications.flatMap((publication) => publication.medias.map((media) => media.fichier)));
  return { nom: lieu.nom };
}
