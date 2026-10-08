// Fiches des lieux, saisies dans le logiciel de gestion.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import type { Prisma } from "../../base-de-donnees/client-genere/client.ts";
import { supprimerFichiersMedias } from "./medias.ts";

/** Ce que le logiciel envoie pour créer ou modifier une fiche (déjà vérifié par le contrôleur) */
export type LieuSaisi = Omit<Prisma.LieuCreateInput, "publications" | "creeLe" | "modifieLe">;

export async function listerLieux({ recherche, statut }: { recherche: string; statut: string }) {
  return baseDeDonnees.lieu.findMany({
    where: {
      ...(statut ? { statut } : {}),
      ...(recherche
        ? { OR: ["nom", "ville", "quartier", "info"].map((champ) => ({ [champ]: { contains: recherche, mode: "insensitive" } })) }
        : {}),
    },
    orderBy: [{ modifieLe: "desc" }],
    select: {
      id: true, nom: true, type: true, emoji: true, info: true, quartier: true, ville: true, statut: true, couleurs: true, modifieLe: true,
      _count: { select: { publications: true } },
    },
  });
}

export const lireLieu = (id: number) => baseDeDonnees.lieu.findUnique({ where: { id } });
export const creerLieu = (saisie: LieuSaisi) => baseDeDonnees.lieu.create({ data: saisie });
export const modifierLieu = (id: number, saisie: LieuSaisi) => baseDeDonnees.lieu.update({ where: { id }, data: saisie }).catch(() => null);

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
